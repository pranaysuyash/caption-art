
export interface Workspace {
  id: string
  agencyId: string
  clientName: string
  brandKitId: string
  createdAt: Date
}

const workspaces = new Map<string, Workspace>()

export class WorkspaceModel {
  static async createWorkspace(
    agencyId: string,
    clientName: string
  ): Promise<Workspace> {
    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const workspace: Workspace = {
      id: workspaceId,
      agencyId,
      clientName,
      brandKitId: '', // Will be set when brand kit is created
      createdAt: new Date(),
    }

    workspaces.set(workspaceId, workspace)
    return workspace
  }

  static getWorkspacesByAgency(agencyId: string): Workspace[] {
    return Array.from(workspaces.values()).filter(
      (w) => w.agencyId === agencyId
    )
  }

  static getWorkspaceById(id: string): Workspace | null {
    return workspaces.get(id) || null
  }

  static updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>
  ): void {
    const workspace = workspaces.get(workspaceId)
    if (workspace) {
      Object.assign(workspace, updates)
    }
  }

  static getAllWorkspaces(): Workspace[] {
    return Array.from(workspaces.values())
  }
}
