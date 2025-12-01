/**
 * OAuth Handler Property Tests
 * 
 * Property-based tests for OAuth token security
 * Feature: social-media-integration, Property 4: OAuth token security
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { OAuthHandler, type StoredToken } from './oauthHandler';
import type { ShareablePlatform } from './types';

describe('OAuth Handler Property Tests', () => {
  let oauthHandler: OAuthHandler;

  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Create a fresh OAuth handler for each test
    oauthHandler = new OAuthHandler();
    
    // Mock console methods to capture logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  /**
   * Feature: social-media-integration, Property 4: OAuth token security
   * 
   * For any connected account, the OAuth token should never be exposed 
   * in client-side logs or errors
   * 
   * Validates: Requirements 6.1, 6.2, 6.3
   */
  describe('Property 4: OAuth token security', () => {
    // Arbitrary for generating platform names
    const platformArb = fc.constantFrom<ShareablePlatform>(
      'instagram',
      'twitter',
      'facebook',
      'pinterest'
    );

    // Arbitrary for generating mock tokens
    // Use alphanumeric strings to avoid whitespace matching issues
    const tokenArb = fc.record({
      accessToken: fc.stringMatching(/^[a-zA-Z0-9]{20,100}$/),
      refreshToken: fc.option(
        fc.stringMatching(/^[a-zA-Z0-9]{20,100}$/)
      ),
      expiresIn: fc.integer({ min: 60, max: 86400 }), // 1 minute to 1 day
      tokenType: fc.constant('Bearer'),
      scope: fc.string(),
    });

    it('should never expose access tokens in console logs', () => {
      fc.assert(
        fc.property(
          platformArb,
          tokenArb,
          async (platform, token) => {
            // Clear console mocks
            vi.clearAllMocks();
            
            // Store a token
            const storedToken: StoredToken = {
              ...token,
              platform,
              expiresAt: Date.now() + token.expiresIn * 1000,
            };
            
            localStorage.setItem(
              `oauth_token_${platform}`,
              JSON.stringify(storedToken)
            );
            
            // Perform various operations that might log
            const handler = new OAuthHandler();
            
            // Get stored token
            handler.getStoredToken(platform);
            
            // Check if token is valid
            handler.isTokenValid(platform);
            
            // Get access token
            handler.getAccessToken(platform);
            
            // Check all console method calls
            const allCalls = [
              ...vi.mocked(console.log).mock.calls,
              ...vi.mocked(console.error).mock.calls,
              ...vi.mocked(console.warn).mock.calls,
              ...vi.mocked(console.info).mock.calls,
              ...vi.mocked(console.debug).mock.calls,
            ];
            
            // Property: No console call should contain the access token
            const tokenExposed = allCalls.some((call) =>
              call.some((arg) => {
                const argStr = typeof arg === 'string' ? arg : JSON.stringify(arg);
                return argStr.includes(token.accessToken);
              })
            );
            
            return !tokenExposed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never expose refresh tokens in console logs', () => {
      fc.assert(
        fc.property(
          platformArb,
          tokenArb.filter((t) => t.refreshToken !== null),
          async (platform, token) => {
            // Clear console mocks
            vi.clearAllMocks();
            
            // Store a token with refresh token
            const storedToken: StoredToken = {
              ...token,
              platform,
              expiresAt: Date.now() + token.expiresIn * 1000,
            };
            
            localStorage.setItem(
              `oauth_token_${platform}`,
              JSON.stringify(storedToken)
            );
            
            // Perform operations
            const handler = new OAuthHandler();
            handler.getStoredToken(platform);
            
            // Try to refresh token (will fail but might log)
            try {
              await handler.refreshToken(platform, storedToken);
            } catch {
              // Expected to fail in test environment
            }
            
            // Check all console method calls
            const allCalls = [
              ...vi.mocked(console.log).mock.calls,
              ...vi.mocked(console.error).mock.calls,
              ...vi.mocked(console.warn).mock.calls,
              ...vi.mocked(console.info).mock.calls,
              ...vi.mocked(console.debug).mock.calls,
            ];
            
            // Property: No console call should contain the refresh token
            const tokenExposed = allCalls.some((call) =>
              call.some((arg) => {
                const argStr = typeof arg === 'string' ? arg : JSON.stringify(arg);
                return token.refreshToken && argStr.includes(token.refreshToken);
              })
            );
            
            return !tokenExposed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never expose tokens in error messages', () => {
      fc.assert(
        fc.property(
          platformArb,
          tokenArb,
          async (platform, token) => {
            // Store an expired token to trigger error scenarios
            const storedToken: StoredToken = {
              ...token,
              platform,
              expiresAt: Date.now() - 1000, // Expired
            };
            
            localStorage.setItem(
              `oauth_token_${platform}`,
              JSON.stringify(storedToken)
            );
            
            const handler = new OAuthHandler();
            
            // Try operations that might throw errors
            let errorMessages: string[] = [];
            
            try {
              await handler.refreshToken(platform, storedToken);
            } catch (error) {
              if (error instanceof Error) {
                errorMessages.push(error.message);
                errorMessages.push(error.stack || '');
              }
            }
            
            try {
              // Simulate OAuth callback with invalid state
              await handler.handleOAuthCallback('code', 'invalid_state', platform);
            } catch (error) {
              if (error instanceof Error) {
                errorMessages.push(error.message);
                errorMessages.push(error.stack || '');
              }
            }
            
            // Property: No error message should contain the access token or refresh token
            const tokenExposed = errorMessages.some((msg) => {
              return (
                msg.includes(token.accessToken) ||
                (token.refreshToken && msg.includes(token.refreshToken))
              );
            });
            
            return !tokenExposed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never expose tokens when stringifying handler state', () => {
      fc.assert(
        fc.property(
          platformArb,
          tokenArb,
          (platform, token) => {
            // Store a token
            const storedToken: StoredToken = {
              ...token,
              platform,
              expiresAt: Date.now() + token.expiresIn * 1000,
            };
            
            localStorage.setItem(
              `oauth_token_${platform}`,
              JSON.stringify(storedToken)
            );
            
            const handler = new OAuthHandler();
            
            // Try to stringify the handler (common debugging practice)
            let stringified = '';
            try {
              stringified = JSON.stringify(handler);
            } catch {
              // Some objects can't be stringified, that's fine
              stringified = String(handler);
            }
            
            // Property: Stringified handler should not contain tokens
            const tokenExposed =
              stringified.includes(token.accessToken) ||
              (token.refreshToken && stringified.includes(token.refreshToken));
            
            return !tokenExposed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not leak tokens through localStorage enumeration', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              platform: platformArb,
              token: tokenArb,
            }),
            { minLength: 1, maxLength: 4 }
          ),
          (platformTokens) => {
            // Clear storage
            localStorage.clear();
            
            // Store multiple tokens
            platformTokens.forEach(({ platform, token }) => {
              const storedToken: StoredToken = {
                ...token,
                platform,
                expiresAt: Date.now() + token.expiresIn * 1000,
              };
              
              localStorage.setItem(
                `oauth_token_${platform}`,
                JSON.stringify(storedToken)
              );
            });
            
            // Enumerate localStorage keys (common debugging practice)
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) {
                keys.push(key);
              }
            }
            
            // Property: Keys should not contain actual token values
            const tokenExposed = platformTokens.some(({ token }) => {
              return keys.some(
                (key) =>
                  key.includes(token.accessToken) ||
                  (token.refreshToken && key.includes(token.refreshToken))
              );
            });
            
            return !tokenExposed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear all token data on revocation', () => {
      fc.assert(
        fc.property(
          platformArb,
          tokenArb,
          async (platform, token) => {
            // Store a token
            const storedToken: StoredToken = {
              ...token,
              platform,
              expiresAt: Date.now() + token.expiresIn * 1000,
            };
            
            localStorage.setItem(
              `oauth_token_${platform}`,
              JSON.stringify(storedToken)
            );
            
            // Also store legacy keys
            localStorage.setItem(`${platform}_auth_token`, token.accessToken);
            localStorage.setItem(`${platform}_username`, 'testuser');
            
            const handler = new OAuthHandler();
            
            // Revoke token
            await handler.revokeToken(platform);
            
            // Property: All token-related data should be cleared
            const tokenCleared = localStorage.getItem(`oauth_token_${platform}`) === null;
            const legacyCleared = localStorage.getItem(`${platform}_auth_token`) === null;
            const usernameCleared = localStorage.getItem(`${platform}_username`) === null;
            
            return tokenCleared && legacyCleared && usernameCleared;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate state parameter to prevent CSRF', () => {
      fc.assert(
        fc.property(
          platformArb,
          fc.stringMatching(/^[a-zA-Z0-9]{10,64}$/),
          fc.stringMatching(/^[a-zA-Z0-9]{10,64}$/),
          fc.stringMatching(/^[a-zA-Z0-9]{10,20}$/),
          async (platform, validState, invalidState, code) => {
            // Ensure states are different
            if (validState === invalidState || validState.trim() === invalidState.trim()) {
              return true; // Skip this case
            }
            
            // Set up valid state in session storage
            sessionStorage.setItem('oauth_state', validState);
            sessionStorage.setItem('oauth_platform', platform);
            
            const handler = new OAuthHandler();
            
            // Try to handle callback with invalid state
            let errorThrown = false;
            try {
              await handler.handleOAuthCallback(code, invalidState, platform);
            } catch (error) {
              errorThrown = true;
              
              // Verify error message doesn't contain tokens
              if (error instanceof Error) {
                const containsState = error.message.includes(validState) || 
                                     error.message.includes(invalidState);
                // It's okay to mention "state" but not the actual state values
                if (containsState) {
                  return false;
                }
              }
            }
            
            // Property: Invalid state should throw error
            return errorThrown;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not expose tokens when accessing through getAccessToken', () => {
      fc.assert(
        fc.property(
          platformArb,
          tokenArb,
          (platform, token) => {
            // Clear console mocks
            vi.clearAllMocks();
            
            // Store a token
            const storedToken: StoredToken = {
              ...token,
              platform,
              expiresAt: Date.now() + token.expiresIn * 1000,
            };
            
            localStorage.setItem(
              `oauth_token_${platform}`,
              JSON.stringify(storedToken)
            );
            
            const handler = new OAuthHandler();
            
            // Get access token (this is the intended way to access it)
            const accessToken = handler.getAccessToken(platform);
            
            // Verify we got the token
            expect(accessToken).toBe(token.accessToken);
            
            // Check that getting the token didn't log it
            const allCalls = [
              ...vi.mocked(console.log).mock.calls,
              ...vi.mocked(console.error).mock.calls,
              ...vi.mocked(console.warn).mock.calls,
              ...vi.mocked(console.info).mock.calls,
              ...vi.mocked(console.debug).mock.calls,
            ];
            
            // Property: Getting access token shouldn't log it
            const tokenLogged = allCalls.some((call) =>
              call.some((arg) => {
                const argStr = typeof arg === 'string' ? arg : JSON.stringify(arg);
                return argStr.includes(token.accessToken);
              })
            );
            
            return !tokenLogged;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('OAuth Handler Unit Tests', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should generate unique state parameters', () => {
      const handler = new OAuthHandler();
      const states = new Set<string>();
      
      // Generate multiple states
      for (let i = 0; i < 100; i++) {
        // Access private method through type assertion for testing
        const state = (handler as any).generateState();
        states.add(state);
      }
      
      // All states should be unique
      expect(states.size).toBe(100);
    });

    it('should check token validity correctly', () => {
      const handler = new OAuthHandler();
      const platform: ShareablePlatform = 'instagram';
      
      // No token stored
      expect(handler.isTokenValid(platform)).toBe(false);
      
      // Store valid token
      const validToken: StoredToken = {
        accessToken: 'valid_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'user_profile',
        platform,
        expiresAt: Date.now() + 3600000,
      };
      
      localStorage.setItem(`oauth_token_${platform}`, JSON.stringify(validToken));
      expect(handler.isTokenValid(platform)).toBe(true);
      
      // Store expired token
      const expiredToken: StoredToken = {
        ...validToken,
        expiresAt: Date.now() - 1000,
      };
      
      localStorage.setItem(`oauth_token_${platform}`, JSON.stringify(expiredToken));
      expect(handler.isTokenValid(platform)).toBe(false);
    });

    it('should return null for non-existent tokens', () => {
      const handler = new OAuthHandler();
      const platform: ShareablePlatform = 'twitter';
      
      expect(handler.getAccessToken(platform)).toBeNull();
      expect(handler.getStoredToken(platform)).toBeNull();
    });
  });
});
