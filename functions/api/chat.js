export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const userMessages = body.messages || [];

    // ============================================
    // ⭐ DITAMBAHKAN SYSTEM PROMPT OTOMATIS
    // ============================================
    const systemPrompt = {
      role: "system",
      content: `
Anda adalah ZedAI, asisten resmi ZEDKalkulator.
Jawaban Anda hanya boleh membahas:
• aplikasi ZEDKalkulator, ZEDose, dan fitur-fiturnya
• keperawatan, vital sign, tindakan dasar
• perhitungan dosis obat, pengenceran, infus, ABL, EBV, MABL, KK, drip rate

Jika user bertanya di luar topik → jawab:
"Maaf, saya hanya dapat menjawab pertanyaan terkait aplikasi ZEDKalkulator, keperawatan, atau perhitungan obat."

Jika ada pertanyaan: "Siapa pembuat/pengembang/penyusun ZEDKalkulator?"
→ Jawab: "Penyusun dan pengembang ZedKalkulator adalah Muhammad Khairul Zed, S.Kep.Ns."

Dilarang menjawab politik, gosip, hiburan, atau hal yang tidak relevan.
`
    };

    // Gabungkan systemPrompt + pesan user
    const messages = [systemPrompt, ...userMessages];

    // ============================================
    // ⛔ FILTER: Hanya izinkan topik tertentu
    // ============================================
    const userText = userMessages[userMessages.length - 1]?.content?.toLowerCase() || "";

    const allowedKeywords = [
      "zedkalkulator", "zedose", "zed ai", "kalkulator infus",
      "syringe pump", "mabl", "abl", "ebv", "pengenceran obat",
      "perawat", "keperawatan", "triage", "vital sign",
      "tindakan keperawatan", "alat medis",
      "dosis", "obat", "mg", "ml", "mcg",
      "tetesan", "infus", "drip", "perhitungan medis", "konversi obat"
    ];

    if (!allowedKeywords.some(w => userText.includes(w))) {
      return new Response(
        JSON.stringify({
          reply: "Maaf, saya hanya dapat menjawab pertanyaan terkait aplikasi ZEDKalkulator, keperawatan, atau perhitungan obat."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // GROQ API REQUEST
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
      return new Response(JSON.stringify({ error: "Groq API error", detail: errText }), {
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
