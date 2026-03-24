"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EyeTracker, type EyeTrackerState } from "@/lib/eye-tracker";
import { predictFatigue, type PredictionResult } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";

// ── Types ──

export interface FatigueInfo {
  level: number;
  label: string;
  confidence: number;
  probabilities: Record<string, number>;
  lastUpdated: number;
}

export interface UseEyeTrackerReturn {
  /** Current real-time eye metrics. */
  state: EyeTrackerState;
  /** Latest ML fatigue prediction (from API). */
  fatigue: FatigueInfo | null;
  /** Whether the tracker is currently running. */
  isRunning: boolean;
  /** Whether MediaPipe is loaded and ready. */
  isReady: boolean;
  /** Any error that occurred. */
  error: string | null;
  /** Start tracking. */
  start: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => Promise<void>;
  /** Stop tracking. */
  stop: () => void;
}

const INITIAL_STATE: EyeTrackerState = {
  isRunning: false,
  ear: 0,
  blinkCount: 0,
  blinkRate: 0,
  gazeStability: 0,
  sessionDurationSec: 0,
  fps: 0,
  faceDetected: false,
};

/** How often (ms) to send features to the API for fatigue prediction. */
const PREDICTION_INTERVAL_MS = 5_000;

export function useEyeTracker(): UseEyeTrackerReturn {
  const [state, setState] = useState<EyeTrackerState>(INITIAL_STATE);
  const [fatigue, setFatigue] = useState<FatigueInfo | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackerRef = useRef<EyeTracker | null>(null);
  const predictionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize the tracker on mount
  useEffect(() => {
    const tracker = new EyeTracker({
      onUpdate: (s) => setState(s),
      onBlink: () => {
        /* blink sound/haptic could go here */
      },
    });

    tracker
      .init()
      .then(() => {
        trackerRef.current = tracker;
        setIsReady(true);
      })
      .catch((e) => {
        setError(`Failed to load MediaPipe: ${e.message}`);
      });

    return () => {
      tracker.stop();
    };
  }, []);

  // Periodic API prediction
  const startPredictionLoop = useCallback(() => {
    if (predictionTimerRef.current) clearInterval(predictionTimerRef.current);

    predictionTimerRef.current = setInterval(async () => {
      const tracker = trackerRef.current;
      if (!tracker || !tracker.isRunning) return;

      const features = tracker.extractFeatures();
      if (!features) return;

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        const result: PredictionResult = await predictFatigue(features, token);
        setFatigue({
          level: result.prediction,
          label: result.label,
          confidence: result.confidence,
          probabilities: result.probabilities,
          lastUpdated: Date.now(),
        });
      } catch {
        // API may be down — silently continue with frontend-only mode
        console.warn("API prediction call failed, continuing in offline mode");
      }
    }, PREDICTION_INTERVAL_MS);
  }, []);

  const start = useCallback(
    async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const tracker = trackerRef.current;
      if (!tracker) {
        setError("Tracker not initialized yet");
        return;
      }

      try {
        setError(null);
        await tracker.start(video, canvas);
        setIsRunning(true);
        startPredictionLoop();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`Camera error: ${msg}`);
      }
    },
    [startPredictionLoop],
  );

  const stop = useCallback(() => {
    trackerRef.current?.stop();
    setIsRunning(false);
    setState(INITIAL_STATE);

    if (predictionTimerRef.current) {
      clearInterval(predictionTimerRef.current);
      predictionTimerRef.current = null;
    }
  }, []);

  return { state, fatigue, isRunning, isReady, error, start, stop };
}
