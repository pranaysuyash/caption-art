import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import '../styles/components.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

export function Breadcrumbs() {
  const location = useLocation();
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (pathParts[0] === 'agency') {
      breadcrumbs.push({ label: 'Home', path: '/agency/workspaces' });
      
      const relevantParts = pathParts.slice(1);
      const workspaceIndex = relevantParts.indexOf('workspaces');
      const campaignIndex = relevantParts.indexOf('campaigns');
      
      if (workspaceIndex >= 0) {
        const workspaceId = relevantParts[workspaceIndex + 1];
        
        if (workspaceId) {
          breadcrumbs.push({
            label: 'Workspaces',
            path: '/agency/workspaces'
          });
          
          if (campaignIndex >= 0) {
            const campaignId = relevantParts[campaignIndex + 1];
            breadcrumbs.push({
              label: 'Campaigns',
              path: `/agency/workspaces/${workspaceId}/campaigns`
            });
            
            if (campaignId) {
              breadcrumbs.push({
                label: 'Campaign Details',
                path: `/agency/workspaces/${workspaceId}/campaigns/${campaignId}`
              });
              
              // Check for review page
              if (relevantParts[relevantParts.length - 1] === 'review') {
                breadcrumbs.push({
                  label: 'Review',
                  active: true
                });
              }
            } else {
              breadcrumbs[breadcrumbs.length - 1].active = true;
            }
          } else {
            breadcrumbs[breadcrumbs.length - 1].active = true;
          }
        } else {
          breadcrumbs[breadcrumbs.length - 1].active = true;
        }
      }
    } else if (pathParts[0] === 'playground') {
      breadcrumbs.push({ label: 'Home', path: '/agency/workspaces' });
      breadcrumbs.push({ label: 'Playground', active: true });
    } else {
      breadcrumbs.push({ label: 'Home', active: true });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        flexWrap: 'wrap'
      }}
    >
      {breadcrumbs.map((crumb, index) => (
        <div 
          key={index} 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}
        >
          {index > 0 && (
            <ChevronRight 
              size={14} 
              style={{ 
                color: 'var(--color-text-secondary)',
                flexShrink: 0
              }} 
            />
          )}
          
          {crumb.active ? (
            <span style={{
              color: 'var(--color-text)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              {index === 0 && <Home size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path!}
              style={{
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-timing-base)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-brand-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            >
              {index === 0 && <Home size={14} />}
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
