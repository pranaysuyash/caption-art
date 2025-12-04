import { Palette, Bot, Wand2, Type, Share2 } from 'lucide-react';
import styles from './PlaygroundHeader.module.css';

export function PlaygroundHeader() {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>
        <Palette className={styles.icon} size={32} />
        Caption Art Playground
      </h1>
      <p className={styles.subtitle}>
        Complete creative studio: <Bot size={16} /> AI captions • <Wand2 size={16} /> Smart masking • <Type size={16} /> Text effects • <Share2 size={16} /> Multi-format export
      </p>
    </div>
  );
}
