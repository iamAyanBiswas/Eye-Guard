/**
 * EyeGuard Eye Tracker Engine
 *
 * Uses MediaPipe FaceLandmarker (WASM) to:
 * - Detect face landmarks from webcam frames
 * - Calculate Eye Aspect Ratio (EAR)
 * - Detect blinks via EAR threshold + consecutive-frame counting
 * - Maintain sliding-window buffers to compute 21 ML features
 */

import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

// ── Constants ──
const EAR_THRESHOLD = 0.25;
const EAR_CONSEC_FRAMES = 3;
const FEATURE_WINDOW_SIZE = 90; // ~3s at 30fps

// ── Types ──
export interface EyeTrackerState {
  isRunning: boolean;
  ear: number;
  blinkCount: number;
  blinkRate: number; // blinks/min
  gazeStability: number;
  sessionDurationSec: number;
  fps: number;
  faceDetected: boolean;
}

export interface EyeTrackerCallbacks {
  onUpdate: (state: EyeTrackerState) => void;
  onBlink: (count: number) => void;
}

// ── Helpers ──

/** Euclidean distance between two 3D landmarks. */
function dist(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/** Compute Eye Aspect Ratio for one eye given 6 landmark indices. */
function computeEAR(
  landmarks: { x: number; y: number; z: number }[],
  indices: number[],
): number {
  const p1 = landmarks[indices[0]]; // left corner
  const p2 = landmarks[indices[1]]; // upper-left
  const p3 = landmarks[indices[2]]; // upper-right
  const p4 = landmarks[indices[3]]; // right corner
  const p5 = landmarks[indices[4]]; // lower-right
  const p6 = landmarks[indices[5]]; // lower-left

  const vertical1 = dist(p2, p6);
  const vertical2 = dist(p3, p5);
  const horizontal = dist(p1, p4);

  if (horizontal === 0) return 0;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

// MediaPipe landmark indices for eyes
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

// ── Simple statistics helpers ──
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}
function skewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  return (
    arr.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) / arr.length
  );
}
function kurtosis(arr: number[]): number {
  if (arr.length < 4) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  return (
    arr.reduce((acc, v) => acc + ((v - m) / s) ** 4, 0) / arr.length - 3
  );
}
function linSlope(arr: number[]): number {
  if (arr.length < 2) return 0;
  const n = arr.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(arr);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (arr[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// ── Eye Tracker Class ──

export class EyeTracker {
  private faceLandmarker: FaceLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private callbacks: EyeTrackerCallbacks;

  // Blink detection state
  private eyeClosedCounter = 0;
  private isBlinking = false;
  private blinkCount = 0;
  private blinkTimestamps: number[] = [];

  // Buffers for feature extraction
  private earBuffer: number[] = [];
  private blinkRateBuffer: number[] = [];
  private gazeStabilityBuffer: number[] = [];
  private sessionStart = 0;

  // Gaze tracking for stability
  private prevGazeX = 0.5;
  private prevGazeY = 0.5;
  private gazeMovements: number[] = [];

  // FPS tracking
  private frameTimestamps: number[] = [];

  // Running flag
  public isRunning = false;

  constructor(callbacks: EyeTrackerCallbacks) {
    this.callbacks = callbacks;
  }

  /** Initialize MediaPipe FaceLandmarker. Uses CPU on Firefox (no WebGL support for mediapipe). */
  async init(): Promise<void> {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );

    // Firefox's WebGL doesn't support MediaPipe's GPU delegate — detect and skip
    const isFirefox =
      typeof navigator !== "undefined" &&
      /firefox/i.test(navigator.userAgent);
    const delegate = isFirefox ? "CPU" : "GPU";

    console.log(
      `MediaPipe initializing with ${delegate} delegate${isFirefox ? " (Firefox detected)" : ""}`,
    );

    this.faceLandmarker = await FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate,
        },
        runningMode: "VIDEO" as const,
        numFaces: 1,
        outputFacialTransformationMatrixes: false,
        outputFaceBlendshapes: false,
      },
    );

    console.log("MediaPipe FaceLandmarker ready");
  }

  /** Start tracking using the provided video and canvas elements. */
  async start(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
  ): Promise<void> {
    if (!this.faceLandmarker) {
      await this.init();
    }

    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // Reset state
    this.eyeClosedCounter = 0;
    this.isBlinking = false;
    this.blinkCount = 0;
    this.blinkTimestamps = [];
    this.earBuffer = [];
    this.blinkRateBuffer = [];
    this.gazeStabilityBuffer = [];
    this.gazeMovements = [];
    this.frameTimestamps = [];
    this.sessionStart = performance.now();

    // Request camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
    });

    this.video.srcObject = stream;
    await this.video.play();

    // Match canvas size
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    this.isRunning = true;
    this.processFrame();
  }

  /** Stop tracking and release camera. */
  stop(): void {
    this.isRunning = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.video?.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      this.video.srcObject = null;
    }
  }

  /** Main render loop. */
  private processFrame = (): void => {
    if (
      !this.isRunning ||
      !this.video ||
      !this.faceLandmarker ||
      !this.ctx ||
      !this.canvas
    )
      return;

    const now = performance.now();

    // FPS calculation
    this.frameTimestamps.push(now);
    while (
      this.frameTimestamps.length > 0 &&
      now - this.frameTimestamps[0] > 1000
    ) {
      this.frameTimestamps.shift();
    }

    // Run face detection
    const results = this.faceLandmarker.detectForVideo(this.video, now);

    // Draw video to canvas
    this.ctx.drawImage(
      this.video,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );

    const faceDetected =
      results.faceLandmarks && results.faceLandmarks.length > 0;
    let ear = 0;
    let gazeStability = 0.8;

    if (faceDetected) {
      const landmarks = results.faceLandmarks[0];

      // Calculate EAR
      const leftEAR = computeEAR(landmarks, LEFT_EYE_INDICES);
      const rightEAR = computeEAR(landmarks, RIGHT_EYE_INDICES);
      ear = (leftEAR + rightEAR) / 2;

      // Blink detection
      this.detectBlink(ear, now);

      // Gaze stability
      gazeStability = this.computeGazeStability(landmarks);

      // Draw eye landmarks
      this.drawEyeLandmarks(landmarks, results);
    } else {
      // Draw "no face" indicator
      this.ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
      this.ctx.font = "20px sans-serif";
      this.ctx.fillText("No face detected", 20, 40);
    }

    // Update buffers
    const elapsed = (now - this.sessionStart) / 1000;
    const blinkRate = this.computeBlinkRate(now);

    this.earBuffer.push(ear);
    this.blinkRateBuffer.push(blinkRate);
    this.gazeStabilityBuffer.push(gazeStability);

    // Cap buffer sizes
    if (this.earBuffer.length > FEATURE_WINDOW_SIZE)
      this.earBuffer.shift();
    if (this.blinkRateBuffer.length > FEATURE_WINDOW_SIZE)
      this.blinkRateBuffer.shift();
    if (this.gazeStabilityBuffer.length > FEATURE_WINDOW_SIZE)
      this.gazeStabilityBuffer.shift();

    // Emit state
    this.callbacks.onUpdate({
      isRunning: true,
      ear,
      blinkCount: this.blinkCount,
      blinkRate,
      gazeStability,
      sessionDurationSec: elapsed,
      fps: this.frameTimestamps.length,
      faceDetected,
    });

    this.animFrameId = requestAnimationFrame(this.processFrame);
  };

  /** Detect blinks using EAR threshold. */
  private detectBlink(ear: number, now: number): void {
    if (ear < EAR_THRESHOLD) {
      this.eyeClosedCounter++;
      if (!this.isBlinking) {
        this.isBlinking = true;
      }
    } else {
      if (this.eyeClosedCounter >= EAR_CONSEC_FRAMES) {
        // Valid blink!
        this.blinkCount++;
        this.blinkTimestamps.push(now);
        this.callbacks.onBlink(this.blinkCount);
      }
      this.eyeClosedCounter = 0;
      this.isBlinking = false;
    }
  }

  /** Compute blinks per minute over the last 60 seconds. */
  private computeBlinkRate(now: number): number {
    const cutoff = now - 60_000;
    this.blinkTimestamps = this.blinkTimestamps.filter((t) => t >= cutoff);
    if (this.blinkTimestamps.length < 2) {
      // Fallback to total elapsed
      const elapsed = (now - this.sessionStart) / 1000;
      return elapsed > 0 ? (this.blinkCount / elapsed) * 60 : 0;
    }
    const span = (now - this.blinkTimestamps[0]) / 1000;
    return span > 0 ? (this.blinkTimestamps.length / span) * 60 : 0;
  }

  /** Compute gaze stability (0-1, higher is more stable). */
  private computeGazeStability(
    landmarks: { x: number; y: number; z: number }[],
  ): number {
    // Use nose tip as gaze proxy
    const nose = landmarks[1];
    const dx = Math.abs(nose.x - this.prevGazeX);
    const dy = Math.abs(nose.y - this.prevGazeY);
    const movement = Math.sqrt(dx * dx + dy * dy);

    this.prevGazeX = nose.x;
    this.prevGazeY = nose.y;

    this.gazeMovements.push(movement);
    if (this.gazeMovements.length > 30) this.gazeMovements.shift();

    const avgMovement = mean(this.gazeMovements);
    // Map to 0-1 (less movement = higher stability)
    return Math.max(0, Math.min(1, 1 - avgMovement * 20));
  }

  /** Draw eye landmark points on the canvas. */
  private drawEyeLandmarks(
    landmarks: { x: number; y: number; z: number }[],
    _results: FaceLandmarkerResult,
  ): void {
    if (!this.ctx || !this.canvas) return;

    const allEyeIndices = [...LEFT_EYE_INDICES, ...RIGHT_EYE_INDICES];

    for (const idx of allEyeIndices) {
      const pt = landmarks[idx];
      const x = pt.x * this.canvas.width;
      const y = pt.y * this.canvas.height;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#22c55e";
      this.ctx.fill();
    }
  }

  /**
   * Extract the 21 ML features for the API.
   * Returns null if insufficient data.
   */
  extractFeatures(): number[] | null {
    if (this.earBuffer.length < 10) return null;

    const earArr = this.earBuffer;
    const blinkArr = this.blinkRateBuffer;
    const gazeArr = this.gazeStabilityBuffer;
    const durationSec = (performance.now() - this.sessionStart) / 1000;
    const durationMin = durationSec / 60;

    return [
      // EAR features (8)
      mean(earArr),
      std(earArr),
      Math.min(...earArr),
      Math.max(...earArr),
      [...earArr].sort((a, b) => a - b)[Math.floor(earArr.length / 2)], // median
      skewness(earArr),
      kurtosis(earArr),
      linSlope(earArr),

      // Blink rate features (5)
      mean(blinkArr),
      std(blinkArr),
      Math.min(...blinkArr),
      Math.max(...blinkArr),
      linSlope(blinkArr),

      // Gaze stability features (3)
      mean(gazeArr),
      std(gazeArr),
      Math.min(...gazeArr),

      // Session duration features (2)
      durationMin,
      Math.log1p(durationSec),

      // Derived features (3)
      mean(earArr) * mean(blinkArr),
      mean(blinkArr) < 10 ? 1.0 : 0.0,
      mean(earArr) < 0.25 ? 1.0 : 0.0,
    ];
  }
}
