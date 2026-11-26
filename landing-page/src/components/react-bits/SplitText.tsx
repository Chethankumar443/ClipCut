import React, { useEffect, useRef, useState } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function SplitText({
  text,
  className = "",
  delay = 35,
  duration = 0.65,
  tag = "h1",
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);
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
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const words = text.split(" ");
  let charIndex = 0;
  const Tag = tag as React.ElementType;

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, wIdx) => (
        <span key={wIdx} className="inline-block whitespace-nowrap">
          {word.split("").map((char, cIdx) => {
            const idx = charIndex++;
            return (
              <span
                key={cIdx}
                aria-hidden="true"
                className="inline-block transition-all ease-out"
                style={{
                  transitionDuration: `${duration}s`,
                  transitionDelay: `${idx * delay}ms`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0px)" : "translateY(22px)",
                }}
              >
                {char}
              </span>
            );
          })}
          {wIdx < words.length - 1 ? <span>&nbsp;</span> : null}
        </span>
      ))}
    </Tag>
  );
}
