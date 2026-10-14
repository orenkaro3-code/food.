const { getAll, put, del, redis, readBody, send, newId } = require("./_db");

// GET  /api/day → past day summaries (newest first)
// POST /api/day {close:true} → end of day: save a summary, clear today's orders and calls, reset numbering
module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const days = (await getAll("days")).sort((a, b) => b.closedAt - a.closedAt).slice(0, 60);
      return send(res, 200, { days });
    }
    if (req.method !== "POST") return send(res, 405, { error: "method" });
    const b = readBody(req);
    if (!b.close) return send(res, 400, { error: "חסרה פעולה" });
    const [orders, calls] = await Promise.all([getAll("orders"), getAll("calls")]);
    const valid = orders.filter(o => o.status !== "cancelled");
    const items = {};
    valid.forEach(o => o.items.forEach(i => { items[i.n] = (items[i.n] || 0) + i.q; }));
    const prep = valid.filter(o => o.times && o.times.ready).map(o => o.times.ready - o.createdAt);
    const now = Date.now();
    const day = {
      id: newId(), closedAt: now,
      openedAt: orders.length ? Math.min(...orders.map(o => o.createdAt)) : now,
      orders: valid.length, cancelled: orders.length - valid.length,
      itemsCount: Object.values(items).reduce((a, q) => a + q, 0),
      guests: [...new Set(valid.map(o => o.table + ":" + (o.name || "")))].length,
      avgPrepMin: prep.length ? Math.round(prep.reduce((a, x) => a + x, 0) / prep.length / 60000) : null,
      top: Object.entries(items).sort((a, b) => b[1] - a[1]).map(([n, q]) => ({ n, q })),
      byTable: [1, 2, 3].map(t => ({ t, orders: valid.filter(o => o.table === t).length })),
      list: valid.map(o => ({ num: o.num, table: o.table, name: o.name, createdAt: o.createdAt, items: o.items, note: o.note })),
    };
    await put("days", day);
    await Promise.all([del("orders", ...orders.map(o => o.id)), del("calls", ...calls.map(c => c.id)), redis("DEL", "ordernum")]);
    send(res, 200, { day });
  } catch (e) { send(res, e.status || 500, { error: e.message }); }
};
