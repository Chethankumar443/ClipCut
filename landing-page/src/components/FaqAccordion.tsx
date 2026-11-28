import React from "react";
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
    a: "Paste YouTube, Twitch, or Kick links, upload local video files, or monitor live streams. Speech-to-text uses Faster-Whisper by default for automatic language detection and multi-language transcription across 99+ languages from one model.",
  },
  {
    q: "Can I edit hooks, trim timing, or mix background music after?",
    a: "Yes. Open any generated clip in the studio editor to click-to-seek the transcript, fix spelling inline, switch between 9:16, 1:1, and 16:9 layouts, or mix background music with sidechain auto-ducking.",
  },
];

export default function FaqAccordion() {
  return (
    <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-[#060606]">
      {FAQS.map((item, idx) => (
        <details
          key={item.q}
          name="clipcut-faq"
          open={idx === 0}
          className="faq-details group px-6 py-5 sm:px-8"
        >
          <summary className="flex w-full cursor-pointer items-center justify-between gap-4 text-left select-none focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff7a2f]">
            <h3 className="text-base font-semibold text-[#fbf7f2]">{item.q}</h3>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[#8f8176] transition-transform duration-200 group-open:rotate-180 group-open:text-[#ff7a2f]"
            />
          </summary>
          <p className="mt-3 pr-8 text-sm leading-relaxed text-[#b5a79c]">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
