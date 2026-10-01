-- FlowVik / ManyChat-like Neon PostgreSQL storage
-- Paste this in the Neon SQL Editor if you want to create the table manually.
CREATE TABLE IF NOT EXISTS app_records (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  workspace_id TEXT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection, id)
);

CREATE INDEX IF NOT EXISTS idx_app_records_collection
  ON app_records(collection);
CREATE INDEX IF NOT EXISTS idx_app_records_workspace
  ON app_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_app_records_collection_workspace
  ON app_records(collection, workspace_id);
