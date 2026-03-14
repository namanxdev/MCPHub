"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
}

export interface DocsSidebarProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function DocsSidebar({ items, activeId, onSelect }: DocsSidebarProps) {
  return (
    <nav className="flex flex-col gap-2 relative">
      <div className="text-xs font-mono font-bold tracking-widest text-foreground/40 uppercase mb-4 pl-4">
        Contents
      </div>
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "relative px-4 py-2 text-left text-sm font-medium transition-colors duration-200 outline-none",
              isActive ? "text-foreground" : "text-foreground/60 hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="docs-active-nav"
                className="absolute inset-0 bg-foreground/5 border-l-2 border-foreground rounded-r-md"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
