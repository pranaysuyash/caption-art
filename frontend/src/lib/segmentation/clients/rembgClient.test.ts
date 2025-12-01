/**
 * Tests for RembgClient error handling
 * Requirements: 5.1, 5.2, 5.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RembgClient } from './rembgClient';

describe('RembgClient Error Handling', () => {
  let client: RembgClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    client = new RembgClient(mockApiKey);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Failures with Retry', () => {
    it('should retry on network errors with exponential backoff', async () => {
      // Mock fetch to fail twice then succeed
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-prediction-id',
            status: 'starting',
          }),
        });
      });

      const result = await client.createPrediction('data:image/png;base64,test', 3);
      
      expect(callCount).toBe(3);
      expect(result.id).toBe('test-prediction-id');
    });

    it('should throw error after max retries exhausted', async () => {
      // Mock fetch to always fail
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        client.createPrediction('data:image/png;base64,test', 3)
      ).rejects.toThrow();
    });

    it('should not retry on non-retryable errors', async () => {
      // Mock fetch to return 401 (auth error)
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: 'Unauthorized' }),
        });
      });

      await expect(
        client.createPrediction('data:image/png;base64,test', 3)
      ).rejects.toMatchObject({
        type: 'replicate',
        message: 'Authentication failed. Please check your API key.',
        retryable: false,
      });

      // Should only call once (no retries)
      expect(callCount).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle 429 rate limit with retry-after', async () => {
      // Mock fetch to return 429 with retry-after
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ 
          detail: 'Rate limit exceeded',
          retry_after: 2,
        }),
      });

      await expect(
        client.createPrediction('data:image/png;base64,test', 1)
      ).rejects.toMatchObject({
        type: 'replicate',
        message: 'Too many requests. Please wait 2 seconds.',
        retryable: true,
        retryAfter: 2,
      });
    });

    it('should wait for retry-after before retrying', async () => {
      let callCount = 0;
      const startTime = Date.now();
      
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: () => Promise.resolve({ retry_after: 1 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-prediction-id',
            status: 'starting',
          }),
        });
      });

      const result = await client.createPrediction('data:image/png;base64,test', 2);
      const elapsed = Date.now() - startTime;
      
      expect(callCount).toBe(2);
      expect(result.id).toBe('test-prediction-id');
      // Should have waited at least 1 second
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Model Failures', () => {
    it('should parse model failure errors from API', async () => {
      // Test that model failures are properly parsed
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          detail: 'Model processing failed',
        }),
      });

      await expect(
        client.createPrediction('data:image/png;base64,test', 1)
      ).rejects.toMatchObject({
        type: 'replicate',
        message: 'Invalid request: Model processing failed',
      });
    });

    it('should handle model timeout errors', async () => {
      // Test that timeouts are handled correctly
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        json: () => Promise.resolve({ 
          detail: 'Gateway timeout',
        }),
      });

      await expect(
        client.createPrediction('data:image/png;base64,test', 1)
      ).rejects.toMatchObject({
        type: 'network',
        retryable: true,
      });
    });
  });

  describe('Error Response Parsing', () => {
    it('should parse error detail from API response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          detail: 'Invalid image format',
        }),
      });

      await expect(
        client.createPrediction('data:image/png;base64,test', 1)
      ).rejects.toMatchObject({
        type: 'replicate',
        message: 'Invalid request: Invalid image format',
      });
    });

    it('should handle missing error details gracefully', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(
        client.createPrediction('data:image/png;base64,test', 1)
      ).rejects.toMatchObject({
        type: 'network',
        message: 'Unable to connect to mask service. Retrying...',
      });
    });

    it('should detect no subject errors from message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          detail: 'No subject found in image',
        }),
      });

      await expect(
        client.createPrediction('data:image/png;base64,test', 1)
      ).rejects.toMatchObject({
        type: 'replicate',
        message: 'No subject detected. Text will appear on top of image.',
        retryable: false,
      });
    });

    it('should handle 500 errors as retryable', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ 
          detail: 'Internal server error',
        }),
      });

      await expect(
        client.createPrediction('data:image/png;base64,test', 1)
      ).rejects.toMatchObject({
        type: 'network',
        retryable: true,
      });
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after specified duration', async () => {
      // Mock prediction that never completes
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-prediction-id',
            status: 'starting',
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-prediction-id',
            status: 'processing',
          }),
        });

      const prediction = await client.createPrediction('data:image/png;base64,test');
      
      await expect(
        client.waitForCompletion(prediction.id, 2000) // 2 second timeout
      ).rejects.toMatchObject({
        type: 'timeout',
        message: 'Mask generation timed out. Please try again.',
        retryable: true,
      });
    }, 10000); // Increase test timeout
  });

  describe('Cancellation', () => {
    it('should provide cancellation functionality', async () => {
      // Test that cancelPrediction can be called without errors
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      // Should not throw
      await expect(
        client.cancelPrediction('test-id')
      ).resolves.toBeUndefined();
    });
  });
});

/**
 * Unit tests for RembgClient
 * Tests specific scenarios for prediction creation, polling, and completion
 */
describe('RembgClient - Unit Tests', () => {
  let client: RembgClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    client = new RembgClient(mockApiKey);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should throw error if API key is not provided', () => {
      expect(() => new RembgClient('')).toThrow('Replicate API key is required');
    });

    it('should create client with valid API key', () => {
      expect(() => new RembgClient('valid-key')).not.toThrow();
    });
  });

  describe('Prediction creation', () => {
    it('should create prediction with correct API call', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'pred-123',
          status: 'starting',
        }),
      });
      globalThis.fetch = mockFetch;

      const result = await client.createPrediction('data:image/png;base64,test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/predictions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Token ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.id).toBe('pred-123');
      expect(result.status).toBe('starting');
    });

    it('should include image data in request body', async () => {
      let requestBody: any;
      globalThis.fetch = vi.fn().mockImplementation(async (url, options: any) => {
        requestBody = JSON.parse(options.body);
        return {
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'starting',
          }),
        };
      });

      await client.createPrediction('data:image/png;base64,testdata');

      expect(requestBody.input.image).toBe('data:image/png;base64,testdata');
      expect(requestBody.version).toBeDefined();
    });
  });

  describe('Polling logic', () => {
    it('should poll until prediction succeeds', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'pred-123',
              status: 'starting',
            }),
          });
        } else if (callCount === 2) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'pred-123',
              status: 'processing',
            }),
          });
        } else {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'pred-123',
              status: 'succeeded',
              output: 'https://example.com/mask.png',
            }),
          });
        }
      });

      const prediction = await client.createPrediction('data:image/png;base64,test');
      const maskUrl = await client.waitForCompletion(prediction.id, 10000);

      expect(maskUrl).toBe('https://example.com/mask.png');
      expect(callCount).toBeGreaterThanOrEqual(2);
    }, 10000);

    it('should handle array output format', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'starting',
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'succeeded',
            output: ['https://example.com/mask1.png', 'https://example.com/mask2.png'],
          }),
        });

      const prediction = await client.createPrediction('data:image/png;base64,test');
      const maskUrl = await client.waitForCompletion(prediction.id, 10000);

      expect(maskUrl).toBe('https://example.com/mask1.png');
    });

    it('should handle string output format', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'starting',
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'succeeded',
            output: 'https://example.com/mask.png',
          }),
        });

      const prediction = await client.createPrediction('data:image/png;base64,test');
      const maskUrl = await client.waitForCompletion(prediction.id, 10000);

      expect(maskUrl).toBe('https://example.com/mask.png');
    });
  });

  describe('Completion detection', () => {
    it('should detect succeeded status', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'pred-123',
          status: 'succeeded',
          output: 'https://example.com/mask.png',
        }),
      });

      const prediction = await client.getPrediction('pred-123');

      expect(prediction.status).toBe('succeeded');
      expect(prediction.output).toBe('https://example.com/mask.png');
    });

    it('should detect failed status', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'starting',
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'failed',
            error: 'Model processing failed',
          }),
        });

      const prediction = await client.createPrediction('data:image/png;base64,test');

      await expect(
        client.waitForCompletion(prediction.id, 10000)
      ).rejects.toMatchObject({
        type: 'replicate',
        message: expect.stringContaining('Model processing failed'),
      });
    });

    it('should detect canceled status', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'starting',
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'canceled',
          }),
        });

      const prediction = await client.createPrediction('data:image/png;base64,test');

      await expect(
        client.waitForCompletion(prediction.id, 10000)
      ).rejects.toMatchObject({
        type: 'replicate',
        message: expect.stringContaining('cancelled'),
      });
    });

    it('should handle empty output as no subject detected', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'starting',
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: 'pred-123',
            status: 'succeeded',
            output: null,
          }),
        });

      const prediction = await client.createPrediction('data:image/png;base64,test');

      await expect(
        client.waitForCompletion(prediction.id, 10000)
      ).rejects.toMatchObject({
        type: 'replicate',
        message: expect.stringContaining('No subject detected'),
      });
    });
  });

  describe('Error message sanitization', () => {
    it('should remove technical prefixes from error messages', () => {
      const sanitize = (client as any).sanitizeErrorMessage.bind(client);

      expect(sanitize('Error: Something went wrong')).toBe('Something went wrong');
      expect(sanitize('TypeError: Cannot read property')).toBe('Cannot read property');
      expect(sanitize('NetworkError: Failed to connect')).toBe('Failed to connect');
    });

    it('should capitalize first letter of sanitized messages', () => {
      const sanitize = (client as any).sanitizeErrorMessage.bind(client);

      expect(sanitize('error: something went wrong')).toBe('Something went wrong');
    });

    it('should provide generic message for technical errors', () => {
      const sanitize = (client as any).sanitizeErrorMessage.bind(client);

      expect(sanitize('undefined')).toBe('Mask generation failed. Please try again.');
      expect(sanitize('null')).toBe('Mask generation failed. Please try again.');
      expect(sanitize('{}')).toBe('Mask generation failed. Please try again.');
      expect(sanitize('[object Object]')).toBe('Mask generation failed. Please try again.');
    });

    it('should remove stack traces from error messages', () => {
      const sanitize = (client as any).sanitizeErrorMessage.bind(client);
      const errorWithStack = 'Error: Something failed\n    at Object.<anonymous> (/path/to/file.js:10:15)';

      const result = sanitize(errorWithStack);

      expect(result).not.toContain('at Object');
      expect(result).not.toContain('/path/to/file');
    });
  });

  describe('getPrediction', () => {
    it('should fetch prediction status', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'pred-123',
          status: 'processing',
        }),
      });

      const prediction = await client.getPrediction('pred-123');

      expect(prediction.id).toBe('pred-123');
      expect(prediction.status).toBe('processing');
    });

    it('should handle API errors when fetching prediction', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Prediction not found' }),
      });

      await expect(client.getPrediction('pred-123')).rejects.toMatchObject({
        type: 'replicate',
      });
    });
  });
});
