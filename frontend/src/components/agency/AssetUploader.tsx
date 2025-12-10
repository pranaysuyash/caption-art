import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import apiFetch from '../../lib/api/httpClient';

interface AssetUploaderProps {
  workspaceId: string;
  campaignId: string;
  onUploadComplete: () => void;
  onClose?: () => void;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function AssetUploader({ 
  workspaceId, 
  campaignId, 
  onUploadComplete,
  onClose 
}: AssetUploaderProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    
    const newFiles: FileWithProgress[] = droppedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newFiles: FileWithProgress[] = selectedFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending'
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const fileWithProgress = files[i];
      
      if (fileWithProgress.status === 'complete') continue;
      
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' as const } : f
      ));

      const formData = new FormData();
      formData.append('file', fileWithProgress.file);
      formData.append('workspaceId', workspaceId);
      formData.append('campaignId', campaignId);

      try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setFiles(prev => prev.map((f, idx) => 
              idx === i ? { ...f, progress: percent } : f
            ));
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setFiles(prev => prev.map((f, idx) => 
                idx === i ? { ...f, status: 'complete' as const, progress: 100 } : f
              ));
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });
          
          xhr.open('POST', `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/assets/upload`);
          xhr.send(formData);
        });
      } catch (err) {
        console.error(`Failed to upload ${fileWithProgress.file.name}:`, err);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error' as const, 
            error: err instanceof Error ? err.message : 'Upload failed' 
          } : f
        ));
      }
    }

    setUploading(false);
    
    // Check if all uploads completed successfully
    const allComplete = files.every(f => f.status === 'complete');
    if (allComplete) {
      onUploadComplete();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getStatusColor = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'complete': return '#22c55e';
      case 'error': return '#ef4444';
      case 'uploading': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'complete': return '✓ Complete';
      case 'error': return '✗ Failed';
      case 'uploading': return 'Uploading...';
      default: return 'Pending';
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-surface, white)',
      borderRadius: '16px',
      padding: '2rem',
      maxWidth: '800px',
      width: '90vw',
      maxHeight: '90vh',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-heading, sans-serif)',
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'var(--color-text, #1f2937)',
          margin: 0
        }}>
          Upload Assets
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--color-text-secondary, #6b7280)',
            padding: '0.5rem'
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => document.getElementById('file-input')?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--color-primary, #2563eb)' : 'var(--color-border, #d1d5db)'}`,
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: dragActive ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-background, #f8fafc)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <FolderOpen size={48} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary, #9ca3af)' }} />
        </div>
        <h3 style={{
          fontFamily: 'var(--font-heading, sans-serif)',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'var(--color-text, #1f2937)',
          margin: '0 0 0.5rem 0'
        }}>
          Drop files here or click to browse
        </h3>
        <p style={{ 
          color: 'var(--color-text-secondary, #6b7280)', 
          fontSize: '0.875rem',
          margin: 0
        }}>
          Supports images (JPG, PNG, WebP) and videos (MP4, MOV)
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="flex-mobile-column" style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '0.5rem'
          }}>
            <h4 style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--color-text, #1f2937)',
              margin: 0
            }}>
              Selected Files ({files.length})
            </h4>
            {!uploading && (
              <button
                onClick={() => setFiles([])}
                className="btn btn-ghost"
                style={{ fontSize: '0.875rem' }}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {files.map((fileWithProgress, index) => (
              <div
                key={index}
                className="flex-mobile-column"
                style={{
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--color-background, #f8fafc)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #e5e7eb)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    color: 'var(--color-text, #1f2937)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {fileWithProgress.file.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--color-text-secondary, #6b7280)',
                    marginTop: '0.25rem'
                  }}>
                    {formatFileSize(fileWithProgress.file.size)}
                  </div>
                  
                  {/* Progress Bar */}
                  {fileWithProgress.status === 'uploading' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{
                        height: '4px',
                        backgroundColor: 'var(--color-border, #e5e7eb)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${fileWithProgress.progress}%`,
                          backgroundColor: 'var(--color-primary, #2563eb)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                        marginTop: '0.25rem'
                      }}>
                        {fileWithProgress.progress}%
                      </div>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {fileWithProgress.error && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#ef4444',
                      marginTop: '0.25rem'
                    }}>
                      {fileWithProgress.error}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  backgroundColor: `${getStatusColor(fileWithProgress.status)}20`,
                  color: getStatusColor(fileWithProgress.status),
                  whiteSpace: 'nowrap'
                }}>
                  {getStatusLabel(fileWithProgress.status)}
                </div>

                {/* Remove Button */}
                {!uploading && fileWithProgress.status !== 'complete' && (
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      color: 'var(--color-text-secondary, #6b7280)',
                      fontSize: '1.25rem'
                    }}
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="btn-group" style={{ marginTop: '1.5rem' }}>
            <button
              onClick={onClose}
              disabled={uploading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0 || files.every(f => f.status === 'complete')}
              className="btn btn-primary"
            >
              {uploading 
                ? `Uploading... (${files.filter(f => f.status === 'complete').length}/${files.length})`
                : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
