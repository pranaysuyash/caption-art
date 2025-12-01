/**
 * UploadExample Component
 * 
 * Example demonstrating the usage of the upload components together
 */

import { useState } from 'react'
import { UploadZone } from './UploadZone'
import { UploadProgress } from './UploadProgress'
import { FilePreview } from './FilePreview'
import { BatchUploadList } from './BatchUploadList'
import { BatchUploader, type BatchProcessResult } from '../lib/upload/batchUploader'
import { FileValidator } from '../lib/upload/fileValidator'

export function UploadExample() {
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'validating' | 'processing' | 'optimizing' | 'complete' | 'error'>('validating')
  const [batchResults, setBatchResults] = useState<BatchProcessResult | null>(null)
  const [error, setError] = useState<string>('')

  // Handle single file upload
  const handleSingleFile = async (file: File) => {
    setCurrentFile(file)
    setIsUploading(true)
    setProgress(0)
    setStatus('validating')
    setError('')

    // Validate file
    const validation = FileValidator.validate(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      setStatus('error')
      setIsUploading(false)
      return
    }

    setProgress(33)
    setStatus('processing')

    // Create object URL for preview
    const url = URL.createObjectURL(file)
    setImageUrl(url)

    setProgress(66)
    setStatus('optimizing')

    // Simulate optimization
    await new Promise(resolve => setTimeout(resolve, 1000))

    setProgress(100)
    setStatus('complete')
    setIsUploading(false)
  }

  // Handle batch file upload
  const handleBatchFiles = async (files: File[]) => {
    setIsUploading(true)
    setProgress(0)
    setStatus('processing')
    setError('')

    try {
      const results = await BatchUploader.processFiles(files, (index, total, status) => {
        const percentage = Math.round(((index + 1) / total) * 100)
        setProgress(percentage)
        setStatus(status as any)
      })

      setBatchResults(results)
      setStatus('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="upload-example">
      <h2>Single File Upload</h2>
      <UploadZone
        onFile={handleSingleFile}
        loading={isUploading}
        currentFile={currentFile}
        imageObjUrl={imageUrl}
      />

      <UploadProgress
        visible={isUploading}
        progress={progress}
        status={status}
        filename={currentFile?.name}
        error={error}
      />

      {currentFile && imageUrl && !isUploading && (
        <FilePreview
          file={currentFile}
          imageUrl={imageUrl}
          originalSize={currentFile.size}
          onRemove={() => {
            setCurrentFile(null)
            setImageUrl('')
            URL.revokeObjectURL(imageUrl)
          }}
        />
      )}

      <h2 style={{ marginTop: '2rem' }}>Batch File Upload</h2>
      <UploadZone
        onFile={() => {}} // Required but not used in multiple mode
        onFiles={handleBatchFiles}
        loading={isUploading}
        multiple={true}
      />

      {batchResults && (
        <BatchUploadList
          results={batchResults.results}
          successCount={batchResults.successCount}
          failureCount={batchResults.failureCount}
          totalProcessed={batchResults.totalProcessed}
          isProcessing={isUploading}
        />
      )}
    </div>
  )
}
