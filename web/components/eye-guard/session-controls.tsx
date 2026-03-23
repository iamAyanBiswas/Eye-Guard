"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Loader2 } from "lucide-react";

interface SessionControlsProps {
  isRunning: boolean;
  isReady: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export default function SessionControls({
  isRunning,
  isReady,
  error,
  onStart,
  onStop,
}: SessionControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button
            onClick={onStart}
            disabled={!isReady}
            className="flex-1 gap-2"
            size="lg"
          >
            {!isReady ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Loading MediaPipe…
              </>
            ) : (
              <>
                <Play className="size-4" />
                Start Session
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onStop}
            variant="destructive"
            className="flex-1 gap-2"
            size="lg"
          >
            <Square className="size-4" />
            Stop Session
          </Button>
        )}
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={isReady ? "default" : "outline"} className="text-[10px]">
          {isReady ? "✓ MediaPipe" : "Loading…"}
        </Badge>
        <Badge variant={isRunning ? "default" : "secondary"} className="text-[10px]">
          {isRunning ? "● Live" : "○ Idle"}
        </Badge>
      </div>

      {/* Error message */}
      {error && (
        <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
