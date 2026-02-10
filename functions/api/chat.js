export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userText =
      messages[messages.length - 1]?.content?.toLowerCase().trim() || "";

    // ==================================================
    // 🔹 SAPAAN
    // ==================================================
    const greetings = ["halo", "hai", "hi", "hello", "assalamualaikum"];

    if (greetings.includes(userText)) {
      return new Response(
        JSON.stringify({
          reply:
            "Halo kak 😊 Selamat datang di Alkes PKY.\nSilakan sebutkan produk yang kakak cari ya 🙏"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 ESCALATION NEGOSIASI / TRANSAKSI
    // ==================================================
    const adminKeywords = [
      "admin",
      "nego",
      "harga terakhir",
      "grosir",
      "ambil banyak",
      "cod",
      "transfer",
      "order",
      "pesan sekarang",
      "pembayaran"
    ];

    if (adminKeywords.some(k => userText.includes(k))) {
      return new Response(
        JSON.stringify({
          reply:
            "Baik kak 🙏 Untuk proses tersebut saya bantu hubungkan langsung ke admin Alkes PKY ya 😊"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 FETCH DATA PRODUK
    // ==================================================
    const productRes = await fetch("https://script.google.com/macros/s/AKfycbxsxv2jLktEIgPWx-xWl0vPrRy7gux5961LmKvwJNeXu6FtqqgmuAoSAoyw8qSaUdYM/exec");

    if (!productRes.ok) {
      throw new Error("Gagal fetch spreadsheet");
    }

    let products = await productRes.json();
    if (!Array.isArray(products)) {
      products = products.data || [];
    }

    // ==================================================
    // 🔹 FLEXIBLE WORD MATCHING
    // ==================================================
    const userWords = userText.split(/\s+/);

    const matchedProducts = products.filter(p => {
      const nama = (p.nama || "").toLowerCase();
      const nama2 = (p.NAMA || "").toLowerCase();
      const merk = (p.merk || "").toLowerCase();

      return userWords.some(word =>
        nama.includes(word) ||
        nama2.includes(word) ||
        merk.includes(word)
      );
    });

    // ==================================================
    // 🔹 JIKA PRODUK DITEMUKAN
    // ==================================================
    if (matchedProducts.length > 0) {
      let reply = "Ada kak 😊 Berikut detail produknya:\n\n";

      matchedProducts.slice(0, 5).forEach((p, index) => {
        const harga = Number(p["HAGA JUAL TOTAL"] || 0);
        const stok = Number(p.stok || 0);

        reply += `${index + 1}️⃣ *${p.nama || p.NAMA}*\n`;
        reply += `💰 Rp ${harga.toLocaleString("id-ID")}\n`;

        if (stok > 0) {
          reply += `📦 Stok tersedia: ${stok} pcs\n\n`;
        } else {
          reply += `📦 Stok saat ini kosong\n\n`;
        }
      });

      reply += "Mau dibantu proses kak? 😊";

      return new Response(JSON.stringify({ reply }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ==================================================
    // 🔹 JIKA TIDAK ADA MATCH → LEBIH NATURAL
    // ==================================================
    return new Response(
      JSON.stringify({
        reply:
          "Untuk memastikan produk tersebut 🙏 Saya bantu cekkan langsung ke admin Alkes PKY ya kak 😊"
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
