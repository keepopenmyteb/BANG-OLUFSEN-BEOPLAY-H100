"""
B&O BEOPLAY H100 — Fast Frame Processor (numpy-accelerated)
============================================================
  • Luma-based soft alpha mask   → rim light fades naturally
  • UnsharpMask texture boost    → leather / metal / copper detail
  • Global alpha floor           → temporal consistency, no flicker
  • WebP RGBA export, quality=95 → max fidelity for fullscreen
"""

import os
import sys
import time
import threading
import concurrent.futures
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

# ─── Config ───────────────────────────────────────────────────────────────────
INPUT_DIR   = Path("./public/frames")
OUTPUT_DIR  = Path("./public/frames_final")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TOTAL       = 129
NAMES       = [f"frame_{i:03d}.webp" for i in range(1, TOTAL + 1)]
ANCHORS     = [1, 17, 33, 49, 65, 81, 97, 113, 129]   # frames for floor mask

# Alpha mask
LUMA_BOOST  = 2.3     # lowered: more gradual fade, softer product edge
BLUR_R      = 5.0     # wide feathering → no hard boundary line visible
BLUR_R2     = 3.0     # second soften pass after boost (eliminate cutout look)
FLOOR_W     = 0.10    # global floor weight (keeps rim light consistent)

# Texture sharpening
USM_RADIUS  = 1.2
USM_PCT     = 160     # stronger for fullscreen HD clarity
USM_THRESH  = 2

# Color grading
CONTRAST    = 1.08
SATURATION  = 1.10

# Export
QUALITY     = 95
METHOD      = 6
WORKERS     = min(6, os.cpu_count() or 2)

# ─── Per-frame alpha computation (numpy fast) ─────────────────────────────────

def compute_alpha_np(rgb_arr: np.ndarray) -> np.ndarray:
    """BT.709 luma → boosted soft alpha (float32 → uint8)."""
    r = rgb_arr[:, :, 0].astype(np.float32)
    g = rgb_arr[:, :, 1].astype(np.float32)
    b = rgb_arr[:, :, 2].astype(np.float32)
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b  # [0, 255]
    alpha = np.clip(luma * LUMA_BOOST, 0, 255).astype(np.uint8)
    return alpha


def blur_alpha(alpha_arr: np.ndarray, img_size: tuple) -> np.ndarray:
    """
    Two-pass Gaussian blur for seamless edge blending:
      Pass 1 (pre-boost)  — wide radius spreads the mask boundary
      Pass 2 (post-boost) — second soften to remove any remaining hard edge
    """
    mask_img = Image.fromarray(alpha_arr, mode="L")
    # Pass 1: wide pre-blur — expands the fade zone
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=BLUR_R))
    arr = np.array(mask_img, dtype=np.float32)
    # Boost (same as compute_alpha but on blurred data)
    arr = np.clip(arr * LUMA_BOOST, 0, 255).astype(np.uint8)
    # Pass 2: post-boost soften — eliminates any remaining cutout edge
    mask_img2 = Image.fromarray(arr, mode="L")
    mask_img2 = mask_img2.filter(ImageFilter.GaussianBlur(radius=BLUR_R2))
    return np.array(mask_img2, dtype=np.uint8)


def build_global_floor() -> np.ndarray:
    """Average anchor-frame alpha masks → global temporal floor (numpy)."""
    print(f"  ⟳ Building global floor from {len(ANCHORS)} anchor frames …")
    accum = None
    count = 0
    for idx in ANCHORS:
        path = INPUT_DIR / f"frame_{idx:03d}.webp"
        if not path.exists():
            continue
        arr = np.array(Image.open(path).convert("RGB"), dtype=np.float32)
        alpha = compute_alpha_np(arr.astype(np.uint8))
        alpha = blur_alpha(alpha, (arr.shape[1], arr.shape[0]))
        if accum is None:
            accum = alpha.astype(np.float64)
        else:
            accum += alpha
        count += 1
    if count == 0:
        return np.zeros((1080, 1920), dtype=np.uint8)
    floor = (accum / count).astype(np.uint8)
    print(f"  ✓ Floor ready — mean alpha: {floor.mean():.1f}")
    return floor


def sharpen(img: Image.Image) -> Image.Image:
    img = img.filter(ImageFilter.UnsharpMask(
        radius=USM_RADIUS, percent=USM_PCT, threshold=USM_THRESH))
    img = ImageEnhance.Contrast(img).enhance(CONTRAST)
    img = ImageEnhance.Color(img).enhance(SATURATION)
    return img


def process_one(name: str, floor: np.ndarray) -> str:
    src = INPUT_DIR  / name
    dst = OUTPUT_DIR / name

    img_rgb   = Image.open(src).convert("RGB")
    img_sharp = sharpen(img_rgb)

    # Alpha from original (clean mask) — pass through 2-pass feathering
    rgb_arr = np.array(img_rgb, dtype=np.uint8)
    # compute_alpha gives raw luma; blur_alpha now does boost + 2-pass blur
    luma_arr = np.array(Image.fromarray(rgb_arr).convert("L"), dtype=np.uint8)
    alpha   = blur_alpha(luma_arr, img_rgb.size)

    # Temporal floor: alpha = max(alpha, floor * FLOOR_W)
    floor_scaled = np.clip((floor.astype(np.float32) * FLOOR_W), 0, 255).astype(np.uint8)
    alpha = np.maximum(alpha, floor_scaled)

    # Compose RGBA
    img_rgba = img_sharp.convert("RGBA")
    alpha_img = Image.fromarray(alpha, mode="L")
    img_rgba.putalpha(alpha_img)

    img_rgba.save(dst, format="WEBP", quality=QUALITY, method=METHOD, lossless=False)
    return name


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 62)
    print("  B&O BEOPLAY H100 — Batch Frame Processor")
    print(f"  Frames  : {TOTAL}   Quality : {QUALITY}   Workers : {WORKERS}")
    print(f"  Boost   : {LUMA_BOOST}   USM     : {USM_PCT}%")
    print("=" * 62)

    floor = build_global_floor()

    done  = [0]
    lock  = threading.Lock()
    t0    = time.time()
    errors = []

    def worker(name):
        try:
            process_one(name, floor)
            with lock:
                done[0] += 1
                n = done[0]
                elapsed = time.time() - t0
                fps = n / elapsed
                eta = (TOTAL - n) / fps if fps > 0 else 0
                print(f"  [{n:3d}/{TOTAL}]  {name}  "
                      f"| {elapsed:5.1f}s elapsed  ETA {eta:4.0f}s  "
                      f"({fps:.2f} fps)   ",
                      end="\r", flush=True)
        except Exception as e:
            with lock:
                errors.append((name, str(e)))
                print(f"\n  ✗ {name}: {e}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(worker, n) for n in NAMES]
        concurrent.futures.wait(futures)

    total = time.time() - t0
    print(f"\n\n{'=' * 62}")
    print(f"  Finished in {total:.1f}s  ({total/TOTAL:.2f}s / frame)")
    print(f"  Output → {OUTPUT_DIR.resolve()}")
    if errors:
        print(f"  ERRORS ({len(errors)}):")
        for n, e in errors:
            print(f"    {n}: {e}")
    else:
        print("  All 129 frames processed ✓")
    print("=" * 62)


if __name__ == "__main__":
    main()
