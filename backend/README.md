# Platform-Agnostic Backend

A simple, portable Express.js backend for the Caption Art application. This service provides AI-powered caption generation, subject mask generation, and license verification through a RESTful API.

## Features

- **Platform-Agnostic**: Runs anywhere Node.js is supported (local, Docker, any cloud provider)
- **Simple Deployment**: No vendor lock-in, no complex infrastructure requirements
- **RESTful API**: Standard HTTP endpoints for easy integration
- **External Service Integration**: Replicate (BLIP, rembg), OpenAI (GPT), Gumroad
- **Security**: API key management, CORS configuration, rate limiting
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Logging**: Structured request/response logging for debugging
- **Docker Support**: Containerized deployment for consistency

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- API keys for Replicate and OpenAI
- (Optional) Gumroad product for license verification

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

### Running Locally

```bash
# Development mode (with hot reloading)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

### Testing the API

```bash
# Health check
curl http://localhost:3001/api/health

# Generate caption (requires valid image URL)
curl -X POST http://localhost:3001/api/caption \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/image.jpg"}'
```

## API Endpoints

## Local Development

Before starting the server, copy the example env and update the values:

```bash
cp .env.example .env
# Edit .env with your actual keys — DO NOT commit this file
```

We also provide helper scripts under `backend/scripts`:

- `backup-env.js` — saves a timestamped copy of `.env` to `.env.bak.*`
- `ensure-env.js` — checks if required env vars are present and exits with an error if not
- `cp-env-if-missing.sh` — only copies `.env.example` to `.env` when `.env` doesn't already exist
- `restore-env-from-shell.js` — optionally writes env vars from the current shell into `.env` (useful after a reset)

Use these to protect from accidental overwrites and missing keys when running local scripts or CI jobs.

### Health Check

**GET** `/api/health`

Returns the service health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

### Caption Generation

**POST** `/api/caption`

Generates AI-powered caption suggestions for an image.

**Request:**

```json
{
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**

```json
{
  "baseCaption": "a person standing on a mountain",
  "variants": [
    "Standing tall on nature's peak",
    "Mountain vibes and good times",
    "Where earth meets sky",
    "Peak performance",
    "Summit serenity"
  ]
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid imageUrl
- `502 Bad Gateway`: External API (Replicate/OpenAI) failure
- `504 Gateway Timeout`: Request timeout

### Mask Generation

**POST** `/api/mask`

Generates a subject mask for the "text behind subject" effect.

**Request:**

```json
{
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**

```json
{
  "maskUrl": "https://replicate.delivery/pbxt/mask-output.png"
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid imageUrl
- `502 Bad Gateway`: Replicate API failure
- `504 Gateway Timeout`: Request timeout

### License Verification

**POST** `/api/verify`

Verifies a Gumroad license key.

**Request:**

```json
{
  "licenseKey": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
}
```

**Response:**

```json
{
  "valid": true,
  "email": "user@example.com"
}
```

**Error Responses:**

- `400 Bad Request`: Missing license key
- `502 Bad Gateway`: Gumroad API failure

## Environment Variables

All configuration is done through environment variables. See `.env.example` for a complete list with detailed explanations.

### Required Variables

| Variable                    | Description                        | Example       |
| --------------------------- | ---------------------------------- | ------------- |
| `REPLICATE_API_TOKEN`       | Replicate API authentication token | `r8_xxxxx...` |
| `OPENAI_API_KEY`            | OpenAI API authentication key      | `sk-xxxxx...` |
| `GUMROAD_PRODUCT_PERMALINK` | Gumroad product identifier         | `caption-art` |

### Optional Variables

| Variable                | Description              | Default            |
| ----------------------- | ------------------------ | ------------------ |
| `NODE_ENV`              | Environment mode         | `development`      |
| `PORT`                  | Server port              | `3001`             |
| `CORS_ORIGIN`           | Allowed CORS origins     | `*`                |
| `REPLICATE_BLIP_MODEL`  | BLIP model version       | (see .env.example) |
| `REPLICATE_REMBG_MODEL` | rembg model version      | (see .env.example) |
| `OPENAI_MODEL`          | OpenAI model name        | `gpt-3.5-turbo`    |
| `OPENAI_TEMPERATURE`    | Caption creativity (0-2) | `0.8`              |
| `GUMROAD_ACCESS_TOKEN`  | Gumroad API token        | (optional)         |

## Deployment Options

### Option 1: Docker

```bash
# Build the image
docker build -t caption-backend .

# Run the container
docker run -p 3001:3001 --env-file .env caption-backend
```

Or use docker-compose:

```bash
docker-compose up
```

### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

Set environment variables in the Railway dashboard.

### Option 3: Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set environment variables in the dashboard
4. Deploy automatically on push

### Option 4: VPS (DigitalOcean, Linode, etc.)

```bash
# SSH into your server
ssh user@your-server

# Clone and setup
git clone <your-repo-url>
cd backend
npm install
npm run build

# Install PM2 for process management
npm install -g pm2

# Start the service
pm2 start dist/server.js --name caption-backend
pm2 save
pm2 startup
```

### Option 5: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set REPLICATE_API_TOKEN=your_token
heroku config:set OPENAI_API_KEY=your_key
heroku config:set GUMROAD_PRODUCT_PERMALINK=your_product

# Deploy
git push heroku main
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed platform-specific guides.

## Development

### Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app setup and startup
│   ├── config.ts              # Environment configuration
│   ├── routes/
│   │   ├── caption.ts         # Caption generation endpoint
│   │   ├── mask.ts            # Mask generation endpoint
│   │   ├── verify.ts          # License verification endpoint
│   │   └── health.ts          # Health check endpoint
│   ├── services/
│   │   ├── replicate.ts       # Replicate API client
│   │   ├── openai.ts          # OpenAI API client
│   │   └── gumroad.ts         # Gumroad API client
│   ├── middleware/
│   │   ├── cors.ts            # CORS configuration
│   │   ├── errorHandler.ts   # Error handling middleware
│   │   ├── logger.ts          # Request logging
│   │   └── rateLimiter.ts    # Rate limiting
│   └── types/
│       └── api.ts             # TypeScript interfaces
├── dist/                      # Compiled JavaScript (generated)
├── Dockerfile                 # Container definition
├── docker-compose.yml         # Local Docker setup
├── .env.example               # Environment template
├── .env                       # Your configuration (not in Git)
├── package.json
├── tsconfig.json
└── README.md                  # This file
```

### Available Scripts

```bash
# Development with hot reloading
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Adding New Endpoints

1. Create a new route file in `src/routes/`
2. Define request/response interfaces in `src/types/api.ts`
3. Implement the route handler
4. Register the route in `src/server.ts`
5. Add tests for the new endpoint

Example:

```typescript
// src/routes/example.ts
import { Router, Request, Response } from 'express'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { input } = req.body

    // Validate input
    if (!input) {
      return res.status(400).json({ error: 'Input required' })
    }

    // Process request
    const result = await processInput(input)

    res.json({ result })
  } catch (error) {
    console.error('Example error:', error)
    throw error // Handled by error middleware
  }
})

export default router
```

### Testing

The project uses Vitest for testing with both unit tests and property-based tests.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/routes/caption.test.ts

# Run tests with coverage
npm run test:coverage
```

### Debugging

Enable detailed logging by setting `NODE_ENV=development` in your `.env` file.

```bash
# View logs in development
npm run dev

# View logs in production (with PM2)
pm2 logs caption-backend

# View logs in Docker
docker logs <container-id>
```

## Security Best Practices

- **Never commit `.env`**: Keep API keys out of version control
- **Use HTTPS in production**: Always use TLS/SSL for production deployments
- **Set specific CORS origins**: Don't use `*` in production
- **Keep dependencies updated**: Regularly run `npm audit` and update packages
- **Monitor rate limits**: Adjust rate limiting based on your usage patterns
- **Validate all inputs**: The API validates inputs, but add additional checks as needed
- **Use environment-specific configs**: Separate dev/staging/production configurations

## Troubleshooting

### Service won't start

**Problem**: Error on startup

**Solutions**:

- Check that all required environment variables are set
- Verify the port is not already in use
- Ensure Node.js version is 18 or higher
- Check for syntax errors in `.env` file

### External API errors

**Problem**: 502 Bad Gateway responses

**Solutions**:

- Verify API keys are correct and active
- Check API service status (Replicate, OpenAI)
- Review rate limits on external services
- Check network connectivity and firewall rules

### CORS errors

**Problem**: Browser shows CORS errors

**Solutions**:

- Verify `CORS_ORIGIN` includes your frontend domain
- Check that preflight requests are handled
- Ensure the frontend is using the correct backend URL
- Review browser console for specific CORS error messages

### Performance issues

**Problem**: Slow response times

**Solutions**:

- Check external API latency (Replicate, OpenAI)
- Monitor memory usage with `pm2 monit` or similar
- Review concurrent request handling
- Consider implementing caching for repeated requests
- Check server resources (CPU, memory, network)

### Rate limiting

**Problem**: 429 Too Many Requests

**Solutions**:

- Adjust rate limit settings in `src/middleware/rateLimiter.ts`
- Implement request queuing on the frontend
- Consider upgrading to a higher tier on external services
- Monitor and analyze request patterns

## Monitoring and Logging

### Request Logging

All requests are logged with:

- Timestamp
- HTTP method and path
- Response status code
- Response time

### Error Logging

Errors are logged with:

- Timestamp
- Error message and stack trace
- Request context (method, path, body)
- External API responses (when applicable)

### Production Monitoring

For production deployments, consider:

- **Application monitoring**: New Relic, Datadog, or similar
- **Log aggregation**: Loggly, Papertrail, or CloudWatch
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry, Rollbar

## Migration from AWS Lambda

If you're migrating from the AWS Lambda version, see [MIGRATION.md](./MIGRATION.md) for a detailed guide.

Key differences:

- Environment variables replace AWS SSM Parameter Store
- Direct image URLs replace S3 presigned URLs
- Express route handlers replace Lambda handlers
- Standard HTTP responses replace API Gateway format

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:

- GitHub Issues: [your-repo-url]/issues
- Documentation: [your-docs-url]
- Email: [your-email]

## Changelog

### v1.0.0 (2024-01-15)

- Initial platform-agnostic release
- Express.js server with RESTful API
- Docker support
- Comprehensive documentation
- Property-based testing
