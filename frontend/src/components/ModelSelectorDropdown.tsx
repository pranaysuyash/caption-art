/**
 * ModelSelectorDropdown Component
 * Requirements: Frontend UI component for selecting masking models
 *
 * Provides a dropdown interface for users to select different masking models
 * with detailed information about quality, speed, cost, and use cases.
 */

import { useState, useEffect } from 'react'
import { backendClient, MaskingModel, MaskingModelsResponse } from '../lib/api/backendClient'
import './ModelSelectorDropdown.css'

export interface ModelSelectorDropdownProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  disabled?: boolean
  className?: string
}

/**
 * ModelSelectorDropdown component for selecting masking models
 */
export function ModelSelectorDropdown({
  selectedModel,
  onModelChange,
  disabled = false,
  className = ''
}: ModelSelectorDropdownProps) {
  const [models, setModels] = useState<Record<string, MaskingModel>>({})
  const [defaultModel, setDefaultModel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Load available models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true)
        setError(null)
        const response: MaskingModelsResponse = await backendClient.getMaskingModels()
        setModels(response.models)
        setDefaultModel(response.defaultModel)

        // Auto-select default model if no model is selected
        if (!selectedModel && response.defaultModel) {
          onModelChange(response.defaultModel)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load masking models')
        console.error('Failed to load masking models:', err)
      } finally {
        setLoading(false)
      }
    }

    loadModels()
  }, [selectedModel, onModelChange])

  // Get current model info
  const currentModel = models[selectedModel] || models[defaultModel] || Object.values(models)[0]

  // Quality badge styling
  const getQualityBadgeClass = (quality: MaskingModel['quality']) => {
    switch (quality) {
      case 'basic':
        return 'quality-basic'
      case 'good':
        return 'quality-good'
      case 'excellent':
        return 'quality-excellent'
      case 'premium':
        return 'quality-premium'
      default:
        return 'quality-good'
    }
  }

  // Speed indicator styling
  const getSpeedClass = (speed: MaskingModel['speed']) => {
    switch (speed) {
      case 'fast':
        return 'speed-fast'
      case 'medium':
        return 'speed-medium'
      case 'slow':
        return 'speed-slow'
      default:
        return 'speed-medium'
    }
  }

  // Cost indicator styling
  const getCostClass = (cost: MaskingModel['cost']) => {
    switch (cost) {
      case 'free':
        return 'cost-free'
      case 'low':
        return 'cost-low'
      case 'medium':
        return 'cost-medium'
      case 'high':
        return 'cost-high'
      default:
        return 'cost-medium'
    }
  }

  if (loading) {
    return (
      <div className={`model-selector-loading ${className}`}>
        <div className="loading-spinner" aria-hidden="true">⚙️</div>
        <span className="loading-text">Loading models...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`model-selector-error ${className}`} role="alert" aria-live="assertive">
        <span className="error-icon" aria-hidden="true">⚠️</span>
        <span className="error-message">{error}</span>
      </div>
    )
  }

  if (!currentModel) {
    return (
      <div className={`model-selector-unavailable ${className}`}>
        <span className="unavailable-text">No models available</span>
      </div>
    )
  }

  return (
    <div className={`model-selector-dropdown ${className}`}>
      <label className="model-selector-label" htmlFor="masking-model-select">
        Masking Model:
      </label>

      <div className="model-selector-trigger">
        <button
          type="button"
          id="masking-model-select"
          className="model-selector-button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby="masking-model-select model-selector-description"
        >
          <div className="selected-model-info">
            <span className="model-name">{currentModel.name}</span>
            <div className="model-badges">
              <span className={`quality-badge ${getQualityBadgeClass(currentModel.quality)}`}>
                {currentModel.quality.toUpperCase()}
              </span>
              <span className={`speed-indicator ${getSpeedClass(currentModel.speed)}`}>
                {currentModel.speed}
              </span>
              <span className={`cost-indicator ${getCostClass(currentModel.cost)}`}>
                {currentModel.cost}
              </span>
            </div>
          </div>
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`} aria-hidden="true">
            ▼
          </span>
        </button>
      </div>

      <div
        id="model-selector-description"
        className="sr-only"
      >
        Select a masking model for background removal. Different models offer varying levels of quality, speed, and cost.
      </div>

      {isOpen && (
        <div className="model-selector-dropdown-menu" role="listbox">
          <div className="dropdown-header">
            <h4>Choose Masking Model</h4>
            <p className="dropdown-description">
              Select a model based on your quality needs, processing speed requirements, and budget.
            </p>
          </div>

          <div className="models-list">
            {Object.entries(models).map(([modelId, model]) => (
              <div
                key={modelId}
                className={`model-option ${selectedModel === modelId ? 'selected' : ''}`}
                role="option"
                aria-selected={selectedModel === modelId}
                onClick={() => {
                  onModelChange(modelId)
                  setIsOpen(false)
                }}
              >
                <div className="model-option-header">
                  <div className="model-option-title">
                    <h5>{model.name}</h5>
                    {modelId === defaultModel && (
                      <span className="default-badge">DEFAULT</span>
                    )}
                  </div>
                  <div className="model-option-badges">
                    <span className={`quality-badge ${getQualityBadgeClass(model.quality)}`}>
                      {model.quality.toUpperCase()}
                    </span>
                    <span className={`speed-indicator ${getSpeedClass(model.speed)}`}>
                      {model.speed}
                    </span>
                    <span className={`cost-indicator ${getCostClass(model.cost)}`}>
                      {model.cost}
                    </span>
                  </div>
                </div>

                <p className="model-description">{model.description}</p>

                <div className="model-best-for">
                  <strong>Best for:</strong>
                  <ul>
                    {model.bestFor.map((useCase, index) => (
                      <li key={index}>{useCase}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="dropdown-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="dropdown-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// CSS for the component (you can move this to a separate CSS file)
export const modelSelectorStyles = `
.model-selector-dropdown {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.model-selector-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
}

.model-selector-loading,
.model-selector-error,
.model-selector-unavailable {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
}

.model-selector-error {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #dc2626;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.model-selector-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.model-selector-button:hover:not(:disabled) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.model-selector-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-model-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.model-name {
  font-weight: 600;
  color: #1f2937;
}

.model-badges {
  display: flex;
  gap: 6px;
  align-items: center;
}

.quality-badge,
.speed-indicator,
.cost-indicator {
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.quality-basic { background: #f3f4f6; color: #6b7280; }
.quality-good { background: #dbeafe; color: #1d4ed8; }
.quality-excellent { background: #d1fae5; color: #065f46; }
.quality-premium { background: #fef3c7; color: #92400e; }

.speed-fast { background: #d1fae5; color: #065f46; }
.speed-medium { background: #fed7aa; color: #9a3412; }
.speed-slow { background: #fee2e2; color: #991b1b; }

.cost-free { background: #d1fae5; color: #065f46; }
.cost-low { background: #dbeafe; color: #1d4ed8; }
.cost-medium { background: #fed7aa; color: #9a3412; }
.cost-high { background: #fee2e2; color: #991b1b; }

.dropdown-arrow {
  transition: transform 0.2s ease;
  color: #6b7280;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.model-selector-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-height: 80vh;
  overflow-y: auto;
  margin-top: 4px;
}

.dropdown-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 8px 8px 0 0;
}

.dropdown-header h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.dropdown-description {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.models-list {
  padding: 8px;
}

.model-option {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.model-option:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.model-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.model-option-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.model-option-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-option-title h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.default-badge {
  background: #10b981;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
}

.model-option-badges {
  display: flex;
  gap: 4px;
}

.model-description {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
}

.model-best-for {
  font-size: 12px;
  color: #6b7280;
}

.model-best-for strong {
  color: #374151;
}

.model-best-for ul {
  margin: 4px 0 0 0;
  padding-left: 16px;
}

.model-best-for li {
  margin-bottom: 2px;
}

.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 8px 8px;
}

.cancel-button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: transparent;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .model-selector-dropdown-menu {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 70vh;
    border-radius: 16px 16px 0 0;
    margin-top: 0;
    margin-bottom: 0;
  }

  .model-option-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .model-badges,
  .model-option-badges {
    flex-wrap: wrap;
  }
}
`