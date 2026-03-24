"use client";

import { forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface VideoFeedProps {
  faceDetected: boolean;
  isRunning: boolean;
}

const VideoFeed = forwardRef<
  { video: HTMLVideoElement | null; canvas: HTMLCanvasElement | null },
  VideoFeedProps
>(function VideoFeed({ faceDetected, isRunning }, _ref) {
  return (
    <div className="relative w-full h-auto aspect-4/3 overflow-hidden rounded-2xl bg-transparent">
          {/* Webcam video (hidden, used as source) */}
          <video
            id="eyeguard-video"
            className="absolute inset-0 hidden"
            playsInline
            muted
          />

          {/* Canvas with landmarks overlay */}
          <canvas
            id="eyeguard-canvas"
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Idle state overlay */}
          {!isRunning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/80 backdrop-blur-sm">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-8 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Click <span className="text-primary">Start Session</span> to begin tracking
              </p>
            </div>
          )}

          {/* Face detection indicator */}
          {isRunning && faceDetected && (
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400 backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                Face Detected
              </span>
            </div>
          )}
    </div>
  );
});

export default VideoFeed;
