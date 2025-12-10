import { useState, useEffect } from 'react';
import apiFetch from '../../lib/api/httpClient';
import { formatDate } from '../../lib/utils/dateUtils';
import { useToast } from '../Toast';

interface GridItem {
  asset: {
    id: string;
    originalName: string;
    mimeType: string;
    url: string;
    uploadedAt: string;
  };
  caption: {
    id: string;
    text: string;
    variations: any[];
    status: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approved: boolean;
    generatedAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    errorMessage?: string;
  } | null;
}

interface ApprovalGridProps {
  workspaceId: string;
  campaignId: string;
}

export function ApprovalGrid({ workspaceId, campaignId }: ApprovalGridProps) {
  const { warn } = useToast();
  const [gridData, setGridData] = useState<GridItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApprovalGrid();
  }, [workspaceId]);

  const loadApprovalGrid = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await apiFetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/approval/workspace/${workspaceId}/grid`
      );
      
      if (res.ok) {
        const data = await res.json();
        setGridData(data.grid || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      } else {
        setError('Failed to load approval grid');
      }
    } catch (err) {
      console.error('Failed to load approval grid:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (captionId: string) => {
    // Optimistic update
    setGridData(prev => prev.map(item => 
      item.caption?.id === captionId && item.caption
        ? { ...item, caption: { ...item.caption, approvalStatus: 'approved' as const, approved: true } }
        : item
    ));

    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/approval/captions/${captionId}/approve`,
        { method: 'PUT' }
      );
      
      if (!res.ok) {
        throw new Error('Failed to approve');
      }
    } catch (err) {
      console.error('Failed to approve:', err);
      // Rollback on error
      setGridData(prev => prev.map(item => 
        item.caption?.id === captionId && item.caption
          ? { ...item, caption: { ...item.caption, approvalStatus: 'pending' as const, approved: false } }
          : item
      ));
    }
  };

  const handleReject = async (captionId: string) => {
    // Optimistic update
    setGridData(prev => prev.map(item => 
      item.caption?.id === captionId && item.caption
        ? { ...item, caption: { ...item.caption, approvalStatus: 'rejected' as const, approved: false } }
        : item
    ));

    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/approval/captions/${captionId}/reject`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Rejected by user' })
        }
      );
      
      if (!res.ok) {
        throw new Error('Failed to reject');
      }
    } catch (err) {
      console.error('Failed to reject:', err);
      // Rollback on error
      setGridData(prev => prev.map(item => 
        item.caption?.id === captionId && item.caption
          ? { ...item, caption: { ...item.caption, approvalStatus: 'pending' as const, approved: false } }
          : item
      ));
    }
  };

  const handleBulkApprove = async () => {
    const selectedIds = Array.from(selected);
    
    // Optimistic update
    setGridData(prev => prev.map(item => 
      item.caption && selectedIds.includes(item.caption.id)
        ? { ...item, caption: { ...item.caption, approvalStatus: 'approved' as const, approved: true } }
        : item
    ));

    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/approval/batch-approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captionIds: selectedIds })
        }
      );
      
      if (!res.ok) {
        throw new Error('Bulk approve failed');
      }
    } catch (err) {
      console.error('Failed to bulk approve:', err);
      loadApprovalGrid(); // Reload on error
    }
    
    setSelected(new Set());
  };

  const handleBulkReject = async () => {
    const selectedIds = Array.from(selected);
    
    // Optimistic update
    setGridData(prev => prev.map(item => 
      item.caption && selectedIds.includes(item.caption.id)
        ? { ...item, caption: { ...item.caption, approvalStatus: 'rejected' as const, approved: false } }
        : item
    ));

    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/approval/batch-reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captionIds: selectedIds, reason: 'Bulk rejected by user' })
        }
      );
      
      if (!res.ok) {
        throw new Error('Bulk reject failed');
      }
    } catch (err) {
      console.error('Failed to bulk reject:', err);
      loadApprovalGrid(); // Reload on error
    }
    
    setSelected(new Set());
  };

  const handleExportApproved = () => {
    const approved = gridData.filter(item => item.caption?.approvalStatus === 'approved');
    
    if (approved.length === 0) {
      warn('No approved captions to export');
      return;
    }

    const csv = [
      ['Asset Filename', 'Caption', 'Approved Date'],
      ...approved.map(item => [
        item.asset.originalName || 'Unknown',
        `"${(item.caption?.text || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
        formatDate(item.caption?.approvedAt || item.caption?.generatedAt || '')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `approved-captions-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (captionId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(captionId)) {
        next.delete(captionId);
      } else {
        next.add(captionId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableItems = filteredItems.filter(item => item.caption);
    if (selected.size === selectableItems.length && selectableItems.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableItems.map(item => item.caption!.id)));
    }
  };

  const filteredItems = filter === 'all' 
    ? gridData 
    : gridData.filter(item => item.caption?.approvalStatus === filter);

  const getStatusBadgeStyle = (status: 'pending' | 'approved' | 'rejected') => {
    const styles = {
      approved: {
        backgroundColor: '#dcfce7',
        color: '#166534'
      },
      rejected: {
        backgroundColor: '#fee2e2',
        color: '#991b1b'
      },
      pending: {
        backgroundColor: '#fef3c7',
        color: '#92400e'
      }
    };
    return styles[status];
  };

  if (loading) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: 'var(--color-text-secondary, #6b7280)'
      }}>
        Loading approvals...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <div>{error}</div>
        <button 
          onClick={loadApprovalGrid}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-secondary, white)',
      border: '1px solid var(--color-border, #e5e7eb)',
      borderRadius: '12px',
      padding: '1.5rem'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => {
            const count = f === 'all' 
              ? stats.total 
              : stats[f];
            
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ 
                  textTransform: 'capitalize',
                  fontSize: '0.875rem'
                }}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {selected.size > 0 && (
            <>
              <button 
                onClick={handleBulkApprove} 
                className="btn btn-success"
                style={{ fontSize: '0.875rem' }}
              >
                ✓ Approve ({selected.size})
              </button>
              <button 
                onClick={handleBulkReject} 
                className="btn btn-danger"
                style={{ fontSize: '0.875rem' }}
              >
                ✗ Reject ({selected.size})
              </button>
            </>
          )}
          <button 
            onClick={handleExportApproved} 
            className="btn btn-primary"
            style={{ fontSize: '0.875rem' }}
            disabled={stats.approved === 0}
          >
            ⬇ Export Approved
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Header Row - Hidden on mobile */}
        <div className="desktop-only" style={{
          display: 'grid',
          gridTemplateColumns: '40px 150px 1fr 100px 120px 100px',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--color-background, #f8fafc)',
          borderBottom: '1px solid var(--color-border, #e5e7eb)',
          fontWeight: 600,
          fontSize: '0.875rem',
          color: 'var(--color-text, #1f2937)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={selected.size === filteredItems.filter(i => i.caption).length && filteredItems.filter(i => i.caption).length > 0}
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer' }}
              aria-label="Select all"
            />
          </div>
          <div>Asset</div>
          <div>Caption</div>
          <div>Status</div>
          <div>Date</div>
          <div>Actions</div>
        </div>

        {/* Data Rows */}
        {filteredItems.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary, #6b7280)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
            <div>No captions found for this filter</div>
          </div>
        ) : (
          filteredItems.map(item => {
            if (!item.caption) {
              return null; // Skip items without captions
            }
            
            return (
              <div
                key={item.caption.id}
                className="approval-grid-row"
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--color-border, #e5e7eb)',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selected.has(item.caption.id)}
                    onChange={() => toggleSelect(item.caption!.id)}
                    style={{ cursor: 'pointer' }}
                    aria-label={`Select ${item.asset.originalName || 'caption'}`}
                  />
                </div>
                
                <div style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-text, #1f2937)'
                }}>
                  {item.asset.originalName || 'Unknown'}
                </div>
                
                <div style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-text-secondary, #6b7280)'
                }} title={item.caption.text}>
                  {item.caption.text}
                </div>
                
                <div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    ...getStatusBadgeStyle(item.caption.approvalStatus)
                  }}>
                    {item.caption.approvalStatus}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--color-text-secondary, #6b7280)' 
                }}>
                  {formatDate(item.caption.approvedAt || item.caption.rejectedAt || item.caption.generatedAt)}
                </div>
                
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {item.caption.approvalStatus !== 'approved' && (
                    <button
                      onClick={() => handleApprove(item.caption!.id)}
                      className="btn btn-ghost"
                      style={{ 
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem'
                      }}
                      title="Approve"
                      aria-label="Approve caption"
                    >
                      ✓
                    </button>
                  )}
                  {item.caption.approvalStatus !== 'rejected' && (
                    <button
                      onClick={() => handleReject(item.caption!.id)}
                      className="btn btn-ghost"
                      style={{ 
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem'
                      }}
                      title="Reject"
                      aria-label="Reject caption"
                    >
                      ✗
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {gridData.length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--color-background, #f8fafc)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary, #6b7280)'
        }}>
          <div>
            Total: {stats.total} captions
          </div>
          <div>
            Approved: {stats.approved} • 
            Pending: {stats.pending} • 
            Rejected: {stats.rejected}
          </div>
        </div>
      )}
    </div>
  );
}
