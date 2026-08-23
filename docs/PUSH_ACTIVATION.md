# Scheduled Web Push activation

Scheduled delivery is deliberately disabled in the initial build. The PWA service worker, exact-quote payload, click routing, settings copy, and server boundaries already exist.

## Required configuration

1. Create the Supabase project and a private `push_subscriptions` table containing: `id`, `endpoint`, `p256dh`, `auth`, `timezone`, `local_time`, `topics`, `active`, `manage_token_hash`, `last_sent_local_date`, `created_at`, and `updated_at`.
2. Keep Row Level Security enabled with no anonymous table policies. Read and write only from server routes using `SUPABASE_SERVICE_ROLE_KEY`.
3. Implement `PushSubscriptionRepository` using the table. Return an opaque management token once, store only its hash, and require it for update/delete operations.
4. Generate VAPID keys and configure all environment variables listed in `.env.example`.
5. Replace the `501` seams in the subscription and cron routes with the Supabase repository and standards-based Web Push sender.
6. Add a protected Vercel Cron for `/api/cron/daily-quotes` every five minutes. Query subscriptions due in their IANA timezone, skip rows already sent for the local date, and deactivate endpoints that return 404 or 410.
7. Set `NEXT_PUBLIC_PUSH_ENABLED=true` only after real-device delivery and exact `/q/[id]` notification-click routing pass on an installed iOS Home Screen app.

Never expose subscription endpoints or VAPID private keys to analytics or browser-readable logs.
