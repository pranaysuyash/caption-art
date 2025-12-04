import { useLocation, Link } from 'react-router-dom';
import { getThemeManager } from '../../lib/themes/themeManager';
import { useEffect, useState } from 'react';
import { Sun, Moon, LogOut, Sparkles } from 'lucide-react';

interface AgencyHeaderProps {
  onLogout: () => void;
}

// Caption Art Logo Component with consistent branding
function CaptionArtLogo() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 'var(--space-sm)',
      padding: 'var(--space-xs) var(--space-md)',
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(135deg, var(--color-brand-primary) 0%, #1d4ed8 100%)',
    }}>
      <Sparkles size={20} color="white" strokeWidth={2.5} />
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'white',
        letterSpacing: '-0.02em'
      }}>
        Caption Art
      </span>
    </div>
  );
}

export function AgencyHeader({ onLogout }: AgencyHeaderProps) {
  const location = useLocation();
  const themeManager = getThemeManager();
  const [mode, setMode] = useState(themeManager.getState().mode);

  useEffect(() => {
    const unsubscribe = themeManager.subscribeToChanges((state) => {
      setMode(state.mode);
    });
    return unsubscribe;
  }, []);

  const toggleTheme = () => {
    themeManager.toggleMode();
  };

  // Extract breadcrumb from current path
  const getBreadcrumb = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);

    if (pathParts[0] === 'agency') {
      // Parse: /agency/workspaces/:workspaceId/campaigns/:campaignId/section
      const relevantParts = pathParts.slice(1); // Remove 'agency'

      const workspaceIndex = relevantParts.indexOf('workspaces');
      const campaignIndex = relevantParts.indexOf('campaigns');

      const workspaceId =
        workspaceIndex >= 0 && relevantParts[workspaceIndex + 1]
          ? relevantParts[workspaceIndex + 1]
          : null;
      const campaignId =
        campaignIndex >= 0 && relevantParts[campaignIndex + 1]
          ? relevantParts[campaignIndex + 1]
          : null;
      const isReview = relevantParts[relevantParts.length - 1] === 'review';

      return {
        workspaceId,
        campaignId,
        isReview,
        isOnWorkspaceList:
          relevantParts.length === 1 && relevantParts[0] === 'workspaces',
        isOnCampaignList:
          workspaceId &&
          relevantParts.length === 3 &&
          relevantParts[2] === 'campaigns',
        isOnCampaignDetail:
          campaignId && relevantParts.length === 4 && !isReview,
      };
    }

    return {
      workspaceId: null,
      campaignId: null,
      isReview: false,
      isOnWorkspaceList: false,
      isOnCampaignList: false,
      isOnCampaignDetail: false,
    };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header style={{
      height: '64px',
      padding: '0 var(--space-2xl)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: 'var(--border-width-sm) solid var(--color-border)',
      backgroundColor: 'var(--color-bg-secondary)',
      transition: 'all var(--transition-timing-base) var(--transition-ease-smooth)',
    }}>
      {/* Left: Logo and Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
        <Link
          to='/agency/workspaces'
          style={{ textDecoration: 'none' }}
        >
          <CaptionArtLogo />
        </Link>

        {/* Clickable Breadcrumb Navigation */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-sm)', 
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          <Link
            to='/agency/workspaces'
            style={{ 
              color: 'var(--color-text-secondary)', 
              textDecoration: 'none',
              transition: 'color var(--transition-timing-base)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-brand-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            Workspaces
          </Link>

          {breadcrumb.workspaceId && (
            <>
              <span style={{ color: 'var(--color-text-secondary)' }}>/</span>
              <Link
                to={`/agency/workspaces/${breadcrumb.workspaceId}/campaigns`}
                style={{ 
                  color: breadcrumb.isOnCampaignList 
                    ? 'var(--color-text)' 
                    : 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  fontWeight: breadcrumb.isOnCampaignList 
                    ? 'var(--font-weight-semibold)' 
                    : 'var(--font-weight-medium)',
                  transition: 'color var(--transition-timing-base)'
                }}
                onMouseEnter={(e) => {
                  if (!breadcrumb.isOnCampaignList) {
                    e.currentTarget.style.color = 'var(--color-brand-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!breadcrumb.isOnCampaignList) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                Campaigns
              </Link>
            </>
          )}

          {breadcrumb.campaignId && (
            <>
              <span style={{ color: 'var(--color-text-secondary)' }}>/</span>
              <Link
                to={`/agency/workspaces/${breadcrumb.workspaceId}/campaigns/${breadcrumb.campaignId}`}
                style={{ 
                  color: breadcrumb.isOnCampaignDetail 
                    ? 'var(--color-text)' 
                    : 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  fontWeight: breadcrumb.isOnCampaignDetail 
                    ? 'var(--font-weight-semibold)' 
                    : 'var(--font-weight-medium)',
                  transition: 'color var(--transition-timing-base)'
                }}
                onMouseEnter={(e) => {
                  if (!breadcrumb.isOnCampaignDetail) {
                    e.currentTarget.style.color = 'var(--color-brand-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!breadcrumb.isOnCampaignDetail) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                Campaign Detail
              </Link>
            </>
          )}

          {breadcrumb.isReview && (
            <>
              <span style={{ color: 'var(--color-text-secondary)' }}>/</span>
              <span style={{ 
                color: 'var(--color-text)', 
                fontWeight: 'var(--font-weight-semibold)' 
              }}>
                Review
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <Link
          to='/playground'
          className='btn btn-ghost'
        >
          Playground
        </Link>

        <button
          onClick={toggleTheme}
          className='btn btn-ghost btn-sm'
          title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{
            width: '36px',
            height: '36px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          onClick={onLogout}
          className='btn btn-secondary btn-sm'
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
