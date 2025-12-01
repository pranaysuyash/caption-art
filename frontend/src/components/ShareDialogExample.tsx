/**
 * Share Dialog Example Component
 * Demonstrates usage of the ShareDialog component
 */

import { useState } from 'react';
import { ShareDialog } from './ShareDialog';
import type { MultiPlatformResult } from '../lib/social/types';

export function ShareDialogExample() {
  const [showDialog, setShowDialog] = useState(false);
  const [result, setResult] = useState<MultiPlatformResult | null>(null);

  // Sample image data URL (1x1 blue pixel)
  const sampleImageDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const handleSuccess = (postResult: MultiPlatformResult) => {
    setResult(postResult);
    console.log('Post result:', postResult);
  };

  return (
    <div className="share-dialog-example">
      <div className="example-container">
        <h1>Share Dialog Example</h1>
        <p>Click the button below to open the share dialog</p>

        <button className="example-button" onClick={() => setShowDialog(true)}>
          📤 Share to Social Media
        </button>

        {result && (
          <div className="example-result">
            <h3>Last Post Result:</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>

      {showDialog && (
        <ShareDialog
          imageDataUrl={sampleImageDataUrl}
          initialCaption="Check out my amazing caption art! 🎨"
          onClose={() => setShowDialog(false)}
          onSuccess={handleSuccess}
        />
      )}

      <style>{`
        .share-dialog-example {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .example-container {
          max-width: 600px;
          width: 100%;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .example-container h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }

        .example-container p {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .example-button {
          width: 100%;
          padding: 1rem 2rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .example-button:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .example-result {
          margin-top: 2rem;
          padding: 1rem;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }

        .example-result h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .example-result pre {
          font-size: 0.75rem;
          overflow-x: auto;
          color: #374151;
        }
      `}</style>
    </div>
  );
}
