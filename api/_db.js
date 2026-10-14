// Upstash Redis over REST — works with the Vercel "Upstash for Redis" integration env names.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(...cmd) {
  if (!URL_ || !TOKEN) {
    const e = new Error("מסד הנתונים לא מחובר. ב-Vercel: Storage ← Upstash for Redis ← Connect, ואז Redeploy.");
    e.status = 503;
    throw e;
  }
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

async function getAll(key) {
  const flat = (await redis("HGETALL", key)) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    try { out.push(JSON.parse(flat[i + 1])); } catch {}
  }
  return out;
}
const put = (key, obj) => redis("HSET", key, obj.id, JSON.stringify(obj));
async function getOne(key, id) {
  const v = await redis("HGET", key, id);
  return v ? JSON.parse(v) : null;
}
const del = (key, ...ids) => (ids.length ? redis("HDEL", key, ...ids) : null);

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}
function send(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(data);
}
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const TABLES = [1, 2, 3];

const DEFAULT_SETTINGS = { open: true, soldOut: [] };
async function getSettings() {
  const v = await redis("GET", "settings");
  try { return { ...DEFAULT_SETTINGS, ...(v ? JSON.parse(v) : {}) }; } catch { return { ...DEFAULT_SETTINGS }; }
}
const saveSettings = s => redis("SET", "settings", JSON.stringify(s));

// Running order number for the day (1, 2, 3...), reset when the day is closed
const nextNum = () => redis("INCR", "ordernum");

module.exports = { redis, getAll, put, getOne, del, readBody, send, newId, TABLES, getSettings, saveSettings, nextNum };
