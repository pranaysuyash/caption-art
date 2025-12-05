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
    <div className='panel'>
      <div className='panel-header'>
        <h3 className='panel-title'>Templates</h3>
      </div>

      <div className='card-grid'>
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="card card-interactive"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80px',
              cursor: 'pointer',
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
