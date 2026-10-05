import React from "react";
import { cn } from "@/lib/utils";

export interface PlainTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom";
}

export const PlainTooltip: React.FC<PlainTooltipProps> = ({
  content,
  children,
  className,
  position = "bottom",
}) => {
  return (
    <span className="relative inline-flex group cursor-help">
      {children}
      <span
        role="tooltip"
        className={cn(
          "absolute z-50 pointer-events-none whitespace-nowrap",
          "bg-[#080C14]/95 backdrop-blur-sm border border-[rgba(255,255,255,0.15)]",
          "rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 shadow-xl",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
          "transition-opacity duration-100 ease-out",
          position === "top"
            ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
            : "top-full left-1/2 -translate-x-1/2 mt-2",
          className
        )}
      >
        {content}
      </span>
    </span>
  );
};

export default PlainTooltip;
