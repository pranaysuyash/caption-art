import { 
  Upload, Palette, Sparkles, BookOpen, Brush, Mountain, 
  MoveVertical, MessageSquare, Type, Key, Camera, Video 
} from 'lucide-react';
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
        <label className={styles.label}>
          <Upload size={16} className={styles.icon} /> Upload Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && onFile(e.target.files[0])}
          disabled={loading}
          className={styles.fileInput}
        />
      </div>

      <div>
        <label className={styles.label}>
          <Palette size={16} className={styles.icon} /> Text Style
        </label>
        <select
          className={styles.select}
          value={preset}
          onChange={(e) => setPreset(e.target.value as StylePreset)}
        >
          <option value="neon">Sparkles Neon Glow</option>
          <option value="magazine">BookOpen Magazine</option>
          <option value="brush">Brush Brush Script</option>
          <option value="emboss">Mountain Emboss</option>
        </select>
      </div>

      <div>
        <label className={styles.label}>
          <MoveVertical size={16} className={styles.icon} /> Font Size: {fontSize}px
        </label>
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
        <label className={styles.label}>
          <MessageSquare size={16} className={styles.icon} /> Tone of Voice
        </label>
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
        <label className={styles.label}>
          <Type size={16} className={styles.icon} /> Text Overlay
        </label>
        <input
          className={styles.input}
          placeholder="Enter your text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div>
        <label className={styles.label}>
          <Key size={16} className={styles.icon} /> License Key (Optional)
        </label>
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
          <Camera size={18} /> Export PNG
        </button>
        <button
          className={styles.secondaryButton}
          onClick={videoExport}
          disabled={!imageObjUrl}
        >
          <Video size={18} /> Export Video
        </button>
      </div>
    </div>
  );
}

