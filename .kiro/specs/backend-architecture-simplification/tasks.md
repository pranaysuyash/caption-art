# Implementation Plan - Backend Architecture Simplification

> **⚠️ SUPERSEDED**: This spec has been superseded by the **platform-agnostic-backend** spec (`.kiro/specs/platform-agnostic-backend/`). See [SUPERSEDED.md](./SUPERSEDED.md) for details.

- [ ] 1. Set up Vercel project
- [ ] 1.1 Create Vercel account and project
  - Sign up for Vercel account
  - Create new project
  - Connect Git repository
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Install Vercel CLI
  - Install globally: `npm install -g vercel`
  - Login: `vercel login`
  - _Requirements: 1.1_

- [ ] 1.3 Create vercel.json configuration
  - Configure function settings (memory, timeout)
  - Configure CORS headers
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2. Set up environment variables
- [ ] 2.1 Create .env.local for development
  - Add REPLICATE_API_TOKEN
  - Add OPENAI_API_KEY
  - Add GUMROAD_PRODUCT_PERMALINK
  - Add GUMROAD_ACCESS_TOKEN
  - Add to .gitignore
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2.2 Add environment variables to Vercel
  - Add via Vercel dashboard or CLI
  - Set for Production, Preview, Development
  - Verify encryption
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2.3 Create config utility
  - Create `lib/config.ts`
  - Export config object with all environment variables
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2.4 Write property test for environment variable security
  - **Property 2: Environment variable security**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 2.5 Write property test for secret rotation support
  - **Property 11: Secret rotation support**
  - **Validates: Requirements 2.5**

- [ ] 3. Create API directory structure
- [ ] 3.1 Create api directory
  - Create `api/` directory in project root
  - _Requirements: 1.1, 3.1, 3.2_

- [ ] 3.2 Create shared types
  - Create `types/api.ts`
  - Define request/response interfaces
  - Define error response interface
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Implement Replicate client library
- [ ] 4.1 Create lib/replicate.ts
  - Implement createPrediction function
  - Implement getPrediction function
  - Implement waitForCompletion function
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 Add error handling
  - Handle connection failures
  - Handle rate limiting
  - Handle model failures
  - Return appropriate error responses
  - _Requirements: 6.1, 6.2_

- [ ] 5. Implement OpenAI client library
- [ ] 5.1 Create lib/openai.ts
  - Implement chat completion function
  - Implement prompt construction
  - Implement response parsing
  - _Requirements: 4.1_

- [ ] 5.2 Add error handling
  - Handle connection failures
  - Handle rate limiting
  - Handle invalid responses
  - Return appropriate error responses
  - _Requirements: 6.1, 6.2_

- [ ] 6. Implement Gumroad client library
- [ ] 6.1 Create lib/gumroad.ts
  - Implement verifyLicense function
  - Implement isValidPurchase function
  - _Requirements: 4.3_

- [ ] 6.2 Add error handling
  - Handle connection failures
  - Handle invalid license keys
  - Handle refunded/chargebacked purchases
  - Return appropriate error responses
  - _Requirements: 6.1, 6.2_

- [ ] 7. Implement caption generation endpoint
- [ ] 7.1 Create api/caption.ts
  - Define CaptionRequest interface
  - Define CaptionResponse interface
  - Implement handler function
  - _Requirements: 4.1_

- [ ] 7.2 Implement CORS handling
  - Add CORS headers
  - Handle OPTIONS preflight
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.3 Implement request validation
  - Validate method is POST
  - Validate imageUrl is present
  - Return 400 for invalid requests
  - _Requirements: 6.3_

- [ ] 7.4 Implement caption generation logic
  - Call Replicate BLIP API
  - Wait for base caption
  - Call OpenAI API for variants
  - Return caption response
  - _Requirements: 4.1_

- [ ] 7.5 Implement error handling
  - Catch all exceptions
  - Return 500 for server errors
  - Return 502 for external API errors
  - Log errors to Vercel logs
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7.6 Write property test for functional equivalence
  - **Property 5: Functional equivalence**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 8. Implement mask generation endpoint
- [ ] 8.1 Create api/mask.ts
  - Define MaskRequest interface
  - Define MaskResponse interface
  - Implement handler function
  - _Requirements: 4.2_

- [ ] 8.2 Implement CORS handling
  - Add CORS headers
  - Handle OPTIONS preflight
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8.3 Implement request validation
  - Validate method is POST
  - Validate imageUrl is present
  - Return 400 for invalid requests
  - _Requirements: 6.3_

- [ ] 8.4 Implement mask generation logic
  - Call Replicate rembg API
  - Wait for mask URL
  - Return mask response
  - _Requirements: 4.2_

- [ ] 8.5 Implement error handling
  - Catch all exceptions
  - Return 500 for server errors
  - Return 502 for external API errors
  - Log errors to Vercel logs
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Implement license verification endpoint
- [ ] 9.1 Create api/verify.ts
  - Define VerifyRequest interface
  - Define VerifyResponse interface
  - Implement handler function
  - _Requirements: 4.3_

- [ ] 9.2 Implement CORS handling
  - Add CORS headers
  - Handle OPTIONS preflight
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.3 Implement request validation
  - Validate method is POST
  - Validate licenseKey is present
  - Return 400 for invalid requests
  - _Requirements: 6.3_

- [ ] 9.4 Implement verification logic
  - Call Gumroad Verify API
  - Check if purchase is valid
  - Return verification response
  - _Requirements: 4.3_

- [ ] 9.5 Implement error handling
  - Catch all exceptions
  - Return 500 for server errors
  - Return 502 for external API errors
  - Log errors to Vercel logs
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Implement upload endpoint (optional)
- [ ] 10.1 Decide on upload strategy
  - Option A: Direct client upload (base64)
  - Option B: Vercel Blob Storage
  - Option C: S3 presigned URLs
  - _Requirements: 4.4_

- [ ] 10.2 Implement chosen strategy
  - Create api/upload.ts if needed
  - Implement upload logic
  - Return upload URL
  - _Requirements: 4.4_

- [ ] 11. Write property tests for API endpoints
- [ ] 11.1 Write property test for API endpoint availability
  - **Property 1: API endpoint availability**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 11.2 Write property test for CORS header presence
  - **Property 3: CORS header presence**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [ ] 11.3 Write property test for error response format
  - **Property 4: Error response format**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 11.4 Write property test for concurrent request handling
  - **Property 6: Concurrent request handling**
  - **Validates: Requirements 5.3**

- [ ] 11.5 Write property test for timeout enforcement
  - **Property 8: Timeout enforcement**
  - **Validates: Requirements 5.5**

- [ ] 12. Update frontend to use Vercel endpoints
- [ ] 12.1 Update API URLs
  - Change caption API URL to `/api/caption`
  - Change mask API URL to `/api/mask`
  - Change verify API URL to `/api/verify`
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 12.2 Test API integration
  - Test caption generation
  - Test mask generation
  - Test license verification
  - Verify all work correctly
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12.3 Update error handling
  - Handle new error response format
  - Display appropriate messages
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13. Deploy to Vercel
- [ ] 13.1 Deploy to preview environment
  - Run `vercel deploy`
  - Test all endpoints
  - Verify environment variables work
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 13.2 Test deployed endpoints
  - Test caption generation
  - Test mask generation
  - Test license verification
  - Test error handling
  - Test CORS
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 13.3 Deploy to production
  - Run `vercel deploy --prod`
  - Update DNS if needed
  - Monitor for errors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 14. Write property test for deployment simplicity
  - **Property 10: Deployment simplicity**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Write unit tests
- [ ] 16.1 Test API endpoints
  - Test request validation
  - Test response formatting
  - Test error handling
  - Test CORS headers

- [ ] 16.2 Test external API clients
  - Test Replicate client
  - Test OpenAI client
  - Test Gumroad client
  - Mock API responses

- [ ] 16.3 Test configuration
  - Test environment variable loading
  - Test missing variable handling
  - Test invalid configuration

- [ ] 17. Monitor and optimize
- [ ] 17.1 Set up monitoring
  - Monitor function execution times
  - Track error rates
  - Monitor costs
  - Set up alerts
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 17.2 Optimize cold starts
  - Minimize dependencies
  - Optimize imports
  - Use edge functions if beneficial
  - _Requirements: 5.1, 5.2_

- [ ] 17.3 Optimize performance
  - Cache API responses where possible
  - Use streaming responses for large data
  - Monitor and optimize slow endpoints
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 18. Write property test for auto-scaling behavior
  - **Property 7: Auto-scaling behavior**
  - **Validates: Requirements 5.4**

- [ ] 19. Write property test for cost efficiency
  - **Property 9: Cost efficiency**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 20. Write property test for logging availability
  - **Property 12: Logging availability**
  - **Validates: Requirements 6.1**

- [ ] 21. Final testing
- [ ] 21.1 Test full user flow
  - Upload image
  - Generate captions
  - Generate mask
  - Verify license
  - Export image
  - Verify all work end-to-end
  - _Requirements: All_

- [ ] 21.2 Load testing
  - Simulate concurrent users
  - Test with various load levels
  - Verify auto-scaling works
  - Monitor performance
  - _Requirements: 5.3, 5.4_

- [ ] 21.3 Error scenario testing
  - Test with invalid inputs
  - Test with network failures
  - Test with API failures
  - Verify error handling works
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 21.4 Cost analysis
  - Monitor usage for 1 week
  - Calculate actual costs
  - Compare with AWS costs
  - Verify within budget
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 22. Decommission AWS infrastructure
- [ ] 22.1 Verify Vercel is working
  - Test all features thoroughly
  - Monitor for 1 week
  - Ensure no issues
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 22.2 Backup AWS data
  - Export any necessary data from S3
  - Save Lambda function code
  - Document AWS configuration
  - _Requirements: 1.5_

- [ ] 22.3 Delete AWS resources
  - Delete Lambda functions
  - Delete API Gateway
  - Delete CloudFront distribution
  - Delete S3 buckets (after backup)
  - Delete WAF rules
  - Delete SSM parameters
  - Cancel AWS services
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 22.4 Verify cost savings
  - Check final AWS bill
  - Check Vercel bill
  - Calculate savings
  - Document results
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 23. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Documentation
- [ ] 24.1 Document new architecture
  - Update README with Vercel setup
  - Document API endpoints
  - Document environment variables
  - Document deployment process
  - _Requirements: All_

- [ ] 24.2 Create migration guide
  - Document migration steps
  - Document rollback procedure
  - Document troubleshooting
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 24.3 Update development guide
  - Document local development setup
  - Document testing procedures
  - Document deployment procedures
  - _Requirements: All_
