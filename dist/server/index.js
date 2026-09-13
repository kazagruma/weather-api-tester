const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const ownerFrom = (request) => {
  const owner = request.headers.get("X-Owner-Key") || "";
  return /^[a-f0-9-]{36}$/i.test(owner) ? owner : null;
};

const clean = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit) : "";

async function listSummaries(request, env) {
  const owner = ownerFrom(request);
  if (!owner) return json({ error: "保存場所を確認できませんでした。ページを再読み込みしてください。" }, 401);
  const url = new URL(request.url);
  const query = clean(url.searchParams.get("q"), 120);
  const requestedSort = url.searchParams.get("sort");
  const order = { newest: "created_at DESC", oldest: "created_at ASC", date_desc: "summary_date DESC, created_at DESC", date_asc: "summary_date ASC, created_at DESC" }[requestedSort] || "created_at DESC";
  const like = `%${query.replace(/[%_\\]/g, "\\$&")}%`;
  const sql = `SELECT id, input_text, output_text, summary_type, title, category, summary_date, tags, created_at FROM summaries WHERE owner_key = ? AND (? = '' OR input_text LIKE ? ESCAPE '\\' OR output_text LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\') ORDER BY ${order} LIMIT 100`;
  const rows = await env.DB.prepare(sql).bind(owner, query, like, like, like, like, like).all();
  return json({ items: rows.results || [] });
}

async function createSummary(request, env) {
  const owner = ownerFrom(request);
  if (!owner) return json({ error: "保存場所を確認できませんでした。ページを再読み込みしてください。" }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: "保存内容を読み取れませんでした。" }, 400); }
  const input = clean(data.input_text, 30000), output = clean(data.output_text, 30000), type = clean(data.summary_type, 20);
  if (!input || !output || !["short", "bullets", "detailed"].includes(type)) return json({ error: "保存する要約の内容を確認してください。" }, 400);
  const id = crypto.randomUUID(), now = new Date().toISOString(), title = clean(data.title, 160), category = clean(data.category, 80), date = clean(data.summary_date, 10), tags = clean(data.tags, 240);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "日付の形式を確認してください。" }, 400);
  await env.DB.prepare("INSERT INTO summaries (id, owner_key, input_text, output_text, summary_type, title, category, summary_date, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, owner, input, output, type, title, category, date || null, tags, now, now).run();
  return json({ id, created_at: now }, 201);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    try {
      if (path === "/api/summaries" && request.method === "GET") return await listSummaries(request, env);
      if (path === "/api/summaries" && request.method === "POST") return await createSummary(request, env);
      if (path.startsWith("/api/")) return json({ error: "見つかりませんでした。" }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return json({ error: "保存した要約を処理できませんでした。時間をおいて再度お試しください。" }, 500);
    }
  }
};
