import React from "react";
import {
  BookOpen,
  Cpu,
  Gamepad2,
  Rocket,
  Server,
  Shield,
  FileText,
  CheckCircle2,
} from "lucide-react";
import BranchedMenu from "./react-bits/BranchedMenu";

interface DocsSidebarProps {
  currentPath: string;
}

const ITEMS = [
  {
    label: "Getting started",
    children: [
      { value: "/docs", label: "Overview", icon: BookOpen },
      { value: "/docs/quickstart", label: "Quick start", icon: Rocket },
    ],
  },
  {
    label: "Guides & Reference",
    children: [
      { value: "/docs/ai-providers", label: "AI & Speech", icon: Cpu },
      { value: "/docs/deployment", label: "Deployment", icon: Server },
      { value: "/docs/gaming-mode", label: "Gaming mode", icon: Gamepad2 },
    ],
  },
  {
    label: "Legal",
    children: [
      { value: "/terms", label: "Terms", icon: FileText },
      { value: "/privacy", label: "Privacy", icon: Shield },
      { value: "/acceptable-use", label: "Acceptable use", icon: CheckCircle2 },
    ],
  },
];

export default function DocsSidebar({ currentPath }: DocsSidebarProps) {
  return (
    <div className="rounded-2xl border border-[#fff4e8]/10 bg-[#15100d] p-5">
      <BranchedMenu
        items={ITEMS}
        defaultOpen={[0, 1, 2]}
        defaultActive={currentPath}
        onSelect={(value: string) => {
          if (typeof window !== "undefined" && value.startsWith("/")) {
            window.location.href = value;
          }
        }}
        color="#fbf7f2"
        accentColor="#ff7a2f"
        lineColor="#3b2f28"
        width={220}
      />
    </div>
  );
}
