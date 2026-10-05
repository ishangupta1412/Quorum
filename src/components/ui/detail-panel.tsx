"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Drawer Panel */}
      <aside
        className={cn(
          "relative z-10 w-full max-w-xl h-full bg-[#080C14] border-l border-[rgba(255,255,255,0.08)]",
          "p-6 flex flex-col shadow-2xl overflow-y-auto font-sans",
          "animate-in slide-in-from-right duration-200 ease-out",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4">
          <div>
            <h2 className="text-base font-semibold font-mono text-white uppercase tracking-wider">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs font-mono text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 text-sm text-slate-300">
          {children}
        </div>
      </aside>
    </div>
  );
};

export default DetailPanel;
