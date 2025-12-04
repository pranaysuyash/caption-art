/**
 * Creative Engine API Client
 */

import apiFetch from './httpClient';

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
  referenceCaptions?: string[];
  learnedStyleProfile?: string;
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

export async function startGeneration(
  request: GenerateCreativesRequest
): Promise<GenerationResult> {
  const response = await apiFetch(`/api/creative-engine/generate`, {
    method: 'POST',
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
