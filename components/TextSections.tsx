"use client";

import React, { useEffect, useRef, useState } from "react";

function FadeInUp({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      // Triggers when 30% of the element is visible
      if (entry.isIntersecting) {
        setIsVisible(true);
      } else {
        // Fade out slightly early to keep focus on the headphone sequence
        setIsVisible(false);
      }
    }, { threshold: 0.3, rootMargin: "0px 0px -10% 0px" });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`story-copy-block ${className}`}
      style={{
        transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
      }}
    >
      {children}
    </div>
  );
}

export function HeroText() {
  return (
    <div className="story-section pb-20 center-content">
      <FadeInUp>
        <h1 className="hero-title text-gradient">BEOPLAY-H100</h1>
        <h2 className="hero-subtitle mb-6">Silence, perfected.</h2>
        <p className="story-body center-text">
          Flagship wireless noise cancelling re-engineered for a world that never stops.
        </p>
      </FadeInUp>
    </div>
  );
}

export function EngineeringSection() {
  return (
    <div className="story-section pt-20 flex-end text-right" id="technology">
      <FadeInUp>
        <h2 className="story-headline">Precision-engineered for silence.</h2>
        <p className="story-body">
          Custom drivers and sealed acoustic chambers deliver studio-grade clarity.
        </p>
        <p className="story-body">
          Every component tuned for balance power and comfort.
        </p>
      </FadeInUp>
    </div>
  );
}

export function NoiseSection() {
  return (
    <div className="story-section pt-40 flex-start text-left" id="noise-cancelling">
      <FadeInUp>
        <h2 className="story-headline">Adaptive noise cancelling redefined.</h2>
        <p className="story-body">
          Multi-microphone array listens in every direction.
        </p>
        <p className="story-body">
          Real-time noise analysis adapts to your environment.
        </p>
        <p className="story-body">
          Your music stays pure — planes trains and crowds fade away.
        </p>
      </FadeInUp>
    </div>
  );
}

export function SoundSection() {
  return (
    <div className="story-section pt-40 flex-end text-right">
      <FadeInUp>
        <h2 className="story-headline">Immersive lifelike sound.</h2>
        <p className="story-body">
          High-performance drivers unlock depth detail and texture.
        </p>
        <p className="story-body">
          AI-enhanced upscaling restores clarity to compressed audio.
        </p>
      </FadeInUp>
    </div>
  );
}

export function CTASection() {
  return (
    <div className="story-section center-content text-center" id="buy">
      <FadeInUp className="blur-card">
        <h2 className="story-headline mb-4">Hear everything.<br/>Feel nothing else.</h2>
        <p className="story-body mb-8">
          BEOPLAY-H100<br/>Designed for focus crafted for comfort.
        </p>
        <div className="button-group">
          <a href="#buy" className="btn-primary">Experience BEOPLAY-H100</a>
          <a href="#specs" className="btn-secondary">See full specs</a>
        </div>
      </FadeInUp>
    </div>
  );
}
