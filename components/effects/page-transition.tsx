"use client";
import { motion } from "framer-motion";
import { EASE_CINEMATIC } from "@/lib/motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
    >
      {children}
    </motion.div>
  );
}
