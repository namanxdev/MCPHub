"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type CursorState = "idle" | "pointer" | "text" | "magnetic" | "hidden";

const DOT_SPRING = { damping: 28, stiffness: 700, mass: 0.3 };
const RING_SPRING = { damping: 32, stiffness: 200, mass: 0.8 };

function getCursorState(target: HTMLElement): CursorState {
  // Walk up the DOM to find a data-cursor attribute
  let el: HTMLElement | null = target;
  while (el) {
    const attr = el.getAttribute("data-cursor");
    if (attr === "hide") return "hidden";
    if (attr === "magnetic") return "magnetic";
    if (attr === "text") return "text";
    if (attr === "pointer") return "pointer";
    el = el.parentElement;
  }
  // Fallback: check computed cursor style or element type
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return "text";
  if (
    tag === "A" ||
    tag === "BUTTON" ||
    target.closest("button") ||
    target.closest("a") ||
    window.getComputedStyle(target).cursor === "pointer"
  ) {
    return "pointer";
  }
  return "idle";
}

export function CustomCursor() {
  const reduced = useReducedMotion();
  const [isTouch, setIsTouch] = useState(true); // start hidden until confirmed mouse
  const [state, setState] = useState<CursorState>("idle");
  const [mounted, setMounted] = useState(false);

  // Dot position (fast)
  const dotX = useMotionValue(-200);
  const dotY = useMotionValue(-200);
  const dotXS = useSpring(dotX, DOT_SPRING);
  const dotYS = useSpring(dotY, DOT_SPRING);

  // Ring position (lagged)
  const ringX = useMotionValue(-200);
  const ringY = useMotionValue(-200);
  const ringXS = useSpring(ringX, RING_SPRING);
  const ringYS = useSpring(ringY, RING_SPRING);

  useEffect(() => {
    setMounted(true);
    // Detect touch device
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setIsTouch(false);

    const onMove = (e: MouseEvent) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);
      setState(getCursorState(e.target as HTMLElement));
    };
    const onLeave = () => setState("hidden");
    const onEnter = () => setState("idle");

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [dotX, dotY, ringX, ringY]);

  if (!mounted || isTouch || reduced) return null;

  const isHidden = state === "hidden";
  const isPointer = state === "pointer" || state === "magnetic";
  const isText = state === "text";

  return (
    <>
      {/* Outer ring — lagged follower */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full border border-white/25 mix-blend-difference"
        style={{
          x: ringXS,
          y: ringYS,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isPointer ? 48 : isText ? 2 : 36,
          height: isPointer ? 48 : isText ? 32 : 36,
          opacity: isHidden ? 0 : isText ? 0.6 : 0.4,
          borderRadius: isText ? "1px" : "50%",
          backdropFilter: isPointer ? "blur(4px)" : "none",
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Inner dot — tight follower */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-white mix-blend-difference"
        style={{
          x: dotXS,
          y: dotYS,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isPointer ? 6 : isText ? 2 : 8,
          height: isPointer ? 6 : isText ? 20 : 8,
          opacity: isHidden ? 0 : 1,
          borderRadius: isText ? "1px" : "50%",
          scaleX: isPointer ? 1.2 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  );
}
