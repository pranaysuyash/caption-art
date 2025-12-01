## Contextual Captioner + Text Art — Full-Featured Application

Last updated: 2025-01-XX

### One‑line

Upload images, get AI-powered caption suggestions, place styled text behind subjects, and export professional results with comprehensive analytics and batch processing.

---

### Core Features

#### Image Processing
- **Upload & Validation**: JPG/PNG support with file size and format validation
- **Image Preprocessing**: Automatic optimization and format conversion
- **Segmentation**: AI-powered subject masking for "text behind subject" effect using Replicate rembg
- **Mask Regeneration**: Regenerate masks if initial results aren't satisfactory
- **Mask Preview**: Debug view to visualize mask overlay
- **Before/After Slider**: Interactive comparison of original vs. final output

#### AI Caption Generation
- **Smart Captions**: 3-5 suggestions using BLIP captioning + OpenAI LLM rewrites
- **Multiple Styles**: Creative, funny, poetic, minimal, and dramatic caption variants
- **Caption Caching**: Avoid redundant API calls for the same images
- **Regeneration**: Get fresh caption suggestions on demand
- **Character Limits**: Captions optimized for visual composition (10-100 chars)
- **Retry Logic**: Automatic retry with exponential backoff for failed API calls

#### Text Styling & Composition
- **Style Presets**: Neon, Magazine, Paint/Brush, Emboss with custom styling
- **Multi-line Text**: Advanced text rendering with line breaks and alignment
- **Transform Controls**: Manual drag/scale/rotate with precise positioning
- **Auto Placement**: Intelligent text positioning in empty areas
- **Text Behind Subject**: Compositing text behind foreground subjects using masks
- **Canvas Compositor**: Layer-based rendering system
- **Font Loading**: Custom web fonts with fallback handling

#### History & Editing
- **Undo/Redo**: Full history stack with keyboard shortcuts (Ctrl+Z/Cmd+Z)
- **State Persistence**: History saved across browser sessions
- **Smart Debouncing**: Automatic state saving after user inactivity
- **History Limits**: Memory-efficient rolling window of 50 states
- **State Serialization**: Efficient storage of canvas states

#### Export & Download
- **Multiple Formats**: PNG/JPG export with quality control
- **Watermarking**: Optional watermark for free tier
- **Max Resolution**: 1080px maximum dimension
- **Batch Export**: Process and download multiple images as ZIP

#### Batch Processing
- **Multi-Upload**: Process up to 50 images simultaneously
- **Batch Apply**: Apply same caption and style to all images
- **Progress Tracking**: Real-time progress for batch operations
- **Individual Customization**: Option to customize each image separately
- **Selective Processing**: Remove images from batch before export
- **Batch Styling**: Apply consistent styling across all images

#### Analytics & Monitoring
- **Usage Tracking**: Feature usage, user flows, and conversion metrics
- **Error Tracking**: Automatic error capture with context and stack traces
- **Performance Monitoring**: Core Web Vitals (LCP, FID, CLS) tracking
- **API Monitoring**: Response time and error rate tracking
- **Privacy Controls**: User consent banner and opt-out options
- **Analytics Dashboard**: Real-time metrics and insights
- **Custom Events**: Track specific user behaviors and interactions

#### User Experience
- **Neo-Brutalism UI**: Bold, modern design system with custom styling
- **User Preferences**: Persistent settings and preferences
- **Responsive Design**: Works across desktop and mobile devices
- **Loading States**: Progress indicators for all async operations
- **Error Messages**: User-friendly error handling and recovery
- **Animations**: Smooth transitions and micro-interactions

#### Payments & Licensing
- **Gumroad Integration**: License key verification
- **Dodo Payments**: Alternative payment provider support
- **Free Tier**: 2 watermarked exports per day (local enforcement)
- **Premium Features**: Unlimited exports without watermark
- **License Validation**: Server-side verification of purchase status

#### Social Media Integration
- **Platform Optimization**: Export presets for Instagram, Twitter, Facebook
- **Aspect Ratios**: Pre-configured sizes for different platforms
- **Direct Sharing**: Share to social platforms (planned)

---

### Tech Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Canvas**: HTML5 Canvas API for image compositing
- **State Management**: React hooks and context
- **Testing**: Vitest for unit and integration tests
- **Styling**: CSS modules with design system

#### Backend (Platform-Agnostic)
- **Runtime**: Node.js 18+ with Express.js
- **Architecture**: Standard HTTP server (no platform lock-in)
- **Deployment**: Docker containers, PaaS, VPS, or any cloud provider
- **APIs**: RESTful endpoints for caption and mask generation
- **Configuration**: Environment variables (no cloud-specific services)
- **Rate Limiting**: Express middleware for request throttling
- **Logging**: Structured console logging with timestamps
- **CORS**: Configurable cross-origin support
- **Error Handling**: Comprehensive error responses with user-friendly messages

#### External Services
- **Replicate API**: BLIP captioning and rembg segmentation
- **OpenAI API**: GPT-3.5/GPT-4 for caption rewrites
- **Gumroad API**: License verification
- **Dodo Payments**: Alternative payment processing

#### Infrastructure (Flexible)
- **Frontend Hosting**: Any static hosting (S3, Netlify, Vercel, etc.)
- **Backend Hosting**: 
  - Local development (npm run dev)
  - Docker containers (any orchestration platform)
  - PaaS platforms (Railway, Render, Heroku, Fly.io)
  - Cloud VMs (AWS EC2, DigitalOcean, Linode, etc.)
  - Serverless containers (AWS Fargate, Cloud Run, etc.)
- **Configuration**: Environment variables only (no cloud-specific secrets management)
- **Monitoring**: Standard logging to stdout/stderr
- **Cost Controls**: Rate limiting and request throttling

---

### Architecture

#### Current Setup
- **Frontend**: React SPA (can be hosted anywhere)
- **Backend**: Platform-agnostic Express.js server
  - Runs locally for development
  - Deploys via Docker to any container platform
  - Works on any PaaS or cloud provider
- **APIs**: 
  - `/api/caption`: Generates captions using BLIP + OpenAI
  - `/api/mask`: Generates subject masks using rembg
  - `/api/verify`: Validates Gumroad licenses
  - `/api/health`: Health check endpoint
- **Image Handling**: Direct image URLs or base64 (no cloud storage required)
- **Caching**: Client-side caching for captions and masks

#### Data Flow
1. User uploads image → Frontend validates → Stores in memory
2. Frontend calls `/api/mask` with image URL → Backend calls Replicate rembg → Returns mask URL
3. Frontend calls `/api/caption` with image URL → Backend calls BLIP → Calls OpenAI → Returns variants
4. User customizes text and style → Canvas composites in real-time
5. User exports → Frontend renders final image → Downloads locally
6. Premium users verify license → Backend validates with Gumroad → Enables watermark-free export

---

### Cost Controls

- **Rate Limiting**: Express middleware limits requests per IP (100 req/15 min)
- **Request Validation**: Reject invalid requests early to save API costs
- **Client-side Caching**: Reduce redundant API calls
- **Timeout Enforcement**: 30-second timeout on external API calls
- **Error Handling**: Retry logic with exponential backoff
- **Monitoring**: Track API usage and error rates

---

### Project Structure

```
caption-art/
├─ frontend/             # React UI
│  ├─ src/
│  │  ├─ components/     # React components
│  │  ├─ lib/            # Core libraries
│  │  │  ├─ analytics/   # Analytics and tracking
│  │  │  ├─ batch/       # Batch processing
│  │  │  ├─ canvas/      # Canvas compositing
│  │  │  ├─ caption/     # Caption generation
│  │  │  ├─ history/     # Undo/redo system
│  │  │  ├─ monitoring/  # Performance monitoring
│  │  │  ├─ segmentation/# Mask generation
│  │  │  ├─ text/        # Text rendering
│  │  │  └─ upload/      # File validation
│  │  └─ styles/         # CSS and design system
│  └─ vitest.config.ts   # Test configuration
├─ backend/              # Express API server
│  ├─ src/
│  │  ├─ routes/         # API endpoints
│  │  ├─ services/       # External API clients
│  │  ├─ middleware/     # Rate limiting, logging
│  │  └─ server.ts       # Main server file
│  ├─ Dockerfile         # Container configuration
│  └─ vitest.config.ts   # Test configuration
├─ cdk/                  # AWS CDK infrastructure (legacy, optional)
│  └─ lib/               # Stack definitions for AWS deployment
├─ .kiro/                # Kiro specs and documentation
│  └─ specs/             # Feature specifications
└─ README.md             # This file
```

---

### Environment Variables

#### Frontend (.env.local)
```
VITE_REPLICATE_API_TOKEN=...
VITE_OPENAI_API_KEY=...
VITE_BACKEND_URL=http://localhost:3001
```

#### Backend (.env)
```
# Server Configuration
NODE_ENV=development
PORT=3001

# Replicate API
REPLICATE_API_TOKEN=r8_your_token_here
REPLICATE_BLIP_MODEL=salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746
REPLICATE_REMBG_MODEL=cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003

# OpenAI API
OPENAI_API_KEY=sk-your_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.8

# Gumroad
GUMROAD_PRODUCT_PERMALINK=caption-art
GUMROAD_ACCESS_TOKEN=your_token_here

# CORS
CORS_ORIGIN=*
```

See `backend/.env.example` for a complete template with documentation.

---

### Development

#### Local Setup
```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Start backend
cd backend
npm run dev  # Runs on http://localhost:3001

# Start frontend (in another terminal)
cd frontend
npm run dev  # Runs on http://localhost:5173
```

#### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# Run specific test file
npm test -- path/to/test.ts
```

#### Docker Development
```bash
# Build and run backend in Docker
cd backend
docker build -t caption-art-backend .
docker run -p 3001:3001 --env-file .env caption-art-backend

# Or use docker-compose
docker-compose up
```

---

### Deployment

#### Frontend Deployment
The frontend is a static React app that can be deployed to any static hosting:
```bash
cd frontend
npm run build
# Upload dist/ folder to your hosting provider
```

Options:
- **Netlify**: Drag and drop `dist/` folder or connect Git repo
- **Vercel**: `vercel deploy` or connect Git repo
- **AWS S3 + CloudFront**: `aws s3 sync dist/ s3://bucket-name/`
- **GitHub Pages**: Configure in repository settings
- **Any static host**: Upload `dist/` contents

#### Backend Deployment

The backend is a platform-agnostic Express.js server. Choose any deployment option:

**Option 1: Docker (Recommended)**
```bash
cd backend
docker build -t caption-art-backend .
docker run -p 3001:3001 --env-file .env caption-art-backend
```

**Option 2: PaaS Platforms**
- **Railway**: `railway up` (auto-detects Dockerfile)
- **Render**: Connect Git repo, set environment variables
- **Heroku**: `git push heroku main`
- **Fly.io**: `fly deploy`

**Option 3: Cloud VMs**
```bash
# SSH into your server
git clone your-repo
cd backend
npm install
npm run build
npm start
# Or use PM2: pm2 start dist/server.js
```

**Option 4: Container Platforms**
- **AWS ECS/Fargate**: Push to ECR, create service
- **Google Cloud Run**: `gcloud run deploy`
- **Azure Container Instances**: Deploy from container registry
- **DigitalOcean App Platform**: Connect Git repo

See `backend/DEPLOYMENT.md` for detailed deployment guides for each platform.

---

### Feature Specifications

All features are documented in `.kiro/specs/` with:
- **requirements.md**: User stories and acceptance criteria
- **design.md**: Technical design and architecture
- **tasks.md**: Implementation checklist

Current specs:
- ai-caption-generation
- analytics-usage-tracking
- batch-processing
- canvas-history-undo-redo
- canvas-text-compositing
- dodo-payments-integration
- export-download-system
- image-segmentation-masking
- image-upload-preprocessing
- license-paywall-system
- multi-theme-system
- neo-brutalism-ui-integration
- performance-monitoring
- platform-agnostic-backend
- social-media-integration
- text-editing-advanced
- user-preferences-settings

---

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test feature workflows end-to-end
- **Property-Based Tests**: Test invariants across random inputs
- **Manual Testing**: UI/UX validation and edge cases

---

### Notes

- **Platform Agnostic**: Backend runs anywhere Node.js is supported
- **No Vendor Lock-in**: No AWS, Vercel, or cloud-specific dependencies
- **Simple Deployment**: Docker container or direct Node.js deployment
- **Cost Predictable**: Heavy compute offloaded to Replicate/OpenAI
- **Client-side Caching**: Reduces API costs and improves performance
- **Comprehensive Error Handling**: Retry logic and user-friendly messages
- **Privacy-first Analytics**: User consent and opt-out options
- **Modular Architecture**: Easy to add features and maintain

### Migration from AWS Lambda

The backend was originally built on AWS Lambda but has been migrated to a platform-agnostic Express.js architecture. The new backend:
- ✅ Maintains all existing functionality
- ✅ Uses the same external APIs (Replicate, OpenAI, Gumroad)
- ✅ Provides identical API responses
- ✅ Runs anywhere (local, Docker, any cloud)
- ✅ Simpler to develop and debug locally
- ✅ No platform-specific dependencies

See `.kiro/specs/platform-agnostic-backend/` for the complete specification and `backend/MIGRATION.md` for migration details.
