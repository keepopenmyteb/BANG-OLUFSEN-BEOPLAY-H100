"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const scrollY = useRef(0);
  const frameId = useRef<number>(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastFrameDrawn = useRef(-1);
  const TOTAL_FRAMES = 240;

  useEffect(() => {
    // 1) Preload Image Sequence inline
    let loadedCount = 0;
    const preloadImages = () => {
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        const paddedIndex = i.toString().padStart(3, "0");
        
        // Attach handlers BEFORE setting src to prevent cached image race conditions
        img.onload = () => {
          loadedCount++;
          if (i === 1) {
            // Force initial render immediately once the first frame loads 
            drawFrame(1);
            setLoaded(true); // Guarantee it becomes visible!
          }
          if (loadedCount === TOTAL_FRAMES) {
             console.log("Total images preloaded:", imagesRef.current.length);
          }
        };
        
        img.onerror = () => {
           console.error("Failed to load image:", paddedIndex);
           loadedCount++; // prevent hanging
        };

        // Set src last explicitly targeting the new high-efficiency webp sequence
        img.src = `/frames/ezgif-frame-${paddedIndex}.webp`;
        imagesRef.current.push(img);
      }
    };
    preloadImages();

    // 2) Scroll listener
    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 3) Animation loop
    const drawLoop = () => {
      if (document.body.scrollHeight) {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        let p = maxScroll > 0 ? scrollY.current / maxScroll : 0;
        p = Math.max(0, Math.min(1, p)); // Clamp progress 0.0 - 1.0
        
        // Match user's specific requested interpolation logic
        const frameIndex = Math.floor(p * 239) + 1;
        
        // Dirty-check optimization: only trigger redraw if the index actually changes
        if (frameIndex !== lastFrameDrawn.current) {
          drawFrame(frameIndex);
          lastFrameDrawn.current = frameIndex;
        }
      }
      
      frameId.current = requestAnimationFrame(drawLoop);
    };
    
    // Start loop
    frameId.current = requestAnimationFrame(drawLoop);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, []);

  const drawFrame = (index: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d", { alpha: false });
    if (!ctx) return;

    // The array is 0-indexed, but our frames are 1-240
    const img = imagesRef.current[index - 1];
    
    // Ensure image is actually loaded natively before drawing
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvas = canvasRef.current;
    
    // Verify canvas sizing is valid before drawing, sometimes refs fire before the resize observer layout
    if (canvas.width === 0 || canvas.height === 0 || canvas.width === 300) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    }
    // Calculate scale by taking the minimum of window.innerWidth / img.width and window.innerHeight / img.height
    const scale = Math.min(window.innerWidth / img.width, window.innerHeight / img.height);
    
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    
    // Ensure the image is drawn exactly in the center of the canvas
    const x = (window.innerWidth - drawWidth) / 2;
    const y = (window.innerHeight - drawHeight) / 2;

    // Fill background with exact color to prevent any seams
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  };

  // Handle Resize setup
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // High DPI canvas setup for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
        
        // CSS dimensions
        canvasRef.current.style.width = `${window.innerWidth}px`;
        canvasRef.current.style.height = `${window.innerHeight}px`;
        
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
        
        // Redraw initial state on resize manually to avoid flashing
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        let p = maxScroll > 0 ? scrollY.current / maxScroll : 0;
        p = Math.max(0, Math.min(1, p));
        const frameIndex = Math.floor(p * 239) + 1;
        drawFrame(frameIndex);
      }
    };
    
    handleResize(); // Initial setup
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      backgroundColor: '#000000'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: loaded ? 1 : 0,
          transition: "opacity 1s ease-in-out",
          willChange: "transform",
          transform: "translateZ(0)"
        }}
      />
      {/* Subtle Noise Overlay to mask banding */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0.04,
          zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
