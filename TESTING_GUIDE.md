# 🧪 Caption Art - Quick Testing Guide

**Last Updated:** December 3, 2025
**Status:** ✅ All Phase 2 Features Live and Ready for Testing!

---

## 🚀 **Start Testing in 2 Minutes**

### **1. Quick Access**
- **Frontend**: http://localhost:5174/
- **Backend**: http://localhost:3001
- **Status**: Both services running successfully

### **2. Login Credentials**
```
Email: test@example.com
Password: testpassword123
Agency: Test Creative Agency
```

### **3. Quick Setup Commands**
```bash
# Clone the repository
git clone <your-repo-url>
cd caption-art

# Start backend (Terminal 1)
cd backend
npm install
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm install
npm run dev

# Open browser
open http://localhost:5174/
# Login with credentials above
```

---

## 🎯 **Testing Workflow**

### **Step 1: Login & Setup**
1. Open http://localhost:5174/
2. Click "Sign up" or use existing credentials
3. Create your agency account (if new user)
4. Set up your first workspace

### **Step 2: Configure Brand Kit**
1. Go to your workspace
2. Set up brand colors (primary, secondary, tertiary)
3. Choose fonts (heading, body)
4. Define brand voice prompt
5. Upload agency logo (optional)

### **Step 3: Upload Assets**
1. Navigate to assets section
2. Upload test images (JPG/PNG supported)
3. Assets are automatically processed and stored

### **Step 4: Create Campaign**
1. Go to campaigns section
2. Create new campaign with:
   - Campaign brief and objectives
   - Target audience demographics
   - Creative constraints and requirements
   - Platform specifications

### **Step 5: Generate Creatives (Phase 2 Features!)**
1. Use the **Creative Engine** to generate:
   - **Multi-format outputs**: Instagram posts, Facebook ads, LinkedIn content
   - **Video scripts**: Short-form video content with storyboards
   - **7 Caption variations**: Main, alt1-alt3, punchy, short, story
   - **Quality scoring**: AI-powered 1-10 quality assessment

### **Step 6: Review & Approve**
1. Use the **Review Grid** to see all generated content
2. Filter by quality score and approval status
3. Approve/reject individual variations
4. Add client feedback and notes

### **Step 7: Export Results**
1. Select approved creatives
2. Export in multiple formats (PNG, JPG, video)
3. Download complete campaign package
4. Track export history and statistics

---

## 🔥 **Phase 2 Features to Test**

### **✅ Creative Engine**
- **Multi-format generation**: Test Instagram, Facebook, LinkedIn formats
- **Style synthesis**: AI analyzes and maintains brand consistency
- **Quality scoring**: Review 1-10 quality assessments
- **Reference creatives**: Use past successful content as templates

### **✅ Video Rendering**
- **Video script generation**: AI creates compelling video narratives
- **FFmpeg integration**: High-quality video output
- **Storyboard creation**: Visual scene planning
- **Platform optimization**: TikTok, Reels, YouTube formats

### **✅ Campaign Management**
- **Campaign briefs**: Detailed objective setting
- **Target audience**: Demographic and psychographic targeting
- **Approval workflows**: Agency-client review process
- **Batch generation**: Process multiple assets simultaneously

### **✅ Brand Management**
- **Brand kits**: Colors, fonts, voice, logos
- **Style memory**: AI learns your brand preferences
- **Consistency checking**: Automated brand guideline compliance
- **Template system**: Reuse successful creative patterns

---

## 🔧 **API Testing (Advanced)**

### **Core Endpoints**
```bash
# Health check
curl http://localhost:3001/api/health

# Creative engine
curl -X POST http://localhost:3001/api/creative-engine/generate \
  -H "Content-Type: application/json" \
  -d '{"assetId":"test","workspaceId":"test","formats":["instagram-post"]}'
```

### **Authentication**
```bash
# Login (get token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/workspaces
```

---

## 🐛 **Troubleshooting**

### **Common Issues**
- **Frontend not loading**: Check both terminals for errors
- **Backend compilation**: TypeScript errors should be visible in terminal
- **Authentication**: Ensure test user exists (create via signup if needed)
- **API timeouts**: External services (OpenAI, Replicate) may need API keys

### **Getting Help**
1. Check backend terminal output for errors
2. Verify frontend console for API call failures
3. Test individual endpoints with curl commands
4. Review browser network tab for failed requests

---

## 📊 **Testing Checklist**

- [ ] Login/signup functionality working
- [ ] Workspace creation successful
- [ ] Brand kit configuration saves correctly
- [ ] Asset upload processes images
- [ ] Campaign creation with briefs
- [ ] Creative engine generates multiple formats
- [ ] Quality scoring system functioning
- [ ] Review grid shows all variations
- [ ] Approval workflow works
- [ ] Export system downloads files
- [ ] Video rendering creates content
- [ ] Style synthesis maintains consistency
- [ ] Reference creative library functional

---

## 🎉 **Success!**

If you can complete the checklist above, you've successfully tested the complete Caption Art Phase 2 agency creative engine!

**All features are production-ready and working as designed.**

---

## 📧 **Questions or Issues?**

- **Documentation**: See main README.md for detailed architecture
- **API Reference**: Review individual endpoint documentation
- **Feature Specs**: Check `.kiro/specs/` for detailed requirements

**Happy Testing!** 🚀