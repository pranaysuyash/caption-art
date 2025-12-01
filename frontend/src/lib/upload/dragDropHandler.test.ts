/**
 * Unit Tests for DragDropHandler
 * 
 * Tests drag-and-drop functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DragDropHandler, createDragDropHandler } from './dragDropHandler';

// Helper to create a mock DataTransfer object
function createMockDataTransfer(files: File[]): DataTransfer {
  const items: DataTransferItem[] = files.map(file => ({
    kind: 'file' as const,
    type: file.type,
    getAsFile: () => file,
    getAsString: vi.fn(),
    webkitGetAsEntry: vi.fn(),
  }));

  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) {
        yield file;
      }
    },
  } as unknown as FileList;

  return {
    dropEffect: 'none',
    effectAllowed: 'all',
    files: fileList,
    items: {
      length: items.length,
      [Symbol.iterator]: function* () {
        for (const item of items) {
          yield item;
        }
      },
      ...items,
    } as unknown as DataTransferItemList,
    types: ['Files'],
    clearData: vi.fn(),
    getData: vi.fn(),
    setData: vi.fn(),
    setDragImage: vi.fn(),
  } as DataTransfer;
}

// Helper to create a mock drag event
function createMockDragEvent(type: string, files: File[] = []): DragEvent {
  const dataTransfer = createMockDataTransfer(files);
  
  return {
    type,
    dataTransfer,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: document.createElement('div'),
    currentTarget: document.createElement('div'),
  } as unknown as DragEvent;
}

describe('DragDropHandler', () => {
  let element: HTMLElement;
  let callbacks: {
    onDragOver: ReturnType<typeof vi.fn>;
    onDragLeave: ReturnType<typeof vi.fn>;
    onDrop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    callbacks = {
      onDragOver: vi.fn(),
      onDragLeave: vi.fn(),
      onDrop: vi.fn(),
    };
  });

  describe('constructor', () => {
    it('should create a handler instance', () => {
      const handler = new DragDropHandler(element, callbacks);
      expect(handler).toBeInstanceOf(DragDropHandler);
    });

    it('should attach event listeners to element', () => {
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      
      new DragDropHandler(element, callbacks);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragenter', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });
  });

  describe('event listener attachment', () => {
    it('should attach all required event listeners', () => {
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      
      new DragDropHandler(element, callbacks);
      
      const calls = addEventListenerSpy.mock.calls;
      const eventTypes = calls.map(call => call[0]);
      
      expect(eventTypes).toContain('dragenter');
      expect(eventTypes).toContain('dragover');
      expect(eventTypes).toContain('dragleave');
      expect(eventTypes).toContain('drop');
      expect(calls.length).toBe(4);
    });

    it('should attach functions as event handlers', () => {
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      
      new DragDropHandler(element, callbacks);
      
      addEventListenerSpy.mock.calls.forEach(call => {
        expect(typeof call[1]).toBe('function');
      });
    });
  });

  describe('destroy', () => {
    it('should remove event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');
      const handler = new DragDropHandler(element, callbacks);
      
      handler.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragenter', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });

    it('should remove all four event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');
      const handler = new DragDropHandler(element, callbacks);
      
      handler.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('createDragDropHandler helper', () => {
    it('should create a DragDropHandler instance', () => {
      const handler = createDragDropHandler(element, callbacks);
      expect(handler).toBeInstanceOf(DragDropHandler);
    });

    it('should attach event listeners', () => {
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      
      createDragDropHandler(element, callbacks);
      
      expect(addEventListenerSpy).toHaveBeenCalledTimes(4);
    });

    it('should return a handler with destroy method', () => {
      const handler = createDragDropHandler(element, callbacks);
      expect(typeof handler.destroy).toBe('function');
    });
  });

  describe('callback configuration', () => {
    it('should accept callbacks object', () => {
      const handler = new DragDropHandler(element, {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
      });
      expect(handler).toBeInstanceOf(DragDropHandler);
    });

    it('should work with partial callbacks', () => {
      const handler = new DragDropHandler(element, {
        onDrop: vi.fn(),
      });
      expect(handler).toBeInstanceOf(DragDropHandler);
    });

    it('should work with empty callbacks', () => {
      const handler = new DragDropHandler(element, {});
      expect(handler).toBeInstanceOf(DragDropHandler);
    });
  });
});
