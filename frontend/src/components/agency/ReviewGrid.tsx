import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

interface Creative {
  id: string
  headline: string
  bodyText: string
  ctaText: string
  placement: string
  format: string
  imageUrl?: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
}

export function ReviewGrid() {
  const { workspaceId, campaignId } = useParams<{ workspaceId: string; campaignId: string }>()
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    loadCreatives()
  }, [workspaceId, campaignId])

  const loadCreatives = async () => {
    try {
      setLoading(true)
      // Mock data for now - in real implementation this would call backend APIs
      setCreatives([
        {
          id: 'creative-1',
          headline: 'Summer Collection Now Live',
          bodyText: 'Discover our stunning new summer pieces with bold colors and modern designs.',
          ctaText: 'Shop Now',
          placement: 'ig-feed',
          format: 'instagram-square',
          approvalStatus: 'pending'
        },
        {
          id: 'creative-2',
          headline: '30% Off Summer Styles',
          bodyText: 'Limited time offer on our most popular summer collection.',
          ctaText: 'Get Yours',
          placement: 'ig-story',
          format: 'instagram-story',
          approvalStatus: 'approved'
        },
        {
          id: 'creative-3',
          headline: 'Transform Your Summer Wardrobe',
          bodyText: 'Elevate your style with our premium summer essentials.',
          ctaText: 'Learn More',
          placement: 'fb-feed',
          format: 'instagram-square',
          approvalStatus: 'pending'
        }
      ])
    } catch (error) {
      console.error('Error loading creatives:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCreatives = async () => {
    setGenerating(true)
    try {
      // Simulate generation process
      await new Promise(resolve => setTimeout(resolve, 2000))
      // In real implementation, this would call the Creative Engine API
      console.log('Generating creatives for campaign:', campaignId)
    } catch (error) {
      console.error('Error generating creatives:', error)
    } finally {
      setGenerating(false)
      loadCreatives() // Reload after generation
    }
  }

  const handleApprove = (id: string) => {
    setCreatives(prev => prev.map(creative =>
      creative.id === id ? { ...creative, approvalStatus: 'approved' } : creative
    ))
  }

  const handleReject = (id: string) => {
    setCreatives(prev => prev.map(creative =>
      creative.id === id ? { ...creative, approvalStatus: 'rejected' } : creative
    ))
  }

  const handleBulkApprove = () => {
    setCreatives(prev => prev.map(creative =>
      selectedIds.includes(creative.id) ? { ...creative, approvalStatus: 'approved' } : creative
    ))
    setSelectedIds([])
  }

  const handleBulkReject = () => {
    setCreatives(prev => prev.map(creative =>
      selectedIds.includes(creative.id) ? { ...creative, approvalStatus: 'rejected' } : creative
    ))
    setSelectedIds([])
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const filteredCreatives = filter === 'all' ? creatives : creatives.filter(c => c.approvalStatus === filter)
    setSelectedIds(filteredCreatives.map(c => c.id))
  }

  const filteredCreatives = filter === 'all'
    ? creatives
    : creatives.filter(creative => creative.approvalStatus === filter)

  const approvedCount = creatives.filter(c => c.approvalStatus === 'approved').length

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text-secondary, #6b7280)',
        fontFamily: 'var(--font-body, sans-serif)'
      }}>
        Loading review grid...
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--font-body, sans-serif)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'var(--color-text, #1f2937)',
            margin: 0
          }}>
            Review & Approve
          </h1>
          <p style={{
            color: 'var(--color-text-secondary, #6b7280)',
            marginTop: '0.5rem',
            marginBottom: 0
          }}>
            Approved: {approvedCount} / {creatives.length} creatives
          </p>
        </div>

        {creatives.length === 0 ? (
          <button
            onClick={handleGenerateCreatives}
            disabled={generating}
            className="button button-primary"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.5 : 1
            }}
          >
            {generating ? 'Generating...' : 'Generate Creatives'}
          </button>
        ) : approvedCount > 0 && (
          <button
            className="button button-primary"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-success, #16a34a)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Export {approvedCount} Approved →
          </button>
        )}
      </div>

      {/* Empty State */}
      {creatives.length === 0 && !generating && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-background, #f8fafc)',
          borderRadius: '12px',
          border: '2px dashed var(--color-border, #d1d5db)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
          <h3 style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--color-text, #1f2937)',
            margin: '0 0 0.5rem 0'
          }}>
            No creatives yet
          </h3>
          <p style={{
            color: 'var(--color-text-secondary, #6b7280)',
            marginBottom: '1.5rem',
            maxWidth: '400px',
            margin: '0 auto 1.5rem'
          }}>
            Generate your first set of creatives using your brand kit and campaign assets.
          </p>
          <button
            onClick={handleGenerateCreatives}
            disabled={generating}
            className="button button-primary"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.5 : 1
            }}
          >
            {generating ? 'Generating...' : 'Generate Your First Creatives'}
          </button>
        </div>
      )}

      {/* Generating State */}
      {generating && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'var(--color-surface, white)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--color-border, #e5e7eb)',
            borderTop: '4px solid var(--color-primary, #2563eb)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <h3 style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '1.25rem',
            color: 'var(--color-text, #1f2937)',
            margin: '0 0 0.5rem 0'
          }}>
            Generating Creatives
          </h3>
          <p style={{
            color: 'var(--color-text-secondary, #6b7280)',
            margin: 0
          }}>
            Our Creative Engine is working on your campaign...
          </p>
        </div>
      )}

      {/* Filters and Bulk Actions */}
      {creatives.length > 0 && !generating && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--color-surface, white)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All ({creatives.length})</option>
              <option value="pending">Pending ({creatives.filter(c => c.approvalStatus === 'pending').length})</option>
              <option value="approved">Approved ({approvedCount})</option>
              <option value="rejected">Rejected ({creatives.filter(c => c.approvalStatus === 'rejected').length})</option>
            </select>

            <button
              onClick={handleSelectAll}
              className="button button-secondary"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--color-border, #d1d5db)',
                backgroundColor: 'transparent',
                color: 'var(--color-text, #1f2937)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                {selectedIds.length} selected
              </span>
              <button
                onClick={handleBulkApprove}
                className="button button-primary"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-success, #16a34a)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                className="button button-secondary"
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--color-error, #dc2626)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-error, #dc2626)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Reject Selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* Creatives Grid */}
      {filteredCreatives.length > 0 && !generating && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredCreatives.map((creative) => (
            <div
              key={creative.id}
              style={{
                backgroundColor: 'var(--color-surface, white)',
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Checkbox */}
              <div style={{ padding: '1rem 1rem 0' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(creative.id)}
                  onChange={() => handleSelect(creative.id)}
                  style={{
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Creative Preview */}
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: 'var(--color-background, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 1rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #e5e7eb)'
              }}>
                <div style={{
                  textAlign: 'center',
                  color: 'var(--color-text-secondary, #6b7280)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
                  <div style={{ fontSize: '0.875rem' }}>
                    {creative.format} • {creative.placement}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '0 1rem 1rem' }}>
                <h4 style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--color-text, #1f2937)',
                  margin: '0 0 0.5rem 0',
                  lineHeight: '1.4'
                }}>
                  {creative.headline}
                </h4>

                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text, #1f2937)',
                  margin: '0 0 0.5rem 0',
                  lineHeight: '1.5'
                }}>
                  {creative.bodyText}
                </p>

                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--color-primary, #2563eb)',
                  marginBottom: '1rem'
                }}>
                  {creative.ctaText}
                </div>

                {/* Status Badge */}
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  backgroundColor: creative.approvalStatus === 'approved'
                    ? 'var(--color-success-bg, #f0fdf4)'
                    : creative.approvalStatus === 'rejected'
                    ? 'var(--color-error-bg, #fef2f2)'
                    : 'var(--color-background, #f8fafc)',
                  color: creative.approvalStatus === 'approved'
                    ? 'var(--color-success, #16a34a)'
                    : creative.approvalStatus === 'rejected'
                    ? 'var(--color-error, #dc2626)'
                    : 'var(--color-text-secondary, #6b7280)',
                  textTransform: 'capitalize'
                }}>
                  {creative.approvalStatus}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleApprove(creative.id)}
                    disabled={creative.approvalStatus === 'approved'}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--color-success, #16a34a)',
                      backgroundColor: creative.approvalStatus === 'approved'
                        ? 'var(--color-success, #16a34a)'
                        : 'transparent',
                      color: creative.approvalStatus === 'approved'
                        ? 'white'
                        : 'var(--color-success, #16a34a)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: creative.approvalStatus === 'approved' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {creative.approvalStatus === 'approved' ? 'Approved' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(creative.id)}
                    disabled={creative.approvalStatus === 'rejected'}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--color-error, #dc2626)',
                      backgroundColor: creative.approvalStatus === 'rejected'
                        ? 'var(--color-error, #dc2626)'
                        : 'transparent',
                      color: creative.approvalStatus === 'rejected'
                        ? 'white'
                        : 'var(--color-error, #dc2626)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: creative.approvalStatus === 'rejected' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {creative.approvalStatus === 'rejected' ? 'Rejected' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}