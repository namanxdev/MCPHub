"use client";
import { motion } from "framer-motion";

interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
  whileInView?: boolean;
}

export function StaggerGroup({ children, className, staggerDelay = 0.08, delayChildren = 0, whileInView = true }: StaggerGroupProps) {
  const variants = {
    hidden: {},
    visible: { transition: { staggerChildren: staggerDelay, delayChildren } },
  };
  const props = whileInView
    ? { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-60px" } }
    : { initial: "hidden", animate: "visible" };
  return (
    <motion.div className={className} variants={variants} {...props}>
      {children}
    </motion.div>
  );
}
