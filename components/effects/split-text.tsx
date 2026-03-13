"use client";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EASE_EXPO } from "@/lib/motion";

interface SplitTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  whileInView?: boolean;
}

export function SplitText({ text, className, wordClassName, delay = 0, stagger = 0.05, as: Tag = "p", whileInView = false }: SplitTextProps) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : stagger, delayChildren: delay } },
  };
  const word = {
    hidden: { y: reduced ? "0%" : "110%", opacity: reduced ? 1 : 0 },
    visible: { y: "0%", opacity: 1, transition: { duration: reduced ? 0 : 0.8, ease: EASE_EXPO } },
  };
  const containerProps = whileInView
    ? { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-60px" } }
    : { initial: "hidden", animate: "visible" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionTag = motion[Tag] as any;
  return (
    <MotionTag className={className} variants={container} {...containerProps}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span className={`inline-block ${wordClassName ?? ""}`} variants={word}>
            {w}{i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
