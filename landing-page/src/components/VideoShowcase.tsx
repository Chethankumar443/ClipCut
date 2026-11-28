import React, { useEffect, useId, useRef, useState } from "react";
import { Maximize2, Play, X } from "lucide-react";
import Folder from "./react-bits/Folder";
import { prefersReducedMotion, subscribeReducedMotion } from "../lib/modernWeb";

interface ClipCard {
  id: string;
  label: string;
  tag: string;
  video: string;
  width: number;
  height: number;
}

const CLIPS: ClipCard[] = [
  {
    id: "bounce",
    label: "Bounce Hook",
    tag: "9:16",
    video: "/brand/JFTyjtNEWaY.mp4",
    width: 360,
    height: 640,
  },
  {
    id: "unscripted",
    label: "Studio Cut",
    tag: "9:16",
    video: "/brand/raygan-unscripted-loop.mp4",
    width: 360,
    height: 640,
  },
  {
    id: "hype",
    label: "Stream Peak",
    tag: "9:16",
    video: "/brand/uwhqXJNJCaQ.mp4",
    width: 360,
    height: 640,
  },
];

export default function VideoShowcase() {
  const [folderOpen, setFolderOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ClipCard | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [inView, setInView] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const thumbVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const dialogTitleId = useId();

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
    return subscribeReducedMotion(setReduceMotion);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      setInView(entries.some((entry) => entry.isIntersecting));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const shouldPlay = folderOpen && inView && !reduceMotion && !activeVideo;
    for (const videoEl of Object.values(thumbVideoRefs.current)) {
      if (!videoEl) continue;
      if (shouldPlay) {
        videoEl.play().catch(() => { });
      } else {
        videoEl.pause();
      }
    }
  }, [folderOpen, inView, reduceMotion, activeVideo]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeVideo) {
      dialog.returnValue = "";
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [activeVideo]);

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

  const closeDialog = () => {
    modalVideoRef.current?.pause();
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close("dismiss");
    setActiveVideo(null);
  };

  const folderItems = CLIPS.map((clip) => (
    <button
      key={clip.id}
      type="button"
      onClick={() => setActiveVideo(clip)}
      aria-label={`Open ${clip.label} video fullscreen`}
      className="group relative h-full w-full overflow-hidden bg-[#060606] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a2f]"
    >
      <video
        ref={(el) => {
          thumbVideoRefs.current[clip.id] = el;
        }}
        src={clip.video}
        width={clip.width}
        height={clip.height}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-sm transition-colors group-hover:border-[#ff7a2f] group-hover:bg-[#ff7a2f] group-hover:text-[#140b05]">
        <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-[#fbf7f2]">{clip.label}</span>
          <span className="text-[11px] font-medium text-[#ff7a2f]">{clip.tag}</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-[#d4c8be] group-hover:text-white">
          <Play className="h-2.5 w-2.5 fill-current text-[#ff7a2f]" aria-hidden="true" />
          <span>Fullscreen</span>
        </div>
      </div>
    </button>
  ));

  return (
    <div ref={stageRef} className="relative flex w-full items-center justify-center">
      <Folder
        open={folderOpen}
        onToggle={() => setFolderOpen((prev) => !prev)}
        label="ClipCut Exports"
        sublabel="3 clips"
        items={folderItems}
      />

      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby={activeVideo ? dialogTitleId : undefined}
        onClose={() => {
          modalVideoRef.current?.pause();
          setActiveVideo(null);
        }}
        className="clipcut-video-dialog"
      >
        {activeVideo && (
          <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#080808]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <div className="text-left">
                <h2 id={dialogTitleId} className="inline text-sm font-bold text-[#fbf7f2]">
                  {activeVideo.label}
                </h2>
                <span className="ml-2 text-xs font-medium text-[#ff7a2f]">{activeVideo.tag}</span>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close fullscreen video"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/15 bg-zinc-900 text-white transition-colors hover:border-[#ff7a2f] hover:bg-[#ff7a2f] hover:text-[#140b05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a2f]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center bg-black p-4">
              <video
                ref={modalVideoRef}
                src={activeVideo.video}
                width={activeVideo.width * 2}
                height={activeVideo.height * 2}
                controls
                autoPlay={!reduceMotion}
                playsInline
                className="max-h-[76vh] w-auto rounded-2xl object-contain"
              />
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
