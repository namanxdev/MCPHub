"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/effects/magnetic";
import { EASE_SMOOTH, EASE_CINEMATIC } from "@/lib/motion";

const navLinks = [
  { href: "/playground", label: "Playground", desc: "Connect to any MCP server and run its tools in seconds." },
  { href: "/registry", label: "Registry", desc: "Browse the public directory of MCP servers with live health badges." },
  { href: "/inspector", label: "Inspector", desc: "Capture and inspect every JSON-RPC message with timing data." },
  { href: "/dashboard", label: "Dashboard", desc: "Latency percentiles, uptime history, and error rates." },
];

function NavLink({ href, label, desc, isActive }: { href: string; label: string; desc: string; isActive: boolean }) {
  return (
    <HoverCard.Root openDelay={150} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <Magnetic strength={0.25}>
          <Link href={href} className="relative group flex flex-col items-center">
            <span className={cn(
              "text-[13px] tracking-[0.12em] uppercase transition-colors duration-200",
              isActive ? "text-white" : "text-white/40 hover:text-white/75"
            )}>
              {label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-1 left-0 right-0 h-px bg-white/50"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        </Magnetic>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="center"
          sideOffset={12}
          className="z-50 w-52 rounded-sm border border-white/[0.08] bg-[oklch(0.08_0_0)] p-4 shadow-xl"
          asChild
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: EASE_SMOOTH }}
          >
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/30 mb-2">{label}</p>
            <p className="text-[12px] text-white/50 leading-[1.6]">{desc}</p>
          </motion.div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 bg-[oklch(0.06_0_0)] flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
        >
          <div className="h-14 flex items-center justify-between px-6">
            <span className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase text-white">MCPHub</span>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1" aria-label="Close menu">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
          <nav className="flex flex-col px-6 pt-8 gap-6">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.1, duration: 0.4, ease: EASE_SMOOTH }}
              >
                <Link href={link.href} onClick={onClose} className="text-2xl font-medium text-white/70 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AnimatedNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      setVisible(y < 30 || y < lastY);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 inset-x-0 z-[60] h-px bg-white/30 origin-left"
        style={{ scaleX: progressScaleX }}
      />

      <motion.header
        initial={{ y: -60 }}
        animate={{ y: visible ? 0 : -60 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-colors duration-500",
          scrolled
            ? "border-b border-white/[0.07] bg-[oklch(0.06_0_0)]/90 backdrop-blur-sm"
            : "bg-transparent"
        )}
      >
        <nav className="max-w-[1440px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          {/* Wordmark */}
          <Magnetic strength={0.2}>
            <Link href="/" className="font-mono text-[13px] font-bold tracking-[0.18em] uppercase text-white hover:text-white/70 transition-colors duration-200">
              MCPHub
            </Link>
          </Magnetic>

          {/* Center nav — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} isActive={pathname === link.href} />
            ))}
          </div>

          {/* Right: CTA + hamburger */}
          <div className="flex items-center gap-4">
            <Link
              href="/playground"
              className="hidden md:block text-[13px] tracking-[0.12em] uppercase text-white/40 hover:text-white/80 transition-colors duration-200"
            >
              Get started →
            </Link>
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex flex-col gap-[5px] p-1"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-5 h-px bg-white/60 block"
                  animate={{ opacity: 1 }}
                />
              ))}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
