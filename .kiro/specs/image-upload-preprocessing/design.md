# Design Document - Image Upload and Preprocessing System

## Overview

This design document outlines the technical approach for the Image Upload and Preprocessing System, which handles file selection, validation, format conversion, image optimization, EXIF data processing, and drag-and-drop functionality with support for multiple files.

## Architecture

### Component Structure

```
frontend/src/
├── lib/
│   ├── upload/
│   │   ├── fileValidator.ts       # File validation
│   │   ├── imageOptimizer.ts      # Image optimization
│   │   ├── exifProcessor.ts       # EXIF data handling
│   │   ├── dragDropHandler.ts     # Drag-and-drop logic
│   │   └── batchUploader.ts       # Multiple file handling
│   └── utils/
│       ├── imageUtils.ts          # Image manipulation utilities
│       └── fileUtils.ts           # File handling utilities
└── components/
    ├── UploadZone.tsx             # Main upload component
    ├── FilePreview.tsx            # File preview display
    ├── UploadProgress.tsx         # Progress indicator
    └── BatchUploadList.tsx        # Multiple file list
```

## Components and Interfaces

### 1. FileValidator

```typescript
interface ValidationResult {
  valid: boolean
  error?: string
  fileType?: string
  fileSize?: number
}

class FileValidator {
  static validate(file: File): ValidationResult
  static isValidImageType(file: File): boolean
  static isValidSize(file: File, maxSize: number): boolean
  static getSupportedFormats(): string[]
}
```

### 2. ImageOptimizer

```typescript
interface OptimizationOptions {
  maxDimension: number
  quality: number
  format?: 'jpeg' | 'png' | 'webp'
}

interface OptimizationResult {
  optimizedImage: Blob
  originalSize: number
  optimizedSize: number
  dimensions: { width: number; height: number }
}

class ImageOptimizer {
  static async optimize(file: File, options: OptimizationOptions): Promise<OptimizationResult>
  static async resize(image: HTMLImageElement, maxDimension: number): Promise<HTMLCanvasElement>
  static async compress(canvas: HTMLCanvasElement, quality: number): Promise<Blob>
}
```

### 3. EXIFProcessor

```typescript
interface EXIFData {
  orientation: number
  make?: string
  model?: string
  dateTime?: string
}

class EXIFProcessor {
  static async readEXIF(file: File): Promise<EXIFData | null>
  static async correctOrientation(image: HTMLImageElement, orientation: number): Promise<HTMLCanvasElement>
  static stripEXIF(blob: Blob): Promise<Blob>
}
```

## Data Models

### UploadState

```typescript
interface UploadState {
  files: UploadFile[]
  isUploading: boolean
  progress: number
  error: string | null
}

interface UploadFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'validating' | 'optimizing' | 'complete' | 'error'
  progress: number
  error?: string
  optimizedSize?: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File type validation
*For any* uploaded file, if the file extension is not JPG, PNG, or WebP, the validation should fail
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 2: File size enforcement
*For any* uploaded file, if the file size exceeds 10MB, the validation should fail
**Validates: Requirements 3.1, 3.2**

### Property 3: Aspect ratio preservation
*For any* image that is resized (excluding extreme aspect ratios > 10:1), the aspect ratio should be preserved within a relative tolerance of 10%. Due to integer pixel rounding constraints, absolute tolerances are not achievable across all dimension combinations. For extreme aspect ratios combined with small target dimensions, the rounding error can exceed this tolerance, which is an acceptable limitation of pixel-based image resizing.
**Validates: Requirements 4.2**

### Property 4: Optimization size reduction
*For any* image that is optimized, the output size should be less than or equal to the input size
**Validates: Requirements 4.1, 4.4**

### Property 5: EXIF orientation correction
*For any* image with EXIF orientation ≠ 1, after correction, the image should display in the correct orientation
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Batch processing independence
*For any* batch of files, if one file fails validation, all other valid files should still be processed
**Validates: Requirements 7.3**

### Property 7: Progress monotonicity
*For any* upload operation, the progress percentage should never decrease
**Validates: Requirements 6.2**

### Property 8: Drag-and-drop equivalence
*For any* file uploaded via drag-and-drop, the result should be identical to uploading via file picker
**Validates: Requirements 1.1, 1.3**

## Error Handling

- Invalid file types: Display supported formats
- Oversized files: Show size limit and current size
- Corrupted images: Provide retry option
- EXIF processing errors: Continue without orientation correction
- Optimization failures: Use original image

## Testing Strategy

### Unit Tests
- Test file validation for each supported format
- Test size limit enforcement
- Test EXIF reading and orientation correction
- Test image resizing and compression
- Test drag-and-drop event handling

### Property-Based Tests
The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).
Each property-based test should run a minimum of 100 iterations.

## Implementation Notes

- Use FileReader API for file reading
- Use Canvas API for image manipulation
- Use exif-js library for EXIF data extraction
- Implement debouncing for drag-over events
- Use Web Workers for heavy image processing
