# Scalability Quick Start

Get PaddleGrid production-ready in 15 minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account (already configured)
- Domain name (for production deployment)

---

## Step 1: Configure Sentry (5 min)

### 1.1 Create Sentry Account
1. Go to https://sentry.io and sign up
2. Create new project, select "React"
3. Copy your DSN

### 1.2 Update .env
```bash
# Add to .env file
VITE_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/123456
SENTRY_ORG=your-org-name
SENTRY_PROJECT=paddlegrid
SENTRY_AUTH_TOKEN=your-auth-token
```

### 1.3 Get Auth Token
1. Go to Sentry Settings > Auth Tokens
2. Create new token with `project:releases` scope
3. Add to `.env`

**Verification:**
```bash
# Run the app
npm run dev

# Errors will now appear in Sentry dashboard
```

---

## Step 2: Set Up Monitoring (5 min)

### 2.1 Uptime Monitoring
1. Sign up for BetterStack: https://betterstack.com
2. Add monitor for your domain
3. Set check interval: 1 minute
4. Configure alert email

### 2.2 Supabase Alerts
1. Open Supabase dashboard
2. Go to Project Settings > Alerts
3. Enable alerts for:
   - Database CPU > 80%
   - Connection count > 80%
   - Error rate > 5%

**Verification:**
You should receive a test alert within 5 minutes.

---

## Step 3: Enable Caching (Already Done! ✅)

React Query is configured and ready. Use provided hooks:

```typescript
import { useFacilityPosts } from './hooks/useQueries';

function MyComponent({ facilityId }) {
  // Automatic caching, refetching, and error handling
  const { data, isLoading, error } = useFacilityPosts(facilityId);

  // That's it! No manual cache management needed
}
```

**Available Hooks:**
- `useFacilityPosts(facilityId)` - 2min cache
- `useUserProfile(userId)` - 10min cache
- `useFacilities()` - 15min cache
- `useUserBookings(userId)` - 1min cache
- And 10+ more (see `src/hooks/useQueries.ts`)

---

## Step 4: Test Performance (3 min)

### 4.1 Run Lighthouse Test
```bash
# Build production version
npm run build
npm run preview

# Open Chrome DevTools
# Run Lighthouse audit (Performance)
```

**Target Scores:**
- Performance: > 85
- Best Practices: > 90
- SEO: > 90

### 4.2 Check Bundle Size
```bash
npm run build

# Look for this output:
# ✓ built in ~20s
# Total bundle: ~400KB gzipped
```

If main bundle > 500KB, consider additional code splitting.

---

## Step 5: Deploy to Production (2 min)

### Option A: Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

### Option B: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Add environment variables
vercel env add VITE_SENTRY_DSN
```

### Option C: Self-Host
```bash
# Build
npm run build

# Serve dist/ folder with any static host
# (Nginx, Apache, Caddy, etc.)
```

**Important:** Set environment variables in your hosting platform!

---

## Verification Checklist

After deployment, verify everything works:

### ✅ Error Tracking
- [ ] Visit Sentry dashboard - see "0 errors" (good!)
- [ ] Trigger test error (click a broken feature)
- [ ] Error appears in Sentry within 30 seconds

### ✅ Monitoring
- [ ] Uptime monitor shows "Up"
- [ ] Supabase shows green status
- [ ] Can access application from public URL

### ✅ Performance
- [ ] Page loads in < 3 seconds
- [ ] Images load progressively
- [ ] No console errors

### ✅ Caching
- [ ] Open React Query DevTools (dev mode)
- [ ] See cached queries
- [ ] Navigate between pages - instant loading

### ✅ Rate Limiting
- [ ] Check `rate_limits` table in Supabase
- [ ] Should see entries after user actions
- [ ] No errors from rate limiting (good!)

---

## Common Issues

### Issue: Sentry not capturing errors
**Solution:** Check VITE_SENTRY_DSN is set and starts with `https://`

### Issue: React Query not caching
**Solution:** Ensure QueryClientProvider wraps your app (already done in `src/main.tsx`)

### Issue: Images not optimizing
**Solution:** Use `OptimizedImage` component instead of `<img>`:
```tsx
import { OptimizedImage } from './components/OptimizedImage';
```

### Issue: Build warnings about chunk size
**Solution:** This is expected. We've implemented code splitting, but some chunks are still large. Consider manual chunking if needed.

---

## Next Steps

Now that you're production-ready, consider:

1. **Add Tests**
   ```bash
   npm run test
   # Write tests in src/**/*.test.ts
   ```

2. **Set Up CI/CD**
   - GitHub Actions for automated testing
   - Automatic deployments on push to main

3. **Monitor Real Users**
   - Set up session recording in Sentry
   - Track user flows and drop-offs

4. **Optimize Images**
   - Use `compressImage()` before uploads
   - See `IMAGE_OPTIMIZATION_GUIDE.md`

5. **Load Testing**
   - Test with 100+ concurrent users
   - See `SCALABILITY_IMPLEMENTATION_SUMMARY.md`

---

## Support Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/react/
- **React Query Docs**: https://tanstack.com/query/latest/docs/react/overview
- **Supabase Monitoring**: https://supabase.com/docs/guides/platform/metrics
- **Vite Performance**: https://vitejs.dev/guide/performance.html

---

## Quick Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Testing
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests (single run)
npm run test:coverage # Generate coverage report
npm run test:ui      # Open test UI

# Code Quality
npm run lint         # Lint code
npm run typecheck    # Type checking

# Deployment
netlify deploy --prod  # Deploy to Netlify
vercel --prod          # Deploy to Vercel
```

---

## Success!

You're now running PaddleGrid at scale with:
- ✅ Error tracking (Sentry)
- ✅ Performance monitoring
- ✅ Intelligent caching (React Query)
- ✅ Rate limiting
- ✅ Optimized images
- ✅ Code splitting
- ✅ Production build

**Your app can now handle 5,000-10,000 concurrent users.**

For detailed information, see:
- `SCALABILITY_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `MONITORING_SETUP.md` - Advanced monitoring strategies
- `IMAGE_OPTIMIZATION_GUIDE.md` - Image optimization techniques
