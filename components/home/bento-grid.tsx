"use client";

import { motion } from "framer-motion";
import { Code2, Sparkles, Zap, Shield } from "lucide-react";

const bentoItems = [
  {
    icon: Code2,
    title: "Developer First",
    description: "Built by developers, for developers. Clean APIs and intuitive interfaces.",
    className: "md:col-span-2 md:row-span-2",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Sparkles,
    title: "Real-time",
    description: "Watch protocol messages in real-time as they happen.",
    className: "md:col-span-1",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed and performance.",
    className: "md:col-span-1",
    gradient: "from-orange-500/20 to-yellow-500/20",
  },
  {
    icon: Shield,
    title: "Secure",
    description: "Enterprise-grade security and privacy.",
    className: "md:col-span-2",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
];

export function BentoGrid() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Why Developers Love It
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make MCP development a breeze
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
          {bentoItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -4 }}
              className={`group relative ${item.className}`}
            >
              <div className={`absolute inset-0 bg-linear-to-br ${item.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative h-full p-8 rounded-2xl glass glass-hover border-white/10 flex flex-col justify-between">
                <div>
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-linear-to-br from-white/10 to-white/5 flex items-center justify-center mb-4"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <item.icon className="w-6 h-6" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>

                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-white/0 via-white/50 to-white/0 rounded-full"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
