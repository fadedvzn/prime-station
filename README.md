# Prime Station

Prime Station keeps the original 3D command-center dashboard and adds a protected backend for AI agents, approvals, scheduled drafts, and platform publishing.

## Included
- OpenAI / ChatGPT and Anthropic / Claude provider selection with automatic fallback when one provider key is unavailable.
- Five agent roles: Paul (marketing), Sam (sales), Matt (BTC watch; no trading), Peanut (clip planning), and Gus (Roblox development).
- Sequential agent collaboration and saved task history.
- Manual owner approval required before every publish action.
- Instagram Reels, TikTok video direct-post, YouTube video uploads, Discord webhook messages, and Roblox Open Cloud place publishing.
- OAuth tokens encrypted with AES-256-GCM in SQLite on a persistent Render disk.
- Scheduled work is opt-in and creates drafts only. It never auto-publishes.

## Deploy to Render
1. Keep the GitHub repository private.
2. In Render choose **New → Blueprint**, connect `fadedvzn/prime-station`, and select `render.yaml`.
3. Create the paid Starter web service with its 1 GB persistent disk. Render's free web services do not support this persistent-disk setup.
4. In the service's Environment page set:
   - `OWNER_PASSWORD`: a unique strong password for Prime Station.
   - `SESSION_SECRET`: at least 32 random characters.
   - `TOKEN_ENCRYPTION_KEY`: exactly 64 hexadecimal characters (32 random bytes).
   - `BASE_URL`: your deployed HTTPS Render URL, without a trailing slash.
   - At least one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`.
5. Save and deploy. Open the Render URL and sign in to Prime Control.
6. Add each platform's developer credentials to Render Environment, using the callback URLs below, then redeploy.

Generate secrets on your computer with:
```bash
openssl rand -hex 32
```
Run it twice: once for SESSION_SECRET and once for TOKEN_ENCRYPTION_KEY. Keep the encryption key in a password manager. Losing it makes stored platform tokens unreadable. Never paste secrets into chat or commit them to GitHub.

## OAuth callback URLs
Replace YOUR-RENDER-HOST with your actual Render hostname:
- Instagram: `https://YOUR-RENDER-HOST/api/oauth/instagram/callback`
- TikTok: `https://YOUR-RENDER-HOST/api/oauth/tiktok/callback`
- YouTube: `https://YOUR-RENDER-HOST/api/oauth/youtube/callback`
- Gmail: `https://YOUR-RENDER-HOST/api/oauth/gmail/callback`

The callback URL must match exactly in the provider developer console and the matching Render environment variable.

## Connect platforms
- **Instagram:** use a Business or Creator account. Create a Meta developer app, add Instagram API with Instagram Login, enable `instagram_business_basic` and `instagram_business_content_publishing`, and set the app ID, app secret, and redirect URI. Reels require publicly reachable HTTPS video media.
- **TikTok:** create a TikTok for Developers app, add Content Posting API, request `video.publish` (and `video.upload` if using draft upload), and complete TikTok's audit before expecting public direct posts. URL-pull publishing requires a verified media domain.
- **YouTube:** create a Google Cloud project, enable YouTube Data API v3, configure OAuth consent, create a Web application OAuth client, and add the callback URL as an authorized redirect URI. Upload privacy defaults to Private.
- **Gmail:** use the same Google Cloud OAuth client, enable the Gmail API, add the `gmail.send` scope, and register `https://YOUR-RENDER-HOST/api/oauth/gmail/callback`. Add `GMAIL_REDIRECT_URI` if you need to override the default callback. Prime Control then offers a Gmail connection and an owner-confirmed email form.
- **SMS / phone calls:** configure a Twilio account and phone number, then set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, and `DEXTOR_ALLOWED_PHONE` in Render. Store credentials only in Render Environment, never in chat or GitHub. The communications API only accepts the allowlisted destination and requires explicit confirmation for each send/call.
- **Web research:** set `TAVILY_API_KEY` in Render to enable sourced DEXTOR web research. In DEXTOR, start a request with `research:` (for example, `research: compare current short-form video trends for car detailing`). Without this key, ordinary AI chat still works but live sourced research is unavailable.
- **Discord:** create a channel webhook in Server Settings → Integrations → Webhooks. Add its full URL as `DISCORD_WEBHOOK_URL`. Treat it as a password.
- **Roblox:** create a Creator Dashboard Open Cloud API key with `universe-places` write permission for the target experience. Add the key, universe ID, and place ID. Publishing sends a compiled `.rbxl` or `.rbxlx` place file; it does not control an open Studio session.

## Important limits
- Run one Render instance only. SQLite and OAuth state are designed for one instance.
- Keep automation off until the account connections and draft approvals have been tested.
- Scheduled jobs create drafts only; a human must approve a task before publishing.
- Instagram/TikTok video media must be publicly accessible over HTTPS. TikTok additionally requires domain verification and app audit for public posting.
- Discord integration is outbound webhook messaging, not a full bot with inbound commands or moderation.
- Roblox publishing deploys a compiled place file; Gus can generate Luau and build instructions but cannot directly edit a live Roblox Studio session.
