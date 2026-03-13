"use client";
import { motion, Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp } from "@/lib/motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
}

export function ScrollReveal({ children, variants, delay = 0, className }: ScrollRevealProps) {
  const reduced = useReducedMotion();
  const v = variants ?? fadeUp;
  return (
    <motion.div
      className={className}
      variants={v}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      {...(reduced ? { animate: "visible" } : {})}
    >
      {children}
    </motion.div>
  );
}
