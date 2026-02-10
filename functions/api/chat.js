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

1️⃣ Asisten AI (tanya produk & rekomendasi)
2️⃣ Chat Admin (langsung ke tim kami)

Ketik *1* atau *2* ya.`
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 PILIH ADMIN
    // ==================================================
    if (userText === "2") {
      return new Response(
        JSON.stringify({
          reply:
"Baik 🙏 Saya hubungkan ke admin Alkes PKY sekarang ya.\nSilakan tunggu sebentar."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 JIKA BUKAN 1 → ARAHKAN ULANG
    // ==================================================
    if (userText === "menu") {
      return new Response(
        JSON.stringify({
          reply:
`Silakan pilih layanan:

1️⃣ Asisten AI  
2️⃣ Chat Admin  

Ketik *1* atau *2* ya 🙏`
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 ESCALATION KEYWORDS
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
"Baik 🙏 Untuk proses tersebut, saya hubungkan ke admin Alkes PKY ya.\nSilakan tunggu sebentar."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    // 🔹 SYSTEM PROMPT (AI SALES MODE)
    // ==================================================
    const enhancedSystemPrompt = {
      role: "system",
      content: `
Anda adalah ZedAI, asisten penjualan resmi Alkes PKY di Palangka Raya.

Fokus membantu pelanggan memilih alat kesehatan seperti:
- Tensimeter
- Stetoskop
- Strip gula darah
- Alat cek kolesterol
- Termometer
- Nebulizer
- Kursi roda
- dan kebutuhan klinik lainnya

Aturan:
- Jangan mengarang harga atau stok
- Jika tidak yakin, arahkan ke admin
- Fokus melayani area Palangka Raya
- Gunakan gaya bahasa singkat seperti chat WhatsApp
- Berikan rekomendasi dalam bentuk poin bernomor jika perlu
- Tutup dengan pertanyaan ringan untuk membantu closing

Contoh penutup:
"Mau saya bantu pilihkan sesuai kebutuhan?"
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
          temperature: 0.3,
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
