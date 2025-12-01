// API Request/Response Type Definitions

// Caption endpoint types
export interface CaptionRequest {
  imageUrl: string
  keywords?: string[]
}

export interface CaptionResponse {
  baseCaption: string
  variants: string[]
}

// Mask endpoint types
export interface MaskRequest {
  imageUrl: string
}

export interface MaskResponse {
  maskUrl: string
}

// Verify endpoint types
export interface VerifyRequest {
  licenseKey: string
}

export interface VerifyResponse {
  valid: boolean
  email?: string
}

// Health endpoint types
export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
}

// Error response type
export interface ErrorResponse {
  error: string
  details?: string
}
