"use client";

import { useEffect, useRef, useState } from "react";
import { frameLoader } from "../lib/imageLoader";
import { calculateFrameIndex } from "../lib/scrollEngine";

export default function ScrollCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const scrollY = useRef(0);
  const frameId = useRef<number>(0);
  const TOTAL_FRAMES = 240;

  useEffect(() => {
    // 1) Initialize preloading
    frameLoader.preloadInitial(20).then(() => {
      setLoaded(true);
      // Kick off background loading for the rest
      frameLoader.preloadRest(21);
      
      // Draw frame 1
      drawFrame(1);
    });

    // 2) Scroll listener updates ref strictly without triggering React render
    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 3) Animation loop runs independently of React rendering to draw the canvas
    const drawLoop = () => {
      const index = calculateFrameIndex(
        scrollY.current,
        document.body.scrollHeight,
        window.innerHeight,
        TOTAL_FRAMES
      );
      
      drawFrame(index);
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

    const img = frameLoader.getImage(index);
    if (!img) return;

    const canvas = canvasRef.current;
    
    // Maintain aspect ratio while filling canvas
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio);
    
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;

    // Fill background with exact color to match frame edges
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
    );
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
      width: '100%',
      height: '100vh',
      zIndex: -10,
      backgroundColor: '#050505'
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
          transition: "opacity 1s ease-in-out"
        }}
      />
    </div>
  );
}
