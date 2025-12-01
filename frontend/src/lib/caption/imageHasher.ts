/**
 * Image hashing utility for cache key generation
 * Requirements: 6.1, 6.2
 */

/**
 * Hash an image for cache key generation
 * 
 * Reads the first 10KB of the image file and calculates a SHA-256 hash.
 * This provides a fast, unique identifier for caching purposes.
 * 
 * @param imageDataUrl - Base64 data URL of the image
 * @returns SHA-256 hash as a hexadecimal string
 * 
 * Requirements: 6.1, 6.2
 */
export async function hashImage(imageDataUrl: string): Promise<string> {
  // Extract base64 data from data URL
  const base64Data = imageDataUrl.split(',')[1] || imageDataUrl
  
  // For performance, hash first 10KB of data (10240 bytes)
  const sampleSize = Math.min(base64Data.length, 10240)
  const sample = base64Data.substring(0, sampleSize)
  
  // Convert to Uint8Array for hashing
  const encoder = new TextEncoder()
  const data = encoder.encode(sample)
  
  // Calculate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Hash a File object for cache key generation
 * 
 * Reads the first 10KB of the file and calculates a SHA-256 hash.
 * This provides a fast, unique identifier for caching purposes.
 * 
 * @param file - File object to hash
 * @returns SHA-256 hash as a hexadecimal string
 * 
 * Requirements: 6.1, 6.2
 */
export async function hashImageFile(file: File): Promise<string> {
  // Read first 10KB for fast hashing
  const chunk = file.slice(0, 10240)
  
  // Convert to ArrayBuffer
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(chunk)
  })
  
  // Calculate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}
