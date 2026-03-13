"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import { usePathname } from "next/navigation";

// Pages where native scroll should be used (virtualized lists)
const NATIVE_SCROLL_PATHS = ["/playground", "/inspector", "/dashboard"];

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Disable Lenis on pages with virtualized lists
    if (NATIVE_SCROLL_PATHS.some((p) => pathname.startsWith(p))) {
      return;
    }

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
