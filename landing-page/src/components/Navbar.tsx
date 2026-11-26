import React from "react";
import { Github } from "lucide-react";
import SpecularButton from "./react-bits/SpecularButton";

interface NavbarProps {
  active?: "home" | "docs" | "legal";
}

export default function Navbar({ active = "home" }: NavbarProps) {
  return (
    <header className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex h-16 items-center justify-between gap-4 rounded-full border border-[#fff4e8]/12 bg-[#16100c]/82 px-5 backdrop-blur-2xl sm:px-6">
        <a href="/" className="flex shrink-0 items-center">
          <img
            src="/brand/clipcut-logo-white.svg?v=4"
            alt="ClipCut"
            className="h-9 w-auto sm:h-10"
          />
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 text-sm font-medium text-[#b5a79c] md:flex"
        >
          <a
            href="/#features"
            className={`transition-colors hover:text-[#fbf7f2] ${
              active === "home" ? "text-[#fbf7f2]" : ""
            }`}
          >
            Features
          </a>
          <a
            href="/docs"
            className={`transition-colors hover:text-[#fbf7f2] ${
              active === "docs" ? "text-[#fbf7f2]" : ""
            }`}
          >
            Docs
          </a>
          <a href="/#quickstart" className="transition-colors hover:text-[#fbf7f2]">
            Quick Start
          </a>
          <a href="/#faq" className="transition-colors hover:text-[#fbf7f2]">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <a
            href="/docs"
            className="inline-flex h-9 items-center rounded-full border border-[#fff4e8]/12 bg-[#fff4e8]/5 px-3.5 text-xs font-semibold text-[#fbf7f2] transition-colors hover:bg-[#fff4e8]/10 md:hidden"
          >
            Docs
          </a>
          <SpecularButton
            href="https://github.com/Chethankumar443/ClipCut"
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            radius={999}
            tint="#ff7a2f"
            tintOpacity={0.14}
            textColor="#fbf7f2"
            lineColor="#ffb07a"
            baseColor="#5a473a"
            intensity={0.95}
            idleIntensity={0.4}
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </SpecularButton>
        </div>
      </div>
    </header>
  );
}
