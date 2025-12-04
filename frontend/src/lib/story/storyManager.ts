// import { ExternalAPIError } from '../errors/AppError'

export interface StoryFrame {
  id: string;
  imageUrl: string;
  caption: string;
  prompt: string;
}

export interface NextFrameResponse {
  nextPrompt: string;
  nextImageUrl: string;
}

import apiFetch from '../api/httpClient';

export class StoryManager {
  private static API_BASE =
    import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

  /**
   * Generates the next frame in the story
   * @param currentCaption - The caption of the current scene
   * @param styleContext - The style description to maintain consistency
   * @returns The generated prompt and image URL
   */
  static async generateNextFrame(
    currentCaption: string,
    styleContext: string
  ): Promise<NextFrameResponse> {
    try {
      const response = await apiFetch(`${this.API_BASE}/story/next-frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentCaption,
          styleContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate next frame');
      }

      return await response.json();
    } catch (error) {
      console.error('Story generation error:', error);
      throw error;
    }
  }
}
