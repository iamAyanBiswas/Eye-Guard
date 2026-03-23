/**
 * API client for the EyeGuard prediction server.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface PredictionResult {
  prediction: number;
  label: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  runtime: string;
  timestamp: string;
  version: string;
}

export interface ModelInfo {
  model_loaded: boolean;
  runtime: string;
  num_features: number;
  num_classes: number;
  input_features: string[];
  output_classes: Record<string, string>;
  model_size_kb?: number;
}

/**
 * Send 21 features to the API and get a fatigue prediction.
 */
export async function predictFatigue(
  features: number[],
  token?: string
): Promise<PredictionResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/predict`, {
    method: "POST",
    headers,
    body: JSON.stringify({ features }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Check if the API server and model are up.
 */
export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

/**
 * Get model metadata.
 */
export async function getModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE}/api/model/info`);
  if (!res.ok) throw new Error(`Model info failed: ${res.status}`);
  return res.json();
}
