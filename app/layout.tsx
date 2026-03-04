import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCPHub — Postman for MCP",
  description:
    "Discover, test, debug, and monitor MCP servers. The unified platform for the Model Context Protocol ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <header className="border-b">
          <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg">
              MCPHub
            </Link>
            <Link
              href="/playground"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Playground
            </Link>
            <Link
              href="/registry"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Registry
            </Link>
            <Link
              href="/inspector"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Inspector
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
