"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, MessageCircle } from "lucide-react";
import { useLenis } from "@/components/ui/smooth-scroll";
import { StaggerGroup } from "@/components/effects/stagger-group";
import { fadeUp } from "@/lib/motion";

const links = {
  Product: [
    { href: "/playground", label: "Playground" },
    { href: "/registry", label: "Registry" },
    { href: "/inspector", label: "Inspector" },
    { href: "/dashboard", label: "Dashboard" },
  ],
  Resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/api", label: "API Reference" },
    { href: "/cli", label: "CLI" },
  ],
};

const socialLinks = [
  { icon: Github, href: "https://github.com/mcphub", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com/mcphub", label: "Twitter" },
  { icon: MessageCircle, href: "https://discord.gg/mcphub", label: "Discord" },
];

export function Footer() {
  const lenis = useLenis();

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.5 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative border-t border-white/[0.07] overflow-hidden">
      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden
      >
        <span className="text-[20vw] font-bold tracking-[-0.05em] text-white/[0.02] whitespace-nowrap">
          MCPHUB
        </span>
      </div>

      <StaggerGroup className="relative max-w-[1440px] mx-auto px-6 md:px-12 py-16 md:py-20" whileInView staggerDelay={0.06}>
        <motion.div
          variants={fadeUp}
          className="flex flex-col md:flex-row justify-between gap-12 mb-16"
        >
          {/* Brand */}
          <div>
            <span className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase text-white/80 block mb-4">
              MCPHub
            </span>
            <p className="text-xs text-white/25 max-w-[220px] leading-[1.7]">
              The definitive platform for developing, debugging, and deploying Model Context Protocol servers.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 md:gap-24">
            {Object.entries(links).map(([category, items]) => (
              <div key={category}>
                <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/20 mb-5">
                  {category}
                </p>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-xs text-white/40 hover:text-white/75 transition-colors duration-200"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom row */}
        <motion.div
          variants={fadeUp}
          className="border-t border-white/[0.07] pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-white/20">
            © 2026 MCPHub. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {/* Social icons */}
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <motion.a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-white/20 hover:text-white/60 transition-colors duration-200"
                whileHover={{ rotate: 270 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Icon size={14} />
              </motion.a>
            ))}

            {/* Legal links */}
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[11px] tracking-[0.15em] uppercase text-white/20 hover:text-white/50 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}

            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="font-mono text-[11px] tracking-[0.15em] uppercase text-white/20 hover:text-white/50 transition-colors duration-200 flex items-center gap-1"
            >
              ↑ Top
            </button>
          </div>
        </motion.div>
      </StaggerGroup>
    </footer>
  );
}
