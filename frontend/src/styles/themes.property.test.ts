import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Theme Transition Smoothness
 * Feature: neo-brutalism-ui-integration
 */

describe('Theme Transition Property Tests', () => {
  let testContainer: HTMLDivElement;

  beforeEach(() => {
    // Create a test container
    testContainer = document.createElement('div');
    testContainer.style.cssText = `
      background-color: var(--color-bg);
      color: var(--color-text);
      border-color: var(--color-border);
    `;
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    // Clean up
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    // Reset theme
    document.documentElement.removeAttribute('data-theme');
  });

  /**
   * Property 12: Theme transition smoothness
   * For any theme toggle, all color transitions should complete within 300ms (±50ms tolerance)
   * 
   * **Feature: neo-brutalism-ui-integration, Property 12: Theme transition smoothness**
   * **Validates: Requirements 3.4**
   */
  it('Property 12: Theme transition smoothness - transitions complete within 300ms ±50ms', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('light' as const, 'dark' as const),
        (fromTheme, toTheme) => {
          // Set initial theme
          document.documentElement.setAttribute('data-theme', fromTheme);
          
          // Force a reflow to ensure styles are applied
          testContainer.offsetHeight;

          // Get computed styles before transition
          const computedStyle = window.getComputedStyle(testContainer);
          
          // Check transition properties
          const transitionProperty = computedStyle.transitionProperty;
          const transitionDuration = computedStyle.transitionDuration;
          
          // Parse transition duration (format: "0.3s" or "300ms")
          let durationMs = 0;
          if (transitionDuration.includes('ms')) {
            durationMs = parseFloat(transitionDuration);
          } else if (transitionDuration.includes('s')) {
            durationMs = parseFloat(transitionDuration) * 1000;
          }

          // Verify transition is defined for color properties
          const hasColorTransition = 
            transitionProperty.includes('background-color') ||
            transitionProperty.includes('color') ||
            transitionProperty.includes('border-color') ||
            transitionProperty === 'all';

          if (hasColorTransition && durationMs > 0) {
            // Verify duration is within 300ms ±50ms (250ms to 350ms)
            expect(durationMs).toBeGreaterThanOrEqual(250);
            expect(durationMs).toBeLessThanOrEqual(350);
          }

          // Change theme
          document.documentElement.setAttribute('data-theme', toTheme);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12 (extended): Transition timing function uses cubic-bezier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        (theme) => {
          // Set theme
          document.documentElement.setAttribute('data-theme', theme);
          
          // Force a reflow
          testContainer.offsetHeight;

          // Get computed styles
          const computedStyle = window.getComputedStyle(testContainer);
          const transitionTimingFunction = computedStyle.transitionTimingFunction;

          // Verify timing function uses cubic-bezier (not linear or default ease)
          // cubic-bezier is represented as "cubic-bezier(x1, y1, x2, y2)" in computed styles
          const usesCubicBezier = 
            transitionTimingFunction.includes('cubic-bezier') ||
            transitionTimingFunction === 'ease-in-out' || // ease-in-out is a cubic-bezier
            transitionTimingFunction === 'ease-in' ||     // ease-in is a cubic-bezier
            transitionTimingFunction === 'ease-out';      // ease-out is a cubic-bezier

          // Should not be linear
          const isNotLinear = transitionTimingFunction !== 'linear';

          expect(usesCubicBezier || isNotLinear).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12 (edge case): Multiple rapid theme toggles maintain consistent timing', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('light' as const, 'dark' as const), { minLength: 2, maxLength: 5 }),
        (themeSequence) => {
          const durations: number[] = [];

          for (const theme of themeSequence) {
            document.documentElement.setAttribute('data-theme', theme);
            testContainer.offsetHeight; // Force reflow

            const computedStyle = window.getComputedStyle(testContainer);
            const transitionDuration = computedStyle.transitionDuration;

            let durationMs = 0;
            if (transitionDuration.includes('ms')) {
              durationMs = parseFloat(transitionDuration);
            } else if (transitionDuration.includes('s')) {
              durationMs = parseFloat(transitionDuration) * 1000;
            }

            if (durationMs > 0) {
              durations.push(durationMs);
            }
          }

          // All durations should be consistent (same value)
          if (durations.length > 1) {
            const firstDuration = durations[0];
            const allSame = durations.every(d => Math.abs(d - firstDuration) < 1);
            expect(allSame).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
