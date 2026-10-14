const { redis, readBody, send, getMenu, saveMenu } = require("./_db");

// GET  /api/menu → {menu}
// POST /api/menu {action:"save", item:{id?, n, d, cat, sku?, star?, tag?}, image?: "data:image/jpeg;base64,..."}
// POST /api/menu {action:"delete", id}
module.exports = async (req, res) => {
  try {
    const menu = await getMenu();
    if (req.method === "GET") { res.setHeader("Cache-Control", "no-store"); return send(res, 200, { menu }); }
    if (req.method !== "POST") return send(res, 405, { error: "method" });
    const b = readBody(req);
    if (b.action === "delete") {
      menu.items = menu.items.filter(i => i.id !== String(b.id));
      await saveMenu(menu); await redis("HDEL", "imgs", String(b.id));
      return send(res, 200, { menu });
    }
    if (b.action !== "save" || !b.item) return send(res, 400, { error: "חסרה פעולה" });
    const it = b.item;
    const n = String(it.n || "").trim().slice(0, 50);
    if (n.length < 2) return send(res, 400, { error: "כתבו שם למוצר." });
    const cat = menu.cats.find(c => c.id === it.cat) ? it.cat : menu.cats[0].id;
    let item = menu.items.find(i => i.id === it.id);
    const sku = parseInt(it.sku);
    if (sku && menu.items.some(i => i.sku === sku && i.id !== it.id)) return send(res, 400, { error: `המספר הסידורי ${sku} כבר תפוס.` });
    if (!item) {
      const catSkus = menu.items.filter(i => i.cat === cat).map(i => i.sku);
      const base = (menu.cats.findIndex(c => c.id === cat) + 1) * 100;
      item = { id: "p" + Date.now().toString(36), sku: sku || Math.max(base, ...catSkus) + 1 };
      menu.items.push(item);
    } else if (sku) item.sku = sku;
    Object.assign(item, { n, d: String(it.d || "").slice(0, 120), cat, star: !!it.star, tag: String(it.tag || "").slice(0, 20) });
    if (b.image) {
      const m = String(b.image).match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
      if (!m) return send(res, 400, { error: "התמונה לא בפורמט נתמך." });
      if (m[2].length > 700000) return send(res, 400, { error: "התמונה גדולה מדי." });
      await redis("HSET", "imgs", item.id, JSON.stringify({ type: "image/" + m[1], data: m[2] }));
      item.img = true; item.v = Date.now();
    }
    if (b.removeImage) { await redis("HDEL", "imgs", item.id); item.img = false; }
    await saveMenu(menu);
    send(res, 200, { menu, item });
  } catch (e) { send(res, e.status || 500, { error: e.message }); }
};
