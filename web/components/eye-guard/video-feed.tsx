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
    <Card className="overflow-hidden border-0 bg-black/90">
      <CardContent className="relative p-0">
        <div className="relative aspect-[4/3] w-full">
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
            className="h-full w-full object-contain"
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
          {isRunning && (
            <div className="absolute left-3 top-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${
                  faceDetected
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${faceDetected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                />
                {faceDetected ? "Face Detected" : "No Face"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default VideoFeed;
