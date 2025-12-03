import { WorkspaceModel } from './Workspace'

export interface Asset {
  id: string
  workspaceId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: Date
}

const assets = new Map<string, Asset>()

export class AssetModel {
  static async createAsset(
    assetData: Omit<Asset, 'id' | 'uploadedAt'>
  ): Promise<Asset> {
    const { workspaceId } = assetData

    // Verify workspace exists
    const workspace = WorkspaceModel.getWorkspaceById(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Check workspace asset limit (20 files max for v1)
    const existingAssets = Array.from(assets.values()).filter(
      (a) => a.workspaceId === workspaceId
    )
    if (existingAssets.length >= 20) {
      throw new Error('Maximum 20 assets allowed per workspace')
    }

    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const asset: Asset = {
      id: assetId,
      workspaceId,
      filename: assetData.filename,
      originalName: assetData.originalName,
      mimeType: assetData.mimeType,
      size: assetData.size,
      url: assetData.url,
      uploadedAt: new Date(),
    }

    assets.set(assetId, asset)
    return asset
  }

  static getAssetById(id: string): Asset | null {
    return assets.get(id) || null
  }

  static getAssetsByWorkspace(workspaceId: string): Asset[] {
    return Array.from(assets.values()).filter(
      (a) => a.workspaceId === workspaceId
    )
  }

  static deleteAsset(id: string): boolean {
    const asset = assets.get(id)
    if (!asset) {
      return false
    }

    assets.delete(id)
    return true
  }

  static deleteAssetsByWorkspace(workspaceId: string): number {
    const workspaceAssets = Array.from(assets.values()).filter(
      (a) => a.workspaceId === workspaceId
    )
    let deletedCount = 0

    for (const asset of workspaceAssets) {
      if (assets.delete(asset.id)) {
        deletedCount++
      }
    }

    return deletedCount
  }

  static getAllAssets(): Asset[] {
    return Array.from(assets.values())
  }
}
