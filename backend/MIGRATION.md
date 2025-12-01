# Migration Guide: AWS Lambda to Platform-Agnostic Backend

This guide helps you migrate from the AWS Lambda-based backend to the platform-agnostic Express.js backend.

## Table of Contents

- [Overview](#overview)
- [Key Differences](#key-differences)
- [Step-by-Step Migration](#step-by-step-migration)
- [Code Changes](#code-changes)
- [Testing the Migration](#testing-the-migration)
- [Rollback Procedure](#rollback-procedure)
- [Common Issues](#common-issues)

## Overview

The platform-agnostic backend maintains all the functionality of the Lambda version while removing AWS-specific dependencies. This makes the service portable, easier to develop locally, and deployable to any platform.

### What Changes

- **Infrastructure**: Lambda + API Gateway → Express.js server
- **Configuration**: AWS SSM Parameter Store → Environment variables
- **Image URLs**: S3 presigned URLs → Direct image URLs or base64
- **Deployment**: AWS-specific → Platform-agnostic (Docker, PaaS, VPS, etc.)

### What Stays the Same

- **Business Logic**: All caption and mask generation logic is preserved
- **External APIs**: Same Replicate and OpenAI integrations
- **API Responses**: Identical response structures for frontend compatibility
- **License Verification**: Same Gumroad integration

## Key Differences

### 1. Handler Format

**Lambda (Before):**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda'

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body || '{}')
  // ... process request
  return {
    statusCode: 200,
    body: JSON.stringify({ result })
  }
}
```

**Express (After):**
```typescript
import { Router, Request, Response } from 'express'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const body = req.body
  // ... process request
  res.json({ result })
})

export default router
```

### 2. Configuration Management

**Lambda (Before):**
```typescript
import { getParam } from './utils/ssm'

const replicateToken = await getParam('/caption-art/REPLICATE_API_TOKEN')
const openaiKey = await getParam('/caption-art/OPENAI_API_KEY')
```

**Express (After):**
```typescript
import { config } from './config'

const replicateToken = config.replicate.apiToken
const openaiKey = config.openai.apiKey
```

### 3. Image URL Handling

**Lambda (Before):**
```typescript
import { S3 } from 'aws-sdk'

const s3 = new S3()
const imageUrl = await s3.getSignedUrl('getObject', {
  Bucket: bucket,
  Key: s3Key,
  Expires: 300
})
```

**Express (After):**
```typescript
// Frontend sends direct image URL or base64
const { imageUrl } = req.body

// No S3 interaction needed - use URL directly
```

### 4. Error Handling

**Lambda (Before):**
```typescript
try {
  // ... process
  return {
    statusCode: 200,
    body: JSON.stringify({ result })
  }
} catch (error) {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: error.message })
  }
}
```

**Express (After):**
```typescript
try {
  // ... process
  res.json({ result })
} catch (error) {
  // Error middleware handles this automatically
  throw error
}
```

### 5. CORS Configuration

**Lambda (Before):**
```typescript
return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  body: JSON.stringify({ result })
}
```

**Express (After):**
```typescript
// CORS middleware handles this automatically
// Configured in src/middleware/cors.ts
res.json({ result })
```

## Step-by-Step Migration

### Phase 1: Preparation (1-2 hours)

1. **Review Current Lambda Functions**
   ```bash
   cd lambdas/src
   ls -la
   # Review: caption.ts, mask.ts, verify.ts
   ```

2. **Document Current API Endpoints**
   - List all Lambda functions
   - Document request/response formats
   - Note any custom configurations

3. **Gather API Keys**
   - Export from AWS SSM Parameter Store:
   ```bash
   aws ssm get-parameter --name /caption-art/REPLICATE_API_TOKEN --with-decryption
   aws ssm get-parameter --name /caption-art/OPENAI_API_KEY --with-decryption
   aws ssm get-parameter --name /caption-art/GUMROAD_PRODUCT_PERMALINK --with-decryption
   aws ssm get-parameter --name /caption-art/GUMROAD_ACCESS_TOKEN --with-decryption
   ```

### Phase 2: Setup New Backend (30 minutes)

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Add your API keys
   ```

3. **Verify Configuration**
   ```bash
   # Test that config loads correctly
   npm run build
   node -e "require('./dist/config').config"
   ```

### Phase 3: Update Frontend (1 hour)

The frontend needs to send direct image URLs instead of S3 keys.

**Before (Lambda):**
```typescript
// Upload to S3 first
const s3Key = await uploadToS3(imageFile)

// Send S3 key to Lambda
const response = await fetch('https://api-gateway-url/caption', {
  method: 'POST',
  body: JSON.stringify({ s3Key })
})
```

**After (Express):**
```typescript
// Option 1: Convert to base64
const base64 = await fileToBase64(imageFile)
const response = await fetch('http://localhost:3001/api/caption', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl: base64 })
})

// Option 2: Upload to any image host and use URL
const imageUrl = await uploadToImageHost(imageFile)
const response = await fetch('http://localhost:3001/api/caption', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl })
})
```

### Phase 4: Local Testing (1-2 hours)

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test Health Endpoint**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Test Caption Endpoint**
   ```bash
   curl -X POST http://localhost:3001/api/caption \
     -H "Content-Type: application/json" \
     -d '{"imageUrl": "https://example.com/test-image.jpg"}'
   ```

4. **Test Mask Endpoint**
   ```bash
   curl -X POST http://localhost:3001/api/mask \
     -H "Content-Type: application/json" \
     -d '{"imageUrl": "https://example.com/test-image.jpg"}'
   ```

5. **Test License Verification**
   ```bash
   curl -X POST http://localhost:3001/api/verify \
     -H "Content-Type: application/json" \
     -d '{"licenseKey": "test-key"}'
   ```

6. **Test with Frontend**
   ```bash
   # Update frontend .env.local
   echo "VITE_BACKEND_URL=http://localhost:3001" >> frontend/.env.local
   
   # Start frontend
   cd frontend
   npm run dev
   
   # Test full flow in browser
   ```

### Phase 5: Deploy to Staging (2-4 hours)

Choose your deployment platform and follow the appropriate guide:

**Docker:**
```bash
cd backend
docker build -t caption-backend .
docker run -p 3001:3001 --env-file .env caption-backend
```

**Railway:**
```bash
railway login
railway up
# Set environment variables in Railway dashboard
```

**Render:**
1. Connect GitHub repository
2. Create new Web Service
3. Set environment variables
4. Deploy

**VPS:**
```bash
ssh user@your-server
git clone <repo-url>
cd backend
npm install
npm run build
pm2 start dist/server.js --name caption-backend
```

### Phase 6: Update Frontend for Production (30 minutes)

```bash
# Update frontend environment
echo "VITE_BACKEND_URL=https://your-backend-url.com" >> frontend/.env.production

# Build and deploy frontend
cd frontend
npm run build
# Deploy to your hosting (S3, Netlify, Vercel, etc.)
```

### Phase 7: Production Testing (1 hour)

1. **Smoke Tests**
   - Test all endpoints in production
   - Verify CORS works from frontend domain
   - Check error handling
   - Monitor response times

2. **Load Testing**
   ```bash
   # Install autocannon
   npm install -g autocannon
   
   # Test caption endpoint
   autocannon -c 10 -d 30 -m POST \
     -H "Content-Type: application/json" \
     -b '{"imageUrl":"https://example.com/test.jpg"}' \
     https://your-backend-url.com/api/caption
   ```

3. **Monitor Logs**
   ```bash
   # Docker
   docker logs -f <container-id>
   
   # PM2
   pm2 logs caption-backend
   
   # Railway/Render
   # Check logs in dashboard
   ```

### Phase 8: Gradual Rollout (Optional)

If you want to minimize risk, use a gradual rollout:

1. **Deploy new backend alongside Lambda**
2. **Route 10% of traffic to new backend**
3. **Monitor for 24 hours**
4. **Increase to 50% if stable**
5. **Monitor for 24 hours**
6. **Route 100% to new backend**
7. **Keep Lambda running for 1 week as backup**
8. **Decommission Lambda**

## Code Changes

### Caption Route Migration

**Lambda (`lambdas/src/caption.ts`):**
```typescript
export const handler: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body || '{}')
  const { s3Key } = body
  
  // Get presigned URL from S3
  const imageUrl = await s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: s3Key
  })
  
  // Load secrets from SSM
  const replicateToken = await getParam('/caption-art/REPLICATE_API_TOKEN')
  
  // Generate caption
  const replicate = new Replicate({ auth: replicateToken })
  const output = await replicate.run(model, { input: { image: imageUrl } })
  
  return {
    statusCode: 200,
    body: JSON.stringify({ baseCaption: output })
  }
}
```

**Express (`backend/src/routes/caption.ts`):**
```typescript
router.post('/', async (req: Request, res: Response) => {
  const { imageUrl } = req.body
  
  // Validate input
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL required' })
  }
  
  // Use imageUrl directly (no S3 interaction)
  // Config loaded from environment variables
  const baseCaption = await generateBaseCaption(imageUrl)
  
  res.json({ baseCaption })
})
```

### Service Client Migration

**Lambda:**
```typescript
// Secrets loaded on each invocation
const token = await getParam('/caption-art/REPLICATE_API_TOKEN')
const replicate = new Replicate({ auth: token })
```

**Express:**
```typescript
// Config loaded once at startup
import { config } from '../config'
const replicate = new Replicate({ auth: config.replicate.apiToken })
```

## Testing the Migration

### Automated Testing

```bash
# Run all tests
cd backend
npm test

# Run specific test suites
npm test -- src/routes/caption.test.ts
npm test -- src/services/replicate.test.ts

# Run property-based tests
npm test -- --grep "property"
```

### Manual Testing Checklist

- [ ] Health endpoint returns 200
- [ ] Caption generation works with valid image URL
- [ ] Caption generation returns 400 for missing imageUrl
- [ ] Mask generation works with valid image URL
- [ ] Mask generation returns 400 for missing imageUrl
- [ ] License verification works with valid key
- [ ] License verification returns 400 for missing key
- [ ] CORS headers present in all responses
- [ ] Rate limiting works (429 after threshold)
- [ ] Error responses are user-friendly
- [ ] Logs show request/response details
- [ ] Frontend can call all endpoints
- [ ] Response times are acceptable (<2s for caption)

### Comparison Testing

Test that responses match between Lambda and Express:

```bash
# Test Lambda
curl -X POST https://lambda-api-gateway-url/caption \
  -d '{"s3Key":"test.jpg"}' > lambda-response.json

# Test Express
curl -X POST http://localhost:3001/api/caption \
  -d '{"imageUrl":"https://example.com/test.jpg"}' > express-response.json

# Compare (should have same structure)
diff lambda-response.json express-response.json
```

## Rollback Procedure

If you need to rollback to Lambda:

### Immediate Rollback (< 5 minutes)

1. **Update Frontend Environment**
   ```bash
   # Point back to Lambda API Gateway
   VITE_BACKEND_URL=https://lambda-api-gateway-url
   ```

2. **Redeploy Frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy to hosting
   ```

3. **Verify Lambda is Working**
   ```bash
   curl https://lambda-api-gateway-url/health
   ```

### Planned Rollback (if issues found during testing)

1. **Keep Lambda Running**
   - Don't delete Lambda functions until Express is proven stable
   - Keep API Gateway active

2. **Use Feature Flags**
   ```typescript
   const BACKEND_URL = process.env.USE_NEW_BACKEND === 'true'
     ? 'https://express-backend-url'
     : 'https://lambda-api-gateway-url'
   ```

3. **Monitor Both Systems**
   - Compare error rates
   - Compare response times
   - Compare costs

### Data Considerations

- **No data migration needed**: Both systems are stateless
- **S3 bucket**: Can remain if needed for other purposes
- **SSM parameters**: Keep for rollback capability
- **CloudWatch logs**: Retain for historical analysis

## Common Issues

### Issue 1: CORS Errors

**Symptom**: Browser shows CORS policy errors

**Solution**:
```bash
# Update .env
CORS_ORIGIN=https://your-frontend-domain.com

# Restart server
npm run dev
```

### Issue 2: API Keys Not Working

**Symptom**: 502 errors from external APIs

**Solution**:
```bash
# Verify keys are correct
echo $REPLICATE_API_TOKEN
echo $OPENAI_API_KEY

# Test keys directly
curl https://api.replicate.com/v1/models \
  -H "Authorization: Token $REPLICATE_API_TOKEN"

# Check for whitespace/newlines
cat .env | grep REPLICATE_API_TOKEN | od -c
```

### Issue 3: Image URLs Not Working

**Symptom**: Replicate can't access image URLs

**Solution**:
- Ensure images are publicly accessible
- Check image URL is valid and returns 200
- Try with base64-encoded images instead
- Verify image format (JPG/PNG)

### Issue 4: Port Already in Use

**Symptom**: `EADDRINUSE` error on startup

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3002 npm run dev
```

### Issue 5: Environment Variables Not Loading

**Symptom**: "Missing required environment variable" error

**Solution**:
```bash
# Verify .env file exists
ls -la .env

# Check file contents
cat .env

# Ensure no syntax errors
# Each line should be: KEY=value (no spaces around =)

# Restart server
npm run dev
```

### Issue 6: Different Response Format

**Symptom**: Frontend expects different response structure

**Solution**:
- Check Lambda response format
- Update Express route to match exactly
- Add response transformation if needed
- Update frontend to handle new format

### Issue 7: Performance Degradation

**Symptom**: Slower response times than Lambda

**Solution**:
- Check external API latency
- Monitor server resources
- Enable response caching
- Consider horizontal scaling
- Optimize cold start (if using serverless platform)

## Post-Migration Cleanup

After successful migration and stable operation (1-2 weeks):

1. **Decommission Lambda Functions**
   ```bash
   aws lambda delete-function --function-name caption-function
   aws lambda delete-function --function-name mask-function
   aws lambda delete-function --function-name verify-function
   ```

2. **Remove API Gateway**
   ```bash
   aws apigateway delete-rest-api --rest-api-id <api-id>
   ```

3. **Clean Up S3 (if not needed)**
   ```bash
   # Only if you're not using S3 for uploads anymore
   aws s3 rb s3://your-upload-bucket --force
   ```

4. **Archive SSM Parameters**
   ```bash
   # Keep for reference but can delete if confident
   aws ssm delete-parameter --name /caption-art/REPLICATE_API_TOKEN
   aws ssm delete-parameter --name /caption-art/OPENAI_API_KEY
   ```

5. **Update Documentation**
   - Update deployment docs
   - Update architecture diagrams
   - Archive Lambda-specific guides

## Benefits After Migration

- **Portability**: Run anywhere Node.js is supported
- **Local Development**: Easier to develop and test locally
- **Cost Flexibility**: Choose the most cost-effective hosting
- **Simpler Architecture**: Fewer moving parts, easier to understand
- **Better Debugging**: Standard Node.js debugging tools
- **No Cold Starts**: (if using always-on hosting)
- **More Control**: Full control over server configuration

## Support

If you encounter issues during migration:

1. Check this guide's [Common Issues](#common-issues) section
2. Review the [Troubleshooting](./README.md#troubleshooting) section in README
3. Check server logs for detailed error messages
4. Open an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - Environment details (Node version, platform, etc.)

## Additional Resources

- [Backend README](./README.md) - Complete backend documentation
- [Deployment Guide](./DEPLOYMENT.md) - Platform-specific deployment instructions
- [Development Guide](./DEVELOPMENT.md) - Local development setup
- [API Documentation](./README.md#api-endpoints) - Endpoint reference
