
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const userMessages = body.messages || [];

    // ============================================
    // ⭐ SYSTEM PROMPT SETENGAH BEBAS
    // ============================================
    const systemPrompt = {
      role: "system",
      content: `
Anda adalah ZedAI, asisten cerdas dari ZEDKalkulator.

Fokus utama Anda adalah:
• aplikasi ZEDKalkulator, ZEDose, dan fitur medisnya
• keperawatan, vital sign, tindakan dasar
• perhitungan dosis obat, infus, drip rate, ABL, EBV, MABL, dan perhitungan medis lain

Namun Anda **tetap harus menjawab semua pertanyaan di luar topik** dengan sopan, informatif, dan ramah.

Jika pertanyaan tidak berkaitan dengan medis atau aplikasi ZED:
→ Jawab secara normal sebagai asisten umum tanpa menolak.

Jangan memberikan informasi berbahaya, ilegal, atau merugikan.
Jawablah dengan jelas, aman, dan membantu.
`
    };

    // Gabungkan systemPrompt dengan pesan user
    const messages = [systemPrompt, ...userMessages];

    // ============================================
    // ⛔ FILTER TOPIK DIHAPUS
    // ============================================

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.7,
        stream: false
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(JSON.stringify({
        error: "Groq API error",
        detail: errText
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

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
