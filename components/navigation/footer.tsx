"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, MessageCircle, ArrowUpRight } from "lucide-react";
import { useLenis } from "@/components/ui/smooth-scroll";
import { StaggerGroup } from "@/components/effects/stagger-group";

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
    <footer className="relative border-t-2 border-foreground/10 bg-background text-foreground overflow-hidden">
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)", 
          backgroundSize: "4rem 4rem" 
        }} 
      />

      {/* Massive Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden mix-blend-difference hidden md:flex">
        <span className="text-[20vw] font-bold tracking-[-0.05em] text-foreground/[0.03] whitespace-nowrap">
          MCPHUB
        </span>
      </div>

      <div className="relative max-w-[1800px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-24">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-5">
            <Link href="/" className="inline-block group mb-8">
              <span className="font-bold text-4xl tracking-tighter uppercase relative">
                MCPHub
                <span className="absolute -bottom-2 left-0 w-0 h-1 bg-foreground transition-all duration-300 group-hover:w-full" />
              </span>
            </Link>
            <p className="text-xl md:text-2xl text-foreground/50 max-w-md font-medium leading-[1.4] tracking-tight">
              The definitive platform for developing, debugging, and deploying Model Context Protocol servers.
            </p>
          </div>

          {/* Links Grid */}
          <div className="col-span-1 md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-12 md:gap-8 justify-end">
            {Object.entries(links).map(([category, items]) => (
              <div key={category} className="flex flex-col md:items-end">
                <h4 className="font-mono text-xs md:text-sm tracking-widest text-foreground/40 uppercase mb-8 border-b-2 border-foreground/10 pb-4 inline-block md:min-w-[200px] md:text-right">
                  {category}
                </h4>
                <ul className="space-y-4 md:text-right">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group inline-flex items-center justify-end gap-2 text-2xl md:text-3xl font-bold text-foreground/60 hover:text-foreground transition-colors uppercase tracking-tight"
                      >
                        <span className="relative">
                          {item.label}
                          <span className="absolute left-0 right-0 bottom-1 h-0.5 bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform origin-right" />
                        </span>
                        <ArrowRightIcon className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 font-mono text-xs tracking-widest uppercase">
            <span className="text-foreground/40">© 2026 MCPHub.</span>
            <div className="flex gap-6 text-foreground/60">
              <Link href="/privacy" className="hover:text-foreground transition-colors relative group">
                PRIVACY
                <span className="absolute left-0 -bottom-1 w-full h-px bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors relative group">
                TERMS
                <span className="absolute left-0 -bottom-1 w-full h-px bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-8 font-mono text-xs ">
            <div className="flex gap-6">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-foreground/40 hover:text-foreground transition-transform hover:-translate-y-1 block"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>

            <div className="w-px h-8 bg-foreground/10 hidden md:block" />

            {/* Back to top brutalist button */}
            <button
              onClick={scrollToTop}
              className="tracking-widest uppercase text-foreground/60 hover:text-background hover:bg-foreground px-4 py-2 border-2 border-transparent hover:border-foreground transition-all flex items-center gap-2"
            >
              TOP <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
