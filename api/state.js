const { getAll, del, send, getSettings } = require("./_db");

// GET /api/state → today's orders (until the day is closed), open waiter calls, settings
module.exports = async (req, res) => {
  try {
    const now = Date.now(), OLD = 3 * 864e5;
    const [orders, calls, settings] = await Promise.all([getAll("orders"), getAll("calls"), getSettings()]);
    const oldO = orders.filter(o => now - o.createdAt > OLD).map(o => o.id);
    const oldC = calls.filter(c => c.done || now - c.createdAt > 864e5).map(c => c.id);
    await Promise.all([del("orders", ...oldO), del("calls", ...oldC)]);
    send(res, 200, {
      now, settings,
      orders: orders.filter(o => !oldO.includes(o.id)).sort((a, b) => a.createdAt - b.createdAt),
      calls: calls.filter(c => !oldC.includes(c.id)).sort((a, b) => a.createdAt - b.createdAt),
    });
  } catch (e) { send(res, e.status || 500, { error: e.message }); }
};
