# Design Document - Platform-Agnostic Backend

## Overview

This design document outlines adapting the existing AWS Lambda backend to a simple, portable Express.js architecture that can run anywhere - local development, Docker containers, or any cloud provider. The design reuses existing business logic from Lambda functions while eliminating platform lock-in and maintaining security, functionality, and performance.

The architecture:
- Standard Express.js HTTP server
- Reuses existing Lambda business logic (Replicate, OpenAI, Gumroad clients)
- Environment variable configuration (replaces AWS SSM)
- Docker containerization support
- Works on any Node.js-compatible platform
- No vendor-specific APIs or services (removes S3, SSM, API Gateway dependencies)

## Architecture

### Simple Architecture

```
User → Frontend (Browser)
    ↓
HTTP Request → Backend Service (Express.js)
    ↓
External APIs (Replicate, OpenAI, Gumroad)
```

**Components**: 1 Node.js service
**Complexity**: Low
**Platform**: Any (local, Docker, any cloud)
**Maintenance**: Minimal

### Deployment Options

```
Option 1: Local Development
  → npm run dev (with nodemon)

Option 2: Docker Container
  → docker build + docker run
  → Works with any container platform

Option 3: PaaS (Heroku, Railway, Render)
  → git push → automatic deployment

Option 4: VPS (DigitalOcean, Linode, etc.)
  → SSH + git clone + pm2/systemd

Option 5: Cloud (any provider)
  → Container service (ECS, Cloud Run, etc.)
  → Compute instance (EC2, Compute Engine, etc.)
```

### Component Structure

```
backend/
├── src/
│   ├── server.ts              # Express app setup
│   ├── config.ts              # Environment configuration
│   ├── routes/
│   │   ├── caption.ts         # Caption generation endpoint
│   │   ├── mask.ts            # Mask generation endpoint
│   │   ├── verify.ts          # License verification endpoint
│   │   └── health.ts          # Health check endpoint
│   ├── services/
│   │   ├── replicate.ts       # Replicate client
│   │   ├── openai.ts          # OpenAI client
│   │   └── gumroad.ts         # Gumroad client
│   ├── middleware/
│   │   ├── cors.ts            # CORS configuration
│   │   ├── errorHandler.ts   # Error handling
│   │   └── logger.ts          # Request logging
│   └── types/
│       └── api.ts             # TypeScript interfaces
├── Dockerfile                 # Container definition
├── docker-compose.yml         # Local Docker setup
├── .env.example               # Environment template
├── package.json
└── tsconfig.json
```

## Components and Interfaces

### 1. Express Server

**Purpose**: HTTP server that handles all API requests

**Interface**:
```typescript
// src/server.ts
import express, { Express } from 'express'
import { config } from './config'
import { corsMiddleware } from './middleware/cors'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './middleware/logger'
import captionRouter from './routes/caption'
import maskRouter from './routes/mask'
import verifyRouter from './routes/verify'
import healthRouter from './routes/health'

export function createServer(): Express {
  const app = express()
  
  // Middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(corsMiddleware)
  app.use(logger)
  
  // Routes
  app.use('/api/caption', captionRouter)
  app.use('/api/mask', maskRouter)
  app.use('/api/verify', verifyRouter)
  app.use('/api/health', healthRouter)
  
  // Error handling
  app.use(errorHandler)
  
  return app
}

export function startServer(): void {
  const app = createServer()
  const port = config.port
  
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(`Environment: ${config.env}`)
  })
}
```

### 2. Configuration

**Purpose**: Centralized environment variable management

**Interface**:
```typescript
// src/config.ts
export interface Config {
  env: string
  port: number
  replicate: {
    apiToken: string
    blipModel: string
    rembgModel: string
  }
  openai: {
    apiKey: string
    model: string
    temperature: number
  }
  gumroad: {
    productPermalink: string
    accessToken?: string
  }
  cors: {
    origin: string | string[]
  }
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  replicate: {
    apiToken: requireEnv('REPLICATE_API_TOKEN'),
    blipModel: process.env.REPLICATE_BLIP_MODEL || 
      'salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
    rembgModel: process.env.REPLICATE_REMBG_MODEL ||
      'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003'
  },
  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.8')
  },
  gumroad: {
    productPermalink: requireEnv('GUMROAD_PRODUCT_PERMALINK'),
    accessToken: process.env.GUMROAD_ACCESS_TOKEN
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}
```

### 3. Caption Generation Route

**Purpose**: Generates AI-powered caption suggestions

**Interface**:
```typescript
// src/routes/caption.ts
import { Router, Request, Response } from 'express'
import { generateBaseCaption, generateVariants } from '../services/replicate'
import { rewriteCaption } from '../services/openai'

interface CaptionRequest {
  imageUrl: string
}

interface CaptionResponse {
  baseCaption: string
  variants: string[]
}

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body as CaptionRequest
    
    // Validate input
    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'Image URL required' 
      })
    }
    
    // Generate base caption with BLIP
    const baseCaption = await generateBaseCaption(imageUrl)
    
    // Generate variants with OpenAI
    const variants = await rewriteCaption(baseCaption)
    
    res.json({
      baseCaption,
      variants
    })
  } catch (error) {
    console.error('Caption generation error:', error)
    throw error // Handled by error middleware
  }
})

export default router
```

### 4. Mask Generation Route

**Purpose**: Generates subject masks for text-behind effect

**Interface**:
```typescript
// src/routes/mask.ts
import { Router, Request, Response } from 'express'
import { generateMask } from '../services/replicate'

interface MaskRequest {
  imageUrl: string
}

interface MaskResponse {
  maskUrl: string
}

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body as MaskRequest
    
    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'Image URL required' 
      })
    }
    
    const maskUrl = await generateMask(imageUrl)
    
    res.json({ maskUrl })
  } catch (error) {
    console.error('Mask generation error:', error)
    throw error
  }
})

export default router
```

### 5. License Verification Route

**Purpose**: Verifies Gumroad license keys

**Interface**:
```typescript
// src/routes/verify.ts
import { Router, Request, Response } from 'express'
import { verifyLicense } from '../services/gumroad'

interface VerifyRequest {
  licenseKey: string
}

interface VerifyResponse {
  valid: boolean
  email?: string
}

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { licenseKey } = req.body as VerifyRequest
    
    if (!licenseKey) {
      return res.status(400).json({ 
        error: 'License key required' 
      })
    }
    
    const result = await verifyLicense(licenseKey)
    
    res.json({
      valid: result.valid,
      email: result.email
    })
  } catch (error) {
    console.error('License verification error:', error)
    throw error
  }
})

export default router
```

### 6. Health Check Route

**Purpose**: Provides service health status

**Interface**:
```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

export default router
```

## Data Models

### API Request/Response Types

```typescript
// src/types/api.ts

export interface CaptionRequest {
  imageUrl: string
}

export interface CaptionResponse {
  baseCaption: string
  variants: string[]
}

export interface MaskRequest {
  imageUrl: string
}

export interface MaskResponse {
  maskUrl: string
}

export interface VerifyRequest {
  licenseKey: string
}

export interface VerifyResponse {
  valid: boolean
  email?: string
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
}

export interface ErrorResponse {
  error: string
  details?: string
}
```

### Service Interfaces

```typescript
// src/services/replicate.ts
export interface ReplicateService {
  generateBaseCaption(imageUrl: string): Promise<string>
  generateMask(imageUrl: string): Promise<string>
}

// src/services/openai.ts
export interface OpenAIService {
  rewriteCaption(baseCaption: string): Promise<string[]>
}

// src/services/gumroad.ts
export interface GumroadService {
  verifyLicense(licenseKey: string): Promise<{
    valid: boolean
    email?: string
  }>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Configuration from environment variables
*For any* configuration value, it should be read from environment variables and not hardcoded in the source code
**Validates: Requirements 1.3**

### Property 2: Port configurability
*For any* PORT environment variable value, the service should listen on that port when started
**Validates: Requirements 1.4**

### Property 3: API key security
*For any* API response, it should not contain API keys or tokens in the response body or headers
**Validates: Requirements 2.2**

### Property 4: Missing environment variable handling
*For any* required environment variable that is missing, the service should fail to start with a clear error message indicating which variable is missing
**Validates: Requirements 2.3, 9.5**

### Property 5: HTTP method routing
*For any* defined route, only the specified HTTP method should trigger the handler
**Validates: Requirements 3.2**

### Property 6: Endpoint execution
*For any* registered endpoint, accessing it with the correct method should execute the associated handler
**Validates: Requirements 3.3**

### Property 7: Response headers
*For any* API response, it should include appropriate headers including Content-Type
**Validates: Requirements 3.4**

### Property 8: API compatibility
*For any* endpoint, the response structure should match the expected format (same fields and types)
**Validates: Requirements 4.5**

### Property 9: Response time
*For any* request (excluding external API time), the service should respond within 200ms
**Validates: Requirements 5.1**

### Property 10: Concurrent request handling
*For any* set of simultaneous requests, they should be processed concurrently without blocking each other
**Validates: Requirements 5.2**

### Property 11: Timeout enforcement
*For any* external API call, if it exceeds the timeout limit, the service should abort the request and return an error
**Validates: Requirements 5.3**

### Property 12: Load handling
*For any* reasonable load level, the service should maintain response times without significant degradation
**Validates: Requirements 5.5**

### Property 13: Error logging
*For any* error that occurs, it should be logged with a timestamp and relevant context information
**Validates: Requirements 6.1**

### Property 14: External API error handling
*For any* external API failure, the service should return a 502 status code with error details
**Validates: Requirements 6.2**

### Property 15: Input validation errors
*For any* invalid input, the service should return a 400 status code with validation error details
**Validates: Requirements 6.3**

### Property 16: Rate limit responses
*For any* rate limit exceeded scenario, the service should return a 429 status code
**Validates: Requirements 6.4**

### Property 17: User-friendly error messages
*For any* error response, it should include a user-friendly error message (not just stack traces or technical jargon)
**Validates: Requirements 6.5**

### Property 18: CORS headers
*For any* API response, it should include the Access-Control-Allow-Origin header
**Validates: Requirements 7.2**

### Property 19: Container environment variables
*For any* environment variable provided to the container, the service should use that value
**Validates: Requirements 8.3**

### Property 20: Environment equivalence
*For any* request, the response should be identical whether running locally or in a container
**Validates: Requirements 8.4**

### Property 21: HTTP client compatibility
*For any* standard HTTP client (curl, fetch, axios), it should be able to successfully call the API endpoints
**Validates: Requirements 9.4**

### Property 22: Functional equivalence
*For any* API request, the platform-agnostic backend should return the same response structure, status codes, and data format as the original Lambda backend
**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 23: Deployment simplicity
*For any* deployment environment with Node.js support, the backend should start successfully with only environment variables configured (no additional platform-specific setup required)
**Validates: Requirements 1.1, 1.2, 1.5**

### Property 24: Logging availability
*For any* error that occurs, the log entry should include timestamp, error level, error message, and relevant context (request path, method, etc.)
**Validates: Requirements 6.1**

## Error Handling

### Service Startup Errors

**Missing Environment Variables**:
- Check all required environment variables at startup
- Fail fast with clear error messages
- List all missing variables in the error
- Provide example values in error message

**Port Already in Use**:
- Catch EADDRINUSE error
- Suggest alternative ports
- Exit with clear error message

**Invalid Configuration**:
- Validate configuration values
- Check for invalid types or formats
- Provide helpful error messages

### Request Processing Errors

**Invalid Input**:
- Validate request body
- Return 400 Bad Request
- Include specific validation errors
- Example: "imageUrl is required"

**Missing Headers**:
- Check for required headers
- Return 400 Bad Request
- Indicate which headers are missing

**Malformed JSON**:
- Catch JSON parse errors
- Return 400 Bad Request
- Indicate JSON is malformed

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

**Timeout Errors**:
- Set timeout for external API calls (30 seconds)
- Return 504 Gateway Timeout
- Include timeout duration in error message

### Rate Limiting

**Implementation**:
- Use express-rate-limit middleware
- Limit: 100 requests per 15 minutes per IP
- Return 429 Too Many Requests
- Include Retry-After header

**Configuration**:
```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)
```

## Testing Strategy

### Unit Tests

**Route Handlers**:
- Test request validation
- Test response formatting
- Test error handling
- Mock external services

**Services**:
- Test Replicate client
- Test OpenAI client
- Test Gumroad client
- Mock API responses

**Middleware**:
- Test CORS configuration
- Test error handler
- Test logger
- Test rate limiter

**Configuration**:
- Test environment variable loading
- Test missing variable handling
- Test invalid configuration

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

Each property-based test must be tagged with a comment explicitly referencing the correctness property in the design document.

**Property 1: Configuration from environment variables**
- Scan source code for hardcoded configuration
- Verify all config comes from environment variables
- **Feature: platform-agnostic-backend, Property 1: Configuration from environment variables**

**Property 2: Port configurability**
- Generate random port numbers
- Start service with each port
- Verify service listens on correct port
- **Feature: platform-agnostic-backend, Property 2: Port configurability**

**Property 3: API key security**
- Generate random requests
- Scan responses for API key patterns
- Verify no keys exposed
- **Feature: platform-agnostic-backend, Property 3: API key security**

**Property 4: Missing environment variable handling**
- Generate combinations of missing variables
- Attempt to start service
- Verify clear error messages
- **Feature: platform-agnostic-backend, Property 4: Missing environment variable handling**

**Property 5: HTTP method routing**
- Generate random HTTP methods
- Call endpoints with wrong methods
- Verify 405 Method Not Allowed
- **Feature: platform-agnostic-backend, Property 5: HTTP method routing**

**Property 6: Endpoint execution**
- Generate random valid requests
- Call each endpoint
- Verify handlers execute
- **Feature: platform-agnostic-backend, Property 6: Endpoint execution**

**Property 7: Response headers**
- Generate random requests
- Check all responses
- Verify required headers present
- **Feature: platform-agnostic-backend, Property 7: Response headers**

**Property 8: API compatibility**
- Generate random valid inputs
- Call endpoints
- Verify response structure matches schema
- **Feature: platform-agnostic-backend, Property 8: API compatibility**

**Property 9: Response time**
- Generate random requests
- Measure response time (excluding external APIs)
- Verify within 200ms
- **Feature: platform-agnostic-backend, Property 9: Response time**

**Property 10: Concurrent request handling**
- Generate random concurrent requests
- Execute simultaneously
- Verify all complete successfully
- **Feature: platform-agnostic-backend, Property 10: Concurrent request handling**

**Property 11: Timeout enforcement**
- Mock slow external APIs
- Verify timeouts occur
- Verify error responses
- **Feature: platform-agnostic-backend, Property 11: Timeout enforcement**

**Property 12: Load handling**
- Generate increasing load levels
- Measure response times
- Verify no significant degradation
- **Feature: platform-agnostic-backend, Property 12: Load handling**

**Property 13: Error logging**
- Trigger various errors
- Verify logs contain timestamp and context
- **Feature: platform-agnostic-backend, Property 13: Error logging**

**Property 14: External API error handling**
- Mock external API failures
- Verify 502 responses
- Verify error details included
- **Feature: platform-agnostic-backend, Property 14: External API error handling**

**Property 15: Input validation errors**
- Generate invalid inputs
- Verify 400 responses
- Verify validation error details
- **Feature: platform-agnostic-backend, Property 15: Input validation errors**

**Property 16: Rate limit responses**
- Send requests exceeding rate limit
- Verify 429 responses
- **Feature: platform-agnostic-backend, Property 16: Rate limit responses**

**Property 17: User-friendly error messages**
- Trigger various errors
- Verify error messages are user-friendly
- **Feature: platform-agnostic-backend, Property 17: User-friendly error messages**

**Property 18: CORS headers**
- Generate random requests
- Verify CORS headers present
- **Feature: platform-agnostic-backend, Property 18: CORS headers**

**Property 19: Container environment variables**
- Start container with various env vars
- Verify service uses them
- **Feature: platform-agnostic-backend, Property 19: Container environment variables**

**Property 20: Environment equivalence**
- Generate random requests
- Execute in local and container environments
- Verify identical responses
- **Feature: platform-agnostic-backend, Property 20: Environment equivalence**

**Property 21: HTTP client compatibility**
- Use different HTTP clients (curl, fetch, axios)
- Call endpoints
- Verify all work correctly
- **Feature: platform-agnostic-backend, Property 21: HTTP client compatibility**

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

**Container Flow**:
- Build Docker image
- Start container
- Test all endpoints
- Verify identical behavior to local

## Implementation Notes

### Docker Configuration

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server.js"]
```

**docker-compose.yml** (for local development):
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GUMROAD_PRODUCT_PERMALINK=${GUMROAD_PRODUCT_PERMALINK}
      - GUMROAD_ACCESS_TOKEN=${GUMROAD_ACCESS_TOKEN}
      - CORS_ORIGIN=*
    volumes:
      - ./src:/app/src
    command: npm run dev
```

### Environment Variables

**.env.example**:
```bash
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

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

### Deployment Options

**Option 1: Docker on any platform**:
```bash
# Build image
docker build -t caption-backend .

# Run container
docker run -p 3001:3001 --env-file .env caption-backend
```

**Option 2: Railway**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Option 3: Render**:
- Connect GitHub repository
- Set environment variables in dashboard
- Deploy automatically on push

**Option 4: VPS (DigitalOcean, Linode, etc.)**:
```bash
# SSH into server
ssh user@your-server

# Clone repository
git clone your-repo
cd your-repo

# Install dependencies
npm install

# Build
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/server.js --name caption-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

**Option 5: Heroku**:
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set REPLICATE_API_TOKEN=your_token
heroku config:set OPENAI_API_KEY=your_key

# Deploy
git push heroku main
```

### Performance Optimization

- Use connection pooling for external APIs
- Implement response caching where appropriate
- Use compression middleware (gzip)
- Optimize JSON parsing with limits
- Monitor memory usage
- Use clustering for multi-core systems

### Security Best Practices

- Never commit API keys to Git
- Use environment variables for secrets
- Validate all inputs
- Sanitize error messages
- Enable rate limiting
- Use HTTPS in production
- Keep dependencies updated
- Monitor for security vulnerabilities

### Monitoring and Logging

**Logging**:
- Use structured logging (JSON format)
- Log all requests with timestamps
- Log errors with stack traces
- Log external API calls
- Use log levels (debug, info, warn, error)

**Monitoring**:
- Monitor response times
- Track error rates
- Monitor external API latency
- Track memory and CPU usage
- Set up alerts for failures

### Development Workflow

1. **Local Development**:
   - Copy `.env.example` to `.env`
   - Fill in API keys
   - Run `npm install`
   - Run `npm run dev`
   - Test with curl or Postman

2. **Testing**:
   - Write unit tests for new features
   - Write property tests for correctness
   - Run `npm test`
   - Verify all tests pass

3. **Building**:
   - Run `npm run build`
   - Verify TypeScript compiles
   - Test built version with `npm start`

4. **Deployment**:
   - Choose deployment platform
   - Set environment variables
   - Deploy using platform-specific method
   - Verify all endpoints work
   - Monitor for errors

### Troubleshooting

**Service won't start**:
- Check environment variables are set
- Verify port is not in use
- Check Node.js version (18+)
- Review error messages

**External API errors**:
- Verify API keys are correct
- Check API service status
- Review rate limits
- Check network connectivity

**CORS errors**:
- Verify CORS_ORIGIN is set correctly
- Check preflight requests
- Review browser console

**Performance issues**:
- Check external API latency
- Monitor memory usage
- Review concurrent request handling
- Consider caching

