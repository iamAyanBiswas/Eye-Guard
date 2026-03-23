"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { EyeTrackerState } from "@/lib/eye-tracker";
import type { FatigueInfo } from "@/hooks/use-eye-tracker";
import {
  Eye,
  Timer,
  Activity,
  Brain,
  Gauge,
  MonitorDot,
} from "lucide-react";

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

function getBlinkRateStatus(rate: number): {
  label: string;
  color: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (rate < 8) return { label: "Very Low", color: "text-red-400", variant: "destructive" };
  if (rate < 12) return { label: "Low", color: "text-orange-400", variant: "outline" };
  if (rate <= 25) return { label: "Healthy", color: "text-green-400", variant: "default" };
  return { label: "High", color: "text-orange-400", variant: "outline" };
}

function getFatigueColor(level: number): string {
  switch (level) {
    case 0:
      return "text-green-400";
    case 1:
      return "text-blue-400";
    case 2:
      return "text-orange-400";
    case 3:
      return "text-red-400";
    default:
      return "text-muted-foreground";
  }
}

export default function MetricsPanel({
  state,
  fatigue,
  isRunning,
}: MetricsPanelProps) {
  const blinkStatus = getBlinkRateStatus(state.blinkRate);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4 text-primary" />
          Real-time Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Session Duration */}
        <MetricRow
          icon={<Timer className="size-4" />}
          label="Session Duration"
          value={isRunning ? formatDuration(state.sessionDurationSec) : "--:--"}
        />

        {/* Total Blinks */}
        <MetricRow
          icon={<Eye className="size-4" />}
          label="Total Blinks"
          value={isRunning ? String(state.blinkCount) : "--"}
        />

        {/* Blink Rate */}
        <MetricRow
          icon={<Gauge className="size-4" />}
          label="Blink Rate"
          value={
            isRunning ? (
              <span className="flex items-center gap-2">
                <span className={blinkStatus.color}>
                  {state.blinkRate.toFixed(1)}/min
                </span>
                <Badge variant={blinkStatus.variant} className="text-[10px]">
                  {blinkStatus.label}
                </Badge>
              </span>
            ) : (
              "--"
            )
          }
        />

        {/* EAR */}
        <MetricRow
          icon={<MonitorDot className="size-4" />}
          label="Eye Aspect Ratio"
          value={isRunning ? state.ear.toFixed(3) : "--"}
        />

        {/* Gaze Stability */}
        <div className="space-y-1.5">
          <MetricRow
            icon={<Activity className="size-4" />}
            label="Gaze Stability"
            value={isRunning ? `${(state.gazeStability * 100).toFixed(0)}%` : "--"}
          />
          {isRunning && (
            <Progress
              value={state.gazeStability * 100}
              className="h-1.5"
            />
          )}
        </div>

        {/* Fatigue Level (ML) */}
        <div className="border-t pt-3">
          <MetricRow
            icon={<Brain className="size-4" />}
            label="Fatigue Level (ML)"
            value={
              fatigue ? (
                <span className="flex items-center gap-2">
                  <span className={getFatigueColor(fatigue.level)}>
                    {fatigue.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {(fatigue.confidence * 100).toFixed(0)}%
                  </span>
                </span>
              ) : isRunning ? (
                <span className="text-xs text-muted-foreground">
                  Waiting for data…
                </span>
              ) : (
                "--"
              )
            }
          />
          {fatigue && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Updated {Math.round((Date.now() - fatigue.lastUpdated) / 1000)}s ago
            </p>
          )}
        </div>

        {/* FPS */}
        {isRunning && (
          <p className="text-[10px] text-muted-foreground">
            Processing: {state.fps} FPS
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
