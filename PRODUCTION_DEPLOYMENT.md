# Padel Club - VPS Production Deployment Guide

This guide follows the VPS Deployment Skill methodology for deploying the Padel Club application on a Virtual Private Server using Docker Compose and Nginx reverse proxy.

## Prerequisites

- VPS with Ubuntu/Debian OS
- Docker and Docker Compose installed
- Nginx installed on host machine (not in Docker)
- Domain name pointing to VPS IP
- SSL certificate (Let's Encrypt recommended)

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Virtual Private Server (VPS)    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Host OS (Ubuntu/Debian)        │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │
│  │  │ Nginx (Host, Port 80/443)│   │   │
│  │  │ Reverse Proxy             │   │   │
│  │  └──────┬───────────────────┘   │   │
│  │         │                       │   │
│  │         │ Proxy to Port 3070    │   │
│  │         │                       │   │
│  │  ┌──────▼───────────────────┐   │   │
│  │  │  Docker Network (internal)│   │   │
│  │  │                          │   │   │
│  │  │ ┌──────────────────────┐ │   │   │
│  │  │ │  Padel Club App      │ │   │   │
│  │  │ │  Port 3000 → 3070    │ │   │   │
│  │  │ │  (Next.js + Node)    │ │   │   │
│  │  │ └──────────────────────┘ │   │   │
│  │  │                          │   │   │
│  │  └──────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

External Users → padel.example.com:443/80 → Nginx → Docker Container :3070
```

## Step 1: Prepare the VPS

### 1.1 SSH into your VPS

```bash
ssh root@your.vps.ip
```

### 1.2 Update system packages

```bash
apt-get update && apt-get upgrade -y
```

### 1.3 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add current user to docker group
usermod -aG docker $USER
newgrp docker

# Verify Docker installation
docker --version
docker-compose --version
```

### 1.4 Install Nginx (host level)

```bash
apt-get install -y nginx certbot python3-certbot-nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

## Step 2: Clone and Prepare Repository

### 2.1 Clone the Padel Club repository

```bash
cd /opt
git clone https://github.com/your-username/Padel-Template.git padel-club
cd padel-club
```

### 2.2 Create production environment file

```bash
cp .env.example .env.production
```

Edit `.env.production` with production values:

```env
# General
APP_URL=https://padel.example.com
NODE_ENV=production

# Database
DATABASE_URL=your_production_database_url

# NextAuth
NEXTAUTH_URL=https://padel.example.com
NEXTAUTH_SECRET=your_secure_random_secret_here

# OAuth (set these if using OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=noreply@padel.example.com

# Paymob Payment Gateway
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret
CURRENCY=EGP
```

### 2.3 Update docker-compose.yml for production

Edit `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    image: padel-club:latest
    restart: unless-stopped
    env_file:
      - ./.env.production      # ← Use production env
    ports:
      - "127.0.0.1:3070:3000"  # ← Keep this port mapping
    networks:
      - internal
    # Add health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  internal:
    driver: bridge
```

## Step 3: Configure Nginx Reverse Proxy

### 3.1 Copy Nginx configuration

```bash
cp deploy/nginx/padel-club.conf /etc/nginx/sites-available/padel-club
```

### 3.2 Edit the configuration with your domain

```bash
nano /etc/nginx/sites-available/padel-club
```

Replace all instances of `padel.example.com` with your actual domain.

### 3.3 Enable the Nginx site

```bash
ln -s /etc/nginx/sites-available/padel-club /etc/nginx/sites-enabled/padel-club

# Disable default site (optional)
rm /etc/nginx/sites-enabled/default
```

### 3.4 Test Nginx configuration

```bash
nginx -t
```

Output should be:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3.5 Reload Nginx

```bash
systemctl reload nginx
```

## Step 4: Set Up SSL Certificate

### 4.1 Generate SSL certificate with Let's Encrypt

```bash
certbot certonly --nginx -d padel.example.com -d www.padel.example.com
```

Follow the prompts. Certificates will be stored in `/etc/letsencrypt/live/padel.example.com/`

### 4.2 Set up automatic certificate renewal

```bash
systemctl enable certbot.timer
systemctl start certbot.timer

# Test renewal
certbot renew --dry-run
```

## Step 5: Build and Deploy with Docker Compose

### 5.1 Build the Docker image

```bash
cd /opt/padel-club
docker-compose build
```

### 5.2 Start the application

```bash
docker-compose up -d
```

### 5.3 Verify the container is running

```bash
docker-compose ps
docker logs -f padel-club_app_1
```

### 5.4 Run database migrations (if needed)

```bash
docker-compose run --rm app npx prisma migrate deploy
```

## Step 6: Verify Deployment

### 6.1 Check container health

```bash
docker-compose ps
# Should show "Up" and "(healthy)" status
```

### 6.2 Test the application

```bash
# From your local machine
curl https://padel.example.com

# Check health endpoint
curl https://padel.example.com/health
```

### 6.3 Verify in browser

Open `https://padel.example.com` and verify:
- ✅ HTTPS connection (secure icon)
- ✅ Pages load correctly
- ✅ Login works
- ✅ Database operations succeed

## Post-Deployment

### Monitor logs

```bash
# Follow app logs
docker-compose logs -f app

# View nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Update environment variables

If you need to update environment variables:

```bash
nano .env.production
docker-compose restart app
```

### Backup database

Set up automated backups:

```bash
# Create backup directory
mkdir -p /opt/padel-club/backups

# Add to crontab for daily backups
0 2 * * * cd /opt/padel-club && docker-compose exec -T app npx prisma db dump > backups/dump-$(date +\%Y-\%m-\%d).sql
```

### Update application

```bash
cd /opt/padel-club
git pull origin main
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Container fails to start

```bash
docker-compose logs app
```

Common issues:
- Database connection error: Check `DATABASE_URL` in `.env.production`
- Missing environment variable: Ensure all required env vars are set
- Port already in use: Check if port 3070 is in use: `lsof -i :3070`

### Nginx not proxying correctly

```bash
nginx -t
systemctl reload nginx

# Check Nginx error logs
tail -n 50 /var/log/nginx/error.log
```

### SSL certificate issues

```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew --force-renewal
```

## Port Mapping Reference

| Component | Type | Host Port | Container Port | Notes |
|-----------|------|-----------|-----------------|-------|
| Nginx | Host OS | 80, 443 | - | Reverse proxy on host |
| Padel App | Docker | 3070 | 3000 | Next.js application |

## Security Checklist

- ✅ SSL/TLS enabled (HTTPS only)
- ✅ Firewall configured (UFW or similar)
- ✅ SSH key-based authentication only
- ✅ Strong `NEXTAUTH_SECRET` (32+ character random)
- ✅ Database URL uses secure connection
- ✅ Environment variables secured (not in git)
- ✅ Docker containers run as non-root user
- ✅ Regular backups automated
- ✅ Security headers in Nginx config
- ✅ Rate limiting configured (optional)

## Support and Troubleshooting

For issues, check:
1. Container logs: `docker-compose logs app`
2. Nginx logs: `/var/log/nginx/error.log`
3. System logs: `journalctl -u docker.service`
4. Application health: `curl https://padel.example.com/health`
