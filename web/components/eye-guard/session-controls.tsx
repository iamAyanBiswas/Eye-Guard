"use client";

import { Button } from "@/components/ui/button";
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
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-destructive max-w-50 truncate">
          {error}
        </span>
      )}
      {!isRunning ? (
        <Button
          onClick={onStart}
          disabled={!isReady}
          className="gap-2 bg-blue-500 hover:bg-blue-600 font-semibold shadow-sm"
          size="sm"
        >
          {!isReady ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </>
          ) : (
            <>
              <Play className="size-4 fill-white" />
              Start Session
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={onStop}
          variant="destructive"
          className="gap-2 font-semibold shadow-sm"
          size="sm"
        >
          <Square className="size-4 fill-blue-200 text-blue-200" />
          Stop Session
        </Button>
      )}
    </div>
  );
}

