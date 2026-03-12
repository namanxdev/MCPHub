"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  content: string;
  icon: ReactNode;
  index: number;
}

export function FeatureCard({ title, description, content, icon, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full p-6 rounded-2xl glass glass-hover border-white/10">
        <motion.div
          className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4"
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-2xl">{icon}</div>
        </motion.div>

        <h3 className="text-xl font-bold mb-2 group-hover:glow-text transition-all duration-300">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-3 font-medium">
          {description}
        </p>
        
        <p className="text-sm text-muted-foreground/80 leading-relaxed">
          {content}
        </p>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
