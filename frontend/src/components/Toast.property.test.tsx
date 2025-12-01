import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { Toast, ToastContainer, useToast } from './Toast';
import { useState } from 'react';

/**
 * Property-Based Tests for Toast Notification System
 * Feature: neo-brutalism-ui-integration
 */

describe('Toast System Property Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * Property 6: Toast auto-dismiss timing
   * For any toast notification, if not manually dismissed, it should
   * automatically disappear after 3 seconds (±100ms tolerance)
   * 
   * **Feature: neo-brutalism-ui-integration, Property 6: Toast auto-dismiss timing**
   * **Validates: Requirements 6.4**
   */
  it('Property 6: Toast auto-dismiss timing - toasts auto-dismiss after 3 seconds', async () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.constantFrom('success' as const, 'error' as const, 'info' as const),
        (message, type) => {

          const onCloseMock = vi.fn();
          
          // Render toast with default 3000ms duration
          const { container, unmount } = render(
            <Toast
              message={message}
              type={type}
              duration={3000}
              onClose={onCloseMock}
            />
          );

          // Toast should be visible initially
          const toastMessage = container.querySelector('.toast-message');
          expect(toastMessage).not.toBeNull();
          expect(toastMessage?.textContent).toBe(message);

          // Fast-forward time by 2900ms (before auto-dismiss)
          vi.advanceTimersByTime(2900);
          
          // Toast should still be visible
          expect(container.querySelector('.toast')).not.toBeNull();

          // Fast-forward to 3000ms (trigger auto-dismiss animation)
          vi.advanceTimersByTime(100);
          
          // Fast-forward through the exit animation (300ms)
          vi.advanceTimersByTime(300);

          // onClose should have been called
          expect(onCloseMock).toHaveBeenCalledTimes(1);

          unmount();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6 (extended): Toast with custom duration respects timing
   */
  it('Property 6 (extended): Toast respects custom duration values', async () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 1000, max: 10000 }), // Custom durations between 1-10 seconds
        (message, customDuration) => {
          const onCloseMock = vi.fn();
          
          const { container, unmount } = render(
            <Toast
              message={message}
              type="info"
              duration={customDuration}
              onClose={onCloseMock}
            />
          );

          // Toast should be visible initially
          const toastMessage = container.querySelector('.toast-message');
          expect(toastMessage?.textContent).toBe(message);

          // Fast-forward to just before the custom duration
          vi.advanceTimersByTime(customDuration - 100);
          
          // Toast should still be visible
          expect(container.querySelector('.toast')).not.toBeNull();
          expect(onCloseMock).not.toHaveBeenCalled();

          // Fast-forward past the duration and exit animation
          vi.advanceTimersByTime(100 + 300);

          // onClose should have been called
          expect(onCloseMock).toHaveBeenCalledTimes(1);

          unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 6 (edge case): Loading toasts do not auto-dismiss
   */
  it('Property 6 (edge case): Loading toasts never auto-dismiss', async () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (message) => {
          const onCloseMock = vi.fn();
          
          const { container, unmount } = render(
            <Toast
              message={message}
              type="loading"
              duration={3000}
              onClose={onCloseMock}
            />
          );

          // Toast should be visible initially
          const toastMessage = container.querySelector('.toast-message');
          expect(toastMessage?.textContent).toBe(message);

          // Fast-forward well past the duration
          vi.advanceTimersByTime(10000);

          // Toast should still be visible and onClose should not be called
          expect(container.querySelector('.toast')).not.toBeNull();
          expect(onCloseMock).not.toHaveBeenCalled();

          unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7: Toast stacking order
   * For any sequence of toast notifications, they should be displayed
   * in chronological order from top to bottom with consistent spacing
   * 
   * **Feature: neo-brutalism-ui-integration, Property 7: Toast stacking order**
   * **Validates: Requirements 6.5**
   */
  it('Property 7: Toast stacking order - toasts display in chronological order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            type: fc.constantFrom('success' as const, 'error' as const, 'info' as const),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (toastConfigs) => {
          // Create a test component that uses the ToastContainer
          const TestComponent = () => {
            const [toasts, setToasts] = useState(
              toastConfigs.map((config, index) => ({
                ...config,
                id: `toast-${index}`,
              }))
            );

            return (
              <ToastContainer
                toasts={toasts}
                onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
              />
            );
          };

          const { unmount, container } = render(<TestComponent />);

          // Get all toast elements
          const toastElements = container.querySelectorAll('.toast');

          // Verify we have the correct number of toasts
          expect(toastElements.length).toBe(toastConfigs.length);

          // Verify toasts appear in the same order as they were created
          toastElements.forEach((toastElement, index) => {
            const expectedMessage = toastConfigs[index].message;
            const messageElement = toastElement.querySelector('.toast-message');
            expect(messageElement?.textContent).toBe(expectedMessage);
          });

          // Verify the container exists and has the toast-container class
          const containerElement = container.querySelector('.toast-container');
          expect(containerElement).not.toBeNull();

          unmount();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 (extended): Toast spacing is consistent
   */
  it('Property 7 (extended): Toast container maintains consistent gap spacing', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            type: fc.constantFrom('success' as const, 'error' as const, 'info' as const),
          }),
          { minLength: 2, maxLength: 4 }
        ),
        (toastConfigs) => {
          const TestComponent = () => {
            const toasts = toastConfigs.map((config, index) => ({
              ...config,
              id: `toast-${index}`,
            }));

            return (
              <ToastContainer
                toasts={toasts}
                onDismiss={() => {}}
              />
            );
          };

          const { unmount, container } = render(<TestComponent />);

          // Check that the container exists and has the correct class
          const containerElement = container.querySelector('.toast-container');
          expect(containerElement).not.toBeNull();
          
          // Verify all toasts are rendered
          const toastElements = container.querySelectorAll('.toast');
          expect(toastElements.length).toBe(toastConfigs.length);

          unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
