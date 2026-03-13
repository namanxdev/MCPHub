"use client";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useInView,
  animate,
  AnimatePresence,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { LineReveal } from "@/components/effects/line-reveal";
import { FadeIn } from "@/components/effects/fade-in";
import { StaggerGroup } from "@/components/effects/stagger-group";
import { HorizontalScroll } from "@/components/effects/horizontal-scroll";
import { EASE_EXPO, EASE_SMOOTH } from "@/lib/motion";

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
  { value: "6", label: "Core tools", numeric: 6 },
  { value: "<1s", label: "Connect time", numeric: null },
  { value: "0", label: "Config needed", numeric: 0 },
  { value: "∞", label: "Compatible servers", numeric: null },
];

const marqueeItems = [
  "Connect", "Debug", "Observe", "Monitor", "Deploy", "Test", "Inspect", "Iterate",
];

const steps = [
  {
    num: "01",
    title: "Connect",
    desc: "Point MCPHub at any MCP server endpoint. SSE, Streamable HTTP, or stdio — it just works.",
    icon: "→",
  },
  {
    num: "02",
    title: "Explore",
    desc: "Every tool, resource, and prompt is automatically enumerated and documented. Click to run any of them.",
    icon: "⬡",
  },
  {
    num: "03",
    title: "Monitor",
    desc: "Every JSON-RPC message is captured, timestamped, and visualised. Latency metrics update in real time.",
    icon: "◈",
  },
];

const testimonials = [
  {
    quote: "MCPHub cut our MCP debugging time by 80%. The inspector alone is worth it.",
    author: "Engineer, AI startup",
  },
  {
    quote: "Finally a tool that treats MCP as a first-class protocol. The playground is brilliant.",
    author: "Open-source contributor",
  },
  {
    quote: "We use MCPHub in CI to validate every server release. Zero config, just works.",
    author: "Platform engineer",
  },
];

/* ─── CountUp ───────────────────────────────────────────── */
function CountUp({ to, duration = 1.5 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (inView) animate(motionVal, to, { duration, ease: EASE_SMOOTH });
  }, [inView, to, duration, motionVal]);

  return (
    <motion.p
      ref={ref}
      className="text-[42px] md:text-6xl font-bold tracking-tight text-white mb-2 leading-none"
    >
      {rounded}
    </motion.p>
  );
}

/* ─── StepCard ──────────────────────────────────────────── */
function StepCard({
  num,
  title,
  desc,
  icon,
  index,
}: (typeof steps)[number] & { index: number }) {
  return (
    <motion.div
      className="w-[min(80vw,420px)] md:w-[360px] shrink-0 border border-white/[0.08] p-8 md:p-10"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: EASE_EXPO }}
    >
      <div className="flex items-start justify-between mb-8">
        <span className="font-mono text-[11px] tracking-widest uppercase text-white/20">
          {num}
        </span>
        <span className="text-2xl text-white/10">{icon}</span>
      </div>
      <h3 className="text-lg font-medium text-white mb-3">{title}</h3>
      <p className="text-[13px] text-white/35 leading-[1.75]">{desc}</p>
    </motion.div>
  );
}

/* ─── TestimonialCarousel ───────────────────────────────── */
function TestimonialCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <span className="font-mono text-[120px] leading-none text-white/[0.03] absolute -top-8 -left-4 select-none">
        &ldquo;
      </span>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: EASE_SMOOTH }}
          className="relative z-10"
        >
          <p className="text-xl md:text-2xl font-medium text-white/80 leading-relaxed max-w-2xl mb-6">
            &ldquo;{testimonials[index].quote}&rdquo;
          </p>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/25">
            — {testimonials[index].author}
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-2 mt-8">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-6 h-px transition-colors duration-300 ${
              i === index ? "bg-white/60" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── FeatureRow ────────────────────────────────────────── */
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
        <span className="font-mono text-[11px] tracking-widest uppercase text-white/20 pt-[3px]">
          {num}
        </span>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[15px] md:text-base font-medium text-white group-hover:text-white/70 transition-colors duration-300">
              {title}
            </h3>
            <span className="font-mono text-[11px] tracking-widest uppercase text-white/20 border border-white/10 px-2 py-0.5">
              {tag}
            </span>
          </div>
          <p className="text-[13px] text-white/35 leading-[1.75] max-w-2xl">{desc}</p>
        </div>

        <motion.span
          className="hidden md:block text-white/15 group-hover:text-white/50 text-lg transition-colors duration-300 mt-[2px]"
          whileHover={{ x: 6 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          →
        </motion.span>
      </Link>
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function Home() {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroContainerRef,
    offset: ["start start", "end start"],
  });

  const heroFadeOut = useTransform(scrollYProgress, [0.5, 0.8], [1, 0]);
  const orbIntensityRaw = useTransform(scrollYProgress, [0, 0.5], [0.3, 0.7]);

  // Convert motion value to CSS template string for the background gradient
  const orbBackground = useTransform(
    orbIntensityRaw,
    (intensity) =>
      `radial-gradient(ellipse 60% 50% at 70% 60%, oklch(0.2 0 0 / ${intensity}) 0%, transparent 70%)`
  );

  return (
    <div className="bg-[oklch(0.06_0_0)] text-[oklch(0.96_0_0)] overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <div ref={heroContainerRef} className="relative" style={{ height: "250vh" }}>
        <motion.div
          style={{ opacity: heroFadeOut }}
          className="sticky top-0 h-screen flex flex-col justify-between overflow-hidden"
        >
          {/* Radial gradient orb background */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: orbBackground }}
          />

          {/* Main content */}
          <div className="relative flex-1 flex flex-col justify-center px-6 md:px-12 max-w-[1440px] mx-auto w-full pt-28 pb-16">
            {/* Eyebrow */}
            <FadeIn delay={0.15} className="mb-10 md:mb-14">
              <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/30">
                Model Context Protocol · Developer Platform
              </p>
            </FadeIn>

            {/* Headline — 3 lines */}
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
          </div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="relative px-6 md:px-12 pb-10 max-w-[1440px] mx-auto w-full flex items-center gap-3"
          >
            <motion.div
              animate={{ scaleY: [1, 1.6, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-6 bg-white/15 origin-top"
            />
            <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/15">
              Scroll
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* ══ MARQUEE ═══════════════════════════════════════════ */}
      <div className="border-y border-white/[0.07] py-3 select-none overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee mb-1">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-5 px-6 font-mono text-[11px] tracking-[0.25em] uppercase text-white/15"
            >
              {item}
              <span className="text-white/10">·</span>
            </span>
          ))}
        </div>
        <div className="flex whitespace-nowrap animate-marquee-reverse">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-5 px-6 font-mono text-[11px] tracking-[0.25em] uppercase text-white/10"
            >
              {item}
              <span className="text-white/[0.06]">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section className="px-6 md:px-12 max-w-[1440px] mx-auto py-24 md:py-36">
        <StaggerGroup whileInView className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_SMOOTH } },
            }}
          >
            <h2 className="text-xl md:text-2xl font-medium tracking-tight leading-snug">
              Everything you need.
              <br />
              <span className="text-white/30">Nothing you don&apos;t.</span>
            </h2>
          </motion.div>
          <motion.p
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.6, ease: EASE_SMOOTH } },
            }}
            className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/20"
          >
            Six tools
          </motion.p>
        </StaggerGroup>

        <div className="border-t border-white/[0.08]">
          {features.map((feature, i) => (
            <FeatureRow key={feature.num} {...feature} index={i} />
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
      <section className="py-24 md:py-36 overflow-hidden">
        <div className="px-6 md:px-12 max-w-[1440px] mx-auto mb-12">
          <FadeIn whileInView>
            <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/25 mb-4">
              How it works
            </p>
            <h2 className="text-xl md:text-2xl font-medium tracking-tight">
              From zero to insights<br />
              <span className="text-white/30">in three steps.</span>
            </h2>
          </FadeIn>
        </div>

        {/* Desktop: horizontal scroll */}
        <div className="hidden md:block">
          <HorizontalScroll>
            {steps.map((step, i) => (
              <StepCard key={i} {...step} index={i} />
            ))}
          </HorizontalScroll>
        </div>

        {/* Mobile: vertical stack */}
        <div className="md:hidden px-6 space-y-6">
          {steps.map((step, i) => (
            <StepCard key={i} {...step} index={i} />
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
              {stat.numeric !== null ? (
                <CountUp to={stat.numeric} />
              ) : (
                <p className="text-[42px] md:text-6xl font-bold tracking-tight text-white mb-2 leading-none">
                  {stat.value}
                </p>
              )}
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/25">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] py-24 md:py-36">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <FadeIn whileInView className="mb-16">
            <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/25">
              What developers say
            </p>
          </FadeIn>
          <TestimonialCarousel />
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
          <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/25 mb-8">
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
