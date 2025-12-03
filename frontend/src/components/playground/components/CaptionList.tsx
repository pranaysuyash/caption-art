import { usePlaygroundContext } from '../../../contexts/PlaygroundContext';
import styles from './CaptionList.module.css';

export function CaptionList() {
  const { captions, setText } = usePlaygroundContext();

  if (captions.length === 0) return null;

  return (
    <div className={styles.captionList}>
      <h3 className={styles.title}>🤖 AI Generated Captions</h3>
      <div className={styles.grid}>
        {captions.map((c, i) => (
          <button
            key={i}
            onClick={() => setText(c)}
            className={styles.captionButton}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
