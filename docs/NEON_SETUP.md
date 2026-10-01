# Neon PostgreSQL Setup

FlowVik now uses Neon PostgreSQL instead of the local `server/data/db.json` database.

## 1. Create the Neon database

1. Create a Neon project.
2. Open **Connect** in Neon.
3. Copy the pooled PostgreSQL connection string.
4. Put it in the root `.env` file:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
DB_POOL_MAX=10
```

Do not put `DATABASE_URL` in the React/Vite client environment.

## 2. Install packages

```bash
npm install
```

The backend uses the `pg` package and creates the required Neon table and indexes automatically on first database access.

If you prefer to create the database structure manually, run `server/neon-schema.sql` in the Neon SQL Editor.

## 3. Seed the demo workspace

```bash
npm run setup
```

Demo login after setup:

```text
demo@flowvik.app
demo12345
```

## 4. Migrate the old local JSON data (optional)

If `server/data/db.json` contains data you want to keep:

```bash
npm run db:migrate
```

You can also pass a different JSON file path:

```bash
npm run db:migrate -w server -- "C:\path\to\db.json"
```

The migration upserts records by their existing IDs, so it can be rerun safely for the same dataset.

## 5. Start the app

```bash
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

## Storage model

The current application API still works with the same collections (`users`, `contacts`, `conversations`, `messages`, `automations`, etc.). The persistence adapter stores each entity as a PostgreSQL row in `app_records`, with `workspace_id` indexed for multi-tenant access. This keeps the existing ManyChat-style application behavior while moving persistence to Neon.
