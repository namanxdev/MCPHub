"use client";

import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Search & Web", value: "Search & Web" },
  { label: "Database & Storage", value: "Database & Storage" },
  { label: "DevOps & Infrastructure", value: "DevOps & Infrastructure" },
  { label: "Communication", value: "Communication" },
  { label: "File System & Documents", value: "File System & Documents" },
  { label: "AI & ML", value: "AI & ML" },
  { label: "Development Tools", value: "Development Tools" },
  { label: "Other", value: "Other" },
] as const;

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onChange(cat.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
            selected === cat.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export { CATEGORIES };
