import React, { useEffect, useState } from "react";
import { Maximize2, Play, X } from "lucide-react";
import Folder from "./react-bits/Folder";

interface ClipCard {
  id: string;
  label: string;
  tag: string;
  video: string;
}

const CLIPS: ClipCard[] = [
  {
    id: "bounce",
    label: "Bounce Hook",
    tag: "9:16",
    video: "/brand/JFTyjtNEWaY.mp4",
  },
  {
    id: "unscripted",
    label: "Studio Cut",
    tag: "9:16",
    video: "/brand/raygan-unscripted-loop.mp4",
  },
  {
    id: "hype",
    label: "Stream Peak",
    tag: "9:16",
    video: "/brand/uwhqXJNJCaQ.mp4",
  },
];

export default function VideoShowcase() {
  const [folderOpen, setFolderOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ClipCard | null>(null);

  useEffect(() => {
    if (!activeVideo) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveVideo(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeVideo]);

  const folderItems = CLIPS.map((clip) => (
    <button
      key={clip.id}
      type="button"
      onClick={() => setActiveVideo(clip)}
      aria-label={`Open ${clip.label} video fullscreen`}
      className="group relative h-full w-full overflow-hidden bg-[#120d0a] text-left focus:outline-none"
    >
      <video
        src={clip.video}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-sm transition-colors group-hover:border-[#ff7a2f] group-hover:bg-[#ff7a2f] group-hover:text-[#140b05]">
        <Maximize2 className="h-3.5 w-3.5" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-[#fbf7f2]">{clip.label}</span>
          <span className="font-mono text-[10px] text-[#ff7a2f]">{clip.tag}</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-[#d4c8be] group-hover:text-white">
          <Play className="h-2.5 w-2.5 fill-current text-[#ff7a2f]" />
          <span>Fullscreen</span>
        </div>
      </div>
    </button>
  ));

  return (
    <div className="relative flex w-full items-center justify-center">
      <Folder
        open={folderOpen}
        onToggle={() => setFolderOpen((prev) => !prev)}
        label="ClipCut Exports"
        sublabel="3 clips"
        items={folderItems}
      />

      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#fff4e8]/15 bg-[#120d0a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#fff4e8]/10 px-5 py-3.5">
              <div className="text-left">
                <span className="text-sm font-bold text-[#fbf7f2]">{activeVideo.label}</span>
                <span className="ml-2 font-mono text-xs text-[#ff7a2f]">{activeVideo.tag}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Close fullscreen video"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-[#fff4e8]/15 bg-[#1b1410] text-white transition-colors hover:border-[#ff7a2f] hover:bg-[#ff7a2f] hover:text-[#140b05]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center bg-black p-4">
              <video
                src={activeVideo.video}
                controls
                autoPlay
                playsInline
                className="max-h-[76vh] w-auto rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
