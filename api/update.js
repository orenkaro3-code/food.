const { getAll, put, getOne, readBody, send, TABLES } = require("./_db");

const STATUSES = ["new", "cooking", "ready", "served", "cancelled"];

// POST /api/update {id, status}      → move one order along (times are kept per stage)
// POST /api/update {closeTable: 2}   → table is free again (its orders stay for the day's report)
module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "method" });
    const b = readBody(req);
    if (b.closeTable) {
      const t = Number(b.closeTable);
      if (!TABLES.includes(t)) return send(res, 400, { error: "שולחן לא קיים" });
      const list = (await getAll("orders")).filter(o => o.table === t && !o.tableClosed);
      await Promise.all(list.map(o => put("orders", { ...o, tableClosed: true, status: o.status === "served" || o.status === "cancelled" ? o.status : "served", updatedAt: Date.now() })));
      return send(res, 200, { closed: list.length });
    }
    if (!STATUSES.includes(b.status)) return send(res, 400, { error: "סטטוס לא תקין" });
    const o = await getOne("orders", String(b.id));
    if (!o) return send(res, 404, { error: "ההזמנה לא נמצאה" });
    o.status = b.status; o.updatedAt = Date.now();
    o.times = { ...(o.times || {}), [b.status]: o.updatedAt };
    await put("orders", o);
    send(res, 200, { order: o });
  } catch (e) { send(res, e.status || 500, { error: e.message }); }
};
