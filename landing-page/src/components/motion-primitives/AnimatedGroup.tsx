import React, { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, subscribeReducedMotion } from "../../lib/modernWeb";

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
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    setReduceMotion(reduced);
    const unsubReduce = subscribeReducedMotion((matches) => {
      setReduceMotion(matches);
      if (matches) setVisible(true);
    });

    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return unsubReduce;
    }
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
    return () => {
      obs.disconnect();
      unsubReduce();
    };
  }, []);

  const items = React.Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, idx) => (
        <div
          key={idx}
          className="h-full transition-all duration-700 ease-out"
          style={{
            transitionDelay: reduceMotion ? "0ms" : `${idx * staggerMs}ms`,
            transitionDuration: reduceMotion ? "150ms" : undefined,
            opacity: visible ? 1 : 0,
            transform: reduceMotion || visible ? "translateY(0px) scale(1)" : "translateY(20px) scale(0.98)",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
