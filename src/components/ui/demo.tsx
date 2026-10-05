"use client";

import React, { useState } from "react";
import CyberneticEye from "@/components/ui/sentinel-core";
import CyberMatrixHero from "@/components/ui/cyber-matrix-hero";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<"matrix" | "eye">("matrix");

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation Switcher */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-1.5 bg-[#080C14]/90 backdrop-blur border border-white/10 rounded-lg text-xs font-mono">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === "matrix" ? "bg-white text-black font-semibold" : "text-gray-400 hover:text-white"
          }`}
        >
          Matrix Hero
        </button>
        <button
          onClick={() => setActiveTab("eye")}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === "eye" ? "bg-white text-black font-semibold" : "text-gray-400 hover:text-white"
          }`}
        >
          Sentinel Eye
        </button>
      </div>

      {activeTab === "matrix" ? (
        <CyberMatrixHero
          badgeText="Microsoft Innovate 2026"
          title="Quorum Correlation Plane"
          description="Distributed password spray campaign detection via bipartite graph clustering and consensus arithmetic."
          ctaText="Explore The Core"
          onCtaClick={() => {
            window.location.href = "/core";
          }}
        />
      ) : (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black p-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-mono text-gray-300 font-semibold mb-2">
              Quorum Sentinel Correlation Lens
            </h2>
            <p className="text-sm text-gray-500 font-mono">
              Interactive cursor tracking telemetry reticle
            </p>
          </div>
          <CyberneticEye className="mx-auto" />
        </div>
      )}
    </main>
  );
}

