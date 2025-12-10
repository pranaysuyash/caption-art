import { useState, useCallback, useRef } from 'react';
import { 
  ProgressInfo,
  ProgressTracker,
  createSimpleTracker,
  createStepTracker
} from './ProgressTracker';

/**
 * React hook for using the ProgressTracker
 */
export function useProgress(operation: string, canCancel: boolean = false) {
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const trackerRef = useRef<ProgressTracker | null>(null);

  const startSimple = useCallback(() => {
    const tracker = createSimpleTracker(operation, canCancel);
    tracker.start();
    trackerRef.current = tracker;
    setProgressInfo(tracker.getInfo());
    return tracker;
  }, [operation, canCancel]);

  const startWithSteps = useCallback((stepNames: string[]) => {
    const tracker = createStepTracker(operation, stepNames, canCancel);
    tracker.start();
    trackerRef.current = tracker;
    setProgressInfo(tracker.getInfo());
    return tracker;
  }, [operation, canCancel]);

  const updateProgress = useCallback((percentage: number, message?: string) => {
    if (trackerRef.current) {
      trackerRef.current.updateProgress(percentage, message);
      setProgressInfo(trackerRef.current.getInfo());
    }
  }, []);

  const complete = useCallback((message?: string) => {
    if (trackerRef.current) {
      trackerRef.current.complete(message);
      setProgressInfo(trackerRef.current.getInfo());
    }
  }, []);

  const error = useCallback((err?: Error) => {
    if (trackerRef.current) {
      trackerRef.current.error(err);
      setProgressInfo(trackerRef.current.getInfo());
    }
  }, []);

  const cancel = useCallback(() => {
    if (trackerRef.current) {
      trackerRef.current.cancel();
      setProgressInfo(trackerRef.current.getInfo());
    }
  }, []);

  const reset = useCallback(() => {
    if (trackerRef.current) {
      trackerRef.current.reset();
      setProgressInfo(null);
      trackerRef.current = null;
    }
  }, []);

  return {
    progressInfo,
    isActive: progressInfo?.state === 'running',
    startSimple,
    startWithSteps,
    updateProgress,
    complete,
    error,
    cancel,
    reset
  };
}

export default useProgress;
