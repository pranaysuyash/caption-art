import { useState, useCallback } from 'react';
import { 
  ErrorInfo,
  errorManager
} from './ErrorManager';

/**
 * React hook for using the ErrorManager
 */
export function useErrors() {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const processError = useCallback((error: Error | unknown, operation: string) => {
    const errorInfo = errorManager.processError(error, operation);
    setErrors(prev => [...prev, errorInfo]);
    return errorInfo;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    errorManager.clearErrorLog();
  }, []);

  const getErrorLog = useCallback(() => {
    return errorManager.getErrorLog();
  }, []);

  return {
    errors,
    hasErrors: errors.length > 0,
    processError,
    clearErrors,
    getErrorLog
  };
}

export default useErrors;
