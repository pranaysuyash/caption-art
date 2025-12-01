/**
 * TemplateSelector - UI for selecting templates
 * Provides a grid of template cards with neo-brutalism styling
 */

import { Template } from '../lib/templates/types';
import { TemplateManager } from '../lib/templates/templateManager';

export interface TemplateSelectorProps {
  /** Callback when template is selected */
  onSelect: (templateId: string) => void;
}

/**
 * TemplateSelector component
 */
export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const templates = TemplateManager.getTemplates();

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
        Templates
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--spacing-md)',
        }}
      >
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="button"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              padding: 'var(--spacing-md)',
              border: `var(--border-width-medium) solid var(--color-border)`,
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              boxShadow: `var(--shadow-offset-sm) var(--shadow-offset-sm) 0 var(--color-border)`,
              transition: 'all var(--transition-base) var(--ease-smooth)',
              minHeight: '80px',
            }}
            aria-label={`Select ${template.name} template`}
          >
            <span style={{ fontSize: '1.2em', marginBottom: '4px' }}>
              {template.config.text?.slice(0, 1) || 'T'}
            </span>
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
}
