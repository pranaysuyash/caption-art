/**
 * Social Media Integration exports
 */

export { platformManager, PlatformManager } from './platformManager';
export { oauthHandler, OAuthHandler } from './oauthHandler';
export { hashtagGenerator, HashtagGenerator } from './hashtagGenerator';
export { postPreviewManager, PostPreviewManager } from './postPreview';
export {
  getPlatformPresets,
  getAllPlatformPresets,
  getPreset,
  resizeCanvasToPreset,
  canvasMatchesPreset,
  getClosestPreset,
} from './platformPresets';

export { postScheduler, PostScheduler } from './postScheduler';

export {
  errorHandler,
  ErrorHandler,
  AuthenticationError,
  ImageSizeError,
  RateLimitError,
  NetworkError,
  UnknownSocialMediaError,
  SocialMediaError,
  SocialMediaErrorType,
} from './errorHandler';

export type { ErrorAction, ErrorHandlingResult } from './errorHandler';

export type {
  SocialPlatform,
  SocialOverlayConfig,
  ShareablePlatform,
  PlatformConfig,
  AuthStatus,
  PreparedImage,
  PostResult,
  MultiPlatformResult,
  PostPreviewData,
  PlatformStyle,
  ScheduledPost,
  ScheduleValidationResult,
} from './types';

export type { PlatformPreset, PlatformPresets } from './platformPresets';
