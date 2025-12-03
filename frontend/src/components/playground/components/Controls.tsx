import { usePlaygroundContext } from '../../../contexts/PlaygroundContext';
import { verifyLicense } from '../../../lib/api';
import { StylePreset, Tone } from '../../../hooks/usePlayground';
import styles from './Controls.module.css';

type ControlsProps = {
  exportImg: () => void;
  videoExport: () => void;
};

export function Controls({ exportImg, videoExport }: ControlsProps) {
  const {
    loading,
    onFile,
    preset,
    setPreset,
    fontSize,
    setFontSize,
    text,
    setText,
    tone,
    setTone,
    setLicenseOk,
    toast,
    imageObjUrl,
  } = usePlaygroundContext();

  return (
    <div className={styles.controls}>
      <div>
        <label className={styles.label}>📤 Upload Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && onFile(e.target.files[0])}
          disabled={loading}
          className={styles.fileInput}
        />
      </div>

      <div>
        <label className={styles.label}>🎨 Text Style</label>
        <select
          className={styles.select}
          value={preset}
          onChange={(e) => setPreset(e.target.value as StylePreset)}
        >
          <option value="neon">✨ Neon Glow</option>
          <option value="magazine">📖 Magazine</option>
          <option value="brush">🖌️ Brush Script</option>
          <option value="emboss">🏔️ Emboss</option>
        </select>
      </div>

      <div>
        <label className={styles.label}>📏 Font Size: {fontSize}px</label>
        <input
          className={styles.range}
          type="range"
          min={24}
          max={160}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
        />
      </div>

      <div>
        <label className={styles.label}>🎭 Tone of Voice</label>
        <select
          className={styles.select}
          value={tone}
          onChange={(e) => setTone(e.target.value as Tone)}
        >
          <option value="default">Default</option>
          <option value="witty">Witty</option>
          <option value="inspirational">Inspirational</option>
          <option value="formal">Formal</option>
        </select>
      </div>

      <div>
        <label className={styles.label}>✏️ Text Overlay</label>
        <input
          className={styles.input}
          placeholder="Enter your text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div>
        <label className={styles.label}>🪪 License Key (Optional)</label>
        <input
          className={styles.input}
          placeholder="Premium license key"
          onBlur={async (e) => {
            const key = e.currentTarget.value.trim();
            if (!key) return;
            try {
              const d = await verifyLicense(key);
              setLicenseOk(!!d.ok);
              toast.success(d.ok ? 'Premium unlocked! 🎉' : 'Invalid license key');
            } catch (error) {
              toast.error('License verification failed');
            }
          }}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button
          className={styles.primaryButton}
          onClick={exportImg}
          disabled={!imageObjUrl}
        >
          📷 Export PNG
        </button>
        <button
          className={styles.secondaryButton}
          onClick={videoExport}
          disabled={!imageObjUrl}
        >
          🎥 Export Video
        </button>
      </div>
    </div>
  );
}

