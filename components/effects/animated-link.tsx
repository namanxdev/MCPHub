"use client";
import Link from "next/link";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type AnimatedLinkProps = ComponentProps<typeof Link> & { className?: string };

export function AnimatedLink({ children, className, ...props }: AnimatedLinkProps) {
  return (
    <Link
      className={cn(
        "relative inline-block after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
