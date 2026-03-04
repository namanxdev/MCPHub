"use client";

import { Button } from "@/components/ui/button";

const ranges = [
  { label: "24h", value: "24h" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

export function TimeRangeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {ranges.map((r) => (
        <Button
          key={r.value}
          size="sm"
          variant={value === r.value ? "default" : "outline"}
          onClick={() => onChange(r.value)}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
