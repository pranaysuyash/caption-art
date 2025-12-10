import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiFetch from '../lib/api/httpClient';

interface Workspace {
  id: string;
  clientName: string;
  description?: string;
  industry?: string;
  campaigns?: { id: string; name: string }[];
}

interface WorkspaceContextType {
  // Current/active workspace
  currentWorkspace: Workspace | null;
  activeWorkspace: Workspace | null;  // Alias for backward compatibility
  
  // Array of all workspaces
  workspaces: Workspace[];
  
  // Actions
  setCurrentWorkspaceId: (id: string) => void;
  setActiveWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  
  // State
  loading: boolean;
  error: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  // Fetch all workspaces
  const refreshWorkspaces = useCallback(async () => {
    try {
      const res = await apiFetch(`${apiBase}/api/workspaces`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        
        // Auto-select first workspace if none is selected
        if (!currentWorkspace && data.workspaces?.length > 0) {
          setCurrentWorkspace(data.workspaces[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, [apiBase, currentWorkspace]);

  // Load workspaces on mount
  useEffect(() => {
    refreshWorkspaces();
  }, []);

  const setCurrentWorkspaceId = async (id: string) => {
    if (!id || currentWorkspace?.id === id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await apiFetch(`${apiBase}/api/workspaces/${id}`);
      
      if (res.ok) {
        const data = await res.json();
        setCurrentWorkspace(data.workspace);
      } else {
        setError('Failed to load workspace');
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const setActiveWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
  };

  return (
    <WorkspaceContext.Provider 
      value={{ 
        currentWorkspace, 
        activeWorkspace: currentWorkspace, 
        workspaces,
        setCurrentWorkspaceId, 
        setActiveWorkspace,
        refreshWorkspaces,
        loading, 
        error 
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
