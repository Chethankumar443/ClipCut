import React, { useEffect, useRef, useState } from "react";

interface TextEffectProps {
  children?: React.ReactNode;
  text?: string;
  per?: "word" | "char";
  delay?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { value?: string; children?: React.ReactNode };
    if (typeof props.value === "string") return props.value.replace(/<[^>]+>/g, "").trim();
    if (props.children) return extractText(props.children);
  }
  return "";
}

export function TextEffect({
  children,
  text,
  per = "word",
  delay = 45,
  className = "",
  as = "h1",
}: TextEffectProps) {
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

  const Tag = as as React.ElementType;
  const raw = (text ?? extractText(children)).trim();
  const segments = per === "char" ? raw.split("") : raw.split(/\s+/).filter(Boolean);

  return (
    <Tag ref={ref} className={className} aria-label={raw}>
      {segments.map((seg, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block transition-all duration-700 ease-out"
          style={{
            transitionDelay: `${i * delay}ms`,
            opacity: visible ? 1 : 0,
            filter: visible ? "blur(0px)" : "blur(8px)",
            transform: visible ? "translateY(0px)" : "translateY(16px)",
          }}
        >
          {seg === " " ? "\u00A0" : seg}
          {per === "word" && i < segments.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
