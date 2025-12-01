# Agency Jobflow API Documentation

## Overview

Complete REST API for the agency jobflow system. All endpoints are tested and functional.

**Base URL:** `http://localhost:3001/api`
**Authentication:** Cookie-based sessions
**Content-Type:** `application/json` (except file uploads)

## 🔐 Authentication

### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "agencyName": "My Agency"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "agencyId": "agency_123"
  },
  "agency": {
    "id": "agency_123",
    "planType": "free",
    "billingActive": false
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /auth/me
Cookie: session=your-session-id
```

### Logout
```http
POST /auth/logout
Cookie: session=your-session-id
```

## 🏢 Workspaces

### Create Workspace
```http
POST /workspaces
Cookie: session=your-session-id
Content-Type: application/json

{
  "clientName": "Client Name"
}
```

### List Workspaces
```http
GET /workspaces
Cookie: session=your-session-id
```

**Response:**
```json
{
  "workspaces": [
    {
      "id": "workspace_123",
      "agencyId": "agency_123",
      "clientName": "Client Name",
      "brandKitId": "brandkit_123",
      "createdAt": "2025-12-01T14:32:33.339Z"
    }
  ]
}
```

### Update Workspace
```http
PUT /workspaces/:workspaceId
Cookie: session=your-session-id
Content-Type: application/json

{
  "clientName": "Updated Client Name"
}
```

### Delete Workspace
```http
DELETE /workspaces/:workspaceId
Cookie: session=your-session-id
```

## 🎨 Brand Kits

### Create Brand Kit
```http
POST /brand-kits
Cookie: session=your-session-id
Content-Type: application/json

{
  "workspaceId": "workspace_123",
  "colors": {
    "primary": "#FF6B35",
    "secondary": "#004E89",
    "tertiary": "#A8DADC"
  },
  "fonts": {
    "heading": "Inter Bold",
    "body": "Inter Regular"
  },
  "voicePrompt": "Create engaging, professional captions that highlight our brand values and connect with our target audience. Use a confident but approachable tone."
}
```

**Response:**
```json
{
  "brandKit": {
    "id": "brandkit_123",
    "workspaceId": "workspace_123",
    "colors": {
      "primary": "#FF6B35",
      "secondary": "#004E89",
      "tertiary": "#A8DADC"
    },
    "fonts": {
      "heading": "Inter Bold",
      "body": "Inter Regular"
    },
    "voicePrompt": "Create engaging, professional captions...",
    "createdAt": "2025-12-01T12:16:14.063Z",
    "updatedAt": "2025-12-01T12:16:14.063Z"
  }
}
```

### Get Brand Kit by Workspace
```http
GET /brand-kits/workspace/:workspaceId
Cookie: session=your-session-id
```

### Update Brand Kit
```http
PUT /brand-kits/:brandKitId
Cookie: session=your-session-id
Content-Type: application/json

{
  "colors": {
    "primary": "#FF6B35",
    "secondary": "#004E89",
    "tertiary": "#FFD23F"
  },
  "voicePrompt": "Updated voice prompt text..."
}
```

## 📁 Asset Upload

### Upload Files
```http
POST /assets/upload
Cookie: session=your-session-id
Content-Type: multipart/form-data

workspaceId=workspace_123&files=@image1.png&files=@image2.jpg
```

**Response:**
```json
{
  "message": "Successfully uploaded 2 assets",
  "assets": [
    {
      "id": "asset_123",
      "workspaceId": "workspace_123",
      "filename": "files-1234567890-123456789.png",
      "originalName": "image1.png",
      "mimeType": "image/png",
      "size": 1024,
      "url": "/uploads/files-1234567890-123456789.png",
      "uploadedAt": "2025-12-01T13:48:48.351Z"
    }
  ]
}
```

### Get Workspace Assets
```http
GET /assets/workspace/:workspaceId
Cookie: session=your-session-id
```

### Delete Asset
```http
DELETE /assets/:assetId
Cookie: session=your-session-id
```

## 🤖 Batch Generation

### Start Batch Generation
```http
POST /batch/generate
Cookie: session=your-session-id
Content-Type: application/json

{
  "workspaceId": "workspace_123",
  "assetIds": ["asset_123", "asset_456"]
}
```

**Response:**
```json
{
  "jobId": "batch_123",
  "message": "Started batch generation for 2 assets"
}
```

### Get Job Status
```http
GET /batch/jobs/:jobId
Cookie: session=your-session-id
```

**Response:**
```json
{
  "job": {
    "id": "batch_123",
    "workspaceId": "workspace_123",
    "assetIds": ["asset_123", "asset_456"],
    "status": "completed",
    "processedCount": 2,
    "totalCount": 2,
    "createdAt": "2025-12-01T14:38:02.882Z",
    "startedAt": "2025-12-01T14:38:02.882Z",
    "completedAt": "2025-12-01T14:38:05.823Z"
  },
  "captions": [
    {
      "assetId": "asset_123",
      "assetName": "image1.png",
      "caption": {
        "id": "caption_123",
        "text": "Unleash your inner creativity... #InnovateInspire",
        "status": "completed",
        "generatedAt": "2025-12-01T14:38:04.822Z"
      }
    }
  ]
}
```

### Get Workspace Captions
```http
GET /batch/workspace/:workspaceId/captions
Cookie: session=your-session-id
```

**Response:**
```json
{
  "captions": [
    {
      "id": "caption_123",
      "assetId": "asset_123",
      "text": "Unleash your inner creativity... #InnovateInspire",
      "status": "completed",
      "createdAt": "2025-12-01T14:38:02.882Z",
      "generatedAt": "2025-12-01T14:38:04.822Z",
      "asset": {
        "id": "asset_123",
        "originalName": "image1.png",
        "mimeType": "image/png",
        "url": "/uploads/files-1234567890-123456789.png"
      }
    }
  ]
}
```

### Edit Caption
```http
PUT /batch/captions/:captionId
Cookie: session=your-session-id
Content-Type: application/json

{
  "text": "Updated caption text..."
}
```

## 📁 Static Files

Uploaded files are served at:
```http
GET /uploads/:filename
```

## 🔒 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `500` - Internal Server Error

## 📋 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Default limit: 100 requests per 15 minutes per IP
- File upload: 10 requests per minute per IP

## 🧪 Testing

All endpoints have been tested with:
- ✅ Successful requests
- ✅ Authentication/authorization
- ✅ Validation errors
- ✅ Edge cases
- ✅ File upload scenarios

## 🚀 Frontend Integration

### Session Management
The API uses HTTP-only cookies for authentication. Simply include cookies in requests after login.

### File Uploads
Use `FormData` for multi-file uploads:
```javascript
const formData = new FormData();
formData.append('workspaceId', workspaceId);
files.forEach(file => formData.append('files', file));

fetch('/api/assets/upload', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
```

### Real-time Updates
For batch generation status, poll the job endpoint:
```javascript
const checkJobStatus = async (jobId) => {
  const response = await fetch(`/api/batch/jobs/${jobId}`, {
    credentials: 'include'
  });
  return response.json();
};
```

## 📊 System Limits

- **Files per upload:** 10 maximum
- **File size:** 50MB maximum
- **Assets per workspace:** 10 maximum
- **Batch generation:** 10 assets maximum
- **Caption generation:** ~2-3 seconds per asset

## 🔧 Development Server

Start the backend server:
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## 📝 Notes

- All data is stored in memory for v1 (will be migrated to database)
- File uploads are stored in local `uploads/` directory
- OpenAI API key required in `.env` file
- Single-thread processing for batch generation (by design)