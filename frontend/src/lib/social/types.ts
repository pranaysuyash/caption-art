// Overlay platforms (for video content)
export type SocialPlatform = 'tiktok' | 'instagram-reels' | 'youtube-shorts';

export interface SocialOverlayConfig {
  platform: SocialPlatform;
  opacity: number; // 0 to 1
}

// Shareable platforms (for direct posting)
export type ShareablePlatform = 'instagram' | 'twitter' | 'facebook' | 'pinterest';

export interface PlatformConfig {
  name: string;
  displayName: string;
  maxImageSize: number; // in bytes
  supportedFormats: string[];
  requiresAuth: boolean;
}

export interface AuthStatus {
  platform: ShareablePlatform;
  isAuthenticated: boolean;
  username?: string;
  profilePicture?: string;
  tokenExpiry?: Date;
}

export interface PreparedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  format: string;
}

export interface PostResult {
  success: boolean;
  platform: ShareablePlatform;
  postUrl?: string;
  error?: string;
  errorDetails?: import('./errorHandler').ErrorHandlingResult;
}

export interface MultiPlatformResult {
  results: PostResult[];
  successCount: number;
  failureCount: number;
  totalPlatforms: number;
}

export interface PostPreviewData {
  platform: ShareablePlatform;
  imageDataUrl: string;
  caption: string;
  hashtags: string[];
  username?: string;
  profilePicture?: string;
  timestamp: Date;
}

export interface PlatformStyle {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  captionMaxLength: number;
  showTimestamp: boolean;
  showEngagement: boolean;
}

export interface ScheduledPost {
  id: string;
  platform: ShareablePlatform;
  image: PreparedImage;
  caption: string;
  hashtags: string[];
  scheduledTime: Date;
  status: 'pending' | 'posted' | 'failed';
  createdAt: Date;
  postedAt?: Date;
  error?: string;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  error?: string;
}
