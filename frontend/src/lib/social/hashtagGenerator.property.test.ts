/**
 * Hashtag Generator Property Tests
 * 
 * Property-based tests for hashtag validation
 * Feature: social-media-integration, Property 2: Hashtag validation
 * Validates: Requirements 3.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateHashtag,
  formatHashtag,
  HashtagGenerator,
  type HashtagSuggestion,
} from './hashtagGenerator';

describe('Hashtag Generator Property Tests', () => {
  /**
   * Feature: social-media-integration, Property 2: Hashtag validation
   * 
   * For any generated or custom hashtag, it should start with # 
   * and contain no spaces
   * 
   * Validates: Requirements 3.4
   */
  describe('Property 2: Hashtag validation', () => {
    const generator = new HashtagGenerator();

    // Arbitrary for generating valid hashtag content (without #)
    const validHashtagContentArb = fc.string({
      minLength: 1,
      maxLength: 50,
    }).filter(s => /^[a-zA-Z0-9_]+$/.test(s));

    // Arbitrary for generating hashtags with #
    const validHashtagArb = validHashtagContentArb.map(content => `#${content}`);

    // Arbitrary for generating strings with spaces
    const stringWithSpacesArb = fc.string().filter(s => s.includes(' '));

    // Arbitrary for generating strings without # prefix
    const stringWithoutHashArb = fc.string().filter(s => !s.startsWith('#'));

    it('for any valid hashtag, validateHashtag should return true', () => {
      fc.assert(
        fc.property(validHashtagArb, (hashtag) => {
          // Property: Valid hashtags should pass validation
          return validateHashtag(hashtag) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('for any string with spaces, validateHashtag should return false', () => {
      fc.assert(
        fc.property(stringWithSpacesArb, (text) => {
          // Add # prefix if not present
          const hashtag = text.startsWith('#') ? text : `#${text}`;
          
          // Property: Hashtags with spaces should fail validation
          return validateHashtag(hashtag) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('for any string without # prefix, validateHashtag should return false', () => {
      fc.assert(
        fc.property(
          stringWithoutHashArb.filter(s => s.length > 0),
          (text) => {
            // Property: Strings without # should fail validation
            return validateHashtag(text) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any valid hashtag content, formatHashtag should add # prefix', () => {
      fc.assert(
        fc.property(validHashtagContentArb, (content) => {
          const formatted = formatHashtag(content);
          
          // Property: Formatted hashtag should start with #
          return formatted.startsWith('#');
        }),
        { numRuns: 100 }
      );
    });

    it('for any valid hashtag content, formatHashtag result should pass validation', () => {
      fc.assert(
        fc.property(validHashtagContentArb, (content) => {
          const formatted = formatHashtag(content);
          
          // Property: Formatted hashtags should be valid
          return validateHashtag(formatted);
        }),
        { numRuns: 100 }
      );
    });

    it('for any string, formatHashtag should remove spaces', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const formatted = formatHashtag(text);
          
          // Property: Formatted hashtags should not contain spaces
          return !formatted.includes(' ');
        }),
        { numRuns: 100 }
      );
    });

    it('for any generated suggestions, all hashtags should be valid', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          async (caption) => {
            const suggestions = await generator.generateSuggestions({ caption });
            
            // Property: All generated hashtags should pass validation
            return suggestions.every(s => validateHashtag(s.tag));
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any generated suggestions, all hashtags should start with #', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          async (caption) => {
            const suggestions = await generator.generateSuggestions({ caption });
            
            // Property: All generated hashtags should start with #
            return suggestions.every(s => s.tag.startsWith('#'));
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any generated suggestions, no hashtags should contain spaces', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          async (caption) => {
            const suggestions = await generator.generateSuggestions({ caption });
            
            // Property: No generated hashtags should contain spaces
            return suggestions.every(s => !s.tag.includes(' '));
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any custom hashtag with valid format, addCustomHashtag should succeed', () => {
      fc.assert(
        fc.property(validHashtagArb, (hashtag) => {
          const result = generator.addCustomHashtag(hashtag);
          
          // Property: Valid custom hashtags should be accepted
          return result.valid === true && result.formatted !== undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('for any custom hashtag without #, addCustomHashtag should add it', () => {
      fc.assert(
        fc.property(validHashtagContentArb, (content) => {
          const result = generator.addCustomHashtag(content);
          
          // Property: Custom hashtags should get # prefix added
          return (
            result.valid === true &&
            result.formatted !== undefined &&
            result.formatted.startsWith('#')
          );
        }),
        { numRuns: 100 }
      );
    });

    it('for any custom hashtag with spaces, addCustomHashtag should fail', () => {
      fc.assert(
        fc.property(stringWithSpacesArb, (text) => {
          const result = generator.addCustomHashtag(text);
          
          // Property: Custom hashtags with spaces should be rejected
          return result.valid === false && result.error !== undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('for any caption with selected hashtags, appendHashtagsToCaption should include all valid hashtags', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 100 }),
          fc.array(validHashtagArb, { minLength: 1, maxLength: 10 }),
          (caption, hashtags) => {
            const result = generator.appendHashtagsToCaption(caption, hashtags);
            
            // Property: Result should contain all valid hashtags
            return hashtags.every(tag => result.includes(tag));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any caption with invalid hashtags, appendHashtagsToCaption should filter them out', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 100 }),
          fc.array(stringWithSpacesArb, { minLength: 1, maxLength: 5 }),
          (caption, invalidHashtags) => {
            const result = generator.appendHashtagsToCaption(caption, invalidHashtags);
            const trimmedCaption = caption.trim();
            
            // Property: Result should either be the trimmed caption (if no valid hashtags)
            // or the caption with valid hashtags appended
            // Invalid hashtags should not be added to the result
            
            // Since all hashtags are invalid, result should just be the trimmed caption
            return result === trimmedCaption;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any empty string, validateHashtag should return false', () => {
      expect(validateHashtag('')).toBe(false);
    });

    it('for any hashtag with only #, validateHashtag should return false', () => {
      expect(validateHashtag('#')).toBe(false);
    });

    it('for any hashtag with special characters, validateHashtag should return false', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('!', '@', '$', '%', '^', '&', '*', '(', ')', '-', '+', '='),
            { minLength: 1, maxLength: 10 }
          ),
          (specialChars) => {
            const hashtag = `#test${specialChars.join('')}`;
            
            // Property: Hashtags with special characters should fail validation
            return validateHashtag(hashtag) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any hashtag with underscore, validateHashtag should return true', () => {
      fc.assert(
        fc.property(
          validHashtagContentArb,
          fc.integer({ min: 0, max: 5 }),
          (content, underscoreCount) => {
            // Add underscores to the content
            const withUnderscores = content + '_'.repeat(underscoreCount);
            const hashtag = `#${withUnderscores}`;
            
            // Property: Hashtags with underscores should pass validation
            return validateHashtag(hashtag) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any generated suggestions, relevance scores should be between 0 and 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          async (caption) => {
            const suggestions = await generator.generateSuggestions({ caption });
            
            // Property: All relevance scores should be in valid range
            return suggestions.every(s => s.relevance >= 0 && s.relevance <= 1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any maxSuggestions parameter, result should not exceed that limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          async (caption, maxSuggestions) => {
            const suggestions = await generator.generateSuggestions({
              caption,
              maxSuggestions,
            });
            
            // Property: Number of suggestions should not exceed max
            return suggestions.length <= maxSuggestions;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any generated suggestions, there should be no duplicate hashtags', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          async (caption) => {
            const suggestions = await generator.generateSuggestions({ caption });
            const tags = suggestions.map(s => s.tag.toLowerCase());
            const uniqueTags = new Set(tags);
            
            // Property: All hashtags should be unique (case-insensitive)
            return tags.length === uniqueTags.size;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any caption with existing hashtags, those hashtags should appear in suggestions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validHashtagArb, { minLength: 1, maxLength: 5 }),
          fc.string({ maxLength: 50 }),
          async (hashtags, text) => {
            const caption = `${text} ${hashtags.join(' ')}`;
            const suggestions = await generator.generateSuggestions({ caption });
            const suggestedTags = suggestions.map(s => s.tag.toLowerCase());
            
            // Property: Existing hashtags should be included in suggestions
            return hashtags.every(tag => 
              suggestedTags.includes(tag.toLowerCase())
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any trending hashtags, they should all be valid', () => {
      const trending = generator.getTrendingHashtags();
      
      // Property: All trending hashtags should pass validation
      expect(trending.every(s => validateHashtag(s.tag))).toBe(true);
    });

    it('for any category filter, filtered results should only contain that category', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<HashtagSuggestion['category']>(
            'content',
            'style',
            'trending',
            'custom'
          ),
          fc.string({ minLength: 5, maxLength: 100 }),
          async (category, caption) => {
            const suggestions = await generator.generateSuggestions({ caption });
            const filtered = generator.filterByCategory(suggestions, category);
            
            // Property: All filtered results should match the category
            return filtered.every(s => s.category === category);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any hashtag, case should be preserved in validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          (content) => {
            const lowercase = `#${content.toLowerCase()}`;
            const uppercase = `#${content.toUpperCase()}`;
            const mixed = `#${content}`;
            
            // Property: Validation should work regardless of case
            return (
              validateHashtag(lowercase) === validateHashtag(uppercase) &&
              validateHashtag(uppercase) === validateHashtag(mixed)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any empty caption, generateSuggestions should still return generic hashtags', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(''),
          async (caption) => {
            const suggestions = await generator.generateSuggestions({
              caption,
              includeGeneric: true,
            });
            
            // Property: Empty caption should still generate suggestions
            return suggestions.length > 0;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('for any suggestions with includeGeneric false, generic hashtags should be excluded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          async (caption) => {
            const withGeneric = await generator.generateSuggestions({
              caption,
              includeGeneric: true,
            });
            const withoutGeneric = await generator.generateSuggestions({
              caption,
              includeGeneric: false,
            });
            
            // Property: Excluding generic should result in fewer or equal suggestions
            return withoutGeneric.length <= withGeneric.length;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Hashtag Validation Edge Cases', () => {
    it('should reject hashtag with only spaces after #', () => {
      expect(validateHashtag('#   ')).toBe(false);
    });

    it('should reject hashtag with newline', () => {
      expect(validateHashtag('#test\nhashtag')).toBe(false);
    });

    it('should reject hashtag with tab', () => {
      expect(validateHashtag('#test\thashtag')).toBe(false);
    });

    it('should accept hashtag with numbers', () => {
      expect(validateHashtag('#test123')).toBe(true);
    });

    it('should accept hashtag with all numbers', () => {
      expect(validateHashtag('#123456')).toBe(true);
    });

    it('should accept hashtag with underscores', () => {
      expect(validateHashtag('#test_hashtag_123')).toBe(true);
    });

    it('should reject hashtag with hyphen', () => {
      expect(validateHashtag('#test-hashtag')).toBe(false);
    });

    it('should reject hashtag with period', () => {
      expect(validateHashtag('#test.hashtag')).toBe(false);
    });

    it('should handle very long hashtags', () => {
      const longHashtag = '#' + 'a'.repeat(200);
      expect(validateHashtag(longHashtag)).toBe(true);
    });

    it('should format hashtag by removing multiple # symbols', () => {
      const formatted = formatHashtag('##test');
      expect(formatted).toBe('#test');
    });

    it('should format hashtag by removing special characters', () => {
      const formatted = formatHashtag('test-hashtag!');
      expect(formatted).toBe('#testhashtag');
    });
  });
});
