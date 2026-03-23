"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FatigueInfo } from "@/hooks/use-eye-tracker";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

interface FatigueAlertProps {
  fatigue: FatigueInfo | null;
  blinkRate: number;
  isRunning: boolean;
}

export default function FatigueAlert({
  fatigue,
  blinkRate,
  isRunning,
}: FatigueAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when fatigue level changes
  useEffect(() => {
    setDismissed(false);
  }, [fatigue?.level]);

  if (!isRunning || dismissed) return null;

  // Frontend rule-based alert: very low blink rate
  if (blinkRate > 0 && blinkRate < 8) {
    return (
      <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
        <AlertTriangle className="size-4" />
        <AlertTitle>Low Blink Rate Warning</AlertTitle>
        <AlertDescription>
          Your blink rate is <strong>{blinkRate.toFixed(1)}/min</strong> — well below the healthy
          range of 15-20/min. Try to blink more frequently to prevent eye strain.
        </AlertDescription>
      </Alert>
    );
  }

  // ML-based fatigue alerts
  if (fatigue) {
    if (fatigue.level >= 3) {
      return (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <ShieldAlert className="size-4" />
          <AlertTitle>⚠️ Severe Eye Strain Detected</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              The AI model has detected <strong>{fatigue.label}</strong> with{" "}
              {(fatigue.confidence * 100).toFixed(0)}% confidence.
            </p>
            <p className="text-xs">
              Please take a break now. Follow the 20-20-20 rule: look at something
              20 feet away for 20 seconds.
            </p>
          </AlertDescription>
        </Alert>
      );
    }

    if (fatigue.level === 2) {
      return (
        <Alert className="border-orange-500/30 bg-orange-500/5 text-orange-300 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="size-4 text-orange-400" />
          <AlertTitle>Moderate Fatigue Detected</AlertTitle>
          <AlertDescription>
            Your eyes are showing signs of fatigue ({(fatigue.confidence * 100).toFixed(0)}% confidence).
            Consider taking a short break soon.
          </AlertDescription>
        </Alert>
      );
    }

    if (fatigue.level === 1) {
      return (
        <Alert className="border-blue-500/30 bg-blue-500/5 text-blue-300 animate-in fade-in slide-in-from-top-2 duration-300">
          <Info className="size-4 text-blue-400" />
          <AlertTitle>Mild Strain Noticed</AlertTitle>
          <AlertDescription>
            Early signs of eye strain detected. Keep blinking regularly and maintain good posture.
          </AlertDescription>
        </Alert>
      );
    }
  }

  return null;
}
