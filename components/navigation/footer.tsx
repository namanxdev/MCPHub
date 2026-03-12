"use client";

import Link from "next/link";

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

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 md:py-20">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
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
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/20 mb-5">
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
        </div>

        {/* Bottom row */}
        <div className="border-t border-white/[0.07] pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/20">
            © 2026 MCPHub. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "https://github.com/mcphub", label: "GitHub", external: true },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/20 hover:text-white/50 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
