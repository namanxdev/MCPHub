"use client";
import { motion, Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EASE_EXPO } from "@/lib/motion";

interface LineRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down";
  whileInView?: boolean;
}

export function LineReveal({ children, delay = 0, className = "", direction = "up", whileInView = false }: LineRevealProps) {
  const reduced = useReducedMotion();
  const yFrom = direction === "up" ? "105%" : "-105%";
  const variants: Variants = {
    hidden: { y: reduced ? "0%" : yFrom },
    visible: { y: "0%", transition: { duration: reduced ? 0 : 1.05, delay, ease: EASE_EXPO } },
  };
  const props = whileInView
    ? { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-60px" } }
    : { initial: "hidden", animate: "visible" };
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div variants={variants} {...props}>{children}</motion.div>
    </div>
  );
}
