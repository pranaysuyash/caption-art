import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiFetch from '../../lib/api/httpClient';
import { CreateCampaignModal } from '../CreateCampaignModal';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  lastUpdated?: string;
  updatedAt?: string;
  qualityScore?: number;
  scoreBreakdown?: Record<string, number>;
}

export function CampaignList() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [workspaceId]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);

      const response = await apiFetch(
        `/api/campaigns?workspaceId=${workspaceId}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load campaigns');
      }

      const data = await response.json();
      const items: Campaign[] = data.campaigns || [];
      // By default do not show archived campaigns unless user toggles it on
      if (!showArchived) {
        setCampaigns(items.filter((c) => c.status !== 'archived'));
      } else {
        setCampaigns(items);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    loadCampaigns(); // Reload campaigns after successful creation
    setShowCreateModal(false);
  };

  const toggleArchive = async (campaignId: string, archived: boolean) => {
    try {
      const endpoint = archived
        ? `/api/campaigns/${campaignId}/unarchive`
        : `/api/campaigns/${campaignId}/archive`;
      const res = await apiFetch(endpoint, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle archive status');
      loadCampaigns();
    } catch (err) {
      console.error('Error toggling archive:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getQualityStatus = (score?: number) => {
    if (typeof score !== 'number') {
      return { label: 'Not scored', color: '#94a3b8' };
    }
    if (score >= 85) return { label: 'Excellent', color: '#22c55e' };
    if (score >= 70) return { label: 'Good', color: '#84cc16' };
    if (score >= 50) return { label: 'Review', color: '#f97316' };
    return { label: 'Needs Attention', color: '#dc2626' };
  };

  const renderScoreBreakdown = (scoreBreakdown?: Record<string, number>) => {
    if (!scoreBreakdown) return null;
    const entries = Object.entries(scoreBreakdown)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 3);

    if (!entries.length) return null;

    return (
      <div
        style={{
          marginTop: '0.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.5rem',
        }}
      >
        {entries.map(([metric, value]) => (
          <div
            key={metric}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.04)',
              borderRadius: '8px',
              padding: '0.5rem',
              fontSize: '0.75rem',
            }}
          >
            <div
              style={{
                color: 'var(--color-text-secondary, #6b7280)',
                marginBottom: '0.25rem',
                textTransform: 'capitalize',
              }}
            >
              {metric.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <strong style={{ color: 'var(--color-text, #0f172a)' }}>
              {Math.round(value)}
            </strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className='page-container'>
      {/* Header */}
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Campaigns</h1>
          <p className='page-subtitle'>
            Organize your creative work by campaign
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className='btn btn-primary'
        >
          + New Campaign
        </button>
      </div>

      {/* Create Campaign Modal component */}
      {showCreateModal && (
        <CreateCampaignModal
          workspaceId={workspaceId || ''}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateCampaign}
        />
      )}

      {/* Campaigns Grid */}
      {loading ? (
        <div className='card-grid'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className='card skeleton-card'>
              <div className='skeleton skeleton-title' />
              <div className='skeleton skeleton-subtitle' />
              <div className='skeleton skeleton-bar' />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--color-text-secondary, #6b7280)',
            border: '1px dashed var(--color-border, #d1d5db)',
            borderRadius: '12px',
            background: 'var(--color-bg-secondary, #0b0b0b)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧭</div>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            No campaigns yet
          </div>
          <div style={{ marginBottom: '1rem' }}>
            Create your first campaign to start generating captions.
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className='btn btn-primary'
          >
            + New Campaign
          </button>
        </div>
      ) : (
        <div className='card-grid'>
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div />
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <input
                type='checkbox'
                checked={showArchived}
                onChange={(e) => {
                  setShowArchived(e.target.checked);
                  loadCampaigns();
                }}
              />
              Show archived
            </label>
          </div>
          {campaigns.map((campaign) => {
            const dateSource = campaign.updatedAt || campaign.lastUpdated;
            const qualityStatus = getQualityStatus(campaign.qualityScore);
            return (
              <Link
                key={campaign.id}
                to={`/agency/workspaces/${workspaceId}/campaigns/${campaign.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div className='card card-interactive'>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontFamily: 'var(--font-heading, sans-serif)',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: 'var(--color-text, #1f2937)',
                          margin: '0 0 0.5rem 0',
                        }}
                      >
                        {campaign.name}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor:
                              campaign.status === 'active'
                                ? 'var(--color-success-bg, #f0fdf4)'
                                : 'var(--color-background, #f8fafc)',
                            color:
                              campaign.status === 'active'
                                ? 'var(--color-success, #16a34a)'
                                : 'var(--color-text-secondary, #6b7280)',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            borderRadius: '12px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {campaign.status}
                        </span>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: 'var(--color-background, #f8fafc)',
                            color: 'var(--color-text-secondary, #6b7280)',
                            fontSize: '0.75rem',
                            borderRadius: '12px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {(campaign as any).briefData?.objective ||
                            campaign.objective}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(37, 99, 235, 0.04)',
                          border: '1px solid rgba(37, 99, 235, 0.12)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--color-text-secondary, #6b7280)',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Quality Score
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <strong
                            style={{
                              fontSize: '1.25rem',
                              color: 'var(--color-text, #0f172a)',
                            }}
                          >
                            {typeof campaign.qualityScore === 'number'
                              ? `${Math.round(campaign.qualityScore)} / 100`
                              : 'Not scored'}
                          </strong>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: qualityStatus.color,
                            }}
                          >
                            {qualityStatus.label}
                          </span>
                        </div>
                        {renderScoreBreakdown(campaign.scoreBreakdown)}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--color-primary, #2563eb)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.25rem',
                      }}
                    >
                      📋
                    </div>
                    <div style={{ marginLeft: '0.5rem' }}>
                      {campaign.status !== 'archived' ? (
                        <button
                          className='btn btn-ghost'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleArchive(campaign.id, false);
                          }}
                          aria-label='Archive campaign'
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          className='btn btn-ghost'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleArchive(campaign.id, true);
                          }}
                          aria-label='Unarchive campaign'
                        >
                          Unarchive
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary, #6b7280)',
                    }}
                  >
                    Last updated {dateSource ? formatDate(dateSource) : '—'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
