/**
 * Property-Based Tests for DragDropHandler
 * 
 * Tests correctness properties using fast-check
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { DragDropHandler, createDragDropHandler } from './dragDropHandler';

// Helper to create a mock File object
function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// Helper to create a mock DataTransfer object
function createMockDataTransfer(files: File[]): DataTransfer {
  const dataTransfer = {
    files: files as any,
    items: files.map(file => ({
      kind: 'file' as const,
      type: file.type,
      getAsFile: () => file
    })) as any,
    dropEffect: 'none' as DataTransfer['dropEffect'],
    effectAllowed: 'all' as DataTransfer['effectAllowed'],
    types: ['Files'],
    getData: () => '',
    setData: () => {},
    clearData: () => {},
    setDragImage: () => {}
  } as DataTransfer;
  
  return dataTransfer;
}

// Helper to create a mock DragEvent
function createMockDragEvent(type: string, dataTransfer?: DataTransfer): DragEvent {
  const event = new Event(type) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    value: dataTransfer || null,
    writable: false
  });
  Object.defineProperty(event, 'preventDefault', {
    value: () => {},
    writable: true
  });
  Object.defineProperty(event, 'stopPropagation', {
    value: () => {},
    writable: true
  });
  return event;
}

describe('DragDropHandler', () => {
  let container: HTMLElement;
  let handler: DragDropHandler | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (handler) {
      handler.destroy();
      handler = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Property 8: Drag-and-drop equivalence', () => {
    /**
     * Feature: image-upload-preprocessing, Property 8: Drag-and-drop equivalence
     * Validates: Requirements 1.1, 1.3
     * 
     * For any file uploaded via drag-and-drop, the result should be identical to uploading via file picker
     */
    it('should extract the same files from drag-and-drop as from file picker', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '.jpg'),
              size: fc.integer({ min: 100, max: 100000 }), // Reduced max size for performance
              type: fc.constantFrom('image/jpeg', 'image/png', 'image/webp')
            }),
            { minLength: 1, maxLength: 5 } // Reduced max files for performance
          ),
          (fileSpecs) => {
            // Create mock files
            const files = fileSpecs.map(spec => 
              createMockFile(spec.name, spec.size, spec.type)
            );
            
            // Test 1: Files received via drag-and-drop
            let droppedFiles: File[] = [];
            handler = createDragDropHandler(container, {
              onDrop: (receivedFiles) => {
                droppedFiles = receivedFiles;
              }
            });
            
            // Simulate drag-and-drop
            const dataTransfer = createMockDataTransfer(files);
            const dropEvent = createMockDragEvent('drop', dataTransfer);
            container.dispatchEvent(dropEvent);
            
            // Test 2: Files received via file picker (direct File array)
            const pickerFiles = files;
            
            // Property: The files should be identical
            expect(droppedFiles.length).toBe(pickerFiles.length);
            
            for (let i = 0; i < droppedFiles.length; i++) {
              expect(droppedFiles[i].name).toBe(pickerFiles[i].name);
              expect(droppedFiles[i].size).toBe(pickerFiles[i].size);
              expect(droppedFiles[i].type).toBe(pickerFiles[i].type);
            }
            
            // Clean up handler for next iteration
            if (handler) {
              handler.destroy();
              handler = null;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty file drops gracefully', async () => {
      await fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            let droppedFiles: File[] = [];
            let dropCalled = false;
            handler = createDragDropHandler(container, {
              onDrop: (receivedFiles) => {
                droppedFiles = receivedFiles;
                dropCalled = true;
              }
            });
            
            // Simulate drop with no files
            const dataTransfer = createMockDataTransfer([]);
            const dropEvent = createMockDragEvent('drop', dataTransfer);
            container.dispatchEvent(dropEvent);
            
            // onDrop should not be called for empty drops
            // or should be called with empty array
            if (dropCalled) {
              expect(droppedFiles.length).toBe(0);
            }
            
            // Clean up handler for next iteration
            if (handler) {
              handler.destroy();
              handler = null;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract files using items API when available', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).map(s => s + '.png'),
              size: fc.integer({ min: 1000, max: 5000000 }),
              type: fc.constant('image/png')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (fileSpecs) => {
            const files = fileSpecs.map(spec => 
              createMockFile(spec.name, spec.size, spec.type)
            );
            
            let droppedFiles: File[] = [];
            handler = createDragDropHandler(container, {
              onDrop: (receivedFiles) => {
                droppedFiles = receivedFiles;
              }
            });
            
            // Create DataTransfer with items API
            const dataTransfer = createMockDataTransfer(files);
            const dropEvent = createMockDragEvent('drop', dataTransfer);
            container.dispatchEvent(dropEvent);
            
            // Verify all files were extracted
            expect(droppedFiles.length).toBe(files.length);
            
            for (let i = 0; i < files.length; i++) {
              expect(droppedFiles[i].name).toBe(files[i].name);
              expect(droppedFiles[i].size).toBe(files[i].size);
              expect(droppedFiles[i].type).toBe(files[i].type);
            }
            
            // Clean up handler for next iteration
            if (handler) {
              handler.destroy();
              handler = null;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fallback to files API when items API is not available', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).map(s => s + '.webp'),
              size: fc.integer({ min: 500, max: 3000000 }),
              type: fc.constant('image/webp')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (fileSpecs) => {
            const files = fileSpecs.map(spec => 
              createMockFile(spec.name, spec.size, spec.type)
            );
            
            let droppedFiles: File[] = [];
            handler = createDragDropHandler(container, {
              onDrop: (receivedFiles) => {
                droppedFiles = receivedFiles;
              }
            });
            
            // Create DataTransfer without items API (fallback to files)
            const dataTransfer = {
              files: files as any,
              items: undefined as any, // No items API
              dropEffect: 'none' as DataTransfer['dropEffect'],
              effectAllowed: 'all' as DataTransfer['effectAllowed'],
              types: ['Files'],
              getData: () => '',
              setData: () => {},
              clearData: () => {},
              setDragImage: () => {}
            } as DataTransfer;
            
            const dropEvent = createMockDragEvent('drop', dataTransfer);
            container.dispatchEvent(dropEvent);
            
            // Verify all files were extracted using fallback
            expect(droppedFiles.length).toBe(files.length);
            
            for (let i = 0; i < files.length; i++) {
              expect(droppedFiles[i].name).toBe(files[i].name);
              expect(droppedFiles[i].size).toBe(files[i].size);
              expect(droppedFiles[i].type).toBe(files[i].type);
            }
            
            // Clean up handler for next iteration
            if (handler) {
              handler.destroy();
              handler = null;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Event handling behavior', () => {
    it('should prevent default browser behavior on all drag events', async () => {
      await fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            let preventDefaultCalled = 0;
            let stopPropagationCalled = 0;
            
            handler = createDragDropHandler(container, {});
            
            // Mock preventDefault and stopPropagation
            const mockPreventDefault = () => { preventDefaultCalled++; };
            const mockStopPropagation = () => { stopPropagationCalled++; };
            
            // Test dragenter
            const dragEnterEvent = createMockDragEvent('dragenter');
            Object.defineProperty(dragEnterEvent, 'preventDefault', {
              value: mockPreventDefault,
              writable: true
            });
            Object.defineProperty(dragEnterEvent, 'stopPropagation', {
              value: mockStopPropagation,
              writable: true
            });
            container.dispatchEvent(dragEnterEvent);
            
            // Test dragover
            const dragOverEvent = createMockDragEvent('dragover');
            Object.defineProperty(dragOverEvent, 'preventDefault', {
              value: mockPreventDefault,
              writable: true
            });
            Object.defineProperty(dragOverEvent, 'stopPropagation', {
              value: mockStopPropagation,
              writable: true
            });
            container.dispatchEvent(dragOverEvent);
            
            // Test dragleave
            const dragLeaveEvent = createMockDragEvent('dragleave');
            Object.defineProperty(dragLeaveEvent, 'preventDefault', {
              value: mockPreventDefault,
              writable: true
            });
            Object.defineProperty(dragLeaveEvent, 'stopPropagation', {
              value: mockStopPropagation,
              writable: true
            });
            container.dispatchEvent(dragLeaveEvent);
            
            // Test drop
            const dataTransfer = createMockDataTransfer([]);
            const dropEvent = createMockDragEvent('drop', dataTransfer);
            Object.defineProperty(dropEvent, 'preventDefault', {
              value: mockPreventDefault,
              writable: true
            });
            Object.defineProperty(dropEvent, 'stopPropagation', {
              value: mockStopPropagation,
              writable: true
            });
            container.dispatchEvent(dropEvent);
            
            // All events should call preventDefault and stopPropagation
            expect(preventDefaultCalled).toBeGreaterThanOrEqual(4);
            expect(stopPropagationCalled).toBeGreaterThanOrEqual(4);
            
            // Clean up handler for next iteration
            if (handler) {
              handler.destroy();
              handler = null;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call onDragOver callback on first dragenter', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (dragEnterCount) => {
            let dragOverCallCount = 0;
            
            handler = createDragDropHandler(container, {
              onDragOver: () => {
                dragOverCallCount++;
              }
            });
            
            // Dispatch multiple dragenter events
            for (let i = 0; i < dragEnterCount; i++) {
              const event = createMockDragEvent('dragenter');
              container.dispatchEvent(event);
            }
            
            // onDragOver should only be called once (on first dragenter)
            expect(dragOverCallCount).toBe(1);
            
            // Clean up handler for next iteration
            if (handler) {
              handler.destroy();
              handler = null;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call onDragLeave callback when drag counter reaches zero', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (dragEnterCount) => {
            let dragLeaveCallCount = 0;
            
            handler = createDragDropHandler(container, {
              onDragLeave: () => {
                dragLeaveCallCount++;
              }
            });
            
            // Dispatch dragenter events
            for (let i = 0; i < dragEnterCount; i++) {
              const event = createMockDragEvent('dragenter');
              container.dispatchEvent(event);
            }
            
            // Dispatch dragleave events (one less than dragenter)
            for (let i = 0; i < dragEnterCount - 1; i++) {
              const event = createMockDragEvent('dragleave');
              container.dispatchEvent(event);
            }
            
            // onDragLeave should not be called yet
            expect(dragLeaveCallCount).toBe(0);
            
            // Dispatch final dragleave
            const finalEvent = createMockDragEvent('dragleave');
            container.dispatchEvent(finalEvent);
            
            // Now onDragLeave should be called once
            expect(dragLeaveCallCount).toBe(1);
            
            // Clean up handler for next iteration
            if (handler) {
              handler.destroy();
              handler = null;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
