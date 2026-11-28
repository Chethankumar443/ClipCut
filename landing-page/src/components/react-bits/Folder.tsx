import React from "react";
import "./Folder.css";

interface FolderProps {
  open: boolean;
  onToggle: () => void;
  color?: string;
  backColor?: string;
  label?: string;
  sublabel?: string;
  items: React.ReactNode[];
}

export default function Folder({
  open,
  onToggle,
  color = "#ff7a2f",
  backColor = "#b94a0e",
  label = "Rendered Clips",
  sublabel = "3 clips ready",
  items,
}: FolderProps) {
  return (
    <div className="rb-folder-stage">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={open ? "Close rendered clips folder" : "Open rendered clips folder"}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`rb-folder ${open ? "is-open" : ""}`}
        style={
          {
            "--folder-front": color,
            "--folder-back": backColor,
          } as React.CSSProperties
        }
      >
        <div className="rb-folder__back">
          <div className="rb-folder__tab" />
        </div>

        <div className="rb-folder__papers">
          {items.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className={`rb-folder__paper rb-folder__paper--${idx}`}
              onClick={(e) => {
                if (open) {
                  e.stopPropagation();
                }
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="rb-folder__front">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#140b05]/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#140b05] uppercase">
              {open ? "Open" : "Folder"}
            </span>
            <span className="text-[11px] font-semibold text-[#140b05]/75 tabular-nums">
              {sublabel}
            </span>
          </div>

          <div className="text-left">
            <div className="font-serif text-2xl leading-none text-[#140b05]">{label}</div>
            <div className="mt-1 text-[11px] font-medium text-[#140b05]/75">
              {open ? "Click a clip to watch fullscreen" : "Click to reveal 3 clips"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
