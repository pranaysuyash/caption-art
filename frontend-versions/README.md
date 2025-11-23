# Frontend Versions Comparison

This directory contains both frontend versions for side-by-side comparison and testing.

## Directory Structure

```
frontend-versions/
├── main-version/          # Current React + AWS backend version
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── ...
│
├── feature-version/       # Neo-brutalism design version
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── README.md
│
└── README.md             # This file
```

---

## Main Version (React + AWS)

**Location:** `main-version/`

**Architecture:**
- React 18 + TypeScript
- Vite build system
- AWS Lambda backend
- Real AI integration

**Features:**
- ✅ Real AI caption generation (Replicate BLIP + OpenAI)
- ✅ Subject masking (text behind subject effect)
- ✅ S3 image storage
- ✅ Gumroad license verification
- ✅ Canvas-based image composition
- ✅ 4 text style presets

**To Run:**
```bash
cd main-version
npm install
npm run dev
```

**Note:** Requires backend API to be running (Lambda functions)

**Environment Variables:**
Create `.env.local`:
```
VITE_API_BASE=http://your-api-gateway-url
```

---

## Feature Version (Neo-Brutalism Design)

**Location:** `feature-version/`

**Architecture:**
- Pure HTML/CSS/JavaScript
- No build system required
- No backend needed
- Standalone demo

**Features:**
- ✅ Neo-brutalism design system
- ✅ Bold borders, offset shadows, vibrant colors
- ✅ Smooth animations and micro-interactions
- ✅ Dark/light theme toggle
- ✅ Drag & drop upload
- ✅ 6 caption style categories
- ✅ Gallery with localStorage
- ✅ Responsive design
- ✅ Easter egg (Konami code)

**To Run:**
```bash
cd feature-version
# Just open index.html in a browser
open index.html
# Or use a simple server:
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

**Note:** Uses template-based captions (no real AI)

---

## Key Differences

| Feature | Main Version | Feature Version |
|---------|-------------|-----------------|
| **Framework** | React + TypeScript | Vanilla JS |
| **Backend** | AWS Lambda + S3 | None (standalone) |
| **AI Integration** | ✅ Real (BLIP + OpenAI) | ❌ Templates only |
| **Image Processing** | ✅ Canvas + masking | ❌ Preview only |
| **Design** | Minimal dark theme | Neo-brutalism |
| **Animations** | None | Extensive |
| **Theme Toggle** | No | Yes (light/dark) |
| **Drag & Drop** | No | Yes |
| **Gallery** | No | Yes (localStorage) |
| **License System** | ✅ Gumroad | ❌ None |
| **Text Behind Subject** | ✅ Yes | ❌ No |
| **Setup Complexity** | High (AWS + deps) | Low (just open file) |

---

## Testing Both Versions

### Quick Test - Feature Version
1. Open `feature-version/index.html` in browser
2. Upload an image
3. Select a caption style
4. Click "Generate Caption"
5. Try theme toggle, gallery, animations

### Full Test - Main Version
1. Set up AWS backend (Lambda, S3, API Gateway)
2. Configure environment variables
3. Run `npm install && npm run dev`
4. Upload image (goes to S3)
5. Get AI-generated captions
6. Add text overlay with "behind subject" effect
7. Export with/without watermark

---

## Integration Strategy

The goal is to combine the best of both:

**Keep from Main:**
- React architecture
- AWS backend
- Real AI integration
- Image processing capabilities
- License verification

**Add from Feature:**
- Neo-brutalism design system
- Animations and micro-interactions
- Theme toggle
- Improved UX (drag & drop, better layout)
- Toast notifications

**Result:** Beautiful UI + Powerful Backend

See the parent directory's planning documents for the integration strategy:
- `PARALLEL_WORK_PLAN.md`
- `INSTRUCTIONS_FOR_PARALLEL_AGENT.md`
- `BRANCH_COMPARISON.md`

---

## Design Elements to Extract

From `feature-version/styles.css`:

### Colors
```css
--color-primary: #FF6B6B    /* Coral */
--color-secondary: #4ECDC4  /* Turquoise */
--color-accent: #FFE66D     /* Yellow */
--color-success: #95E1D3    /* Mint */
```

### Typography
```css
--font-primary: 'Space Grotesk', sans-serif
--font-mono: 'JetBrains Mono', monospace
```

### Neo-Brutalism
```css
--border-width: 3px to 5px
--shadow-sm: 4px 4px 0px
--shadow-md: 6px 6px 0px
--shadow-lg: 8px 8px 0px
```

### Animations
- Bounce: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- Smooth: `cubic-bezier(0.4, 0, 0.2, 1)`
- Lift effect on hover
- Typewriter text reveal
- Staggered entry animations

---

## Next Steps

1. **Test both versions** to understand the differences
2. **Extract design system** from feature version
3. **Create React components** using the design system
4. **Integrate into main** while keeping AWS functionality
5. **Test integrated version** with real backend

---

## Notes

- Feature version is a **design reference** - don't use it as-is
- Main version has the **real functionality** - keep this architecture
- Integration should be **additive** - enhance, don't replace
- Both versions serve different purposes in the development process
