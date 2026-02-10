export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userMessage =
      messages[messages.length - 1]?.content?.trim() || "";

    const userText = userMessage.toLowerCase();

    // ==================================================
    // 🔹 NEGOSIASI / TRANSAKSI → ADMIN
    // ==================================================
    const adminKeywords = [
      "admin","nego","grosir","cod","transfer",
      "order","pesan sekarang","proses","lanjut","jadi"
    ];

    if (adminKeywords.some(k => userText.includes(k))) {
      return new Response(
        JSON.stringify({
          reply:
            "Baik kak 🙏 Untuk proses tersebut saya hubungkan langsung ke admin Alkes PKY ya 😊"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 SAPAAN SAJA
    // ==================================================
    const greetings = ["halo","hai","hi","hello","assalamualaikum"];

    if (greetings.includes(userText)) {
      return new Response(
        JSON.stringify({
          reply:
            "Halo kak 😊 Silakan sebutkan produk alat kesehatan yang kakak cari ya 🙏"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 FETCH SPREADSHEET
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
      "ada","nggak","tidak","apakah","yang",
      "kah","dong","nih","gak","ya","kak",
      "produk","barang","berapa","harga"
    ];

    const userWords = userText
      .split(/\s+/)
      .filter(word => !stopwords.includes(word));

    // ==================================================
    // 🔹 MATCH PRODUK (AND LOGIC)
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
    // 🔹 DETEKSI APAKAH INI PRODUCT QUERY
    // ==================================================
    const productQueryTriggers = [
      "ada","cari","punya","jual","tersedia",
      "termometer","tensimeter","omron",
      "stetoskop","strip","nebulizer"
    ];

    const isProductQuery =
      productQueryTriggers.some(k => userText.includes(k)) ||
      userWords.length > 0;

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
    // 🔹 JIKA PRODUCT QUERY TAPI TIDAK DITEMUKAN
    // ==================================================
    if (isProductQuery) {
      return new Response(
        JSON.stringify({
          reply:
            "Untuk memastikan produk tersebut 🙏 Saya bantu cekkan langsung ke admin Alkes PKY ya kak 😊"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 PERTANYAAN UMUM (BARU PAKAI AI)
    // ==================================================
    const systemPrompt = {
      role: "system",
      content: `
Anda adalah asisten Alkes PKY.
Jawab natural dan ramah.
Jangan menyebut harga atau stok.
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
          temperature: 0.4
        })
      }
    );

    const groqData = await groqRes.json();
    const aiReply =
      groqData?.choices?.[0]?.message?.content ||
      "Silakan sebutkan produk yang kakak cari ya 😊";

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
