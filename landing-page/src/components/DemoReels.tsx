import React, { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { BorderTrail } from "../motion-primitives/BorderTrail";

interface ReelItem {
  id: string;
  label: string;
  caption: string;
  video: string;
  poster: string;
  featured?: boolean;
}

const REELS: ReelItem[] = [
  {
    id: "bounce",
    label: "Bounce",
    caption: "Word-by-word pop and energy emphasis",
    video: "/brand/demo-bounce.mp4",
    poster: "/brand/demo-bounce.jpg",
  },
  {
    id: "hype",
    label: "Hype",
    caption: "Bold streamer hooks and active highlights",
    video: "/brand/demo-hype.mp4",
    poster: "/brand/demo-hype.jpg",
    featured: true,
  },
  {
    id: "clean",
    label: "Clean",
    caption: "Minimal studio captions for podcasts",
    video: "/brand/demo-clean.mp4",
    poster: "/brand/demo-clean.jpg",
  },
];

export default function DemoReels() {
  const [unmutedId, setUnmutedId] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const toggleSound = (id: string) => {
    const nextId = unmutedId === id ? null : id;
    Object.entries(videoRefs.current).forEach(([key, el]) => {
      if (!el) return;
      el.muted = key !== nextId;
      if (key === nextId && el.paused) {
        el.play().catch(() => {});
      }
    });
    setUnmutedId(nextId);
  };

  return (
    <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
      {REELS.map((reel) => {
        const isUnmuted = unmutedId === reel.id;
        return (
          <figure key={reel.id} className="group flex flex-col items-center gap-3.5">
            <div
              className={`relative aspect-[9/16] w-full max-w-[244px] overflow-hidden rounded-3xl border bg-[#15100d] transition-all duration-300 group-hover:-translate-y-1.5 ${
                reel.featured
                  ? "border-[#ff7a2f]/40 shadow-[0_0_55px_-18px_rgba(255,122,47,0.3)]"
                  : "border-[#fff4e8]/10 hover:border-[#fff4e8]/22"
              }`}
            >
              {reel.featured && <BorderTrail />}
              <video
                ref={(el) => {
                  videoRefs.current[reel.id] = el;
                }}
                src={reel.video}
                poster={reel.poster}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="pointer-events-none absolute left-3.5 top-3.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-md">
                {reel.label}
              </span>
              <button
                type="button"
                onClick={() => toggleSound(reel.id)}
                aria-label={isUnmuted ? `Mute ${reel.label} preview` : `Unmute ${reel.label} preview`}
                className="absolute bottom-3.5 right-3.5 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/75 text-white backdrop-blur-md transition-colors hover:bg-[#ff7a2f] hover:text-[#140b05]"
              >
                {isUnmuted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
            <figcaption className="text-center text-xs leading-relaxed text-[#b5a79c]">
              <span className="font-semibold text-[#fbf7f2]">{reel.label}</span> · {reel.caption}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
