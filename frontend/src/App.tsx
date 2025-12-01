import { useRef, useState, useEffect, useCallback } from 'react'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { CaptionGenerator } from './components/CaptionGeneratorSimple'
import { MaskGenerator as MaskGeneratorComponent } from './components/MaskGenerator'
import { RegenerateMaskButton } from './components/RegenerateMaskButton'
import { MaskPreview } from './components/MaskPreview'
import { OutputPreview } from './components/OutputPreview'
import { TransformControls } from './components/TransformControls'
import { StylePresetSelector } from './components/StylePresetSelector'
import { TemplateSelector } from './components/TemplateSelector'
import { TemplateManager } from './lib/templates/templateManager'
import { SocialPreviewOverlay } from './components/SocialPreviewOverlay'
import { SocialPlatform } from './lib/social/types'
import { Toolbar } from './components/Toolbar'
import { ToastContainer, useToast } from './components/Toast'
import { ExportMenu } from './components/ExportMenu'
import { ExportButton } from './components/ExportButton'
import { ExportProgress } from './components/ExportProgress'
import { VideoPreviewModal } from './components/VideoPreviewModal'
import { StoryMode } from './components/StoryMode'
import { StoryFrame } from './lib/story/storyManager'
import { useVideoRecorder } from './hooks/useVideoRecorder'
import { FormatSelector } from './components/FormatSelector'
import { ThemeToggle } from './components/ThemeToggle'
import { UploadZone } from './components/UploadZone'
import { UploadProgress } from './components/UploadProgress'
import { FilePreview } from './components/FilePreview'
import { AppLayout } from './components/layout/AppLayout'
import { Sidebar, type SidebarSection } from './components/layout/Sidebar'
import { CanvasArea } from './components/layout/CanvasArea'
import { useLayoutState } from './hooks/useLayoutState'
import { MaskResult } from './lib/segmentation/types'
import { Compositor } from './lib/canvas/compositor'
import { Exporter as CanvasExporter } from './lib/canvas/exporter'
import { Exporter } from './lib/export/exporter'
import type { ExportProgress as ExportProgressType } from './lib/export/types'
import { HistoryManager } from './lib/history/historyManager'
import { AutoSaveManager } from './lib/history/autoSave'
import { registerKeyboardShortcuts } from './lib/history/keyboardHandler'
import { debounce } from './lib/canvas/performanceUtils'
import type { CanvasState } from './lib/history/types'
import type { StylePreset, Transform, TextLayer } from './lib/canvas/types'
import { BatchUploader } from './lib/upload/batchUploader'
import type { BatchFileResult } from './lib/upload/batchUploader'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const compositorRef = useRef<Compositor | null>(null)
  const exporterRef = useRef<Exporter | null>(null)
  const [imageObjUrl, setImageObjUrl] = useState<string>('')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  
  // Loading and error states for different operations - Requirements: 10.1, 10.2, 10.3, 10.5
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | undefined>(undefined)
  const [maskLoading, setMaskLoading] = useState<boolean>(false)
  const [maskError, setMaskError] = useState<string | undefined>(undefined)
  const [captionLoading, setCaptionLoading] = useState<boolean>(false)
  const [captionError, setCaptionError] = useState<string | undefined>(undefined)
  
  // Upload preprocessing state - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadStatus, setUploadStatus] = useState<'validating' | 'processing' | 'optimizing' | 'complete' | 'error'>('validating')
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [uploadResult, setUploadResult] = useState<BatchFileResult | null>(null)
  
  // Layout state management
  const { state: layoutState, toggleSidebar } = useLayoutState()
  
  // Toast notifications
  const toast = useToast()
  
  // Mask state - Requirements: 1.4, 1.5, 4.4, 8.1, 8.2
  const [maskResult, setMaskResult] = useState<MaskResult | null>(null)
  const [maskPreviewEnabled, setMaskPreviewEnabled] = useState<boolean>(false)
  const [textBehindEnabled, setTextBehindEnabled] = useState<boolean>(true)
  
  // Text layer state - Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
  const [text, setText] = useState<string>('')
  const [inputText, setInputText] = useState<string>('') // Immediate input value
  const [preset, setPreset] = useState<StylePreset>('neon')
  const [fontSize, setFontSize] = useState<number>(96)
  
  // Transform state - Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
  const [transform, setTransform] = useState<Transform>({
    x: 0.1,
    y: 0.8,
    scale: 1,
    rotation: 0,
  })
  
  const [licenseOk] = useState<boolean>(true) // Always true for local testing
  
  const [socialPreviewPlatform, setSocialPreviewPlatform] = useState<SocialPlatform | null>(null)

  const [regenerating, setRegenerating] = useState<boolean>(false)
  
  // Export format state - Requirements: 2.1, 2.2, 2.5
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png')
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportProgress, setExportProgress] = useState<ExportProgressType | null>(null)
  
  // History management state - Requirements: 2.1, 2.2, 2.3, 3.6
  const historyManagerRef = useRef<HistoryManager | null>(null)
  const autoSaveManagerRef = useRef<AutoSaveManager | null>(null)
  const [canUndo, setCanUndo] = useState<boolean>(false)
  const [canRedo, setCanRedo] = useState<boolean>(false)
  const [captions, setCaptions] = useState<string[]>([])

  // Video recording state
  const { isRecording, recordingTime, startRecording, stopRecording } = useVideoRecorder(canvasRef)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [showVideoPreview, setShowVideoPreview] = useState(false)

  // Story Mode state
  const [isStoryMode, setIsStoryMode] = useState(false)

  // Debounced text update handler - Requirements: 8.1, 8.2, 8.3, 8.4
  const debouncedSetText = useCallback(
    debounce((value: string) => {
      setText(value);
    }, 150), // 150ms debounce for text input
    []
  );

  // Register keyboard shortcuts for undo/redo - Requirements: 7.1, 7.2, 7.3, 7.4
  useEffect(() => {
    const cleanup = registerKeyboardShortcuts({
      onUndo: () => {
        if (canUndo) {
          handleUndo()
        }
      },
      onRedo: () => {
        if (canRedo) {
          handleRedo()
        }
      },
      preventDefault: true
    })
    
    return cleanup
  }, [canUndo, canRedo])

  // Other keyboard shortcuts for power users
  useKeyboardShortcuts({
    'Ctrl+S': (e) => {
      e?.preventDefault()
      if (canvasRef.current) {
        exportImg()
      }
    },
    'Ctrl+C': () => {
      if (text && document.activeElement?.tagName !== 'INPUT') {
        navigator.clipboard.writeText(text)
        toast.success('Text copied to clipboard!')
      }
    },
    'ESCAPE': () => {
      setMaskPreviewEnabled(false)
    },
    'DELETE': () => {
      if (currentFile && document.activeElement?.tagName !== 'INPUT') {
        setCurrentFile(null)
        setImageObjUrl('')
        setImageDataUrl(null)
        setOriginalImage(null)
        setText('')
        setInputText('')
        toast.info('Image removed')
      }
    },
    ' ': (e) => {
      if (document.activeElement?.tagName !== 'INPUT') {
        e?.preventDefault()
        setMaskPreviewEnabled(!maskPreviewEnabled)
      }
    }
  });

  const onFile = async (f: File) => {
    try {
      // Clear previous errors and state
      setUploadError(undefined)
      setCaptionError(undefined)
      setMaskError(undefined)
      setUploadResult(null)
      
      // Revoke previous object URL to free memory
      if (imageObjUrl) {
        URL.revokeObjectURL(imageObjUrl);
      }
      
      setCurrentFile(f)
      setLoading(true)
      setUploadLoading(true)
      setUploadVisible(true)
      
      // Start caption and mask loading states immediately
      setCaptionLoading(true)
      setMaskLoading(true)

      // Process file with BatchUploader - Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3
      const result = await BatchUploader.processFiles([f], (fileIndex, totalFiles, status) => {
        // Update progress based on status - Requirements: 6.1, 6.2, 6.3, 6.4
        if (status === 'validating') {
          setUploadStatus('validating')
          setUploadProgress(10)
        } else if (status === 'processing') {
          setUploadStatus('processing')
          setUploadProgress(40)
        } else if (status === 'optimizing') {
          setUploadStatus('optimizing')
          setUploadProgress(70)
        } else if (status === 'complete') {
          setUploadStatus('complete')
          setUploadProgress(100)
        }
      })

      const fileResult = result.results[0]
      setUploadResult(fileResult)

      // Check if processing was successful
      if (!fileResult.success) {
        throw new Error(fileResult.error || 'Failed to process image')
      }

      // Create object URL from processed blob - Requirements: 4.5
      const processedBlob = fileResult.processedBlob!
      const obj = URL.createObjectURL(processedBlob)
      setImageObjUrl(obj)

      // Convert processed blob to base64 data URL (needed for API calls)
      const reader = new FileReader()
      reader.readAsDataURL(processedBlob)
      
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
      })
      
      setImageDataUrl(dataUrl)

      // Load processed image for preview
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = obj
      })
      
      setOriginalImage(img)
      setUploadLoading(false)
      setUploadVisible(false)
      toast.success('Image uploaded and optimized successfully!')
      
      // PARALLEL PROCESSING: Start caption and mask generation simultaneously
      const [captionResult, maskResult] = await Promise.allSettled([
        // Caption generation
        (async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/caption`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: dataUrl })
            })
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || 'Caption generation failed')
            }
            
            return await response.json()
          } catch (error) {
            throw error
          }
        })(),
        
        // Mask generation
        (async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/mask`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: dataUrl })
            })
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || 'Mask generation failed')
            }
            
            const data = await response.json()
            
            // Load mask image
            const maskImage = new Image()
            maskImage.crossOrigin = 'anonymous'
            await new Promise((resolve, reject) => {
              maskImage.onload = resolve
              maskImage.onerror = reject
              maskImage.src = data.maskUrl
            })
            
            return { maskUrl: data.maskUrl, maskImage }
          } catch (error) {
            throw error
          }
        })()
      ])
      
      // Handle caption result
      if (captionResult.status === 'fulfilled') {
        setCaptions([captionResult.value.baseCaption, ...captionResult.value.variants])
        setCaptionLoading(false)
      } else {
        const errorMsg = captionResult.reason instanceof Error 
          ? captionResult.reason.message 
          : 'Caption generation failed'
        setCaptionError(errorMsg)
        setCaptionLoading(false)
        toast.error(errorMsg)
      }
      
      // Handle mask result
      if (maskResult.status === 'fulfilled') {
        setMaskResult({
          maskUrl: maskResult.value.maskUrl,
          maskImage: maskResult.value.maskImage,
          generationTime: 0,
          quality: 'high'
        })
        setMaskLoading(false)
      } else {
        const errorMsg = maskResult.reason instanceof Error 
          ? maskResult.reason.message 
          : 'Mask generation failed'
        setMaskError(errorMsg)
        setMaskLoading(false)
        // Don't show error toast for mask - it's optional
      }
      
      setLoading(false)
      
    } catch (error) {
      console.error('File upload error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to process image. Please try again.'
      setUploadError(errorMsg)
      setUploadStatus('error')
      toast.error(errorMsg)
      setLoading(false)
      setUploadLoading(false)
      setCaptionLoading(false)
      setMaskLoading(false)
      // Keep upload visible to show error
    }
  }
  
  // Handle mask generation result - Requirements: 1.1, 1.2, 1.3
  const handleMaskGenerated = (result: MaskResult | null) => {
    setMaskResult(result)
    setMaskLoading(false) // Requirements: 10.2
    if (result) {
      setMaskError(undefined) // Clear error on success - Requirements: 10.5
    }
  }
  
  // Handle mask generation start - Requirements: 10.2
  const handleMaskGenerationStart = () => {
    setMaskLoading(true)
    setMaskError(undefined)
  }
  
  // Handle mask generation error - Requirements: 10.5
  const handleMaskGenerationError = (error: string) => {
    setMaskError(error)
    setMaskLoading(false)
  }
  
  // Handle mask regeneration - Requirements: 6.1, 6.2, 6.4
  const handleRegenerateMask = async () => {
    if (!imageDataUrl || regenerating) return
    
    setRegenerating(true)
    setMaskLoading(true) // Requirements: 10.2
    setMaskError(undefined) // Clear previous errors - Requirements: 10.5
    const loadingId = toast.loading('Regenerating mask...')
    try {
      // Call backend to regenerate mask
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/mask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageDataUrl })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Mask regeneration failed')
      }
      
      const data = await response.json()
      const maskImage = new Image()
      maskImage.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        maskImage.onload = resolve
        maskImage.onerror = reject
        maskImage.src = data.maskUrl
      })
      
      setMaskResult({
        maskUrl: data.maskUrl,
        maskImage,
        generationTime: 0,
        quality: 'high'
      })
      setMaskLoading(false) // Requirements: 10.2
      toast.dismiss(loadingId)
      toast.success('Mask regenerated!')
    } catch (error) {
      console.error('Mask regeneration error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to regenerate mask. Please try again.'
      setMaskError(errorMsg) // Requirements: 10.5
      setMaskLoading(false)
      toast.dismiss(loadingId)
      toast.error(errorMsg, {
        label: 'Retry',
        onClick: handleRegenerateMask
      })
    } finally {
      setRegenerating(false)
    }
  }



  // Initialize exporter - Requirements: All
  useEffect(() => {
    if (!exporterRef.current) {
      exporterRef.current = new Exporter()
    }
  }, [])

  // Initialize history manager - Requirements: 8.1, 8.2
  useEffect(() => {
    if (!historyManagerRef.current) {
      // Create history manager with persistence enabled
      historyManagerRef.current = new HistoryManager(50, true)
      
      // Create auto-save manager
      autoSaveManagerRef.current = new AutoSaveManager(historyManagerRef.current, {
        textDebounceMs: 500,
        transformDebounceMs: 500,
        enabled: true
      })
      
      // Update undo/redo button states
      setCanUndo(historyManagerRef.current.canUndo())
      setCanRedo(historyManagerRef.current.canRedo())
      
      // Load persisted state if available
      const currentState = historyManagerRef.current.getCurrentState()
      if (currentState) {
        // Restore the persisted state
        restoreState(currentState)
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.destroy()
      }
    }
  }, [])

  // Sync inputText with text when text is set programmatically
  useEffect(() => {
    setInputText(text);
  }, [text]);

  // Cleanup object URLs on unmount - Requirements: 8.5
  useEffect(() => {
    return () => {
      if (imageObjUrl) {
        URL.revokeObjectURL(imageObjUrl);
      }
    };
  }, [imageObjUrl]);

  // Get current canvas state
  const getCurrentCanvasState = useCallback((): CanvasState => {
    return {
      imageObjUrl: imageObjUrl || '',
      maskUrl: maskResult?.maskUrl || '',
      text,
      preset,
      fontSize,
      captions,
      transform
    }
  }, [imageObjUrl, maskResult, text, preset, fontSize, captions, transform])

  // Save state to history - Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.6
  const saveState = useCallback((action: string) => {
    if (!historyManagerRef.current) return
    
    const state = getCurrentCanvasState()
    historyManagerRef.current.saveState(action, state)
    setCanUndo(historyManagerRef.current.canUndo())
    setCanRedo(historyManagerRef.current.canRedo())
  }, [getCurrentCanvasState])

  // Restore state from history - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
  const restoreState = useCallback((state: CanvasState) => {
    setImageObjUrl(state.imageObjUrl)
    setText(state.text)
    setInputText(state.text)
    setPreset(state.preset)
    setFontSize(state.fontSize)
    setCaptions(state.captions)
    if (state.transform) {
      setTransform(state.transform)
    }
    
    // Restore mask if URL changed - Requirements: 6.2
    if (state.maskUrl && state.maskUrl !== maskResult?.maskUrl) {
      // Load mask image from URL
      const maskImage = new Image()
      maskImage.crossOrigin = 'anonymous'
      maskImage.onload = () => {
        setMaskResult({
          maskUrl: state.maskUrl,
          maskImage,
          generationTime: 0,
          quality: 'high'
        })
      }
      maskImage.onerror = () => {
        console.error('Failed to load mask from history')
      }
      maskImage.src = state.maskUrl
    } else if (!state.maskUrl && maskResult) {
      // Clear mask if state has no mask
      setMaskResult(null)
    }
  }, [maskResult])

  // Undo handler - Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
  const handleUndo = useCallback(() => {
    if (!historyManagerRef.current) return
    
    const state = historyManagerRef.current.undo()
    if (state) {
      restoreState(state)
      toast.info('Undone')
    }
    setCanUndo(historyManagerRef.current.canUndo())
    setCanRedo(historyManagerRef.current.canRedo())
  }, [restoreState, toast])

  // Redo handler - Requirements: 2.1, 2.2, 2.3, 2.4
  const handleRedo = useCallback(() => {
    if (!historyManagerRef.current) return
    
    const state = historyManagerRef.current.redo()
    if (state) {
      restoreState(state)
      toast.info('Redone')
    }
    setCanUndo(historyManagerRef.current.canUndo())
    setCanRedo(historyManagerRef.current.canRedo())
  }, [restoreState, toast])

  // Clear history handler - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
  const handleClearHistory = useCallback(() => {
    if (!historyManagerRef.current) return
    
    // Clear both undo and redo stacks (Requirement 6.2)
    historyManagerRef.current.clear()
    
    // Update button states (Requirements 6.3, 6.4)
    setCanUndo(historyManagerRef.current.canUndo())
    setCanRedo(historyManagerRef.current.canRedo())
    
    toast.info('History cleared')
  }, [toast])

  // Handle template selection
  const handleTemplateSelect = useCallback((templateId: string) => {
    const currentState = getCurrentCanvasState()
    const updates = TemplateManager.applyTemplate(templateId, currentState)
    
    if (updates.preset) setPreset(updates.preset)
    if (updates.fontSize) setFontSize(updates.fontSize)
    if (updates.transform) setTransform(updates.transform)
    if (updates.text) {
      setText(updates.text)
      setInputText(updates.text)
    }
    
    toast.success('Template applied!')
  }, [getCurrentCanvasState, toast])

  // Initialize compositor when image is loaded - Requirements: 4.1, 4.2, 4.3
  useEffect(() => {
    if (!canvasRef.current || !originalImage) {
      return
    }

    try {
      // Create compositor instance
      const compositor = new Compositor({
        canvas: canvasRef.current,
        backgroundImage: originalImage,
        maskImage: maskResult?.maskImage,
        textBehindEnabled,
        maxDimension: 1080,
      })

      compositorRef.current = compositor

      // Initial render with current text layer
      const textLayer: TextLayer = {
        text,
        preset,
        fontSize,
        transform,
      }

      compositor.render(textLayer)
    } catch (error) {
      console.error('Failed to initialize compositor:', error)
      toast.error('Failed to initialize canvas')
    }

    // Cleanup on unmount - Requirements: 8.5
    return () => {
      if (compositorRef.current) {
        compositorRef.current.clear()
        compositorRef.current.clearCache()
        compositorRef.current = null
      }
    }
  }, [originalImage, maskResult, textBehindEnabled, text, preset, fontSize, transform])

  // Re-render when text layer changes - Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.4, 4.2
  useEffect(() => {
    if (!compositorRef.current || !originalImage) {
      return
    }

    try {
      // Create text layer
      const textLayer: TextLayer = {
        text,
        preset,
        fontSize,
        transform,
      }

      // Render with updated text layer
      compositorRef.current.render(textLayer)
    } catch (error) {
      console.error('Failed to render text layer:', error)
      toast.error('Failed to render text')
    }
  }, [text, preset, fontSize, transform, originalImage])

  // Update compositor when mask or text-behind changes - Requirements: 1.4, 1.5, 4.5
  useEffect(() => {
    if (!compositorRef.current || !originalImage) {
      return
    }

    try {
      // Update compositor mask and text-behind state
      compositorRef.current.setMaskImage(maskResult?.maskImage || null)
      compositorRef.current.setTextBehindEnabled(textBehindEnabled)

      // Re-render with current text layer
      const textLayer: TextLayer = {
        text,
        preset,
        fontSize,
        transform,
      }
      compositorRef.current.render(textLayer)
    } catch (error) {
      console.error('Failed to update compositor:', error)
      toast.error('Failed to update canvas')
    }
  }, [maskResult, textBehindEnabled, originalImage, text, preset, fontSize, transform])

  // Auto-save on text change (debounced) - Requirement 4.1
  useEffect(() => {
    if (!autoSaveManagerRef.current || !originalImage) return
    
    const state = getCurrentCanvasState()
    autoSaveManagerRef.current.saveTextChange(state)
  }, [text, originalImage, getCurrentCanvasState])

  // Auto-save on preset change (immediate) - Requirement 4.2
  useEffect(() => {
    if (!autoSaveManagerRef.current || !originalImage) return
    
    const state = getCurrentCanvasState()
    autoSaveManagerRef.current.savePresetChange(state)
  }, [preset, originalImage, getCurrentCanvasState])

  // Auto-save on transform change (debounced) - Requirement 4.3
  useEffect(() => {
    if (!autoSaveManagerRef.current || !originalImage) return
    
    const state = getCurrentCanvasState()
    autoSaveManagerRef.current.saveTransformChange(state)
  }, [transform, originalImage, getCurrentCanvasState])

  // Auto-save on image upload (immediate) - Requirement 4.4
  useEffect(() => {
    if (!autoSaveManagerRef.current || !imageObjUrl) return
    
    const state = getCurrentCanvasState()
    autoSaveManagerRef.current.saveImageUpload(state)
  }, [imageObjUrl, getCurrentCanvasState])

  // Auto-save on mask generation (immediate) - Requirement 4.5
  useEffect(() => {
    if (!autoSaveManagerRef.current || !maskResult) return
    
    const state = getCurrentCanvasState()
    autoSaveManagerRef.current.saveMaskGeneration(state)
  }, [maskResult, getCurrentCanvasState])

  // Export image using new Exporter - Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 6.4, 6.5
  const exportImg = async () => {
    if (!canvasRef.current || !exporterRef.current) {
      toast.error('No image to export')
      return
    }

    setIsExporting(true)
    setExportProgress(null)
    
    try {
      const result = await exporterRef.current.export(
        canvasRef.current,
        {
          format: exportFormat,
          quality: 0.92,
          maxDimension: 1080,
          watermark: !licenseOk,
          watermarkText: 'CaptionArt.io',
        },
        (progress) => {
          setExportProgress(progress)
        }
      )

      if (result.success) {
        toast.success('Image exported successfully!')
        // Clear progress after a short delay
        setTimeout(() => setExportProgress(null), 2000)
      } else {
        throw new Error(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export failed:', error)
      
      // Get user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to export image. Please try again.'
      toast.error(errorMessage, {
        label: 'Retry',
        onClick: exportImg
      })
      setExportProgress(null)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle video recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      const blob = await stopRecording()
      if (blob) {
        setRecordedBlob(blob)
        setShowVideoPreview(true)
      }
    } else {
      startRecording()
    }
  }

  // Define sidebar sections with progressive disclosure logic
  const sidebarSections: SidebarSection[] = [
    {
      id: 'upload',
      title: 'Upload',
      visible: true,
      loading: uploadLoading, // Requirements: 10.1
      error: uploadError, // Requirements: 10.5
      content: (
        <>
          <UploadZone
            onFile={onFile}
            loading={loading}
            currentFile={currentFile}
            imageObjUrl={imageObjUrl}
            error={uploadError}
            onRetry={() => {
              if (currentFile) {
                setUploadError(undefined)
                onFile(currentFile)
              }
            }}
            onDismissError={() => setUploadError(undefined)}
          />
          {originalImage && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <button 
                className="button button-primary" 
                style={{ width: '100%' }}
                onClick={() => setIsStoryMode(true)}
              >
                ✨ Start AI Story
              </button>
            </div>
          )}
          {/* Upload Progress - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5 */}
          <UploadProgress
            visible={uploadVisible}
            progress={uploadProgress}
            status={uploadStatus}
            filename={currentFile?.name}
            error={uploadError}
          />
          {/* File Preview - Requirements: 4.5 */}
          {uploadResult && uploadResult.success && uploadResult.optimizationResult && (
            <FilePreview
              file={currentFile!}
              imageUrl={imageObjUrl}
              originalSize={uploadResult.optimizationResult.originalSize}
              optimizedSize={uploadResult.optimizationResult.optimizedSize}
              dimensions={uploadResult.optimizationResult.dimensions}
              onRemove={() => {
                setCurrentFile(null)
                setImageObjUrl('')
                setImageDataUrl(null)
                setOriginalImage(null)
                setUploadResult(null)
                setText('')
                setInputText('')
                toast.info('Image removed')
              }}
            />
          )}
        </>
      ),
    },
    {
      id: 'captions',
      title: 'Captions',
      visible: !!originalImage,
      loading: captionLoading, // Requirements: 10.3
      error: captionError, // Requirements: 10.5
      content: (
        <CaptionGenerator
          imageDataUrl={imageDataUrl}
          onCaptionSelect={(caption) => {
            setText(caption)
            setInputText(caption)
            setCaptions(prev => {
              if (!prev.includes(caption)) {
                return [...prev, caption]
              }
              return prev
            })
          }}
          onLoadingChange={setCaptionLoading} // Requirements: 10.3
          onErrorChange={setCaptionError} // Requirements: 10.5
        />
      ),
    },
    {
      id: 'text',
      title: 'Text',
      visible: !!originalImage,
      content: (
        <>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <input 
              className="input" 
              placeholder="Enter your text" 
              value={inputText} 
              onChange={e => {
                setInputText(e.target.value);
                debouncedSetText(e.target.value);
              }} 
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              className="input" 
              type="range" 
              min={24} 
              max={160} 
              value={fontSize} 
              onChange={e => setFontSize(parseInt(e.target.value))}
              style={{ flex: '1', minWidth: '120px' }}
            />
            <span className="badge badge-turquoise">Font Size: {fontSize}px</span>
          </div>
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <button 
              className="button button-secondary" 
              onClick={() => {
                if (text) {
                  navigator.clipboard.writeText(text)
                  toast.success('Text copied to clipboard!')
                }
              }} 
              disabled={!text}
              style={{ width: '100%' }}
            >
              Copy Text
            </button>
          </div>
        </>
      ),
    },
    {
      id: 'templates',
      title: 'Templates',
      visible: !!originalImage,
      content: (
        <TemplateSelector
          onSelect={handleTemplateSelect}
        />
      ),
    },
    {
      id: 'style',
      title: 'Style',
      visible: !!originalImage && !!text,
      content: (
        <StylePresetSelector
          selectedPreset={preset}
          onChange={setPreset}
        />
      ),
    },
    {
      id: 'transform',
      title: 'Transform',
      visible: !!originalImage && !!text,
      content: (
        <TransformControls
          transform={transform}
          onChange={setTransform}
        />
      ),
    },
    {
      id: 'mask',
      title: 'Mask Controls',
      visible: !!maskResult && !!imageDataUrl,
      loading: maskLoading, // Requirements: 10.2
      error: maskError, // Requirements: 10.5
      content: (
        <>
          <RegenerateMaskButton 
            onRegenerate={handleRegenerateMask}
            disabled={regenerating || loading || maskLoading}
          />
          <button
            className={textBehindEnabled ? 'button button-secondary' : 'button'}
            onClick={() => setTextBehindEnabled(!textBehindEnabled)}
            style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}
            disabled={maskLoading}
          >
            <span>{textBehindEnabled ? '✨' : '📝'}</span>
            <span>{textBehindEnabled ? 'Text Behind: ON' : 'Text Behind: OFF'}</span>
          </button>
        </>
      ),
    },
  ]

  // Toolbar content
  const toolbarContent = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 var(--spacing-md)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-2xl)', margin: 0 }}>
        Contextual Captioner + Text Art
      </h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
        <ThemeToggle />
        {originalImage && (
          <>
            <Toolbar
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClearHistory={handleClearHistory}
              onExport={exportImg}
              canUndo={canUndo}
              canRedo={canRedo}
              disabled={loading || isExporting}
              onRecord={handleToggleRecording}
              isRecording={isRecording}
              recordingTime={recordingTime}
            />
            <div style={{ display: 'flex', gap: '8px', borderLeft: '1px solid var(--color-border)', paddingLeft: '16px' }}>
              <button 
                className={`button ${socialPreviewPlatform === 'tiktok' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setSocialPreviewPlatform(socialPreviewPlatform === 'tiktok' ? null : 'tiktok')}
                title="Toggle TikTok Preview"
                style={{ padding: '8px' }}
              >
                🎵
              </button>
              <button 
                className={`button ${socialPreviewPlatform === 'instagram-reels' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setSocialPreviewPlatform(socialPreviewPlatform === 'instagram-reels' ? null : 'instagram-reels')}
                title="Toggle Instagram Preview"
                style={{ padding: '8px' }}
              >
                📷
              </button>
              <button 
                className={`button ${socialPreviewPlatform === 'youtube-shorts' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setSocialPreviewPlatform(socialPreviewPlatform === 'youtube-shorts' ? null : 'youtube-shorts')}
                title="Toggle YouTube Shorts Preview"
                style={{ padding: '8px' }}
              >
                ▶️
              </button>
            </div>
            <FormatSelector
              format={exportFormat}
              onChange={setExportFormat}
              disabled={isExporting}
            />
            <ExportButton
              isExporting={isExporting}
              onExport={exportImg}
              disabled={loading}
            />
            <ExportMenu
              canvas={canvasRef.current}
              disabled={loading || isExporting}
              watermark={!licenseOk}
              watermarkText="CaptionArt.io"
            />
          </>
        )}
      </div>
    </div>
  )

  // Sidebar content
  const sidebarContent = <Sidebar sections={sidebarSections} />

  // Canvas area content
  const canvasContent = (
    <>
      <CanvasArea
        canvas={<canvas ref={canvasRef} className="canvas" />}
        beforeAfter={
          originalImage ? (
            <OutputPreview
              originalImage={originalImage}
              outputCanvas={canvasRef.current}
            />
          ) : undefined
        }
        maskPreview={
          <MaskPreview
            originalImage={originalImage}
            maskImage={maskResult?.maskImage || null}
            enabled={maskPreviewEnabled}
            onToggle={setMaskPreviewEnabled}
          />
        }
        socialPreview={
          socialPreviewPlatform ? (
            <SocialPreviewOverlay platform={socialPreviewPlatform} />
          ) : undefined
        }
        showBeforeAfter={!!originalImage}
        showMaskPreview={maskPreviewEnabled}
        loading={loading}
        loadingMessage="Processing image..."
      />
      {/* Export progress display - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5 */}
      {exportProgress && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--spacing-xl)',
          right: 'var(--spacing-xl)',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          <ExportProgress progress={exportProgress} />
        </div>
      )}
      {/* Hidden MaskGenerator component - Requirements: 1.1, 6.1 */}
      <div style={{ display: 'none' }}>
        <MaskGeneratorComponent
          imageDataUrl={imageDataUrl}
          onMaskGenerated={handleMaskGenerated}
          autoGenerate={true}
          onLoadingChange={setMaskLoading} // Requirements: 10.2
          onErrorChange={setMaskError} // Requirements: 10.5
        />
      </div>
    </>
  )

  return (
    <>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      {/* Video Preview Modal */}
      {showVideoPreview && (
        <VideoPreviewModal
          videoBlob={recordedBlob}
          onClose={() => {
            setShowVideoPreview(false)
            setRecordedBlob(null)
          }}
          onDiscard={() => {
            setShowVideoPreview(false)
            setRecordedBlob(null)
          }}
        />
      )}
      
      {/* Story Mode Overlay */}
      {isStoryMode && originalImage && (
        <StoryMode
          initialImage={imageObjUrl}
          initialCaption={captions[0] || 'A new scene'}
          onClose={() => setIsStoryMode(false)}
          onExport={(frames: StoryFrame[]) => {
            console.log('Exporting frames:', frames)
            // TODO: Implement video export from frames
            toast.success('Export feature coming soon!')
          }}
        />
      )}

      <AppLayout
        toolbar={toolbarContent}
        sidebar={sidebarContent}
        canvas={canvasContent}
        sidebarCollapsed={layoutState.sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        layoutMode={layoutState.layoutMode}
        fullscreenMode={layoutState.fullscreenMode}
      />
    </>
  )
}
