"use client";
import { useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SPRING_MAGNETIC } from "@/lib/motion";

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({ children, strength = 0.3, className }: MagneticProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [, setIsHovered] = useState(false);
  const mouseX = useSpring(0, SPRING_MAGNETIC);
  const mouseY = useSpring(0, SPRING_MAGNETIC);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x * strength);
    mouseY.set(y * strength);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: mouseX, y: mouseY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
