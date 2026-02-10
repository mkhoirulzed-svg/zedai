export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userText =
      messages[messages.length - 1]?.content?.toLowerCase().trim() || "";

    // ==================================================
    // 🔹 KEYWORD ADMIN (NEGOSIASI / TRANSAKSI)
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
            "Baik kak 🙏 Untuk proses tersebut saya bantu hubungkan langsung ke admin Alkes PKY ya."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 KHUSUS PERTANYAAN STOK / KETERSEDIAAN
    // ==================================================
    const stockKeywords = [
      "stok",
      "ready",
      "tersedia",
      "masih ada",
      "ada barang",
      "kosong",
      "habis"
    ];

    if (stockKeywords.some(k => userText.includes(k))) {
      return new Response(
        JSON.stringify({
          reply:
            "Untuk memastikan ketersediaan stok yang paling akurat 🙏\nSaya bantu cekkan langsung ke admin Alkes PKY ya kak."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 FETCH DATA PRODUK DARI SPREADSHEET
    // ==================================================
    const productRes = await fetch("PASTE_URL_WEBAPP_KAMU_DI_SINI");
    const products = await productRes.json();

    // ==================================================
    // 🔹 FILTER PRODUK BERDASARKAN NAMA / MERK
    // ==================================================
    const matchedProducts = products.filter(p =>
      p.nama?.toLowerCase().includes(userText) ||
      p.NAMA?.toLowerCase().includes(userText) ||
      p.merk?.toLowerCase().includes(userText)
    );

    // ==================================================
    // 🔹 JIKA PRODUK DITEMUKAN → TAMPILKAN HARGA SAJA
    // ==================================================
    if (matchedProducts.length > 0) {
      let reply = "Berikut informasi harganya kak 😊\n\n";

      matchedProducts.slice(0, 5).forEach((p, index) => {
        reply += `${index + 1}️⃣ ${p.nama}\n`;
        reply += `💰 Rp ${Number(p["HAGA JUAL TOTAL"]).toLocaleString("id-ID")}\n\n`;
      });

      reply += "Jika ingin memastikan stok atau melakukan pemesanan, saya bisa hubungkan ke admin ya kak 🙏";

      return new Response(JSON.stringify({ reply }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ==================================================
    // 🔹 JIKA TIDAK DITEMUKAN → ADMIN
    // ==================================================
    return new Response(
      JSON.stringify({
        reply:
          "Untuk memastikan produk yang kakak maksud 🙏\nSaya bantu hubungkan langsung ke admin Alkes PKY ya."
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
