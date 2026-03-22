"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/effects/magnetic";
import { EASE_SMOOTH, EASE_CINEMATIC } from "@/lib/motion";
import { UserMenu } from "@/components/auth/user-menu";
import { ArrowRight } from "lucide-react";

const navLinks = [
  { href: "/playground", label: "Playground", desc: "Connect to any MCP server and run its tools in seconds." },
  { href: "/registry", label: "Registry", desc: "Browse the public directory of MCP servers with live health badges." },
  { href: "/inspector", label: "Inspector", desc: "Capture and inspect every JSON-RPC message with timing data." },
  { href: "/dashboard", label: "Dashboard", desc: "Latency percentiles, uptime history, and error rates." },
  { href: "/docs", label: "Docs", desc: "Learn how to use MCP servers, credentials, and CLI tools." },
];

function NavLink({ href, label, desc, isActive }: { href: string; label: string; desc: string; isActive: boolean }) {
  return (
    <HoverCard.Root openDelay={150} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <Magnetic strength={0.25}>
          <Link href={href} className="relative group flex flex-col items-center">
            <span className={cn(
              "text-xs md:text-sm font-mono tracking-widest uppercase transition-colors duration-200",
              isActive ? "text-foreground font-bold" : "text-foreground/50 hover:text-foreground hover:font-bold"
            )}>
              {label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-2 left-0 right-0 h-0.5 bg-foreground"
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
          sideOffset={24}
          className="z-50 w-64 rounded-none border-2 border-foreground bg-background p-6 shadow-2xl"
          asChild
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: EASE_SMOOTH }}
          >
            <p className="font-mono text-sm font-bold tracking-widest uppercase text-foreground mb-3">{label}</p>
            <p className="text-sm text-foreground/70 leading-[1.6]">{desc}</p>
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
          className="fixed inset-0 z-40 bg-background flex flex-col pt-16"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
        >
          {/* Subtle grid background for menu */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
              backgroundImage: "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)", 
              backgroundSize: "4rem 4rem" 
            }} 
          />
          
          <nav className="flex flex-col border-t-2 border-foreground/10 h-full">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.1, duration: 0.4, ease: EASE_SMOOTH }}
                className="border-b-2 border-foreground/10"
              >
                <Link 
                  href={link.href} 
                  onClick={onClose} 
                  className="flex items-center justify-between p-8 text-3xl font-bold text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all w-full uppercase"
                >
                  {link.label}
                  <ArrowRight className="w-8 h-8 opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              </motion.div>
            ))}
            <div className="p-8 mt-auto">
              <Link 
                href="/playground" 
                onClick={onClose}
                className="inline-flex items-center justify-center w-full bg-foreground text-background font-medium py-6 text-xl tracking-tight hover:scale-[1.02] transition-transform"
              >
                GET STARTED
              </Link>
            </div>
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
      {/* Scroll target bar */}
      <motion.div
        className="fixed top-0 inset-x-0 z-[60] h-1.5 bg-foreground origin-left"
        style={{ scaleX: progressScaleX }}
      />

      <motion.header
        initial={{ y: -80 }}
        animate={{ y: visible ? 0 : -80 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-colors duration-500",
          scrolled || menuOpen
            ? "border-b-2 border-foreground/10 bg-background"
            : "bg-transparent border-b-2 border-transparent"
        )}
      >
        <nav className="max-w-[1800px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex-1">
            {/* Wordmark */}
            <Magnetic strength={0.2}>
              <Link href="/" className="flex items-center gap-3 group">
                <Image src="/logo.png" alt="MCPHub Logo" width={32} height={32} className="object-contain" />
                <span className="font-bold text-xl tracking-tighter uppercase text-foreground inline-flex relative overflow-hidden">
                  <span className="group-hover:-translate-y-full transition-transform duration-300">MCPHub</span>
                  <span className="absolute top-full left-0 group-hover:-translate-y-full transition-transform duration-300">MCPHub</span>
                </span>
              </Link>
            </Magnetic>
          </div>

          {/* Center nav — desktop */}
          <div className="hidden md:flex items-center justify-center gap-12 flex-1">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} isActive={pathname === link.href} />
            ))}
          </div>

          {/* Right: CTA + hamburger */}
          <div className="flex items-center justify-end gap-6 flex-1">
            <Link
              href="/playground"
              className="hidden md:inline-flex relative group overflow-hidden px-6 py-2 border-2 border-foreground font-mono text-sm font-bold uppercase transition-colors hover:text-background"
            >
              <span className="absolute inset-0 bg-foreground translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
              <span className="relative z-10">Get started</span>
            </Link>

            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2 z-50 hover:opacity-70 transition-opacity"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                className="w-6 h-0.5 bg-foreground block origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="w-6 h-0.5 bg-foreground block"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                className="w-6 h-0.5 bg-foreground block origin-center"
              />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
