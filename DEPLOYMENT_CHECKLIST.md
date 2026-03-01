# Padel Club - Pre-Deployment Checklist

Use this checklist before deploying to production to ensure everything is configured correctly.

## ✅ Environment & Secrets

- [ ] Create `.env.production` file from `.env.production.example`
- [ ] Set `NEXTAUTH_SECRET` to a secure random value (32+ chars)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Set `APP_URL` to your production domain
- [ ] Set `DATABASE_URL` to production database connection string
- [ ] Generate strong secrets for all API keys:
  - [ ] `PAYMOB_HMAC_SECRET`
  - [ ] Any other sensitive keys
- [ ] Do NOT commit `.env.production` to git
- [ ] Verify `.env.production` is in `.gitignore`

## ✅ Database

- [ ] Create production PostgreSQL database
- [ ] Test database connection: `psql -c "SELECT 1"`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed production data if needed: `npm run seed`
- [ ] Back up database before first deployment
- [ ] Set up automated daily backups

## ✅ Third-Party Services

### Email (Resend)
- [ ] Create Resend account at https://resend.com/
- [ ] Generate API key
- [ ] Set `RESEND_API_KEY`
- [ ] Set `RESEND_FROM` to a verified email domain
- [ ] Test email sending from staging

### Payment Gateway (Paymob)
- [ ] Create Paymob account at https://paymob.com/
- [ ] Create card integration
- [ ] Get Integration ID and Iframe ID
- [ ] Get HMAC secret for webhook verification
- [ ] Test payment flow in sandbox mode first
- [ ] Configure webhook URL for order confirmations

### OAuth (Optional)
- [ ] Create Google OAuth 2.0 credentials at https://console.cloud.google.com/
  - [ ] Set Authorized redirect URI to `https://yourdomain.com/api/auth/callback/google`
  - [ ] Save Client ID and Client Secret
- [ ] Create Facebook App at https://developers.facebook.com/
  - [ ] Set Valid OAuth Redirect URIs to `https://yourdomain.com/api/auth/callback/facebook`
  - [ ] Save App ID and App Secret

## ✅ VPS & Infrastructure

- [ ] VPS provisioned with Ubuntu/Debian
- [ ] SSH key authentication configured
- [ ] Firewall rules set up (UFW):
  ```bash
  ufw allow 22/tcp  # SSH
  ufw allow 80/tcp  # HTTP
  ufw allow 443/tcp # HTTPS
  ufw enable
  ```
- [ ] Docker installed and tested
- [ ] Docker Compose installed and tested
- [ ] Nginx installed on host OS
- [ ] Repository cloned to `/opt/padel-club` (or your preferred path)

## ✅ SSL/TLS Certificate

- [ ] Domain DNS records point to VPS IP
- [ ] Let's Encrypt certificate generated:
  ```bash
  certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
  ```
- [ ] Certificate paths updated in Nginx config
- [ ] Automatic renewal configured with systemd timer
- [ ] Certificate renewal tested:
  ```bash
  certbot renew --dry-run
  ```

## ✅ Nginx Configuration

- [ ] Nginx config copied to `/etc/nginx/sites-available/padel-club`
- [ ] Domain names updated in Nginx config (find `padel.example.com` and replace)
- [ ] Nginx syntax validated:
  ```bash
  nginx -t
  ```
- [ ] Nginx reloaded:
  ```bash
  systemctl reload nginx
  ```
- [ ] Gzip compression enabled
- [ ] Security headers configured
- [ ] Rate limiting configured (optional)

## ✅ Docker & Application

- [ ] `docker-compose.yml` uses `.env.production`
- [ ] Port mapping is `127.0.0.1:3070:3000`
- [ ] Health check endpoint configured
- [ ] Application container name matches in configs
- [ ] Docker image built successfully:
  ```bash
  docker-compose build
  ```
- [ ] Container starts and stays running:
  ```bash
  docker-compose up -d
  docker-compose ps
  ```
- [ ] Logs show no errors:
  ```bash
  docker-compose logs app
  ```
- [ ] Health check passes:
  ```bash
  curl http://127.0.0.1:3070/api/health
  ```

## ✅ Network & Routing

- [ ] Nginx reverse proxy correctly routes to Docker container
- [ ] HTTPS redirects from HTTP work:
  ```bash
  curl -I http://yourdomain.com
  # Should return 301 redirect to https
  ```
- [ ] Application accessible at `https://yourdomain.com`
- [ ] All pages load correctly (homepage, book, login, etc.)
- [ ] API endpoints respond correctly:
  ```bash
  curl -I https://yourdomain.com/api/courts
  # Should return 200
  ```

## ✅ Application Functionality

- [ ] Homepage loads with images and hero section
- [ ] Navigation menu works
- [ ] Login page accessible
- [ ] Registration works
- [ ] Authentication flow works (login/logout)
- [ ] Court booking form accessible
- [ ] Can select court, date, time
- [ ] Calendar loads without errors
- [ ] Booking creation works
- [ ] Email notifications send correctly
- [ ] Payment gateway integration works (test transaction)
- [ ] Dashboard loads (admin view)

## ✅ Logging & Monitoring

- [ ] Docker logs configured with size limits
- [ ] Nginx access/error logs monitored
- [ ] Application errors tracked
- [ ] Set up log rotation (optional but recommended):
  ```bash
  echo '/var/log/nginx/*.log {
    daily
    rotate 14
    missingok
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
  }' > /etc/logrotate.d/nginx
  ```

## ✅ Backup & Recovery

- [ ] Database backup strategy defined
- [ ] Automated daily database backups configured
- [ ] Backup storage location verified
- [ ] Backup restore procedure tested
- [ ] Application code backed up to git

## ✅ Security

- [ ] All secrets moved to environment variables (not in code)
- [ ] `.env.production` added to `.gitignore`
- [ ] SSH port changed from 22 (optional but recommended)
- [ ] Root login disabled in SSH config
- [ ] Fail2ban or similar configured (optional)
- [ ] Regular security updates scheduled
- [ ] Database password is strong
- [ ] Database only accessible from application container
- [ ] API keys rotated and stored securely
- [ ] HTTPS enforced (no HTTP allowed except redirect)

## ✅ Performance

- [ ] Gzip compression enabled in Nginx
- [ ] Static asset caching configured
- [ ] Database indexes present on frequently queried columns
- [ ] Image optimization in place
- [ ] No console.log statements in production code

## ✅ Maintenance

- [ ] Documented deployment process
- [ ] Backup/restore procedures documented
- [ ] Created runbooks for common tasks
- [ ] Set up monitoring alerts (optional)
- [ ] Created update/rollback procedures
- [ ] Database migration strategy planned

## ✅ Post-Deployment Testing

- [ ] Full smoke test from public internet
- [ ] Load test with simulated users (optional)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified
- [ ] Email delivery verified
- [ ] Payment webhook received and processed
- [ ] Error handling works (test with invalid inputs)
- [ ] Rate limiting works (if configured)

## ✅ Final Steps

- [ ] All team members notified of deployment
- [ ] Monitoring dashboard set up (optional)
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan ready
- [ ] Deployment completed and verified
- [ ] Post-deployment review scheduled

## Common Issues & Solutions

### Port Already in Use
```bash
lsof -i :3070
kill -9 <PID>
```

### Certificate Issues
```bash
certbot certificates
certbot renew --force-renewal
```

### Container Won't Start
```bash
docker-compose logs app
docker-compose down
docker system prune
docker-compose up -d
```

### Database Connection Failed
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Nginx Not Proxying
```bash
nginx -t
systemctl reload nginx
tail -f /var/log/nginx/error.log
```

## Support Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Version:** _______________

**Notes:** _______________________________________________
