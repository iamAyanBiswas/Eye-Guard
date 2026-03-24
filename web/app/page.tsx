"use client";

import { useRef, useCallback } from "react";
import { useEyeTracker } from "@/hooks/use-eye-tracker";
import VideoFeed from "@/components/eye-guard/video-feed";
import MetricsPanel from "@/components/eye-guard/metrics-panel";
import SessionControls from "@/components/eye-guard/session-controls";
import FatigueAlert from "@/components/eye-guard/fatigue-alert";
import { Eye } from "lucide-react";

export default function EyeGuardDashboard() {
  const { state, fatigue, isRunning, isReady, error, start, stop } =
    useEyeTracker();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleStart = useCallback(async () => {
    // Grab the DOM elements directly
    const video = document.getElementById(
      "eyeguard-video",
    ) as HTMLVideoElement | null;
    const canvas = document.getElementById(
      "eyeguard-canvas",
    ) as HTMLCanvasElement | null;

    if (!video || !canvas) return;

    videoRef.current = video;
    canvasRef.current = canvas;

    await start(video, canvas);
  }, [start]);

  return (
    <div className="mx-auto flex min-h-svh max-w-400 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center gap-3">
      </header>

      {/* Alert */}
      <FatigueAlert
        fatigue={fatigue}
        blinkRate={state.blinkRate}
        isRunning={isRunning}
      />

      {/* Main content */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Video feed */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border bg-card w-full">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4 px-6 sm:flex-nowrap">
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-xl">🎥</span>
                <span className="text-lg tracking-tight">Live Eye Tracking</span>
              </div>
              <SessionControls
                isRunning={isRunning}
                isReady={isReady}
                error={error}
                onStart={handleStart}
                onStop={stop}
              />
            </div>
            <div className="flex-1 bg-muted/5 flex items-center justify-center">
              <div className="w-full max-w-3xl">
                <VideoFeed faceDetected={state.faceDetected} isRunning={isRunning} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Metrics */}
        <div className="flex flex-col gap-4">
          <MetricsPanel
            state={state}
            fatigue={fatigue}
            isRunning={isRunning}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-muted-foreground">
        EyeGuard v2.0 • Eye Strain Detection using Computer Vision &amp; Machine Learning
      </footer>
    </div>
  );
}
