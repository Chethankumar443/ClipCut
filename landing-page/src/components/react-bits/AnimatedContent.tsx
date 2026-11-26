'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedContentProps {
  children: React.ReactNode;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  blur?: number;
  threshold?: number;
  delay?: number;
  stagger?: number;
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedContent = ({
  children,
  distance = 60,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  blur = 0,
  threshold = 0.1,
  delay = 0,
  stagger = 0,
  once = true,
  className = '',
  style,
}: AnimatedContentProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  const sign = reverse ? -1 : 1;
  const tx = direction === 'horizontal' ? distance * sign : 0;
  const ty = direction === 'vertical' ? distance * sign : 0;
  const items = React.Children.toArray(children);

  return (
    <div ref={ref} className={className} style={style}>
      {items.map((child, idx) => (
        <div
          key={idx}
          style={{
            transitionProperty: 'transform, opacity, filter',
            transitionDuration: `${duration}s`,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            transitionDelay: `${delay + idx * stagger}s`,
            opacity: visible ? 1 : animateOpacity ? initialOpacity : 1,
            filter: visible ? 'blur(0px)' : blur > 0 ? `blur(${blur}px)` : undefined,
            transform: visible
              ? 'translate3d(0, 0, 0) scale(1)'
              : `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default AnimatedContent;
