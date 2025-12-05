import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiFetch from '../../lib/api/httpClient';
import { safeLocalStorage } from '../../lib/storage/safeLocalStorage';
import { adminClient } from '../../lib/api/adminClient';

type WorkspaceApi = {
  id: string;
  clientName: string;
  brandKitId?: string;
  createdAt: string | Date;
  campaignCount?: number;
};

type WorkspaceMeta = {
  industry?: string;
};

type Workspace = WorkspaceApi & {
  industry?: string;
};

type NewWorkspaceForm = {
  clientName: string;
  industry: string;
};

const WORKSPACE_META_KEY = 'workspace:meta';

function loadWorkspaceMeta(): Record<string, WorkspaceMeta> {
  try {
    const stored = safeLocalStorage.getItem(WORKSPACE_META_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<WorkspaceApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<NewWorkspaceForm>({
    clientName: '',
    industry: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState<string | null>(null);
  const [workspaceMeta, setWorkspaceMeta] = useState<Record<string, WorkspaceMeta>>(
    () => loadWorkspaceMeta()
  );

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const persistWorkspaceMeta = useCallback(
    (updater: (prev: Record<string, WorkspaceMeta>) => Record<string, WorkspaceMeta>) => {
      setWorkspaceMeta((prev) => {
        const next = updater(prev);
        safeLocalStorage.setItem(WORKSPACE_META_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/api/workspaces`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to load workspaces');
      }

      const data = await response.json();
      const normalized: WorkspaceApi[] = (data.workspaces || []).map(
        (workspace: WorkspaceApi) => ({
          ...workspace,
          createdAt:
            typeof workspace.createdAt === 'string'
              ? workspace.createdAt
              : workspace.createdAt?.toISOString?.() ?? new Date().toISOString(),
        })
      );
      setWorkspaces(normalized);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load workspaces. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const response = await apiFetch(`/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: createForm.clientName,
          industry: createForm.industry,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create workspace');
      }

      const result = await response.json();
      const created: WorkspaceApi = {
        ...result.workspace,
        createdAt:
          typeof result.workspace.createdAt === 'string'
            ? result.workspace.createdAt
            : result.workspace.createdAt?.toISOString?.() ?? new Date().toISOString(),
      };

      persistWorkspaceMeta((prev) => ({
        ...prev,
        [created.id]: { industry: createForm.industry },
      }));

      setWorkspaces((prev) => [...prev, created]);
      setShowCreateForm(false);
      setCreateForm({ clientName: '', industry: '' });
    } catch (error) {
      console.error('Error creating workspace:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to create workspace right now.'
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleReset = async (workspaceId: string) => {
    if (!window.confirm('Reset this workspace? This will wipe data.')) return;
    setResetLoading(workspaceId);
    try {
      await adminClient.resetWorkspace(workspaceId);
      setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
      const meta = { ...workspaceMeta };
      delete meta[workspaceId];
      setWorkspaceMeta(meta);
      safeLocalStorage.setItem(WORKSPACE_META_KEY, JSON.stringify(meta));
    } catch (err) {
      console.error('Failed to reset workspace', err);
      setError(
        err instanceof Error ? err.message : 'Failed to reset workspace'
      );
    } finally {
      setResetLoading(null);
    }
  };

  const enrichedWorkspaces = useMemo(() => {
    return workspaces.map((workspace) => ({
      ...workspace,
      industry:
        workspace.industry ||
        workspaceMeta[workspace.id]?.industry ||
        'Uncategorized',
    }));
  }, [workspaces, workspaceMeta]);

  return (
    <div className='page-container'>
      {error && (
        <div
          role='alert'
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #ef4444',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
              Unable to load workspaces
            </strong>
            <span style={{ fontSize: '0.95rem' }}>{error}</span>
          </div>
          <button
            onClick={loadWorkspaces}
            className='btn btn-secondary'
            style={{ whiteSpace: 'nowrap' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Workspaces</h1>
          <p className='page-subtitle'>
            Manage your client workspaces and campaigns
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className='btn btn-primary'
        >
          + New Workspace
        </button>
      </div>

      {/* Create Workspace Modal */}
      {showCreateForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary, white)',
              padding: '2rem',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 1.5rem 0',
              }}
            >
              Create New Workspace
            </h2>

            <form
              onSubmit={handleCreateWorkspace}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
                >
                  Client Name
                </label>
                <input
                  type='text'
                  value={createForm.clientName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      clientName: e.target.value,
                    }))
                  }
                  placeholder='e.g., Fashion Brand A'
                  className='input'
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
                >
                  Industry
                </label>
                <select
                  value={createForm.industry}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      industry: e.target.value,
                    }))
                  }
                  className='input'
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '1rem',
                  }}
                >
                  <option value=''>Select industry</option>
                  <option value='fashion'>Fashion</option>
                  <option value='technology'>Technology</option>
                  <option value='food'>Food & Beverage</option>
                  <option value='beauty'>Beauty & Cosmetics</option>
                  <option value='automotive'>Automotive</option>
                  <option value='travel'>Travel & Hospitality</option>
                  <option value='healthcare'>Healthcare</option>
                  <option value='finance'>Finance</option>
                  <option value='education'>Education</option>
                  <option value='other'>Other</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end',
                  marginTop: '1rem',
                }}
              >
                <button
                  type='button'
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm({ clientName: '', industry: '' });
                  }}
                  className='btn btn-secondary'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={
                    createLoading ||
                    !createForm.clientName ||
                    !createForm.industry
                  }
                  className='btn btn-primary'
                >
                  {createLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className='card-grid'>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className='card'
              style={{
                background: 'var(--color-bg-secondary, #111827)',
                border: '1px solid var(--color-border, #1f2937)',
              }}
            >
              <div
                style={{
                  width: '70%',
                  height: '16px',
                  borderRadius: '6px',
                  background: '#1f2937',
                  marginBottom: '0.6rem',
                }}
              />
              <div
                style={{
                  width: '50%',
                  height: '12px',
                  borderRadius: '6px',
                  background: '#1f2937',
                  marginBottom: '0.6rem',
                }}
              />
              <div
                style={{
                  width: '90%',
                  height: '12px',
                  borderRadius: '6px',
                  background: '#1f2937',
                  marginBottom: '0.6rem',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: '32px',
                    borderRadius: '8px',
                    background: '#1f2937',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: '32px',
                    borderRadius: '8px',
                    background: '#1f2937',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && enrichedWorkspaces.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--color-background, #f8fafc)',
            borderRadius: '12px',
            border: '2px dashed var(--color-border, #d1d5db)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
          <h3
            style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-text, #1f2937)',
              margin: '0 0 0.5rem 0',
            }}
          >
            No workspaces yet
          </h3>
          <p
            style={{
              color: 'var(--color-text-secondary, #6b7280)',
              marginBottom: '1.5rem',
              maxWidth: '400px',
              margin: '0 auto 1.5rem',
            }}
          >
            Create your first workspace to start organizing client campaigns and
            creative assets.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className='btn btn-primary'
          >
            Create Your First Workspace
          </button>
        </div>
      )}

      {/* Workspaces Grid */}
      {!loading && enrichedWorkspaces.length > 0 && (
        <div className='card-grid'>
          {enrichedWorkspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to={`/agency/workspaces/${workspace.id}/campaigns`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div className='card card-interactive'>
                <div className='card-header'>
                  <div>
                    <h3 className='card-title'>{workspace.clientName}</h3>
                    <p className='card-subtitle'>{workspace.industry}</p>
                  </div>
                  <div className='card-icon'>🏢</div>
                </div>

                <div className='card-meta'>
                  <span>{workspace.campaignCount || 0} campaigns</span>
                  <span>Created {formatDate(workspace.createdAt)}</span>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReset(workspace.id);
                    }}
                    className='btn btn-ghost btn-sm'
                    disabled={resetLoading === workspace.id}
                  >
                    {resetLoading === workspace.id ? 'Resetting…' : 'Reset'}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
