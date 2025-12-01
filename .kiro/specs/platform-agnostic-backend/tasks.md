# Implementation Plan - Platform-Agnostic Backend

## Migration Approach

This implementation adapts the existing AWS Lambda backend (`lambdas/` directory) to a platform-agnostic Express.js server. We will:
- **Reuse** existing business logic from Lambda functions
- **Remove** AWS-specific dependencies (S3, SSM, API Gateway)
- **Replace** AWS SSM with environment variables
- **Replace** S3 presigned URLs with direct image URLs or base64
- **Convert** Lambda handlers to Express route handlers
- **Keep** all external API integrations (Replicate, OpenAI, Gumroad)

The existing Lambda code in `lambdas/src/` contains all the core logic we need - we just need to adapt it to run in Express.js instead of AWS Lambda.

---

- [x] 1. Set up project structure
- [x] 1.1 Initialize Node.js project
  - Create backend directory
  - Run `npm init`
  - Install TypeScript and dependencies
  - Configure tsconfig.json
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Create directory structure
  - Create src/ directory with subdirectories (routes, services, middleware, types)
  - Create .env.example file
  - Add .gitignore for node_modules and .env
  - _Requirements: 1.1, 1.2_

- [x] 1.3 Install core dependencies
  - Install express, cors, dotenv
  - Install TypeScript types (@types/express, @types/node)
  - Install development dependencies (nodemon, ts-node)
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement configuration system
- [x] 2.1 Create config module
  - Create src/config.ts
  - Implement requireEnv helper function
  - Define Config interface
  - Export config object
  - _Requirements: 1.3, 2.1, 2.3_

- [x] 2.2 Write property test for configuration from environment variables
  - **Property 1: Configuration from environment variables**
  - **Validates: Requirements 1.3**

- [x] 2.3 Write property test for missing environment variable handling
  - **Property 4: Missing environment variable handling**
  - **Validates: Requirements 2.3, 9.5**

- [x] 3. Create Express server
- [x] 3.1 Implement server setup
  - Create src/server.ts
  - Implement createServer function
  - Implement startServer function
  - Configure JSON body parser
  - _Requirements: 1.1, 1.4_

- [x] 3.2 Write property test for port configurability
  - **Property 2: Port configurability**
  - **Validates: Requirements 1.4**

- [x] 4. Implement middleware
- [x] 4.1 Create CORS middleware
  - Create src/middleware/cors.ts
  - Configure CORS with environment-based origin
  - Handle preflight requests
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4.2 Write property test for CORS headers
  - **Property 18: CORS headers**
  - **Validates: Requirements 7.2**

- [x] 4.3 Create error handler middleware
  - Create src/middleware/errorHandler.ts
  - Handle different error types (validation, external API, etc.)
  - Return appropriate status codes
  - Include user-friendly error messages
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4.4 Write property test for user-friendly error messages
  - **Property 17: User-friendly error messages**
  - **Validates: Requirements 6.5**

- [x] 4.5 Create logger middleware
  - Create src/middleware/logger.ts
  - Log all requests with timestamp
  - Log request method, path, and response time
  - _Requirements: 6.1, 9.3_

- [x] 4.6 Write property test for error logging
  - **Property 13: Error logging**
  - **Validates: Requirements 6.1**

- [x] 4.7 Create rate limiter middleware
  - Install express-rate-limit
  - Create rate limiter configuration
  - Apply to /api routes
  - _Requirements: 6.4_

- [x] 4.8 Write property test for rate limit responses
  - **Property 16: Rate limit responses**
  - **Validates: Requirements 6.4**

- [x] 5. Adapt external service clients from Lambda functions
- [x] 5.1 Extract and adapt Replicate client from Lambda
  - Copy Replicate logic from lambdas/src/caption.ts and lambdas/src/mask.ts
  - Create src/services/replicate.ts
  - Remove AWS S3 dependencies (use direct image URLs instead)
  - Remove SSM parameter loading (use environment variables directly)
  - Implement generateBaseCaption function
  - Implement generateMask function
  - Add retry logic with exponential backoff
  - Add timeout handling
  - _Requirements: 4.1, 4.2, 5.3_

- [x] 5.2 Write property test for timeout enforcement
  - **Property 11: Timeout enforcement**
  - **Validates: Requirements 5.3**

- [x] 5.3 Write property test for external API error handling
  - **Property 14: External API error handling**
  - **Validates: Requirements 6.2**

- [x] 5.4 Extract and adapt OpenAI client from Lambda
  - Copy OpenAI logic from lambdas/src/caption.ts
  - Create src/services/openai.ts
  - Remove SSM parameter loading (use environment variables directly)
  - Implement rewriteCaption function
  - Add retry logic
  - Add timeout handling
  - _Requirements: 4.1, 5.3_

- [x] 5.5 Extract and adapt Gumroad client from Lambda
  - Copy Gumroad logic from lambdas/src/verify.ts
  - Create src/services/gumroad.ts
  - Remove SSM parameter loading (use environment variables directly)
  - Implement verifyLicense function
  - Add retry logic
  - Add timeout handling
  - _Requirements: 4.3, 5.3_

- [x] 6. Implement API routes
- [x] 6.1 Create type definitions
  - Create src/types/api.ts
  - Define request/response interfaces for all endpoints
  - Define error response interface
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6.2 Adapt caption route from Lambda
  - Copy logic from lambdas/src/caption.ts
  - Create src/routes/caption.ts
  - Convert Lambda handler to Express route handler
  - Remove S3 presigned URL logic (accept direct image URLs or base64)
  - Validate imageUrl input
  - Call Replicate and OpenAI services
  - Return caption response
  - _Requirements: 4.1_

- [x] 6.3 Write property test for input validation errors
  - **Property 15: Input validation errors**
  - **Validates: Requirements 6.3**

- [x] 6.4 Write property test for API compatibility
  - **Property 8: API compatibility**
  - **Validates: Requirements 4.5**

- [x] 6.5 Adapt mask route from Lambda
  - Copy logic from lambdas/src/mask.ts
  - Create src/routes/mask.ts
  - Convert Lambda handler to Express route handler
  - Remove S3 presigned URL logic (accept direct image URLs or base64)
  - Validate imageUrl input
  - Call Replicate service
  - Return mask response
  - _Requirements: 4.2_

- [x] 6.6 Adapt verify route from Lambda
  - Copy logic from lambdas/src/verify.ts
  - Create src/routes/verify.ts
  - Convert Lambda handler to Express route handler
  - Validate licenseKey input
  - Call Gumroad service
  - Return verification response
  - _Requirements: 4.3_

- [x] 6.7 Implement health route
  - Create src/routes/health.ts
  - Implement GET handler
  - Return service status, timestamp, and uptime
  - _Requirements: 4.4_

- [x] 6.8 Write property test for HTTP method routing
  - **Property 5: HTTP method routing**
  - **Validates: Requirements 3.2**

- [x] 6.9 Write property test for endpoint execution
  - **Property 6: Endpoint execution**
  - **Validates: Requirements 3.3**

- [x] 6.10 Write property test for response headers
  - **Property 7: Response headers**
  - **Validates: Requirements 3.4**

- [x] 7. Wire routes to server
- [x] 7.1 Register all routes in server
  - Import all route modules
  - Register with Express app
  - Apply middleware in correct order
  - _Requirements: 3.3, 3.5_

- [x] 7.2 Write property test for API key security
  - **Property 3: API key security**
  - **Validates: Requirements 2.2**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add Docker support
- [x] 9.1 Create Dockerfile
  - Use Node.js 18 Alpine base image
  - Copy package files and install dependencies
  - Copy source code and build TypeScript
  - Expose port 3001
  - Set CMD to start server
  - _Requirements: 8.1, 8.2_

- [x] 9.2 Create docker-compose.yml
  - Define backend service
  - Map ports
  - Set environment variables
  - Configure volume for development
  - _Requirements: 8.2, 8.3_

- [x] 9.3 Write property test for container environment variables
  - **Property 19: Container environment variables**
  - **Validates: Requirements 8.3**

- [x] 9.4 Write property test for environment equivalence
  - **Property 20: Environment equivalence**
  - **Validates: Requirements 8.4**

- [x] 10. Add development tooling
- [x] 10.1 Configure nodemon
  - Create nodemon.json
  - Watch src directory
  - Restart on TypeScript changes
  - _Requirements: 9.2_

- [x] 10.2 Add npm scripts
  - Add dev script (nodemon)
  - Add build script (tsc)
  - Add start script (node dist/server.js)
  - Add test scripts
  - _Requirements: 9.1_

- [x] 10.3 Configure ESLint and Prettier
  - Install ESLint and Prettier
  - Create .eslintrc.json
  - Create .prettierrc
  - Add lint and format scripts
  - _Requirements: 9.1_

- [x] 11. Write performance tests
- [x] 11.1 Write property test for response time
  - **Property 9: Response time**
  - **Validates: Requirements 5.1**

- [x] 11.2 Write property test for concurrent request handling
  - **Property 10: Concurrent request handling**
  - **Validates: Requirements 5.2**

- [x] 11.3 Write property test for load handling
  - **Property 12: Load handling**
  - **Validates: Requirements 5.5**

- [x] 12. Write additional property tests
- [x] 12.1 Write property test for HTTP client compatibility
  - **Property 21: HTTP client compatibility**
  - **Validates: Requirements 9.4**

- [x] 12.2 Write property test for functional equivalence
  - **Property 22: Functional equivalence**
  - Test that platform-agnostic backend produces identical responses to Lambda backend
  - Compare response structures, status codes, and data formats
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [x] 12.3 Write property test for deployment simplicity
  - **Property 23: Deployment simplicity**
  - Verify backend can start with minimal configuration
  - Test that only Node.js and environment variables are required
  - **Validates: Requirements 1.1, 1.2, 1.5**

- [x] 12.4 Write property test for logging availability
  - **Property 24: Logging availability**
  - Verify all errors are logged with proper context
  - Test log format includes timestamp, level, and message
  - **Validates: Requirements 6.1**

- [ ] 13. Write unit tests for service clients
- [ ] 13.1 Write unit tests for Replicate service
  - Test with mocked API responses
  - Test error handling scenarios
  - Test retry logic
  - Test timeout behavior
  - _Requirements: 4.1, 4.2, 6.2_

- [ ] 13.2 Write unit tests for OpenAI service
  - Test with mocked API responses
  - Test error handling scenarios
  - Test retry logic
  - Test timeout behavior
  - _Requirements: 4.1, 6.2_

- [ ] 13.3 Write unit tests for Gumroad service
  - Test with mocked API responses
  - Test error handling scenarios
  - Test invalid license keys
  - Test refunded purchases
  - _Requirements: 4.3, 6.2_

- [ ] 13.4 Write unit tests for configuration module
  - Test environment variable loading
  - Test missing variable handling
  - Test invalid configuration values
  - Test default values
  - _Requirements: 2.1, 2.3_

- [x] 14. Create documentation
- [x] 14.1 Update .env.example
  - Document all environment variables
  - Provide example values
  - Include comments explaining each variable
  - _Requirements: 2.1, 2.3_

- [x] 14.2 Create comprehensive README.md
  - Document setup instructions
  - Document API endpoints with request/response examples
  - Document all environment variables
  - Document deployment options
  - Include troubleshooting section
  - Add quick start guide
  - _Requirements: All_

- [x] 14.3 Create migration guide from Lambda/AWS
  - Document step-by-step migration process
  - Document differences between Lambda and Express handlers
  - Document how to test migration
  - Document rollback procedure if needed
  - Include common migration issues and solutions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 14.4 Create platform-specific deployment guides
  - Document Docker deployment (docker-compose and standalone)
  - Document Railway deployment
  - Document Render deployment
  - Document VPS deployment (systemd service setup)
  - Document Heroku deployment
  - Document DigitalOcean App Platform deployment
  - Document Fly.io deployment
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14.5 Create development guide
  - Document local development setup
  - Document hot reloading configuration
  - Document debugging procedures
  - Document testing procedures
  - Document code organization patterns
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15. Final testing
- [ ] 15.1 Test local development
  - Start service with npm run dev
  - Test all endpoints with curl
  - Verify hot reloading works
  - Verify error messages are helpful
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15.2 Test Docker deployment
  - Build Docker image
  - Run container with environment variables
  - Test all endpoints
  - Verify identical behavior to local
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 15.3 Test with frontend
  - Update frontend to call backend endpoints
  - Test caption generation flow
  - Test mask generation flow
  - Test license verification flow
  - Verify CORS works correctly
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15.4 Load testing
  - Use tool like autocannon or k6
  - Test with increasing concurrent requests
  - Verify response times remain acceptable
  - Verify no memory leaks
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 15.5 Error scenario testing
  - Test with invalid inputs
  - Test with missing environment variables
  - Test with external API failures
  - Test rate limiting
  - Verify all error responses are user-friendly
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 15.6 Test deployment to a real platform
  - Deploy to Railway, Render, or similar PaaS
  - Test all endpoints in production environment
  - Verify environment variables work correctly
  - Monitor performance and errors
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Update existing specs and project documentation
- [x] 17.1 Archive backend-architecture-simplification spec
  - Mark as superseded by platform-agnostic-backend
  - Update README to reference new spec
  - _Requirements: All_

- [x] 17.2 Update project documentation
  - Update main README.md
  - Remove AWS-specific references
  - Remove Vercel-specific references
  - Add platform-agnostic backend documentation
  - _Requirements: All_
