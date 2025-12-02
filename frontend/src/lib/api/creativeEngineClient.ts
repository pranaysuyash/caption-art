/**
 * Creative Engine API Client
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const API_URL = `${API_BASE}/api`;

export interface GenerateCreativesRequest {
  workspaceId: string;
  campaignId?: string;
  brandKitId: string;
  sourceAssets: string[];
  referenceCreatives?: string[];
  objectives?: string[];
  platforms?: string[];
  outputCount?: number;
  mode?: 'caption' | 'ad-copy';
  mustIncludePhrases?: string[];
  mustExcludePhrases?: string[];
}

export interface GenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  workspaceId: string;
  campaignId?: string;
  totalAssets: number;
  processedAssets: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface GenerationResult {
  success: boolean;
  result: {
    adCreatives: Array<{
      id: string;
      assetId: string;
      text: string;
      headline?: string;
      bodyText?: string;
      ctaText?: string;
    }>;
    summary: {
      totalGenerated: number;
      processingTime: number;
    };
  };
}

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function startGeneration(
  request: GenerateCreativesRequest
): Promise<GenerationResult> {
  const response = await fetch(`${API_URL}/creative-engine/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Generation failed' }));
    throw new Error(error.error || 'Generation failed');
  }

  return response.json();
}

export const creativeEngineClient = {
  startGeneration,
};
