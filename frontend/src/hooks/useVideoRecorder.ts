import { useState, useCallback, useRef } from 'react';

interface UseVideoRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
}

export function useVideoRecorder(canvasRef: React.RefObject<HTMLCanvasElement>): UseVideoRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas not found');
      return;
    }

    try {
      // Capture stream at 30fps
      const stream = canvas.captureStream(30);
      
      // Prefer standard codecs
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000 // 5Mbps for high quality
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setError(null);

      // Start timer
      startTimeRef.current = Date.now();
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Browser might not support it.');
    }
  }, [canvasRef]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        chunksRef.current = [];
        resolve(blob);
      };

      mediaRecorder.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });
  }, []);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    error
  };
}
