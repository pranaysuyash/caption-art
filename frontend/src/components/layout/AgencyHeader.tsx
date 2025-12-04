import { Link } from 'react-router-dom';
import { getThemeManager } from '../../lib/themes/themeManager';
import { useEffect, useState } from 'react';
import { Sun, Moon, LogOut, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '../Breadcrumbs';

interface AgencyHeaderProps {
  onLogout: () => void;
}

// Caption Art Logo Component with consistent branding
function CaptionArtLogo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-xs) var(--space-md)',
        borderRadius: 'var(--radius-md)',
        background:
          'linear-gradient(135deg, var(--color-brand-primary) 0%, #1d4ed8 100%)',
      }}
    >
      <Sparkles size={20} color='white' strokeWidth={2.5} />
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'white',
          letterSpacing: '-0.02em',
        }}
      >
        Caption Art
      </span>
    </div>
  );
}

export function AgencyHeader({ onLogout }: AgencyHeaderProps) {
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

  return (
    <header
      style={{
        height: '64px',
        padding: '0 var(--space-2xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 'var(--border-width-sm) solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        transition:
          'all var(--transition-timing-base) var(--transition-ease-smooth)',
      }}
    >
      {/* Left: Logo and Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xl)',
          flex: 1,
          minWidth: 0
        }}
      >
        <Link to='/agency/workspaces' style={{ textDecoration: 'none', flexShrink: 0 }}>
          <CaptionArtLogo />
        </Link>

        {/* Breadcrumb Navigation */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
        <Link
          to='/playground'
          className='btn btn-ghost hide-mobile'
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
            justifyContent: 'center',
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
            gap: 'var(--space-sm)',
          }}
        >
          <LogOut size={16} />
          <span className="hide-mobile">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
