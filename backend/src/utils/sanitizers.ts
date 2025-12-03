/**
 * Simple sanitizers and transformers for user-provided data to reduce prompt injection and unsafe input.
 */
export function sanitizeKeyword(keyword: string): string {
  if (!keyword) return ''
  // Remove html tags
  let s = keyword.replace(/<[^>]*>/g, '')
  // Remove common injection patterns and control characters
  s = s.replace(/["'`\;\|\$\(\)\{\}\[\]\^<>]/g, '')
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim()
  // Truncate to safe length
  if (s.length > 50) s = s.slice(0, 50)
  return s
}

export function sanitizeKeywords(keywords?: string[]): string[] | undefined {
  if (!keywords || !Array.isArray(keywords)) return undefined
  const cleaned = keywords
    .map((k) => sanitizeKeyword(k))
    .filter(Boolean)
    .slice(0, 10) // limit number of keywords
  return cleaned.length > 0 ? cleaned : undefined
}

export function sanitizeText(
  text?: string,
  maxLen: number = 500
): string | undefined {
  if (!text || typeof text !== 'string') return undefined
  // Remove HTML tags
  let s = text.replace(/<[^>]*>/g, '')
  // Replace control characters and excessive whitespace
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > maxLen) s = s.slice(0, maxLen)
  return s
}

export function sanitizePhrases(phrases?: string[]): string[] | undefined {
  if (!phrases || !Array.isArray(phrases)) return undefined
  const cleaned = phrases
    .map((p) => {
      const s = p
        .replace(/<[^>]*>/g, '')
        .replace(/["'`\;\|\$\(\)\{\}\[\]\^<>]/g, '')
        .trim()
      return s.length > 0 ? s.slice(0, 200) : ''
    })
    .filter(Boolean)
    .slice(0, 20)
  return cleaned.length > 0 ? cleaned : undefined
}

export default { sanitizeKeyword, sanitizeKeywords, sanitizePhrases }
