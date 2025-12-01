/**
 * Font Loader
 * Handles custom font file uploads and loading using CSS Font Loading API
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

export interface LoadedFont {
  name: string;
  family: string;
  file: File;
}

export interface FontLoadResult {
  success: boolean;
  font?: LoadedFont;
  error?: string;
}

const SUPPORTED_FORMATS = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/font-woff',
  'application/font-woff2',
];

const SUPPORTED_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2'];

/**
 * Validates if a file is a supported font format
 * Requirement 3.1: Validate font file format (TTF, OTF, WOFF)
 */
export function validateFontFile(file: File): boolean {
  // Check MIME type
  if (SUPPORTED_FORMATS.includes(file.type)) {
    return true;
  }

  // Fallback: check file extension
  const fileName = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
}

/**
 * Loads a custom font file using CSS Font Loading API
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
export async function loadCustomFont(file: File): Promise<FontLoadResult> {
  try {
    // Requirement 3.1: Validate font file format
    if (!validateFontFile(file)) {
      return {
        success: false,
        error: 'Unsupported font format. Please upload TTF, OTF, or WOFF files.',
      };
    }

    // Generate a unique font family name based on the file name
    const fontFamily = generateFontFamilyName(file.name);

    // Convert file to data URL
    const fontUrl = await fileToDataUrl(file);

    // Requirement 3.2: Load font using CSS Font Loading API
    const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
    
    // Load the font
    const loadedFontFace = await fontFace.load();
    
    // Requirement 3.3: Add to font selection (add to document fonts)
    document.fonts.add(loadedFontFace);

    const loadedFont: LoadedFont = {
      name: file.name,
      family: fontFamily,
      file,
    };

    return {
      success: true,
      font: loadedFont,
    };
  } catch (error) {
    // Requirement 3.5: Handle loading errors and fall back to system font
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to load font: ${errorMessage}`,
    };
  }
}

/**
 * Converts a File to a data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read font file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a unique font family name from a file name
 */
function generateFontFamilyName(fileName: string): string {
  // Remove extension and sanitize
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const sanitized = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  
  return `CustomFont-${sanitized}-${timestamp}`;
}

/**
 * Font Manager class to manage multiple loaded fonts
 */
export class FontManager {
  private loadedFonts: Map<string, LoadedFont> = new Map();

  /**
   * Load and register a custom font
   */
  async loadFont(file: File): Promise<FontLoadResult> {
    const result = await loadCustomFont(file);
    
    if (result.success && result.font) {
      this.loadedFonts.set(result.font.family, result.font);
    }
    
    return result;
  }

  /**
   * Get all loaded fonts
   */
  getLoadedFonts(): LoadedFont[] {
    return Array.from(this.loadedFonts.values());
  }

  /**
   * Get font families for selection dropdown
   */
  getFontFamilies(): string[] {
    return Array.from(this.loadedFonts.keys());
  }

  /**
   * Check if a font family is loaded
   */
  isFontLoaded(family: string): boolean {
    return this.loadedFonts.has(family);
  }

  /**
   * Remove a loaded font
   */
  removeFont(family: string): boolean {
    return this.loadedFonts.delete(family);
  }

  /**
   * Clear all loaded fonts
   */
  clear(): void {
    this.loadedFonts.clear();
  }
}
