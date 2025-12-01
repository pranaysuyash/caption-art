/**
 * Schedule Picker Component
 * Allows users to schedule posts for future times
 * Requirements: 5.1, 5.2, 5.3
 */

import { useState } from 'react';
import { postScheduler } from '../lib/social/postScheduler';

export interface SchedulePickerProps {
  scheduledTime: Date | null;
  onScheduleChange: (time: Date | null) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
}

export function SchedulePicker({
  scheduledTime,
  onScheduleChange,
  enabled = false,
  onEnabledChange,
}: SchedulePickerProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Handle schedule toggle
   * Requirements: 5.1
   */
  const handleToggle = () => {
    const newEnabled = !enabled;
    onEnabledChange?.(newEnabled);

    if (!newEnabled) {
      onScheduleChange(null);
      setValidationError(null);
    } else if (!scheduledTime) {
      // Set default to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      defaultTime.setMinutes(0);
      defaultTime.setSeconds(0);
      defaultTime.setMilliseconds(0);
      handleTimeChange(defaultTime);
    }
  };

  /**
   * Handle time change with validation
   * Requirements: 5.2
   */
  const handleTimeChange = (newTime: Date) => {
    const validation = postScheduler.validateScheduledTime(newTime);

    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid time');
      return;
    }

    setValidationError(null);
    onScheduleChange(newTime);
  };

  /**
   * Handle datetime input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;

    const newTime = new Date(value);
    handleTimeChange(newTime);
  };

  /**
   * Format date for datetime-local input
   */
  const formatDateTimeLocal = (date: Date | null): string => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  /**
   * Get minimum datetime (now)
   */
  const getMinDateTime = (): string => {
    return formatDateTimeLocal(new Date());
  };

  /**
   * Format display time
   */
  const formatDisplayTime = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="schedule-picker">
      <div className="schedule-picker-header">
        <label className="schedule-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="schedule-checkbox"
          />
          <span className="schedule-label">Schedule for later</span>
        </label>
      </div>

      {enabled && (
        <div className="schedule-picker-content">
          <div className="schedule-input-group">
            <label htmlFor="schedule-time" className="schedule-input-label">
              Select date and time
            </label>
            <input
              id="schedule-time"
              type="datetime-local"
              className="schedule-input"
              value={formatDateTimeLocal(scheduledTime)}
              onChange={handleInputChange}
              min={getMinDateTime()}
            />
          </div>

          {validationError && (
            <div className="schedule-error">
              <span className="schedule-error-icon">⚠️</span>
              {validationError}
            </div>
          )}

          {scheduledTime && !validationError && (
            <div className="schedule-info">
              <span className="schedule-info-icon">📅</span>
              <div className="schedule-info-text">
                <div className="schedule-info-primary">
                  {scheduledTime.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
                <div className="schedule-info-secondary">
                  {formatDisplayTime(scheduledTime)}
                </div>
              </div>
            </div>
          )}

          <div className="schedule-hint">
            Your post will be automatically published at the scheduled time
          </div>
        </div>
      )}

      <style>{`
        .schedule-picker {
          width: 100%;
        }

        .schedule-picker-header {
          margin-bottom: 1rem;
        }

        .schedule-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .schedule-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
        }

        .schedule-label {
          font-size: 1rem;
          font-weight: 500;
        }

        .schedule-picker-content {
          padding: 1rem;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }

        .schedule-input-group {
          margin-bottom: 1rem;
        }

        .schedule-input-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .schedule-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          transition: border-color 0.2s;
        }

        .schedule-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .schedule-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #fee2e2;
          border: 1px solid #ef4444;
          border-radius: 6px;
          color: #991b1b;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .schedule-error-icon {
          font-size: 1rem;
        }

        .schedule-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .schedule-info-icon {
          font-size: 1.5rem;
        }

        .schedule-info-text {
          flex: 1;
        }

        .schedule-info-primary {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e40af;
        }

        .schedule-info-secondary {
          font-size: 0.75rem;
          color: #3b82f6;
          margin-top: 0.125rem;
        }

        .schedule-hint {
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
