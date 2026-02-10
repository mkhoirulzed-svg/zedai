export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userText =
      messages[messages.length - 1]?.content?.toLowerCase().trim() || "";

    // ==================================================
    // 🔹 ESCALATION KEYWORDS (LANGSUNG ADMIN)
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
      "kirim sekarang"
    ];

    if (adminKeywords.some(k => userText.includes(k))) {
      return new Response(
        JSON.stringify({
          reply:
            "Baik kak 🙏 Untuk proses tersebut saya bantu hubungkan langsung ke admin Alkes PKY ya.\nSilakan tunggu sebentar."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 SYSTEM PROMPT (AI SALES NATURAL MODE)
    // ==================================================
    const enhancedSystemPrompt = {
      role: "system",
      content: `
Anda adalah ZedAI, asisten penjualan Alkes PKY di Palangka Raya.

Gaya komunikasi:
- Natural seperti AI marketplace (Shopee/Tokopedia)
- Ramah dan ringan
- Gunakan kata "kak"
- Jawaban singkat dan langsung ke poin

Tugas Anda:
- Menjawab pertanyaan tentang produk alat kesehatan
- Menjelaskan ketersediaan produk
- Memberikan rekomendasi sesuai kebutuhan
- Mengajak closing secara halus

Aturan penting:
- Jangan mengarang harga atau stok
- Jika tidak yakin, jangan berspekulasi
- Jika pelanggan ingin negosiasi, transaksi, atau data detail, arahkan ke admin
- Fokus melayani area Palangka Raya
- Jangan membahas topik di luar alat kesehatan

Contoh gaya:
"Ada kak 😊"
"Masih tersedia kak 🙏"
"Mau untuk penggunaan pribadi atau klinik?"
      `
    };

    // ==================================================
    // 🔹 KIRIM KE GROQ
    // ==================================================
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
          messages: [enhancedSystemPrompt, ...messages],
          temperature: 0.4,
          stream: false
        })
      }
    );

    const groqData = await groqRes.json();
    let reply = groqData?.choices?.[0]?.message?.content ?? "";

    // ==================================================
    // 🔹 AUTO ESCALATION JIKA AI RAGU / JAWABAN TIDAK VALID
    // ==================================================
    if (
      !reply ||
      reply.length < 5 ||
      reply.toLowerCase().includes("tidak tahu") ||
      reply.toLowerCase().includes("kurang informasi") ||
      reply.toLowerCase().includes("tidak tersedia informasi") ||
      reply.toLowerCase().includes("saya tidak memiliki data")
    ) {
      return new Response(
        JSON.stringify({
          reply:
            "Untuk memastikan jawaban yang paling akurat dan nyaman untuk kakak 🙏\nSaya bantu hubungkan langsung ke admin Alkes PKY ya."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 RETURN NORMAL AI RESPONSE
    // ==================================================
    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
