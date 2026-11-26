import React from "react";

interface AuroraProps {
  className?: string;
}

export default function Aurora({ className = "" }: AuroraProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="absolute -top-44 left-1/2 h-[540px] w-[920px] -translate-x-1/2 rounded-full opacity-22 blur-[140px]"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, #ff7a2f 0%, #c2410c 42%, #2a1810 78%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,244,232,0.85) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
