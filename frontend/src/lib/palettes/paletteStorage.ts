/**
 * Palette Storage
 * 
 * Manages persistence of color palettes to localStorage.
 * Handles saving, loading, and deleting custom palettes.
 */

import type { ColorPalette, StoredPaletteData } from './types'
import {
  PALETTE_STORAGE_KEY,
  PALETTE_SYSTEM_VERSION,
  isLocalStorageAvailable,
  deepClone,
} from './utils'

/**
 * PaletteStorage class for managing palette persistence
 */
export class PaletteStorage {
  private inMemoryFallback: StoredPaletteData | null = null
  private useInMemory: boolean = false

  constructor() {
    // Check if localStorage is available
    this.useInMemory = !isLocalStorageAvailable()
    
    if (this.useInMemory) {
      console.warn('localStorage is not available. Using in-memory storage fallback.')
      this.inMemoryFallback = this.getDefaultStorageData()
    }
  }

  /**
   * Get default storage data structure
   */
  private getDefaultStorageData(): StoredPaletteData {
    return {
      currentPaletteId: null,
      customPalettes: [],
      lastUpdated: Date.now(),
      version: PALETTE_SYSTEM_VERSION,
    }
  }

  /**
   * Load all storage data
   */
  private loadStorageData(): StoredPaletteData {
    if (this.useInMemory) {
      return deepClone(this.inMemoryFallback!)
    }

    try {
      const data = localStorage.getItem(PALETTE_STORAGE_KEY)
      
      if (!data) {
        return this.getDefaultStorageData()
      }

      const parsed = JSON.parse(data) as StoredPaletteData
      
      // Validate structure
      if (!this.isValidStorageData(parsed)) {
        console.warn('Invalid storage data structure. Resetting to defaults.')
        return this.getDefaultStorageData()
      }

      return parsed
    } catch (error) {
      console.error('Error loading palette storage data:', error)
      return this.getDefaultStorageData()
    }
  }

  /**
   * Save all storage data
   */
  private saveStorageData(data: StoredPaletteData): void {
    data.lastUpdated = Date.now()

    if (this.useInMemory) {
      this.inMemoryFallback = deepClone(data)
      return
    }

    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(PALETTE_STORAGE_KEY, serialized)
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('localStorage is full. Please delete some custom palettes.')
      }
      throw new Error(`Failed to save palette data: ${error}`)
    }
  }

  /**
   * Validate storage data structure
   */
  private isValidStorageData(data: unknown): data is StoredPaletteData {
    if (!data || typeof data !== 'object') {
      return false
    }

    const d = data as Record<string, unknown>

    return (
      (d.currentPaletteId === null || typeof d.currentPaletteId === 'string') &&
      Array.isArray(d.customPalettes) &&
      typeof d.lastUpdated === 'number' &&
      typeof d.version === 'string'
    )
  }

  /**
   * Save a palette to storage
   * 
   * @param palette - The palette to save
   * @throws Error if storage fails
   */
  savePalette(palette: ColorPalette): void {
    const data = this.loadStorageData()

    // Check if palette already exists
    const existingIndex = data.customPalettes.findIndex((p) => p.id === palette.id)

    if (existingIndex >= 0) {
      // Update existing palette
      data.customPalettes[existingIndex] = deepClone(palette)
    } else {
      // Add new palette
      data.customPalettes.push(deepClone(palette))
    }

    this.saveStorageData(data)
  }

  /**
   * Load a palette from storage by ID
   * 
   * @param paletteId - The ID of the palette to load
   * @returns The palette if found, null otherwise
   */
  loadPalette(paletteId: string): ColorPalette | null {
    const data = this.loadStorageData()
    const palette = data.customPalettes.find((p) => p.id === paletteId)
    return palette ? deepClone(palette) : null
  }

  /**
   * Load all custom palettes from storage
   * 
   * @returns Array of all custom palettes
   */
  loadAllPalettes(): ColorPalette[] {
    const data = this.loadStorageData()
    return data.customPalettes.map((p) => deepClone(p))
  }

  /**
   * Delete a palette from storage
   * 
   * @param paletteId - The ID of the palette to delete
   * @returns true if palette was deleted, false if not found
   */
  deletePalette(paletteId: string): boolean {
    const data = this.loadStorageData()
    const initialLength = data.customPalettes.length

    data.customPalettes = data.customPalettes.filter((p) => p.id !== paletteId)

    if (data.customPalettes.length === initialLength) {
      // Palette not found
      return false
    }

    // If the deleted palette was the current one, clear current palette
    if (data.currentPaletteId === paletteId) {
      data.currentPaletteId = null
    }

    this.saveStorageData(data)
    return true
  }

  /**
   * Get the current palette ID
   * 
   * @returns The current palette ID or null if none is set
   */
  getCurrentPaletteId(): string | null {
    const data = this.loadStorageData()
    return data.currentPaletteId
  }

  /**
   * Set the current palette ID
   * 
   * @param paletteId - The ID of the palette to set as current
   */
  setCurrentPaletteId(paletteId: string | null): void {
    const data = this.loadStorageData()
    data.currentPaletteId = paletteId
    this.saveStorageData(data)
  }

  /**
   * Clear all custom palettes and reset storage
   */
  clearAll(): void {
    const data = this.getDefaultStorageData()
    this.saveStorageData(data)
  }

  /**
   * Check if storage is using in-memory fallback
   */
  isUsingInMemoryFallback(): boolean {
    return this.useInMemory
  }
}

/**
 * Default singleton instance
 */
export const paletteStorage = new PaletteStorage()

