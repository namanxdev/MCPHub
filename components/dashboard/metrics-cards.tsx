"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EASE_SMOOTH } from "@/lib/motion";

interface OverviewMetrics {
  totalCalls: number;
  avgLatencyMs: number;
  errorRate: number;
  uptime: number | null;
}

function CountUp({
  to,
  duration = 1.5,
  decimals = 0,
  suffix = "",
}: {
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    decimals > 0
      ? v.toFixed(decimals) + suffix
      : Math.round(v).toLocaleString() + suffix
  );
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (inView) {
      animate(motionVal, to, { duration, ease: EASE_SMOOTH });
    }
  }, [inView, to, duration, motionVal]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

type GlowColor = "green" | "yellow" | "red" | "neutral";

interface MetricCardProps {
  title: string;
  label: string;
  index: number;
  glowColor?: GlowColor;
  children: React.ReactNode;
}

function MetricCard({ title, label, index, glowColor = "neutral", children }: MetricCardProps) {
  const glowBorder: Record<GlowColor, string> = {
    green: "hover:border-green-500/30 hover:shadow-[0_0_20px_oklch(0.723_0.219_149.579/0.15)]",
    yellow: "hover:border-yellow-500/30 hover:shadow-[0_0_20px_oklch(0.845_0.143_101.24/0.15)]",
    red: "hover:border-destructive/30 hover:shadow-[0_0_20px_oklch(0.577_0.245_27.325/0.15)]",
    neutral: "hover:border-white/15",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE_SMOOTH }}
    >
      <Card className={`transition-[border-color,box-shadow] duration-300 ${glowBorder[glowColor]}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MetricsCards({ data }: { data: OverviewMetrics }) {
  const latencyColor =
    data.avgLatencyMs > 2000 ? "text-destructive" : data.avgLatencyMs > 1000 ? "text-yellow-500" : "";
  const latencyGlow: GlowColor =
    data.avgLatencyMs > 2000 ? "red" : data.avgLatencyMs > 1000 ? "yellow" : "green";
  const errorColor =
    data.errorRate > 0.1 ? "text-destructive" : data.errorRate > 0.05 ? "text-yellow-500" : "";
  const errorGlow: GlowColor = data.errorRate > 0.1 ? "red" : data.errorRate > 0.05 ? "yellow" : "green";
  const uptimeGlow: GlowColor = data.uptime !== null && data.uptime < 0.95 ? "red" : "green";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="Total Calls" label="Tool invocations recorded" index={0} glowColor="neutral">
        <div className="text-3xl font-bold">
          <CountUp to={data.totalCalls} />
        </div>
      </MetricCard>

      <MetricCard title="Avg Latency" label="Mean response time" index={1} glowColor={latencyGlow}>
        <div className={`text-3xl font-bold ${latencyColor}`}>
          <CountUp to={data.avgLatencyMs} suffix="ms" />
        </div>
      </MetricCard>

      <MetricCard title="Error Rate" label="Failed tool calls" index={2} glowColor={errorGlow}>
        <div className={`text-3xl font-bold ${errorColor}`}>
          <CountUp to={data.errorRate * 100} decimals={1} suffix="%" />
        </div>
      </MetricCard>

      <MetricCard
        title="Uptime"
        label={data.uptime !== null ? "Server availability" : "No health checks"}
        index={3}
        glowColor={uptimeGlow}
      >
        <div className={`text-3xl font-bold ${data.uptime !== null && data.uptime < 0.95 ? "text-destructive" : ""}`}>
          {data.uptime !== null ? (
            <CountUp to={data.uptime * 100} decimals={1} suffix="%" />
          ) : (
            <span>N/A</span>
          )}
        </div>
      </MetricCard>
    </div>
  );
}
