import React, { useRef, useState } from "react";

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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (
      Math.abs(e.clientX - cx) < r.width / 2 + padding &&
      Math.abs(e.clientY - cy) < r.height / 2 + padding
    ) {
      setActive(true);
      setOffset({
        x: (e.clientX - cx) / magnetStrength,
        y: (e.clientY - cy) / magnetStrength,
      });
    }
  };

  const onMouseLeave = () => {
    setActive(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`inline-block ${className}`}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: active
          ? "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
          : "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
