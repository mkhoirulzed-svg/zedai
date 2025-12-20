export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const userMessages = Array.isArray(body.messages) ? body.messages : [];
    const lastMsg = userMessages[userMessages.length - 1]?.content?.toLowerCase() || "";

    // ============================
    // DETEKSI MODE KHUSUS APLIKASI
    // ============================
    const isZedMode =
      [
        "zedkalkulator", "zed kalkulator", "zedose", "zed ai",
        "ebv", "abl", "mabl", "syringe pump", "kalkulator infus",
        "pengenceran obat", "aplikasi zed"
      ].some(k => lastMsg.includes(k));

    // ============================
    // SYSTEM PROMPT DINAMIS
    // ============================
    const basePrompt = `
Anda adalah ZedAI, asisten cerdas. Anda dapat menjawab semua hal secara bebas, ramah, dan natural.

Namun jika pengguna bertanya tentang ZEDKalkulator, Anda harus masuk MODE ZEDKALKULATOR:

• Jawaban harus akurat sesuai fitur asli:
  - Kalkulator Tetesan Infus
  - Kalkulator Syringe Pump
  - Protap Insulin
  - Pengenceran Obat
  - EBV, ABL, MABL
  - Asisten berbasis AI
• Jangan menambah fitur palsu.
• Jika ditanya siapa pembuatnya → jawab:
  "ZEDKalkulator dan ZedAI dibuat oleh Muhammad Khairul Zed, S.Kep.,Ners."
`;

    const finalPrompt = isZedMode
      ? basePrompt + "\n(SAAT INI MODE ZEDKALKULATOR AKTIF)"
      : basePrompt + "\n(SAAT INI MODE BEBAS AKTIF)";

    const systemPrompt = {
      role: "system",
      content: finalPrompt
    };

    const messages = [systemPrompt, ...userMessages];

    // ============================
    // KIRIM KE GROQ
    // ============================
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages,
        temperature: 0.8,
      })
    });

    if (!groqRes.ok) {
      return new Response(JSON.stringify({ error: "Groq Error" }), { status: 500 });
    }

    const groqData = await groqRes.json();
    const reply = groqData?.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server Error", detail: String(err) }), {
      status: 500
    });
  }
}
