/**
 * Campaign Brief Editor - Comprehensive campaign brief input system
 */

import { useState } from 'react'

interface CampaignBriefData {
  clientOverview?: string
  campaignPurpose?: string
  primaryKPI?: string
  secondaryKPIs?: string[]
  targetMetrics?: {
    impressions?: number
    reach?: number
    engagement?: number
    conversions?: number
    roi?: number
  }
  competitorInsights?: string[]
  differentiators?: string[]
  primaryAudience?: {
    demographics?: string
    psychographics?: string
    painPoints?: string[]
    motivations?: string[]
  }
  keyMessage?: string
  supportingPoints?: string[]
  emotionalAppeal?: string
  mandatoryInclusions?: string[]
  mandatoryExclusions?: string[]
  legalRequirements?: string[]
  platformSpecific?: {
    instagram?: string
    facebook?: string
    linkedin?: string
  }
  campaignDuration?: string
  seasonality?: string
  urgency?: string
}

interface CampaignBriefEditorProps {
  initialData?: CampaignBriefData
  onSave: (brief: CampaignBriefData) => void
  onCancel?: () => void
  loading?: boolean
}

export function CampaignBriefEditor({ initialData, onSave, onCancel, loading }: CampaignBriefEditorProps) {
  const [brief, setBrief] = useState<CampaignBriefData>(initialData || {})
  const [activeSection, setActiveSection] = useState<string>('client-context')

  const OBJECTIVE_OPTIONS = [
    { value: 'awareness', label: 'Brand Awareness', description: 'Increase brand visibility and recognition' },
    { value: 'traffic', label: 'Drive Traffic', description: 'Increase website visits and user engagement' },
    { value: 'conversion', label: 'Generate Conversions', description: 'Drive sales, sign-ups, or desired actions' },
    { value: 'engagement', label: 'Boost Engagement', description: 'Increase likes, comments, shares, and interaction' }
  ]

  const KPISUGGESTIONS = [
    '15% increase in online sales',
    '20% boost in website traffic',
    '10% improvement in conversion rate',
    '50k new social media followers',
    '25% increase in brand mentions',
    '2x return on ad spend',
    '30% growth in email subscribers',
    '40% improvement in engagement rate'
  ]

  const AUDIENCE_PAIN_POINTS = [
    'Finding affordable quality products',
    'Time-saving solutions',
    'Trust and credibility concerns',
    'Environmental impact worries',
    'Limited budget constraints',
    'Complex decision-making',
    'Lack of information/options',
    'Social validation needs'
  ]

  const AUDIENCE_MOTIVATIONS = [
    'Self-expression and identity',
    'Security and reliability',
    'Social status and recognition',
    'Environmental consciousness',
    'Convenience and efficiency',
    'Innovation and progress',
    'Community and belonging',
    'Health and wellness'
  ]

  const SECTIONS = [
    { id: 'client-context', label: 'Client Context', icon: '🏢' },
    { id: 'business-goals', label: 'Business Goals', icon: '🎯' },
    { id: 'competitive', label: 'Competitive Analysis', icon: '🥊' },
    { id: 'audience', label: 'Target Audience', icon: '👥' },
    { id: 'messaging', label: 'Message Strategy', icon: '📝' },
    { id: 'constraints', label: 'Mandatories', icon: '⚖️' },
    { id: 'platform', label: 'Platform Strategy', icon: '📱' },
    { id: 'timeline', label: 'Timeline & Timing', icon: '📅' }
  ]

  const updateBrief = (updates: Partial<CampaignBriefData>) => {
    setBrief(prev => ({ ...prev, ...updates }))
  }

  const updateNestedField = (path: string[], value: any) => {
    setBrief(prev => {
      const updated = { ...prev }
      let current: any = updated

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {}
        current = current[path[i]]
      }

      current[path[path.length - 1]] = value
      return updated
    })
  }

  const addArrayItem = (path: string[], item: string) => {
    setBrief(prev => {
      const updated = { ...prev }
      let current: any = updated

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {}
        current = current[path[i]]
      }

      if (!current[path[path.length - 1]]) current[path[path.length - 1]] = []
      current[path[path.length - 1]].push(item)
      return updated
    })
  }

  const removeArrayItem = (path: string[], index: number) => {
    setBrief(prev => {
      const updated = { ...prev }
      let current: any = updated

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }

      current[path[path.length - 1]].splice(index, 1)
      return updated
    })
  }

  const handleSave = () => {
    onSave(brief)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'client-context':
        return (
          <div className='brief-section'>
            <h3>Client Context</h3>
            <div className='form-group'>
              <label>Client Overview</label>
              <textarea
                value={brief.clientOverview || ''}
                onChange={(e) => updateBrief({ clientOverview: e.target.value })}
                placeholder='E.g., "E-commerce fashion brand targeting millennials with premium sustainable products"'
                rows={3}
              />
              <small>Describe your client, their business, and market position</small>
            </div>

            <div className='form-group'>
              <label>Campaign Purpose</label>
              <textarea
                value={brief.campaignPurpose || ''}
                onChange={(e) => updateBrief({ campaignPurpose: e.target.value })}
                placeholder='E.g., "Launch new summer collection and drive 20% increase in online sales"'
                rows={2}
              />
              <small>What is the primary purpose of this campaign?</small>
            </div>
          </div>
        )

      case 'business-goals':
        return (
          <div className='brief-section'>
            <h3>Business Goals & KPIs</h3>
            <div className='form-group'>
              <label>Primary KPI</label>
              <input
                type='text'
                value={brief.primaryKPI || ''}
                onChange={(e) => updateBrief({ primaryKPI: e.target.value })}
                placeholder='E.g., "15% increase in online sales"'
              />
              <small>What is the single most important metric for this campaign?</small>
            </div>

            <div className='form-group'>
              <label>Secondary KPIs</label>
              <div className='array-input'>
                {(brief.secondaryKPIs || []).map((kpi, index) => (
                  <div key={index} className='array-item'>
                    <input
                      type='text'
                      value={kpi}
                      onChange={(e) => {
                        const updated = [...(brief.secondaryKPIs || [])]
                        updated[index] = e.target.value
                        updateBrief({ secondaryKPIs: updated })
                      }}
                    />
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['secondaryKPIs'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['secondaryKPIs'], '')}
                  className='btn-add-small'
                >
                  + Add KPI
                </button>
              </div>
              <small>Additional metrics that indicate success</small>
            </div>

            <div className='form-group'>
              <label>Target Metrics</label>
              <div className='metrics-grid'>
                <div>
                  <label>Impressions</label>
                  <input
                    type='number'
                    value={brief.targetMetrics?.impressions || ''}
                    onChange={(e) => updateNestedField(['targetMetrics', 'impressions'], Number(e.target.value))}
                    placeholder='100000'
                  />
                </div>
                <div>
                  <label>Reach</label>
                  <input
                    type='number'
                    value={brief.targetMetrics?.reach || ''}
                    onChange={(e) => updateNestedField(['targetMetrics', 'reach'], Number(e.target.value))}
                    placeholder='50000'
                  />
                </div>
                <div>
                  <label>Engagement</label>
                  <input
                    type='number'
                    value={brief.targetMetrics?.engagement || ''}
                    onChange={(e) => updateNestedField(['targetMetrics', 'engagement'], Number(e.target.value))}
                    placeholder='5000'
                  />
                </div>
                <div>
                  <label>Conversions</label>
                  <input
                    type='number'
                    value={brief.targetMetrics?.conversions || ''}
                    onChange={(e) => updateNestedField(['targetMetrics', 'conversions'], Number(e.target.value))}
                    placeholder='500'
                  />
                </div>
                <div>
                  <label>ROI (%)</label>
                  <input
                    type='number'
                    value={brief.targetMetrics?.roi || ''}
                    onChange={(e) => updateNestedField(['targetMetrics', 'roi'], Number(e.target.value))}
                    placeholder='300'
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'competitive':
        return (
          <div className='brief-section'>
            <h3>Competitive Analysis</h3>
            <div className='form-group'>
              <label>Competitor Insights</label>
              <div className='array-input'>
                {(brief.competitorInsights || []).map((insight, index) => (
                  <div key={index} className='array-item'>
                    <textarea
                      value={insight}
                      onChange={(e) => {
                        const updated = [...(brief.competitorInsights || [])]
                        updated[index] = e.target.value
                        updateBrief({ competitorInsights: updated })
                      }}
                      placeholder='E.g., "Competitor A focuses on price points and discounts"'
                      rows={2}
                    />
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['competitorInsights'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['competitorInsights'], '')}
                  className='btn-add-small'
                >
                  + Add Competitor Insight
                </button>
              </div>
              <small>What are your main competitors doing and how are they positioning themselves?</small>
            </div>

            <div className='form-group'>
              <label>Our Differentiators</label>
              <div className='array-input'>
                {(brief.differentiators || []).map((diff, index) => (
                  <div key={index} className='array-item'>
                    <input
                      type='text'
                      value={diff}
                      onChange={(e) => {
                        const updated = [...(brief.differentiators || [])]
                        updated[index] = e.target.value
                        updateBrief({ differentiators: updated })
                      }}
                      placeholder='E.g., "Premium quality materials"'
                    />
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['differentiators'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['differentiators'], '')}
                  className='btn-add-small'
                >
                  + Add Differentiator
                </button>
              </div>
              <small>What makes your client unique compared to competitors?</small>
            </div>
          </div>
        )

      case 'audience':
        return (
          <div className='brief-section'>
            <h3>Target Audience Deep Dive</h3>
            <div className='form-group'>
              <label>Demographics</label>
              <input
                type='text'
                value={brief.primaryAudience?.demographics || ''}
                onChange={(e) => updateNestedField(['primaryAudience', 'demographics'], e.target.value)}
                placeholder='E.g., "Women 25-35, urban, HHI $60k+, college-educated"'
              />
              <small>Age, gender, location, income, education, etc.</small>
            </div>

            <div className='form-group'>
              <label>Psychographics</label>
              <textarea
                value={brief.primaryAudience?.psychographics || ''}
                onChange={(e) => updateNestedField(['primaryAudience', 'psychographics'], e.target.value)}
                placeholder='E.g., "Fashion-conscious, value sustainability, active on social media, seeking self-expression"'
                rows={3}
              />
              <small>Lifestyle, values, attitudes, interests</small>
            </div>

            <div className='form-group'>
              <label>Pain Points</label>
              <div className='array-input'>
                {(brief.primaryAudience?.painPoints || []).map((pain, index) => (
                  <div key={index} className='array-item'>
                    <select
                      value={pain}
                      onChange={(e) => {
                        const updated = [...(brief.primaryAudience?.painPoints || [])]
                        updated[index] = e.target.value
                        updateNestedField(['primaryAudience', 'painPoints'], updated)
                      }}
                    >
                      <option value=''>Select pain point...</option>
                      {AUDIENCE_PAIN_POINTS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['primaryAudience', 'painPoints'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['primaryAudience', 'painPoints'], '')}
                  className='btn-add-small'
                >
                  + Add Pain Point
                </button>
              </div>
              <small>What problems or challenges does your audience face?</small>
            </div>

            <div className='form-group'>
              <label>Motivations</label>
              <div className='array-input'>
                {(brief.primaryAudience?.motivations || []).map((motivation, index) => (
                  <div key={index} className='array-item'>
                    <select
                      value={motivation}
                      onChange={(e) => {
                        const updated = [...(brief.primaryAudience?.motivations || [])]
                        updated[index] = e.target.value
                        updateNestedField(['primaryAudience', 'motivations'], updated)
                      }}
                    >
                      <option value=''>Select motivation...</option>
                      {AUDIENCE_MOTIVATIONS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['primaryAudience', 'motivations'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['primaryAudience', 'motivations'], '')}
                  className='btn-add-small'
                >
                  + Add Motivation
                </button>
              </div>
              <small>What drives your audience to make decisions?</small>
            </div>
          </div>
        )

      case 'messaging':
        return (
          <div className='brief-section'>
            <h3>Message Strategy</h3>
            <div className='form-group'>
              <label>Key Message</label>
              <input
                type='text'
                value={brief.keyMessage || ''}
                onChange={(e) => updateBrief({ keyMessage: e.target.value })}
                placeholder='E.g., "Premium sustainable fashion for conscious consumers"'
              />
              <small>The single most important message you want to communicate</small>
            </div>

            <div className='form-group'>
              <label>Supporting Points</label>
              <div className='array-input'>
                {(brief.supportingPoints || []).map((point, index) => (
                  <div key={index} className='array-item'>
                    <input
                      type='text'
                      value={point}
                      onChange={(e) => {
                        const updated = [...(brief.supportingPoints || [])]
                        updated[index] = e.target.value
                        updateBrief({ supportingPoints: updated })
                      }}
                      placeholder='E.g., "Ethically sourced materials"'
                    />
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['supportingPoints'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['supportingPoints'], '')}
                  className='btn-add-small'
                >
                  + Add Supporting Point
                </button>
              </div>
              <small>Key proof points that support your main message</small>
            </div>

            <div className='form-group'>
              <label>Emotional Appeal</label>
              <textarea
                value={brief.emotionalAppeal || ''}
                onChange={(e) => updateBrief({ emotionalAppeal: e.target.value })}
                placeholder='E.g., "Empowerment through conscious fashion choices"'
                rows={2}
              />
              <small>What emotion should this campaign evoke?</small>
            </div>
          </div>
        )

      case 'constraints':
        return (
          <div className='brief-section'>
            <h3>Mandatories & Constraints</h3>
            <div className='form-group'>
              <label>Must Include</label>
              <div className='array-input'>
                {(brief.mandatoryInclusions || []).map((item, index) => (
                  <div key={index} className='array-item'>
                    <input
                      type='text'
                      value={item}
                      onChange={(e) => {
                        const updated = [...(brief.mandatoryInclusions || [])]
                        updated[index] = e.target.value
                        updateBrief({ mandatoryInclusions: updated })
                      }}
                      placeholder='E.g., "Brand logo visible"'
                    />
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['mandatoryInclusions'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['mandatoryInclusions'], '')}
                  className='btn-add-small'
                >
                  + Add Requirement
                </button>
              </div>
              <small>What must appear in every creative?</small>
            </div>

            <div className='form-group'>
              <label>Must Exclude</label>
              <div className='array-input'>
                {(brief.mandatoryExclusions || []).map((item, index) => (
                  <div key={index} className='array-item'>
                    <input
                      type='text'
                      value={item}
                      onChange={(e) => {
                        const updated = [...(brief.mandatoryExclusions || [])]
                        updated[index] = e.target.value
                        updateBrief({ mandatoryExclusions: updated })
                      }}
                      placeholder='E.g., "No stock photos"'
                    />
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['mandatoryExclusions'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['mandatoryExclusions'], '')}
                  className='btn-add-small'
                >
                  + Add Exclusion
                </button>
              </div>
              <small>What must never appear in the creative?</small>
            </div>

            <div className='form-group'>
              <label>Legal Requirements</label>
              <div className='array-input'>
                {(brief.legalRequirements || []).map((item, index) => (
                  <div key={index} className='array-item'>
                    <input
                      type='text'
                      value={item}
                      onChange={(e) => {
                        const updated = [...(brief.legalRequirements || [])]
                        updated[index] = e.target.value
                        updateBrief({ legalRequirements: updated })
                      }}
                      placeholder='E.g., "Copyright notice"'
                    />
                    <button
                      type='button'
                      onClick={() => removeArrayItem(['legalRequirements'], index)}
                      className='btn-remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  onClick={() => addArrayItem(['legalRequirements'], '')}
                  className='btn-add-small'
                >
                  + Add Legal Requirement
                </button>
              </div>
              <small>Any legal disclaimers, certifications, or regulatory requirements</small>
            </div>
          </div>
        )

      case 'platform':
        return (
          <div className='brief-section'>
            <h3>Platform Strategy</h3>
            <div className='form-group'>
              <label>Instagram Strategy</label>
              <textarea
                value={brief.platformSpecific?.instagram || ''}
                onChange={(e) => updateNestedField(['platformSpecific', 'instagram'], e.target.value)}
                placeholder='E.g., "Focus on lifestyle imagery, influencer partnerships, Stories with swipe-up links"'
                rows={3}
              />
              <small>How should this campaign specifically perform on Instagram?</small>
            </div>

            <div className='form-group'>
              <label>Facebook Strategy</label>
              <textarea
                value={brief.platformSpecific?.facebook || ''}
                onChange={(e) => updateNestedField(['platformSpecific', 'facebook'], e.target.value)}
                placeholder='E.g., "Detailed product shots, customer testimonials, carousel ads showing features"'
                rows={3}
              />
              <small>What approach will work best on Facebook?</small>
            </div>

            <div className='form-group'>
              <label>LinkedIn Strategy</label>
              <textarea
                value={brief.platformSpecific?.linkedin || ''}
                onChange={(e) => updateNestedField(['platformSpecific', 'linkedin'], e.target.value)}
                placeholder='E.g., "Brand story, company values, sustainability initiatives, thought leadership content"'
                rows={3}
              />
              <small>How should this campaign be positioned for LinkedIn?</small>
            </div>
          </div>
        )

      case 'timeline':
        return (
          <div className='brief-section'>
            <h3>Timeline & Timing</h3>
            <div className='form-group'>
              <label>Campaign Duration</label>
              <input
                type='text'
                value={brief.campaignDuration || ''}
                onChange={(e) => updateBrief({ campaignDuration: e.target.value })}
                placeholder='E.g., "8-week campaign with phased rollout"'
              />
              <small>How long will this campaign run?</small>
            </div>

            <div className='form-group'>
              <label>Seasonality</label>
              <input
                type='text'
                value={brief.seasonality || ''}
                onChange={(e) => updateBrief({ seasonality: e.target.value })}
                placeholder='E.g., "Summer launch, aligning with vacation season"'
              />
              <small>Are there any seasonal considerations?</small>
            </div>

            <div className='form-group'>
              <label>Urgency & Scarcity</label>
              <input
                type='text'
                value={brief.urgency || ''}
                onChange={(e) => updateBrief({ urgency: e.target.value })}
                placeholder='E.g., "Limited edition collection, early bird pricing"'
              />
              <small>What creates urgency or scarcity for this campaign?</small>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>📋 Campaign Brief Builder</h1>
          <p className='page-subtitle'>Build a comprehensive campaign brief that will guide creative generation</p>
        </div>
      </div>

      <div className='brief-layout'>
        {/* Section Navigation */}
        <div className='brief-nav'>
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
            >
              <span className='nav-icon'>{section.icon}</span>
              <span className='nav-label'>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className='brief-content'>
          {renderSection()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='brief-actions'>
        {onCancel && (
          <button
            type='button'
            onClick={onCancel}
            className='btn btn-secondary'
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type='button'
          onClick={handleSave}
          className='btn btn-primary'
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Campaign Brief'}
        </button>
      </div>
    </div>
  )
}