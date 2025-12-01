import { SocialPlatform } from '../lib/social/types';

export interface SocialPreviewOverlayProps {
  platform: SocialPlatform;
  opacity?: number;
}

export function SocialPreviewOverlay({ platform, opacity = 0.8 }: SocialPreviewOverlayProps) {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none', // Allow clicking through to canvas
    zIndex: 10,
    opacity: opacity,
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  // Mock data
  const username = '@creator';
  const description = 'This is how your video will look #viral #art';
  const music = '♫ Original Sound - Artist Name';

  const renderTikTok = () => (
    <>
      {/* Top Tabs */}
      <div style={{ position: 'absolute', top: '20px', width: '100%', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '16px', fontWeight: 600 }}>
        <span style={{ opacity: 0.7 }}>Following</span>
        <span style={{ borderBottom: '2px solid white', paddingBottom: '4px' }}>For You</span>
      </div>

      {/* Right Sidebar */}
      <div style={{ position: 'absolute', right: '10px', bottom: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ddd', border: '2px solid white' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>♥</span>
          <span style={{ fontSize: '12px' }}>1.2M</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>💬</span>
          <span style={{ fontSize: '12px' }}>10K</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>↗️</span>
          <span style={{ fontSize: '12px' }}>50K</span>
        </div>
      </div>

      {/* Bottom Area */}
      <div style={{ position: 'absolute', bottom: '20px', left: '10px', width: '70%', textAlign: 'left' }}>
        <div style={{ fontWeight: 700, marginBottom: '5px' }}>{username}</div>
        <div style={{ marginBottom: '10px', fontSize: '14px' }}>{description}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
          <span>{music}</span>
        </div>
      </div>
      
      {/* Spinning Record */}
      <div style={{ position: 'absolute', right: '10px', bottom: '20px', width: '40px', height: '40px', borderRadius: '50%', background: '#333', border: '8px solid #111' }} />
    </>
  );

  const renderInstagram = () => (
    <>
      {/* Top Header */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '24px', fontWeight: 700 }}>Reels</div>
      <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '24px' }}>📷</div>

      {/* Right Sidebar */}
      <div style={{ position: 'absolute', right: '10px', bottom: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>♡</span>
          <span style={{ fontSize: '12px' }}>120K</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>💬</span>
          <span style={{ fontSize: '12px' }}>500</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>✈️</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>⋮</span>
        </div>
      </div>

      {/* Bottom Area */}
      <div style={{ position: 'absolute', bottom: '30px', left: '15px', width: '80%', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ddd' }} />
          <span style={{ fontWeight: 600 }}>{username}</span>
          <button aria-label="Follow user" style={{ background: 'transparent', border: '1px solid white', color: 'white', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>Follow</button>
        </div>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>{description}</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>{music}</div>
      </div>
    </>
  );

  const renderYouTube = () => (
    <>
      {/* Top Header */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '20px', fontSize: '20px' }}>
        <span>🔍</span>
        <span>📷</span>
        <span>⋮</span>
      </div>

      {/* Right Sidebar */}
      <div style={{ position: 'absolute', right: '10px', bottom: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>👍</span>
          <span style={{ fontSize: '12px' }}>Like</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>👎</span>
          <span style={{ fontSize: '12px' }}>Dislike</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>💬</span>
          <span style={{ fontSize: '12px' }}>1.2K</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>↪️</span>
          <span style={{ fontSize: '12px' }}>Share</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>↻</span>
          <span style={{ fontSize: '12px' }}>Remix</span>
        </div>
      </div>

      {/* Bottom Area */}
      <div style={{ position: 'absolute', bottom: '20px', left: '15px', width: '75%', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ddd' }} />
          <span style={{ fontWeight: 600 }}>{username}</span>
          <button aria-label="Subscribe to channel" style={{ background: 'white', color: 'black', border: 'none', borderRadius: '15px', padding: '4px 12px', fontSize: '12px', fontWeight: 600 }}>Subscribe</button>
        </div>
        <div style={{ fontSize: '14px' }}>{description}</div>
      </div>
    </>
  );

  return (
    <div style={containerStyle}>
      {/* Gradient Overlay for legibility */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '30%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
        pointerEvents: 'none',
      }} />
      
      {platform === 'tiktok' && renderTikTok()}
      {platform === 'instagram-reels' && renderInstagram()}
      {platform === 'youtube-shorts' && renderYouTube()}
    </div>
  );
}
