import { useState } from 'react';
import { useToast } from '../components/Toast';
import { getCaptions, getMask, getPresignedUrl } from '../lib/api';

export type StylePreset = 'neon' | 'magazine' | 'brush' | 'emboss';
export type Tone = 'default' | 'witty' | 'inspirational' | 'formal';

export function usePlayground() {
  const [file, setFile] = useState<File | null>(null);
  const [imageObjUrl, setImageObjUrl] = useState<string>('');
  const [s3Key, setS3Key] = useState<string>('');
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
    try {
      setFile(f);
      setLoading(true);
      setUploadProgress(0);
      setProcessingStatus('Uploading image...');

      const obj = URL.createObjectURL(f);
      setImageObjUrl(obj);

      setUploadProgress(25);
      setProcessingStatus('Getting upload URL...');

      const { url, key } = await getPresignedUrl(f.name, f.type);
      setS3Key(key);

      setUploadProgress(50);
      setProcessingStatus('Uploading to cloud...');

      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': f.type },
        body: f,
      });

      setUploadProgress(75);
      setProcessingStatus('Generating captions...');

      const cap = await getCaptions(key, tone);
      setCaptions([cap.base, ...(cap.variants || [])].filter(Boolean));

      setUploadProgress(90);
      setProcessingStatus('Generating mask...');

      const m = await getMask(key);
      setMaskUrl(m.maskUrl);

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
      setLoading(false);
      setProcessingStatus('');
      setUploadProgress(0);
    }
  };

  return {
    file,
    imageObjUrl,
    s3Key,
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
