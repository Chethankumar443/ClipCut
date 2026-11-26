import React, { useState } from "react";
import { ArrowRight, Cpu, Flame, Mic, Music2, Radio, Scissors } from "lucide-react";
import SpotlightCard from "./react-bits/SpotlightCard";
import SpecularButton from "./react-bits/SpecularButton";
import { InView } from "./motion-primitives/InView";

interface Stage {
  step: string;
  tag: string;
  title: string;
  description: React.ReactNode;
  specs: string[];
  icon: React.ReactNode;
  span: string;
}

const STAGES: Stage[] = [
  {
    step: "01",
    tag: "Ingest & Transcribe",
    title: "Hybrid Link & Local ASR Engine",
    span: "md:col-span-7",
    icon: <Mic className="h-5 w-5" />,
    specs: ["youtube-transcript-api", "Parakeet TDT 0.6b", "Faster-Whisper Auto"],
    description: (
      <>
        Pulls transcripts via <code className="font-mono text-[#fbf7f2]">youtube-transcript-api</code>{" "}
        first, then falls back to local <code className="font-mono text-[#fbf7f2]">sherpa-onnx</code>{" "}
        (Parakeet 0.6b) or multimodal{" "}
        <code className="font-mono text-[#fbf7f2]">faster-whisper</code> with automatic language
        detection.
      </>
    ),
  },
  {
    step: "02",
    tag: "Peak Detection",
    title: "Energy & Replay Scoring",
    span: "md:col-span-5",
    icon: <Flame className="h-5 w-5" />,
    specs: ["YouTube Most-Replayed", "Librosa Energy", "Auto Hook Synthesis"],
    description: (
      <>
        Combines YouTube Most-Replayed trending sectors,{" "}
        <code className="font-mono text-[#fbf7f2]">librosa</code> microphone vocal spikes, and your
        clip feedback to rank the highest-performing hooks first.
      </>
    ),
  },
  {
    step: "03",
    tag: "Refine & Style",
    title: "Playhead-Synced Editor",
    span: "md:col-span-5",
    icon: <Scissors className="h-5 w-5" />,
    specs: ["Word-Level Seek", "Inline Fix", "Bounce · Hype · Clean"],
    description: (
      <>
        Click any transcript word to seek and set Start/End points, double-click to fix spelling
        inline, and preview <code className="font-mono text-[#fbf7f2]">Bounce</code>,{" "}
        <code className="font-mono text-[#fbf7f2]">Hype</code>, or{" "}
        <code className="font-mono text-[#fbf7f2]">Clean</code> captions live.
      </>
    ),
  },
  {
    step: "04",
    tag: "Audio Mix",
    title: "BGM Mixer & Auto-Ducking",
    span: "md:col-span-7",
    icon: <Music2 className="h-5 w-5" />,
    specs: ["MP3 / WAV / M4A", "FFmpeg sidechaincompress", "Stream Copy"],
    description: (
      <>
        Layer built-in tracks or your own audio with smooth fade-in/out and FFmpeg{" "}
        <code className="font-mono text-[#fbf7f2]">sidechaincompress</code> auto-ducking, rendered
        via stream copy for near-instant previews.
      </>
    ),
  },
  {
    step: "05",
    tag: "Always-On Streams",
    title: "Live Auto-Clipping & Gaming Mode",
    span: "md:col-span-6",
    icon: <Radio className="h-5 w-5" />,
    specs: ["Chat Burst Judge", "Facial Expression AI", "23+ Games + Facecam"],
    description: (
      <>
        Monitor Twitch, Kick, and YouTube creators, detect most-commented chat bursts and facial
        reactions, identify 23+ games, and frame facecams automatically.
      </>
    ),
  },
  {
    step: "06",
    tag: "Self-Hosted Scale",
    title: "Production Self-Hosting",
    span: "md:col-span-6",
    icon: <Cpu className="h-5 w-5" />,
    specs: ["SQLite / PostgreSQL", "Docker Compose", "Remote GPU ASR"],
    description: (
      <>
        Fair multi-user job queue, optional accounts, SQLite or PostgreSQL storage, Docker Compose
        with Caddy/Traefik/Nginx, and remote GPU ASR worker support.
      </>
    ),
  },
];

export default function StudioPipeline() {
  const [selectedStep, setSelectedStep] = useState<string>("all");

  const visibleStages =
    selectedStep === "all" ? STAGES : STAGES.filter((s) => s.step === selectedStep);

  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <InView>
        <div className="flex flex-col justify-between gap-6 border-b border-[#fff4e8]/10 pb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold tracking-widest text-[#ff7a2f] uppercase">
              Studio Pipeline
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-[1.06] tracking-tight text-[#fbf7f2] sm:text-5xl lg:text-6xl">
              Built for creators who want full control.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#b5a79c] sm:text-base">
            Every stage from audio ingestion to caption styling and background music ducking runs
            transparently on your hardware—with full settings and outputs visible at every step.
          </p>
        </div>

        {/* Interactive Stage Filter Buttons (SpecularButton) */}
        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          <SpecularButton
            size="sm"
            radius={999}
            tint={selectedStep === "all" ? "#ff7a2f" : "#ffffff"}
            tintOpacity={selectedStep === "all" ? 0.2 : 0.04}
            textColor="#fbf7f2"
            lineColor={selectedStep === "all" ? "#ffb07a" : "#fff4e8"}
            baseColor={selectedStep === "all" ? "#ff7a2f" : "#3a312b"}
            idleIntensity={selectedStep === "all" ? 0.65 : 0.25}
            onClick={() => setSelectedStep("all")}
          >
            <span className="font-mono text-xs">All 06 Stages</span>
          </SpecularButton>

          {STAGES.map((stage) => {
            const active = selectedStep === stage.step;
            return (
              <SpecularButton
                key={stage.step}
                size="sm"
                radius={999}
                tint={active ? "#ff7a2f" : "#ffffff"}
                tintOpacity={active ? 0.2 : 0.03}
                textColor={active ? "#fbf7f2" : "#b5a79c"}
                lineColor={active ? "#ffb07a" : "#fff4e8"}
                baseColor={active ? "#ff7a2f" : "#3a312b"}
                idleIntensity={active ? 0.65 : 0.2}
                onClick={() => setSelectedStep(active ? "all" : stage.step)}
              >
                <span className="font-mono text-[11px] text-[#ff9a5c]">{stage.step}</span>
                <span className="text-xs">{stage.tag}</span>
              </SpecularButton>
            );
          })}
        </div>
      </InView>

      <InView delay={90}>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-12">
          {visibleStages.map((stage) => (
            <div
              key={stage.step}
              className={selectedStep === "all" ? stage.span : "md:col-span-12"}
            >
              <SpotlightCard className="flex h-full flex-col justify-between border-[#fff4e8]/10 bg-[#15100d] p-7 sm:p-8">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ff7a2f]/25 bg-[#ff7a2f]/12 text-[#ff7a2f]">
                        {stage.icon}
                      </div>
                      <span className="font-mono text-[11px] font-semibold tracking-widest text-[#b5a79c] uppercase">
                        {stage.tag}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#ff7a2f]/80">
                      {stage.step}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold tracking-tight text-[#fbf7f2] sm:text-2xl">
                    {stage.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#b5a79c] sm:text-[15px]">
                    {stage.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {stage.specs.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-lg border border-[#fff4e8]/10 bg-[#0d0a08] px-2.5 py-1 font-mono text-[11px] text-[#e4dad0]"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-2 border-t border-[#fff4e8]/8 pt-4 font-mono text-[11px] text-[#786b61]">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a2f]" />
                    <span>Stage {stage.step} of 06</span>
                  </div>
                  <span>{selectedStep === stage.step ? "Focused view" : "Local pipeline"}</span>
                </div>
              </SpotlightCard>
            </div>
          ))}
        </div>
      </InView>

      <div className="mt-10 flex justify-end">
        <SpecularButton
          href="/docs"
          size="md"
          radius={999}
          tint="#ffffff"
          tintOpacity={0.04}
          textColor="#fbf7f2"
          lineColor="#ff9a5c"
          baseColor="#3a312b"
          idleIntensity={0.35}
        >
          <span className="font-mono text-xs tracking-wider uppercase">Explore Full Documentation</span>
          <ArrowRight className="h-4 w-4 text-[#ff7a2f]" />
        </SpecularButton>
      </div>
    </section>
  );
}
