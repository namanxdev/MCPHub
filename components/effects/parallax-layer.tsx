"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxLayer({ children, speed = 0.3, className }: ParallaxLayerProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : [`${-speed * 100}%`, `${speed * 100}%`]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
