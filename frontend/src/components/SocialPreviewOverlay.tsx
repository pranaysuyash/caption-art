import { SocialPlatform } from '../lib/social/types';
import styles from './SocialPreviewOverlay.module.css';

export interface SocialPreviewOverlayProps {
  platform: SocialPlatform;
  opacity?: number;
}

export function SocialPreviewOverlay({
  platform,
  opacity = 0.8,
}: SocialPreviewOverlayProps) {
  const containerStyle: React.CSSProperties = {
    opacity: opacity,
  };

  // Mock data
  const username = '@creator';
  const description = 'This is how your video will look #viral #art';
  const music = '♫ Original Sound - Artist Name';

  const renderTikTok = () => (
    <>
      {/* Top Tabs */}
      <div className={styles.tikTokTabs}>
        <span className={styles.tabInactive}>Following</span>
        <span className={styles.tabActive}>For You</span>
      </div>

      {/* Right Sidebar */}
      <div className={styles.tikTokSidebar}>
        <div className={styles.tikTokAvatar} />
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>♥</span>
          <span className={styles.iconSmall}>1.2M</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>💬</span>
          <span className={styles.iconSmall}>10K</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>↗️</span>
          <span className={styles.iconSmall}>50K</span>
        </div>
      </div>

      {/* Bottom Area */}
      <div className={styles.tikTokBottom}>
        <div className={styles.username}>{username}</div>
        <div className={styles.description}>{description}</div>
        <div className={styles.music}>
          <span>{music}</span>
        </div>
      </div>

      {/* Spinning Record */}
      <div className={styles.tikTokRecord} />
    </>
  );

  const renderInstagram = () => (
    <>
      {/* Top Header */}
      <div className={`${styles.igHeader} ${styles.igHeaderLeft}`}>Reels</div>
      <div className={`${styles.igHeader} ${styles.igHeaderRight}`}>📷</div>

      {/* Right Sidebar */}
      <div className={styles.igSidebar}>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>♡</span>
          <span className={styles.iconSmall}>120K</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>💬</span>
          <span className={styles.iconSmall}>500</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>✈️</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>⋮</span>
        </div>
      </div>

      {/* Bottom Area */}
      <div className={styles.igBottom}>
        <div className={styles.igUserInfo}>
          <div className={styles.igAvatar} />
          <span style={{ fontWeight: 600 }}>{username}</span>
          <button aria-label='Follow user' className={styles.igFollowButton}>
            Follow
          </button>
        </div>
        <div className={styles.description}>{description}</div>
        <div className={styles.music}>{music}</div>
      </div>
    </>
  );

  const renderYouTube = () => (
    <>
      {/* Top Header */}
      <div className={styles.ytHeader}>
        <span>🔍</span>
        <span>📷</span>
        <span>⋮</span>
      </div>

      {/* Right Sidebar */}
      <div className={styles.ytSidebar}>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>👍</span>
          <span className={styles.iconSmall}>Like</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>👎</span>
          <span className={styles.iconSmall}>Dislike</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>💬</span>
          <span className={styles.iconSmall}>1.2K</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>↪️</span>
          <span className={styles.iconSmall}>Share</span>
        </div>
        <div className={styles.iconColumn}>
          <span className={styles.iconLarge}>↻</span>
          <span className={styles.iconSmall}>Remix</span>
        </div>
      </div>

      {/* Bottom Area */}
      <div className={styles.ytBottom}>
        <div className={styles.ytUserInfo}>
          <div className={styles.ytAvatar} />
          <span style={{ fontWeight: 600 }}>{username}</span>
          <button
            aria-label='Subscribe to channel'
            className={styles.ytSubscribeButton}
          >
            Subscribe
          </button>
        </div>
        <div className={styles.description}>{description}</div>
      </div>
    </>
  );

  return (
    <div className={styles.container} style={containerStyle}>
      {/* Gradient Overlay for legibility */}
      <div className={styles.gradientOverlay} />

      {platform === 'tiktok' && renderTikTok()}
      {platform === 'instagram-reels' && renderInstagram()}
      {platform === 'youtube-shorts' && renderYouTube()}
    </div>
  );
}
