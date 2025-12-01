# Development Guide

This guide covers local development setup, debugging, testing, and code organization for the platform-agnostic backend.

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Hot Reloading Configuration](#hot-reloading-configuration)
- [Debugging Procedures](#debugging-procedures)
- [Testing Procedures](#testing-procedures)
- [Code Organization Patterns](#code-organization-patterns)
- [Development Workflow](#development-workflow)
- [Common Development Tasks](#common-development-tasks)

---

## Local Development Setup

### Prerequisites

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js (or use yarn/pnpm)
- **Git**: For version control
- **Code Editor**: VS Code recommended
- **API Keys**: Replicate and OpenAI accounts

### Initial Setup

#### 1. Clone Repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo/backend
```

#### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Runtime**: express, cors, dotenv
- **External APIs**: replicate, openai
- **Development**: typescript, nodemon, ts-node
- **Testing**: vitest, fast-check
- **Code Quality**: eslint, prettier

#### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

Required variables:
```bash
REPLICATE_API_TOKEN=r8_your_token_here
OPENAI_API_KEY=sk-your_key_here
GUMROAD_PRODUCT_PERMALINK=your_product
```

Optional variables (have defaults):
```bash
NODE_ENV=development
PORT=3001
CORS_ORIGIN=*
```

#### 4. Verify Setup

```bash
# Build TypeScript
npm run build

# Check for errors
npm run lint

# Run tests
npm test
```

#### 5. Start Development Server

```bash
npm run dev
```

You should see:
```
Server running on port 3001
Environment: development
```

#### 6. Test the API

```bash
# Health check
curl http://localhost:3001/api/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":...}
```

### VS Code Setup

#### Recommended Extensions

Install these VS Code extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "vitest.explorer"
  ]
}
```

#### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

#### Launch Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "envFile": "${workspaceFolder}/.env"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["test", "--", "--run"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

---

## Hot Reloading Configuration

Hot reloading automatically restarts the server when you make code changes.

### Nodemon Configuration

The project uses nodemon for hot reloading. Configuration is in `nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts", "src/**/*.spec.ts"],
  "exec": "ts-node src/server.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### How It Works

1. Nodemon watches the `src/` directory
2. When a `.ts` or `.json` file changes
3. Nodemon restarts the server automatically
4. Changes are reflected immediately

### Usage

```bash
# Start with hot reloading
npm run dev

# Make changes to any file in src/
# Server restarts automatically
```

### Customizing Hot Reload

Edit `nodemon.json` to:

**Watch additional directories:**
```json
{
  "watch": ["src", "config"]
}
```

**Watch additional file types:**
```json
{
  "ext": "ts,json,yaml"
}
```

**Add delay before restart:**
```json
{
  "delay": 1000
}
```

**Verbose logging:**
```bash
npm run dev -- --verbose
```

### Troubleshooting Hot Reload

**Server doesn't restart:**
- Check nodemon is installed: `npm list nodemon`
- Verify file is in watched directory
- Check file extension is in `ext` list
- Look for syntax errors preventing restart

**Too many restarts:**
- Add directories to `ignore` list
- Increase `delay` value
- Check for file watchers creating loops

---

## Debugging Procedures

### Console Logging

The simplest debugging method:

```typescript
// Add debug logs
console.log('Request body:', req.body)
console.log('Config:', config)
console.error('Error occurred:', error)

// Use structured logging
console.log(JSON.stringify({ 
  timestamp: new Date().toISOString(),
  level: 'debug',
  message: 'Processing request',
  data: req.body 
}))
```

### VS Code Debugger

#### 1. Set Breakpoints

Click in the gutter next to line numbers to set breakpoints.

#### 2. Start Debugging

Press `F5` or click "Run and Debug" → "Debug Server"

#### 3. Use Debug Controls

- **Continue** (F5): Resume execution
- **Step Over** (F10): Execute current line
- **Step Into** (F11): Enter function call
- **Step Out** (Shift+F11): Exit current function
- **Restart** (Ctrl+Shift+F5): Restart debugger

#### 4. Inspect Variables

- Hover over variables to see values
- Use "Variables" panel to explore scope
- Use "Watch" panel to track expressions
- Use "Debug Console" to evaluate expressions

### Node.js Inspector

Debug without VS Code:

```bash
# Start with inspector
node --inspect dist/server.js

# Or with nodemon
nodemon --inspect src/server.ts
```

Then open Chrome and go to: `chrome://inspect`

### Debugging Tests

```bash
# Debug specific test
npm test -- --inspect-brk src/routes/caption.test.ts

# Or use VS Code "Debug Tests" configuration
```

### Remote Debugging

Debug deployed applications:

```bash
# SSH into server
ssh user@your-server

# View logs
pm2 logs caption-backend

# Attach to process
pm2 attach caption-backend
```

### Debugging External API Calls

```typescript
// Log request details
console.log('Calling Replicate:', {
  model: config.replicate.blipModel,
  input: { image: imageUrl }
})

// Log response
console.log('Replicate response:', output)

// Log timing
const start = Date.now()
const result = await replicate.run(...)
console.log(`Replicate took ${Date.now() - start}ms`)
```

### Common Debugging Scenarios

**Request not reaching handler:**
```typescript
// Add middleware logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})
```

**Environment variables not loading:**
```typescript
// Check at startup
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  hasReplicateToken: !!process.env.REPLICATE_API_TOKEN
})
```

**External API errors:**
```typescript
try {
  const result = await externalAPI.call()
} catch (error) {
  console.error('External API error:', {
    message: error.message,
    status: error.status,
    response: error.response?.data
  })
  throw error
}
```

---

## Testing Procedures

### Test Structure

```
backend/src/
├── routes/
│   ├── caption.ts
│   └── caption.test.ts          # Unit tests
├── services/
│   ├── replicate.ts
│   └── replicate.test.ts        # Unit tests
├── middleware/
│   ├── cors.ts
│   └── cors.test.ts             # Unit tests
└── *.property.test.ts           # Property-based tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/routes/caption.test.ts

# Run tests matching pattern
npm test -- --grep "caption"

# Run with coverage
npm run test:coverage

# Run only property tests
npm test -- --grep "property"
```

### Writing Unit Tests

Unit tests verify specific functionality:

```typescript
// src/routes/caption.test.ts
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { createServer } from '../server'

describe('Caption Route', () => {
  it('should return 400 when imageUrl is missing', async () => {
    const app = createServer()
    const response = await request(app)
      .post('/api/caption')
      .send({})
    
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Image URL required')
  })

  it('should generate caption for valid image', async () => {
    const app = createServer()
    const response = await request(app)
      .post('/api/caption')
      .send({ imageUrl: 'https://example.com/image.jpg' })
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('baseCaption')
    expect(response.body).toHaveProperty('variants')
  })
})
```

### Writing Property-Based Tests

Property tests verify invariants across many inputs:

```typescript
// src/config.property.test.ts
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

describe('Property: Configuration from environment variables', () => {
  it('should load all config from environment', () => {
    fc.assert(
      fc.property(
        fc.record({
          REPLICATE_API_TOKEN: fc.string({ minLength: 10 }),
          OPENAI_API_KEY: fc.string({ minLength: 10 }),
          PORT: fc.integer({ min: 1024, max: 65535 })
        }),
        (env) => {
          // Set environment
          Object.assign(process.env, env)
          
          // Load config
          const config = loadConfig()
          
          // Verify all values come from environment
          expect(config.replicate.apiToken).toBe(env.REPLICATE_API_TOKEN)
          expect(config.openai.apiKey).toBe(env.OPENAI_API_KEY)
          expect(config.port).toBe(env.PORT)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Mocking External APIs

```typescript
import { vi } from 'vitest'

// Mock Replicate
vi.mock('replicate', () => ({
  default: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue('a person standing')
  }))
}))

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'variant 1\nvariant 2' } }]
        })
      }
    }
  }))
}))
```

### Integration Tests

Test full request/response flow:

```typescript
describe('Caption Integration', () => {
  it('should generate caption end-to-end', async () => {
    const app = createServer()
    
    const response = await request(app)
      .post('/api/caption')
      .send({ imageUrl: 'https://example.com/test.jpg' })
      .expect(200)
    
    expect(response.body.baseCaption).toBeTruthy()
    expect(response.body.variants).toHaveLength(5)
  })
})
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage

# View in browser
open coverage/index.html
```

Aim for:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

### Continuous Testing

```bash
# Watch mode - runs tests on file changes
npm run test:watch

# Useful during development
# Tests run automatically as you code
```

---

## Code Organization Patterns

### Project Structure

```
backend/
├── src/
│   ├── server.ts              # App entry point
│   ├── config.ts              # Configuration
│   ├── routes/                # API endpoints
│   │   ├── caption.ts
│   │   ├── mask.ts
│   │   ├── verify.ts
│   │   └── health.ts
│   ├── services/              # External API clients
│   │   ├── replicate.ts
│   │   ├── openai.ts
│   │   └── gumroad.ts
│   ├── middleware/            # Express middleware
│   │   ├── cors.ts
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── rateLimiter.ts
│   ├── types/                 # TypeScript types
│   │   └── api.ts
│   └── errors/                # Custom errors
│       └── AppError.ts
├── dist/                      # Compiled output
├── tests/                     # Test utilities
└── package.json
```

### Naming Conventions

**Files:**
- Routes: `caption.ts`, `mask.ts`
- Services: `replicate.ts`, `openai.ts`
- Tests: `caption.test.ts`, `config.property.test.ts`
- Types: `api.ts`, `config.ts`

**Functions:**
- camelCase: `generateCaption()`, `verifyLicense()`
- Descriptive: `getSignedUrl()` not `getUrl()`
- Async: prefix with `async` or suffix with `Async`

**Variables:**
- camelCase: `imageUrl`, `apiToken`
- Constants: `UPPER_SNAKE_CASE`
- Booleans: prefix with `is`, `has`, `should`

**Types/Interfaces:**
- PascalCase: `CaptionRequest`, `Config`
- Descriptive: `CaptionResponse` not `Response`

### Route Pattern

```typescript
// src/routes/example.ts
import { Router, Request, Response } from 'express'
import { ExampleRequest, ExampleResponse } from '../types/api'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    // 1. Extract and validate input
    const { input } = req.body as ExampleRequest
    if (!input) {
      return res.status(400).json({ error: 'Input required' })
    }
    
    // 2. Process request
    const result = await processInput(input)
    
    // 3. Return response
    res.json({ result } as ExampleResponse)
  } catch (error) {
    // 4. Let error middleware handle errors
    console.error('Example error:', error)
    throw error
  }
})

export default router
```

### Service Pattern

```typescript
// src/services/example.ts
import { config } from '../config'

export class ExampleService {
  private client: ExampleClient
  
  constructor() {
    this.client = new ExampleClient({
      apiKey: config.example.apiKey
    })
  }
  
  async doSomething(input: string): Promise<string> {
    try {
      const result = await this.client.call(input)
      return result
    } catch (error) {
      console.error('Example service error:', error)
      throw new Error(`Example service failed: ${error.message}`)
    }
  }
}

// Export singleton instance
export const exampleService = new ExampleService()
```

### Error Handling Pattern

```typescript
// src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

// Usage in routes
if (!input) {
  throw new AppError(400, 'Input required')
}

// Usage in middleware
if (error instanceof AppError) {
  return res.status(error.statusCode).json({
    error: error.message
  })
}
```

### Configuration Pattern

```typescript
// src/config.ts
interface Config {
  env: string
  port: number
  // ... other config
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  // ... load other config
}
```

### Type Definitions Pattern

```typescript
// src/types/api.ts

// Request types
export interface CaptionRequest {
  imageUrl: string
}

export interface MaskRequest {
  imageUrl: string
}

// Response types
export interface CaptionResponse {
  baseCaption: string
  variants: string[]
}

export interface ErrorResponse {
  error: string
  details?: string
}

// Service types
export interface ReplicateOutput {
  output: string
}
```

---

## Development Workflow

### Daily Workflow

1. **Pull Latest Changes**
   ```bash
   git pull origin main
   npm install  # If dependencies changed
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-endpoint
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Make Changes**
   - Edit code
   - Server auto-restarts
   - Test in browser/Postman

5. **Run Tests**
   ```bash
   npm test
   ```

6. **Lint and Format**
   ```bash
   npm run lint
   npm run format
   ```

7. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add new endpoint"
   ```

8. **Push and Create PR**
   ```bash
   git push origin feature/new-endpoint
   # Create pull request on GitHub
   ```

### Adding New Features

#### 1. Define Types

```typescript
// src/types/api.ts
export interface NewFeatureRequest {
  input: string
}

export interface NewFeatureResponse {
  result: string
}
```

#### 2. Create Service (if needed)

```typescript
// src/services/newService.ts
export async function processNewFeature(input: string): Promise<string> {
  // Implementation
  return result
}
```

#### 3. Create Route

```typescript
// src/routes/newFeature.ts
import { Router } from 'express'

const router = Router()

router.post('/', async (req, res) => {
  const { input } = req.body
  const result = await processNewFeature(input)
  res.json({ result })
})

export default router
```

#### 4. Register Route

```typescript
// src/server.ts
import newFeatureRouter from './routes/newFeature'

app.use('/api/new-feature', newFeatureRouter)
```

#### 5. Write Tests

```typescript
// src/routes/newFeature.test.ts
describe('New Feature', () => {
  it('should process input', async () => {
    // Test implementation
  })
})
```

#### 6. Update Documentation

Update README.md with new endpoint details.

---

## Common Development Tasks

### Adding Environment Variable

1. **Add to .env.example**
   ```bash
   NEW_VARIABLE=example_value
   ```

2. **Add to config.ts**
   ```typescript
   export const config = {
     // ...
     newVariable: process.env.NEW_VARIABLE || 'default'
   }
   ```

3. **Update .env**
   ```bash
   NEW_VARIABLE=actual_value
   ```

### Adding Middleware

1. **Create middleware file**
   ```typescript
   // src/middleware/newMiddleware.ts
   import { Request, Response, NextFunction } from 'express'
   
   export function newMiddleware(req: Request, res: Response, next: NextFunction) {
     // Implementation
     next()
   }
   ```

2. **Register in server.ts**
   ```typescript
   import { newMiddleware } from './middleware/newMiddleware'
   
   app.use(newMiddleware)
   ```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update

# Update to latest (breaking changes)
npm install package-name@latest
```

### Database Integration (Future)

If adding database:

1. **Install driver**
   ```bash
   npm install pg  # PostgreSQL
   # or
   npm install mongodb  # MongoDB
   ```

2. **Create connection module**
   ```typescript
   // src/db/connection.ts
   export async function connectDB() {
     // Connection logic
   }
   ```

3. **Create models**
   ```typescript
   // src/db/models/User.ts
   export class User {
     // Model definition
   }
   ```

### Performance Profiling

```bash
# Profile with Node.js
node --prof dist/server.js

# Generate report
node --prof-process isolate-*.log > profile.txt

# Use clinic.js for detailed profiling
npm install -g clinic
clinic doctor -- node dist/server.js
```

### Memory Leak Detection

```bash
# Monitor memory usage
node --inspect --expose-gc dist/server.js

# Use Chrome DevTools
# Open chrome://inspect
# Take heap snapshots
# Compare snapshots to find leaks
```

---

## Best Practices

### Code Style

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over promises
- Handle all errors explicitly
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Security

- Never commit `.env` files
- Validate all inputs
- Sanitize error messages
- Use parameterized queries (if using DB)
- Keep dependencies updated
- Use HTTPS in production

### Performance

- Cache expensive operations
- Use connection pooling
- Implement request timeouts
- Monitor memory usage
- Profile before optimizing
- Use streaming for large data

### Testing

- Write tests before fixing bugs
- Test edge cases
- Mock external dependencies
- Aim for >80% coverage
- Run tests before committing
- Use property-based tests for invariants

---

## Troubleshooting Development Issues

### TypeScript Errors

```bash
# Check for type errors
npm run build

# Use TypeScript compiler directly
npx tsc --noEmit
```

### Port Already in Use

```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Module Not Found

```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Tests Failing

```bash
# Run single test
npm test -- src/routes/caption.test.ts

# Run with verbose output
npm test -- --reporter=verbose

# Clear test cache
npm test -- --clearCache
```

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [fast-check Documentation](https://fast-check.dev/)

## Getting Help

- Check [README.md](./README.md) for general information
- Review [MIGRATION.md](./MIGRATION.md) if migrating from Lambda
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guides
- Open GitHub issue for bugs
- Ask in team chat for questions
