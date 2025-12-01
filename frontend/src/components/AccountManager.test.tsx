/**
 * Tests for AccountManager component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AccountManager } from './AccountManager';
import { oauthHandler } from '../lib/social/oauthHandler';
import { platformManager } from '../lib/social/platformManager';
import type { AuthStatus, ShareablePlatform } from '../lib/social/types';

// Mock the social media modules
vi.mock('../lib/social/oauthHandler', () => ({
  oauthHandler: {
    initiateOAuthFlow: vi.fn(),
    revokeToken: vi.fn(),
  },
}));

vi.mock('../lib/social/platformManager', () => ({
  platformManager: {
    checkAuthStatus: vi.fn(),
    getPlatformConfig: vi.fn((platform: ShareablePlatform) => ({
      name: platform,
      displayName: platform.charAt(0).toUpperCase() + platform.slice(1),
      maxImageSize: 8 * 1024 * 1024,
      supportedFormats: ['image/jpeg', 'image/png'],
      requiresAuth: true,
    })),
  },
}));

describe('AccountManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 6.1: Display connected accounts
   */
  describe('Display connected accounts', () => {
    it('should display all platform accounts', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
          profilePicture: 'https://example.com/pic.jpg',
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: true,
          username: 'fb_user',
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText('Instagram')).toBeInTheDocument();
        expect(screen.getByText('Twitter')).toBeInTheDocument();
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('Pinterest')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<AccountManager />);

      expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
    });

    it('should display connected status for authenticated accounts', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
          profilePicture: 'https://example.com/pic.jpg',
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText('@test_user')).toBeInTheDocument();
      });
    });

    it('should display not connected status for unauthenticated accounts', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: false,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        const notConnectedElements = screen.getAllByText('Not connected');
        expect(notConnectedElements.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Requirement 6.2: Allow disconnecting accounts
   */
  describe('Disconnect accounts', () => {
    it('should show disconnect button for connected accounts', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
    });

    it('should call revokeToken when disconnect is clicked', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );
      vi.mocked(oauthHandler.revokeToken).mockResolvedValue();

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        expect(oauthHandler.revokeToken).toHaveBeenCalledWith('instagram');
      });

      confirmSpy.mockRestore();
    });

    it('should not disconnect if user cancels confirmation', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        expect(oauthHandler.revokeToken).not.toHaveBeenCalled();
      });

      confirmSpy.mockRestore();
    });

    it('should call onAccountDisconnected callback', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );
      vi.mocked(oauthHandler.revokeToken).mockResolvedValue();

      const onDisconnected = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<AccountManager onAccountDisconnected={onDisconnected} />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(onDisconnected).toHaveBeenCalledWith('instagram');
      });

      confirmSpy.mockRestore();
    });
  });

  /**
   * Requirement 6.3: Allow connecting new accounts
   */
  describe('Connect new accounts', () => {
    it('should show connect button for disconnected accounts', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: false,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        const connectButtons = screen.getAllByText('Connect');
        expect(connectButtons.length).toBeGreaterThan(0);
      });
    });

    it('should initiate OAuth flow when connect is clicked', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: false,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getAllByText('Connect').length).toBeGreaterThan(0);
      });

      const connectButtons = screen.getAllByText('Connect');
      fireEvent.click(connectButtons[1]); // Click Twitter (second button)

      expect(oauthHandler.initiateOAuthFlow).toHaveBeenCalledWith('twitter');
    });

    it('should show connecting state during OAuth flow', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: false,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getAllByText('Connect').length).toBeGreaterThan(0);
      });

      const connectButtons = screen.getAllByText('Connect');
      fireEvent.click(connectButtons[0]); // Click Instagram (first button)

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 6.4: Show account details
   */
  describe('Show account details', () => {
    it('should display username for connected accounts', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'my_username',
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText('@my_username')).toBeInTheDocument();
      });
    });

    it('should display profile picture for connected accounts', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
          profilePicture: 'https://example.com/avatar.jpg',
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        const avatar = screen.getByAltText('test_user');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      });
    });

    it('should display token expiry date', async () => {
      const expiryDate = new Date('2025-12-31');
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
          tokenExpiry: expiryDate,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText(/Expires:/)).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 6.5: Handle token expiration
   */
  describe('Handle token expiration', () => {
    it('should show warning for expiring tokens', async () => {
      const expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
          tokenExpiry: expiryDate,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText(/Token expiring soon/)).toBeInTheDocument();
      });
    });

    it('should show reconnect button for expiring tokens', async () => {
      const expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
          tokenExpiry: expiryDate,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText('Reconnect')).toBeInTheDocument();
      });
    });

    it('should initiate OAuth flow when reconnect is clicked', async () => {
      const expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
          tokenExpiry: expiryDate,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.getByText('Reconnect')).toBeInTheDocument();
      });

      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);

      expect(oauthHandler.initiateOAuthFlow).toHaveBeenCalledWith('instagram');
    });

    it('should not show warning for tokens expiring after 24 hours', async () => {
      const expiryDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'test_user',
          tokenExpiry: expiryDate,
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: false,
        },
        {
          platform: 'pinterest',
          isAuthenticated: false,
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        expect(screen.queryByText(/Token expiring soon/)).not.toBeInTheDocument();
      });
    });
  });

  /**
   * Integration tests
   */
  describe('Integration', () => {
    it('should handle multiple accounts with different states', async () => {
      const mockStatuses: AuthStatus[] = [
        {
          platform: 'instagram',
          isAuthenticated: true,
          username: 'insta_user',
          tokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
        {
          platform: 'twitter',
          isAuthenticated: false,
        },
        {
          platform: 'facebook',
          isAuthenticated: true,
          username: 'fb_user',
          tokenExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000), // Expiring
        },
        {
          platform: 'pinterest',
          isAuthenticated: true,
          username: 'pin_user',
        },
      ];

      vi.mocked(platformManager.checkAuthStatus).mockImplementation(
        async (platform: ShareablePlatform) => {
          return mockStatuses.find((s) => s.platform === platform)!;
        }
      );

      render(<AccountManager />);

      await waitFor(() => {
        // Instagram - connected, not expiring
        expect(screen.getByText('@insta_user')).toBeInTheDocument();

        // Twitter - not connected
        expect(screen.getByText('Not connected')).toBeInTheDocument();

        // Facebook - connected, expiring
        expect(screen.getByText('@fb_user')).toBeInTheDocument();
        expect(screen.getByText(/Token expiring soon/)).toBeInTheDocument();

        // Pinterest - connected
        expect(screen.getByText('@pin_user')).toBeInTheDocument();
      });
    });
  });
});
