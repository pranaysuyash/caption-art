import { usePlaygroundContext } from '../../../contexts/PlaygroundContext';
import styles from './ProgressIndicator.module.css';

export function ProgressIndicator() {
  const { loading, processingStatus, uploadProgress } = usePlaygroundContext();

  if (!loading || !processingStatus) return null;

  return (
    <div className={styles.progressIndicator}>
      <div className={styles.status}>{processingStatus}</div>
      <div className={styles.progressBar}>
        <div
          className={styles.progress}
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
    </div>
  );
}
