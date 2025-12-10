# PaddleGrid CRM - Database Migration Guide

This document contains the SQL migration needed to transform PaddleGrid into a comprehensive CRM system.

## Migration Overview

This migration adds:
- **Enhanced Role System**: owner, admin, desk, coach, user
- **Promo Codes**: Discount system for memberships, bookings, and events
- **Ball Machines**: Inventory and rental management
- **Audit Logs**: Comprehensive system tracking
- **POS System**: Point of sale with cash drawer and refund tracking
- **Family Accounts**: Link family members with shared billing
- **Court Schedules**: Bulk closures and maintenance scheduling
- **Leagues**: Full league management with teams and standings
- **Recurring Bookings**: Automated booking generation
- **Notification Preferences**: Granular email/SMS settings

## How to Apply

Copy the SQL from `supabase/migrations/20251205000000_add_crm_features.sql` and run it in your Supabase SQL editor at:
https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

## Database Schema Changes

### New Tables Created

1. **promo_codes** - Discount code management
2. **ball_machines** - Equipment inventory
3. **ball_machine_rentals** - Rental tracking
4. **audit_logs** - System audit trail
5. **pos_transactions** - Point of sale transactions
6. **cash_drawers** - Cash drawer reconciliation
7. **family_accounts** - Family account management
8. **family_members** - Family member linking
9. **court_schedules** - Court availability management
10. **leagues** - League definitions
11. **league_teams** - Team registrations
12. **recurring_bookings** - Automated bookings
13. **notification_preferences** - User notification settings

### Role Hierarchy

```
owner > admin > desk > coach > user
```

- **owner**: Full system access
- **admin**: Manage all data, users, and settings
- **desk**: Front desk operations (bookings, POS, check-ins)
- **coach**: Manage lessons, events, and leagues
- **user**: Standard member access

## Important Notes

1. The migration is idempotent - safe to run multiple times
2. All existing data is preserved
3. RLS policies are configured for role-based access
4. Sample data for ball machines, promo codes, and leagues is included
5. All tables have proper indexes for performance

## Next Steps

After applying the migration:
1. Verify all tables were created in Supabase dashboard
2. Promote at least one user to 'owner' role manually
3. Test role-based access controls
4. Configure notification settings for your users
5. Add your club's ball machines and promo codes

## Support

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify foreign key constraints
3. Ensure RLS policies are enabled
4. Confirm auth.uid() is working properly
