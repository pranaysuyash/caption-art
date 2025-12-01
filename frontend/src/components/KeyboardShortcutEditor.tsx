/**
 * KeyboardShortcutEditor Component
 * 
 * Allows users to view and customize keyboard shortcuts.
 * Displays all shortcuts, allows recording new key combinations,
 * shows conflict warnings, and provides reset to defaults.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_KEYBOARD_SHORTCUTS } from '../lib/preferences/defaults';
import './KeyboardShortcutEditor.css';

interface KeyboardShortcutEditorProps {
  shortcuts: Record<string, string>;
  onChange: (shortcuts: Record<string, string>) => void;
}

export const KeyboardShortcutEditor: React.FC<KeyboardShortcutEditorProps> = ({
  shortcuts,
  onChange,
}) => {
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string>('');
  const [conflicts, setConflicts] = useState<Record<string, string[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Requirement 3.1: Display all available shortcuts
  const shortcutCategories = {
    'File Operations': ['export', 'save'],
    'Edit Operations': ['undo', 'redo', 'copy', 'paste', 'delete'],
    'Canvas Operations': ['zoomIn', 'zoomOut', 'resetZoom', 'fitToScreen'],
    'Text Operations': ['bold', 'italic', 'alignLeft', 'alignCenter', 'alignRight'],
    'UI Operations': ['toggleSettings', 'toggleHelp', 'search'],
  };

  // Format action name for display
  const formatActionName = (action: string): string => {
    return action
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Detect conflicts when shortcuts change
  useEffect(() => {
    const newConflicts: Record<string, string[]> = {};
    const shortcutToActions: Record<string, string[]> = {};

    // Build a map of shortcuts to actions
    Object.entries(shortcuts).forEach(([action, shortcut]) => {
      if (!shortcutToActions[shortcut]) {
        shortcutToActions[shortcut] = [];
      }
      shortcutToActions[shortcut].push(action);
    });

    // Find conflicts (shortcuts used by multiple actions)
    Object.entries(shortcutToActions).forEach(([shortcut, actions]) => {
      if (actions.length > 1) {
        actions.forEach((action) => {
          newConflicts[action] = actions.filter((a) => a !== action);
        });
      }
    });

    setConflicts(newConflicts);
  }, [shortcuts]);

  // Requirement 3.2: Allow recording a new key combination
  const handleStartRecording = (action: string) => {
    setEditingAction(action);
    setRecordedKeys('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editingAction) return;

    const keys: string[] = [];

    // Capture modifier keys
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');

    // Capture the main key
    const key = e.key;
    if (
      key !== 'Control' &&
      key !== 'Shift' &&
      key !== 'Alt' &&
      key !== 'Meta'
    ) {
      // Normalize key names
      let normalizedKey = key;
      if (key === ' ') normalizedKey = 'Space';
      else if (key === 'Escape') normalizedKey = 'Esc';
      else if (key.length === 1) normalizedKey = key.toUpperCase();

      keys.push(normalizedKey);
    }

    if (keys.length > 0) {
      const shortcut = keys.join('+');
      setRecordedKeys(shortcut);
    }
  };

  const handleSaveShortcut = () => {
    if (!editingAction || !recordedKeys) return;

    // Requirement 3.3: Warn about conflicts and prevent assignment
    const conflictingActions = Object.entries(shortcuts)
      .filter(([action, shortcut]) => 
        action !== editingAction && shortcut === recordedKeys
      )
      .map(([action]) => action);

    if (conflictingActions.length > 0) {
      const actionNames = conflictingActions.map(formatActionName).join(', ');
      alert(
        `This shortcut is already used by: ${actionNames}\n\nPlease choose a different key combination.`
      );
      return;
    }

    // Requirement 3.4: Update the binding immediately
    const newShortcuts = {
      ...shortcuts,
      [editingAction]: recordedKeys,
    };
    onChange(newShortcuts);
    setEditingAction(null);
    setRecordedKeys('');
  };

  const handleCancelRecording = () => {
    setEditingAction(null);
    setRecordedKeys('');
  };

  // Requirement 3.5: Reset shortcuts to defaults
  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset all keyboard shortcuts to defaults?')) {
      onChange({ ...DEFAULT_KEYBOARD_SHORTCUTS });
    }
  };

  const handleResetSingle = (action: string) => {
    const defaultShortcut = DEFAULT_KEYBOARD_SHORTCUTS[action];
    if (defaultShortcut) {
      const newShortcuts = {
        ...shortcuts,
        [action]: defaultShortcut,
      };
      onChange(newShortcuts);
    }
  };

  return (
    <div className="keyboard-shortcut-editor">
      <div className="editor-header">
        <h3>Keyboard Shortcuts</h3>
        <button onClick={handleResetAll} className="reset-all-button">
          Reset All to Defaults
        </button>
      </div>

      <div className="shortcuts-list">
        {Object.entries(shortcutCategories).map(([category, actions]) => (
          <div key={category} className="shortcut-category">
            <h4>{category}</h4>
            {actions.map((action) => {
              const shortcut = shortcuts[action] || '';
              const isEditing = editingAction === action;
              const hasConflict = conflicts[action]?.length > 0;

              return (
                <div
                  key={action}
                  className={`shortcut-item ${hasConflict ? 'has-conflict' : ''}`}
                >
                  <div className="shortcut-info">
                    <span className="action-name">{formatActionName(action)}</span>
                    {hasConflict && (
                      <span className="conflict-warning">
                        ⚠️ Conflicts with: {conflicts[action].map(formatActionName).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="shortcut-controls">
                    {isEditing ? (
                      <>
                        <input
                          ref={inputRef}
                          type="text"
                          className="shortcut-input"
                          value={recordedKeys}
                          onKeyDown={handleKeyDown}
                          placeholder="Press keys..."
                          readOnly
                        />
                        <button
                          onClick={handleSaveShortcut}
                          className="save-shortcut-button"
                          disabled={!recordedKeys}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelRecording}
                          className="cancel-shortcut-button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="shortcut-display">{shortcut}</span>
                        <button
                          onClick={() => handleStartRecording(action)}
                          className="edit-shortcut-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetSingle(action)}
                          className="reset-shortcut-button"
                          title="Reset to default"
                        >
                          ↺
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="editor-help">
        <p>
          <strong>Tip:</strong> Click "Edit" next to any shortcut to record a new key combination.
          Press the keys you want to use, then click "Save".
        </p>
      </div>
    </div>
  );
};
