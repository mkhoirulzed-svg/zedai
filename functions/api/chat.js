
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    // ============================================
    //   FILTER: Hanya izinkan topik tertentu
    // ============================================
    const userText = messages[messages.length - 1]?.content?.toLowerCase() || "";

    const allowedKeywords = [
      "zedkalkulator", "zedose", "zed ai", "kalkulator infus",
      "syringe pump", "mabl", "abl", "ebv", "pengenceran obat",
      "perawat", "keperawatan", "triage", "vital sign",
      "tindakan keperawatan", "alat medis",
      "dosis", "obat", "mg", "ml", "mcg", "tetesan",
      "infus", "drip", "perhitungan medis", "konversi obat"
    ];

    if (!allowedKeywords.some(w => userText.includes(w))) {
      return new Response(
        JSON.stringify({
          reply: "Maaf, saya hanya bisa menjawab topik terkait ZEDKalkulator, keperawatan, dan perhitungan dosis obat."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ============================================
    //   Tambahan otomatis:
    //   Jika user bertanya tentang pembuat aplikasi
    // ============================================
    if (
      userText.includes("pembuat") ||
      userText.includes("developer") ||
      userText.includes("yang buat") ||
      userText.includes("siapa pembuat") ||
      userText.includes("siapa yang membuat") ||
      userText.includes("penyusun")
    ) {
      return new Response(
        JSON.stringify({
          reply: "Aplikasi zedKalkulator dibuat dan disusun oleh **Muhammad Khairul Zed, S.Kep.,Ners**."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ============================================
    //           SYSTEM PROMPT KREATIF
    // ============================================
    const enhancedSystemPrompt = {
      role: "system",
      content: `
Anda adalah ZedAI, asisten resmi aplikasi zedKalkulator.

Tujuan Anda:
- Memberikan jawaban kreatif, informatif, jelas, ramah.
- Selalu fokus pada konteks medis, keperawatan, perhitungan obat, dan fitur ZEDKalkulator.
- Gunakan gaya bahasa profesional namun tetap mudah dipahami.

Jika pengguna bertanya tentang pembuat kamu/aplikasi, jawab dengan:
"zedKalkulator dibuat dan disusun oleh Muhammad Khairul Zed, S.Kep.,Ners."
Jika pengguna bertanya di mana Muhammad khairul zed bekerja, jawab dengan:"di RSUD dr Doris Sylvanus"
Jangan membahas hal di luar topik keperawatan, perhitungan dosis, dan aplikasi ZED.
`
    };

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [enhancedSystemPrompt, ...messages],
        temperature: 0.9,  // lebih kreatif
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
