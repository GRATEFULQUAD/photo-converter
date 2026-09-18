"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 2300;

interface Particle {
  x: number;
  y: number;
  r: number;
  color: string;
  glow: number;
  alpha: number;
}

// Deterministic pseudo-random generator so the "static" field looks the
// same on every render/resize instead of re-rolling randomly each time.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NEON_COLORS = [
  "0, 255, 240", // cyan
  "255, 0, 230", // magenta
  "250, 255, 0", // yellow
  "255, 255, 255", // white
];

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, width, height);

      const rand = mulberry32(1337); // fixed seed -> static composition
      const particles: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: rand() * width,
          y: rand() * height,
          r: rand() * 1.4 + 0.25,
          color: NEON_COLORS[Math.floor(rand() * NEON_COLORS.length)],
          glow: rand() > 0.92 ? rand() * 6 + 3 : 0,
          alpha: rand() * 0.6 + 0.25,
        });
      }

      for (const p of particles) {
        ctx.beginPath();
        if (p.glow > 0) {
          ctx.shadowColor = `rgba(${p.color}, 0.9)`;
          ctx.shadowBlur = p.glow;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    render();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(render, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
