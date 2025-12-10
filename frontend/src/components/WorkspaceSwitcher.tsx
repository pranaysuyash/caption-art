/**
 * WorkspaceSwitcher - Top nav dropdown for workspace selection
 */

import { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import './WorkspaceSwitcher.css';

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeWorkspace) {
    return <div className='workspace-switcher-loading'>Loading...</div>;
  }

  return (
    <div className='workspace-switcher'>
      <button
        className='workspace-switcher-button'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className='workspace-icon'>🏢</span>
        <span className='workspace-name'>{activeWorkspace.clientName}</span>
        <span className='dropdown-arrow'>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className='workspace-dropdown-overlay'
            onClick={() => setIsOpen(false)}
          />
          <div className='workspace-dropdown'>
            <div className='dropdown-header'>Switch Workspace</div>
            <div className='workspace-list'>
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className={`workspace-item ${
                    workspace.id === activeWorkspace.id ? 'active' : ''
                  }`}
                  onClick={() => {
                    setActiveWorkspace(workspace);
                    setIsOpen(false);
                  }}
                >
                  <span className='workspace-item-icon'>🏢</span>
                  <div className='workspace-item-info'>
                    <div className='workspace-item-name'>
                      {workspace.clientName}
                    </div>
                    <div className='workspace-item-meta'>
                      {workspace.campaigns?.length || 0} campaigns
                    </div>
                  </div>
                  {workspace.id === activeWorkspace.id && (
                    <span className='check-icon'>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
