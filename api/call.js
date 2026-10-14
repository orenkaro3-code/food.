const { getAll, put, getOne, readBody, send, newId, TABLES } = require("./_db");

// POST /api/call {table, name, reason} → a diner calls the waiter
// POST /api/call {id, done:true}       → waiter is on the way
module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "method" });
    const b = readBody(req);
    if (b.done) {
      const c = await getOne("calls", String(b.id));
      if (c) await put("calls", { ...c, done: true });
      return send(res, 200, { ok: true });
    }
    const table = Number(b.table);
    if (!TABLES.includes(table)) return send(res, 400, { error: "שולחן לא מוכר" });
    const open = (await getAll("calls")).find(c => c.table === table && !c.done);
    if (open) return send(res, 200, { call: open, already: true });
    const call = { id: newId(), table, name: String(b.name || "").slice(0, 30), reason: String(b.reason || "").slice(0, 40), createdAt: Date.now(), done: false };
    await put("calls", call);
    send(res, 200, { call });
  } catch (e) { send(res, e.status || 500, { error: e.message }); }
};
