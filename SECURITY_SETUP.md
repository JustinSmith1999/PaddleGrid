# Security Setup Guide

This document outlines the security features implemented in PaddleGrid and how to configure them for production.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [OAuth Configuration](#oauth-configuration)
3. [Security Headers](#security-headers)
4. [Error Monitoring](#error-monitoring)
5. [Cookie Consent](#cookie-consent)
6. [Rate Limiting](#rate-limiting)
7. [Content Security Policy](#content-security-policy)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Production Deployment](#production-deployment)

## Environment Variables

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all required environment variables with your actual values

### Required Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `STRIPE_SECRET_KEY`: Stripe secret key (use test key for development)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

### Optional Variables

- `VITE_SENTRY_DSN`: Sentry error tracking DSN
- `VITE_REDIS_URL`: Redis URL for caching and rate limiting
- `COURTRESERVE_*`: CourtReserve integration credentials

### Important Security Notes

- **NEVER** commit `.env` files to version control
- Use **test** keys in development
- Use **live** keys only in production
- Rotate keys regularly (every 90 days recommended)
- Keep separate keys for development, staging, and production

## OAuth Configuration

### Sign in with Apple

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Create a new App ID and Service ID
3. Configure Sign in with Apple
4. Add your domain and redirect URLs
5. In Supabase Dashboard:
   - Navigate to Authentication > Providers
   - Enable Apple
   - Enter your Service ID, Team ID, and Key ID
   - Upload your private key

### Sign in with Google

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`
   - Supabase callback: `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase Dashboard:
   - Navigate to Authentication > Providers
   - Enable Google
   - Enter your Client ID and Client Secret

### Redirect URLs

Ensure these redirect URLs are configured:
- Local development: `http://localhost:5173`
- Production: `https://your-production-domain.com`

## Security Headers

### Development

Security headers are automatically applied in development via the Vite plugin in `vite.config.ts`.

### Production

Security headers are configured for production in multiple ways:

#### For Netlify/Cloudflare Pages
The `public/_headers` file is automatically deployed with your site.

#### For Vercel
The `vercel.json` file configures headers automatically.

#### For Custom Servers
Configure these headers in your web server:

```nginx
# Nginx example
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## Error Monitoring

### Sentry Setup

1. Create a free account at [Sentry.io](https://sentry.io)
2. Create a new project
3. Copy your DSN
4. Add to `.env`:
   ```
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
   SENTRY_ORG=your-organization
   SENTRY_PROJECT=your-project
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

### Features

- **Error Tracking**: Automatic error capture and reporting
- **Performance Monitoring**: Track slow operations and API calls
- **Session Replay**: Visual playback of user sessions with errors
- **User Feedback**: Users can submit feedback when errors occur
- **Source Maps**: Uploaded automatically during build

### Privacy

- Cookies are automatically filtered from error reports
- Session replay masks sensitive text and blocks media
- PII is stripped from error data

## Cookie Consent

### GDPR/CCPA Compliance

The cookie consent banner is automatically shown to first-time visitors and includes:

- **Necessary Cookies**: Always enabled (authentication, security)
- **Analytics Cookies**: Optional (Sentry, performance tracking)
- **Marketing Cookies**: Optional (advertising, retargeting)

### User Rights

Users can:
- Accept all cookies
- Accept only necessary cookies
- Customize their preferences
- Change preferences at any time
- View privacy policy

### Implementation

The consent preferences are stored in `localStorage` and checked before enabling analytics or marketing features.

## Rate Limiting

### Configuration

Rate limiting is implemented at multiple levels:

1. **Client-Side**: Prevents rapid form submissions
2. **Supabase**: Row-level security and rate limiting
3. **Edge Functions**: API rate limiting
4. **Redis** (Optional): Advanced rate limiting with Redis

### Setup Redis (Optional)

1. Create a free Redis instance at [Upstash](https://upstash.com)
2. Copy your Redis URL
3. Add to `.env`:
   ```
   VITE_REDIS_URL=redis://default:password@endpoint:port
   ```

Without Redis, rate limiting falls back to database-based tracking.

## Content Security Policy

### Current Policy

```
default-src 'self';
script-src 'self' https://js.stripe.com https://browser.sentry-cdn.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://*.sentry.io;
frame-src https://js.stripe.com;
```

### Customization

If you add new third-party services, update the CSP in:
- `vite.config.ts` (development)
- `public/_headers` (production)
- `vercel.json` (Vercel deployments)

## SSL/TLS Configuration

### Certificate

Use a valid SSL/TLS certificate from:
- Let's Encrypt (free)
- Your hosting provider (usually included)
- Commercial CA (for extended validation)

### HTTPS Enforcement

The `Strict-Transport-Security` header enforces HTTPS:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### HSTS Preloading (Optional)

Submit your domain to the [HSTS Preload List](https://hstspreload.org/) for maximum security.

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] OAuth providers configured and tested
- [ ] Sentry configured for error tracking
- [ ] Security headers configured
- [ ] SSL/TLS certificate installed
- [ ] Domain configured in Supabase
- [ ] Stripe configured with live keys
- [ ] Rate limiting tested
- [ ] Cookie consent banner tested
- [ ] SEO meta tags configured
- [ ] robots.txt and sitemap.xml configured

### Deployment Steps

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Test Production Build Locally**
   ```bash
   npm run preview
   ```

3. **Deploy to Your Hosting Provider**

   - **Netlify**: Connect your repository and deploy
   - **Vercel**: `vercel --prod`
   - **Cloudflare Pages**: Connect your repository
   - **Custom Server**: Upload `dist` folder

4. **Configure DNS**
   - Point your domain to your hosting provider
   - Wait for DNS propagation (up to 48 hours)

5. **Test in Production**
   - Check security headers: [Security Headers](https://securityheaders.com)
   - Test SSL: [SSL Labs](https://www.ssllabs.com/ssltest/)
   - Test OAuth flows
   - Test payment processing
   - Monitor errors in Sentry

### Post-Deployment

- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Configure backup verification
- Set up alerts for critical errors
- Document your deployment process
- Schedule regular security audits

## Security Best Practices

1. **Never expose secrets**: Keep all API keys and secrets in `.env`
2. **Use environment-specific keys**: Separate keys for dev/staging/production
3. **Rotate credentials regularly**: Change keys every 90 days
4. **Monitor for breaches**: Use services like HaveIBeenPwned API
5. **Keep dependencies updated**: Run `npm audit` regularly
6. **Enable 2FA**: On all service accounts (GitHub, Supabase, Stripe, etc.)
7. **Review access logs**: Check for suspicious activity
8. **Backup regularly**: Automated daily backups of database
9. **Test disaster recovery**: Practice restoring from backups
10. **Security training**: Keep your team updated on security practices

## Support

If you have security concerns or find vulnerabilities:
- Do NOT open a public issue
- Email security@paddlegrid.com (replace with your security contact)
- Expect a response within 24 hours

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Stripe Security](https://stripe.com/docs/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
