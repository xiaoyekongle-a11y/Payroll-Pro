"use client";

import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  subtext?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
  variant?: "default" | "blue" | "green" | "amber" | "red";
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, subtext, trend, variant = "default", ...props }, ref) => {
    const borderColors = {
      default: "",
      blue: "border-t-[3px] border-t-primary",
      green: "border-t-[3px] border-t-success",
      amber: "border-t-[3px] border-t-warning",
      red: "border-t-[3px] border-t-danger",
    };

    const trendColors = {
      up: "bg-danger-light text-danger",
      down: "bg-success-light text-success",
      flat: "bg-surface-3 text-muted",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-surface border border-border rounded-[var(--radius-lg)] p-4 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5",
          borderColors[variant],
          className
        )}
        {...props}
      >
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-muted mb-1.5">
          {label}
        </div>
        <div className="font-mono text-xl font-medium text-ink leading-tight">
          {value}
        </div>
        {subtext && (
          <div className="text-[0.6rem] text-muted mt-1 font-mono">{subtext}</div>
        )}
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[0.6rem] font-mono font-bold px-1.5 py-0.5 rounded-full mt-2",
              trendColors[trend.direction]
            )}
          >
            {trend.direction === "up" && "↑"}
            {trend.direction === "down" && "↓"}
            {trend.direction === "flat" && "→"}
            {trend.value}
          </span>
        )}
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
