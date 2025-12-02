import { useLocation, Link } from 'react-router-dom'

interface AgencyHeaderProps {
  onLogout: () => void
}

export function AgencyHeader({ onLogout }: AgencyHeaderProps) {
  const location = useLocation()

  // Extract breadcrumb from current path
  const getBreadcrumb = () => {
    const pathParts = location.pathname.split('/').filter(Boolean)

    if (pathParts[0] === 'agency') {
      // Remove 'agency' from path parts
      const relevantParts = pathParts.slice(1)

      return {
        workspace: relevantParts[0] === 'workspaces' ? null :
                  (relevantParts.length > 1 ? relevantParts[1] : null),
        campaign: relevantParts.includes('campaigns') ?
                 (relevantParts.length > 3 ? relevantParts[3] : null) : null,
        section: relevantParts[relevantParts.length - 1]
      }
    }

    return { workspace: null, campaign: null, section: null }
  }

  const breadcrumb = getBreadcrumb()

  return (
    <header style={{
      backgroundColor: 'var(--color-surface, white)',
      borderBottom: '1px solid var(--color-border, #e5e7eb)',
      padding: '0 2rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left: Logo and Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/agency/workspaces" style={{
          textDecoration: 'none',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          fontFamily: 'var(--font-heading, sans-serif)',
          color: 'var(--color-primary, #2563eb)'
        }}>
          Caption Art
        </Link>

        {/* Context Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary, #6b7280)',
          fontFamily: 'var(--font-body, sans-serif)'
        }}>
          <span>Agency</span>
          {breadcrumb.workspace && (
            <>
              <span>/</span>
              <span>Workspace</span>
            </>
          )}
          {breadcrumb.campaign && (
            <>
              <span>/</span>
              <span>Campaign</span>
            </>
          )}
          {breadcrumb.section && breadcrumb.section !== 'workspaces' && (
            <>
              <span>/</span>
              <span style={{
                textTransform: 'capitalize',
                color: 'var(--color-text, #1f2937)',
                fontWeight: '500'
              }}>
                {breadcrumb.section.replace('-', ' ')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          to="/playground"
          style={{
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            color: 'var(--color-text-secondary, #6b7280)',
            fontSize: '0.875rem',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-background, #f8fafc)'
            e.currentTarget.style.color = 'var(--color-text, #1f2937)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-secondary, #6b7280)'
          }}
        >
          Playground
        </Link>

        <button
          onClick={onLogout}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid var(--color-border, #d1d5db)',
            backgroundColor: 'transparent',
            color: 'var(--color-text, #1f2937)',
            fontSize: '0.875rem',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-error-bg, #fef2f2)'
            e.currentTarget.style.borderColor = 'var(--color-error, #dc2626)'
            e.currentTarget.style.color = 'var(--color-error, #dc2626)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = 'var(--color-border, #d1d5db)'
            e.currentTarget.style.color = 'var(--color-text, #1f2937)'
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}