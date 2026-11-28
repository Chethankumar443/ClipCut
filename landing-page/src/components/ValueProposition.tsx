import React from "react";
import { Check, Clock, Coins, ShieldCheck, X } from "lucide-react";
import { InView } from "./motion-primitives/InView";

interface ComparisonRow {
  axis: string;
  others: string;
  clipcut: string;
}

const COMPARISONS: ComparisonRow[] = [
  {
    axis: "Cost & Limits",
    others: "$29–$99/mo subscriptions, expiring credits, watermarks",
    clipcut: "$0/mo MIT open source, unlimited renders, zero watermarks",
  },
  {
    axis: "Privacy & Upload",
    others: "Upload multi-GB raw VODs to remote servers and wait in queue",
    clipcut: "Processes locally on your disk—keys and footage stay yours",
  },
  {
    axis: "Hook Detection",
    others: "Text transcripts only—misses vocal hype and viewer spikes",
    clipcut: "YouTube Most-Replayed + librosa peaks + chat/face bursts + AI",
  },
  {
    axis: "Live & Gaming",
    others: "Static center-crop with no stream monitoring or game rules",
    clipcut: "24/7 Twitch/Kick/YouTube monitor, 23+ games & auto facecam",
  },
  {
    axis: "Studio Control",
    others: "Rigid caption templates and slow full cloud re-renders",
    clipcut: "Click-word seek editor, Bounce/Hype/Clean ASS & BGM ducking",
  },
];

export default function ValueProposition() {
  return (
    <section
      id="why-clipcut"
      className="w-full border-t border-white/10 bg-black py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <InView>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#ff7a2f] uppercase">
                Why ClipCut · Problem, Investment &amp; Edge
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-[1.04] tracking-tight text-[#fbf7f2] sm:text-5xl lg:text-6xl">
                Stop paying rent to clip your own videos.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
              Trade 4–6 hours of timeline scrubbing and recurring monthly paywalls for an instant,
              unlimited studio you own forever.
            </p>
          </div>

          {/* Time, Money & Ownership Investment Strip */}
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/12 bg-white/10 md:grid-cols-3">
            <div className="bg-[#060606] p-7 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#ff9a5c] uppercase">
                <Clock className="h-4 w-4 text-[#ff7a2f]" />
                <span>Setup Time</span>
              </div>
              <div className="mt-4 font-serif text-4xl tracking-tight text-[#fbf7f2] sm:text-5xl">
                ~2 min
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                Launch locally with Python 3.10+ or Docker Compose. Zero waiting on multi-GB cloud
                upload queues.
              </p>
            </div>

            <div className="bg-[#060606] p-7 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#ff9a5c] uppercase">
                <Coins className="h-4 w-4 text-[#ff7a2f]" />
                <span>Monthly Cost</span>
              </div>
              <div className="mt-4 font-serif text-4xl tracking-tight text-[#ff7a2f] sm:text-5xl">
                $0 / mo
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                MIT-licensed software forever. Run offline with Ollama or acoustic peaks, or plug in
                your own API key at wholesale rates.
              </p>
            </div>

            <div className="bg-[#060606] p-7 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#ff9a5c] uppercase">
                <ShieldCheck className="h-4 w-4 text-[#ff7a2f]" />
                <span>Control Kept</span>
              </div>
              <div className="mt-4 font-serif text-4xl tracking-tight text-[#fbf7f2] sm:text-5xl">
                100%
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                Source code, raw streams, custom BGM tracks, and SQLite or PostgreSQL data never
                leave your machine.
              </p>
            </div>
          </div>
        </InView>

        {/* Problem vs Solution Contrast */}
        <InView delay={80}>
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#060606] p-7 sm:p-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-[#a1a1aa] uppercase">
                <X className="h-3.5 w-3.5 text-[#ff6b4a]" />
                <span>The Problem</span>
              </div>
              <h3 className="mt-5 font-serif text-3xl tracking-tight text-[#fbf7f2]">
                Manual editing drains hours. Cloud SaaS taxes every export.
              </h3>
              <ul className="mt-6 space-y-4 text-sm leading-relaxed text-[#a1a1aa] sm:text-[15px]">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b4a]" />
                  <span>
                    <strong className="font-semibold text-[#fbf7f2]">4–6 hours per stream:</strong>{" "}
                    Scrubbing long podcasts and VODs manually just to rescue a handful of vertical
                    clips.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b4a]" />
                  <span>
                    <strong className="font-semibold text-[#fbf7f2]">Paywalls &amp; queues:</strong>{" "}
                    Cloud clippers charge $29–$99/mo, cap minutes, stamp watermarks, and stall on
                    gigabyte uploads.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b4a]" />
                  <span>
                    <strong className="font-semibold text-[#fbf7f2]">Text-blind cuts:</strong>{" "}
                    Transcript-only wrappers miss vocal volume spikes, hype tone, and replay peaks.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#ff7a2f]/30 bg-[#090909] p-7 sm:p-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a2f]/35 bg-[#ff7a2f]/12 px-3 py-1 text-xs font-semibold tracking-wide text-[#ff9a5c] uppercase">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>The ClipCut Advantage</span>
              </div>
              <h3 className="mt-5 font-serif text-3xl tracking-tight text-[#fbf7f2]">
                Multi-signal hook scoring &amp; instant local rendering.
              </h3>
              <ul className="mt-6 space-y-4 text-sm leading-relaxed text-[#d4d4d8] sm:text-[15px]">
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a2f]" />
                  <span>
                    <strong className="font-semibold text-[#fbf7f2]">Acoustic + replay fusion:</strong>{" "}
                    Merges <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-[#ff9a5c]">librosa</code> mic
                    energy, YouTube Most-Replayed heatmaps, and live chat bursts before AI ranking.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a2f]" />
                  <span>
                    <strong className="font-semibold text-[#fbf7f2]">Click-to-trim studio:</strong>{" "}
                    Seek any word in the transcript, preview Bounce/Hype/Clean ASS captions, and duck
                    BGM via FFmpeg stream copy.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a2f]" />
                  <span>
                    <strong className="font-semibold text-[#fbf7f2]">BYOK or completely offline:</strong>{" "}
                    Works out of the box with local Ollama ($0 API cost), 8+ AI providers, or pure
                    audio peak scoring.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </InView>

        {/* Clean Architectural Comparison Matrix */}
        <InView delay={120}>
          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-[#060606]">
            <div className="border-b border-white/10 px-6 py-4 sm:px-8">
              <h3 className="text-xs font-semibold tracking-[0.16em] text-[#fbf7f2] uppercase">
                How ClipCut Stands Apart
              </h3>
            </div>
            <div className="divide-y divide-white/8">
              <div className="hidden grid-cols-12 gap-4 bg-[#0a0a0a] px-8 py-3 text-xs font-semibold tracking-[0.12em] text-[#71717a] uppercase md:grid">
                <div className="col-span-3">Dimension</div>
                <div className="col-span-4">Typical Cloud SaaS</div>
                <div className="col-span-5 text-[#ff9a5c]">ClipCut Studio</div>
              </div>
              {COMPARISONS.map((row) => (
                <div
                  key={row.axis}
                  className="grid grid-cols-1 gap-2 px-6 py-4.5 transition-colors hover:bg-white/[0.02] sm:px-8 md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="text-sm font-semibold text-[#fbf7f2] md:col-span-3">{row.axis}</div>
                  <div className="text-xs leading-relaxed text-[#71717a] sm:text-sm md:col-span-4">
                    <span className="mr-1.5 text-[11px] font-semibold tracking-wide text-[#71717a] uppercase md:hidden">
                      Others:
                    </span>
                    {row.others}
                  </div>
                  <div className="flex items-start gap-2 text-xs leading-relaxed text-[#e4dad0] sm:text-sm md:col-span-5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a2f]" />
                    <span>{row.clipcut}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </InView>
      </div>
    </section>
  );
}
