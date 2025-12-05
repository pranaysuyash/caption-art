import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiFetch from '../../lib/api/httpClient';
import { formatDate } from '../../lib/utils/dateUtils';
import { useToast } from '../Toast';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Variation {
  id: string;
  label?: string;
  text?: string;
  approvalStatus: ApprovalStatus;
  approved?: boolean;
  qualityScore?: number;
}

interface Caption {
  id: string;
  text?: string;
  variations: Variation[];
  primaryVariation?: Variation | null;
  status?: string;
  approvalStatus: ApprovalStatus;
  approved?: boolean;
  generatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

interface Asset {
  id: string;
  originalName: string;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

interface GridItem {
  asset: Asset;
  caption: Caption | null;
}

interface GridStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ExportJob {
  id: string;
  workspaceId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  assetCount: number;
  captionCount: number;
  generatedAssetCount?: number;
  zipFilePath?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

interface ExportSummary {
  workspace: { id: string; clientName: string };
  readyForExport: boolean;
  totalApproved: number;
  totalAssets: number;
  estimatedSize: string;
  recentExports: ExportJob[];
}

const statusLabel: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function ReviewGrid() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { success, error: toastError } = useToast();
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [stats, setStats] = useState<GridStats | null>(null);
  const [selectedCaptions, setSelectedCaptions] = useState<string[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string>
  >({});
  const [filter, setFilter] = useState<ApprovalStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(
    null
  );
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [startingExport, setStartingExport] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const activeJob = useMemo(
    () => exportJobs.find((j) => j.id === activeJobId),
    [exportJobs, activeJobId]
  );
  const [processing, setProcessing] = useState<
    Record<string, 'approve' | 'reject' | undefined>
  >({});

  useEffect(() => {
    refreshAll();
  }, [workspaceId]);

  const refreshAll = async () => {
    await Promise.all([loadGrid(), loadExportSummary(), loadExportJobs()]);
  };

  const loadGrid = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const res = await apiFetch(
        `/api/approval/workspace/${workspaceId}/grid`,
        { method: 'GET' }
      );
      if (!res.ok) throw new Error('Failed to load approval grid');
      const data = await res.json();
      setGrid(data.grid || []);
      setStats(data.stats || null);

      // Initialize selection to primary variation if available
      const variationMap: Record<string, string> = {};
      (data.grid || []).forEach((item: GridItem) => {
        if (item.caption?.primaryVariation?.id) {
          variationMap[item.caption.id] = item.caption.primaryVariation.id;
        } else if (item.caption?.variations?.[0]) {
          variationMap[item.caption.id] = item.caption.variations[0].id;
        }
      });
      setSelectedVariations(variationMap);
      setSelectedCaptions([]);
    } catch (error) {
      console.error(error);
      toastError('Failed to load approval grid');
    } finally {
      setLoading(false);
    }
  };

  const loadExportSummary = async () => {
    if (!workspaceId) return;
    try {
      const res = await apiFetch(
        `/api/export/workspace/${workspaceId}/summary`,
        { method: 'GET' }
      );
      if (!res.ok) throw new Error('Failed to load export summary');
      const data = await res.json();
      setExportSummary(data);
    } catch (error) {
      console.error(error);
      setExportError(
        error instanceof Error
          ? error.message
          : 'Unable to load export readiness'
      );
    }
  };

  const loadExportJobs = async () => {
    if (!workspaceId) return;
    try {
      const res = await apiFetch(
        `/api/export/workspace/${workspaceId}/jobs?limit=5`,
        { method: 'GET' }
      );
      if (!res.ok) throw new Error('Failed to load export jobs');
      const data = await res.json();
      setExportJobs(data.jobs || []);

      // Track active job (pending/processing) for polling
      const active = (data.jobs || []).find((job: ExportJob) =>
        ['pending', 'processing'].includes(job.status)
      );
      setActiveJobId(active ? active.id : null);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredGrid = useMemo(() => {
    if (filter === 'all') return grid;
    return grid.filter(
      (item) => item.caption?.approvalStatus === filter
    );
  }, [grid, filter]);

  const updateCaptionInState = (updated: Caption) => {
    setGrid((prev) =>
      prev.map((item) =>
        item.caption?.id === updated.id ? { ...item, caption: updated } : item
      )
    );
    setSelectedCaptions((prev) =>
      prev.filter((id) => id !== updated.id)
    );
    setProcessing((prev) => {
      const next = { ...prev };
      delete next[updated.id];
      return next;
    });
  };

  const refreshExportData = async () => {
    await Promise.all([loadExportSummary(), loadExportJobs()]);
  };

  const approveCaption = async (captionId: string) => {
    try {
      setSubmitting(true);
      setProcessing((p) => ({ ...p, [captionId]: 'approve' }));
      const variationId = selectedVariations[captionId];
      const res = await apiFetch(
        `/api/approval/captions/${captionId}/approve`,
        {
          method: 'PUT',
          body: JSON.stringify(
            variationId ? { variationId } : {}
          ),
        }
      );
      if (!res.ok) throw new Error('Failed to approve caption');
      const data = await res.json();
      updateCaptionInState(data.caption);
      refreshExportData();
      success('Caption approved');
    } catch (error) {
      console.error(error);
      toastError('Failed to approve caption');
    } finally {
      setSubmitting(false);
      setProcessing((p) => {
        const next = { ...p };
        delete next[captionId];
        return next;
      });
    }
  };

  const rejectCaption = async (captionId: string) => {
    try {
      const reason = window.prompt('Add an optional reason?') || undefined;
      setSubmitting(true);
      setProcessing((p) => ({ ...p, [captionId]: 'reject' }));
      const variationId = selectedVariations[captionId];
      const res = await apiFetch(
        `/api/approval/captions/${captionId}/reject`,
        {
          method: 'PUT',
          body: JSON.stringify(
            variationId ? { reason, variationId } : { reason }
          ),
        }
      );
      if (!res.ok) throw new Error('Failed to reject caption');
      const data = await res.json();
      updateCaptionInState(data.caption);
      refreshExportData();
      success('Caption rejected');
    } catch (error) {
      console.error(error);
      toastError('Failed to reject caption');
    } finally {
      setSubmitting(false);
      setProcessing((p) => {
        const next = { ...p };
        delete next[captionId];
        return next;
      });
    }
  };

  const bulkApprove = async () => {
    if (!selectedCaptions.length) return;
    try {
      setSubmitting(true);
      const res = await apiFetch('/api/approval/batch-approve', {
        method: 'POST',
        body: JSON.stringify({ captionIds: selectedCaptions }),
      });
      if (!res.ok) throw new Error('Failed to bulk approve');
      await loadGrid();
      await refreshExportData();
      success(`Approved ${selectedCaptions.length} captions`);
    } catch (error) {
      console.error(error);
      toastError('Bulk approve failed');
    } finally {
      setSubmitting(false);
    }
  };

  const bulkReject = async () => {
    if (!selectedCaptions.length) return;
    const reason = window.prompt('Optional rejection reason?') || undefined;
    try {
      setSubmitting(true);
      const res = await apiFetch('/api/approval/batch-reject', {
        method: 'POST',
        body: JSON.stringify({ captionIds: selectedCaptions, reason }),
      });
      if (!res.ok) throw new Error('Failed to bulk reject');
      await loadGrid();
      await refreshExportData();
      success(`Rejected ${selectedCaptions.length} captions`);
    } catch (error) {
      console.error(error);
      toastError('Bulk reject failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelection = (captionId: string) => {
    setSelectedCaptions((prev) =>
      prev.includes(captionId)
        ? prev.filter((id) => id !== captionId)
        : [...prev, captionId]
    );
  };

  const toggleSelectAll = () => {
    const ids = filteredGrid
      .map((item) => item.caption?.id)
      .filter(Boolean) as string[];
    const allSelected = ids.every((id) => selectedCaptions.includes(id));
    setSelectedCaptions(allSelected ? [] : ids);
  };

  const startExport = async () => {
    if (!workspaceId) return;
    if (exportSummary && !exportSummary.readyForExport) {
      setExportError('No approved captions available to export yet.');
      return;
    }
    try {
      setStartingExport(true);
      setExportError(null);
      const res = await apiFetch(
        `/api/export/workspace/${workspaceId}/start`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start export');
      }
      if (data.jobId) {
        setActiveJobId(data.jobId);
      }
      await refreshExportData();
      success('Export started');
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Failed to start export';
      toastError(msg);
      setExportError(msg);
    } finally {
      setStartingExport(false);
    }
  };

  // Poll active export job
  useEffect(() => {
    if (!activeJobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/export/jobs/${activeJobId}`, {
          method: 'GET',
        });
        if (!res.ok) throw new Error('Failed to fetch export job');
        const data = await res.json();
        const job: ExportJob | undefined = data.job;
        if (job) {
          setExportJobs((prev) =>
            prev.map((j) => (j.id === job.id ? job : j))
          );
          if (job.status === 'completed' || job.status === 'failed') {
            setActiveJobId(null);
            refreshExportData();
            if (job.status === 'failed') {
              setExportError(job.errorMessage || 'Export failed');
              toastError(`Export failed: ${job.errorMessage}`);
            } else {
              success('Export completed successfully');
            }
          }
        }
      } catch (error) {
        console.error(error);
        setExportError(
          error instanceof Error ? error.message : 'Failed to poll export job'
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  const downloadExport = async (jobId: string) => {
    const downloadUrl = `${
      import.meta.env.VITE_API_BASE || 'http://localhost:3001'
    }/api/export/jobs/${jobId}/download`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className='page-container'>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--color-border, #1f2937)',
                borderRadius: '12px',
                padding: '1rem',
                background: 'var(--color-bg-secondary, #111827)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '10px',
                  background: '#1f2937',
                }}
              />
              <div
                style={{
                  width: '70%',
                  height: '14px',
                  borderRadius: '6px',
                  background: '#1f2937',
                }}
              />
              <div
                style={{
                  width: '90%',
                  height: '12px',
                  borderRadius: '6px',
                  background: '#1f2937',
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
                    height: '34px',
                    borderRadius: '8px',
                    background: '#1f2937',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: '34px',
                    borderRadius: '8px',
                    background: '#1f2937',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Approval Grid</h1>
          {stats && (
            <p className='page-subtitle'>
              {stats.approved} approved • {stats.pending} pending •{' '}
              {stats.rejected} rejected
            </p>
          )}
        </div>
        <div className='stack-mobile' style={{ gap: 'var(--space-sm)' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}
          >
            <option value='all'>All statuses</option>
            <option value='pending'>Pending</option>
            <option value='approved'>Approved</option>
            <option value='rejected'>Rejected</option>
          </select>
          <button
            className='btn btn-ghost btn-sm'
            onClick={toggleSelectAll}
            disabled={!filteredGrid.length}
          >
            {filteredGrid.length &&
            filteredGrid
              .map((i) => i.caption?.id)
              .filter(Boolean)
              .every((id) => selectedCaptions.includes(id as string))
              ? 'Clear selection'
              : 'Select all'}
          </button>
          <button
            className='btn btn-ghost btn-sm'
            onClick={loadGrid}
            disabled={submitting}
          >
            Refresh
          </button>
          <button
            className='btn btn-success'
            onClick={bulkApprove}
            disabled={!selectedCaptions.length || submitting}
          >
            Approve selected
          </button>
          <button
            className='btn btn-danger'
            onClick={bulkReject}
            disabled={!selectedCaptions.length || submitting}
          >
            Reject selected
          </button>
        </div>
      </div>

      {/* Export summary & actions */}
      <div className='panel' style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <div>
            <h3 className='panel-title'>Export</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-xs)', marginBottom: 0 }}>
              {exportSummary
                ? `${exportSummary.totalApproved} approved • Estimated ${exportSummary.estimatedSize}`
                : 'Loading export summary...'}
              {exportError && (
                <span style={{ display: 'block', marginTop: 'var(--space-xs)', color: 'var(--color-brand-error)', fontSize: 'var(--font-size-sm)' }}>
                  {exportError}
                </span>
              )}
            </p>
          </div>
          <div className='stack-mobile' style={{ gap: 'var(--space-sm)' }}>
          <button
            className='btn btn-ghost'
            onClick={refreshExportData}
            disabled={startingExport || submitting}
          >
            Refresh export
          </button>
          <button
            className='btn btn-primary'
            onClick={startExport}
            disabled={
              startingExport ||
              submitting ||
              !exportSummary?.readyForExport ||
              !!activeJobId
            }
          >
            {startingExport || activeJobId
              ? 'Exporting...'
              : 'Start export'}
          </button>
        </div>
      </div>
      </div>

      {activeJob && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem',
            borderRadius: '10px',
            border: '1px solid var(--color-border, #e5e7eb)',
            background: 'rgba(37,99,235,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ color: 'var(--color-text, #0f172a)' }}>
            Export {activeJob.id.slice(0, 8)} is {activeJob.status}...
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '4px solid rgba(37,99,235,0.2)',
              borderTop: '4px solid rgba(37,99,235,0.8)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>
            {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
          </style>
        </div>
      )}

      {/* Recent exports */}
      {exportJobs.length > 0 && (
        <div
          style={{
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {exportJobs.map((job) => (
            <div
              key={job.id}
              style={{
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: '10px',
                padding: '0.75rem',
                background: 'var(--color-bg-secondary, white)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                <span>Export {job.id.slice(0, 8)}</span>
                <span
                  style={{
                    textTransform: 'capitalize',
                    color:
                      job.status === 'completed'
                        ? '#15803d'
                        : job.status === 'failed'
                        ? '#b91c1c'
                        : '#92400e',
                  }}
                >
                  {job.status}
                </span>
              </div>
              <div
                style={{
                  color: 'var(--color-text-secondary, #6b7280)',
                  fontSize: '0.85rem',
                }}
              >
                {job.captionCount} captions • {job.generatedAssetCount || 0}{' '}
                renders
              </div>
              <div
                style={{
                  color: 'var(--color-text-secondary, #6b7280)',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                }}
              >
                {formatDate(job.createdAt)}
              </div>
              {job.status === 'completed' && (
                <button
                  className='btn btn-secondary btn-sm'
                  style={{ marginTop: 'var(--space-sm)' }}
                  onClick={() => downloadExport(job.id)}
                >
                  Download ZIP
                </button>
              )}
              {job.status === 'failed' && job.errorMessage && (
                <div
                  style={{
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                    marginTop: '0.35rem',
                  }}
                >
                  {job.errorMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!filteredGrid.length ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            border: '2px dashed var(--color-border, #d1d5db)',
            borderRadius: '12px',
            color: 'var(--color-text-secondary, #6b7280)',
          }}
        >
          No items found for this status.
        </div>
      ) : (
        <div className='card-grid'>
          {filteredGrid.map((item) => {
            const caption = item.caption;
            const selectedVariationId = caption
              ? selectedVariations[caption.id]
              : undefined;
            const selectedVariation = caption?.variations.find(
              (v) => v.id === selectedVariationId
            );
            const captionText =
              selectedVariation?.text ||
              caption?.primaryVariation?.text ||
              caption?.text ||
              '';
            const wordCount = captionText
              ? captionText.trim().split(/\s+/).filter(Boolean).length
              : 0;

            return (
              <div key={item.asset.id} className='card'>
                <div style={{ position: 'relative' }}>
                  <img
                    src={item.asset.url}
                    alt={item.asset.originalName}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                    }}
                  />
                  {caption?.approvalStatus && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '999px',
                        background:
                          caption.approvalStatus === 'approved'
                            ? 'rgba(34,197,94,0.15)'
                            : caption.approvalStatus === 'rejected'
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(251,191,36,0.2)',
                        color:
                          caption.approvalStatus === 'approved'
                            ? '#15803d'
                            : caption.approvalStatus === 'rejected'
                            ? '#b91c1c'
                            : '#92400e',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {statusLabel[caption.approvalStatus]}
                    </span>
                  )}
                </div>

                <div style={{ padding: '1rem', flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {item.asset.originalName}
                    </div>
                    {caption && (
                      <label style={{ display: 'flex', gap: '0.35rem' }}>
                        <input
                          type='checkbox'
                          checked={selectedCaptions.includes(caption.id)}
                          onChange={() => toggleSelection(caption.id)}
                          aria-label='Select caption'
                        />
                        Select
                      </label>
                    )}
                  </div>

                  {caption ? (
                    <>
                      <p
                        style={{
                          margin: 0,
                          color: 'var(--color-text, #0f172a)',
                      fontSize: '0.95rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {captionText || 'No caption text available'}
                  </p>
                  {captionText && (
                    <div
                      style={{
                        marginTop: '0.35rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{captionText.length} characters</span>
                      <span>{wordCount} words</span>
                      {caption.status && (
                        <span style={{ textTransform: 'capitalize' }}>
                          Status: {caption.status}
                        </span>
                      )}
                    </div>
                  )}

                  {caption.variations.length > 1 && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.85rem',
                              color:
                                'var(--color-text-secondary, #6b7280)',
                              fontWeight: 600,
                            }}
                          >
                            Variations
                          </div>
                          {caption.variations.map((variation) => (
                            <label
                              key={variation.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type='radio'
                                name={`variation-${caption.id}`}
                                checked={
                                  selectedVariationId === variation.id
                                }
                                onChange={() =>
                                  setSelectedVariations((prev) => ({
                                    ...prev,
                                    [caption.id]: variation.id,
                                  }))
                                }
                              />
                              <span
                                style={{
                                  fontWeight: 600,
                                  color:
                                    variation.approvalStatus === 'approved'
                                      ? '#15803d'
                                      : 'var(--color-text, #0f172a)',
                                }}
                              >
                                {variation.label || 'Variation'}
                              </span>
                              <span
                                style={{
                                  color:
                                    'var(--color-text-secondary, #6b7280)',
                                }}
                              >
                                {variation.text?.slice(0, 70) || '—'}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      No caption generated yet for this asset.
                    </p>
                  )}
                </div>

                {caption && (
                  <div className='card-actions'>
                    <button
                      className='btn btn-success'
                      onClick={() => approveCaption(caption.id)}
                      disabled={submitting || processing[caption.id] !== undefined}
                      title='Approve this caption'
                    >
                      {processing[caption.id] === 'approve'
                        ? 'Approving...'
                        : 'Approve'}
                    </button>
                    <button
                      className='btn btn-danger'
                      onClick={() => rejectCaption(caption.id)}
                      disabled={submitting || processing[caption.id] !== undefined}
                      title='Reject this caption'
                    >
                      {processing[caption.id] === 'reject'
                        ? 'Rejecting...'
                        : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
