export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userMessage =
      messages[messages.length - 1]?.content?.trim() || "";

    const userText = userMessage.toLowerCase();

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
      "pembayaran",
      "proses",
      "lanjut",
      "jadi",
      "mau ambil"
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
    // 🔹 FETCH DATA SPREADSHEET
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
    // 🔹 STOPWORDS
    // ==================================================
    const stopwords = [
      "ada", "nggak", "tidak", "apakah", "yang",
      "kah", "dong", "nih", "gak", "ya", "kak",
      "produk", "barang", "dong", "sih"
    ];

    const userWords = userText
      .split(/\s+/)
      .filter(word => !stopwords.includes(word));

    // ==================================================
    // 🔹 AND MATCHING (SEMUA KATA HARUS COCOK)
    // ==================================================
    const matchedProducts = products.filter(p => {
      const nama = (p.nama || "").toLowerCase();
      const nama2 = (p.NAMA || "").toLowerCase();
      const merk = (p.merk || "").toLowerCase();

      return userWords.length > 0 && userWords.every(word =>
        nama.includes(word) ||
        nama2.includes(word) ||
        merk.includes(word)
      );
    });

    // ==================================================
    // 🔹 JIKA PRODUK DITEMUKAN
    // ==================================================
    if (matchedProducts.length > 0) {
      let reply = "Ada kak 😊 Ini yang sesuai dengan pencarian kakak:\n\n";

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

      reply += "Mau dibantu proses atau ingin tanya detail lainnya kak? 😊";

      return new Response(JSON.stringify({ reply }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ==================================================
    // 🔹 JIKA TIDAK ADA PRODUK COCOK → JAWAB NATURAL DENGAN AI
    // ==================================================
    const systemPrompt = {
      role: "system",
      content: `
Anda adalah asisten penjualan Alkes PKY di Palangka Raya.

Gaya komunikasi:
- Natural seperti admin Shopee
- Ramah
- Gunakan kata "kak"
- Singkat tapi informatif

Jika pertanyaan bukan tentang produk spesifik,
jawab secara natural dan arahkan perlahan ke produk.

Jika benar-benar tidak tahu produk tersebut,
sarankan untuk cek ke admin.
`
    };

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [systemPrompt, ...messages],
          temperature: 0.5,
          stream: false
        })
      }
    );

    const groqData = await groqRes.json();
    let aiReply = groqData?.choices?.[0]?.message?.content ?? "";

    if (!aiReply || aiReply.length < 5) {
      aiReply =
        "Untuk memastikan informasi tersebut 🙏 Saya bantu cekkan langsung ke admin Alkes PKY ya kak 😊";
    }

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
