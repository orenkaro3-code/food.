const sharp = require("sharp");
const { redis, send, getMenu, saveMenu } = require("./_db");

// One-time import of the AI dish photos (generated with Gemini via Figma).
// GET /api/import → downloads each photo, shrinks it to a light JPEG and keeps it in the database.
const SOURCES = {
  fpita: "https://www.figma.com/api/mcp/asset/03bcfdb8-3d2e-49a9-8f1e-b132373eba70.png",
  egg: "https://www.figma.com/api/mcp/asset/1d071ec0-ad6a-4810-8edd-b2ed2e9f0822.png",
  tuna: "https://www.figma.com/api/mcp/asset/e8ff9917-97b5-44b7-8c7f-719db6f79007.png",
  cream: "https://www.figma.com/api/mcp/asset/582dc136-40e4-4e10-b7c6-cbc80629ae61.png",
  rosa: "https://www.figma.com/api/mcp/asset/2faf7519-eac5-46ec-8798-011030e17fba.png",
  omelet: "https://www.figma.com/api/mcp/asset/7ca7dc58-5b82-4615-8468-cb1099a95b39.png",
  cigars: "https://www.figma.com/api/mcp/asset/c96e8a0b-9425-49d2-9f58-01b2c654c8d5.png",
  fplate: "https://www.figma.com/api/mcp/asset/a7b34df5-3b1b-46be-a8f3-1d3c8f1f07d5.png",
  fonly: "https://www.figma.com/api/mcp/asset/6d9a211c-2664-4d12-96f7-e2493aad7a46.png",
  mango: "https://www.figma.com/api/mcp/asset/0ffe9186-7e27-462a-8d0a-12b536d18f60.png",
};

module.exports = async (req, res) => {
  try {
    const menu = await getMenu();
    const done = [], skipped = [], failed = [];
    // GET /api/import?id=<product id>&url=<figma image url> → set one product's photo
    let sources = SOURCES;
    if (req.query.id && req.query.url) {
      const u = String(req.query.url);
      if (!/^https:\/\/(www\.)?figma\.com\/api\/mcp\/asset\//.test(u)) return send(res, 400, { error: "only Figma image links" });
      sources = { [String(req.query.id)]: u };
      req.query.force = "1";
    }
    for (const [id, url] of Object.entries(sources)) {
      const item = menu.items.find(i => i.id === id);
      if (!item) { skipped.push(id); continue; }
      if (item.img && !req.query.force) { skipped.push(id); continue; }
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error("HTTP " + r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        const jpg = await sharp(buf).resize({ width: 960, withoutEnlargement: true }).jpeg({ quality: 76, mozjpeg: true }).toBuffer();
        await redis("HSET", "imgs", id, JSON.stringify({ type: "image/jpeg", data: jpg.toString("base64") }));
        item.img = true; item.v = Date.now();
        done.push(id + ":" + Math.round(jpg.length / 1024) + "KB");
      } catch (e) { failed.push(id + ":" + e.message); }
    }
    await saveMenu(menu);
    send(res, 200, { done, skipped, failed });
  } catch (e) { send(res, e.status || 500, { error: e.message }); }
};
