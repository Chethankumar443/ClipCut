import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Github, Menu, X } from "lucide-react";

interface NavbarProps {
  active?: "home" | "docs" | "legal";
}

interface CurtainLink {
  num: string;
  label: string;
  sub: string;
  href: string;
  accent: string;
}

const PRIMARY_LINKS: CurtainLink[] = [
  { num: "01", label: "Home Studio", sub: "Hero & live clip exports", href: "/", accent: "#ff7a2f" },
  { num: "02", label: "Studio Pipeline", sub: "06-stage arc gallery & breakdowns", href: "/#features", accent: "#fbbf24" },
  { num: "03", label: "Why ClipCut", sub: "$0/mo self-hosted edge", href: "/#why-clipcut", accent: "#22d3ee" },
  { num: "04", label: "Documentation", sub: "Install, Docker, GPU ASR & AI keys", href: "/docs", accent: "#34d399" },
  { num: "05", label: "Quick Start", sub: "Run locally in under 60 seconds", href: "/#quickstart", accent: "#fb7185" },
  { num: "06", label: "FAQ", sub: "Licensing, languages & editing", href: "/#faq", accent: "#a78bfa" },
];

const DOC_SUBLINKS = [
  { label: "Quick Start", href: "/docs/quickstart" },
  { label: "AI & Speech", href: "/docs/ai-providers" },
  { label: "Deployment", href: "/docs/deployment" },
  { label: "Gaming Mode", href: "/docs/gaming-mode" },
];

export default function Navbar({ active = "home" }: NavbarProps) {
  const [curtainOpen, setCurtainOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (curtainOpen) {
      const btnRect = triggerRef.current?.getBoundingClientRect();
      if (btnRect) {
        dialog.style.setProperty("--curtain-x", `${Math.round(btnRect.left + btnRect.width / 2)}px`);
        dialog.style.setProperty("--curtain-y", `${Math.round(btnRect.top + btnRect.height / 2)}px`);
      }
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
  }, [curtainOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        setCurtainOpen(false);
      }
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setCurtainOpen(false);
    if (href.startsWith("/#") && typeof window !== "undefined" && window.location.pathname === "/") {
      event.preventDefault();
      const targetId = href.slice(2);
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  return (
    <header className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex h-16 items-center justify-between gap-4 rounded-full border border-white/12 bg-black/80 px-5 backdrop-blur-2xl sm:px-6">
        <a href="/" className="flex shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff7a2f]">
          <img
            src="/brand/clipcut-logo-white.svg?v=4"
            alt="ClipCut"
            className="h-9 w-auto sm:h-10"
          />
          <span className="hidden text-[11px] font-medium tracking-[0.12em] text-[#8f8176] uppercase sm:inline">
            {active === "docs" ? "Docs" : active === "legal" ? "Legal" : "Studio"}
          </span>
        </a>

        <nav aria-label="Primary navigation" className="flex items-center gap-2.5">
          <a
            href="https://github.com/Chethankumar443/ClipCut"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ClipCut on GitHub"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-black/60 px-3.5 text-xs font-medium text-[#d7cbc0] transition-colors hover:border-[#ff7a2f]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a2f]"
          >
            <Github className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <button
            ref={triggerRef}
            type="button"
            aria-expanded={curtainOpen}
            aria-controls={navId}
            aria-label={curtainOpen ? "Close site navigation" : "Open site navigation"}
            onClick={() => setCurtainOpen((prev) => !prev)}
            className="inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-full border border-[#ff7a2f]/45 bg-[#ff7a2f]/14 px-4 text-xs font-semibold tracking-[0.12em] text-[#fbf7f2] uppercase transition-colors hover:border-[#ff7a2f] hover:bg-[#ff7a2f] hover:text-[#140b05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a2f]"
          >
            {curtainOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Menu</span>
          </button>

          {/* Radial Curtain Sweep top-layer navigation dialog */}
          <dialog
            ref={dialogRef}
            id={navId}
            closedby="any"
            aria-labelledby={`${navId}-title`}
            onClose={() => setCurtainOpen(false)}
            className="clipcut-curtain-dialog"
          >
            <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/brand/clipcut-logo-white.svg?v=4"
                    alt="ClipCut"
                    className="h-9 w-auto"
                  />
                  <h2
                    id={`${navId}-title`}
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-xs font-semibold tracking-[0.16em] text-[#8f8176] uppercase outline-none"
                  >
                    Navigate ClipCut
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setCurtainOpen(false)}
                  aria-label="Close navigation curtain"
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-xs font-semibold tracking-[0.12em] text-[#fbf7f2] uppercase transition-colors hover:border-[#ff7a2f] hover:bg-[#ff7a2f] hover:text-[#140b05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a2f]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span>Close</span>
                </button>
              </div>

              <ul className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-12 md:gap-y-5">
                {PRIMARY_LINKS.map((item, idx) => (
                  <li key={item.num}>
                    <a
                      href={item.href}
                      onClick={(e) => handleLinkClick(e, item.href)}
                      className="clipcut-curtain-link group flex items-baseline justify-between gap-4 border-b border-white/10 py-3.5 transition-colors hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff7a2f]"
                      style={
                        {
                          "--link-accent": item.accent,
                          transitionDelay: `${idx * 35}ms`,
                        } as React.CSSProperties
                      }
                    >
                      <div className="flex items-baseline gap-4">
                        <span
                          className="text-xs font-semibold tabular-nums"
                          style={{ color: item.accent }}
                        >
                          {item.num}
                        </span>
                        <div>
                          <div className="font-serif text-3xl tracking-tight text-[#fbf7f2] transition-colors group-hover:text-[var(--link-accent)] sm:text-4xl">
                            {item.label}
                          </div>
                          <div className="mt-1 text-xs text-[#8f8176] group-hover:text-[#c8bbb0]">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-[#71717a] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--link-accent)]"
                      />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col justify-between gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] font-semibold tracking-[0.16em] text-[#71717a] uppercase">
                    Guides:
                  </span>
                  {DOC_SUBLINKS.map((doc) => (
                    <a
                      key={doc.href}
                      href={doc.href}
                      onClick={() => setCurtainOpen(false)}
                      className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-medium text-[#d7cbc0] transition-colors hover:border-white/30 hover:text-white"
                    >
                      {doc.label}
                    </a>
                  ))}
                </div>

                <div className="flex items-center gap-5 text-xs font-medium text-[#8f8176]">
                  <a href="/terms" onClick={() => setCurtainOpen(false)} className="hover:text-white">
                    Terms
                  </a>
                  <a href="/privacy" onClick={() => setCurtainOpen(false)} className="hover:text-white">
                    Privacy
                  </a>
                  <a
                    href="https://github.com/Chethankumar443/ClipCut"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ff9a5c] hover:text-white"
                  >
                    MIT Open Source
                  </a>
                </div>
              </div>
            </div>
          </dialog>
        </nav>
      </div>
    </header>
  );
}
