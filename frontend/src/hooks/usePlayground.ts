import { useState } from 'react';
import { useToast } from '../components/Toast';
import { getCaptions, getMask, getPresignedUrl } from '../lib/api';

export type StylePreset = 'neon' | 'magazine' | 'brush' | 'emboss';
export type Tone = 'default' | 'witty' | 'inspirational' | 'formal';

export function usePlayground() {
  const [file, setFile] = useState<File | null>(null);
  const [imageObjUrl, setImageObjUrl] = useState<string>('');
  const [s3Key, setS3Key] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(''); // Full S3 URL for API calls
  const [maskUrl, setMaskUrl] = useState<string>('');
  const [captions, setCaptions] = useState<string[]>([]);
  const [text, setText] = useState<string>('');
  const [preset, setPreset] = useState<StylePreset>('neon');
  const [fontSize, setFontSize] = useState<number>(96);
  const [tone, setTone] = useState<Tone>('default');
  const [textPosition, setTextPosition] = useState({ x: 0.1, y: 0.8 });
  const [licenseOk, setLicenseOk] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const toast = useToast();

  const onFile = async (f: File) => {
    // Validate file
    if (!f) {
      toast.error('No file selected');
      return;
    }

    if (f.size > 50 * 1024 * 1024) {
      toast.error('File too large (max 50MB)');
      return;
    }

    if (!f.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setFile(f);
      setLoading(true);
      setUploadProgress(0);
      setProcessingStatus('Uploading image...');

      const obj = URL.createObjectURL(f);
      setImageObjUrl(obj);

      // Step 1: Get presigned URL
      setUploadProgress(25);
      setProcessingStatus('Getting upload URL...');

      let presignedData;
      try {
        presignedData = await getPresignedUrl(f.name, f.type);
      } catch (error) {
        throw new Error(
          `Failed to get upload URL: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }

      const { url, key } = presignedData;
      if (!url || !key) {
        throw new Error('Invalid presigned URL response');
      }

      setS3Key(key);

      // Step 2: Upload to S3 with retry logic
      setUploadProgress(50);
      setProcessingStatus('Uploading to cloud...');

      let uploadResponse: Response | null = null;
      let uploadAttempt = 0;
      const maxRetries = 2;

      while (uploadAttempt <= maxRetries && !uploadResponse?.ok) {
        try {
          uploadResponse = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': f.type },
            body: f,
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });

          if (!uploadResponse.ok) {
            throw new Error(
              `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`
            );
          }
        } catch (error) {
          uploadAttempt++;
          if (uploadAttempt > maxRetries) {
            throw new Error(
              `Upload failed after ${maxRetries + 1} attempts: ${
                error instanceof Error ? error.message : 'Network error'
              }`
            );
          }
          setProcessingStatus(
            `Upload failed, retrying (attempt ${uploadAttempt})...`
          );
          await new Promise((r) => setTimeout(r, 1000 * uploadAttempt)); // Exponential backoff
        }
      }

      // Construct the full S3 URL from the key
      const s3BaseUrl = url.split('?')[0].replace(key, '');
      const fullImageUrl = `${s3BaseUrl}${key}`;
      setImageUrl(fullImageUrl);

      // Step 3: Generate captions with error handling
      setUploadProgress(75);
      setProcessingStatus('Generating captions...');

      let captions_: string[] = [];
      try {
        const cap = await getCaptions(fullImageUrl, tone);
        captions_ = [cap.baseCaption, ...(cap.variants || [])].filter(Boolean);
        setCaptions(captions_);

        if (captions_.length === 0) {
          toast.info('No captions generated. Please try again.');
        }
      } catch (error) {
        console.warn('Caption generation failed:', error);
        toast.error(
          `Caption generation failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        // Continue with mask generation even if captions fail
      }

      // Step 4: Generate mask with error handling
      setUploadProgress(90);
      setProcessingStatus('Generating mask...');

      try {
        const m = await getMask(fullImageUrl);
        setMaskUrl(m.maskUrl || '');
      } catch (error) {
        console.warn('Mask generation failed:', error);
        toast.warn(
          `Mask generation failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        // Mask is optional, so continue
      }

      // Success!
      setUploadProgress(100);
      setProcessingStatus('Complete!');
      setLoading(false);

      toast.success('Image processed successfully!');

      setTimeout(() => {
        setProcessingStatus('');
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Processing error:', error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Failed to process image. Please try again.';
      toast.error(errorMsg);

      // Reset state
      setLoading(false);
      setProcessingStatus('');
      setUploadProgress(0);

      // Clean up partial state
      if (imageObjUrl) {
        URL.revokeObjectURL(imageObjUrl);
        setImageObjUrl('');
      }
    }
  };

  return {
    file,
    imageObjUrl,
    s3Key,
    imageUrl,
    maskUrl,
    captions,
    text,
    setText,
    preset,
    setPreset,
    fontSize,
    setFontSize,
    tone,
    setTone,
    textPosition,
    setTextPosition,
    licenseOk,
    setLicenseOk,
    loading,
    uploadProgress,
    processingStatus,
    onFile,
    toast,
  };
}
