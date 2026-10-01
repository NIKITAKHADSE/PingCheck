# FlowVik Real Instagram Setup — Posts, Reels and Comment-to-DM

This build does not require Docker. Node.js runs the backend and automation processing locally.

## What this build does

When a connected Instagram Professional account receives a comment event from Meta, FlowVik can:

```text
Comment received
→ identify connected Instagram account
→ identify the FlowVik workspace
→ match active keyword automation
→ optional public reply
→ send one private details message using the Instagram comment ID
→ save contact + conversation + automation run
```

Meta's Private Replies functionality supports private replies to commenters on Instagram Professional content, including eligible ad-post comments. Real behavior still depends on your Meta app permissions, webhook delivery, connected assets and App Review status.

## 1. Instagram account requirement

The client Instagram account should be an Instagram Professional account:

```text
Business
or
Creator
```

For the Instagram API with Instagram Login approach, FlowVik does not require every account connection to first use the older Facebook Page-linked login flow.

## 2. Create a Meta Developer App

Create a Meta app and configure **Instagram API with Instagram Login**.

FlowVik defaults to these scopes:

```text
instagram_business_basic
instagram_business_manage_comments
instagram_business_manage_messages
```

The build defaults to:

```env
META_GRAPH_VERSION=v26.0
```

## 3. Create a public HTTPS URL for the Node backend

Meta cannot send webhooks to your computer's `localhost` from the internet.

A simple development option is Cloudflare Tunnel:

```powershell
cloudflared tunnel --url http://localhost:4000
```

It returns a public HTTPS URL similar to:

```text
https://example-random.trycloudflare.com
```

Keep the tunnel running while testing.

## 4. Configure `.env`

Example:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
APP_URL=https://YOUR-TUNNEL.trycloudflare.com
DEMO_MODE=false

TOKEN_ENCRYPTION_KEY=YOUR_GENERATED_KEY
SESSION_SECRET=YOUR_LONG_RANDOM_SESSION_SECRET

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_OPTIONAL

META_APP_ID=YOUR_NUMERIC_INSTAGRAM_APP_ID
META_APP_SECRET=YOUR_META_APP_SECRET
META_REDIRECT_URI=https://YOUR-TUNNEL.trycloudflare.com/api/integrations/meta/callback
META_VERIFY_TOKEN=YOUR_RANDOM_VERIFY_TOKEN
META_GRAPH_VERSION=v26.0
META_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages
META_WEBHOOK_FIELDS=comments,messages
```

Copy `META_APP_ID` from **Meta App Dashboard → Instagram → API setup → Instagram App ID**. It contains digits only. Do not paste the App Secret, a Google OAuth client ID, or another product's client ID into this field. A wrong product ID causes Instagram to display `Invalid platform app` before login.

Generate a token-encryption key:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Generate a session secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Generate a webhook verify token:

```powershell
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Never share `META_APP_SECRET`, `TOKEN_ENCRYPTION_KEY`, long-lived Instagram access tokens or your session secret publicly.

## 5. Configure Instagram Login redirect URL in Meta

Use exactly:

```text
https://YOUR-TUNNEL.trycloudflare.com/api/integrations/meta/callback
```

This must match `META_REDIRECT_URI`.

## 6. Configure Instagram webhook

Callback URL:

```text
https://YOUR-TUNNEL.trycloudflare.com/api/webhooks/instagram
```

Verify Token:

```text
The exact value of META_VERIFY_TOKEN
```

Subscribe to the Instagram webhook fields your app needs, including comments and messaging where available for your configuration.

## 7. Restart FlowVik

After editing `.env`, restart:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173/dashboard/integrations
```

The checklist should show:

```text
DEMO_MODE = false
Meta credentials = configured
Webhook URL = HTTPS
```

## 8. Connect a client Instagram account

Connection requests expire after 15 minutes and can be used only once. If a callback expires, is refreshed, or was opened before a server upgrade, start again with **Connect Instagram**. Reconnecting the same account preserves its local ID and existing automation targeting. An Instagram account can belong to only one workspace; disconnect it from that workspace before moving it.

Use **Check connection** on the account card to verify the saved token, Instagram identity, and the app's comments/messages subscription. **Retry webhooks** attempts to restore that account subscription and checks it again. These controls do not send comments or DMs. Access expiry is displayed on the card; reconnect to renew authorization before it expires.

A verified account is separate from public callback availability. Both the backend and its public HTTPS tunnel must remain running for OAuth callbacks and incoming webhooks. A restarted Cloudflare quick tunnel normally has a new URL: update `APP_URL` and `META_REDIRECT_URI`, restart the backend, and update the OAuth redirect and webhook callback in the Meta app dashboard to the same new origin. The saved Instagram token does not need replacing merely because a tunnel stopped.

The backend binds to `127.0.0.1` by default. The local frontend and a tunnel on this computer can reach it. Set `API_HOST` explicitly only when deployment requires another listening interface.

Click:

```text
Connect Instagram
```

The client completes Instagram Login and grants the requested permissions.

After callback, the **Connected Instagram IDs** section shows:

```text
@username
Instagram User ID
Account Type
Connected time
Webhook subscription status
```

You can connect additional client accounts and they appear as separate rows.

## 9. Create the real automation

Go to:

```text
Automations → Create Automation
```

Example:

```text
Instagram account:
@clientaccount

Comment source:
Posts, Reels & eligible ad comments

Keyword:
PRICE

Match:
Contains

Public reply:
Sent you a DM! 🚀

Private DM:
Hey {{first_name}} 👋
Thanks for commenting!
Here are the details you requested.
```

Save and Publish.

For the most reliable general setup, use **Posts, Reels & eligible ad comments** instead of an ads-only filter. FlowVik will react whenever Meta delivers the comment webhook for the connected account.

## 10. Real test

From a different Instagram user account, comment:

```text
PRICE
```

on a Reel/post belonging to the connected client account.

Expected pipeline:

```text
Instagram comment
→ Meta sends webhook
→ FlowVik identifies Instagram User ID
→ active automation matches PRICE
→ private details reply is sent
→ lead appears in Contacts
→ conversation appears in Inbox
→ run/activity appears in FlowVik
```

## 11. Ads comments

The private-reply capability can apply to eligible Instagram ad-post comments. FlowVik's `ALL` comment scope therefore does not exclude ads.

Important: advertising workflows can involve additional Meta Business/Ad Account/Marketing API permissions and asset relationships. If an ad comment is not delivered through the configured Instagram webhook, FlowVik cannot invent the comment event. In that case, add the required Marketing API ad-discovery/comment architecture for the specific ad account setup.

## 12. Meta App Review

Development/testing access is different from a commercial SaaS connecting arbitrary client accounts. Before allowing all customers to connect, request the necessary Meta App Review / Advanced Access permissions for the Instagram capabilities your app uses.
