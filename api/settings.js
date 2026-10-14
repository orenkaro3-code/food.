const { readBody, send, getSettings, saveSettings } = require("./_db");

// GET  /api/settings → {open, soldOut}
// POST /api/settings {open?, soldOut?} → update from the panel
module.exports = async (req, res) => {
  try {
    const s = await getSettings();
    if (req.method === "GET") return send(res, 200, { settings: s });
    if (req.method !== "POST") return send(res, 405, { error: "method" });
    const b = readBody(req);
    if (typeof b.open === "boolean") s.open = b.open;
    if (Array.isArray(b.soldOut)) s.soldOut = b.soldOut.map(String).slice(0, 100);
    await saveSettings(s);
    send(res, 200, { settings: s });
  } catch (e) { send(res, e.status || 500, { error: e.message }); }
};
