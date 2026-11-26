import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Is ClipCut completely free and open source?",
    a: "Yes. ClipCut is MIT-licensed and runs on your own machine or server with zero subscriptions, watermarks, or per-minute paywalls.",
  },
  {
    q: "Which AI providers does ClipCut support?",
    a: "Bring your own key for Gemini, OpenAI, Anthropic Claude, Grok (xAI), Groq, or OpenRouter—or run 100% locally with Ollama and zero cloud API costs.",
  },
  {
    q: "What happens if I run it without an AI key?",
    a: "ClipCut still works out of the box using librosa vocal energy spikes, YouTube Most-Replayed viewer heatmaps, and speech boundaries to find standout moments.",
  },
  {
    q: "Which video sources and caption languages work?",
    a: "Paste YouTube, Twitch, or Kick links, upload local video files, or monitor live streams. Speech-to-text supports English via sherpa-onnx (Parakeet 0.6b) and multilingual transcription via faster-whisper.",
  },
  {
    q: "Can I edit hooks, trim timing, or mix background music after?",
    a: "Yes. Open any generated clip in the studio editor to click-to-seek the transcript, fix spelling inline, switch between 9:16, 1:1, and 16:9 layouts, or mix background music with sidechain auto-ducking.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#111114]">
      {FAQS.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={item.q} className="px-6 py-5">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
            >
              <span className="text-base font-semibold text-white">{item.q}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-[#ff7a2f]" : ""
                }`}
              />
            </button>
            {isOpen && (
              <p className="mt-3 pr-8 text-sm leading-relaxed text-zinc-400">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
