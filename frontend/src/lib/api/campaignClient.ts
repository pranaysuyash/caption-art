/**
 * Campaign API Client
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const API_URL = `${API_BASE}/api`;

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
  brandKitId: string;
  name: string;
  description?: string;
  objective: CampaignObjective;
  launchType: LaunchType;
  funnelStage: FunnelStage;
  primaryOffer?: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  targetAudience?: string;
  placements: Placement[];
  referenceCaptions?: string[];
  learnedStyleProfile?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  brandKitId: string;
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

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getCampaigns(workspaceId?: string): Promise<Campaign[]> {
  const url = workspaceId
    ? `${API_URL}/campaigns?workspaceId=${workspaceId}`
    : `${API_URL}/campaigns`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch campaigns');
  }

  const data = await response.json();
  return data.campaigns || [];
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
    method: 'GET',
    headers: getHeaders(),
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
  const response = await fetch(`${API_URL}/campaigns`, {
    method: 'POST',
    headers: getHeaders(),
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
