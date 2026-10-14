// Starting menu. After the first save from the panel, the menu lives in the database.
module.exports = {
  cats: [
    { id: "sand", name: "כריכים", sub: "על לחם טרי" },
    { id: "pasta", name: "פסטות", sub: "מהסיר לצלחת" },
    { id: "eggs", name: "ביצים", sub: "על המחבת" },
    { id: "falafel", name: "פלאפל וסיגרים", sub: "מהטיגון" },
    { id: "cold", name: "שתייה קרה", sub: "מהמקרר" },
    { id: "hot", name: "שתייה חמה", sub: "מהמכונה" },
  ],
  items: [
    { id: "egg", sku: 101, cat: "sand", n: "כריך ביצה אלפרדו", d: "ביצה, רוטב אלפרדו וחמאה על לחם טרי", star: true },
    { id: "tuna", sku: 102, cat: "sand", n: "כריך טונה אבוקדו", d: "טונה, אבוקדו וחמאה על לחם טרי", star: true },
    { id: "cream", sku: 201, cat: "pasta", n: "פסטה שמנת", d: "ברוטב שמנת קרמי" },
    { id: "rosa", sku: 202, cat: "pasta", n: "פסטה רוזה", d: "ברוטב שמנת ועגבניות", star: true },
    { id: "omelet", sku: 301, cat: "eggs", n: "חביתה / הומלט", d: "חביתה טרייה מהמחבת" },
    { id: "cigars", sku: 401, cat: "falafel", n: "סיגרים", d: "סיגרים פריכים מהטיגון" },
    { id: "fplate", sku: 402, cat: "falafel", n: "מנה פלאפל", d: "מנת פלאפל מלאה עם חומוס וסלט" },
    { id: "fpita", sku: 403, cat: "falafel", n: "פיתה פלאפל", d: "כדורי פלאפל בפיתה חמה", star: true },
    { id: "fonly", sku: 404, cat: "falafel", n: "פלאפל בלבד", d: "כדורי פלאפל עם חומוס בצד" },
    { id: "mango", sku: 501, cat: "cold", n: "מים בטעם מנגו", d: "" },
    { id: "grape", sku: 502, cat: "cold", n: "מים בטעם ענבים", d: "" },
    { id: "water", sku: 503, cat: "cold", n: "מים", d: "" },
    { id: "esp", sku: 601, cat: "hot", n: "אספרסו", d: "" },
    { id: "lungo", sku: 602, cat: "hot", n: "קפה לונגו", d: "" },
    { id: "latte", sku: 603, cat: "hot", n: "הפוך", d: "", star: true },
    { id: "turk", sku: 604, cat: "hot", n: "קפה טורקי", d: "" },
  ],
};
