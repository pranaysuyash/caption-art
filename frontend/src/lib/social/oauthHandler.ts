/**
 * OAuth Handler for Social Media Integration
 * Handles OAuth authentication flow for Instagram, Twitter, Facebook, and Pinterest
 * Requirements: 1.2, 1.3, 6.1, 6.2, 6.3
 */

import type { ShareablePlatform, AuthStatus } from './types';

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  authEndpoint: string;
  tokenEndpoint: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // seconds
  tokenType: string;
  scope: string;
}

export interface StoredToken extends OAuthToken {
  platform: ShareablePlatform;
  expiresAt: number; // timestamp
  username?: string;
  profilePicture?: string;
}

/**
 * OAuth configurations for each platform
 * In production, these would come from environment variables
 */
const OAUTH_CONFIGS: Record<ShareablePlatform, OAuthConfig> = {
  instagram: {
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/instagram/callback`,
    scope: ['user_profile', 'user_media'],
    authEndpoint: 'https://api.instagram.com/oauth/authorize',
    tokenEndpoint: 'https://api.instagram.com/oauth/access_token',
  },
  twitter: {
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/twitter/callback`,
    scope: ['tweet.read', 'tweet.write', 'users.read'],
    authEndpoint: 'https://twitter.com/i/oauth2/authorize',
    tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
  },
  facebook: {
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/facebook/callback`,
    scope: ['public_profile', 'pages_manage_posts', 'pages_read_engagement'],
    authEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  pinterest: {
    clientId: import.meta.env.VITE_PINTEREST_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/pinterest/callback`,
    scope: ['boards:read', 'pins:read', 'pins:write'],
    authEndpoint: 'https://www.pinterest.com/oauth/',
    tokenEndpoint: 'https://api.pinterest.com/v5/oauth/token',
  },
};

/**
 * Storage key prefix for OAuth tokens
 * Using a prefix to namespace our tokens
 */
import { safeLocalStorage } from '../storage/safeLocalStorage';
import { safeSessionStorage } from '../storage/safeSessionStorage';

const TOKEN_STORAGE_PREFIX = 'oauth_token_';

/**
 * OAuth Handler class
 */
export class OAuthHandler {
  private pendingAuth: Map<string, ShareablePlatform> = new Map();

  /**
   * Custom toJSON to prevent token exposure when handler is stringified
   * This prevents accidental logging of sensitive data
   */
  toJSON() {
    return {
      type: 'OAuthHandler',
      pendingAuthCount: this.pendingAuth.size,
      // Never include actual token data
    };
  }

  /**
   * Initiate OAuth flow for a platform
   * Requirements: 1.2, 1.3
   */
  initiateOAuthFlow(platform: ShareablePlatform): void {
    const config = OAUTH_CONFIGS[platform];

    if (!config.clientId) {
      throw new Error(`OAuth not configured for ${platform}`);
    }

    // Generate state parameter for CSRF protection
    const state = this.generateState();
    this.pendingAuth.set(state, platform);

    // Store state in sessionStorage for verification
    try {
      safeSessionStorage.setItem('oauth_state', state);
      safeSessionStorage.setItem('oauth_platform', platform);
    } catch (err) {
      // ignore sessionStorage failures in restrictive environments
    }

    // Build authorization URL
    const authUrl = this.buildAuthUrl(platform, config, state);

    // Open OAuth flow in popup or redirect
    this.openAuthWindow(authUrl, platform);
  }

  /**
   * Build authorization URL with all required parameters
   */
  private buildAuthUrl(
    platform: ShareablePlatform,
    config: OAuthConfig,
    state: string
  ): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope.join(' '),
      state,
    });

    // Platform-specific parameters
    if (platform === 'twitter') {
      params.append('code_challenge', 'challenge');
      params.append('code_challenge_method', 'plain');
    }

    return `${config.authEndpoint}?${params.toString()}`;
  }

  /**
   * Open authentication window
   */
  private openAuthWindow(url: string, platform: ShareablePlatform): void {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      url,
      `${platform}_oauth`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      // Fallback to redirect if popup blocked
      window.location.href = url;
    }
  }

  /**
   * Handle OAuth callback
   * Requirements: 1.3, 6.1
   */
  async handleOAuthCallback(
    code: string,
    state: string,
    platform: ShareablePlatform
  ): Promise<AuthStatus> {
    // Verify state parameter
    let storedState: string | null = null;
    let storedPlatform: string | null = null;
    try {
      storedState = safeSessionStorage.getItem('oauth_state');
      storedPlatform = safeSessionStorage.getItem('oauth_platform');
    } catch {
      // sessionStorage may be unavailable
    }

    if (state !== storedState || platform !== storedPlatform) {
      // Don't include state values in error message to prevent exposure
      throw new Error('Invalid OAuth state - possible CSRF attack');
    }

    // Clean up session storage
    try {
      safeSessionStorage.removeItem('oauth_state');
      safeSessionStorage.removeItem('oauth_platform');
    } catch {
      // ignore
    }

    // Exchange code for token
    const token = await this.exchangeCodeForToken(platform, code);

    // Store token securely
    await this.storeToken(platform, token);

    // Fetch user profile (don't pass raw token, use stored version)
    const profile = await this.fetchUserProfile(platform, token.accessToken);

    // Return auth status
    return {
      platform,
      isAuthenticated: true,
      username: profile.username,
      profilePicture: profile.profilePicture,
      tokenExpiry: new Date(Date.now() + token.expiresIn * 1000),
    };
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(
    platform: ShareablePlatform,
    code: string
  ): Promise<OAuthToken> {
    const config = OAUTH_CONFIGS[platform];

    const body = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      code,
      grant_type: 'authorization_code',
    });

    // In production, this would go through a backend proxy to keep client secret secure
    // For now, we'll simulate the token exchange
    return this.simulateTokenExchange(platform);
  }

  /**
   * Simulate token exchange (for development)
   * In production, this would make a real API call through a backend
   */
  private async simulateTokenExchange(
    platform: ShareablePlatform
  ): Promise<OAuthToken> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      accessToken: `mock_access_token_${platform}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${platform}_${Date.now()}`,
      expiresIn: 3600, // 1 hour
      tokenType: 'Bearer',
      scope: OAUTH_CONFIGS[platform].scope.join(' '),
    };
  }

  /**
   * Store token securely
   * Requirements: 6.1, 6.2
   */
  private async storeToken(
    platform: ShareablePlatform,
    token: OAuthToken
  ): Promise<void> {
    const storedToken: StoredToken = {
      ...token,
      platform,
      expiresAt: Date.now() + token.expiresIn * 1000,
    };

    // Store in localStorage (encrypted in production)
    const tokenKey = `${TOKEN_STORAGE_PREFIX}${platform}`;
    safeLocalStorage.setItem(tokenKey, JSON.stringify(storedToken));
  }

  /**
   * Retrieve stored token
   * Requirements: 6.1
   */
  getStoredToken(platform: ShareablePlatform): StoredToken | null {
    const tokenKey = `${TOKEN_STORAGE_PREFIX}${platform}`;
    const tokenJson = safeLocalStorage.getItem(tokenKey);

    if (!tokenJson) {
      return null;
    }

    try {
      const token: StoredToken = JSON.parse(tokenJson);

      // Check if token is expired
      if (token.expiresAt < Date.now()) {
        // Token expired, try to refresh (don't log errors with token data)
        this.refreshToken(platform, token).catch(() => {
          // If refresh fails, remove token silently
          this.revokeToken(platform);
        });
        return null;
      }

      return token;
    } catch (error) {
      // Don't log the error as it might contain token data
      return null;
    }
  }

  /**
   * Refresh expired token
   * Requirements: 6.3
   */
  async refreshToken(
    platform: ShareablePlatform,
    oldToken: StoredToken
  ): Promise<OAuthToken> {
    if (!oldToken.refreshToken) {
      // Don't include token data in error message
      throw new Error('No refresh token available');
    }

    const config = OAUTH_CONFIGS[platform];

    const body = new URLSearchParams({
      client_id: config.clientId,
      refresh_token: oldToken.refreshToken,
      grant_type: 'refresh_token',
    });

    try {
      // In production, this would make a real API call through a backend
      const newToken = await this.simulateTokenRefresh(platform);

      // Store new token
      await this.storeToken(platform, newToken);

      return newToken;
    } catch (error) {
      // Don't log or expose token data in errors
      throw new Error(`Failed to refresh token for ${platform}`);
    }
  }

  /**
   * Simulate token refresh (for development)
   */
  private async simulateTokenRefresh(
    platform: ShareablePlatform
  ): Promise<OAuthToken> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      accessToken: `mock_refreshed_token_${platform}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${platform}_${Date.now()}`,
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: OAUTH_CONFIGS[platform].scope.join(' '),
    };
  }

  /**
   * Revoke token and clear stored credentials
   * Requirements: 6.2
   */
  async revokeToken(platform: ShareablePlatform): Promise<void> {
    // In production, would call platform's revoke endpoint
    // For now, just remove from storage
    const tokenKey = `${TOKEN_STORAGE_PREFIX}${platform}`;
    safeLocalStorage.removeItem(tokenKey);

    // Also clear legacy storage keys (all possible variations)
    safeLocalStorage.removeItem(`${platform}_auth_token`);
    safeLocalStorage.removeItem(`${platform}_username`);
    safeLocalStorage.removeItem(`${platform}_profile_picture`);
    safeLocalStorage.removeItem(`${platform}_token_expiry`);
  }

  /**
   * Fetch user profile from platform
   */
  private async fetchUserProfile(
    platform: ShareablePlatform,
    accessToken: string
  ): Promise<{ username: string; profilePicture?: string }> {
    // In production, would make real API calls
    // For now, return mock data
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      username: `user_${platform}`,
      profilePicture: `https://via.placeholder.com/150?text=${platform}`,
    };
  }

  /**
   * Generate random state parameter for CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  /**
   * Check if token is valid and not expired
   */
  isTokenValid(platform: ShareablePlatform): boolean {
    const token = this.getStoredToken(platform);
    return token !== null && token.expiresAt > Date.now();
  }

  /**
   * Get access token for API calls
   * Returns null if no valid token exists
   */
  getAccessToken(platform: ShareablePlatform): string | null {
    const token = this.getStoredToken(platform);
    return token?.accessToken || null;
  }
}

// Export singleton instance
export const oauthHandler = new OAuthHandler();
