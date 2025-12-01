/**
 * Request validation schemas using Zod
 * Provides type-safe input validation for API routes
 */

import { z } from 'zod';

/**
 * Schema for caption generation requests
 */
export const CaptionRequestSchema = z.object({
  imageUrl: z.string()
    .min(1, 'Image URL cannot be empty')
    .refine(
      (url) => url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'),
      'Invalid image URL format. Must be a data URI or HTTP(S) URL'
    )
    .refine(
      (url) => {
        // Validate data URI format if it's a data URI
        if (url.startsWith('data:image/')) {
          return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(url);
        }
        return true;
      },
      'Invalid data URI format. Must be base64-encoded image'
    ),
  keywords: z.array(z.string()).optional().default([])
});

/**
 * Schema for mask generation requests
 */
export const MaskRequestSchema = z.object({
  imageUrl: z.string()
    .min(1, 'Image URL cannot be empty')
    .refine(
      (url) => url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'),
      'Invalid image URL format. Must be a data URI or HTTP(S) URL'
    )
    .refine(
      (url) => {
        // Validate data URI format if it's a data URI
        if (url.startsWith('data:image/')) {
          return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(url);
        }
        return true;
      },
      'Invalid data URI format. Must be base64-encoded image'
    )
});

/**
 * Type inference from schemas
 */
export type CaptionRequest = z.infer<typeof CaptionRequestSchema>;
export type MaskRequest = z.infer<typeof MaskRequestSchema>;
