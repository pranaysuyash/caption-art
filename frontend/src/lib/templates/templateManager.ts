import { CanvasState } from '../history/types';
import { DEFAULT_TEMPLATES } from './defaultTemplates';
import { Template } from './types';

/**
 * Manages template retrieval and application
 */
export class TemplateManager {
  /**
   * Get all available templates
   */
  static getTemplates(): Template[] {
    return DEFAULT_TEMPLATES;
  }

  /**
   * Get a specific template by ID
   */
  static getTemplateById(id: string): Template | undefined {
    return DEFAULT_TEMPLATES.find(t => t.id === id);
  }

  /**
   * Apply a template to the current canvas state
   * Returns the partial state updates needed
   */
  static applyTemplate(templateId: string, currentState: CanvasState): Partial<CanvasState> {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      console.warn(`Template ${templateId} not found`);
      return {};
    }

    return {
      preset: template.config.preset,
      fontSize: template.config.fontSize,
      transform: {
        ...template.config.transform,
      },
      // Only update text if the template specifies it and current text is empty or default
      text: template.config.text && (!currentState.text || currentState.text === 'Double click to edit') 
        ? template.config.text 
        : currentState.text,
    };
  }
}
