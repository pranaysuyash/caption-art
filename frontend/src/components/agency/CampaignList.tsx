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

  const [createForm, setCreateForm] = useState({
    name: '',
    objective: 'awareness'
  })

  useEffect(() => {
    loadCampaigns()
  }, [workspaceId])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/campaigns?workspaceId=${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load campaigns')
      }

      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...createForm,
          workspaceId,
          brandKitId: 'temp-id', // Needs a real brand kit ID, but for now this might fail or we need to handle it
          status: 'draft'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create campaign')
      }

      const newCampaign = await response.json()
      setCampaigns(prev => [...prev, newCampaign])
      setShowCreateForm(false)
      setCreateForm({ name: '', objective: 'awareness' })
    } catch (error) {
      console.error('Error creating campaign:', error)
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

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface, white)',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--color-text, #1f2937)',
              margin: '0 0 1.5rem 0'
            }}>
              Create New Campaign
            </h2>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--color-text, #1f2937)'
                }}>
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Spring Sale 2025"
                  className="input"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--color-text, #1f2937)'
                }}>
                  Objective
                </label>
                <select
                  value={createForm.objective}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, objective: e.target.value }))}
                  className="input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="awareness">Brand Awareness</option>
                  <option value="conversion">Conversions / Sales</option>
                  <option value="traffic">Website Traffic</option>
                  <option value="engagement">Engagement</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="button button-secondary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text, #1f2937)',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createForm.name}
                  className="button button-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--color-primary, #2563eb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: !createForm.name ? 'not-allowed' : 'pointer',
                    opacity: !createForm.name ? 0.5 : 1
                  }}
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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