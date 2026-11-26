import React from "react";

interface BorderTrailProps {
  className?: string;
}

export function BorderTrail({ className = "" }: BorderTrailProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-[inherit] [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
    >
      <div
        className="absolute aspect-square w-32 animate-[border-trail_6s_linear_infinite] bg-gradient-to-l from-[#ff7a2f] via-[#ffb07a] to-transparent opacity-80"
        style={{
          offsetPath: "rect(0 auto auto 0 round 24px)",
        }}
      />
      <style>{`
        @keyframes border-trail {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
      `}</style>
    </div>
  );
}
