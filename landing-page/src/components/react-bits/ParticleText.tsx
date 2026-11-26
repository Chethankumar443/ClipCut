import React, { useEffect, useRef } from "react";

interface ParticleTextProps {
  text?: string;
  particleSize?: number;
  density?: number;
  maxFontSize?: number;
  fitWidth?: boolean;
  color?: string;
  highlightColor?: string;
  scatter?: number;
  gatherDuration?: number;
  repelRadius?: number;
  pointerRepel?: number;
  idleDrift?: number;
  className?: string;
}

interface Particle {
  tx: number;
  ty: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  delay: number;
  phase: number;
}

export default function ParticleText({
  text = "ClipCut",
  particleSize = 2,
  density = 4,
  maxFontSize = 92,
  fitWidth = false,
  color = "#ffffff",
  highlightColor = "#ff7a2f",
  scatter = 120,
  gatherDuration = 1200,
  repelRadius = 110,
  pointerRepel = 36,
  idleDrift = 0.55,
  className = "",
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    const startTime = performance.now();

    const buildParticles = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 96);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement("canvas");
      off.width = Math.floor(width);
      off.height = Math.floor(height);
      const octx = off.getContext("2d");
      if (!octx) return;

      let fontSize = fitWidth
        ? Math.min(off.height * 0.94, maxFontSize)
        : Math.min(Math.max(width * 0.19, 44), maxFontSize, height * 0.86);
      octx.clearRect(0, 0, off.width, off.height);
      octx.fillStyle = "#ffffff";
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.font = `800 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      if (fitWidth) {
        const measured = octx.measureText(text).width;
        if (measured > 0) {
          fontSize = Math.min(fontSize, Math.floor((off.width * 0.94) * (fontSize / measured)));
          octx.font = `800 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        }
      }
      octx.fillText(text, off.width / 2, fitWidth ? off.height * 0.54 : off.height / 2);

      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const next: Particle[] = [];
      const step = Math.max(2, density);

      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const alpha = data[(y * off.width + x) * 4 + 3];
          if (alpha > 128) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (0.4 + Math.random() * 0.6) * scatter;
            next.push({
              tx: x,
              ty: y,
              x: x + Math.cos(angle) * dist,
              y: y + Math.sin(angle) * dist,
              vx: 0,
              vy: 0,
              delay: Math.random() * 320,
              phase: Math.random() * Math.PI * 2,
            });
          }
        }
      }
      particles = next;
    };

    buildParticles();
    window.addEventListener("resize", buildParticles);

    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      const elapsed = now - startTime;
      const ptr = pointerRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const t = Math.max(0, Math.min(1, (elapsed - p.delay) / gatherDuration));
        const ease = 1 - Math.pow(1 - t, 3);

        const driftX = Math.sin(now * 0.0018 + p.phase) * idleDrift;
        const driftY = Math.cos(now * 0.0015 + p.phase) * idleDrift;
        const targetX = p.tx + driftX;
        const targetY = p.ty + driftY;

        if (t < 1) {
          p.x = p.x + (targetX - p.x) * (0.08 + ease * 0.14);
          p.y = p.y + (targetY - p.y) * (0.08 + ease * 0.14);
        } else {
          p.vx += (targetX - p.x) * 0.12;
          p.vy += (targetY - p.y) * 0.12;

          if (ptr.active) {
            const dx = p.x - ptr.x;
            const dy = p.y - ptr.y;
            const d = Math.hypot(dx, dy);
            if (d < repelRadius && d > 0.01) {
              const force = ((repelRadius - d) / repelRadius) * (pointerRepel * 0.16);
              p.vx += (dx / d) * force;
              p.vy += (dy / d) * force;
            }
          }

          p.vx *= 0.8;
          p.vy *= 0.8;
          p.x += p.vx;
          p.y += p.vy;
        }

        const speed = Math.hypot(p.x - targetX, p.y - targetY);
        ctx.fillStyle = speed > 2.4 ? highlightColor : color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", buildParticles);
    };
  }, [text, particleSize, density, color, highlightColor, scatter, gatherDuration, repelRadius, pointerRepel, idleDrift]);

  const handleClick = () => {
    pointerRef.current.active = true;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, active: true };
      }}
      onPointerLeave={() => {
        pointerRef.current.active = false;
      }}
      onClick={handleClick}
      aria-label={text}
      className={`block h-28 w-full cursor-crosshair select-none sm:h-32 ${className}`}
    />
  );
}
