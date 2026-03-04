"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onChange: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export function SearchBar({
  onChange,
  placeholder = "Search servers...",
  initialValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(value);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onChange]);

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
