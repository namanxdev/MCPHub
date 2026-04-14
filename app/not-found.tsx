"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden border-b-2 border-foreground/10 bg-background pt-16 md:pt-0">
      {/* Stark grid background matching home page */}
      <div 
        className="absolute inset-0 opacity-[0.03] z-0" 
        style={{ 
          backgroundImage: "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)", 
          backgroundSize: "4rem 4rem" 
        }} 
      />
      
      <div className="relative z-10 px-6 md:px-12 w-full max-w-[1800px] mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <p className="text-sm md:text-base tracking-[0.3em] uppercase text-foreground/60 font-mono">
            Error 404 — Page Not Found
          </p>
        </motion.div>

        <h1 className="text-[14vw] md:text-[12vw] lg:text-[11vw] font-bold leading-[0.8] tracking-[-0.05em] mb-12 uppercase flex flex-col items-center">
          <div className="overflow-hidden">
            <motion.span
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.4, ease: [0.77, 0, 0.175, 1] }}
              className="inline-block"
            >
              LOST.
            </motion.span>
          </div>
          <div className="overflow-hidden mix-blend-difference text-foreground/90">
            <motion.span
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.4, delay: 0.2, ease: [0.77, 0, 0.175, 1] }}
              className="inline-block"
            >
              IN.
            </motion.span>
          </div>
          <div className="overflow-hidden">
            <motion.span
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.77, 0, 0.175, 1] }}
              className="inline-block"
            >
              VOID.
            </motion.span>
          </div>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-xl md:text-2xl max-w-2xl text-foreground/60 mb-16 leading-[1.6] font-medium mx-auto"
        >
          The page you are looking for has been moved, deleted, or never existed in the first place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex justify-center"
        >
          <Link
            href="/"
            className="group relative inline-flex items-center gap-3 px-12 py-6 text-lg font-medium overflow-hidden bg-foreground text-background transition-all duration-300 hover:scale-105 rounded-none"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="relative z-10">Return to Base</span>
          </Link>
        </motion.div>
      </div>

      {/* Minimal geometric accents matching home page */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute top-1/2 left-[-10%] w-[600px] h-[600px] border border-foreground/5 rounded-full -translate-y-1/2 pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.7 }}
        className="absolute top-1/2 right-[10%] w-[400px] h-[400px] border border-foreground/5 rounded-full -translate-y-1/2 pointer-events-none"
      />
    </div>
  );
}
