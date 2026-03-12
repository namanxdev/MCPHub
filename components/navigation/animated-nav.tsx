"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/playground", label: "Playground" },
  { href: "/registry", label: "Registry" },
  { href: "/inspector", label: "Inspector" },
  { href: "/dashboard", label: "Dashboard" },
];

export function AnimatedNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

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
      <nav className="max-w-[1440px] mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase text-white hover:text-white/70 transition-colors duration-200"
        >
          MCPHub
        </Link>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[11px] tracking-[0.15em] uppercase transition-colors duration-200",
                pathname === link.href
                  ? "text-white"
                  : "text-white/35 hover:text-white/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right CTA */}
        <Link
          href="/playground"
          className="text-[11px] tracking-[0.15em] uppercase text-white/35 hover:text-white/80 transition-colors duration-200"
        >
          Get started →
        </Link>
      </nav>
    </motion.header>
  );
}
