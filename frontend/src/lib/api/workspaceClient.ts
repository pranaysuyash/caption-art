/**
 * Workspace API Client
 */

import apiFetch from './httpClient';

export interface Workspace {
  id: string;
  clientName: string;
  agencyId: string;
  campaigns: string[];
  createdAt: string;
  updatedAt: string;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await apiFetch(`/api/workspaces`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch workspaces');
  }

  const data = await response.json();
  return data.workspaces || [];
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const response = await apiFetch(`/api/workspaces/${id}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch workspace');
  }

  const data = await response.json();
  return data.workspace;
}

export async function createWorkspace(clientName: string): Promise<Workspace> {
  const response = await apiFetch(`/api/workspaces`, {
    method: 'POST',
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
