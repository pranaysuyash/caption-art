/**
 * FontUploader - UI for uploading custom fonts
 * Allows users to upload TTF, OTF, WOFF font files
 */

import { useState, useRef } from 'react';
import type { LoadedFont } from '../lib/text/fontLoader';
import { FontManager } from '../lib/text/fontLoader';

export interface FontUploaderProps {
  /** Font manager instance */
  fontManager: FontManager;
  /** Callback when a font is successfully loaded */
  onFontLoaded?: (font: LoadedFont) => void;
  /** Callback when font loading fails */
  onError?: (error: string) => void;
  /** Currently selected font family */
  selectedFont?: string;
  /** Callback when font selection changes */
  onFontSelect?: (fontFamily: string) => void;
  /** Disable all controls */
  disabled?: boolean;
}

/**
 * FontUploader component - provides UI for custom font upload and selection
 */
export function FontUploader({
  fontManager,
  onFontLoaded,
  onError,
  selectedFont,
  onFontSelect,
  disabled = false,
}: FontUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedFonts, setLoadedFonts] = useState<LoadedFont[]>(
    fontManager.getLoadedFonts()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const result = await fontManager.loadFont(file);

      if (result.success && result.font) {
        setLoadedFonts(fontManager.getLoadedFonts());
        onFontLoaded?.(result.font);
        
        // Auto-select the newly loaded font
        if (onFontSelect) {
          onFontSelect(result.font.family);
        }
      } else if (result.error) {
        onError?.(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to load font: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
        padding: 'var(--spacing-xl)',
        background: 'var(--color-bg)',
        border: 'var(--border-width-medium) solid var(--color-border)',
        boxShadow: 'var(--shadow-offset-md) var(--shadow-offset-md) 0 var(--color-border)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--font-size-lg)',
          fontWeight: 700,
          margin: 0,
          color: 'var(--color-text)',
        }}
      >
        Custom Fonts
      </h3>

      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
          onChange={handleFileSelect}
          disabled={disabled || isLoading}
          style={{ display: 'none' }}
          aria-label="Upload font file"
        />
        
        <button
          onClick={handleUploadClick}
          disabled={disabled || isLoading}
          className="button button-primary"
          style={{
            width: '100%',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            padding: 'var(--spacing-md)',
            cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            opacity: disabled || isLoading ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-xs)',
          }}
        >
          {isLoading ? (
            <>
              <span>⏳</span>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>📁</span>
              <span>Upload Font</span>
            </>
          )}
        </button>
        
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            margin: 'var(--spacing-sm) 0 0 0',
            textAlign: 'center',
          }}
        >
          Supports TTF, OTF, WOFF, WOFF2
        </p>
      </div>

      {/* Loaded Fonts List */}
      {loadedFonts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <label
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            Loaded Fonts ({loadedFonts.length})
          </label>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-xs)',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: 'var(--spacing-sm)',
              background: 'var(--color-bg-secondary)',
              border: 'var(--border-width-thin) solid var(--color-border)',
            }}
          >
            {loadedFonts.map((font) => {
              const isSelected = selectedFont === font.family;
              
              return (
                <button
                  key={font.family}
                  onClick={() => onFontSelect?.(font.family)}
                  disabled={disabled}
                  className="button"
                  style={{
                    fontFamily: font.family,
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    padding: 'var(--spacing-sm)',
                    border: `var(--border-width-thin) solid var(--color-border)`,
                    background: isSelected ? 'var(--color-accent-turquoise)' : 'var(--color-bg)',
                    color: isSelected ? 'white' : 'var(--color-text)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    textAlign: 'left',
                    transition: 'all var(--transition-base) var(--ease-smooth)',
                  }}
                  aria-pressed={isSelected}
                  title={font.name}
                >
                  {font.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* System Fonts Selector */}
      {onFontSelect && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <label
            htmlFor="system-font-select"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            System Fonts
          </label>
          
          <select
            id="system-font-select"
            value={selectedFont || ''}
            onChange={(e) => onFontSelect(e.target.value)}
            disabled={disabled}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--spacing-sm)',
              border: 'var(--border-width-thin) solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Impact">Impact</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
        </div>
      )}
    </div>
  );
}
