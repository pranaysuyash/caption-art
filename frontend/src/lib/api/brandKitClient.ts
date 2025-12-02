/**
 * Brand Kit API Client
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const API_URL = `${API_BASE}/api`;

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
  voicePrompt: string;
  targetAudience?: string[];
  preferredPhrases?: string[];
  forbiddenPhrases?: string[];
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
}

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getBrandKit(id: string): Promise<BrandKit> {
  const response = await fetch(`${API_URL}/brand-kits/${id}`, {
    method: 'GET',
    headers: getHeaders(),
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
  const response = await fetch(`${API_URL}/brand-kits`, {
    method: 'POST',
    headers: getHeaders(),
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
  const response = await fetch(`${API_URL}/brand-kits/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
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
