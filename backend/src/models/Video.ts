export interface VideoTransitions {
  type: 'fade' | 'slide' | 'dissolve' | 'cut' | 'zoom'
  duration: number
  direction?: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down'
}

export interface VideoScene {
  sceneNumber: number
  type: 'hook' | 'problem' | 'benefit' | 'demo' | 'cta'
  duration: number
  script: string
  visualNotes: string
  description: string
  visualDescription?: string
  imageUrl?: string
  thumbnailUrl?: string
  shotType?: string
  composition?: string
  lighting?: string
  colorPalette?: string[]
  elements?: string[]
  tone?: string
  voiceover?: string
  transition?: VideoTransitions
}

export interface VideoScript {
  id?: string
  scenes: VideoScene[]
  totalDuration: number
  estimatedDuration?: number
  cta: string
  platform: string
  campaignId?: string
  workspaceId?: string
  createdAt?: Date
}

export interface VideoStoryboard {
  videoScriptId: string
  scenes: VideoScene[]
  totalDuration: number
  aspectRatio?: string
  style?: {
    visualStyle: string
    colorScheme: string
    pacing: string
    transitionStyle: string
  }
  notes?: string
}

// Video Render Types
export type VideoRenderFormat = 'square' | 'landscape' | 'portrait' | 'stories'
export type VideoRenderQuality = 'low' | 'medium' | 'high'

export interface VideoRenderSpec {
  format: VideoRenderFormat
  quality: VideoRenderQuality
}

export interface VideoAudioSpec {
  includeAudio: boolean
  backgroundMusic?: string
  voiceover?: string
  volume?: number
}

export interface VideoRenderRequest {
  id?: string
  workspaceId: string
  spec: VideoRenderSpec
  duration: number
  platform?: string
  tone?: string
  customStyle?: any
  includeAudio?: boolean
  customInstructions?: string
}

export interface VideoRenderResult {
  success: boolean
  videoUrl?: string
  metadata?: any
  assets?: any
  quality?: any
  recommendations?: string[]
  error?: string
}
