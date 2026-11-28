import React, { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, subscribeReducedMotion } from "../../lib/modernWeb";

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
  const [visible, setVisible] = useState(true);
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
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      setVisible(true);
      return unsubReduce;
    }
    setVisible(false);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      unsubReduce();
    };
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
          className="inline-block transition-all duration-500 ease-out"
          style={{
            transitionDelay: reduceMotion ? "0ms" : `${i * Math.min(delay, 35)}ms`,
            transitionDuration: reduceMotion ? "150ms" : undefined,
            opacity: visible ? 1 : 0,
            filter: reduceMotion || visible ? "blur(0px)" : "blur(4px)",
            transform: reduceMotion || visible ? "translateY(0px)" : "translateY(10px)",
          }}
        >
          {seg === " " ? "\u00A0" : seg}
          {per === "word" && i < segments.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
