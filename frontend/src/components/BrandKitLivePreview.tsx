import React from 'react';

interface BrandKitLivePreviewProps {
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  toneStyle: string;
}

export function BrandKitLivePreview({
  colors,
  fonts,
  toneStyle,
}: BrandKitLivePreviewProps) {
  const getToneEmoji = (tone: string) => {
    switch (tone) {
      case 'playful': return '🎨';
      case 'bold': return '⚡';
      case 'luxury': return '✨';
      case 'edgy': return '🔥';
      case 'minimal': return '⚪';
      default: return '💼';
    }
  };

  const getSampleText = (tone: string) => {
    switch (tone) {
      case 'playful':
        return "Ready to sprinkle some magic on your feed? ✨ Our new collection is popping with color and joy! 🎈 #FunVibes";
      case 'bold':
        return "DOMINATE your market. 🚀 Stop settling for average. Unleash your potential today. 💥 #Hustle";
      case 'luxury':
        return "Experience the epitome of elegance. 🥂 Timeless design meets modern sophistication. Indulge yourself. 💎 #LuxuryLife";
      case 'edgy':
        return "Break the rules. 🤘 Normal is boring. Stand out or step aside. 💀 #Rebel";
      case 'minimal':
        return "Less is more. 🌿 Simplicity is the ultimate sophistication. Breathe. ☁️ #Minimalism";
      default:
        return "Elevate your business with our professional solutions. 📈 Reliability you can trust. #BusinessGrowth";
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Live Preview</h3>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '2rem',
        padding: '1rem'
      }}>
        {/* Instagram Style Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          overflow: 'hidden', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          maxWidth: '350px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: colors.primary,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.8rem'
            }}>
              {getToneEmoji(toneStyle)}
            </div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: '0.9rem', color: '#000' }}>
              Your Brand
            </div>
          </div>

          {/* Image Placeholder */}
          <div style={{ 
            height: '250px', 
            background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.tertiary} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.primary,
            fontSize: '1.5rem',
            fontWeight: 600,
            fontFamily: fonts.heading,
            textAlign: 'center',
            padding: '1rem'
          }}>
            Visual Content
          </div>

          {/* Actions */}
          <div style={{ padding: '0.75rem', display: 'flex', gap: '1rem' }}>
            <span style={{ color: colors.primary }}>❤️</span>
            <span style={{ color: colors.primary }}>💬</span>
            <span style={{ color: colors.primary }}>🚀</span>
          </div>

          {/* Caption */}
          <div style={{ padding: '0 0.75rem 1rem 0.75rem' }}>
            <div style={{ fontFamily: fonts.body, fontSize: '0.9rem', color: '#1f2937', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>Your Brand</span>
              {getSampleText(toneStyle)}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280', fontFamily: fonts.body }}>
              View all 12 comments
            </div>
          </div>
        </div>

        {/* Color Palette Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ margin: 0, fontFamily: fonts.heading, color: 'var(--color-text)' }}>Palette & Typography</h4>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: colors.primary, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Primary</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: colors.secondary, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Secondary</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: colors.tertiary, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Tertiary</span>
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'var(--color-bg-secondary)', 
            borderRadius: '8px',
            borderLeft: `4px solid ${colors.primary}`
          }}>
            <h2 style={{ fontFamily: fonts.heading, margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>Heading Font ({fonts.heading})</h2>
            <p style={{ fontFamily: fonts.body, margin: 0, color: 'var(--color-text-secondary)' }}>
              This is how your body text will look. It uses the {fonts.body} font family. 
              Good typography establishes a strong visual hierarchy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
