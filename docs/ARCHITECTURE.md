# FlowVik v4 Architecture

```text
React + Vite (5173)
        |
        | Bearer session token
        v
Node.js + Express (4000)
        |
        +-- Neon PostgreSQL persistence
        |
        +-- Google Identity token verification
        |
        +-- Instagram OAuth callback
        |
        +-- Instagram webhook endpoint
        |
        +-- Comment automation engine
```

## Multi-user workspace model

```text
User
  -> Workspace
      -> Connected Instagram Accounts
      -> Automations
      -> Contacts
      -> Conversations
      -> Campaigns
      -> Knowledge Sources
      -> Team Members
```

An Instagram OAuth state is signed and contains the workspace ID. This lets the callback attach the connected Instagram account to the correct signed-in FlowVik workspace.

## Automation matching

Automations may be scoped by:

- connected Instagram account
- comment source (`ALL`, `ORGANIC`, `ADS` when detectable)
- optional media ID
- keyword
- exact/contains match

The engine executes only the first matching automation for a comment to avoid attempting multiple private replies against the same Instagram comment.

## Neon PostgreSQL persistence (v5)

The v5 backend replaces LowDB with Neon PostgreSQL. Existing application services still call `readDb()` and `mutate()`, but `server/src/db.js` now persists records to the `app_records` table in Neon. Each row contains a collection name, entity ID, indexed workspace ID, and JSONB payload. Writes are diffed and wrapped in a PostgreSQL transaction, so unchanged records are not rewritten.

This compatibility layer lets the current ManyChat-style modules (contacts, inbox, Instagram integrations, automation builder/runs, campaigns, team and workspace data) keep their current behavior while using managed PostgreSQL. Future high-scale work can progressively move individual collections to fully normalized tables without requiring an all-at-once frontend rewrite.
