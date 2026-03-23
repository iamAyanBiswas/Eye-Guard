declare module "@mediapipe/tasks-vision" {
  export class FaceLandmarker {
    static createFromOptions(
      resolver: FilesetResolver,
      options: Record<string, unknown>,
    ): Promise<FaceLandmarker>;
    detectForVideo(
      video: HTMLVideoElement,
      timestamp: number,
    ): FaceLandmarkerResult;
    close(): void;
  }

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<FilesetResolver>;
  }

  export interface FaceLandmarkerResult {
    faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
    faceBlendshapes?: unknown;
    facialTransformationMatrixes?: unknown;
  }
}
