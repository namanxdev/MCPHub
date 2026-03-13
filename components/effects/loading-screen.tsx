"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_EXPO, EASE_CINEMATIC } from "@/lib/motion";

export function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const chars = "MCPHUB".split("");

  useEffect(() => {
    if (sessionStorage.getItem("mcphub-loaded")) {
      return;
    }
    setVisible(true);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setDone(true);
          sessionStorage.setItem("mcphub-loaded", "1");
          setTimeout(() => setVisible(false), 600);
        }, 300);
      }
      setProgress(Math.min(Math.round(p), 100));
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10000] bg-[oklch(0.06_0_0)] flex flex-col items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_CINEMATIC }}
        >
          <div className="flex gap-1 mb-8">
            {chars.map((ch, i) => (
              <motion.span
                key={i}
                className="font-mono text-4xl font-bold tracking-[0.2em] text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.6, ease: EASE_EXPO }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="w-48 h-px bg-white/10 relative overflow-hidden"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-white"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </motion.div>
          <motion.span
            className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/20 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {String(progress).padStart(3, "0")}
          </motion.span>
          <button
            className="absolute bottom-8 right-8 font-mono text-[10px] tracking-[0.2em] uppercase text-white/20 hover:text-white/50 transition-colors"
            onClick={() => {
              sessionStorage.setItem("mcphub-loaded", "1");
              setVisible(false);
            }}
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
