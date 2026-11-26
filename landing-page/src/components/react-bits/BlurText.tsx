import React, { useEffect, useRef, useState } from "react";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function BlurText({
  text,
  className = "",
  delay = 45,
}: BlurTextProps) {
  const ref = useRef<HTMLParagraphElement | null>(null);
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

  return (
    <p ref={ref} className={className}>
      {words.map((word, idx) => (
        <span
          key={idx}
          className="inline-block transition-all duration-700 ease-out"
          style={{
            transitionDelay: `${idx * delay}ms`,
            opacity: visible ? 1 : 0,
            filter: visible ? "blur(0px)" : "blur(10px)",
            transform: visible ? "translateY(0px)" : "translateY(10px)",
          }}
        >
          {word}
          {idx < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </p>
  );
}
