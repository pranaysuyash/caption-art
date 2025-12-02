/**
 * Workspace API Client
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const API_URL = `${API_BASE}/api`;

export interface Workspace {
  id: string;
  clientName: string;
  agencyId: string;
  campaigns: string[];
  createdAt: string;
  updatedAt: string;
}

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(`${API_URL}/workspaces`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch workspaces');
  }

  const data = await response.json();
  return data.workspaces || [];
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const response = await fetch(`${API_URL}/workspaces/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch workspace');
  }

  const data = await response.json();
  return data.workspace;
}

export async function createWorkspace(clientName: string): Promise<Workspace> {
  const response = await fetch(`${API_URL}/workspaces`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ clientName }),
  });

  if (!response.ok) {
    throw new Error('Failed to create workspace');
  }

  const data = await response.json();
  return data.workspace;
}

export const workspaceClient = {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
};
