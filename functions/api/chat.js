export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userText =
      messages[messages.length - 1]?.content?.toLowerCase().trim() || "";

    // ==================================================
    // 🔹 ESCALATION KE ADMIN
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
"Baik kak 🙏 Untuk proses tersebut saya bantu hubungkan ke admin Alkes PKY ya.\nSilakan tunggu sebentar."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 SYSTEM PROMPT (AI SHOPEE STYLE)
    // ==================================================
    const enhancedSystemPrompt = {
      role: "system",
      content: `
Anda adalah ZedAI, asisten penjualan Alkes PKY di Palangka Raya.

Gaya komunikasi:
- Natural seperti AI marketplace (Shopee/Tokopedia)
- Ramah, ringan, tidak kaku
- Gunakan kata "kak" agar terasa natural
- Jawaban singkat dan langsung ke poin

Tugas Anda:
- Menjawab pertanyaan tentang produk alat kesehatan
- Menjelaskan ketersediaan produk
- Memberikan rekomendasi sesuai kebutuhan
- Mengajak closing secara halus

Aturan penting:
- Jangan mengarang harga atau stok jika tidak ada data
- Jika pelanggan ingin negosiasi atau transaksi, arahkan ke admin
- Fokus melayani area Palangka Raya
- Jangan membahas topik di luar alat kesehatan

Contoh gaya jawaban:
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
    const reply = groqData?.choices?.[0]?.message?.content ?? "";

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
