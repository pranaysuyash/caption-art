import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

interface Campaign {
  id: string
  name: string
  status: string
  objective: string
  lastUpdated: string
}

export function CampaignList() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadCampaigns()
  }, [workspaceId])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      // Mock data for now
      setCampaigns([
        {
          id: 'campaign-1',
          name: 'Summer Collection Launch',
          status: 'active',
          objective: 'awareness',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'campaign-2',
          name: 'Holiday Promotion',
          status: 'draft',
          objective: 'conversion',
          lastUpdated: new Date(Date.now() - 86400000).toISOString()
        }
      ])
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
            Campaigns
          </h1>
          <p style={{
            color: 'var(--color-text-secondary, #6b7280)',
            marginTop: '0.5rem',
            marginBottom: 0
          }}>
            Organize your creative work by campaign
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="button button-primary"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-primary, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          + New Campaign
        </button>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--color-text-secondary, #6b7280)'
        }}>
          Loading campaigns...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              to={`/agency/workspaces/${workspaceId}/campaigns/${campaign.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{
                backgroundColor: 'var(--color-surface, white)',
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)'
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border, #e5e7eb)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-heading, sans-serif)',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'var(--color-text, #1f2937)',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {campaign.name}
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: campaign.status === 'active'
                          ? 'var(--color-success-bg, #f0fdf4)'
                          : 'var(--color-background, #f8fafc)',
                        color: campaign.status === 'active'
                          ? 'var(--color-success, #16a34a)'
                          : 'var(--color-text-secondary, #6b7280)',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {campaign.status}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: 'var(--color-background, #f8fafc)',
                        color: 'var(--color-text-secondary, #6b7280)',
                        fontSize: '0.75rem',
                        borderRadius: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {campaign.objective}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--color-primary, #2563eb)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem'
                  }}>
                    📋
                  </div>
                </div>

                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary, #6b7280)'
                }}>
                  Last updated {formatDate(campaign.lastUpdated)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}