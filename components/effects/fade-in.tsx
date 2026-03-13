"use client";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EASE_SMOOTH } from "@/lib/motion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  whileInView?: boolean;
  y?: number;
}

export function FadeIn({ children, delay = 0, className = "", whileInView = false, y = 16 }: FadeInProps) {
  const reduced = useReducedMotion();
  const initial = { opacity: 0, y: reduced ? 0 : y };
  const animate = { opacity: 1, y: 0 };
  const transition = { duration: reduced ? 0 : 0.7, delay, ease: EASE_SMOOTH };
  const props = whileInView
    ? { initial, whileInView: animate, viewport: { once: true, margin: "-40px" }, transition }
    : { initial, animate, transition };
  return <motion.div className={className} {...props}>{children}</motion.div>;
}
