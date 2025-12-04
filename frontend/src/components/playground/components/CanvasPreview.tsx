import { RefObject } from 'react';
import { Image as ImageIcon, CheckCircle2, FileText } from 'lucide-react';
import { usePlaygroundContext } from '../../../contexts/PlaygroundContext';
import styles from './CanvasPreview.module.css';

type CanvasPreviewProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
};

export function CanvasPreview({
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: CanvasPreviewProps) {
  const { imageObjUrl, licenseOk } = usePlaygroundContext();

  return (
    <div className={styles.canvasPreview}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <ImageIcon size={20} className={styles.icon} /> Live Preview
        </h3>
        {imageObjUrl && (
          <span className={licenseOk ? styles.licensePremium : styles.licenseFree}>
            {licenseOk ? (
              <>
                <CheckCircle2 size={16} /> Premium
              </>
            ) : (
              <>
                <FileText size={16} /> Free (Watermarked)
              </>
            )}
          </span>
        )}
      </div>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
      </div>
    </div>
  );
}
