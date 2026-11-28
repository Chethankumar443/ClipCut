import React, { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, X } from "lucide-react";
import CircularGallery, { type CircularGalleryItem } from "./react-bits/CircularGallery";
import { InView } from "./motion-primitives/InView";
import { renderPipelineCardTexture, type PipelineStageData } from "../lib/pipelineCards";
import { prefersReducedMotion, subscribeReducedMotion, yieldToMain } from "../lib/modernWeb";

export const STAGES: PipelineStageData[] = [
  {
    step: "01",
    tag: "Ingest & Transcribe",
    shortTitle: "Hybrid Link & Local ASR",
    title: "Hybrid Link & Local ASR Engine",
    accentNote: "Faster-Whisper",
    specs: ["youtube-transcript-api", "Faster-Whisper", "99+ Languages"],
    summary:
      "Pulls existing captions first, then transcribes speech in 99+ languages from one multi-language Faster-Whisper model.",
    docsHref: "/docs/ai-providers",
    docsLabel: "Explore AI & Speech Guide",
    command: "python -m studio.fetch_model base",
    palette: {
      name: "Ember Orange",
      accent: "#ff7a2f",
      soft: "rgba(255, 122, 47, 0.16)",
      border: "rgba(255, 122, 47, 0.44)",
      glow: "rgba(255, 122, 47, 0.45)",
      pillText: "#ffb07a",
      ink: "#140b05",
    },
    details: [
      "Resolves YouTube transcripts before falling back to yt-dlp audio-only downloads and local speech recognition.",
      "Runs a single Faster-Whisper multi-language model for automatic language detection across 99+ spoken languages.",
      "Synchronizes extracted WAV audio with aresample=async=1:first_pts=0 so every word timestamp stays frame-locked.",
    ],
  },
  {
    step: "02",
    tag: "Peak Detection",
    shortTitle: "Energy & Replay Scoring",
    title: "Energy & Replay Scoring",
    accentNote: "Signal Fusion",
    specs: ["YouTube Most-Replayed", "Librosa Energy", "Auto Hook Synthesis"],
    summary:
      "Combines YouTube Most-Replayed viewer curves, librosa microphone spikes, and your clip feedback to rank viral hooks first.",
    docsHref: "/docs",
    docsLabel: "Inspect Architecture Overview",
    command: "python -m studio.server  # Peak + LLM judge built-in",
    palette: {
      name: "Solar Gold",
      accent: "#fbbf24",
      soft: "rgba(251, 191, 36, 0.16)",
      border: "rgba(251, 191, 36, 0.44)",
      glow: "rgba(251, 191, 36, 0.42)",
      pillText: "#fde68a",
      ink: "#181002",
    },
    details: [
      "Fuses viewer replay heatmaps, chunk-bounded librosa RMS vocal spikes, and sentence boundaries for instant candidate discovery.",
      "Scores and ranks multi-candidate segments with your BYOK provider (Gemini, OpenAI, Claude, Groq, Ollama) or standalone acoustic signals.",
      "Filters out static ad slates and frozen screens automatically via signalstats motion analysis.",
    ],
  },
  {
    step: "03",
    tag: "Refine & Style",
    shortTitle: "Playhead-Synced Editor",
    title: "Playhead-Synced Editor",
    accentNote: "Zero-Build Studio",
    specs: ["Word-Level Seek", "Inline Fix", "Bounce · Hype · Clean"],
    summary:
      "Click any word in the transcript to seek and set Start/End points, fix spelling inline, and preview animated ASS captions.",
    docsHref: "/docs/quickstart",
    docsLabel: "Open Studio Editor Guide",
    command: "ffmpeg -ss <start> -t <dur> -avoid_negative_ts make_zero ...",
    palette: {
      name: "Electric Cyan",
      accent: "#22d3ee",
      soft: "rgba(34, 211, 238, 0.15)",
      border: "rgba(34, 211, 238, 0.42)",
      glow: "rgba(34, 211, 238, 0.4)",
      pillText: "#a5f3fc",
      ink: "#03161b",
    },
    details: [
      "Re-scales, crops, or pads footage to exact even target dimensions (9:16, 1:1, or 16:9) before burning ASS subtitles.",
      "Conforms variable-frame-rate recordings and tags H.264 SDR outputs cleanly with BT.709 color spaces (with HDR tonemap guard).",
      "Renders clips inside short temporary paths so Windows libass font loading stays resilient on deep project trees.",
    ],
  },
  {
    step: "04",
    tag: "Audio Mix",
    shortTitle: "BGM Mixer & Ducking",
    title: "BGM Mixer & Auto-Ducking",
    accentNote: "FFmpeg Stream Copy",
    specs: ["MP3 / WAV / M4A", "FFmpeg sidechaincompress", "Stream Copy"],
    summary:
      "Layer built-in tracks or your own audio with smooth fades and FFmpeg sidechaincompress ducking for instant previews.",
    docsHref: "/docs",
    docsLabel: "Explore Audio & Mixing",
    command: "-af loudnorm=I=-14:TP=-1.5:LRA=11 + sidechaincompress + alimiter",
    palette: {
      name: "Emerald Mint",
      accent: "#34d399",
      soft: "rgba(52, 211, 153, 0.15)",
      border: "rgba(52, 211, 153, 0.42)",
      glow: "rgba(52, 211, 153, 0.4)",
      pillText: "#a7f3d0",
      ink: "#031a11",
    },
    details: [
      "Blends starter or uploaded music beds over speech using lossless -c:v copy video stream copying for near-instant previews.",
      "Applies EBU R128 loudness normalization (-14 LUFS) and peak limiting (-1.5 dBTP) so combined mixes never clip.",
      "Never mutates or overwrites dry source renders—mixed outputs write atomically into separate preview targets.",
    ],
  },
  {
    step: "05",
    tag: "Always-On Streams",
    shortTitle: "Live Clipper & Gaming",
    title: "Live Auto-Clipping & Gaming Mode",
    accentNote: "23+ Games",
    specs: ["Chat Burst Judge", "Facial Expression AI", "23+ Games + Facecam"],
    summary:
      "Monitor Twitch, Kick, and YouTube creators 24/7, detect unique-chatter bursts and facial reactions, and auto-frame facecams.",
    docsHref: "/docs/gaming-mode",
    docsLabel: "Read Gaming Mode Docs",
    command: "# Enable live monitors right in the Creator Dashboard",
    palette: {
      name: "Crimson Rose",
      accent: "#fb7185",
      soft: "rgba(251, 113, 133, 0.16)",
      border: "rgba(251, 113, 133, 0.44)",
      glow: "rgba(251, 113, 133, 0.42)",
      pillText: "#fecdd3",
      ink: "#1f0409",
    },
    details: [
      "Tracks unique chat participants rather than spam bursts alongside real-time facecam emotion spikes.",
      "Identifies 23+ competitive titles and isolates rounded even-dimension facecam PIP crops above the gameplay viewport.",
      "Concatenates live rolling TS buffers with drift compensation and drops corrupted segments before rendering.",
    ],
  },
  {
    step: "06",
    tag: "Self-Hosted Scale",
    shortTitle: "Production Self-Hosting",
    title: "Production Self-Hosting",
    accentNote: "Docker + GPU ASR",
    specs: ["SQLite / PostgreSQL", "Docker Compose", "Remote GPU ASR"],
    summary:
      "Fair multi-user job queue, optional accounts, SQLite or PostgreSQL storage, Caddy HTTPS, and remote GPU ASR offload.",
    docsHref: "/docs/deployment",
    docsLabel: "View Deployment Docs",
    command: "docker compose up -d --build",
    palette: {
      name: "Violet Indigo",
      accent: "#a78bfa",
      soft: "rgba(167, 139, 250, 0.16)",
      border: "rgba(167, 139, 250, 0.44)",
      glow: "rgba(167, 139, 250, 0.42)",
      pillText: "#ddd6fe",
      ink: "#100824",
    },
    details: [
      "Runs zero-login single-owner out of the box or multi-tenant with Google/email accounts (CLIPCUT_ACCOUNTS=1).",
      "Balances CPU/disk load via a fair multi-user render queue with optional GPU ASR worker offload over HTTPS.",
      "Ships complete Docker Compose and Caddy reverse-proxy templates for instant VPS deployment.",
    ],
  },
];

export default function StudioPipeline() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [galleryItems, setGalleryItems] = useState<CircularGalleryItem[]>(() =>
    STAGES.map((stage) => ({
      image: "",
      text: `${stage.step} · ${stage.tag}`,
      description: stage.summary,
      alt: stage.title,
      color: stage.palette.pillText,
    }))
  );

  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
    return subscribeReducedMotion(setReduceMotion);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let runToken = 0;

    const generateChunked = async () => {
      const token = ++runToken;
      let deadline = performance.now() + 50;
      const items: CircularGalleryItem[] = [];

      for (const stage of STAGES) {
        if (cancelled || token !== runToken) return;
        items.push({
          image: renderPipelineCardTexture(stage),
          text: `${stage.step} · ${stage.tag}`,
          description: stage.summary,
          alt: stage.title,
          color: stage.palette.pillText,
        });
        if (performance.now() >= deadline) {
          await yieldToMain();
          deadline = performance.now() + 50;
        }
      }

      if (!cancelled && token === runToken) {
        setGalleryItems(items);
      }
    };

    void generateChunked();
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => {
        if (!cancelled) void generateChunked();
      }).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (detailIndex !== null) {
      dialog.returnValue = "";
      if (!dialog.open) {
        dialog.showModal();
      }
      headingRef.current?.focus({ preventScroll: true });
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [detailIndex]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    const onBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) {
        dialog.close("backdrop");
      }
    };

    dialog.addEventListener("click", onBackdropClick);
    return () => dialog.removeEventListener("click", onBackdropClick);
  }, []);

  const morphToStage = (idx: number) => {
    const target = ((idx % STAGES.length) + STAGES.length) % STAGES.length;
    setCopiedCmd(false);
    setActiveIndex(target);

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (typeof doc.startViewTransition === "function" && !reduceMotion) {
      doc.startViewTransition(() => {
        flushSync(() => {
          setDetailIndex(target);
        });
      });
    } else {
      setDetailIndex(target);
    }
  };

  const closeStageMorph = () => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const commit = () => {
      flushSync(() => {
        setDetailIndex(null);
      });
    };
    if (typeof doc.startViewTransition === "function" && !reduceMotion) {
      doc.startViewTransition(commit);
    } else {
      commit();
    }
  };

  const activeStage = detailIndex !== null ? STAGES[detailIndex] : null;
  const currentCardImg =
    detailIndex !== null ? galleryItems[detailIndex]?.image : "";

  const copyCommand = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 1800);
    } catch {
      setCopiedCmd(false);
    }
  };

  return (
    <section id="features" className="w-full overflow-x-clip bg-black py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <InView>
          <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#ff7a2f] uppercase">
                Studio Pipeline · 06 Automated Stages
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-[1.04] tracking-tight text-[#fbf7f2] sm:text-5xl lg:text-6xl">
                Your 24/7 viral clip factory.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
              Six transparent stages from multi-language Faster-Whisper speech recognition to viral
              hook ranking, BGM ducking, and local MP4 renders. Click any card to morph into its breakdown.
            </p>
          </div>
        </InView>
      </div>

      {/* Full-viewport-width 3D CircularGallery floating straight on pure black */}
      <div
        className="pipeline-gallery-stage relative mt-10 h-[440px] w-full bg-black sm:h-[580px] lg:h-[640px]"
        style={
          detailIndex === null
            ? ({ viewTransitionName: "stage-morph" } as React.CSSProperties)
            : undefined
        }
      >
        <CircularGallery
          items={galleryItems}
          bend={2.4}
          textColor="#fbf7f2"
          borderRadius={0.05}
          scrollEase={0.045}
          itemSize={0.92}
          itemAspect={0.78}
          gap={0.24}
          wave={0.9}
          fadeEdges={0.08}
          shadow={0.3}
          font='600 22px "Plus Jakarta Sans"'
          autoScroll={0.28}
          scrollSync={true}
          openOnClick={false}
          activeIndex={activeIndex}
          onActiveChange={(idx) => setActiveIndex(idx)}
          onItemClick={(_item, idx) => morphToStage(idx)}
        />
      </div>

      {/* Unboxed per-stage palette selector strip sitting directly on pure black */}
      <div className="mx-auto mt-2 flex max-w-6xl flex-wrap items-center justify-center gap-2.5 px-5 sm:px-6">
        {STAGES.map((stage, idx) => {
          const isCurrent = idx === activeIndex;
          return (
            <button
              key={stage.step}
              type="button"
              onClick={() => morphToStage(idx)}
              style={{
                backgroundColor: isCurrent ? stage.palette.soft : "transparent",
                borderColor: isCurrent ? stage.palette.accent : "rgba(255,255,255,0.12)",
                color: isCurrent ? stage.palette.pillText : "#a1a1aa",
                outlineColor: stage.palette.accent,
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tabular-nums transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: stage.palette.accent }}
              />
              <span>
                {stage.step} · {stage.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Zero-reload top-layer morph stage detail dialog */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby={activeStage ? titleId : undefined}
        onClose={() => setDetailIndex(null)}
        className="clipcut-stage-morph-dialog"
        style={
          activeStage
            ? ({
                "--stage-accent": activeStage.palette.accent,
                "--stage-soft": activeStage.palette.soft,
                "--stage-border": activeStage.palette.border,
                "--stage-glow": activeStage.palette.glow,
              } as React.CSSProperties)
            : undefined
        }
      >
        {activeStage && (
          <div
            className="clipcut-stage-morph-panel relative mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border bg-[#050507] text-[#fbf7f2]"
            style={{
              borderColor: activeStage.palette.border,
              viewTransitionName: "stage-morph",
            } as React.CSSProperties}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em] tabular-nums uppercase"
                  style={{
                    backgroundColor: activeStage.palette.soft,
                    borderColor: activeStage.palette.border,
                    color: activeStage.palette.pillText,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: activeStage.palette.accent }}
                    aria-hidden="true"
                  />
                  Stage {activeStage.step} · {activeStage.tag}
                </span>
                <span className="hidden text-xs font-medium text-[#8f8176] tabular-nums sm:inline">
                  {activeStage.accentNote}
                </span>
              </div>

              <button
                type="button"
                onClick={closeStageMorph}
                aria-label="Close stage breakdown"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/80 text-white transition-colors hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: activeStage.palette.accent }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="grid flex-1 gap-8 overflow-y-auto p-6 sm:p-8 lg:grid-cols-12">
              <div className="flex flex-col items-center justify-center lg:col-span-5">
                {currentCardImg && (
                  <img
                    src={currentCardImg}
                    alt={activeStage.title}
                    width={390}
                    height={500}
                    className="w-full max-w-[310px] rounded-2xl border object-cover"
                    style={{ borderColor: activeStage.palette.border }}
                  />
                )}
              </div>

              <div className="flex flex-col justify-between gap-6 lg:col-span-7">
                <div>
                  <h3
                    id={titleId}
                    ref={headingRef}
                    tabIndex={-1}
                    className="font-serif text-3xl leading-tight tracking-tight text-[#fbf7f2] outline-none sm:text-4xl"
                  >
                    {activeStage.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#c8bbb0] sm:text-base">
                    {activeStage.summary}
                  </p>

                  <ul className="mt-6 space-y-3 text-sm leading-relaxed text-[#d7cbc0]">
                    {activeStage.details.map((line, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: activeStage.palette.accent }}
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {activeStage.specs.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-lg border px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: activeStage.palette.soft,
                          borderColor: activeStage.palette.border,
                          color: activeStage.palette.pillText,
                        }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* CLI / Pipeline Hint */}
                  <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black px-4 py-3 text-xs font-medium text-[#e4dad0]">
                    <span className="truncate">{activeStage.command}</span>
                    <button
                      type="button"
                      onClick={() => void copyCommand(activeStage.command)}
                      aria-label="Copy stage command"
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-[11px] text-[#b5a79c] transition-colors hover:border-white/35 hover:text-white"
                    >
                      {copiedCmd ? (
                        <>
                          <Check className="h-3.5 w-3.5" style={{ color: activeStage.palette.accent }} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Action bar with unique per-stage button palette & Prev/Next morph triggers */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => morphToStage((detailIndex ?? 0) - 1)}
                      aria-label="Previous pipeline stage"
                      className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-black px-4 text-xs font-medium text-[#d7cbc0] transition-colors hover:border-white/35 hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => morphToStage((detailIndex ?? 0) + 1)}
                      aria-label="Next pipeline stage"
                      className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-black px-4 text-xs font-medium text-[#d7cbc0] transition-colors hover:border-white/35 hover:text-white"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <a
                    href={activeStage.docsHref}
                    onClick={() => closeStageMorph()}
                    style={{
                      backgroundColor: activeStage.palette.accent,
                      color: activeStage.palette.ink,
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-bold tracking-wide transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <span>{activeStage.docsLabel}</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
