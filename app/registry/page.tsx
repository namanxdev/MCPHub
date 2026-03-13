"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, SparklesIcon, ClockIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/registry/search-bar";
import { CategoryFilter } from "@/components/registry/category-filter";
import { ServerGrid } from "@/components/registry/server-grid";
import { ServerCard } from "@/components/registry/server-card";
import type { ServerCardData } from "@/components/registry/server-card";
import { LineReveal } from "@/components/effects/line-reveal";
import { FadeIn } from "@/components/effects/fade-in";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Name", value: "name" },
  { label: "Most Tools", value: "tools" },
] as const;

const PAGE_SIZE = 18;

export default function RegistryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [servers, setServers] = useState<ServerCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [recentServers, setRecentServers] = useState<ServerCardData[]>([]);
  const [featuredServers, setFeaturedServers] = useState<ServerCardData[]>([]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Fetch featured & recent on mount
  useEffect(() => {
    async function fetchHighlights() {
      try {
        const [recentRes, featuredRes] = await Promise.all([
          fetch("/api/registry?sort=newest&limit=6"),
          fetch("/api/registry?sort=newest&limit=6&featured=true"),
        ]);
        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentServers(data.servers ?? []);
        }
        if (featuredRes.ok) {
          const data = await featuredRes.json();
          setFeaturedServers(data.servers ?? []);
        }
      } catch {
        // silently fail — highlights are non-critical
      }
    }
    fetchHighlights();
  }, []);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (query) params.set("q", query);
      if (category) params.set("category", category);

      const res = await fetch(`/api/registry?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setServers(data.servers ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (err) {
      console.error(err);
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, sort, page]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Reset page when filters change
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(e.target.value);
      setPage(1);
    },
    []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <LineReveal delay={0.1}>
            <h1 className="text-3xl font-bold">MCP Server Registry</h1>
          </LineReveal>
          <FadeIn delay={0.3}>
            <p className="text-muted-foreground mt-1">
              Discover and connect to publicly available MCP servers
            </p>
          </FadeIn>
        </div>
        <Button asChild>
          <Link href="/registry/submit">
            <PlusIcon className="size-4" />
            Submit Server
          </Link>
        </Button>
      </div>

      {/* Featured Servers */}
      {featuredServers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <SparklesIcon className="size-4" />
            Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredServers.map((s) => (
              <ServerCard key={s.id} server={s} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      {recentServers.length > 0 && !query && !category && (
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <ClockIcon className="size-4" />
            Recently Added
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentServers.map((s) => (
              <ServerCard key={s.id} server={s} />
            ))}
          </div>
        </section>
      )}

      {/* Filters row */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchBar onChange={handleQueryChange} />
          </div>
          <select
            value={sort}
            onChange={handleSortChange}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <CategoryFilter selected={category} onChange={handleCategoryChange} />
      </div>

      {/* Results summary */}
      {!loading && (
        <p className="text-sm text-muted-foreground -mb-4">
          {total} server{total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Server grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${query}-${category}-${sort}-${page}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ServerGrid
            servers={servers}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
