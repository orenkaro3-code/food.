const { redis } = require("./_db");

// GET /api/img?id=egg&v=123 → product photo (cached by the CDN; v changes when the photo changes)
module.exports = async (req, res) => {
  try {
    const v = await redis("HGET", "imgs", String(req.query.id || ""));
    if (!v) { res.status(404).end("no image"); return; }
    const { type, data } = JSON.parse(v);
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=31536000, immutable");
    res.status(200).send(Buffer.from(data, "base64"));
  } catch (e) { res.status(500).end(e.message); }
};
