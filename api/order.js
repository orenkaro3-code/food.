const { put, getOne, readBody, send, newId, TABLES, getSettings, nextNum } = require("./_db");

// POST /api/order {table, name, items:[{id,n,q,c}], note}  → new order for the kitchen
// GET  /api/order?ids=a,b  → status of a diner's own orders
module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const ids = String(req.query.ids || "").split(",").filter(Boolean).slice(0, 30);
      const list = (await Promise.all(ids.map(id => getOne("orders", id)))).filter(Boolean);
      return send(res, 200, { orders: list });
    }
    if (req.method !== "POST") return send(res, 405, { error: "method" });
    const b = readBody(req);
    const settings = await getSettings();
    if (!settings.open) return send(res, 400, { error: "המטבח סגור כרגע ולא מקבל הזמנות." });
    const table = Number(b.table);
    if (!TABLES.includes(table)) return send(res, 400, { error: "שולחן לא מוכר. סרקו שוב את הברקוד שעל השולחן." });
    const name = String(b.name || "").trim().replace(/\s+/g, " ").slice(0, 30);
    if (name.length < 2) return send(res, 400, { error: "כתבו את השם שלכם כדי שנדע למי להגיש." });
    const items = (Array.isArray(b.items) ? b.items : [])
      .map(i => ({ id: String(i.id).slice(0, 20), n: String(i.n || "").trim().slice(0, 60), q: Math.min(20, Math.max(1, parseInt(i.q) || 1)), c: !!i.c }))
      .filter(i => i.n).slice(0, 40);
    if (!items.length) return send(res, 400, { error: "ההזמנה ריקה." });
    const out = items.filter(i => settings.soldOut.includes(i.id));
    if (out.length) return send(res, 400, { error: `נגמר לנו: ${out.map(i => i.n).join(", ")}. הסירו מההזמנה ונסו שוב.` });
    const now = Date.now();
    const order = {
      id: newId(), num: await nextNum(), table, name, items,
      note: String(b.note || "").slice(0, 200), status: "new", createdAt: now, updatedAt: now, times: { new: now },
      source: b.source === "pos" ? "pos" : "table",
    };
    await put("orders", order);
    send(res, 200, { order });
  } catch (e) { send(res, e.status || 500, { error: e.message }); }
};
