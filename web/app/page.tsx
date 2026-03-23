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
    <div className="mx-auto flex min-h-svh max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Eye className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">
            EyeGuard
          </h1>
          <p className="text-xs text-muted-foreground">
            Eye Strain Detection System
          </p>
        </div>
      </header>

      {/* Alert */}
      <FatigueAlert
        fatigue={fatigue}
        blinkRate={state.blinkRate}
        isRunning={isRunning}
      />

      {/* Main content */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Video feed */}
        <div className="flex flex-col gap-4">
          <VideoFeed faceDetected={state.faceDetected} isRunning={isRunning} />
        </div>

        {/* Right: Controls + Metrics */}
        <div className="flex flex-col gap-4">
          <SessionControls
            isRunning={isRunning}
            isReady={isReady}
            error={error}
            onStart={handleStart}
            onStop={stop}
          />
          <MetricsPanel
            state={state}
            fatigue={fatigue}
            isRunning={isRunning}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-muted-foreground">
        EyeGuard v1.0 • Eye Strain Detection using Computer Vision &amp; Machine Learning
      </footer>
    </div>
  );
}
