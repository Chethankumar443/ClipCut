import React, { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, subscribeReducedMotion } from "../../lib/modernWeb";

interface InViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function InView({ children, className = "", delay = 0 }: InViewProps) {
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
      { threshold: 0.02, rootMargin: "0px 0px -20px 0px" }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      unsubReduce();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        transitionDelay: reduceMotion ? "0ms" : `${delay}ms`,
        transitionDuration: reduceMotion ? "150ms" : undefined,
        opacity: visible ? 1 : 0,
        filter: reduceMotion || visible ? "blur(0px)" : "blur(6px)",
        transform: reduceMotion || visible ? "translateY(0px)" : "translateY(22px)",
      }}
    >
      {children}
    </div>
  );
}
