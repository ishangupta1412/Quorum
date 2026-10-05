import React from "react";
import { cn } from "@/lib/utils";

export type MetricSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  severity?: MetricSeverity;
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
}

const SEVERITY_COLORS: Record<MetricSeverity, { dot: string; text: string; border: string }> = {
  LOW: {
    dot: "bg-[#64748B]",
    text: "text-[#64748B]",
    border: "border-[#64748B]/30",
  },
  MEDIUM: {
    dot: "bg-[#F59E0B]",
    text: "text-[#F59E0B]",
    border: "border-[#F59E0B]/30",
  },
  HIGH: {
    dot: "bg-[#EF4444]",
    text: "text-[#EF4444]",
    border: "border-[#EF4444]/30",
  },
  CRITICAL: {
    dot: "bg-[#DC2626]",
    text: "text-[#DC2626]",
    border: "border-[#DC2626]/40",
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  severity,
  isInteractive = false,
  className,
  onClick,
}) => {
  const sevConfig = severity ? SEVERITY_COLORS[severity] : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-[#080C14] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 transition-all duration-300",
        isInteractive && "hover:scale-[1.02] hover:border-[rgba(255,255,255,0.16)] cursor-pointer",
        sevConfig && isInteractive && `hover:${sevConfig.border}`,
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-sans font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
        {sevConfig && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                sevConfig.dot,
                severity === "CRITICAL" && "animate-pulse"
              )}
            />
            <span className={cn("text-xs font-mono font-semibold uppercase", sevConfig.text)}>
              {severity}
            </span>
          </div>
        )}
      </div>

      <div className="text-2xl font-mono font-medium text-white tracking-tight">
        {value}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs font-mono text-slate-300">
          {subtitle}
        </p>
      )}

      {/* Subtle indicator bar on interactive cards */}
      {sevConfig && isInteractive && (
        <div className="mt-3 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full w-0 group-hover:w-full transition-all duration-300 ease-out",
              sevConfig.dot
            )}
          />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
