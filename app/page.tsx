"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";

const TextReveal = ({ children, delay = 0 }: { children: string; delay?: number }) => {
  return (
    <motion.span
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      transition={{
        duration: 1.4,
        delay,
        ease: [0.77, 0, 0.175, 1],
      }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
};

const CharReveal = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const chars = text.split("");
  return (
    <>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.03,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </>
  );
};

const MagneticButton = ({ children, href }: { children: React.ReactNode; href: string }) => {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = clientX - left - width / 2;
    const y = clientY - top - height / 2;
    
    e.currentTarget.style.setProperty("--x", `${x * 0.3}px`);
    e.currentTarget.style.setProperty("--y", `${y * 0.3}px`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.setProperty("--x", "0px");
    e.currentTarget.style.setProperty("--y", "0px");
  };

  return (
    <Link
      href={href}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="magnetic-button group relative inline-flex items-center gap-3 px-12 py-6 text-lg font-medium overflow-hidden bg-foreground text-background transition-all duration-300 hover:scale-105 rounded-none"
      style={{
        transform: "translate(var(--x, 0), var(--y, 0))",
        transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <span className="relative z-10">{children}</span>
      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
    </Link>
  );
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative bg-background">
      {/* Hero Section - Full height with massive typography */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden border-b-2 border-foreground/10">
        {/* Stark grid background */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)", 
            backgroundSize: "4rem 4rem" 
          }} 
        />
        
        <motion.div style={{ y, opacity }} className="relative z-10 px-6 md:px-12 w-full max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <p className="text-sm md:text-base tracking-[0.3em] uppercase text-foreground/60 font-mono">
              <CharReveal text="POSTMAN FOR MCP" delay={0.3} />
            </p>
          </motion.div>

          <h1 className="text-[14vw] md:text-[12vw] lg:text-[11vw] font-bold leading-[0.8] tracking-[-0.05em] mb-12 uppercase">
            <div className="overflow-hidden">
              <TextReveal delay={0.6}>BUILD.</TextReveal>
            </div>
            <div className="overflow-hidden mix-blend-difference text-foreground/90">
              <TextReveal delay={0.8}>TEST.</TextReveal>
            </div>
            <div className="overflow-hidden">
              <TextReveal delay={1.0}>SHIP.</TextReveal>
            </div>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="text-xl md:text-2xl max-w-3xl text-foreground/60 mb-16 leading-[1.6] font-medium"
          >
            The definitive platform for developing, debugging, and deploying Model Context Protocol servers.
            No compromises. No bloat. Just tools that work.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="flex flex-wrap gap-6"
          >
            <MagneticButton href="/playground">Start Testing</MagneticButton>
            <Link
              href="https://github.com/namanxdev/MCPHub"
              className="inline-flex items-center gap-3 px-12 py-6 text-lg font-medium border border-foreground/20 text-foreground transition-all hover:bg-foreground hover:text-background"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </Link>
          </motion.div>
        </motion.div>

        {/* Minimal geometric accent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-1/2 right-[-10%] w-[600px] h-[600px] border border-foreground/5 rounded-full -translate-y-1/2 pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.7 }}
          className="absolute top-1/2 right-[0%] w-[400px] h-[400px] border border-foreground/5 rounded-full -translate-y-1/2 pointer-events-none"
        />
      </section>

      {/* Marquee Section */}
      <div className="border-b-2 border-foreground/10 py-4 select-none overflow-hidden relative">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(6)].fill(["PROTOCOL", "INSPECT", "OBSERVE", "DEBUG"]).flat().map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-10 px-8 font-mono text-sm tracking-[0.25em] text-foreground/30"
            >
              {item}
              <span className="text-foreground/10">+</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features - Technical Grid layout */}
      <section className="relative py-32 border-b-2 border-foreground/10 bg-background">
        <div className="px-6 md:px-12 max-w-[1800px] mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-[8vw] md:text-[6vw] font-bold tracking-[-0.04em] mb-24 uppercase"
          >
            WHAT YOU GET
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 md:border-t-2 md:border-l-2 border-foreground/10">
            {[
              {
                num: "01",
                title: "Connection Manager",
                desc: "SSE and Streamable HTTP support. Enumerate tools, resources, prompts. Zero configuration.",
              },
              {
                num: "02",
                title: "Tool Playground",
                desc: "Auto-generated forms. Real-time execution. Instant feedback. Test anything, anywhere.",
              },
              {
                num: "03",
                title: "Protocol Inspector",
                desc: "JSON-RPC message viewer. Timing data. Syntax highlighting. Complete transparency.",
              },
              {
                num: "04",
                title: "Health Dashboard",
                desc: "Latency metrics. Error tracking. Uptime monitoring. P50/P95/P99. Production-ready.",
              },
              {
                num: "05",
                title: "Public Registry",
                desc: "Searchable directory. Community servers. Live health data. One-click testing.",
              },
              {
                num: "06",
                title: "CLI Tool",
                desc: "npx mcphub test. CI/CD ready. Exit codes. JSON output. Automation first.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.num}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="group relative p-10 md:p-14 border-b-2 md:border-r-2 border-foreground/10 hover:bg-foreground/5 transition-colors duration-500"
              >
                <div className="flex justify-between items-start mb-12">
                  <div className="font-mono text-sm tracking-widest text-foreground/40">{feature.num}</div>
                  <ArrowRight className="w-6 h-6 text-foreground/10 group-hover:text-foreground/40 group-hover:-rotate-45 transition-all duration-300" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-[-0.02em]">
                  {feature.title}
                </h3>
                <p className="text-lg text-foreground/60 leading-[1.6] max-w-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Brutalist counts */}
      <section className="border-b-2 border-foreground/10 border-t-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x-2 divide-y-0 divide-foreground/10">
          {[
            { value: "6", label: "Core tools" },
            { value: "<1s", label: "Connect time" },
            { value: "0", label: "Config needed" },
            { value: "∞", label: "Frameworks" },
          ].map((stat, i) => (
            <div key={i} className="p-12 md:p-16 flex flex-col items-start justify-center text-left hover:bg-foreground hover:text-background transition-colors duration-500 border-b-2 lg:border-b-0 border-foreground/10">
              <div className="text-[10vw] md:text-[6vw] font-bold leading-none tracking-tighter mb-4">
                {stat.value}
              </div>
              <div className="font-mono text-sm tracking-widest uppercase opacity-60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section - Stark */}
      <section className="relative py-48 border-b-2 border-foreground/10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)", 
            backgroundSize: "4rem 4rem" 
          }} 
        />
        <div className="px-6 md:px-12 max-w-[1800px] mx-auto text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-[12vw] md:text-[10vw] font-bold tracking-[-0.05em] mb-12 leading-[0.85] uppercase"
          >
            BUILT FOR
            <br />
            PRODUCTION
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-foreground/60 mb-16 max-w-2xl mx-auto font-medium"
          >
            Every feature designed for teams shipping real products.
            <br />
            No hand-holding. No bloat. Just power.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <MagneticButton href="/registry">Explore Registry</MagneticButton>
          </motion.div>
        </div>
      </section>


    </div>
  );
}
