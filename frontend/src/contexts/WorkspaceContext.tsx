/**
 * WorkspaceContext - Global context for active workspace
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { workspaceClient, Workspace } from '../lib/api/workspaceClient';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = async () => {
    try {
      setLoading(true);
      const ws = await workspaceClient.getWorkspaces();
      setWorkspaces(ws);

      // Set active workspace if not set
      if (!activeWorkspace && ws.length > 0) {
        const savedId = localStorage.getItem('activeWorkspaceId');
        const active = savedId ? ws.find((w) => w.id === savedId) : ws[0];
        setActiveWorkspace(active || ws[0]);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  const handleSetActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('activeWorkspaceId', workspace.id);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        setActiveWorkspace: handleSetActiveWorkspace,
        refreshWorkspaces,
        loading,
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
