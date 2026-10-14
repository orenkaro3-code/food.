// Shared menu, API helpers and alert sound for all pages.
// Menu comes from the server (/api/menu) so the panel can add and edit products.
window.MENU = [];   // [{id, name, sub, items:[...]}]
window.ITEMS = {};  // id → item
window.loadMenu = async () => {
  const { menu } = await api("/api/menu");
  window.ITEMS = {};
  menu.items.forEach(i => { ITEMS[i.id] = i; });
  window.MENU = menu.cats.map(c => ({ ...c, items: menu.items.filter(i => i.cat === c.id).sort((a, b) => a.sku - b.sku) }));
  return menu;
};
window.imgUrl = i => i && i.img ? `/api/img?id=${encodeURIComponent(i.id)}&v=${i.v || 1}` : "";
// Elegant photo-less tile: the dish's first letter on a warm gradient
window.monogram = n => `<div class="mono" aria-hidden="true"><span>${esc(String(n || "").trim().charAt(0))}</span></div>`;
window.TABLES = [1, 2, 3];

window.STATUS = {
  new: { t: "חדשה", c: "var(--copper)" },
  cooking: { t: "בהכנה", c: "var(--accent)" },
  ready: { t: "מוכנה", c: "var(--ok)" },
  served: { t: "הוגשה לשולחן", c: "var(--muted)" },
  cancelled: { t: "בוטלה", c: "var(--danger)" },
};

window.api = async (path, body) => {
  let r;
  try {
    r = await fetch(path, body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : { cache: "no-store" });
  } catch { throw new Error("אין חיבור לאינטרנט. נסו שוב."); }
  const j = await r.json().catch(() => ({ error: "השרת לא ענה כמו שצריך" }));
  if (!r.ok || j.error) throw new Error(j.error || "שגיאה");
  return j;
};

window.esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
window.ago = ms => { const m = Math.floor(ms / 60000); return m < 1 ? "עכשיו" : m < 60 ? `לפני ${m} דק׳` : `לפני ${Math.floor(m / 60)} שע׳ ${m % 60} דק׳`; };
window.hhmm = t => new Date(t).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
window.ddmm = t => new Date(t).toLocaleDateString("he-IL");
window.mins = ms => Math.max(0, Math.floor(ms / 60000));

// Alert sound (browsers allow sound only after the first tap on the page)
let actx = null;
window.unlockSound = () => {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch {}
};
window.beep = (kind = "order") => {
  if (!actx) return;
  const notes = kind === "call" ? [988, 740, 988, 740] : kind === "ready" ? [660, 880, 1320] : [880, 1175, 1568];
  notes.forEach((f, i) => {
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.18;
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.17);
  });
  try { navigator.vibrate && navigator.vibrate(kind === "call" ? [200, 100, 200, 100, 200] : [150, 80, 150]); } catch {}
};

// Order invoice (internal document: food is free, so the total is always ₪0)
window.showReceipt = o => {
  const n = o.items.reduce((a, i) => a + i.q, 0);
  const el = document.createElement("div");
  el.className = "rc-scrim";
  el.innerHTML = `<div class="receipt" role="dialog" aria-label="חשבונית הזמנה">
    <h2>האוכל של אורן</h2><div class="sub">חשבונית הזמנה · אוכלים במקום</div><hr>
    <div class="kv"><span>מספר הזמנה</span><b>${o.num}</b></div>
    <div class="kv"><span>שם המזמין</span><b>${esc(o.name || "")}</b></div>
    <div class="kv"><span>שולחן</span><b>${o.table}</b></div>
    <div class="kv"><span>תאריך</span><span>${ddmm(o.createdAt)} · ${hhmm(o.createdAt)}</span></div><hr>
    ${o.items.map(i => `<div class="it"><b>${i.q}×</b><span>${esc(i.n)}${i.c ? " (מחוץ לתפריט)" : ""}</span><span>₪0.00</span></div>`).join("")}
    ${o.note ? `<hr><div style="font-size:14px">הערה: ${esc(o.note)}</div>` : ""}<hr>
    <div class="kv"><span>מספר פריטים</span><span>${n}</span></div>
    <div class="tot"><span>סה״כ לתשלום</span><span>₪0.00</span></div>
    <div class="thanks">על חשבון הבית. בתיאבון!</div>
    <div class="sub" style="margin-top:10px;font-size:11px">מסמך פנימי לאישור הזמנה · אינו חשבונית מס</div>
    <div class="rc-actions"><button type="button" class="alt" data-rc="print">הדפסה</button><button type="button" data-rc="close">סגירה</button></div>
  </div>`;
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-rc]");
    if (e.target === el || (b && b.dataset.rc === "close")) el.remove();
    else if (b) window.print();
  });
  document.body.appendChild(el);
};

// Staff devices: once a phone opened the panel, scanning a table QR opens that table in the panel.
window.isStaff = () => { try { return localStorage.getItem("staff") === "1"; } catch { return false; } };
window.setStaff = v => { try { v ? localStorage.setItem("staff", "1") : localStorage.removeItem("staff"); } catch {} };
