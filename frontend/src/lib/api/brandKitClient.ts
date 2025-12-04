/**
 * Brand Kit API Client
 */

import apiFetch from './httpClient';

export interface BrandKit {
  id: string;
  workspaceId: string;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: {
    url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };

  // Original fields
  voicePrompt: string;
  maskingModel?:
    | 'rembg-replicate'
    | 'sam3'
    | 'rf-detr'
    | 'roboflow'
    | 'hf-model-id';

  // BrandKit v2 - Campaign Brain fields
  brandPersonality?: string; // "Bold, witty, slightly irreverent"
  targetAudience?: string; // "Working moms 28-40 in Tier 1 cities"
  valueProposition?: string; // "Saves 2 hours a day on X"
  forbiddenPhrases?: string[]; // "Do not say 'cheap', 'discount'"
  preferredPhrases?: string[]; // "Always call our users 'creators'"
  toneStyle?:
    | 'professional'
    | 'playful'
    | 'bold'
    | 'minimal'
    | 'luxury'
    | 'edgy';

  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandKitData {
  workspaceId: string;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  voicePrompt: string;
  logo?: {
    url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };

  // BrandKit v2 fields
  brandPersonality?: string;
  targetAudience?: string;
  valueProposition?: string;
  forbiddenPhrases?: string[];
  preferredPhrases?: string[];
  toneStyle?:
    | 'professional'
    | 'playful'
    | 'bold'
    | 'minimal'
    | 'luxury'
    | 'edgy';
  maskingModel?:
    | 'rembg-replicate'
    | 'sam3'
    | 'rf-detr'
    | 'roboflow'
    | 'hf-model-id';
}

export interface UpdateBrandKitData {
  colors?: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
  voicePrompt?: string;
  logo?: {
    url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };

  // BrandKit v2 fields
  brandPersonality?: string;
  targetAudience?: string;
  valueProposition?: string;
  forbiddenPhrases?: string[];
  preferredPhrases?: string[];
  toneStyle?:
    | 'professional'
    | 'playful'
    | 'bold'
    | 'minimal'
    | 'luxury'
    | 'edgy';
  maskingModel?:
    | 'rembg-replicate'
    | 'sam3'
    | 'rf-detr'
    | 'roboflow'
    | 'hf-model-id';
}

export async function getBrandKit(id: string): Promise<BrandKit> {
  const response = await apiFetch(`/api/brand-kits/${id}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch brand kit');
  }

  const data = await response.json();
  return data.brandKit;
}

export async function createBrandKit(
  brandKitData: CreateBrandKitData
): Promise<BrandKit> {
  const response = await apiFetch(`/api/brand-kits`, {
    method: 'POST',
    body: JSON.stringify(brandKitData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to create brand kit' }));
    throw new Error(error.error || 'Failed to create brand kit');
  }

  const data = await response.json();
  return data.brandKit;
}

export async function updateBrandKit(
  id: string,
  updates: UpdateBrandKitData
): Promise<BrandKit> {
  const response = await apiFetch(`/api/brand-kits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to update brand kit' }));
    throw new Error(error.error || 'Failed to update brand kit');
  }

  const data = await response.json();
  return data.brandKit;
}

export const brandKitClient = {
  getBrandKit,
  createBrandKit,
  updateBrandKit,
};
