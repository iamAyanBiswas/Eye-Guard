"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EyeTrackerState } from "@/lib/eye-tracker";
import type { FatigueInfo } from "@/hooks/use-eye-tracker";
import { Goal } from "lucide-react";

interface MetricsPanelProps {
  state: EyeTrackerState;
  fatigue: FatigueInfo | null;
  isRunning: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MetricsPanel({
  state,
  fatigue, // Unused in screenshots, but we can integrate or keep it backend
  isRunning,
}: MetricsPanelProps) {

  // For Eye Health Score, we can derive a mock score or use blink metrics and fatigue
  const getHealthScore = () => {
    if (!isRunning) return 100;
    // Calculate a basic health score based on blink rate vs healthy range and fatigue
    let score = 100;
    const br = state.blinkRate;
    if (br > 0 && br < 8) score -= 20;
    else if (br >= 8 && br < 12) score -= 10;
    else if (br > 25) score -= 15;

    if (fatigue) {
      score -= fatigue.level * 10;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const healthScore = getHealthScore();

  return (
    <div className="flex flex-col gap-4">
      {/* Session Duration */}
      <Card className="flex flex-col gap-1 rounded-xl p-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Session Duration
        </span>
        <div className="text-4xl font-bold tracking-tight text-blue-500">
          {isRunning ? formatDuration(state.sessionDurationSec) : "00:00"}
        </div>
      </Card>

      {/* Total Blinks */}
      <Card className="flex flex-col gap-1 rounded-xl p-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Total Blinks
        </span>
        <div className="text-4xl font-bold tracking-tight text-blue-500">
          {isRunning ? state.blinkCount : "0"}
        </div>
      </Card>

      {/* Blink Rate */}
      <Card className="flex flex-col gap-1 rounded-xl p-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Blink Rate
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight text-blue-500">
            {isRunning ? state.blinkRate.toFixed(1) : "0.0"}
          </span>
          <span className="text-sm font-medium text-muted-foreground">/min</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-500/20"
            style={{ width: isRunning ? `${Math.min(100, (state.blinkRate / 30) * 100)}%` : '0%' }}
          />
        </div>
      </Card>

      {/* Eye Aspect Ratio */}
      <Card className="flex flex-col gap-1 rounded-xl p-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Eye Aspect Ratio
        </span>
        <div className="text-4xl font-bold tracking-tight text-blue-500">
          {isRunning ? state.ear.toFixed(3) : "0.000"}
        </div>
      </Card>

      {/* Fatigue Prediction (API) */}
      <Card className="flex flex-col gap-1 rounded-xl p-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Fatigue Level (ML API)
        </span>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-bold tracking-tight text-blue-500">
            {fatigue ? fatigue.label : isRunning ? "Waiting..." : "Idle"}
          </div>
          {fatigue && (
            <span className="text-xs font-medium text-muted-foreground">
              {(fatigue.confidence * 100).toFixed(0)}% confidence
            </span>
          )}
        </div>
        {fatigue && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Last updated {Math.round((Date.now() - fatigue.lastUpdated) / 1000)}s ago
          </p>
        )}
      </Card>

      {/* Eye Health Score */}
      <Card className="flex flex-col gap-2 rounded-xl border-green-200 bg-green-50/50 p-5 dark:bg-green-950/20 dark:border-green-900">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Goal className="size-4 text-red-500" />
          <span>Eye Health Score</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight text-green-500">
            {healthScore}
          </span>
          <span className="text-sm font-medium text-muted-foreground">/100</span>
        </div>
        <Progress
          value={healthScore}
          className="mt-2 h-2.5 bg-green-200 dark:bg-green-900 [&>div]:bg-green-500"
        />
      </Card>
      {/* Applying custom health score progress bar styling directly for the above card just to be safe */}
      <style jsx global>{`
        .bg-green-50\\/50 .bg-primary {
           background-color: #22c55e !important; 
        }
      `}</style>
    </div>
  );
}

