import React, { useEffect, useRef, useState } from "react";

interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
}

export function AnimatedGroup({
  children,
  className = "",
  staggerMs = 90,
}: AnimatedGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const items = React.Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, idx) => (
        <div
          key={idx}
          className="h-full transition-all duration-700 ease-out"
          style={{
            transitionDelay: `${idx * staggerMs}ms`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px) scale(1)" : "translateY(20px) scale(0.98)",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
