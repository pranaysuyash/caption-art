# Design Document - Backend Architecture Simplification

> **⚠️ SUPERSEDED**: This spec has been superseded by the **platform-agnostic-backend** spec (`.kiro/specs/platform-agnostic-backend/`). See [SUPERSEDED.md](./SUPERSEDED.md) for details.

## Overview

This design document outlines the technical approach for migrating from a complex AWS infrastructure (S3, Lambda, API Gateway, CloudFront, SSM, WAF) to a streamlined Vercel Functions architecture. The migration reduces complexity, cost, and maintenance overhead while maintaining security, functionality, and performance.

The simplified architecture:
- Vercel Functions replace AWS Lambda
- Vercel's edge network replaces CloudFront CDN
- Vercel environment variables replace AWS SSM
- Vercel's built-in security replaces WAF
- Direct S3 integration or Vercel Blob Storage

## Architecture

### Current AWS Architecture (Complex)

```
User → CloudFront CDN → S3 (Frontend)
    ↓
API Gateway → Lambda Functions → External APIs (Replicate, OpenAI, Gumroad)
    ↓                    ↓
   WAF              SSM (Secrets)
    ↓
S3 (Image Storage)
```

**Components**: 8 AWS services
**Complexity**: High
**Cost**: ₹2k-5k/month
**Maintenance**: Significant

### New Vercel Architecture (Simple)

```
User → Vercel Edge Network (Frontend + Functions)
    ↓
Vercel Functions → External APIs (Replicate, OpenAI, Gumroad)
    ↓
Environment Variables (Secrets)
    ↓
Vercel Blob Storage or Direct Upload
```

**Components**: 1 platform (Vercel)
**Complexity**: Low
**Cost**: ₹0-1.5k/month
**Maintenance**: Minimal

### Component Structure

```
project/
├── api/
│   ├── caption.ts                 # Caption generation endpoint
│   ├── mask.ts                    # Mask generation endpoint
│   ├── verify.ts                  # License verification endpoint
│   └── upload.ts                  # Image upload endpoint (optional)
├── frontend/
│   └── (existing React app)
├── lib/
│   ├── replicate.ts               # Replicate client
│   ├── openai.ts                  # OpenAI client
│   └── gumroad.ts                 # Gumroad client
└── vercel.json                    # Vercel configuration
```

## Components and Interfaces

### 1. Caption Generation Endpoint

**Purpose**: Generates AI-powered caption suggestions

**Interface**:
```typescript
// api/caption.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface CaptionRequest {
  imageUrl: string
}

interface CaptionResponse {
  baseCaption: string
  variants: string[]
  error?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void>
```

**Implementation**:
```typescript
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { imageUrl } = req.body as CaptionRequest
    
    // Validate input
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' })
    }
    
    // Call Replicate BLIP
    const baseCaption = await generateBaseCaption(imageUrl)
    
    // Call OpenAI for variants
    const variants = await generateVariants(baseCaption)
    
    return res.status(200).json({
      baseCaption,
      variants
    })
  } catch (error) {
    console.error('Caption generation error:', error)
    return res.status(500).json({
      error: 'Caption generation failed'
    })
  }
}
```

**Environment Variables**:
- `REPLICATE_API_TOKEN`
- `OPENAI_API_KEY`

### 2. Mask Generation Endpoint

**Purpose**: Generates subject masks for text-behind effect

**Interface**:
```typescript
// api/mask.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface MaskRequest {
  imageUrl: string
}

interface MaskResponse {
  maskUrl: string
  error?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void>
```

**Implementation**:
```typescript
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { imageUrl } = req.body as MaskRequest
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' })
    }
    
    // Call Replicate rembg
    const maskUrl = await generateMask(imageUrl)
    
    return res.status(200).json({ maskUrl })
  } catch (error) {
    console.error('Mask generation error:', error)
    return res.status(500).json({
      error: 'Mask generation failed'
    })
  }
}
```

**Environment Variables**:
- `REPLICATE_API_TOKEN`

### 3. License Verification Endpoint

**Purpose**: Verifies Gumroad license keys

**Interface**:
```typescript
// api/verify.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface VerifyRequest {
  licenseKey: string
}

interface VerifyResponse {
  valid: boolean
  email?: string
  error?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void>
```

**Implementation**:
```typescript
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { licenseKey } = req.body as VerifyRequest
    
    if (!licenseKey) {
      return res.status(400).json({ error: 'License key required' })
    }
    
    // Call Gumroad API
    const result = await verifyLicense(licenseKey)
    
    return res.status(200).json({
      valid: result.valid,
      email: result.email
    })
  } catch (error) {
    console.error('License verification error:', error)
    return res.status(500).json({
      error: 'Verification failed'
    })
  }
}
```

**Environment Variables**:
- `GUMROAD_PRODUCT_PERMALINK`
- `GUMROAD_ACCESS_TOKEN` (optional)

### 4. Image Upload Endpoint (Optional)

**Purpose**: Provides temporary image hosting

**Interface**:
```typescript
// api/upload.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface UploadResponse {
  url: string
  error?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void>
```

**Implementation Options**:

**Option A: Direct Client Upload (Recommended)**:
- Client converts image to base64
- Passes directly to caption/mask APIs
- No server-side storage needed
- Simplest approach

**Option B: Vercel Blob Storage**:
```typescript
import { put } from '@vercel/blob'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { filename, file } = req.body
    
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true
    })
    
    return res.status(200).json({ url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
```

**Option C: S3 Presigned URLs**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { filename, contentType } = req.body
    
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })
    
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `uploads/${Date.now()}-${filename}`,
      ContentType: contentType
    })
    
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600
    })
    
    return res.status(200).json({ url: presignedUrl })
  } catch (error) {
    console.error('Presign error:', error)
    return res.status(500).json({ error: 'Presign failed' })
  }
}
```

## Data Models

### API Request/Response Types

```typescript
// types/api.ts

export interface CaptionRequest {
  imageUrl: string
}

export interface CaptionResponse {
  baseCaption: string
  variants: string[]
  error?: string
}

export interface MaskRequest {
  imageUrl: string
}

export interface MaskResponse {
  maskUrl: string
  error?: string
}

export interface VerifyRequest {
  licenseKey: string
}

export interface VerifyResponse {
  valid: boolean
  email?: string
  error?: string
}

export interface ErrorResponse {
  error: string
  details?: string
}
```

### Environment Configuration

```typescript
// lib/config.ts

export const config = {
  replicate: {
    apiToken: process.env.REPLICATE_API_TOKEN!,
    blipModel: 'salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
    rembgModel: 'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-3.5-turbo',
    temperature: 0.8
  },
  gumroad: {
    productPermalink: process.env.GUMROAD_PRODUCT_PERMALINK!,
    accessToken: process.env.GUMROAD_ACCESS_TOKEN
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API endpoint availability
*For any* deployed Vercel function, the endpoint should respond to HTTP requests within 500ms (cold start) or 100ms (warm)
**Validates: Requirements 5.1, 5.2**

### Property 2: Environment variable security
*For any* API key stored in Vercel environment variables, it should not be exposed in client-side code or API responses
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: CORS header presence
*For any* API endpoint response, it should include appropriate CORS headers allowing frontend access
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 4: Error response format
*For any* API error, the response should include a user-friendly error message and appropriate HTTP status code
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 5: Functional equivalence
*For any* API endpoint (caption, mask, verify), the response data structure should match the AWS Lambda implementation
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 6: Concurrent request handling
*For any* number of simultaneous requests, the system should handle them concurrently without queuing or blocking
**Validates: Requirements 5.3**

### Property 7: Auto-scaling behavior
*For any* traffic spike, Vercel should automatically scale function instances to handle increased load
**Validates: Requirements 5.4**

### Property 8: Timeout enforcement
*For any* function execution exceeding 60 seconds, Vercel should terminate it and return a timeout error
**Validates: Requirements 5.5**

### Property 9: Cost efficiency
*For any* usage within free tier limits (100GB bandwidth, 100 hours compute), the hosting cost should be ₹0
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 10: Deployment simplicity
*For any* code change, deploying to production should require only a single command (`vercel deploy`)
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 11: Secret rotation support
*For any* environment variable update, the change should take effect on next function invocation without code deployment
**Validates: Requirements 2.5**

### Property 12: Logging availability
*For any* function execution, logs should be available in Vercel dashboard for debugging
**Validates: Requirements 6.1**

## Error Handling

### Function Execution Errors

**Unhandled Exceptions**:
- Catch all exceptions in try-catch blocks
- Log error details to Vercel logs
- Return 500 status with user-friendly message
- Don't expose stack traces to clients

**Timeout Errors**:
- Vercel enforces 60-second timeout
- Design functions to complete within 30 seconds
- Return partial results if possible
- Provide retry guidance to users

**Memory Limit Errors**:
- Vercel provides 1GB memory per function
- Monitor memory usage
- Optimize for memory efficiency
- Return 500 status if exceeded

### External API Errors

**Replicate API Failures**:
- Retry up to 3 times with exponential backoff
- Return 502 Bad Gateway status
- Include error message from Replicate
- Log full error for debugging

**OpenAI API Failures**:
- Retry up to 2 times
- Return 502 Bad Gateway status
- Provide fallback responses if possible
- Log full error for debugging

**Gumroad API Failures**:
- Retry once
- Return 502 Bad Gateway status
- Indicate verification unavailable
- Log full error for debugging

### Input Validation Errors

**Missing Required Fields**:
- Check for required fields
- Return 400 Bad Request status
- List missing fields in error message

**Invalid Data Types**:
- Validate data types
- Return 400 Bad Request status
- Explain expected format

**Malformed Requests**:
- Catch JSON parse errors
- Return 400 Bad Request status
- Indicate invalid JSON

### Rate Limiting

**Vercel Rate Limits**:
- Vercel has built-in rate limiting
- Return 429 Too Many Requests status
- Include Retry-After header
- Log rate limit hits

**External API Rate Limits**:
- Detect rate limit responses
- Return 429 status to client
- Include retry guidance
- Implement client-side backoff

## Testing Strategy

### Unit Tests

**API Endpoints**:
- Test request validation
- Test response formatting
- Test error handling
- Test CORS headers

**External API Clients**:
- Test Replicate client
- Test OpenAI client
- Test Gumroad client
- Mock API responses

**Configuration**:
- Test environment variable loading
- Test missing variable handling
- Test invalid configuration

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: API endpoint availability**
- Generate random requests
- Measure response time
- Verify within timeout limits

**Property 2: Environment variable security**
- Generate random API responses
- Scan for API keys
- Verify none exposed

**Property 3: CORS header presence**
- Generate random requests
- Check response headers
- Verify CORS headers present

**Property 4: Error response format**
- Generate random error conditions
- Check response structure
- Verify user-friendly messages

**Property 5: Functional equivalence**
- Generate random inputs
- Call both AWS and Vercel endpoints
- Compare response structures

**Property 6: Concurrent request handling**
- Generate random concurrent requests
- Execute simultaneously
- Verify all complete successfully

**Property 7: Auto-scaling behavior**
- Generate traffic spikes
- Monitor function instances
- Verify scaling occurs

**Property 8: Timeout enforcement**
- Mock long-running operations
- Verify timeout at 60 seconds

**Property 9: Cost efficiency**
- Track usage metrics
- Calculate costs
- Verify within free tier

**Property 10: Deployment simplicity**
- Deploy code changes
- Verify single command works
- Verify no manual steps needed

**Property 11: Secret rotation support**
- Update environment variables
- Invoke functions
- Verify new values used

**Property 12: Logging availability**
- Execute functions
- Check Vercel dashboard
- Verify logs present

### Integration Tests

**Full API Flow**:
- Call caption endpoint with real image
- Verify response structure
- Verify caption quality

**Error Handling Flow**:
- Trigger various errors
- Verify appropriate responses
- Verify error logging

**CORS Flow**:
- Make cross-origin requests
- Verify CORS headers work
- Verify preflight requests handled

**Environment Variables**:
- Deploy with test variables
- Verify functions use them
- Verify security maintained

## Implementation Notes

### Vercel Configuration

**vercel.json**:
```json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### Environment Variables Setup

**Local Development (.env.local)**:
```bash
REPLICATE_API_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here
GUMROAD_PRODUCT_PERMALINK=caption-art
GUMROAD_ACCESS_TOKEN=your_token_here
```

**Vercel Dashboard**:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add each variable
4. Select environments (Production, Preview, Development)
5. Save

**CLI Method**:
```bash
vercel env add REPLICATE_API_TOKEN
vercel env add OPENAI_API_KEY
vercel env add GUMROAD_PRODUCT_PERMALINK
vercel env add GUMROAD_ACCESS_TOKEN
```

### Deployment Process

**Initial Deployment**:
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel deploy --prod
```

**Continuous Deployment**:
- Connect GitHub repository to Vercel
- Automatic deployments on push to main
- Preview deployments for pull requests
- Rollback support

### Migration Steps

1. **Create Vercel Project**:
   - Sign up for Vercel account
   - Create new project
   - Connect Git repository

2. **Set Up Environment Variables**:
   - Add all API keys to Vercel
   - Verify they're encrypted
   - Test in preview environment

3. **Create API Endpoints**:
   - Create `api/` directory
   - Implement caption.ts
   - Implement mask.ts
   - Implement verify.ts

4. **Update Frontend**:
   - Change API URLs to Vercel functions
   - Test all endpoints
   - Verify CORS works

5. **Test Thoroughly**:
   - Test all API endpoints
   - Test error handling
   - Test with real data
   - Load test if needed

6. **Deploy to Production**:
   - Deploy to Vercel
   - Update DNS if needed
   - Monitor for errors
   - Verify all features work

7. **Decommission AWS**:
   - Verify Vercel is working
   - Delete AWS Lambda functions
   - Delete API Gateway
   - Delete CloudFront distribution
   - Delete S3 buckets (after backup)
   - Delete WAF rules
   - Cancel AWS services

### Cost Comparison

**AWS (Current)**:
- S3: ₹100/month
- Lambda: ₹500/month
- API Gateway: ₹300/month
- CloudFront: ₹500/month
- WAF: ₹500/month
- **Total: ₹1,900/month minimum**

**Vercel (New)**:
- Hobby (Free): 100GB bandwidth, 100 hours compute
- Pro (₹1,500/month): Unlimited bandwidth, 1000 hours compute
- **Total: ₹0-1,500/month**

**Savings**: ₹400-1,900/month (21-100%)

### Performance Optimization

- Use edge functions for low latency
- Cache API responses when possible
- Optimize function cold starts
- Use streaming responses for large data
- Monitor performance metrics

### Security Best Practices

- Never commit API keys to Git
- Use environment variables for secrets
- Validate all inputs
- Sanitize error messages
- Enable Vercel's security features
- Monitor for suspicious activity
- Rotate API keys regularly

### Monitoring and Logging

- Use Vercel Analytics
- Monitor function execution times
- Track error rates
- Set up alerts for failures
- Review logs regularly
- Monitor costs

### Rollback Strategy

- Keep AWS infrastructure for 1 month
- Test Vercel thoroughly before decommissioning
- Have rollback plan ready
- Document rollback steps
- Monitor closely after migration
