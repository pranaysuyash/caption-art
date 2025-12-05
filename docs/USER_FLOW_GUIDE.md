# Caption Art - Complete User Flow Guide

## Overview

Caption Art is an AI-powered creative agency platform that streamlines the entire process of generating, managing, and deploying social media content. This guide details every user workflow, step, and path through the application.

## Table of Contents

1. [Authentication & Access](#authentication--access)
2. [Agency Dashboard Overview](#agency-dashboard-overview)
3. [Workspace Management](#workspace-management)
4. [Campaign Management](#campaign-management)
5. [Brand Kit Configuration](#brand-kit-configuration)
6. [Asset Management](#asset-management)
7. [Campaign Brief Creation](#campaign-brief-creation)
8. [Creative Generation](#creative-generation)
9. [Review & Approval Workflow](#review--approval-workflow)
10. [Export & Delivery](#export--delivery)
11. [Playground (Legacy Single-Image Editor)](#playground-legacy-single-image-editor)
12. [Settings & Preferences](#settings--preferences)
13. [Analytics & Reporting](#analytics--reporting)
14. [Error Handling & Recovery](#error-handling--recovery)

---

## Authentication & Access

### Primary Entry Points

#### 1. Login Flow

**Path**: `/login` → `/agency/workspaces`

**Steps**:

1. User navigates to application URL
2. Redirected to login page if not authenticated
3. Enter email and password
4. Click "Sign In" button
5. System validates credentials against backend
6. On success: Redirected to agency dashboard
7. On failure: Display error message with retry option

**Alternative Paths**:

- **New User Registration**: Click "Sign Up" link → Complete registration form → Email verification → Login
- **Password Reset**: Click "Forgot Password" → Enter email → Receive reset link → Set new password

#### 2. Direct URL Access

**Path**: Any protected route when unauthenticated

**Steps**:

1. User attempts to access `/agency/*` routes directly
2. System checks authentication status
3. If unauthenticated: Redirect to `/login`
4. After successful login: Redirect to originally requested URL

### Session Management

#### Session Timeout

- Automatic logout after 24 hours of inactivity
- Warning displayed 5 minutes before timeout
- Option to extend session or logout immediately

#### Multi-Device Access

- Single active session per user
- New login terminates previous session
- Session persistence across browser refreshes

---

## Agency Dashboard Overview

### Main Navigation Structure

#### Header Components

- **Agency Logo**: Click to return to workspace list
- **User Menu**: Profile settings, logout, account management
- **Notifications**: Campaign updates, approval requests, export completions

#### Primary Navigation Tabs

1. **Workspaces**: Client organization and management
2. **Campaigns**: Active campaign overview (within workspace context)
3. **Assets**: Media library management
4. **Analytics**: Performance metrics and reporting

### Dashboard States

#### Empty State (No Workspaces)

**Display**: Welcome screen with call-to-action
**Actions**:

- "Create Your First Workspace" button
- Educational content about platform capabilities

#### Active State (Workspaces Exist)

**Display**: Grid of workspace cards
**Information per card**:

- Client name and industry
- Campaign count
- Last activity date
- Quick actions menu

---

## Workspace Management

### Creating a New Workspace

**Path**: `/agency/workspaces` → "New Workspace" button

**Steps**:

1. Click "New Workspace" button in header or empty state
2. Modal opens with creation form
3. Enter required information:
   - **Client Name**: Display name for the workspace
   - **Industry**: Predefined dropdown (Fashion, Technology, Food, Beauty, etc.)
4. Click "Create Workspace"
5. System validates input
6. On success: Workspace created, redirected to workspace detail
7. On failure: Display validation errors

**Validation Rules**:

- Client name: Required, 2-100 characters
- Industry: Required selection from dropdown

### Workspace Detail View

**Path**: `/agency/workspaces/:workspaceId/campaigns`

**Layout**:

- **Header**: Workspace name, industry badge, campaign count
- **Navigation Tabs**:
  - Campaigns (default)
  - Assets
  - Brand Kit
  - Settings

**Actions Available**:

- Create new campaign
- Upload assets
- Configure brand kit
- Edit workspace settings
- Delete workspace (with confirmation)

### Workspace Settings

**Path**: `/agency/workspaces/:workspaceId/settings`

**Configurable Options**:

- **Workspace Name**: Edit client name
- **Industry**: Change industry classification
- **Team Access**: Add/remove team members (future feature)
- **Default Brand Kit**: Set workspace-wide brand defaults
- **Export Preferences**: Default export formats and settings

---

## Campaign Management

### Campaign Creation

**Path**: `/agency/workspaces/:workspaceId/campaigns` → "New Campaign" button

**Steps**:

1. Click "New Campaign" button
2. Modal opens with campaign form
3. Enter campaign details:
   - **Campaign Name**: Descriptive title (e.g., "Spring Sale 2025")
   - **Objective**: Business goal from dropdown:
     - Brand Awareness
     - Conversions/Sales
     - Website Traffic
     - Engagement
4. Click "Create Campaign"
5. System creates campaign with "draft" status
6. Redirected to campaign detail page

### Campaign Detail View

**Path**: `/agency/workspaces/:workspaceId/campaigns/:campaignId`

**Tabbed Interface**:

#### 1. Brand Kit Tab

**Purpose**: Configure campaign-specific branding
**Components**:

- Color picker for primary/secondary/tertiary colors
- Brand personality text area
- Target audience description
- Primary offer input field

#### 2. Assets Tab

**Purpose**: Manage campaign media files
**Features**:

- Drag-and-drop upload zone
- File type validation (images, videos)
- Asset preview grid
- Bulk upload capabilities
- Asset metadata (filename, size, type)

#### 3. Campaign Brief Tab

**Purpose**: Define strategic campaign requirements
**States**:

- **Empty State**: Call-to-action to create brief
- **Editor State**: Comprehensive brief form
- **Complete State**: Read-only brief display with edit option

### Campaign Brief Editor

**Path**: Campaign Detail → Campaign Brief Tab → "Edit Brief" button

**Form Sections**:

1. **Strategic Overview**

   - Campaign objective
   - Key message
   - Primary KPI
   - Target metrics

2. **Audience Definition**

   - Primary audience demographics
   - Psychographics and interests
   - Pain points and motivations
   - Brand affinity level

3. **Content Strategy**

   - Tone and voice guidelines
   - Key themes and messaging pillars
   - Competitive positioning
   - Unique value propositions

4. **Technical Requirements**
   - Platform specifications
   - Content formats needed
   - Asset specifications
   - Posting schedule

**Save/Cancel Actions**:

- **Save**: Validates all required fields, saves to backend
- **Cancel**: Discards changes, returns to read-only view
- **Auto-save**: Draft saving every 30 seconds during editing

---

## Brand Kit Configuration

### Brand Kit Creation

**Automatic Process**:

1. Created automatically when first campaign is set up
2. Inherits workspace defaults
3. Can be customized per campaign

### Brand Kit Editor

**Color Management**:

- **Primary Color**: Main brand color
- **Secondary Color**: Supporting color
- **Tertiary Color**: Accent color
- **Color Picker**: Visual selection with hex code input
- **Color Validation**: Ensures sufficient contrast ratios

**Typography Settings**:

- **Font Family**: Selection from web-safe fonts
- **Font Weight**: Regular, medium, bold options
- **Font Size Scale**: Base size with scaling ratios

**Brand Voice**:

- **Personality Description**: Text area for brand character
- **Tone Guidelines**: Formal, casual, inspirational, etc.
- **Language Style**: Industry-specific terminology preferences

**Logo and Assets**:

- **Logo Upload**: Primary logo file
- **Brand Guidelines**: PDF or document upload
- **Asset Library**: Additional brand elements

### Brand Kit Inheritance

**Hierarchy**:

1. **Workspace Level**: Default brand settings
2. **Campaign Level**: Campaign-specific overrides
3. **Asset Level**: Individual creative customizations

---

## Asset Management

### Asset Upload Process

**Path**: Campaign Detail → Assets Tab → Upload Zone

**Supported Formats**:

- **Images**: JPG, PNG, WebP (max 10MB each)
- **Videos**: MP4, MOV (max 100MB each)
- **Bulk Upload**: Up to 50 files simultaneously

**Upload Steps**:

1. **File Selection**: Click upload zone or drag files
2. **Validation**: Check file types and sizes
3. **Progress Display**: Individual file progress bars
4. **Processing**: Automatic optimization and thumbnail generation
5. **Completion**: Success confirmation with preview

### Asset Organization

**Grid View**:

- Thumbnail previews for all assets
- File information (name, size, upload date)
- Asset type indicators
- Selection checkboxes for bulk operations

**Asset Actions**:

- **View Full Size**: Click thumbnail for modal preview
- **Download**: Direct download link
- **Delete**: Remove with confirmation
- **Edit Metadata**: Rename, add tags, descriptions

### Asset Processing

**Automatic Processing**:

- **Image Optimization**: Resize and compress for web
- **Thumbnail Generation**: Small previews for grid view
- **Format Conversion**: Standardize formats when needed
- **Metadata Extraction**: Capture EXIF data, dimensions

---

## Campaign Brief Creation

### Brief Editor Interface

**Form Structure**:

#### Strategic Section

- **Campaign Objective**: Dropdown selection
- **Key Message**: Primary campaign message (required)
- **Primary KPI**: Success metric (required)
- **Secondary KPIs**: Additional metrics
- **Budget**: Campaign budget (optional)
- **Timeline**: Start and end dates

#### Audience Section

- **Primary Demographics**: Age, gender, location, income
- **Psychographics**: Interests, values, lifestyle
- **Brand Affinity**: Current brand relationship
- **Purchase Intent**: Buying stage
- **Pain Points**: Customer challenges to address

#### Content Strategy Section

- **Tone & Voice**: Brand personality guidelines
- **Key Themes**: Core messaging pillars
- **Competitive Advantages**: What makes this campaign unique
- **Call-to-Action**: Desired user response
- **Content Pillars**: Key content categories

#### Technical Requirements Section

- **Platforms**: Target social media platforms
- **Content Formats**: Required asset types
- **Posting Schedule**: Frequency and timing
- **Hashtags**: Required or suggested tags
- **Tracking Links**: UTM parameters

### Brief Validation

**Required Fields**:

- Campaign objective
- Key message
- Primary KPI
- Primary audience demographics

**Conditional Validation**:

- If video content selected: Video specifications required
- If multi-platform: Platform-specific requirements

### Brief Completion States

**Draft State**:

- Partial completion allowed
- Auto-save enabled
- Visual progress indicator

**Complete State**:

- All required fields filled
- Ready for creative generation
- Brief marked as "finalized"

---

## Creative Generation

### Generation Initiation

**Path**: Campaign Detail → Review Tab → "Generate Creatives" button

**Prerequisites**:

- Campaign brief must be complete
- Brand kit configured
- Assets uploaded
- At least one asset selected

### Generation Process

**Step 1: Context Gathering**

- System collects campaign brief data
- Brand kit settings retrieved
- Selected assets prepared
- AI model parameters configured

**Step 2: AI Processing**

- **Content Analysis**: Assets analyzed for themes and elements
- **Brand Synthesis**: Brand voice and style applied
- **Audience Targeting**: Content tailored to audience profile
- **Platform Optimization**: Format-specific adaptations

**Step 3: Creative Variants**

- **Multiple Headlines**: 3-5 headline variations
- **Body Text Options**: Different lengths and tones
- **CTA Variations**: Multiple call-to-action options
- **Visual Concepts**: Alternative layout suggestions

### Generation Types

#### Single Asset Generation

- One image/video → Multiple creative variations
- Sequential processing
- Individual progress tracking

#### Batch Generation

- Multiple assets → Coordinated creative sets
- Parallel processing where possible
- Batch progress monitoring

### Quality Scoring

**Automated Scoring**:

- **Relevance**: How well content matches brief (1-10)
- **Engagement Potential**: Predicted performance score
- **Brand Consistency**: Alignment with brand guidelines
- **Technical Quality**: Format and specification compliance

### Generation Monitoring

**Progress Indicators**:

- Overall batch progress
- Individual asset status
- Estimated time remaining
- Error notifications

**Interruption Handling**:

- Pause/resume capability
- Partial result saving
- Recovery from failures

---

## Review & Approval Workflow

### Review Interface

**Path**: `/agency/workspaces/:workspaceId/campaigns/:campaignId/review`

**Grid Layout**:

- **Creative Cards**: Thumbnail + content preview
- **Status Badges**: Pending, Approved, Rejected
- **Metadata**: Generation date, quality score, platform

### Creative Review Process

**Per Creative Actions**:

#### View Full Creative

1. Click creative card
2. Modal opens with full preview
3. Shows all variations (headline, body, CTA)
4. Platform-specific formatting

#### Approve Creative

1. Click "Approve" button
2. Status changes to "Approved"
3. Visual confirmation
4. Added to approved collection

#### Reject Creative

1. Click "Reject" button
2. Optional rejection reason
3. Status changes to "Rejected"
4. Removed from active consideration

#### Edit Creative

1. Click "Edit" button
2. Inline editing of text elements
3. Save changes
4. Updated version replaces original

### Bulk Operations

**Selection Methods**:

- Individual checkbox selection
- "Select All" button
- Filter-based selection (all pending, etc.)

**Bulk Actions**:

- **Bulk Approve**: Approve all selected creatives
- **Bulk Reject**: Reject all selected creatives
- **Bulk Edit**: Apply changes to multiple creatives

### Filtering and Sorting

**Filter Options**:

- **Status**: All, Pending, Approved, Rejected
- **Platform**: Instagram, Facebook, LinkedIn, etc.
- **Quality Score**: Above/Below threshold
- **Date Range**: Generation date filter

**Sort Options**:

- **Newest First**: Most recent generation
- **Quality Score**: Highest to lowest
- **Platform**: Grouped by target platform

### Creative Variations

**Variation Navigation**:

- Next/Previous buttons for multiple versions
- Variation indicator (1 of 3)
- Apply changes to specific variation

**Variation Types**:

- **Main**: Primary creative version
- **Alt1-Alt3**: Alternative approaches
- **Punchy**: Short, impactful version
- **Story**: Narrative-driven version

---

## Export & Delivery

### Export Initiation

**Path**: Review Grid → "Export X Approved" button

**Prerequisites**:

- At least one approved creative
- Export permissions enabled

### Export Options

**Format Selection**:

- **CSV**: Structured data for ad platforms
- **JSON**: API-ready format
- **ZIP**: Media files + metadata
- **PDF**: Presentation-ready format

**Content Options**:

- **Approved Only**: Only approved creatives
- **With Variations**: Include all creative variations
- **Platform Specific**: Filter by target platform

### Export Process

**Step 1: Configuration**

- Select export format
- Choose content scope
- Set file naming convention
- Configure metadata inclusion

**Step 2: Processing**

- File generation progress
- Compression for large exports
- Error handling for failed items

**Step 3: Delivery**

- Direct download link
- Email delivery option
- Cloud storage integration (future)

### Export History

**Export Tracking**:

- Previous export records
- Download links (temporary, 7 days)
- Export configuration history
- Usage analytics

---

## Playground (Legacy Single-Image Editor)

### Access Path

**Path**: `/playground`

**Note**: Legacy interface, primarily for single-image creative generation

### Image Upload

**Upload Methods**:

1. **File Selection**: Click upload area or browse files
2. **Drag & Drop**: Drag image file to upload zone
3. **URL Input**: Paste direct image URL

**Validation**:

- File type: JPG, PNG, WebP
- File size: Max 10MB
- Image dimensions: Automatic scaling to 1080px max

### AI Caption Generation

**Generation Process**:

1. **Base Caption**: BLIP model analyzes image
2. **Creative Variants**: OpenAI rewrites in multiple styles
3. **Style Options**: Creative, Funny, Poetic, Minimal, Dramatic

**Caption Features**:

- **Regeneration**: Get new suggestions
- **Caching**: Avoid duplicate API calls
- **Character Limits**: Optimized lengths

### Text Styling

**Style Presets**:

- **Neon**: Bright, glowing text
- **Magazine**: Clean, editorial style
- **Paint**: Brush stroke effects
- **Emboss**: 3D raised text effect

**Customization**:

- **Font Selection**: Multiple web fonts
- **Size Control**: Manual font sizing
- **Color Picker**: Text color selection
- **Positioning**: Drag text on canvas

### Mask Generation

**Subject Detection**:

1. **AI Analysis**: Replicate rembg identifies subject
2. **Mask Creation**: Transparent background generation
3. **Preview**: Overlay visualization

**Mask Options**:

- **Regeneration**: Try different mask approaches
- **Manual Editing**: Adjust mask boundaries (future)
- **Quality Control**: Accept/reject generated masks

### Canvas Composition

**Layer System**:

- **Base Image**: Original uploaded image
- **Mask Layer**: Subject isolation
- **Text Layer**: Styled text overlay
- **Composite**: Final merged result

**Interactive Controls**:

- **Text Positioning**: Drag text anywhere on image
- **Text Behind Subject**: Automatic placement behind foreground
- **Real-time Preview**: Live composition updates

### Export System

**Export Formats**:

- **PNG**: Transparent background support
- **JPG**: Optimized compression
- **Watermark**: Free tier limitation

**Quality Options**:

- **Resolution**: Up to 1080px dimension
- **Compression**: Quality vs file size balance

---

## Settings & Preferences

### User Preferences

**Path**: Header Menu → Settings

**Categories**:

#### Account Settings

- **Profile Information**: Name, email, avatar
- **Password Management**: Change password, security settings
- **Notification Preferences**: Email alerts, in-app notifications

#### Application Settings

- **Theme Selection**: Light/dark mode, custom themes
- **Language**: Interface language selection
- **Timezone**: Display timezone for dates

#### Creative Preferences

- **Default Style Presets**: Favorite text styles
- **Caption Preferences**: Default tone and length
- **Export Settings**: Default formats and quality

### Workspace Settings

**Path**: Workspace Detail → Settings Tab

**Configuration**:

- **Team Management**: Add/remove team members
- **Access Controls**: Permission levels
- **Default Configurations**: Workspace-wide defaults

### Campaign Settings

**Path**: Campaign Detail → Settings Sub-tab

**Options**:

- **Approval Workflow**: Required approvals
- **Quality Thresholds**: Minimum quality scores
- **Export Permissions**: Who can export

---

## Analytics & Reporting

### Dashboard Overview

**Path**: `/agency/analytics`

**Key Metrics**:

- **Campaign Performance**: Approval rates, generation success
- **Asset Utilization**: Most used assets, performance by type
- **Time Metrics**: Average generation time, review cycles
- **Quality Scores**: Average creative quality over time

### Campaign Analytics

**Path**: Campaign Detail → Analytics Tab

**Metrics**:

- **Generation Statistics**: Total creatives, approval rates
- **Time Tracking**: Time spent in each phase
- **Quality Distribution**: Score breakdowns
- **Platform Performance**: Success by target platform

### Export Analytics

**Tracking**:

- **Export Frequency**: How often campaigns are exported
- **Format Preferences**: Most used export formats
- **Delivery Methods**: Download vs email vs integration

---

## Error Handling & Recovery

### Common Error Scenarios

#### Authentication Errors

- **Session Expired**: Redirect to login with return URL
- **Invalid Credentials**: Clear error message with retry
- **Network Issues**: Offline detection and retry options

#### Upload Errors

- **File Too Large**: Size limit notification with compression suggestion
- **Invalid Format**: Supported formats list with conversion options
- **Network Failure**: Resume upload capability

#### Generation Errors

- **API Rate Limits**: Queue system with progress tracking
- **Service Unavailable**: Retry logic with exponential backoff
- **Content Filtering**: Clear explanation of rejected content

#### Export Errors

- **Large File Handling**: Chunked download for large exports
- **Format Conversion Failure**: Alternative format suggestions
- **Permission Issues**: Clear access requirement messaging

### Recovery Workflows

#### Interrupted Generation

1. **Detection**: System identifies incomplete generation
2. **Recovery Options**: Resume from last checkpoint
3. **Partial Results**: Access completed creatives
4. **Restart**: Full regeneration option

#### Failed Uploads

1. **Resume Upload**: Continue from breakpoint
2. **File Validation**: Re-check file requirements
3. **Alternative Methods**: Different upload approaches

#### Data Loss Prevention

- **Auto-save**: Draft saving every 30 seconds
- **Version History**: Previous versions accessible
- **Backup Export**: Regular data exports available

### User Communication

#### Error Messages

- **Clear Language**: Non-technical explanations
- **Actionable Solutions**: Specific steps to resolve
- **Contact Support**: Easy access to help resources

#### Progress Indicators

- **Loading States**: Clear progress for all operations
- **Time Estimates**: Expected completion times
- **Cancellation Options**: Ability to stop long-running processes

---

## Advanced Workflows

### Multi-Campaign Management

**Cross-Campaign Features**:

- **Asset Sharing**: Reuse assets across campaigns
- **Brand Consistency**: Apply brand kits across multiple campaigns
- **Bulk Operations**: Manage multiple campaigns simultaneously

### Team Collaboration

**Collaboration Features**:

- **Role-Based Access**: Different permission levels
- **Review Workflows**: Multi-step approval processes
- **Comment System**: Feedback on creatives
- **Activity Tracking**: Team activity logs

### Integration Workflows

**External Integrations**:

- **Social Media**: Direct posting capabilities
- **Ad Platforms**: Automated ad creation
- **CMS Systems**: Content management integration
- **Analytics Tools**: Performance data export

### Automation Features

**Automated Processes**:

- **Scheduled Generation**: Regular content creation
- **Quality Gates**: Automatic approval for high-scoring content
- **Notification System**: Alerts for completed tasks
- **Batch Processing**: Large-scale content generation

---

## Keyboard Shortcuts & Power User Features

### Global Shortcuts

- `Ctrl/Cmd + Z`: Undo last action
- `Ctrl/Cmd + Y`: Redo action
- `Ctrl/Cmd + S`: Save current work
- `Esc`: Close modals/cancel operations

### Editor Shortcuts

- `Ctrl/Cmd + C`: Copy selected creative
- `Ctrl/Cmd + V`: Paste creative
- `Delete/Backspace`: Remove selected item
- `Space`: Play/pause preview (videos)

### Navigation Shortcuts

- `1-9`: Switch between tabs
- `Ctrl/Cmd + F`: Focus search/filter
- `Ctrl/Cmd + N`: New item (campaign/asset/etc.)

---

## Mobile Responsiveness

### Responsive Design

- **Breakpoint Adaptation**: Optimized for tablet and mobile
- **Touch Interactions**: Swipe gestures, tap targets
- **Progressive Enhancement**: Core features work on all devices

### Mobile-Specific Features

- **Simplified Navigation**: Collapsible menus, bottom navigation
- **Optimized Uploads**: Camera integration, mobile file selection
- **Touch-Optimized Controls**: Larger buttons, gesture support

---

## Accessibility Features

### Screen Reader Support

- **Semantic HTML**: Proper heading structure, ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Clear focus indicators and logical tab order

### Visual Accessibility

- **High Contrast**: Sufficient color contrast ratios
- **Font Scaling**: Respects system font size preferences
- **Color Blind Support**: Color-independent design patterns

### Motor Accessibility

- **Large Click Targets**: Minimum 44px touch targets
- **Reduced Motion**: Respects prefers-reduced-motion
- **Keyboard Shortcuts**: Alternative to mouse interactions

---

This comprehensive guide covers all user workflows, from initial account setup through advanced campaign management and creative generation. The application is designed to be intuitive while providing powerful features for creative agencies managing complex social media campaigns.</content>
<parameter name="filePath">/Users/pranay/Projects/caption-art/USER_FLOW_GUIDE.md
