/**
 * Unit tests for StylePrompts
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2
 */

import { describe, it, expect } from 'vitest'
import { getPrompt, getAllStyles, getStyleDescription, SYSTEM_PROMPT } from './stylePrompts'
import { CaptionStyle } from './types'

describe('StylePrompts', () => {
  const testBaseCaption = 'A beautiful sunset over the ocean'

  describe('getPrompt', () => {
    it('should generate prompt for creative style', () => {
      const prompt = getPrompt('creative', testBaseCaption)
      
      expect(prompt).toContain(testBaseCaption)
      expect(prompt).toContain('imaginative')
      expect(prompt).toContain('artistic')
    })

    it('should generate prompt for funny style', () => {
      const prompt = getPrompt('funny', testBaseCaption)
      
      expect(prompt).toContain(testBaseCaption)
      expect(prompt).toContain('humor')
      expect(prompt).toContain('playful')
    })

    it('should generate prompt for poetic style', () => {
      const prompt = getPrompt('poetic', testBaseCaption)
      
      expect(prompt).toContain(testBaseCaption)
      expect(prompt).toContain('poetically')
      expect(prompt).toContain('lyrical')
    })

    it('should generate prompt for minimal style', () => {
      const prompt = getPrompt('minimal', testBaseCaption)
      
      expect(prompt).toContain(testBaseCaption)
      expect(prompt).toContain('minimal')
      expect(prompt).toContain('fewest words')
    })

    it('should generate prompt for dramatic style', () => {
      const prompt = getPrompt('dramatic', testBaseCaption)
      
      expect(prompt).toContain(testBaseCaption)
      expect(prompt).toContain('dramatic')
      expect(prompt).toContain('intense')
    })

    it('should generate prompt for quirky style', () => {
      const prompt = getPrompt('quirky', testBaseCaption)
      
      expect(prompt).toContain(testBaseCaption)
      expect(prompt).toContain('quirk')
      expect(prompt).toContain('unconventional')
    })

    it('should interpolate base caption into prompt template', () => {
      const customCaption = 'A dog playing in the park'
      const prompt = getPrompt('creative', customCaption)
      
      expect(prompt).toContain(customCaption)
      expect(prompt).toMatch(/Base caption:.*A dog playing in the park/)
    })

    it('should throw error for unknown style', () => {
      expect(() => getPrompt('invalid' as CaptionStyle, testBaseCaption)).toThrow('Unknown style')
    })

    it('should handle empty base caption', () => {
      const prompt = getPrompt('creative', '')
      
      expect(prompt).toContain('Base caption: ""')
      expect(prompt).toContain('imaginative')
    })

    it('should handle base caption with special characters', () => {
      const specialCaption = 'A "quoted" caption with \'apostrophes\' and newlines\n'
      const prompt = getPrompt('creative', specialCaption)
      
      expect(prompt).toContain(specialCaption)
    })
  })

  describe('getAllStyles', () => {
    it('should return all available styles', () => {
      const styles = getAllStyles()
      
      expect(styles).toHaveLength(6)
      expect(styles).toContain('creative')
      expect(styles).toContain('funny')
      expect(styles).toContain('poetic')
      expect(styles).toContain('minimal')
      expect(styles).toContain('dramatic')
      expect(styles).toContain('quirky')
    })

    it('should return array of valid CaptionStyle values', () => {
      const styles = getAllStyles()
      const validStyles: CaptionStyle[] = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
      
      styles.forEach(style => {
        expect(validStyles).toContain(style)
      })
    })

    it('should return consistent results on multiple calls', () => {
      const styles1 = getAllStyles()
      const styles2 = getAllStyles()
      
      expect(styles1).toEqual(styles2)
    })
  })

  describe('getStyleDescription', () => {
    it('should return description for creative style', () => {
      const description = getStyleDescription('creative')
      
      expect(description).toContain('Imaginative')
      expect(description).toContain('artistic')
    })

    it('should return description for funny style', () => {
      const description = getStyleDescription('funny')
      
      expect(description).toContain('Humorous')
      expect(description).toContain('playful')
    })

    it('should return description for poetic style', () => {
      const description = getStyleDescription('poetic')
      
      expect(description).toContain('Lyrical')
      expect(description).toContain('metaphorical')
    })

    it('should return description for minimal style', () => {
      const description = getStyleDescription('minimal')
      
      expect(description).toContain('Concise')
      expect(description).toContain('impactful')
    })

    it('should return description for dramatic style', () => {
      const description = getStyleDescription('dramatic')
      
      expect(description).toContain('Intense')
      expect(description).toContain('emotional')
    })

    it('should return description for quirky style', () => {
      const description = getStyleDescription('quirky')
      
      expect(description).toContain('Unconventional')
      expect(description).toContain('whimsical')
    })

    it('should return fallback for unknown style', () => {
      const description = getStyleDescription('invalid' as CaptionStyle)
      
      expect(description).toBe('Unknown style')
    })

    it('should return human-readable descriptions', () => {
      const styles = getAllStyles()
      
      styles.forEach(style => {
        const description = getStyleDescription(style)
        
        // Should be a non-empty string
        expect(description.length).toBeGreaterThan(0)
        
        // Should start with capital letter
        expect(description[0]).toMatch(/[A-Z]/)
        
        // Should not contain technical terms
        expect(description).not.toContain('function')
        expect(description).not.toContain('undefined')
      })
    })
  })

  describe('SYSTEM_PROMPT', () => {
    it('should be defined', () => {
      expect(SYSTEM_PROMPT).toBeDefined()
      expect(typeof SYSTEM_PROMPT).toBe('string')
    })

    it('should mention caption writing', () => {
      expect(SYSTEM_PROMPT).toContain('caption')
    })

    it('should mention character limit', () => {
      expect(SYSTEM_PROMPT).toContain('100 characters')
    })

    it('should mention JSON format', () => {
      expect(SYSTEM_PROMPT).toContain('JSON')
    })
  })

  describe('prompt template interpolation', () => {
    it('should properly format prompts with base caption', () => {
      const testCaptions = [
        'Simple caption',
        'Caption with "quotes"',
        'Caption with\nnewlines',
        'Very long caption that exceeds normal length to test how the prompt handles longer text inputs',
        ''
      ]

      const styles = getAllStyles()

      testCaptions.forEach(caption => {
        styles.forEach(style => {
          const prompt = getPrompt(style, caption)
          
          // Should contain the base caption
          expect(prompt).toContain(caption)
          
          // Should have proper structure
          expect(prompt).toMatch(/Base caption:/)
          
          // Should not have template placeholders
          expect(prompt).not.toContain('${')
          expect(prompt).not.toContain('{baseCaption}')
        })
      })
    })

    it('should generate unique prompts for different styles', () => {
      const styles = getAllStyles()
      const prompts = styles.map(style => getPrompt(style, testBaseCaption))
      
      // Each prompt should be unique
      const uniquePrompts = new Set(prompts)
      expect(uniquePrompts.size).toBe(styles.length)
    })

    it('should generate consistent prompts for same inputs', () => {
      const prompt1 = getPrompt('creative', testBaseCaption)
      const prompt2 = getPrompt('creative', testBaseCaption)
      
      expect(prompt1).toBe(prompt2)
    })
  })
})
