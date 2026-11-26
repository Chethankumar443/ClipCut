import React from "react";
import { ArrowRight, Github } from "lucide-react";
import ParticleText from "./react-bits/ParticleText";
import SpecularButton from "./react-bits/SpecularButton";

interface FooterProps {
  showCta?: boolean;
}

export default function Footer({ showCta = true }: FooterProps) {
  return (
    <footer className={`mt-24 w-full border-t border-[#fff4e8]/10 bg-[#120d0a] ${showCta ? "pt-20 sm:pt-28" : "pt-0"}`}>
      <div className="mx-auto max-w-7xl px-6">
        {showCta && (
          <div className="flex flex-col justify-between gap-10 pb-20 md:flex-row md:items-end">
            <div>
              <p className="mb-4 font-mono text-xs font-semibold tracking-widest text-[#ff7a2f] uppercase">
                Open-Source &amp; Self-Hosted
              </p>
              <h2 className="font-serif text-5xl tracking-tight text-[#fbf7f2] sm:text-6xl lg:text-7xl">
                Your ClipCut studio awaits.
              </h2>
            </div>

            <div className="max-w-sm space-y-6">
              <p className="text-base leading-relaxed text-[#b5a79c]">
                Self-hosted, MIT-licensed, and built to run locally with your own AI key or Ollama.
                Zero subscriptions, zero watermarks.
              </p>
              <div className="flex flex-wrap items-center gap-3.5">
                <SpecularButton
                  href="/docs/quickstart"
                  size="md"
                  radius={999}
                  tint="#ff7a2f"
                  tintOpacity={0.14}
                  textColor="#fbf7f2"
                  lineColor="#ffb07a"
                  baseColor="#ff7a2f"
                  glow={1.1}
                  blur={8}
                >
                  <span className="font-mono text-xs tracking-widest uppercase">Read the Docs</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#ff9a5c]" />
                </SpecularButton>
                <SpecularButton
                  href="https://github.com/Chethankumar443/ClipCut"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="md"
                  radius={999}
                  tint="#ffffff"
                  tintOpacity={0.04}
                  textColor="#fbf7f2"
                  lineColor="#fff4e8"
                  baseColor="#52463d"
                  glow={0.9}
                >
                  <Github className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs tracking-widest uppercase">GitHub Repo</span>
                </SpecularButton>
              </div>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-8 ${showCta ? "border-t border-[#fff4e8]/10" : ""} py-12 text-sm text-[#8f8176] md:grid-cols-12 md:items-start`}>
          <div className="md:col-span-6">
            <p className="max-w-md leading-relaxed">
              ClipCut is open-source software powered by FastAPI, FFmpeg, yt-dlp, librosa,
              sherpa-onnx, and faster-whisper. Built for creators, streamers, and podcast editors.
            </p>
          </div>

          <div className="space-y-3 md:col-span-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[#e4dad0]">
              <a href="/docs" className="transition-colors hover:text-white">
                Docs
              </a>
              <a href="/terms" className="transition-colors hover:text-white">
                Terms
              </a>
              <a href="/privacy" className="transition-colors hover:text-white">
                Privacy
              </a>
              <a href="/acceptable-use" className="transition-colors hover:text-white">
                Acceptable Use
              </a>
            </div>
            <p className="text-xs text-[#8f8176]">© 2026 ClipCut. MIT License.</p>
          </div>

          <div className="flex items-center gap-4 md:col-span-2 md:justify-end">
            <a
              href="https://github.com/Chethankumar443/ClipCut"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ClipCut on GitHub"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#fff4e8]/12 text-[#b5a79c] transition-colors hover:border-[#fff4e8]/30 hover:text-white"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Full-Screen Bottom Interactive Particle Wordmark */}
      <div className="w-full overflow-hidden border-t border-[#fff4e8]/8 pt-4 pb-0">
        <ParticleText
          text="CLIPCUT"
          particleSize={3}
          density={4}
          maxFontSize={380}
          fitWidth
          color="rgba(251, 247, 242, 0.30)"
          highlightColor="#ff7a2f"
          scatter={180}
          idleDrift={0.5}
          className="h-48 w-full sm:h-64 lg:h-80 xl:h-96"
        />
      </div>
    </footer>
  );
}
