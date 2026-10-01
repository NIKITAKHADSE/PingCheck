# FlowVik v5 — ManyChat-style Automation SaaS with Neon

FlowVik is an Instagram-first automation SaaS starter for connecting Instagram Professional accounts and creating comment-to-DM workflows.

## Stack

- Frontend: React 18 + Vite
- Routing: React Router v6
- Workflow canvas: React Flow / `@xyflow/react`
- Backend: Node.js + Express
- Database: Neon PostgreSQL
- Authentication: local email/password + Google Identity Services
- Instagram: Meta Instagram API with Instagram Login architecture
- Docker: not used
- Python/Django: not used
- PostgreSQL: Neon managed PostgreSQL

## Quick start on Windows

```powershell
.\SETUP_WINDOWS.bat
```

Wait for `SETUP COMPLETE`, then:

```powershell
.\START_FLOWVIK.bat
```

Open:

```text
http://localhost:5173/login
```

Demo credentials:

```text
demo@flowvik.app
demo12345
```

The setup script installs dependencies, checks backend JavaScript, builds the React frontend, creates `.env`, and seeds demo data into Neon after `DATABASE_URL` is configured.

## Main routes

- `/dashboard`
- `/dashboard/automations`
- `/dashboard/automations/new`
- `/dashboard/integrations`
- `/dashboard/inbox`
- `/dashboard/contacts`
- `/dashboard/templates`
- `/dashboard/campaigns`
- `/dashboard/analytics`
- `/dashboard/ai`
- `/dashboard/knowledge`
- `/dashboard/team`
- `/dashboard/settings`

## Google authentication

Set `GOOGLE_CLIENT_ID` in `.env` after creating a Web Application OAuth client in Google Cloud. See `docs/GOOGLE_SIGNUP_SETUP.md`.

## Instagram connection model

A signed-in FlowVik user owns a workspace. Each workspace can store multiple connected Instagram Professional accounts. The Integrations page shows each connected account with:

- Instagram username
- Instagram User ID
- account type
- connected date
- webhook subscription status

Automations can target any connected account or a specific connected account.

## Comment-to-DM flow

```text
Instagram comment
→ Meta webhook
→ FlowVik Node API
→ identify connected Instagram account/workspace
→ create/update contact
→ find the first active matching automation
→ optional public comment reply
→ private reply using the comment ID
→ save automation run, conversation and activity
```

Only the first matching automation is executed for a comment because Instagram private replies are intended as a single private reply per comment.

## Ads

FlowVik handles a comment webhook the same way whether it comes from organic content or an eligible Instagram ad-post comment: once Meta delivers a valid comment event for a connected Instagram Professional account, the matching automation can send the private details reply.

Ad discovery and some non-organic/Marketing API workflows may require additional Meta business assets, permissions and App Review beyond the basic Instagram Login comment/messaging setup.

## Neon database

FlowVik now persists application data in Neon PostgreSQL. Configure `DATABASE_URL` in the root `.env` before running setup. See `docs/NEON_SETUP.md` for database creation, migration from the old JSON database, and startup steps.

For larger production deployments, also add distributed rate limiting, background queues/retries, observability, backups, and robust token lifecycle management.

## Dashboard AI chat

The Overview and AI Assistant pages include an AI chat assistant for workspace metrics, automation ideas, and reply copy. Set `OPENAI_API_KEY` in the root `.env` and restart the backend. Optionally set `OPENAI_MODEL` (default: `gpt-4.1-mini`) to a Responses API model available to your OpenAI project. Keep the key server-side; never use a `VITE_` prefix.

The chat sends the question, up to 10 recent messages, workspace counts, and up to 30 automation summaries to OpenAI. Contact details, inbox messages, integration tokens, and knowledge sources are excluded. Chat history is held in page memory. The assistant cannot publish automations or send DMs. The AI Assistant page also keeps the existing local template generator under Quick Automation Draft.

Requests require authentication and are limited to one in-flight request and 10 requests per minute per workspace per server process. The integration uses the [OpenAI Responses API](https://developers.openai.com/api/docs/quickstart) with response storage disabled. Live answers require a valid API key and available API quota.
