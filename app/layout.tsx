import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { AnimatedNav } from "@/components/navigation/animated-nav";
import { Footer } from "@/components/navigation/footer";
import { CustomCursor } from "@/components/ui/custom-cursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCPHub — The MCP Development Platform",
  description:
    "Connect, test, debug, and monitor any MCP server. The definitive platform for Model Context Protocol development.",
  keywords: ["MCP", "Model Context Protocol", "API Testing", "Developer Tools"],
  authors: [{ name: "MCPHub" }],
  openGraph: {
    title: "MCPHub — The MCP Development Platform",
    description: "The definitive platform for Model Context Protocol development.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
      >
        <CustomCursor />
        <AnimatedNav />
        <main className="pt-16">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
