export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    // ============================================
    //   ⛔ FILTER: Hanya izinkan topik tertentu
    // ============================================
    const userText = messages[messages.length - 1]?.content?.toLowerCase() || "";

    // Topik yang DIIZINKAN
    const allowedKeywords = [
      // Aplikasi
      "zedkalkulator", "zedose", "zed ai", "kalkulator infus", 
      "syringe pump", "mabl", "abl", "ebv", "pengenceran obat",

      // Keperawatan
      "perawat", "keperawatan", "triage", "vital sign", 
      "tindakan keperawatan", "alat medis",

      // Perhitungan obat
      "dosis", "obat", "mg", "ml", "mcg", "tetesan",
      "infus", "drip", "perhitungan medis", "konversi obat"
    ];

    // Jika TIDAK mengandung salah satu kata yang diizinkan → blokir
    if (!allowedKeywords.some(w => userText.includes(w))) {
      return new Response(
        JSON.stringify({
          reply: "Maaf, saya hanya dapat menjawab pertanyaan terkait aplikasi ZEDKalkulator, keperawatan, atau perhitungan obat."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ============================================
    //       GROQ API REQUEST (tetap sama)
    // ============================================
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(
        JSON.stringify({ error: 'Groq API error', detail: errText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const groqData = await groqRes.json();
    const reply = groqData?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
