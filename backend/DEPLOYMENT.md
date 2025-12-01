# Deployment Guide

This guide provides detailed instructions for deploying the platform-agnostic backend to various hosting platforms.

## Table of Contents

- [Docker Deployment](#docker-deployment)
- [Railway Deployment](#railway-deployment)
- [Render Deployment](#render-deployment)
- [VPS Deployment](#vps-deployment)
- [Heroku Deployment](#heroku-deployment)
- [DigitalOcean App Platform](#digitalocean-app-platform)
- [Fly.io Deployment](#flyio-deployment)
- [Comparison Matrix](#comparison-matrix)

---

## Docker Deployment

Docker provides the most portable deployment option. Your application runs in a container that works identically across all environments.

### Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose (optional, for easier local development)

### Standalone Docker

#### 1. Build the Image

```bash
cd backend
docker build -t caption-backend:latest .
```

#### 2. Run the Container

```bash
docker run -d \
  --name caption-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e REPLICATE_API_TOKEN=your_token \
  -e OPENAI_API_KEY=your_key \
  -e GUMROAD_PRODUCT_PERMALINK=your_product \
  -e CORS_ORIGIN=https://your-frontend.com \
  caption-backend:latest
```

#### 3. Verify It's Running

```bash
# Check container status
docker ps

# View logs
docker logs caption-backend

# Test the API
curl http://localhost:3001/api/health
```

#### 4. Stop and Remove

```bash
docker stop caption-backend
docker rm caption-backend
```

### Docker Compose

Docker Compose simplifies multi-container setups and environment management.

#### 1. Create docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GUMROAD_PRODUCT_PERMALINK=${GUMROAD_PRODUCT_PERMALINK}
      - GUMROAD_ACCESS_TOKEN=${GUMROAD_ACCESS_TOKEN}
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 2. Create .env File

```bash
cp .env.example .env
# Edit .env with your values
```

#### 3. Start Services

```bash
docker-compose up -d
```

#### 4. View Logs

```bash
docker-compose logs -f backend
```

#### 5. Stop Services

```bash
docker-compose down
```

### Production Docker Deployment

For production, consider:

1. **Use a Container Registry**
   ```bash
   # Tag for registry
   docker tag caption-backend:latest registry.example.com/caption-backend:v1.0.0
   
   # Push to registry
   docker push registry.example.com/caption-backend:v1.0.0
   ```

2. **Use Docker Secrets** (for sensitive data)
   ```bash
   echo "your_api_token" | docker secret create replicate_token -
   ```

3. **Set Resource Limits**
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
           reservations:
             cpus: '0.5'
             memory: 256M
   ```

4. **Enable Auto-Restart**
   ```yaml
   restart: unless-stopped
   ```

---

## Railway Deployment

Railway offers simple deployment with automatic HTTPS, environment management, and GitHub integration.

### Prerequisites

- Railway account ([Sign up](https://railway.app/))
- Railway CLI (optional)

### Method 1: GitHub Integration (Recommended)

#### 1. Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

#### 2. Create New Project on Railway

1. Go to [railway.app](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect the Node.js app

#### 3. Configure Environment Variables

In the Railway dashboard:
1. Go to your project
2. Click "Variables"
3. Add each variable:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `REPLICATE_API_TOKEN` = `your_token`
   - `OPENAI_API_KEY` = `your_key`
   - `GUMROAD_PRODUCT_PERMALINK` = `your_product`
   - `CORS_ORIGIN` = `https://your-frontend.com`

#### 4. Deploy

Railway automatically deploys on push to main branch.

#### 5. Get Your URL

Railway provides a URL like: `https://your-app.up.railway.app`

### Method 2: Railway CLI

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login

```bash
railway login
```

#### 3. Initialize Project

```bash
cd backend
railway init
```

#### 4. Set Environment Variables

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set REPLICATE_API_TOKEN=your_token
railway variables set OPENAI_API_KEY=your_key
railway variables set GUMROAD_PRODUCT_PERMALINK=your_product
railway variables set CORS_ORIGIN=https://your-frontend.com
```

#### 5. Deploy

```bash
railway up
```

### Railway Configuration

Create `railway.json` for custom configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Monitoring on Railway

- View logs in real-time from the dashboard
- Set up usage alerts
- Monitor CPU and memory usage
- Configure custom domains

---

## Render Deployment

Render provides free tier hosting with automatic HTTPS and easy GitHub integration.

### Prerequisites

- Render account ([Sign up](https://render.com/))
- Code pushed to GitHub

### Deployment Steps

#### 1. Create New Web Service

1. Go to [render.com](https://render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository

#### 2. Configure Service

- **Name**: `caption-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### 3. Set Environment Variables

Click "Advanced" and add:

```
NODE_ENV=production
PORT=3001
REPLICATE_API_TOKEN=your_token
OPENAI_API_KEY=your_key
GUMROAD_PRODUCT_PERMALINK=your_product
CORS_ORIGIN=https://your-frontend.com
```

#### 4. Choose Plan

- **Free**: Good for testing (spins down after inactivity)
- **Starter ($7/mo)**: Always on, better for production

#### 5. Deploy

Click "Create Web Service" - Render will build and deploy automatically.

#### 6. Get Your URL

Render provides a URL like: `https://caption-backend.onrender.com`

### Render Configuration File

Create `render.yaml` for infrastructure as code:

```yaml
services:
  - type: web
    name: caption-backend
    env: node
    region: oregon
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: REPLICATE_API_TOKEN
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: GUMROAD_PRODUCT_PERMALINK
        value: caption-art
      - key: CORS_ORIGIN
        value: https://your-frontend.com
    healthCheckPath: /api/health
```

### Auto-Deploy on Push

Render automatically deploys when you push to your main branch.

---

## VPS Deployment

Deploy to any Virtual Private Server (DigitalOcean Droplet, Linode, AWS EC2, etc.) with full control.

### Prerequisites

- VPS with Ubuntu 20.04+ or similar
- SSH access
- Domain name (optional)

### Initial Server Setup

#### 1. SSH into Server

```bash
ssh root@your-server-ip
```

#### 2. Create Non-Root User

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

#### 3. Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 4. Install PM2

```bash
sudo npm install -g pm2
```

### Application Deployment

#### 1. Clone Repository

```bash
cd ~
git clone https://github.com/your-username/your-repo.git
cd your-repo/backend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Build Application

```bash
npm run build
```

#### 4. Create Environment File

```bash
nano .env
```

Add your environment variables:
```
NODE_ENV=production
PORT=3001
REPLICATE_API_TOKEN=your_token
OPENAI_API_KEY=your_key
GUMROAD_PRODUCT_PERMALINK=your_product
CORS_ORIGIN=https://your-frontend.com
```

#### 5. Start with PM2

```bash
pm2 start dist/server.js --name caption-backend
```

#### 6. Configure PM2 Startup

```bash
pm2 startup systemd
# Run the command it outputs
pm2 save
```

### Nginx Reverse Proxy

#### 1. Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

#### 2. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/caption-backend
```

Add configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/caption-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

#### 1. Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

#### 2. Get Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

#### 3. Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Monitoring and Maintenance

```bash
# View logs
pm2 logs caption-backend

# Monitor resources
pm2 monit

# Restart application
pm2 restart caption-backend

# Update application
cd ~/your-repo/backend
git pull
npm install
npm run build
pm2 restart caption-backend
```

### Systemd Service (Alternative to PM2)

Create `/etc/systemd/system/caption-backend.service`:

```ini
[Unit]
Description=Caption Backend Service
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/your-repo/backend
Environment=NODE_ENV=production
EnvironmentFile=/home/deploy/your-repo/backend/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable caption-backend
sudo systemctl start caption-backend
sudo systemctl status caption-backend
```

---

## Heroku Deployment

Heroku offers simple deployment with Git-based workflow.

### Prerequisites

- Heroku account ([Sign up](https://heroku.com/))
- Heroku CLI ([Install](https://devcenter.heroku.com/articles/heroku-cli))

### Deployment Steps

#### 1. Login to Heroku

```bash
heroku login
```

#### 2. Create Heroku App

```bash
cd backend
heroku create your-app-name
```

#### 3. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set REPLICATE_API_TOKEN=your_token
heroku config:set OPENAI_API_KEY=your_key
heroku config:set GUMROAD_PRODUCT_PERMALINK=your_product
heroku config:set CORS_ORIGIN=https://your-frontend.com
```

#### 4. Create Procfile

```bash
echo "web: npm start" > Procfile
```

#### 5. Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### 6. Scale Dynos

```bash
heroku ps:scale web=1
```

#### 7. Open Application

```bash
heroku open
```

### Heroku Configuration

Create `app.json` for app metadata:

```json
{
  "name": "caption-backend",
  "description": "Platform-agnostic backend for Caption Art",
  "repository": "https://github.com/your-username/your-repo",
  "keywords": ["node", "express", "api"],
  "env": {
    "NODE_ENV": {
      "description": "Node environment",
      "value": "production"
    },
    "REPLICATE_API_TOKEN": {
      "description": "Replicate API token",
      "required": true
    },
    "OPENAI_API_KEY": {
      "description": "OpenAI API key",
      "required": true
    },
    "GUMROAD_PRODUCT_PERMALINK": {
      "description": "Gumroad product permalink",
      "required": true
    }
  }
}
```

### Monitoring on Heroku

```bash
# View logs
heroku logs --tail

# Monitor metrics
heroku ps

# Restart dynos
heroku restart
```

---

## DigitalOcean App Platform

DigitalOcean App Platform provides managed hosting with automatic scaling.

### Prerequisites

- DigitalOcean account ([Sign up](https://www.digitalocean.com/))
- Code pushed to GitHub

### Deployment Steps

#### 1. Create New App

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as source
4. Select your repository and branch

#### 2. Configure App

- **Name**: `caption-backend`
- **Type**: Web Service
- **Environment**: Node.js
- **Build Command**: `npm install && npm run build`
- **Run Command**: `npm start`
- **HTTP Port**: `3001`

#### 3. Set Environment Variables

Add in the "Environment Variables" section:
```
NODE_ENV=production
PORT=3001
REPLICATE_API_TOKEN=your_token
OPENAI_API_KEY=your_key
GUMROAD_PRODUCT_PERMALINK=your_product
CORS_ORIGIN=https://your-frontend.com
```

#### 4. Choose Plan

- **Basic**: $5/month (512MB RAM, 1 vCPU)
- **Professional**: $12/month (1GB RAM, 1 vCPU)

#### 5. Deploy

Click "Create Resources" - DigitalOcean will build and deploy.

### App Spec File

Create `.do/app.yaml`:

```yaml
name: caption-backend
services:
  - name: api
    github:
      repo: your-username/your-repo
      branch: main
      deploy_on_push: true
    build_command: npm install && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3001
    health_check:
      http_path: /api/health
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3001"
      - key: REPLICATE_API_TOKEN
        type: SECRET
      - key: OPENAI_API_KEY
        type: SECRET
      - key: GUMROAD_PRODUCT_PERMALINK
        value: caption-art
```

### Monitoring

- View logs in the DigitalOcean dashboard
- Set up alerts for downtime
- Monitor resource usage
- Configure custom domains

---

## Fly.io Deployment

Fly.io runs Docker containers close to your users with global distribution.

### Prerequisites

- Fly.io account ([Sign up](https://fly.io/))
- Fly CLI ([Install](https://fly.io/docs/hands-on/install-flyctl/))

### Deployment Steps

#### 1. Login to Fly

```bash
flyctl auth login
```

#### 2. Launch App

```bash
cd backend
flyctl launch
```

Answer the prompts:
- App name: `caption-backend`
- Region: Choose closest to users
- PostgreSQL: No
- Redis: No

#### 3. Set Environment Variables

```bash
flyctl secrets set REPLICATE_API_TOKEN=your_token
flyctl secrets set OPENAI_API_KEY=your_key
flyctl secrets set GUMROAD_PRODUCT_PERMALINK=your_product
flyctl secrets set CORS_ORIGIN=https://your-frontend.com
```

#### 4. Deploy

```bash
flyctl deploy
```

#### 5. Open Application

```bash
flyctl open
```

### Fly.io Configuration

The `fly.toml` file is created automatically, but you can customize:

```toml
app = "caption-backend"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[http_service.checks]]
  interval = "30s"
  timeout = "5s"
  grace_period = "10s"
  method = "GET"
  path = "/api/health"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### Scaling on Fly.io

```bash
# Scale to multiple regions
flyctl regions add lax ord

# Scale instances
flyctl scale count 2

# Scale resources
flyctl scale vm shared-cpu-1x --memory 512
```

### Monitoring

```bash
# View logs
flyctl logs

# Monitor status
flyctl status

# SSH into machine
flyctl ssh console
```

---

## Comparison Matrix

| Feature | Docker | Railway | Render | VPS | Heroku | DO App | Fly.io |
|---------|--------|---------|--------|-----|--------|--------|--------|
| **Free Tier** | ✅ (self-hosted) | ✅ ($5 credit) | ✅ (limited) | ❌ | ✅ (limited) | ❌ | ✅ (limited) |
| **Ease of Setup** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Auto HTTPS** | ❌ | ✅ | ✅ | ⚙️ (manual) | ✅ | ✅ | ✅ |
| **Auto Deploy** | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Custom Domain** | ⚙️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Scaling** | ⚙️ (manual) | ✅ | ✅ | ⚙️ (manual) | ✅ | ✅ | ✅ |
| **Cost (monthly)** | $5-20 | $5+ | $7+ | $5-20 | $7+ | $5+ | $0-10 |
| **Control Level** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Best For** | Any | Quick start | Simple apps | Full control | Prototypes | DO users | Global apps |

### Recommendations

- **Development**: Docker or Railway
- **Quick Prototype**: Railway or Render
- **Production (Simple)**: Railway or Render
- **Production (Control)**: VPS or Fly.io
- **Production (Scale)**: Fly.io or DigitalOcean
- **Budget-Conscious**: Fly.io free tier or VPS
- **Enterprise**: VPS with custom setup

---

## Post-Deployment Checklist

After deploying to any platform:

- [ ] Test health endpoint: `curl https://your-url/api/health`
- [ ] Test caption endpoint with sample image
- [ ] Test mask endpoint with sample image
- [ ] Verify CORS works from frontend domain
- [ ] Check logs for errors
- [ ] Monitor response times
- [ ] Set up uptime monitoring
- [ ] Configure custom domain (if needed)
- [ ] Set up SSL certificate (if not automatic)
- [ ] Configure backups (if applicable)
- [ ] Set up alerts for downtime
- [ ] Document deployment process
- [ ] Update frontend with backend URL

## Troubleshooting

### Build Failures

- Check Node.js version (should be 18+)
- Verify all dependencies in package.json
- Check for TypeScript errors: `npm run build`
- Review build logs for specific errors

### Runtime Errors

- Verify all environment variables are set
- Check API keys are valid
- Review application logs
- Test endpoints individually
- Verify network connectivity to external APIs

### Performance Issues

- Monitor CPU and memory usage
- Check external API latency
- Consider caching responses
- Scale horizontally if needed
- Optimize database queries (if applicable)

## Support

For platform-specific issues:
- **Docker**: [Docker Documentation](https://docs.docker.com/)
- **Railway**: [Railway Docs](https://docs.railway.app/)
- **Render**: [Render Docs](https://render.com/docs)
- **Heroku**: [Heroku Dev Center](https://devcenter.heroku.com/)
- **DigitalOcean**: [DO Docs](https://docs.digitalocean.com/)
- **Fly.io**: [Fly.io Docs](https://fly.io/docs/)
