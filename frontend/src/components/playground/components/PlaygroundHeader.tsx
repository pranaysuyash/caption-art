import styles from './PlaygroundHeader.module.css';

export function PlaygroundHeader() {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>🎨 Caption Art Playground</h1>
      <p className={styles.subtitle}>
        Complete creative studio: AI captions • Smart masking • Text effects •
        Multi-format export
      </p>
    </div>
  );
}
