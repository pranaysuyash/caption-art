/**
 * Property-Based Tests for Component Styles
 * Feature: neo-brutalism-ui-integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
// Import CSS files directly - Vite will handle them
import './design-system.css';
import './components.css';
import './animations.css';

describe('Component Styles Property Tests', () => {
  beforeAll(() => {
    // CSS files are automatically injected by Vite
  });

  /**
   * Feature: neo-brutalism-ui-integration, Property 8: Hover lift effect
   * Validates: Requirements 2.1
   * 
   * For any button or card element, when hovered, the translateY value should be
   * negative (element moves up) and shadow should increase
   */
  it('Property 8: Hover lift effect - elements move up and shadow increases on hover', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('button', 'card'),
        (elementType) => {
          // Create the element
          const element = document.createElement('div');
          element.className = elementType;
          document.body.appendChild(element);
          
          // Get initial computed styles
          const initialStyle = getComputedStyle(element);
          const initialTransform = initialStyle.transform;
          const initialBoxShadow = initialStyle.boxShadow;
          
          // Parse initial shadow offset
          const initialShadowMatch = initialBoxShadow.match(/([-\d.]+)px\s+([-\d.]+)px/);
          const initialShadowX = initialShadowMatch ? parseFloat(initialShadowMatch[1]) : 0;
          const initialShadowY = initialShadowMatch ? parseFloat(initialShadowMatch[2]) : 0;
          const initialShadowOffset = Math.sqrt(initialShadowX ** 2 + initialShadowY ** 2);
          
          // Simulate hover by adding hover class or using :hover pseudo-class
          // Since we can't directly trigger :hover in tests, we'll check the CSS rules
          const styleSheets = Array.from(document.styleSheets);
          let hoverRule: CSSStyleRule | null = null;
          
          for (const sheet of styleSheets) {
            try {
              const rules = Array.from(sheet.cssRules || []);
              for (const rule of rules) {
                if (rule instanceof CSSStyleRule) {
                  const selector = rule.selectorText;
                  if (
                    (elementType === 'button' && selector === '.button:hover:not(:disabled)') ||
                    (elementType === 'card' && selector === '.card:hover')
                  ) {
                    hoverRule = rule;
                    break;
                  }
                }
              }
              if (hoverRule) break;
            } catch (e) {
              // Skip sheets we can't access (CORS)
              continue;
            }
          }
          
          // Verify hover rule exists
          expect(hoverRule).not.toBeNull();
          
          if (hoverRule) {
            const hoverStyle = hoverRule.style;
            
            // Check transform property
            const transform = hoverStyle.transform;
            if (transform && transform !== 'none') {
              // Extract translateY value
              const translateYMatch = transform.match(/translateY\(([-\d.]+)px\)/);
              if (translateYMatch) {
                const translateY = parseFloat(translateYMatch[1]);
                // translateY should be negative (element moves up)
                expect(translateY).toBeLessThan(0);
              }
            }
            
            // Check box-shadow property
            const boxShadow = hoverStyle.boxShadow;
            if (boxShadow && boxShadow !== 'none') {
              // Parse hover shadow offset
              const hoverShadowMatch = boxShadow.match(/([-\d.]+)px\s+([-\d.]+)px/);
              if (hoverShadowMatch) {
                const hoverShadowX = parseFloat(hoverShadowMatch[1]);
                const hoverShadowY = parseFloat(hoverShadowMatch[2]);
                const hoverShadowOffset = Math.sqrt(hoverShadowX ** 2 + hoverShadowY ** 2);
                
                // Hover shadow offset should be greater than initial
                expect(hoverShadowOffset).toBeGreaterThan(initialShadowOffset);
              }
            }
          }
          
          // Cleanup
          document.body.removeChild(element);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
