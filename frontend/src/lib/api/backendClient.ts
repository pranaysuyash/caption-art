/**
 * Backend API Client
 * Calls the platform-agnostic backend instead of external APIs directly
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

export interface CaptionResponse {
  baseCaption: string
  variants: string[]
}

export interface MaskResponse {
  maskUrl: string
}

export interface VerifyResponse {
  valid: boolean
  email?: string
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
}

export interface MaskingModel {
  id: string
  name: string
  description: string
  quality: 'basic' | 'good' | 'excellent' | 'premium'
  speed: 'slow' | 'medium' | 'fast'
  cost: 'free' | 'low' | 'medium' | 'high'
  bestFor: string[]
}

export interface MaskingModelsResponse {
  models: Record<string, MaskingModel>
  defaultModel: string
}

export class BackendClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  /**
   * Generate caption for an image
   */
  async generateCaption(imageUrl: string): Promise<CaptionResponse> {
    const response = await fetch(`${this.baseUrl}/api/caption`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Caption generation failed')
    }

    return response.json()
  }

  /**
   * Generate mask for an image
   */
  async generateMask(imageUrl: string, model?: string): Promise<MaskResponse> {
    const response = await fetch(`${this.baseUrl}/api/mask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, model }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Mask generation failed')
    }

    return response.json()
  }

  /**
   * Get available masking models
   */
  async getMaskingModels(): Promise<MaskingModelsResponse> {
    const response = await fetch(`${this.baseUrl}/api/brand-kits/masking-models`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch masking models')
    }

    return response.json()
  }

  /**
   * Verify license key
   */
  async verifyLicense(licenseKey: string): Promise<VerifyResponse> {
    const response = await fetch(`${this.baseUrl}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'License verification failed')
    }

    return response.json()
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/health`)

    if (!response.ok) {
      throw new Error('Health check failed')
    }

    return response.json()
  }

  /**
   * Convert data URL to blob and upload to a temporary storage
   * (For now, we'll need to handle data URLs differently)
   */
  dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }
}

export const backendClient = new BackendClient()
