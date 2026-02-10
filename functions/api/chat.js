export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userText =
      messages[messages.length - 1]?.content?.toLowerCase().trim() || "";

    // ==================================================
    // 🔹 MENU AWAL
    // ==================================================
    const greetings = [
      "", "halo", "hai", "hello", "hi",
      "assalamualaikum",
      "selamat pagi",
      "selamat siang",
      "selamat sore",
      "selamat malam"
    ];

    if (greetings.includes(userText)) {
      return new Response(
        JSON.stringify({
          reply:
`Selamat datang di *Alkes PKY* 🙏

Silakan pilih layanan:

1️⃣ Admin AI (cek harga & info produk)
2️⃣ Chat Admin (langsung dengan tim kami)

Ketik *1* atau *2* ya kak 😊`
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 PILIH CHAT ADMIN
    // ==================================================
    if (userText === "2") {
      return new Response(
        JSON.stringify({
          reply:
            "Baik kak 🙏 Saya hubungkan langsung ke admin Alkes PKY ya. Silakan tunggu sebentar."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 JIKA BELUM PILIH 1 → ARAHKAN KE MENU
    // ==================================================
    if (userText !== "1" && messages.length === 1) {
      return new Response(
        JSON.stringify({
          reply:
`Silakan pilih layanan terlebih dahulu ya kak 😊

1️⃣ Admin AI  
2️⃣ Chat Admin`
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
            "Untuk proses tersebut saya bantu hubungkan langsung ke admin ya kak 🙏"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 KHUSUS PERTANYAAN STOK → ADMIN
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
            "Untuk memastikan ketersediaan stok yang paling akurat 🙏 Saya bantu cekkan langsung ke admin ya kak."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 FETCH DATA DARI SPREADSHEET (SAFE MODE)
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
    // 🔹 FILTER PRODUK (ANTI ERROR)
    // ==================================================
    const matchedProducts = products.filter(p => {
      const nama = (p.nama || "").toLowerCase();
      const nama2 = (p.NAMA || "").toLowerCase();
      const merk = (p.merk || "").toLowerCase();

      return (
        nama.includes(userText) ||
        nama2.includes(userText) ||
        merk.includes(userText)
      );
    });

    // ==================================================
    // 🔹 JIKA PRODUK DITEMUKAN → TAMPILKAN HARGA SAJA
    // ==================================================
    if (matchedProducts.length > 0) {
      let reply = "Berikut informasi harganya kak 😊\n\n";

      matchedProducts.slice(0, 5).forEach((p, index) => {
        const harga = Number(p["HAGA JUAL TOTAL"] || 0);

        reply += `${index + 1}️⃣ ${p.nama || p.NAMA}\n`;
        reply += `💰 Rp ${harga.toLocaleString("id-ID")}\n\n`;
      });

      reply +=
        "Jika ingin memastikan stok atau melakukan pemesanan, saya bisa hubungkan ke admin ya kak 🙏";

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
          "Untuk memastikan produk yang kakak maksud 🙏 Saya bantu hubungkan langsung ke admin Alkes PKY ya."
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
