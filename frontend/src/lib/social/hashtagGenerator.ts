/**
 * Hashtag Generator for Social Media Integration
 * Analyzes images and captions to generate relevant hashtags
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

export interface HashtagSuggestion {
  tag: string;
  relevance: number; // 0-1 score
  category: 'content' | 'style' | 'trending' | 'custom';
}

export interface HashtagGenerationOptions {
  caption?: string;
  imageAnalysis?: {
    dominantColors?: string[];
    detectedObjects?: string[];
    mood?: string;
  };
  maxSuggestions?: number;
  includeGeneric?: boolean;
}

/**
 * Validates that a hashtag follows proper format
 * Requirements: 3.4
 */
export function validateHashtag(hashtag: string): boolean {
  // Must start with #
  if (!hashtag.startsWith('#')) {
    return false;
  }

  // Remove the # for further validation
  const tag = hashtag.slice(1);

  // Must have at least one character after #
  if (tag.length === 0) {
    return false;
  }

  // Cannot contain spaces
  if (tag.includes(' ')) {
    return false;
  }

  // Cannot contain special characters except underscore
  const validPattern = /^[a-zA-Z0-9_]+$/;
  if (!validPattern.test(tag)) {
    return false;
  }

  return true;
}

/**
 * Ensures a string is formatted as a proper hashtag
 */
export function formatHashtag(text: string): string {
  // Remove any existing # symbols
  let cleaned = text.replace(/#/g, '');

  // Remove spaces and special characters
  cleaned = cleaned.replace(/[^a-zA-Z0-9_]/g, '');

  // Add # prefix
  return `#${cleaned}`;
}

/**
 * Hashtag Generator class
 */
export class HashtagGenerator {
  private commonHashtags: Record<string, string[]> = {
    art: ['#art', '#artwork', '#artist', '#creative', '#design'],
    photo: ['#photography', '#photo', '#photooftheday', '#picoftheday', '#instagood'],
    caption: ['#caption', '#quote', '#quotes', '#words', '#text'],
    creative: ['#creative', '#creativity', '#inspiration', '#inspired', '#create'],
    social: ['#socialmedia', '#content', '#contentcreator', '#digitalart', '#graphicdesign'],
  };

  private trendingHashtags: string[] = [
    '#viral',
    '#trending',
    '#explore',
    '#fyp',
    '#foryou',
  ];

  /**
   * Generate hashtag suggestions based on image and caption
   * Requirements: 3.1, 3.2
   */
  async generateSuggestions(
    options: HashtagGenerationOptions = {}
  ): Promise<HashtagSuggestion[]> {
    const {
      caption = '',
      imageAnalysis = {},
      maxSuggestions = 10,
      includeGeneric = true,
    } = options;

    const suggestions: HashtagSuggestion[] = [];

    // Analyze caption for keywords
    if (caption && caption.trim()) {
      const captionTags = this.extractHashtagsFromCaption(caption);
      suggestions.push(...captionTags);
    }

    // Generate tags based on image analysis
    if (imageAnalysis.dominantColors) {
      const colorTags = this.generateColorHashtags(imageAnalysis.dominantColors);
      suggestions.push(...colorTags);
    }

    if (imageAnalysis.detectedObjects) {
      const objectTags = this.generateObjectHashtags(imageAnalysis.detectedObjects);
      suggestions.push(...objectTags);
    }

    if (imageAnalysis.mood) {
      const moodTags = this.generateMoodHashtags(imageAnalysis.mood);
      suggestions.push(...moodTags);
    }

    // Add generic content-related hashtags
    if (includeGeneric) {
      const genericTags = this.getGenericHashtags();
      suggestions.push(...genericTags);
    }

    // Remove duplicates and sort by relevance
    const uniqueSuggestions = this.deduplicateAndSort(suggestions);

    // Limit to max suggestions
    return uniqueSuggestions.slice(0, maxSuggestions);
  }

  /**
   * Extract hashtags from caption text
   */
  private extractHashtagsFromCaption(caption: string): HashtagSuggestion[] {
    const suggestions: HashtagSuggestion[] = [];

    // Extract existing hashtags
    const existingHashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
    existingHashtags.forEach((tag) => {
      suggestions.push({
        tag,
        relevance: 1.0,
        category: 'custom',
      });
    });

    // Extract keywords from caption (words longer than 3 characters)
    const words = caption
      .toLowerCase()
      .replace(/#[a-zA-Z0-9_]+/g, '') // Remove existing hashtags
      .split(/\s+/)
      .map((word) => word.trim()) // Trim whitespace
      .filter((word) => word.length > 3)
      .filter((word) => /^[a-zA-Z]+$/.test(word)); // Only alphabetic words

    words.forEach((word) => {
      const tag = formatHashtag(word);
      if (validateHashtag(tag)) {
        suggestions.push({
          tag,
          relevance: 0.8,
          category: 'content',
        });
      }
    });

    return suggestions;
  }

  /**
   * Generate hashtags based on dominant colors
   */
  private generateColorHashtags(colors: string[]): HashtagSuggestion[] {
    const colorMap: Record<string, string> = {
      red: '#red',
      blue: '#blue',
      green: '#green',
      yellow: '#yellow',
      orange: '#orange',
      purple: '#purple',
      pink: '#pink',
      black: '#black',
      white: '#white',
      gray: '#gray',
      brown: '#brown',
    };

    return colors
      .map((color) => {
        const tag = colorMap[color.toLowerCase()];
        if (tag) {
          return {
            tag,
            relevance: 0.6,
            category: 'style' as const,
          };
        }
        return null;
      })
      .filter((tag): tag is HashtagSuggestion => tag !== null);
  }

  /**
   * Generate hashtags based on detected objects
   */
  private generateObjectHashtags(objects: string[]): HashtagSuggestion[] {
    return objects.map((obj) => ({
      tag: formatHashtag(obj),
      relevance: 0.7,
      category: 'content' as const,
    }));
  }

  /**
   * Generate hashtags based on mood
   */
  private generateMoodHashtags(mood: string): HashtagSuggestion[] {
    const moodMap: Record<string, string[]> = {
      happy: ['#happy', '#joy', '#positive', '#smile'],
      sad: ['#melancholy', '#thoughtful', '#reflective'],
      energetic: ['#energy', '#vibrant', '#dynamic', '#bold'],
      calm: ['#calm', '#peaceful', '#serene', '#tranquil'],
      dramatic: ['#dramatic', '#intense', '#powerful', '#striking'],
    };

    const tags = moodMap[mood.toLowerCase()] || [];
    return tags.map((tag) => ({
      tag,
      relevance: 0.7,
      category: 'style' as const,
    }));
  }

  /**
   * Get generic hashtags for caption art
   */
  private getGenericHashtags(): HashtagSuggestion[] {
    const generic = [
      ...this.commonHashtags.art,
      ...this.commonHashtags.caption,
      ...this.commonHashtags.creative,
    ];

    return generic.map((tag) => ({
      tag,
      relevance: 0.5,
      category: 'content' as const,
    }));
  }

  /**
   * Remove duplicate hashtags and sort by relevance
   */
  private deduplicateAndSort(
    suggestions: HashtagSuggestion[]
  ): HashtagSuggestion[] {
    const seen = new Set<string>();
    const unique: HashtagSuggestion[] = [];

    for (const suggestion of suggestions) {
      const normalized = suggestion.tag.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(suggestion);
      }
    }

    // Sort by relevance (highest first)
    return unique.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Add custom hashtag
   * Requirements: 3.3, 3.4
   */
  addCustomHashtag(hashtag: string): { valid: boolean; formatted?: string; error?: string } {
    // Format the hashtag if it doesn't start with #
    const formatted = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;

    // Validate
    if (!validateHashtag(formatted)) {
      return {
        valid: false,
        error: 'Invalid hashtag format. Hashtags must start with # and contain only letters, numbers, and underscores.',
      };
    }

    return {
      valid: true,
      formatted,
    };
  }

  /**
   * Get trending hashtags
   */
  getTrendingHashtags(): HashtagSuggestion[] {
    return this.trendingHashtags.map((tag) => ({
      tag,
      relevance: 0.9,
      category: 'trending' as const,
    }));
  }

  /**
   * Filter hashtags by category
   */
  filterByCategory(
    suggestions: HashtagSuggestion[],
    category: HashtagSuggestion['category']
  ): HashtagSuggestion[] {
    return suggestions.filter((s) => s.category === category);
  }

  /**
   * Combine selected hashtags with caption
   * Requirements: 3.5
   */
  appendHashtagsToCaption(caption: string, hashtags: string[]): string {
    // Validate all hashtags
    const validHashtags = hashtags.filter((tag) => validateHashtag(tag));

    // Remove any trailing whitespace from caption
    const trimmedCaption = caption.trim();

    if (validHashtags.length === 0) {
      return trimmedCaption;
    }

    // Append hashtags with proper spacing
    const hashtagString = validHashtags.join(' ');

    if (trimmedCaption) {
      return `${trimmedCaption}\n\n${hashtagString}`;
    } else {
      return hashtagString;
    }
  }
}

// Export singleton instance
export const hashtagGenerator = new HashtagGenerator();
