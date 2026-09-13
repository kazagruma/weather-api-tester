CREATE TABLE summaries (
  id TEXT PRIMARY KEY,
  owner_key TEXT NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('short', 'bullets', 'detailed')),
  title TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  summary_date TEXT,
  tags TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_summaries_owner_created_at ON summaries (owner_key, created_at DESC);

CREATE INDEX idx_summaries_owner_summary_date ON summaries (owner_key, summary_date DESC);
