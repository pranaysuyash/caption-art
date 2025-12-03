// Simple Node.js server to test Phase 1 APIs without TypeScript compilation issues
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/generated', express.static(path.join(process.cwd(), 'generated')));

// Basic routes for testing Phase 1 APIs
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Simple server is running',
    timestamp: new Date().toISOString(),
    phase1Features: {
      variationEngine: true,
      adCopyMode: true,
      campaignAwarePrompting: true,
      videoScriptGeneration: true
    }
  });
});

app.get('/api/video-scripts/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'video-script-service',
    timestamp: new Date().toISOString(),
    videoScriptsCount: 0,
    capabilities: [
      'video-script-generation',
      '5-scene-structure',
      'campaign-aware-scripting',
      'storyboard-generation',
      'quality-scoring',
      'performance-estimation',
      'multi-platform-support',
    ],
  });
});

// Mock video script generation endpoint for testing
app.post('/api/video-scripts/generate', (req, res) => {
  const {
    assetDescription,
    product,
    videoLength = 30,
    platforms = ['instagram'],
    tone = ['professional'],
    objective = 'awareness',
    includeStoryboard = false,
    targetAudience
  } = req.body;

  // Mock response that matches the expected format
  const mockVideoScript = {
    scenes: [
      {
        sceneNumber: 1,
        type: 'hook',
        duration: 3,
        script: `✨ ${product.name} - Your health companion`,
        visualNotes: 'Dynamic product showcase with glowing health metrics'
      },
      {
        sceneNumber: 2,
        type: 'problem',
        duration: 4,
        script: 'Struggling to track your health goals?',
        visualNotes: 'Person looking frustrated with fitness apps'
      },
      {
        sceneNumber: 3,
        type: 'benefit',
        duration: 4,
        script: `${product.name} makes it effortless!`,
        visualNotes: 'Happy person using the smartwatch with ease'
      },
      {
        sceneNumber: 4,
        type: 'demo',
        duration: 5,
        script: 'Real-time health tracking at your wrist',
        visualNotes: 'Close-up of smartwatch showing health metrics'
      },
      {
        sceneNumber: 5,
        type: 'cta',
        duration: 2,
        script: 'Start your health journey today!',
        visualNotes: 'Product shot with call-to-action overlay'
      }
    ],
    totalDuration: 18,
    cta: 'Get your HealthTrack Pro now!',
    platform: platforms[0]
  };

  const mockStoryboard = includeStoryboard ? {
    videoScriptId: `storyboard-${Date.now()}`,
    scenes: mockVideoScript.scenes.map((scene, index) => ({
      sceneNumber: scene.sceneNumber,
      type: scene.type,
      duration: scene.duration,
      script: scene.script,
      imageUrl: `https://via.placeholder.com/1080x1920/000000/FFFFFF?text=${encodeURIComponent(`Scene ${scene.sceneNumber}: ${scene.type.toUpperCase()}`)}`,
      thumbnailUrl: `https://via.placeholder.com/320x568/000000/FFFFFF?text=${encodeURIComponent(`${scene.sceneNumber}`)}`,
    })),
    totalDuration: mockVideoScript.totalDuration,
  } : undefined;

  const response = {
    success: true,
    result: {
      videoScript: mockVideoScript,
      videoStoryboard: mockStoryboard,
      metadata: {
        id: `video-script-${Date.now()}`,
        qualityScore: 85,
        recommendations: [
          'Add more emotional appeal to hook',
          'Include specific health metrics in demo scene',
          'Stronger call-to-action with urgency'
        ],
        estimatedPerformance: {
          engagementRate: 0.045,
          completionRate: 0.70,
          shareability: 0.025
        }
      }
    }
  };

  res.json(response);
});

// List video scripts (mock)
app.get('/api/video-scripts', (req, res) => {
  res.json({
    success: true,
    videoScripts: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });
});

// Phase 2.1: Multi-Format Static Outputs
app.get('/api/multi-format/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'multi-format-service',
    timestamp: new Date().toISOString(),
    multiFormatCount: 0,
    capabilities: [
      'multi-format-generation',
      'square-format (1:1)',
      'story-format (9:16)',
      'landscape-format (16:9)',
      'platform-optimization',
      'campaign-aware-generation',
      'style-synthesis-ready',
      'quality-metrics',
    ],
  });
});

app.post('/api/multi-format/generate', (req, res) => {
  const {
    sourceAssetId,
    workspaceId,
    outputFormats = ['square', 'story', 'landscape'],
    platforms = {
      square: ['instagram'],
      story: ['instagram', 'tiktok'],
      landscape: ['youtube']
    },
    synthesisMode = 'balanced'
  } = req.body;

  // Mock multi-format generation
  const formats = outputFormats.map(format => {
    const dimensions = format === 'square'
      ? { width: 1080, height: 1080 }
      : format === 'story'
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 };

    const platform = platforms[format]?.[0] ||
      (format === 'square' ? 'instagram' : format === 'story' ? 'instagram' : 'youtube');

    return {
      type: format,
      dimensions,
      platform,
      url: `https://via.placeholder.com/${dimensions.width}x${dimensions.height}/${
        format === 'square' ? '4A90E2' : format === 'story' ? 'E91E63' : 'FF9800'
      }/FFFFFF?text=${encodeURIComponent(`${platform.toUpperCase()} ${format.toUpperCase()}`)}`,
      thumbnailUrl: `https://via.placeholder.com/320x${
        Math.round(320 * (dimensions.height / dimensions.width))
      }/${
        format === 'square' ? '4A90E2' : format === 'story' ? 'E91E63' : 'FF9800'
      }/FFFFFF?text=${encodeURIComponent(format)}`,
    };
  });

  const mockMultiFormat = {
    id: `multi-format-${Date.now()}`,
    sourceAssetId,
    workspaceId,
    formats: {
      [outputFormats[0]]: formats[0],
      ...(outputFormats[1] && { [outputFormats[1]]: formats[1] }),
      ...(outputFormats[2] && { [outputFormats[2]]: formats[2] }),
    },
    qualityMetrics: {
      brandConsistency: 87,
      visualAppeal: 83,
      textReadability: 91,
      overallScore: 87,
    },
    recommendations: [
      'Consider adding brand logo to improve recognition',
      'Test different color schemes for better contrast',
      'Add subtle animations for story format engagement'
    ],
    processingTime: 1250,
    createdAt: new Date(),
  };

  const response = {
    success: true,
    result: {
      multiFormatId: mockMultiFormat.id,
      outputs: [mockMultiFormat], // Simplified structure
      qualityMetrics: mockMultiFormat.qualityMetrics,
      recommendations: mockMultiFormat.recommendations,
      processingTime: mockMultiFormat.processingTime,
    },
  };

  res.json(response);
});

app.get('/api/multi-format', (req, res) => {
  res.json({
    success: true,
    multiFormats: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });
});

// Debug routes
app.get('/api/_test', (req, res) => {
  res.json({
    message: 'Simple server test route working',
    timestamp: new Date().toISOString(),
  });
});

// Phase 2.2: Reference Style Synthesis
app.get('/api/style-synthesis/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'style-synthesis-service',
    timestamp: new Date().toISOString(),
    synthesesCount: 0,
    referencesCount: 0,
    capabilities: [
      'style-reference-analysis',
      'multi-style-synthesis',
      'style-matching-search',
      'dominant-mode-synthesis',
      'balanced-mode-synthesis',
      'creative-mode-synthesis',
      'conservative-mode-synthesis',
      'quality-metrics',
      'brand-alignment-scoring',
    ],
  });
});

// Mock style synthesis endpoint
app.post('/api/style-synthesis/synthesize', (req, res) => {
  const {
    workspaceId,
    styleReferences = ['ref-1', 'ref-2'],
    synthesisMode = 'balanced',
    targetFormat = 'square'
  } = req.body;

  const mockSynthesis = {
    id: `style-synthesis-${Date.now()}`,
    request: {
      workspaceId,
      styleReferences,
      synthesisMode,
      targetFormat
    },
    analyses: styleReferences.map(refId => ({
      referenceId: refId,
      confidence: 0.85 + Math.random() * 0.1,
      keyAttributes: ['modern', 'clean', 'bold', 'minimalist']
    })),
    synthesizedStyle: {
      colorPalette: ['#2C3E50', '#34495E', '#E74C3C', '#ECF0F1', '#FFFFFF'],
      typography: ['Modern sans-serif', 'Clean geometric forms'],
      composition: ['Centered layout', 'Balanced asymmetry'],
      mood: ['Professional', 'Trustworthy', 'Modern'],
      visualStyle: ['Minimalist', 'Corporate', 'Clean'],
      keyElements: ['Bold typography', 'Subtle gradients'],
      synthesisMode,
      confidence: 0.85 + Math.random() * 0.1
    },
    styleGuidance: [
      'Apply the minimalist aesthetic consistently',
      'Use the color palette: #2C3E50, #34495E, #E74C3C',
      'Implement modern sans-serif for primary elements',
      'Follow centered layout principles',
      'Maintain a professional and trustworthy mood'
    ],
    synthesizedOutput: {
      url: `https://via.placeholder.com/1080x1080/2C3E50/FFFFFF?text=SYNTHESIZED`,
      thumbnailUrl: `https://via.placeholder.com/320x320/2C3E50/FFFFFF?text=STYLE`,
      dimensions: { width: 1080, height: 1080 },
      format: targetFormat,
      styleScore: 87,
      brandAlignment: 88,
      campaignAlignment: 85
    },
    qualityMetrics: {
      coherence: 85,
      diversity: 75,
      innovation: synthesisMode === 'creative' ? 85 : 70,
      brandConsistency: 88,
      overallScore: 82
    },
    recommendations: [
      'Excellent style synthesis!',
      'Consider exploring creative mode for more variety'
    ],
    processingTime: 1500 + Math.random() * 1000,
    createdAt: new Date()
  };

  res.json({
    success: true,
    result: mockSynthesis
  });
});

app.get('/api/style-synthesis', (req, res) => {
  res.json({
    success: true,
    syntheses: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });
});

// Phase 2.4: Simple Video Rendering
app.get('/api/video-renderer/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'video-renderer-service',
    timestamp: new Date().toISOString(),
    capabilities: [
      'video-rendering',
      'multiple-formats',
      'render-queue',
      'progress-tracking',
      'quality-levels',
      'audio-support',
      'brand-integration',
      'script-based-rendering',
    ],
    queueStats: {
      queueLength: 0,
      processingCount: 0,
      averageWaitTime: 0,
      capacity: 3,
    },
    performance: {
      averageRenderTime: 0,
      averageQualityScore: 0,
    },
  });
});

// Mock video render submission endpoint
app.post('/api/video-renderer/submit', (req, res) => {
  const {
    workspaceId,
    sourceAssets = ['asset-1'],
    outputFormat = 'square',
    duration = 30,
    style = 'professional',
    quality = 'standard',
    includeAudio = true
  } = req.body;

  const mockRender = {
    id: `video-render-${Date.now()}`,
    request: {
      workspaceId,
      sourceAssets,
      outputFormat,
      duration,
      style,
      quality,
      includeAudio,
    },
    renderJob: {
      id: `video-render-${Date.now()}`,
      status: 'processing',
      progress: 45,
      startedAt: new Date(),
    },
    output: {
      url: `https://example.com/videos/${outputFormat}-${duration}s-${Date.now()}.mp4`,
      thumbnailUrl: `https://example.com/thumbnails/${outputFormat}-${duration}s-${Date.now()}.jpg`,
      duration,
      resolution: outputFormat === 'square' ? { width: 1080, height: 1080 } :
                  outputFormat === 'story' ? { width: 1080, height: 1920 } :
                  { width: 1920, height: 1080 },
      fileSize: Math.round(duration * (quality === 'high' ? 500 : quality === 'standard' ? 250 : 100) * 1000),
      format: 'mp4',
      quality,
    },
    metadata: {
      scenes: [
        {
          id: 'scene-1',
          startTime: 0,
          endTime: 15,
          duration: 15,
          type: 'intro',
          content: {
            visualType: 'image-sequence',
            assetIds: sourceAssets,
            textContent: 'Introduction scene',
            animationStyle: 'smooth-elegant',
          },
        },
        {
          id: 'scene-2',
          startTime: 15,
          endTime: duration,
          duration: duration - 15,
          type: 'main-content',
          content: {
            visualType: 'text-animation',
            assetIds: sourceAssets,
            textContent: 'Main content scene',
            animationStyle: 'dynamic-punchy',
          },
        },
      ],
      textOverlays: [
        {
          id: 'overlay-1',
          startTime: 0,
          endTime: 5,
          text: 'Your Brand Story',
          position: { x: 50, y: 20 },
          style: {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#FFFFFF',
            animation: 'fade-in',
          },
        },
      ],
      effects: [
        {
          id: 'effect-1',
          type: 'fade-transition',
          startTime: 14.5,
          endTime: 15.5,
          parameters: { duration: 1 },
        },
      ],
    },
    analytics: {
      renderTime: 8000 + Math.random() * 4000,
      processingMetrics: {
        frameGeneration: 2000,
        audioProcessing: 1500,
        compositing: 2500,
        encoding: 3000,
      },
      qualityScore: 85 + Math.random() * 10,
      recommendations: [
        'Great video composition',
        'Consider adding background music for better engagement',
      ],
    },
    createdAt: new Date(),
  };

  res.json({
    success: true,
    render: mockRender,
  });
});

app.get('/api/video-renderer', (req, res) => {
  res.json({
    success: true,
    renders: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });
});

app.get('/api/_routes', (req, res) => {
  const routes = [
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/api/video-scripts/health' },
    { method: 'POST', path: '/api/video-scripts/generate' },
    { method: 'GET', path: '/api/video-scripts' },
    { method: 'GET', path: '/api/multi-format/health' },
    { method: 'POST', path: '/api/multi-format/generate' },
    { method: 'GET', path: '/api/multi-format' },
    { method: 'GET', path: '/api/style-synthesis/health' },
    { method: 'POST', path: '/api/style-synthesis/synthesize' },
    { method: 'GET', path: '/api/style-synthesis' },
    { method: 'GET', path: '/api/video-renderer/health' },
    { method: 'POST', path: '/api/video-renderer/submit' },
    { method: 'GET', path: '/api/video-renderer' },
    { method: 'GET', path: '/api/_test' },
    { method: 'GET', path: '/api/_routes' },
  ];

  res.json({ routes });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Phase 1 Test Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎬 Video Scripts API: http://localhost:${PORT}/api/video-scripts/health`);
  console.log(`🔧 Debug routes: http://localhost:${PORT}/api/_routes`);
  console.log('\n✅ Phase 1 Features Ready for Testing:');
  console.log('   • Variation Engine (7 caption types)');
  console.log('   • Ad-Copy Mode (structured generation)');
  console.log('   • Campaign-Aware Prompting');
  console.log('   • Video Script + Storyboard Generation');
});

module.exports = app;