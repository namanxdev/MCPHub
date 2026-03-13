"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["0%", "-66.67%"]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className="relative h-[220vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <motion.div className={`flex gap-8 ${className ?? ""}`} style={{ x }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
