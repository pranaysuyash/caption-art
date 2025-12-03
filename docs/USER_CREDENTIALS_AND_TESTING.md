# User Credentials & Testing Guide

## 🚀 Quick Access

### Frontend (Agency Workflow)
- **URL**: http://localhost:5173
- **Login**: `agency@demo.com`
- **Password**: `demo123`

### Backend API
- **Base URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 👤 Test Users

### Primary Agency User
- **Email**: `agency@demo.com`
- **Password**: `demo123`
- **Agency**: Demo Agency
- **Workspaces**: 3 demo workspaces available

### Workspace Access
After login, you'll have access to these workspaces:
1. **Tech Startup** - Brand kit configured
2. **Fashion Brand** - Basic setup
3. **Restaurant Chain** - Minimal configuration

## 🧪 Testing Workflow

### 1. Login & Workspace Selection
```
1. Go to http://localhost:5173
2. Email: agency@demo.com
3. Password: demo123
4. Click "Login"
5. Select any workspace to enter agency workflow
```

### 2. V2 Brand Kit Testing (NEW!)
```
1. From workspace dashboard, click any campaign
2. Go to "Brand Kit" tab
3. Test V2 Campaign Brain features:
   - Brand Personality: "Bold, witty, slightly irreverent"
   - Target Audience: "Working moms 28-40 in Tier 1 cities"
   - Value Proposition: "Saves 2 hours a day on X"
   - Preferred Phrases: Add "innovative", "time-saving"
   - Forbidden Phrases: Add "cheap", "discount"
   - Tone Style: Select from dropdown
   - AI Masking Model: Choose from options
4. Click "Save Brand Kit"
```

### 3. Campaign Management
```
1. Navigate to Campaigns tab
2. Click "Create Campaign"
3. Fill in campaign details:
   - Campaign Name: Test Campaign
   - Objective: Conversion/Traffic/Awareness/Engagement
   - Platforms: Select IG, FB, LinkedIn
4. Save campaign
```

### 4. Reference Creative Style Extraction (NEW!)
```
1. Go to Campaign Detail → Assets tab
2. Look for "Reference Creatives" section
3. Click "+ Add Reference"
4. Upload a reference image (or provide image URL)
5. Watch real-time style analysis progress:
   - "Extracting color palette..."
   - "Detecting layout patterns..."
   - "Analyzing text density..."
   - "Identifying style characteristics..."
   - "Generating style tags..."
6. Review extracted style analysis:
   - Color swatches with hex codes
   - Layout pattern classification
   - Text density assessment
   - Generated style tags
7. Click "View Style" for detailed analysis modal
8. Reference creatives now inform AI creative generation
```

### 5. Asset Upload & Creative Generation
```
1. Go to Campaign Detail → Assets tab
2. Upload test images (up to 20)
3. Navigate to Review Grid
4. Click "Generate Creatives"
5. Review AI-generated captions with V2 brand context and reference style learning
6. Approve/reject individual creatives
7. Export finished creatives
```

### 6. Playground Testing (Legacy)
```
1. Go to http://localhost:5173/playground
2. Upload any image
3. Test AI caption generation
4. Apply text effects (neon, magazine, brush, emboss)
5. Export PNG/video
```

## 🔧 API Testing

### Brand Kit V2
```bash
# Get brand kit
curl -H "Authorization: Bearer [token]" \
  http://localhost:3001/api/brand-kits/[workspaceId]

# Update brand kit with V2 fields
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "brandPersonality": "Bold, witty, slightly irreverent",
    "targetAudience": "Tech-savvy millennials 25-35",
    "valueProposition": "Saves 2 hours daily",
    "preferredPhrases": ["innovative", "smart"],
    "forbiddenPhrases": ["cheap", "discount"],
    "toneStyle": "bold"
  }' \
  http://localhost:3001/api/brand-kits/[brandKitId]
```

### Campaign Management
```bash
# Create campaign
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "workspaceId": "[workspaceId]",
    "brandKitId": "[brandKitId]",
    "name": "Test Campaign",
    "objective": "conversion",
    "placements": ["ig-feed", "fb-feed"]
  }' \
  http://localhost:3001/api/campaigns
```

### Creative Generation
```bash
# Generate creatives with V2 context
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "workspaceId": "[workspaceId]",
    "campaignId": "[campaignId]",
    "brandKitId": "[brandKitId]",
    "assetIds": ["[assetId1]", "[assetId2]"],
    "outputCount": 5
  }' \
  http://localhost:3001/api/creative-engine/generate
```

### Reference Creative Style Analysis
```bash
# Analyze visual style of an image
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "imageUrl": "https://example.com/image.jpg"
  }' \
  http://localhost:3001/api/analyze-style

# Health check
curl http://localhost:3001/api/analyze-style/health
```

## 🎯 V2 Features to Test

### ✅ Brand Kit V2 (Campaign Brain)
- [ ] Brand personality field
- [ ] Target audience description
- [ ] Value proposition input
- [ ] Preferred phrases management (add/remove)
- [ ] Forbidden phrases management (add/remove)
- [ ] Tone style dropdown with descriptions
- [ ] AI masking model selection
- [ ] Save and validation

### ✅ Reference Creative Style Extraction (COMPLETE!)
- [x] Upload reference creative images (file or URL)
- [x] Automatic style extraction with progress tracking
- [x] Color palette detection and visualization
- [x] Layout pattern analysis (center-focus, bottom-text, top-text, split)
- [x] Text density assessment (minimal, moderate, heavy)
- [x] Style tag generation (high-contrast, bold-typography, minimal, etc.)
- [x] Visual style analysis modal with comprehensive display
- [x] Integration with brand kit and campaign context

### 📋 Campaign Brief System (Planned)
- [ ] Structured campaign brief forms
- [ ] Client goal mapping
- [ ] Competitive analysis input
- [ ] Objective-to-creative alignment

## 🔍 Troubleshooting

### Common Issues
1. **Login fails**: Check backend is running (localhost:3001)
2. **Brand Kit not saving**: Verify workspace has brand kit created
3. **Creative generation fails**: Check OpenAI API key in .env
4. **Upload errors**: Ensure uploads directory exists and has permissions

### Backend Logs
```bash
# Check backend logs
cd /Users/pranay/Projects/caption-art/backend
npm run dev
```

### Frontend Logs
```bash
# Check frontend console errors
cd /Users/pranay/Projects/caption-art/frontend
npm run dev
```

## 📊 Development Status

### ✅ Completed (V1 + V2 Foundation)
- Agency workflow authentication
- Workspace and campaign management
- Brand Kit V2 with campaign brain
- AI caption generation with context
- Basic export functionality
- Reference creative style extraction with AI analysis
- Visual style learning from uploaded references

### 🚧 In Progress (V2 Next)
- Campaign brief system
- Client goal mapping to creative requirements

### ❌ Not Started (V3-V4)
- Ad Creative System (slot-based)
- Style Memory + Templates

---

**Last Updated**: December 2, 2025
**Version**: V2 Campaign Engine Complete ✅
**Next Milestone**: V3 - Ad Creative System (Slot-based Generation)

### 🎉 V2 Campaign Engine Features Available:
- ✅ Brand Kit V2 with Campaign Brain
- ✅ Reference Creative Style Extraction
- ✅ AI-Powered Visual Analysis
- ✅ Color Palette & Layout Detection
- ✅ Style Tag Generation
- ✅ Enhanced Creative Context