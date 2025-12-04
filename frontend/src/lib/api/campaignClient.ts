/**
 * Campaign API Client
 */

import apiFetch from './httpClient';

export type CampaignObjective =
  | 'awareness'
  | 'traffic'
  | 'conversion'
  | 'engagement';
export type LaunchType =
  | 'new-launch'
  | 'evergreen'
  | 'seasonal'
  | 'sale'
  | 'event';
export type FunnelStage = 'cold' | 'warm' | 'hot';
export type Placement =
  | 'ig-feed'
  | 'ig-story'
  | 'fb-feed'
  | 'fb-story'
  | 'li-feed';

export interface Campaign {
  id: string;
  workspaceId: string;
  brandKitId?: string;
  name: string;
  description?: string;
  objective?: CampaignObjective;
  launchType?: LaunchType;
  funnelStage?: FunnelStage;
  primaryOffer?: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  targetAudience?: string;
  placements: Placement[];
  referenceCaptions?: string[];
  learnedStyleProfile?: string;
  briefData?: any;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  workspaceId?: string;
  name: string;
  description?: string;
  brandKitId?: string;
  objective: CampaignObjective;
  launchType: LaunchType;
  funnelStage: FunnelStage;
  primaryOffer?: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  targetAudience?: string;
  placements: Placement[];
  referenceCaptions?: string[];
}

export async function getCampaigns(workspaceId?: string): Promise<Campaign[]> {
  const url = workspaceId
    ? `/api/campaigns?workspaceId=${workspaceId}`
    : `/api/campaigns`;

  const response = await apiFetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch campaigns');
  }

  const data = await response.json();
  return data.campaigns || [];
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  const response = await apiFetch(`/api/campaigns/${campaignId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch campaign');
  }

  const data = await response.json();
  return data.campaign;
}

export async function createCampaign(
  campaignData: CreateCampaignData
): Promise<Campaign> {
  const response = await apiFetch(`/api/campaigns`, {
    method: 'POST',
    body: JSON.stringify(campaignData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to create campaign' }));
    throw new Error(error.error || 'Failed to create campaign');
  }

  const data = await response.json();
  return data.campaign;
}

export const campaignClient = {
  getCampaigns,
  getCampaign,
  createCampaign,
};
