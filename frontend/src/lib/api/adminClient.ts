import apiFetch from './httpClient';

export interface ResetResult {
  message: string;
  result: {
    deletedAssets: number;
    deletedGeneratedAssets: number;
    deletedCaptions: number;
    deletedBrandKits: number;
    deletedCampaigns: number;
    deletedReferenceCreatives: number;
    workspaceDeleted: boolean;
  };
}

export async function resetWorkspace(workspaceId: string): Promise<ResetResult> {
  const response = await apiFetch(`/api/admin/reset/workspace/${workspaceId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to reset workspace' }));
    throw new Error(error.error || 'Failed to reset workspace');
  }

  return response.json();
}

export const adminClient = {
  resetWorkspace,
};
