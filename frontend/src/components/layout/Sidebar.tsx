import React from 'react'
import './Sidebar.css'

export interface SidebarSection {
  id: string
  title: string
  content: React.ReactNode
  visible?: boolean
  loading?: boolean
  error?: string
}

export interface SidebarProps {
  sections: SidebarSection[]
  className?: string
}

/**
 * Scrollable container for control sections with progressive disclosure
 * Renders only visible sections and handles loading states
 */
export function Sidebar({ sections, className = '' }: SidebarProps) {
  const visibleSections = sections.filter((section) => section.visible !== false)

  return (
    <aside
      className={`sidebar ${className}`}
      role="complementary"
      aria-label="Control Panel"
    >
      {visibleSections.map((section) => (
        <section key={section.id} className="sidebar__section">
          <h2 className="sidebar__section-title">{section.title}</h2>
          
          {section.loading && (
            <div className="sidebar__loading" aria-live="polite" aria-busy="true">
              Loading...
            </div>
          )}
          
          {section.error && (
            <div className="sidebar__error" role="alert">
              {section.error}
            </div>
          )}
          
          <div className="sidebar__section-content">
            {section.content}
          </div>
        </section>
      ))}
    </aside>
  )
}
