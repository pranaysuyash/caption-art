import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CampaignBriefEditor } from '../CampaignBriefEditor';
import '../CampaignBriefEditor.css';

export function CampaignDetail() {
  const { workspaceId, campaignId } = useParams<{
    workspaceId: string;
    campaignId: string;
  }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [brandKit, setBrandKit] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'brand-kit' | 'assets' | 'campaign-brief'
  >('brand-kit');
  const [showBriefEditor, setShowBriefEditor] = useState(false);

  useEffect(() => {
    loadCampaignData();
  }, [workspaceId, campaignId]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Campaign
      const campaignRes = await fetch(
        `${
          import.meta.env.VITE_API_BASE || 'http://localhost:3001'
        }/api/campaigns/${campaignId}`,
        { headers }
      );
      if (campaignRes.ok) {
        const data = await campaignRes.json();
        setCampaign(data.campaign);

        // Fetch Brand Kit (if campaign has one)
        if (data.campaign.brandKitId) {
          const brandKitRes = await fetch(
            `${
              import.meta.env.VITE_API_BASE || 'http://localhost:3001'
            }/api/brand-kits/${data.campaign.brandKitId}`,
            { headers }
          );
          if (brandKitRes.ok) {
            const bkData = await brandKitRes.json();
            setBrandKit(bkData);
          }
        }
      }

      // Fetch Assets
      const assetsRes = await fetch(
        `${
          import.meta.env.VITE_API_BASE || 'http://localhost:3001'
        }/api/assets?workspaceId=${workspaceId}`,
        { headers }
      );
      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!campaignId || !brandKit) return;

    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Update Campaign
      await fetch(
        `${
          import.meta.env.VITE_API_BASE || 'http://localhost:3001'
        }/api/campaigns/${campaignId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(campaign),
        }
      );

      // Update Brand Kit
      if (brandKit.id) {
        await fetch(
          `${
            import.meta.env.VITE_API_BASE || 'http://localhost:3001'
          }/api/brand-kits/${brandKit.id}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify(brandKit),
          }
        );
      }

      alert('Campaign data saved!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div
      style={{ padding: '2rem', fontFamily: 'var(--font-body, sans-serif)' }}
    >
      {/* Content */}
      {activeTab === 'brand-kit' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
          }}
        >
          {/* Brand Kit Editor */}
          <div
            style={{
              backgroundColor: 'var(--color-surface, white)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--color-text, #1f2937)',
                  margin: 0,
                }}
              >
                Brand Configuration
              </h3>
              <button
                onClick={handleSave}
                className='button button-primary'
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-primary, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
            </div>

            <div
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
                  Colors
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      Primary
                    </label>
                    <input
                      type='color'
                      value={brandKit?.colors?.primary || '#000000'}
                      onChange={(e) =>
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            primary: e.target.value,
                          },
                        })
                      }
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      Secondary
                    </label>
                    <input
                      type='color'
                      value={brandKit?.colors?.secondary || '#000000'}
                      onChange={(e) =>
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            secondary: e.target.value,
                          },
                        })
                      }
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      Tertiary
                    </label>
                    <input
                      type='color'
                      value={brandKit?.colors?.tertiary || '#000000'}
                      onChange={(e) =>
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            tertiary: e.target.value,
                          },
                        })
                      }
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
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
                  Brand Personality
                </label>
                <textarea
                  value={brandKit?.brandPersonality || ''}
                  onChange={(e) =>
                    setBrandKit({
                      ...brandKit,
                      brandPersonality: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '60px',
                    backgroundColor: 'white',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Campaign Settings */}
          <div
            style={{
              backgroundColor: 'var(--color-surface, white)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 1rem 0',
              }}
            >
              Campaign Settings
            </h3>

            <div
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
                  Primary Offer
                </label>
                <input
                  type='text'
                  value={campaign?.primaryOffer || ''}
                  onChange={(e) =>
                    setCampaign({ ...campaign, primaryOffer: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
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
                  Target Audience
                </label>
                <textarea
                  value={brandKit?.targetAudience || ''}
                  onChange={(e) =>
                    setBrandKit({ ...brandKit, targetAudience: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '60px',
                    backgroundColor: 'white',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div
          style={{
            backgroundColor: 'var(--color-surface, white)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: 0,
              }}
            >
              Campaign Assets
            </h3>

            <button
              className='button button-primary'
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              + Upload Assets
            </button>
          </div>

          {assets.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                border: '2px dashed var(--color-border, #d1d5db)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background, #f8fafc)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
              <h4
                style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1rem',
                  color: 'var(--color-text, #1f2937)',
                  margin: '0 0 0.5rem 0',
                }}
              >
                No assets yet
              </h4>
              <p
                style={{
                  color: 'var(--color-text-secondary, #6b7280)',
                  margin: 0,
                  fontSize: '0.875rem',
                }}
              >
                Upload images and videos to start generating creatives
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    backgroundColor: 'var(--color-background, #f8fafc)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'var(--color-primary, #2563eb)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      fontSize: '1.5rem',
                      color: 'white',
                    }}
                  >
                    🖼️
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--color-text, #1f2937)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {asset.filename}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary, #6b7280)',
                    }}
                  >
                    {asset.size} • {asset.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'campaign-brief' && (
        <div
          style={{
            backgroundColor: 'var(--color-surface, white)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--color-text, #1f2937)',
                  margin: '0 0 0.5rem 0',
                }}
              >
                Campaign Brief
              </h3>
              <p
                style={{
                  color: 'var(--color-text-secondary, #6b7280)',
                  margin: 0,
                  fontSize: '0.875rem',
                }}
              >
                Define strategic requirements to guide creative generation
              </p>
            </div>

            <button
              onClick={() => setShowBriefEditor(!showBriefEditor)}
              className='button button-primary'
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
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
                  const response = await fetch(
                    `/api/campaign-briefs/${campaignId}`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ brief: briefData }),
                    }
                  );

                  if (response.ok) {
                    const result = await response.json();
                    setCampaign(result.campaign);
                    setShowBriefEditor(false);
                  } else {
                    console.error('Failed to save campaign brief');
                  }
                } catch (error) {
                  console.error('Error saving campaign brief:', error);
                }
              }}
              onCancel={() => setShowBriefEditor(false)}
            />
          ) : (
            <div
              style={{
                minHeight: '200px',
                padding: '2rem',
                border: '2px dashed var(--color-border, #d1d5db)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background, #f8fafc)',
                textAlign: 'center',
              }}
            >
              {campaign?.brief ? (
                <div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                    📋
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-heading, sans-serif)',
                      fontSize: '1rem',
                      color: 'var(--color-text, #1f2937)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    Campaign Brief Complete
                  </h4>
                  <p
                    style={{
                      color: 'var(--color-text-secondary, #6b7280)',
                      margin: 0,
                      fontSize: '0.875rem',
                    }}
                  >
                    Strategic brief has been defined and is ready for creative
                    generation
                  </p>
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: 'var(--color-surface, white)',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border, #e5e7eb)',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      <strong>Key Message:</strong>{' '}
                      {campaign.brief.keyMessage || 'Not defined'}
                    </div>
                    {campaign.brief.primaryKPI && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary, #6b7280)',
                          marginTop: '0.5rem',
                        }}
                      >
                        <strong>Primary KPI:</strong>{' '}
                        {campaign.brief.primaryKPI}
                      </div>
                    )}
                    {campaign.brief.primaryAudience?.demographics && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary, #6b7280)',
                          marginTop: '0.5rem',
                        }}
                      >
                        <strong>Target Audience:</strong>{' '}
                        {campaign.brief.primaryAudience.demographics}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                    📝
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-heading, sans-serif)',
                      fontSize: '1rem',
                      color: 'var(--color-text, #1f2937)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    No Campaign Brief Yet
                  </h4>
                  <p
                    style={{
                      color: 'var(--color-text-secondary, #6b7280)',
                      margin: 0,
                      fontSize: '0.875rem',
                    }}
                  >
                    Create a comprehensive campaign brief to guide the AI
                    creative generation process
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
