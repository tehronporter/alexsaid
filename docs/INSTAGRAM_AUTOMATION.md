# Archived Instagram auto-posting prototype

This prototype is deliberately outside the production application. Its route, renderer, caption helper, and cron example live in `experiments/instagram-automation/` as `.txt` or example files so neither Vercel project compiles, exposes, or schedules them. Revisit this only after Alex Said and Leila Said are released and the manual-versus-automated publishing decision has been made.

## What already works

- `experiments/instagram-automation/feed-route.example.tsx.txt` contains the prior server-rendered 1080×1080 card route.
- `experiments/instagram-automation/social-caption.example.ts.txt` contains the prior caption helper.
- `experiments/instagram-automation/cron-route.example.ts.txt` contains the protected Graph API publishing route.
- `experiments/instagram-automation/vercel.example.json` contains the prior schedule. It is not active from this directory.

## Setup steps

### 1. Email

Use a plus-alias of your existing Gmail rather than a bare personal address, e.g. `tehronporter+alexsaid@gmail.com`. Mail still lands in your normal inbox, but Instagram/Meta treat it as a distinct address. If a signup form rejects the `+`, use a dot-variant (`tehron.porter@gmail.com`) instead.

### 2. Instagram account

1. Sign up for a new IG account with that email.
2. Profile → Edit profile → account type/category → switch to **Professional account** → category **Creator** (or Business — either works for the Graph API; Creator fits a quote page).
3. Skip the contact-info/category-display prompts if you don't want a public phone/email on the profile.

### 3. Facebook Page

The Graph API only posts through an IG account linked to a Facebook Page — this is required even though you'll never post to the Page itself.

1. Go to `facebook.com/pages/create`, log in with your personal Facebook account (or create one with the same alias email if you'd rather not use your personal FB).
2. Name it "Alex Said" (or whatever you land on), pick any category (e.g. "Personal blog").
3. In the new Page's settings → **Linked accounts** (or Instagram tab), link the IG account from step 2.

### 4. Meta Developer app

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps), log in with the same personal Facebook account that admins the Page.
2. **Create App** → type **Business** → give it a name (e.g. "Alex Said Automation").
3. In the app dashboard, **Add Product** → **Instagram** (Instagram Graph API / "Instagram API setup with Facebook Login" — Meta renames this occasionally, look for the Instagram product tile).
4. Because this only ever posts to *your own* account, you don't need Meta's App Review: leave the app in **Development Mode**. You (as the account that created it) are automatically an admin/developer on it, which is enough to call the API against accounts you control.

### 5. Access token

1. Go to [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer), select your app from the dropdown.
2. **User or Page** → User Token. Under permissions, add: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`.
3. **Generate Access Token**, approve the prompt (grants access to the Page from step 3).
4. This token is short-lived (~1 hour) — exchange it for a long-lived one (~60 days). Find your app's **App ID** and **App Secret** under app dashboard → Settings → Basic, then run:

   ```bash
   curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```

   Save the `access_token` from the response — that's your long-lived **user** token.

5. Use the long-lived user token to get a **Page** access token (this is the one the app actually posts with, and it doesn't expire as long as the user token stays valid):

   ```bash
   curl "https://graph.facebook.com/v21.0/me/accounts?access_token=LONG_LIVED_USER_TOKEN"
   ```

   Find your Page in the response — copy its `id` and its `access_token`. That `access_token` is `IG_ACCESS_TOKEN`.

6. Get the IG business account ID from that same Page:

   ```bash
   curl "https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=PAGE_ACCESS_TOKEN"
   ```

   The `instagram_business_account.id` in the response is `IG_BUSINESS_ACCOUNT_ID`.

### 6. Vercel environment variables

In the Vercel project → Settings → Environment Variables (Production), set:

- `CRON_SECRET` — any random string, e.g. `openssl rand -hex 32`
- `IG_ACCESS_TOKEN` — the Page access token from step 5.5
- `IG_BUSINESS_ACCOUNT_ID` — from step 5.6

### 7. Deploy and verify

1. Redeploy so `vercel.json`'s cron entry registers — check Vercel project → Settings → Cron Jobs for `/api/cron/instagram-post`.
2. Trigger it once by hand to confirm a real post lands before trusting the schedule:

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/instagram-post
   ```

3. Check the linked IG account — the post should appear within seconds.

## Notes

- The image route requires the app to be deployed at a public URL — the Graph API fetches `image_url` itself, so `localhost` won't work.
- Page access tokens obtained this way don't have a hard expiry, but Meta can invalidate them (password change, permission revocation, app review changes). If the cron route starts returning `502`s, redo step 5.
- Nothing here removes a quote from rotation after it's posted; `dailyQuoteOrder` is a deterministic daily shuffle, so the Instagram feed and the in-app "quote of the day" always match. If duplicate-avoidance across the two ever matters, add a posted-date ledger — skip it until it's actually needed.
- Reels/video are out of scope here; this posts static square feed image cards, which the Content Publishing API supports directly without any video encoding step. If Reels get added later, that needs an actual video render, not just a taller image.
