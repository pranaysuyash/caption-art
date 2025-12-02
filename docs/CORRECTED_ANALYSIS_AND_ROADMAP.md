# Corrected Codebase Analysis & Roadmap

## Current Reality Check

The product is **NOT** a "comprehensive social media management platform" - it's an **agency job-finisher for creative output** with this core flow:
- Agency drops assets → sets brand/campaign context → tool spits out ready creatives → approval → export → deliver to client

## Product Vision: Three Stacked Layers

### Layer 1: Job Finisher for Creatives (Current Focus)
- Workspaces per client
- Campaigns within workspaces  
- Brand kit configuration
- Asset upload
- One-button generation (captions, layouts, formats)
- Grid-based approval/review
- Structured export (ZIP with images/captions)

### Layer 2: Ad Creative Engine (Next)
- Headline/Subheadline/Primary text/CTA generation
- Platform-specific formats (IG Post/Story, LinkedIn, Facebook)
- Advanced layout controls (text blocks, CTA buttons, overlays)

### Layer 3: Memory and Style System (Future)
- Template learning from approved work
- Brand consistency warnings
- Auto-proposed "house styles"

## Current State

**Backend**: Complete workflow foundation exists
- Auth, workspaces, campaigns, brand kits, assets, batch processing, approval, export
- All APIs implemented and tested
- Simulation capability for testing flows

**Frontend**: Still in single-image mode
- Old canvas experience remains primary
- ApprovalGrid exists but uses mock data
- Missing auth, workspace, campaign, brand kit UI
- No complete workflow integration

## Corrected Roadmap: Three Tunnels

### Tunnel A: Core Agency UI (Immediate Priority)
1. **Auth Flow**
   - Email/password login/signup
   - Redirect to workspace dashboard post-login

2. **Workspace Dashboard**
   - List workspaces with client names
   - Create new workspace modal

3. **Workspace Navigation**
   - Campaigns tab
   - Brand Kit tab  
   - Assets tab
   - Approval tab

4. **Campaign Management**
   - List campaigns with objectives and placements
   - Create campaign modal (name, objective, funnel stage, brief)

5. **Brand Kit Editor**
   - Color pickers, font selection
   - Voice prompt, TA, phrases
   - Full CRUD for existing backend model

6. **Asset Management**
   - Drag & drop upload (limit 10 initially)
   - Thumbnail grid with status
   - Campaign association

7. **Approval Grid (Connected)**
   - Real API data instead of mock
   - Inline editing for captions
   - Bulk approve/reject
   - Export button (enabled when approved items exist)

8. **Export Flow**
   - Trigger export job
   - Poll for status
   - Download ZIP when complete
   - Simple progress UI

### Tunnel B: Stability and Scale (Parallel)  
- Run simulation tests with realistic agency workloads
- Fix runtime friction (400s, timeouts, memory issues)
- Scale batch limits (10 → 30 → 50 as performance allows)

### Tunnel C: Ad Creative Mode (After Tunnel A)  
- Add "Generate Ad Copy" toggle to campaigns
- Per-asset ad copy generation (headline, primary text, CTA)
- Keep as text initially, extend to layouts later

## What to Keep vs. Archive

**Keep & Prioritize:**
- Frontend-backend workflow alignment
- Campaign-to-approval-to-export flow
- Brand Kit V2 and style references
- Database persistence (post-PMF)

**Archive for Now:**
- Social media publishing/scheduling
- Complex authentication (JWT refresh, RBAC)
- Integrations (Slack, Zapier, Airtable)
- Client portals and heavy collaboration
- Analytics dashboards and ROAS tracking

## Focus for PMF
Get agencies actually using the complete workflow: "I can ship 30 on-brand creatives for this client in 15 minutes."

The backend foundation is solid - the only priority now is completing the narrow experience and validating it with real agencies.