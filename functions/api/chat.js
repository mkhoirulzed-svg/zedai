export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userText =
      messages[messages.length - 1]?.content?.toLowerCase() || "";

    // ==================================================
    // 🔹 KEYWORD PRODUK ALKES
    // ==================================================
    const allowedKeywords = [
      "tensimeter",
      "stetoskop",
      "strip gula",
      "gula darah",
      "kolesterol",
      "asam urat",
      "termometer",
      "nebulizer",
      "kursi roda",
      "alat kesehatan",
      "alat medis",
      "alkes",
      "pk y",
      "palangkaraya",
      "palangka raya",
      "harga",
      "stok"
    ];

    // ==================================================
    // 🔹 SAPAAN (DIBOLEHKAN)
    // ==================================================
    const greetings = [
      "halo", "hai", "hello", "hi",
      "assalamualaikum",
      "selamat pagi",
      "selamat siang",
      "selamat sore",
      "selamat malam"
    ];

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
      "pesan sekarang"
    ];

    if (adminKeywords.some(k => userText.includes(k))) {
      return new Response(
        JSON.stringify({
          reply:
            "Baik 🙏 Saya hubungkan ke admin Alkes PKY ya.\nSilakan tunggu sebentar."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 FILTER FINAL (TOPIK DI LUAR ALKES DITOLAK)
    // ==================================================
    const allowBypass =
      greetings.some(g => userText.startsWith(g)) ||
      allowedKeywords.some(w => userText.includes(w));

    if (!allowBypass) {
      return new Response(
        JSON.stringify({
          reply:
            "Maaf, saya hanya melayani informasi dan penjualan alat kesehatan Alkes PKY (Palangka Raya). 🙏"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 SYSTEM PROMPT — MODE SALES ALKES PKY
    // ==================================================
    const enhancedSystemPrompt = {
      role: "system",
      content: `
Anda adalah ZedAI, asisten penjualan resmi Alkes PKY di Palangka Raya.

Tugas Anda:
- Membantu pelanggan memilih alat kesehatan
- Memberikan informasi harga dan ketersediaan produk
- Memberikan rekomendasi sesuai kebutuhan
- Fokus area Palangka Raya

Aturan penting:
- Jangan mengarang harga atau stok
- Jika pelanggan ingin negosiasi atau order, arahkan ke admin
- Jawaban singkat, jelas, profesional, dan seperti sales WhatsApp
- Jangan membahas topik di luar alat kesehatan

Gaya jawaban:
- Gunakan poin bernomor jika merekomendasikan produk
- Tutup dengan pertanyaan ringan untuk closing
Contoh:
"Mau saya bantu pilihkan sesuai kebutuhan?"
      `
    };

    // ==================================================
    // 🔹 KIRIM KE GROQ API
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
          temperature: 0.2,
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
