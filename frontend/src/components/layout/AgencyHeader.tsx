import { useLocation, Link } from 'react-router-dom';
import { getThemeManager } from '../../lib/themes/themeManager';
import { useEffect, useState } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';

interface AgencyHeaderProps {
  onLogout: () => void;
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
    <header className='h-16 px-8 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-colors duration-200'>
      {/* Left: Logo and Breadcrumb */}
      <div className='flex items-center gap-4'>
        <Link
          to='/agency/workspaces'
          className='text-2xl font-bold font-[var(--font-heading)] text-[var(--color-primary)] no-underline'
        >
          Caption Art
        </Link>

        {/* Clickable Breadcrumb Navigation */}
        <div className='flex items-center gap-2 text-sm font-[var(--font-body)]'>
          <Link
            to='/agency/workspaces'
            className='text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] no-underline transition-colors'
          >
            Workspaces
          </Link>

          {breadcrumb.workspaceId && (
            <>
              <span className='text-[var(--color-text-secondary)]'>/</span>
              <Link
                to={`/agency/workspaces/${breadcrumb.workspaceId}/campaigns`}
                className={`no-underline transition-colors ${
                  breadcrumb.isOnCampaignList
                    ? 'text-[var(--color-text)] font-medium'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
                }`}
              >
                Campaigns
              </Link>
            </>
          )}

          {breadcrumb.campaignId && (
            <>
              <span className='text-[var(--color-text-secondary)]'>/</span>
              <Link
                to={`/agency/workspaces/${breadcrumb.workspaceId}/campaigns/${breadcrumb.campaignId}`}
                className={`no-underline transition-colors ${
                  breadcrumb.isOnCampaignDetail
                    ? 'text-[var(--color-text)] font-medium'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
                }`}
              >
                Campaign Detail
              </Link>
            </>
          )}

          {breadcrumb.isReview && (
            <>
              <span className='text-[var(--color-text-secondary)]'>/</span>
              <span className='text-[var(--color-text)] font-medium'>
                Review
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: User Actions */}
      <div className='flex items-center gap-4'>
        <Link
          to='/playground'
          className='px-4 py-2 text-sm rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)] transition-all duration-200'
        >
          Playground
        </Link>

        <button
          onClick={toggleTheme}
          className='p-2 rounded-md border border-[var(--color-border)] text-[var(--color-text)] hover:bg-transparent transition-all duration-200 flex items-center justify-center w-9 h-9'
          title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button
          onClick={onLogout}
          className='flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text)] hover:bg-red-50 hover:border-red-600 hover:text-red-600 transition-all duration-200'
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
