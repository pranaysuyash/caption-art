import { useState, useEffect } from 'react';
import apiFetch from '../lib/api/httpClient';
import {
  AdCreative,
  AdCreativeSlot,
  AdCreativeGenerationRequest,
  SLOT_CONFIGS,
  FUNNEL_STAGE_STRATEGIES,
} from '../types/adCreative';

interface AdCreativeEditorProps {
  campaignId: string;
  brandKitId: string;
  initialData?: AdCreative;
  onSave: (adCreative: AdCreative) => void;
  onCancel: () => void;
}

export function AdCreativeEditor({
  campaignId,
  brandKitId,
  initialData,
  onSave,
  onCancel,
}: AdCreativeEditorProps) {
  const [formData, setFormData] = useState<AdCreativeGenerationRequest>({
    campaignId,
    brandKitId,
    objective: initialData?.objective || 'consideration',
    funnelStage: initialData?.funnelStage || 'middle',
    platforms: [
      initialData?.primaryPlatform === 'multi'
        ? 'instagram'
        : initialData?.primaryPlatform || 'instagram',
    ],
    targetAudience: {
      demographics: '',
      psychographics: '',
      painPoints: [],
    },
    keyMessage: '',
    cta: '',
    tone: ['professional'],
    variations: 3,
    includeVisuals: false,
  });

  const [slots, setSlots] = useState<AdCreativeSlot[]>(
    initialData?.slots || []
  );
  const [generatedCreative, setGeneratedCreative] = useState<AdCreative | null>(
    initialData || null
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'slots' | 'preview'>(
    'setup'
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const platforms = ['instagram', 'facebook', 'linkedin'];
  const objectives = [
    {
      value: 'awareness',
      label: 'Awareness',
      description: 'Introduce your brand to new audiences',
    },
    {
      value: 'consideration',
      label: 'Consideration',
      description: 'Encourage research and comparison',
    },
    {
      value: 'conversion',
      label: 'Conversion',
      description: 'Drive purchases and sign-ups',
    },
    {
      value: 'retention',
      label: 'Retention',
      description: 'Keep customers engaged and loyal',
    },
  ];

  const funnelStages = [
    {
      value: 'top',
      label: 'Top of Funnel',
      description: 'Broad reach and brand awareness',
    },
    {
      value: 'middle',
      label: 'Middle of Funnel',
      description: 'Consideration and evaluation',
    },
    {
      value: 'bottom',
      label: 'Bottom of Funnel',
      description: 'Direct conversion and action',
    },
  ];

  const toneOptions = [
    'Professional',
    'Friendly',
    'Urgent',
    'Inspirational',
    'Educational',
    'Playful',
    'Sophisticated',
    'Casual',
    'Authoritative',
    'Empathetic',
    'Bold',
    'Minimalist',
  ];

  const generateAdCreative = async () => {
    if (!formData.keyMessage || !formData.cta) {
      alert('Please fill in key message and CTA before generating');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/ad-creatives/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ad creative');
      }

      const result = await response.json();
      setGeneratedCreative(result.result.adCreative);
      setSlots(result.result.adCreative.slots);
      setActiveTab('slots');
    } catch (error) {
      console.error('Error generating ad creative:', error);
      alert('Failed to generate ad creative. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSlot = (slotId: string, updates: Partial<AdCreativeSlot>) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot))
    );
  };

  const addVariation = (slotId: string, variation: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? { ...slot, variations: [...(slot.variations || []), variation] }
          : slot
      )
    );
  };

  const removeVariation = (slotId: string, index: number) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              variations: slot.variations?.filter((_, i) => i !== index),
            }
          : slot
      )
    );
  };

  const getSlotConfig = (slotType: string) => {
    const slotKey = slotType as keyof typeof SLOT_CONFIGS;
    return SLOT_CONFIGS[slotKey];
  };

  const getCharacterCount = (
    content: string,
    platform: string,
    slotType: string
  ) => {
    const config = getSlotConfig(slotType);
    const maxLength =
      config?.maxLength?.[platform as keyof typeof config.maxLength];
    return maxLength ? `${content.length}/${maxLength}` : content.length;
  };

  const isOverLimit = (content: string, platform: string, slotType: string) => {
    const config = getSlotConfig(slotType);
    const maxLength =
      config?.maxLength?.[platform as keyof typeof config.maxLength];
    return maxLength && content.length > maxLength;
  };

  const handleSave = () => {
    if (generatedCreative) {
      const creativeWithSlots = {
        ...generatedCreative,
        slots,
        updatedAt: new Date(),
      };
      onSave(creativeWithSlots);
    } else {
      alert('Please generate an ad creative first');
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-body, sans-serif)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--color-border, #e5e7eb)',
          paddingBottom: '1rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--color-text, #1f2937)',
            margin: 0,
          }}
        >
          Ad Creative Editor
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-background, #f3f4f6)',
              color: 'var(--color-text, #1f2937)',
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
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
            Save Creative
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid var(--color-border, #e5e7eb)',
          marginBottom: '2rem',
        }}
      >
        {[
          { id: 'setup', label: 'Setup', icon: '⚙️' },
          { id: 'slots', label: 'Content Slots', icon: '📝' },
          { id: 'preview', label: 'Preview', icon: '👁️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '1rem 1.5rem',
              borderBottom:
                activeTab === tab.id
                  ? '2px solid var(--color-primary, #2563eb)'
                  : 'none',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-heading, sans-serif)',
              fontWeight: '600',
              color:
                activeTab === tab.id
                  ? 'var(--color-primary, #2563eb)'
                  : 'var(--color-text-secondary, #6b7280)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'setup' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Objective & Funnel Stage */}
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
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 1rem 0',
              }}
            >
              Campaign Strategy
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
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
                  Primary Objective
                </label>
                <select
                  value={formData.objective}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      objective: e.target.value as any,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  {objectives.map((obj) => (
                    <option key={obj.value} value={obj.value}>
                      {obj.label} - {obj.description}
                    </option>
                  ))}
                </select>
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
                  Funnel Stage
                </label>
                <select
                  value={formData.funnelStage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      funnelStage: e.target.value as any,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  {funnelStages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label} - {stage.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
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
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 1rem 0',
              }}
            >
              Target Platforms
            </h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {platforms.map((platform) => (
                <label
                  key={platform}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: formData.platforms.includes(
                      platform as any
                    )
                      ? 'var(--color-primary, #2563eb)'
                      : 'var(--color-background, #f8fafc)',
                    color: formData.platforms.includes(platform as any)
                      ? 'white'
                      : 'var(--color-text, #1f2937)',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={formData.platforms.includes(platform as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData((prev) => ({
                          ...prev,
                          platforms: [...prev.platforms, platform as any],
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          platforms: prev.platforms.filter(
                            (p) => p !== platform
                          ),
                        }));
                      }
                    }}
                    style={{ margin: 0 }}
                  />
                  <span
                    style={{ textTransform: 'capitalize', fontWeight: '500' }}
                  >
                    {platform}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Key Message & CTA */}
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
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 1rem 0',
              }}
            >
              Core Message
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
                >
                  Key Message
                </label>
                <textarea
                  value={formData.keyMessage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      keyMessage: e.target.value,
                    }))
                  }
                  placeholder="What's the main message you want to communicate?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '100px',
                    resize: 'vertical',
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
                  Call to Action
                </label>
                <input
                  type='text'
                  value={formData.cta}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cta: e.target.value }))
                  }
                  placeholder='What should people do? (e.g., Shop Now, Learn More)'
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tone Selection */}
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
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 1rem 0',
              }}
            >
              Brand Tone
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {toneOptions.map((tone) => (
                <label
                  key={tone}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: formData.tone.includes(tone)
                      ? 'var(--color-primary, #2563eb)'
                      : 'var(--color-background, #f8fafc)',
                    color: formData.tone.includes(tone)
                      ? 'white'
                      : 'var(--color-text, #1f2937)',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={formData.tone.includes(tone)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData((prev) => ({
                          ...prev,
                          tone: [...prev.tone, tone],
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          tone: prev.tone.filter((t) => t !== tone),
                        }));
                      }
                    }}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{tone}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={generateAdCreative}
              disabled={loading || !formData.keyMessage || !formData.cta}
              style={{
                padding: '1rem 2rem',
                backgroundColor:
                  loading || !formData.keyMessage || !formData.cta
                    ? 'var(--color-text-secondary, #6b7280)'
                    : 'var(--color-primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor:
                  loading || !formData.keyMessage || !formData.cta
                    ? 'not-allowed'
                    : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto',
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  Generating Creative...
                </>
              ) : (
                <>🎨 Generate Ad Creative</>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {slots.map((slot) => (
            <div
              key={slot.id}
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
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--color-text, #1f2937)',
                    margin: 0,
                    textTransform: 'capitalize',
                  }}
                >
                  {slot.type}
                </h3>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary, #6b7280)',
                  }}
                >
                  {formData.platforms.map((platform) => (
                    <span key={platform} style={{ margin: '0 0.5rem' }}>
                      {platform}:{' '}
                      {getCharacterCount(slot.content, platform, slot.type)}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: 'var(--color-text, #1f2937)',
                    }}
                  >
                    Primary Content
                  </label>
                  <textarea
                    value={slot.content}
                    onChange={(e) =>
                      updateSlot(slot.id, { content: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border, #d1d5db)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      minHeight: '80px',
                    }}
                  />
                </div>

                {slot.variations && slot.variations.length > 0 && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: 'var(--color-text, #1f2937)',
                      }}
                    >
                      Variations
                    </label>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {slot.variations.map((variation, index) => (
                        <div
                          key={index}
                          style={{ display: 'flex', gap: '0.5rem' }}
                        >
                          <input
                            type='text'
                            value={variation}
                            onChange={(e) => {
                              const newVariations = [...slot.variations!];
                              newVariations[index] = e.target.value;
                              updateSlot(slot.id, {
                                variations: newVariations,
                              });
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              border: '1px solid var(--color-border, #d1d5db)',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                            }}
                          />
                          <button
                            onClick={() => removeVariation(slot.id, index)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: 'var(--color-error, #ef4444)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      const newVariation = prompt('Enter new variation:');
                      if (newVariation) {
                        addVariation(slot.id, newVariation);
                      }
                    }}
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
                    + Add Variation
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'preview' && generatedCreative && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {formData.platforms.map((platform) => (
            <div
              key={platform}
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
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--color-text, #1f2937)',
                  margin: '0 0 1rem 0',
                  textTransform: 'capitalize',
                }}
              >
                {platform} Preview
              </h3>

              <div
                style={{
                  backgroundColor:
                    platform === 'instagram' ? '#fff' : '#f0f2f5',
                  border:
                    platform === 'instagram' ? '1px solid #dbdbdb' : 'none',
                  borderRadius: platform === 'instagram' ? '8px' : '0',
                  padding: '1rem',
                  maxWidth: '500px',
                }}
              >
                {slots
                  .filter((slot) => slot.type !== 'description')
                  .map((slot) => (
                    <div key={slot.id} style={{ marginBottom: '0.75rem' }}>
                      {slot.type === 'headline' && (
                        <div
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: 'var(--color-text, #1f2937)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {slot.content}
                        </div>
                      )}
                      {slot.type === 'subheadline' && (
                        <div
                          style={{
                            fontSize: '1rem',
                            color: 'var(--color-text-secondary, #6b7280)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {slot.content}
                        </div>
                      )}
                      {slot.type === 'body' && (
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text, #1f2937)',
                            lineHeight: '1.5',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {slot.content}
                        </div>
                      )}
                      {slot.type === 'primaryText' && (
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text, #1f2937)',
                            lineHeight: '1.4',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {slot.content}
                        </div>
                      )}
                      {slot.type === 'cta' && (
                        <div
                          style={{
                            display: 'inline-block',
                            backgroundColor:
                              platform === 'facebook'
                                ? '#1877f2'
                                : 'var(--color-primary, #2563eb)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          {slot.content}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
