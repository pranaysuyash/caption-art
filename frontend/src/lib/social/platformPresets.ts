/**
 * Platform Presets for Social Media Integration
 * Defines platform-specific image dimension presets
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

export type ShareablePlatform = 'instagram' | 'twitter' | 'facebook' | 'pinterest';

export interface PlatformPreset {
  name: string;
  displayName: string;
  width: number;
  height: number;
  aspectRatio: string;
  description: string;
}

export interface PlatformPresets {
  platform: ShareablePlatform;
  presets: PlatformPreset[];
}

/**
 * Instagram presets
 * Requirements: 2.1
 */
const INSTAGRAM_PRESETS: PlatformPreset[] = [
  {
    name: 'square',
    displayName: 'Square',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    description: 'Perfect for feed posts',
  },
  {
    name: 'portrait',
    displayName: 'Portrait',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    description: 'Vertical feed posts',
  },
  {
    name: 'story',
    displayName: 'Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    description: 'Instagram Stories and Reels',
  },
];

/**
 * Twitter presets
 * Requirements: 2.2
 */
const TWITTER_PRESETS: PlatformPreset[] = [
  {
    name: 'standard',
    displayName: 'Standard',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    description: 'Standard tweet image',
  },
  {
    name: 'header',
    displayName: 'Header',
    width: 1500,
    height: 500,
    aspectRatio: '3:1',
    description: 'Profile header image',
  },
];

/**
 * Facebook presets
 * Requirements: 2.3
 */
const FACEBOOK_PRESETS: PlatformPreset[] = [
  {
    name: 'post',
    displayName: 'Post',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    description: 'Standard Facebook post',
  },
  {
    name: 'cover',
    displayName: 'Cover',
    width: 820,
    height: 312,
    aspectRatio: '2.63:1',
    description: 'Profile cover photo',
  },
];

/**
 * Pinterest presets
 * Requirements: 2.4
 */
const PINTEREST_PRESETS: PlatformPreset[] = [
  {
    name: 'pin',
    displayName: 'Pin',
    width: 1000,
    height: 1500,
    aspectRatio: '2:3',
    description: 'Standard Pinterest pin',
  },
];

/**
 * All platform presets mapped by platform
 */
const PLATFORM_PRESETS_MAP: Record<ShareablePlatform, PlatformPreset[]> = {
  instagram: INSTAGRAM_PRESETS,
  twitter: TWITTER_PRESETS,
  facebook: FACEBOOK_PRESETS,
  pinterest: PINTEREST_PRESETS,
};

/**
 * Get presets for a specific platform
 */
export function getPlatformPresets(platform: ShareablePlatform): PlatformPreset[] {
  return PLATFORM_PRESETS_MAP[platform];
}

/**
 * Get all platform presets
 */
export function getAllPlatformPresets(): PlatformPresets[] {
  return Object.entries(PLATFORM_PRESETS_MAP).map(([platform, presets]) => ({
    platform: platform as ShareablePlatform,
    presets,
  }));
}

/**
 * Get a specific preset by platform and preset name
 */
export function getPreset(
  platform: ShareablePlatform,
  presetName: string
): PlatformPreset | undefined {
  const presets = getPlatformPresets(platform);
  return presets.find((preset) => preset.name === presetName);
}

/**
 * Resize canvas to match preset dimensions
 * Requirements: 2.5
 */
export function resizeCanvasToPreset(
  canvas: HTMLCanvasElement,
  preset: PlatformPreset
): HTMLCanvasElement {
  // Ensure source canvas has a context (needed for test environment)
  const sourceCtx = canvas.getContext('2d');
  if (!sourceCtx) {
    throw new Error('Failed to get source canvas context');
  }

  // Create a new canvas with the preset dimensions
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = preset.width;
  resizedCanvas.height = preset.height;

  const ctx = resizedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate scaling to fit the original canvas into the new dimensions
  // while maintaining aspect ratio
  const sourceAspect = canvas.width / canvas.height;
  const targetAspect = preset.width / preset.height;

  let drawWidth: number;
  let drawHeight: number;
  let offsetX = 0;
  let offsetY = 0;

  if (sourceAspect > targetAspect) {
    // Source is wider - fit to width
    drawWidth = preset.width;
    drawHeight = preset.width / sourceAspect;
    offsetY = (preset.height - drawHeight) / 2;
  } else {
    // Source is taller - fit to height
    drawHeight = preset.height;
    drawWidth = preset.height * sourceAspect;
    offsetX = (preset.width - drawWidth) / 2;
  }

  // Fill background with white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, preset.width, preset.height);

  // Draw the original canvas centered and scaled
  ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);

  return resizedCanvas;
}

/**
 * Check if canvas dimensions match a preset
 */
export function canvasMatchesPreset(
  canvas: HTMLCanvasElement,
  preset: PlatformPreset
): boolean {
  return canvas.width === preset.width && canvas.height === preset.height;
}

/**
 * Get the closest preset for given dimensions
 */
export function getClosestPreset(
  platform: ShareablePlatform,
  width: number,
  height: number
): PlatformPreset | undefined {
  const presets = getPlatformPresets(platform);
  if (presets.length === 0) {
    return undefined;
  }

  // Calculate aspect ratio
  const targetAspect = width / height;

  // Find preset with closest aspect ratio
  let closestPreset = presets[0];
  let closestDiff = Math.abs(targetAspect - closestPreset.width / closestPreset.height);

  for (const preset of presets) {
    const presetAspect = preset.width / preset.height;
    const diff = Math.abs(targetAspect - presetAspect);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestPreset = preset;
    }
  }

  return closestPreset;
}
