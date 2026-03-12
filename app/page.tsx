"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

/* ─── Animation presets ─────────────────────────────────── */
const EASE_EXPO = [0.77, 0, 0.175, 1] as const;
const EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as const;

function LineReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "105%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.05, delay, ease: EASE_EXPO }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE_SMOOTH }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Features data ─────────────────────────────────────── */
const features = [
  {
    num: "01",
    title: "Connection Manager",
    tag: "SSE · Streamable HTTP",
    desc: "Connect to any MCP server in seconds. Enumerate every tool, resource, and prompt automatically. Zero configuration required.",
    href: "/playground",
  },
  {
    num: "02",
    title: "Tool Playground",
    tag: "Auto-generated forms",
    desc: "JSON Schema drives the UI. Fill in parameters, execute tools, inspect raw responses. The fastest feedback loop you've used.",
    href: "/playground",
  },
  {
    num: "03",
    title: "Protocol Inspector",
    tag: "JSON-RPC · Timing data",
    desc: "Every message between client and server, timestamped and searchable. Syntax highlighted. Nothing hidden.",
    href: "/inspector",
  },
  {
    num: "04",
    title: "Health Dashboard",
    tag: "P50 · P95 · P99",
    desc: "Latency percentiles, uptime history, error rates — tracked continuously. Built for teams shipping production services.",
    href: "/dashboard",
  },
  {
    num: "05",
    title: "Public Registry",
    tag: "Community · Live health",
    desc: "A searchable directory of MCP servers with real-time health badges. One click to open any server in the Playground.",
    href: "/registry",
  },
  {
    num: "06",
    title: "CLI Tool",
    tag: "npx mcphub test",
    desc: "Run protocol compliance checks from your terminal or CI pipeline. JSON output, exit codes, JUnit reports.",
    href: "/",
  },
] as const;

const stats = [
  { value: "6", label: "Core tools" },
  { value: "<1s", label: "Connect time" },
  { value: "0", label: "Config needed" },
  { value: "∞", label: "Compatible servers" },
];

const marqueeItems = [
  "Connect", "Debug", "Observe", "Monitor", "Deploy", "Test", "Inspect", "Iterate",
];

/* ─── Feature row ───────────────────────────────────────── */
function FeatureRow({
  num,
  title,
  tag,
  desc,
  href,
  index,
}: (typeof features)[number] & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: EASE_SMOOTH }}
    >
      <Link
        href={href}
        className="group flex flex-col md:grid md:grid-cols-[4rem_1fr_auto] items-start gap-4 md:gap-10 py-8 md:py-9 border-b border-white/[0.08] hover:border-white/20 transition-colors duration-300"
      >
        <span className="font-mono text-[10px] tracking-widest uppercase text-white/20 pt-[3px]">
          {num}
        </span>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[15px] md:text-base font-medium text-white group-hover:text-white/70 transition-colors duration-300">
              {title}
            </h3>
            <span className="font-mono text-[9px] tracking-widest uppercase text-white/20 border border-white/10 px-2 py-0.5">
              {tag}
            </span>
          </div>
          <p className="text-[13px] text-white/35 leading-[1.75] max-w-2xl">{desc}</p>
        </div>

        <span className="hidden md:block text-white/15 group-hover:text-white/50 text-lg transition-all duration-300 group-hover:translate-x-1 mt-[2px]">
          →
        </span>
      </Link>
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <div className="bg-[oklch(0.06_0_0)] text-[oklch(0.96_0_0)] overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-between overflow-hidden"
      >
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="flex-1 flex flex-col justify-center px-6 md:px-12 max-w-[1440px] mx-auto w-full pt-28 pb-16"
        >
          {/* Eyebrow */}
          <FadeIn delay={0.15} className="mb-10 md:mb-14">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">
              Model Context Protocol · Developer Platform
            </p>
          </FadeIn>

          {/* Headline — 3 lines with contrast */}
          <div className="mb-12 md:mb-16">
            <LineReveal delay={0.3}>
              <h1 className="text-[14vw] md:text-[11.5vw] lg:text-[10vw] font-bold leading-[0.87] tracking-[-0.035em] text-white">
                Every MCP
              </h1>
            </LineReveal>
            <LineReveal delay={0.45}>
              <h1 className="text-[14vw] md:text-[11.5vw] lg:text-[10vw] font-bold leading-[0.87] tracking-[-0.035em] text-white/20">
                server,
              </h1>
            </LineReveal>
            <LineReveal delay={0.6}>
              <h1 className="text-[14vw] md:text-[11.5vw] lg:text-[10vw] font-bold leading-[0.87] tracking-[-0.035em] text-white">
                at your command.
              </h1>
            </LineReveal>
          </div>

          {/* Sub-row */}
          <FadeIn
            delay={1.0}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <p className="text-[13px] md:text-sm text-white/35 leading-[1.8] max-w-[340px]">
              Connect, test, debug, and monitor any MCP server.<br />
              No config. No friction. Just results.
            </p>
            <div className="flex items-center gap-8">
              <Link
                href="/playground"
                className="text-sm text-white border-b border-white pb-px hover:text-white/55 hover:border-white/55 transition-colors duration-200"
              >
                Start building →
              </Link>
              <Link
                href="/registry"
                className="text-sm text-white/30 border-b border-white/15 pb-px hover:text-white/55 hover:border-white/40 transition-colors duration-200"
              >
                Browse registry →
              </Link>
            </div>
          </FadeIn>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="px-6 md:px-12 pb-10 max-w-[1440px] mx-auto w-full flex items-center gap-3"
        >
          <motion.div
            animate={{ scaleY: [1, 1.6, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-6 bg-white/15 origin-top"
          />
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/15">
            Scroll
          </span>
        </motion.div>
      </section>

      {/* ══ MARQUEE ═══════════════════════════════════════════ */}
      <div className="border-y border-white/[0.07] overflow-hidden py-4 select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-5 px-6 font-mono text-[10px] tracking-[0.25em] uppercase text-white/15"
            >
              {item}
              <span className="text-white/10">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section className="px-6 md:px-12 max-w-[1440px] mx-auto py-24 md:py-36">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_SMOOTH }}
          >
            <h2 className="text-xl md:text-2xl font-medium tracking-tight leading-snug">
              Everything you need.
              <br />
              <span className="text-white/30">Nothing you don&apos;t.</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_SMOOTH }}
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/20"
          >
            Six tools
          </motion.p>
        </div>

        <div className="border-t border-white/[0.08]">
          {features.map((feature, i) => (
            <FeatureRow key={feature.num} {...feature} index={i} />
          ))}
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] max-w-[1440px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.07]">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: EASE_SMOOTH }}
              className="bg-[oklch(0.06_0_0)] px-8 py-10 md:px-12 md:py-14"
            >
              <p className="text-[42px] md:text-6xl font-bold tracking-tight text-white mb-2 leading-none">
                {stat.value}
              </p>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/25">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] max-w-[1440px] mx-auto px-6 md:px-12 py-32 md:py-52">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE_SMOOTH }}
        >
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/25 mb-8">
            Ready to start
          </p>
          <h2 className="text-[9vw] md:text-[6vw] font-bold leading-[0.92] tracking-[-0.025em] mb-12">
            Stop testing blind.
            <br />
            <span className="text-white/30">Start knowing.</span>
          </h2>
          <div className="flex flex-wrap items-center gap-8">
            <Link
              href="/playground"
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-white text-[oklch(0.06_0_0)] text-sm font-medium hover:bg-white/85 transition-colors duration-200"
            >
              Open Playground →
            </Link>
            <Link
              href="/registry"
              className="text-sm text-white/35 border-b border-white/15 pb-px hover:text-white/65 hover:border-white/40 transition-colors duration-200"
            >
              Browse the registry
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}