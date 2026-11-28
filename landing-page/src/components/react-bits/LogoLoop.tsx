import React from "react";

const ITEMS = [
  "YouTube",
  "Twitch",
  "Kick",
  "YouTube Shorts",
  "Instagram Reels",
  "TikTok",
  "Gemini",
  "Ollama",
  "OpenAI",
  "Claude",
  "Groq",
  "OpenRouter",
];

export default function LogoLoop() {
  return (
    <div className="relative overflow-hidden py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-[marquee_28s_linear_infinite] motion-reduce:animate-none gap-12 whitespace-nowrap">
        {[...ITEMS, ...ITEMS].map((item, idx) => (
          <span
            key={idx}
            className="text-sm font-semibold tracking-wider text-zinc-400 uppercase transition-colors hover:text-white"
          >
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
