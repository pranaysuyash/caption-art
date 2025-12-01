/**
 * Hashtag Selector Component
 * Allows users to select suggested hashtags and add custom ones
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import { useState, useEffect } from 'react';
import { hashtagGenerator } from '../lib/social/hashtagGenerator';

export interface HashtagSelectorProps {
  imageDataUrl?: string;
  caption?: string;
  selectedHashtags: string[];
  onHashtagsChange: (hashtags: string[]) => void;
}

export function HashtagSelector({
  imageDataUrl,
  caption,
  selectedHashtags,
  onHashtagsChange,
}: HashtagSelectorProps) {
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [customHashtag, setCustomHashtag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate hashtag suggestions when image or caption changes
  useEffect(() => {
    if (imageDataUrl || caption) {
      generateSuggestions();
    }
  }, [imageDataUrl, caption]);

  /**
   * Generate hashtag suggestions
   * Requirements: 3.1, 3.2
   */
  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const suggestions = await hashtagGenerator.generateHashtags(imageDataUrl, caption);
      setSuggestedHashtags(suggestions);
    } catch (err) {
      setError('Failed to generate hashtag suggestions');
      console.error('Hashtag generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle a suggested hashtag
   * Requirements: 3.3
   */
  const toggleHashtag = (hashtag: string) => {
    if (selectedHashtags.includes(hashtag)) {
      onHashtagsChange(selectedHashtags.filter((h) => h !== hashtag));
    } else {
      onHashtagsChange([...selectedHashtags, hashtag]);
    }
  };

  /**
   * Add a custom hashtag
   * Requirements: 3.4
   */
  const addCustomHashtag = () => {
    const trimmed = customHashtag.trim();
    if (!trimmed) return;

    // Validate hashtag format
    const validation = hashtagGenerator.validateHashtag(trimmed);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid hashtag format');
      return;
    }

    const normalized = hashtagGenerator.normalizeHashtag(trimmed);
    if (!selectedHashtags.includes(normalized)) {
      onHashtagsChange([...selectedHashtags, normalized]);
    }

    setCustomHashtag('');
    setError(null);
  };

  /**
   * Remove a selected hashtag
   */
  const removeHashtag = (hashtag: string) => {
    onHashtagsChange(selectedHashtags.filter((h) => h !== hashtag));
  };

  /**
   * Handle Enter key in custom hashtag input
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomHashtag();
    }
  };

  return (
    <div className="hashtag-selector">
      <div className="hashtag-selector-header">
        <h3>Hashtags</h3>
        <p className="hashtag-hint">Select suggested hashtags or add your own</p>
      </div>

      {/* Selected Hashtags */}
      {selectedHashtags.length > 0 && (
        <div className="selected-hashtags">
          <div className="selected-hashtags-label">Selected ({selectedHashtags.length})</div>
          <div className="hashtag-chips">
            {selectedHashtags.map((hashtag) => (
              <div key={hashtag} className="hashtag-chip selected">
                <span>{hashtag}</span>
                <button
                  className="hashtag-remove"
                  onClick={() => removeHashtag(hashtag)}
                  type="button"
                  aria-label={`Remove ${hashtag}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Hashtags */}
      <div className="suggested-hashtags">
        <div className="suggested-hashtags-label">
          Suggested
          {loading && <span className="loading-spinner">⏳</span>}
        </div>

        {error && <div className="hashtag-error">{error}</div>}

        {!loading && suggestedHashtags.length > 0 && (
          <div className="hashtag-chips">
            {suggestedHashtags.map((hashtag) => {
              const isSelected = selectedHashtags.includes(hashtag);
              return (
                <button
                  key={hashtag}
                  className={`hashtag-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleHashtag(hashtag)}
                  type="button"
                >
                  {hashtag}
                  {isSelected && <span className="hashtag-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {!loading && suggestedHashtags.length === 0 && !error && (
          <div className="hashtag-empty">No suggestions available</div>
        )}
      </div>

      {/* Custom Hashtag Input */}
      <div className="custom-hashtag">
        <div className="custom-hashtag-label">Add Custom Hashtag</div>
        <div className="custom-hashtag-input-group">
          <input
            type="text"
            className="custom-hashtag-input"
            placeholder="#yourtag"
            value={customHashtag}
            onChange={(e) => setCustomHashtag(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="custom-hashtag-add"
            onClick={addCustomHashtag}
            disabled={!customHashtag.trim()}
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <style>{`
        .hashtag-selector {
          width: 100%;
        }

        .hashtag-selector-header {
          margin-bottom: 1rem;
        }

        .hashtag-selector-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .hashtag-hint {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .selected-hashtags,
        .suggested-hashtags,
        .custom-hashtag {
          margin-bottom: 1.5rem;
        }

        .selected-hashtags-label,
        .suggested-hashtags-label,
        .custom-hashtag-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .loading-spinner {
          font-size: 0.875rem;
        }

        .hashtag-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .hashtag-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 20px;
          background: white;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hashtag-chip:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .hashtag-chip.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #1e40af;
        }

        .hashtag-check {
          font-size: 0.75rem;
          font-weight: bold;
        }

        .hashtag-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          border: none;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
          transition: background 0.2s;
        }

        .hashtag-remove:hover {
          background: #dc2626;
        }

        .hashtag-error {
          padding: 0.75rem;
          background: #fee2e2;
          border: 1px solid #ef4444;
          border-radius: 6px;
          color: #991b1b;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .hashtag-empty {
          padding: 1rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
          background: #f9fafb;
          border-radius: 6px;
        }

        .custom-hashtag-input-group {
          display: flex;
          gap: 0.5rem;
        }

        .custom-hashtag-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }

        .custom-hashtag-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .custom-hashtag-add {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          background: #3b82f6;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .custom-hashtag-add:hover:not(:disabled) {
          background: #2563eb;
        }

        .custom-hashtag-add:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
