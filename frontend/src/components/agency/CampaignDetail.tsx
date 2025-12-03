import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CampaignBriefEditor } from '../CampaignBriefEditor'
import '../CampaignBriefEditor.css'

export function CampaignDetail() {
  const { workspaceId, campaignId } = useParams<{ workspaceId: string; campaignId: string }>()
  const [campaign, setCampaign] = useState<any>(null)
  const [brandKit, setBrandKit] = useState<any>(null)
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'brand-kit' | 'assets' | 'campaign-brief'>('brand-kit')
  const [showBriefEditor, setShowBriefEditor] = useState(false)

  useEffect(() => {
    loadCampaignData()
  }, [workspaceId, campaignId])

  const loadCampaignData = async () => {
    try {
      setLoading(true)
      // Mock data for now
      setCampaign({
        id: campaignId,
        name: 'Summer Collection Launch',
        status: 'active',
        objective: 'awareness',
        primaryOffer: '30% off summer collection'
      })

      setBrandKit({
        id: 'brand-kit-1',
        name: 'Summer Brand Kit',
        colors: { primary: '#FF6B35', secondary: '#004E89', tertiary: '#A3C4AD' },
        fonts: { heading: 'Inter Bold', body: 'Inter Regular' },
        brandPersonality: 'Bold, confident, playful',
        targetAudience: 'Fashion-conscious women 25-45',
        valueProposition: 'Premium style at accessible prices'
      })

      setAssets([
        { id: 'asset-1', filename: 'summer-dress.jpg', type: 'image', size: '2.4MB' },
        { id: 'asset-2', filename: 'beach-look.jpg', type: 'image', size: '1.8MB' }
      ])
    } catch (error) {
      console.error('Error loading campaign data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text-secondary, #6b7280)',
        fontFamily: 'var(--font-body, sans-serif)'
      }}>
        Loading campaign...
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
            {campaign?.name}
          </h1>
          <p style={{
            color: 'var(--color-text-secondary, #6b7280)',
            marginTop: '0.5rem',
            marginBottom: 0
          }}>
            {campaign?.objective} • {campaign?.status}
          </p>
        </div>

        <Link
          to={`/agency/workspaces/${workspaceId}/campaigns/${campaignId}/review`}
          className="button button-primary"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-primary, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          Generate Creatives →
        </Link>
      </div>

      {/* Tabs */}
      <div style={{
        borderBottom: '1px solid var(--color-border, #e5e7eb)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('brand-kit')}
            style={{
              padding: '1rem 0',
              border: 'none',
              borderBottom: activeTab === 'brand-kit' ? '2px solid var(--color-primary, #2563eb)' : 'none',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-heading, sans-serif)',
              fontWeight: '600',
              color: activeTab === 'brand-kit' ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary, #6b7280)',
              cursor: 'pointer'
            }}
          >
            Brand Kit
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            style={{
              padding: '1rem 0',
              border: 'none',
              borderBottom: activeTab === 'assets' ? '2px solid var(--color-primary, #2563eb)' : 'none',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-heading, sans-serif)',
              fontWeight: '600',
              color: activeTab === 'assets' ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary, #6b7280)',
              cursor: 'pointer'
            }}
          >
            Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('campaign-brief')}
            style={{
              padding: '1rem 0',
              border: 'none',
              borderBottom: activeTab === 'campaign-brief' ? '2px solid var(--color-primary, #2563eb)' : 'none',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-heading, sans-serif)',
              fontWeight: '600',
              color: activeTab === 'campaign-brief' ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary, #6b7280)',
              cursor: 'pointer'
            }}
          >
            Campaign Brief
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'brand-kit' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem'
        }}>
          {/* Brand Kit Editor */}
          <div style={{
            backgroundColor: 'var(--color-surface, white)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-text, #1f2937)',
              margin: '0 0 1rem 0'
            }}>
              Brand Configuration
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--color-text, #1f2937)'
                }}>
                  Colors
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: brandKit?.colors?.primary || '#000',
                      borderRadius: '8px',
                      marginBottom: '0.25rem'
                    }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>Primary</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: brandKit?.colors?.secondary || '#000',
                      borderRadius: '8px',
                      marginBottom: '0.25rem'
                    }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>Secondary</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: brandKit?.colors?.tertiary || '#000',
                      borderRadius: '8px',
                      marginBottom: '0.25rem'
                    }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>Tertiary</span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--color-text, #1f2937)'
                }}>
                  Brand Personality
                </label>
                <textarea
                  value={brandKit?.brandPersonality || ''}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '60px',
                    backgroundColor: 'var(--color-background, #f8fafc)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Campaign Settings */}
          <div style={{
            backgroundColor: 'var(--color-surface, white)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-text, #1f2937)',
              margin: '0 0 1rem 0'
            }}>
              Campaign Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--color-text, #1f2937)'
                }}>
                  Primary Offer
                </label>
                <input
                  type="text"
                  value={campaign?.primaryOffer || ''}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    backgroundColor: 'var(--color-background, #f8fafc)'
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
                  Target Audience
                </label>
                <textarea
                  value={brandKit?.targetAudience || ''}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '60px',
                    backgroundColor: 'var(--color-background, #f8fafc)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div style={{
          backgroundColor: 'var(--color-surface, white)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-text, #1f2937)',
              margin: 0
            }}>
              Campaign Assets
            </h3>

            <button
              className="button button-primary"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Upload Assets
            </button>
          </div>

          {assets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              border: '2px dashed var(--color-border, #d1d5db)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background, #f8fafc)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
              <h4 style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: '1rem',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 0.5rem 0'
              }}>
                No assets yet
              </h4>
              <p style={{
                color: 'var(--color-text-secondary, #6b7280)',
                margin: 0,
                fontSize: '0.875rem'
              }}>
                Upload images and videos to start generating creatives
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    backgroundColor: 'var(--color-background, #f8fafc)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'var(--color-primary, #2563eb)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: '1.5rem',
                    color: 'white'
                  }}>
                    🖼️
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                    marginBottom: '0.25rem'
                  }}>
                    {asset.filename}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary, #6b7280)'
                  }}>
                    {asset.size} • {asset.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'campaign-brief' && (
        <div style={{
          backgroundColor: 'var(--color-surface, white)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 0.5rem 0'
              }}>
                Campaign Brief
              </h3>
              <p style={{
                color: 'var(--color-text-secondary, #6b7280)',
                margin: 0,
                fontSize: '0.875rem'
              }}>
                Define strategic requirements to guide creative generation
              </p>
            </div>

            <button
              onClick={() => setShowBriefEditor(!showBriefEditor)}
              className="button button-primary"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {showBriefEditor ? 'Cancel' : 'Edit Brief'}
            </button>
          </div>

          {showBriefEditor ? (
            <CampaignBriefEditor
              initialData={campaign?.brief || {}}
              onSave={async (briefData) => {
                try {
                  // Save brief data via API
                  const response = await fetch(`/api/campaign-briefs/${campaignId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ brief: briefData })
                  })

                  if (response.ok) {
                    const result = await response.json()
                    setCampaign(result.campaign)
                    setShowBriefEditor(false)
                  } else {
                    console.error('Failed to save campaign brief')
                  }
                } catch (error) {
                  console.error('Error saving campaign brief:', error)
                }
              }}
              onCancel={() => setShowBriefEditor(false)}
            />
          ) : (
            <div style={{
              minHeight: '200px',
              padding: '2rem',
              border: '2px dashed var(--color-border, #d1d5db)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background, #f8fafc)',
              textAlign: 'center'
            }}>
              {campaign?.brief ? (
                <div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📋</div>
                  <h4 style={{
                    fontFamily: 'var(--font-heading, sans-serif)',
                    fontSize: '1rem',
                    color: 'var(--color-text, #1f2937)',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Campaign Brief Complete
                  </h4>
                  <p style={{
                    color: 'var(--color-text-secondary, #6b7280)',
                    margin: 0,
                    fontSize: '0.875rem'
                  }}>
                    Strategic brief has been defined and is ready for creative generation
                  </p>
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--color-surface, white)',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    textAlign: 'left'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                      <strong>Key Message:</strong> {campaign.brief.keyMessage || 'Not defined'}
                    </div>
                    {campaign.brief.primaryKPI && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #6b7280)', marginTop: '0.5rem' }}>
                        <strong>Primary KPI:</strong> {campaign.brief.primaryKPI}
                      </div>
                    )}
                    {campaign.brief.primaryAudience?.demographics && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #6b7280)', marginTop: '0.5rem' }}>
                        <strong>Target Audience:</strong> {campaign.brief.primaryAudience.demographics}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
                  <h4 style={{
                    fontFamily: 'var(--font-heading, sans-serif)',
                    fontSize: '1rem',
                    color: 'var(--color-text, #1f2937)',
                    margin: '0 0 0.5rem 0'
                  }}>
                    No Campaign Brief Yet
                  </h4>
                  <p style={{
                    color: 'var(--color-text-secondary, #6b7280)',
                    margin: 0,
                    fontSize: '0.875rem'
                  }}>
                    Create a comprehensive campaign brief to guide the AI creative generation process
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}