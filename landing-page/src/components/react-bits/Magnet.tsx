import React, { useEffect, useRef } from "react";
import { prefersReducedMotion, subscribeReducedMotion } from "../../lib/modernWeb";

interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  magnetStrength?: number;
  className?: string;
}

export default function Magnet({
  children,
  padding = 40,
  magnetStrength = 4,
  className = "",
}: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const reduceRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    reduceRef.current = prefersReducedMotion();
    const invalidate = () => {
      rectRef.current = null;
    };
    const unsubReduce = subscribeReducedMotion((matches) => {
      reduceRef.current = matches;
      if (matches && ref.current) {
        ref.current.style.transform = "translate3d(0px, 0px, 0)";
      }
    });
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      unsubReduce();
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
    };
  }, []);

  const applyTransform = (x: number, y: number, active: boolean) => {
    const el = ref.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      el.style.transition = active
        ? "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
        : "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)";
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  };

  const onPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || reduceRef.current || !ref.current) return;
    rectRef.current = ref.current.getBoundingClientRect();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || reduceRef.current) return;
    const el = ref.current;
    if (!el) return;
    const r = rectRef.current ?? (rectRef.current = el.getBoundingClientRect());
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (
      Math.abs(e.clientX - cx) < r.width / 2 + padding &&
      Math.abs(e.clientY - cy) < r.height / 2 + padding
    ) {
      applyTransform((e.clientX - cx) / magnetStrength, (e.clientY - cy) / magnetStrength, true);
    }
  };

  const onPointerLeave = () => {
    rectRef.current = null;
    applyTransform(0, 0, false);
  };

  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`inline-block ${className}`}
      style={{
        transform: "translate3d(0px, 0px, 0)",
        transition: "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
