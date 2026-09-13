// ことのは要約の保存履歴。実際のスキーマ変更は drizzle/ の移行ファイルで管理します。
export const summariesSchema = {
  table: "summaries",
  fields: ["id", "owner_key", "input_text", "output_text", "summary_type", "title", "category", "summary_date", "tags", "created_at", "updated_at"],
} as const;
