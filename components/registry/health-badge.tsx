type HealthStatus = "healthy" | "degraded" | "unreachable" | "unknown";

interface HealthBadgeProps {
  status: HealthStatus;
  showLabel?: boolean;
}

export function HealthBadge({ status, showLabel = false }: HealthBadgeProps) {
  const config: Record<
    HealthStatus,
    { dot: string; label: string; text: string }
  > = {
    healthy: { dot: "bg-green-500", label: "Healthy", text: "text-green-600" },
    degraded: {
      dot: "bg-yellow-500",
      label: "Degraded",
      text: "text-yellow-600",
    },
    unreachable: {
      dot: "bg-red-500",
      label: "Unreachable",
      text: "text-red-600",
    },
    unknown: { dot: "bg-gray-400", label: "Unknown", text: "text-gray-500" },
  };

  const { dot, label, text } = config[status];

  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {showLabel && (
        <span className={`text-xs font-medium ${text}`}>{label}</span>
      )}
    </span>
  );
}
