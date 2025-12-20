export async function onRequestPost({ request, env }) {
  try {
    /* =========================
       VALIDASI BODY
    ========================= */
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400 }
      );
    }

    const userMessages = Array.isArray(body.messages)
      ? body.messages.slice(-10) // batasi riwayat
      : [];

    if (!userMessages.length) {
      return new Response(
        JSON.stringify({ error: "Messages kosong" }),
        { status: 400 }
      );
    }

    const lastMsg =
      userMessages[userMessages.length - 1]?.content?.toLowerCase() || "";

    /* =========================
       DETEKSI MODE ZED
    ========================= */
    const ZED_KEYWORDS = [
      "zedkalkulator", "zed kalkulator", "zedose", "zed ai",
      "ebv", "abl", "mabl",
      "syringe pump", "kalkulator infus",
      "pengenceran obat", "aplikasi zed"
    ];

    const isZedMode = ZED_KEYWORDS.some(k => lastMsg.includes(k));

    /* =========================
       SYSTEM PROMPT RINGKAS
    ========================= */
    const systemPrompt = {
      role: "system",
      content: isZedMode
        ? `Anda adalah ZedAI, asisten resmi ZEDKalkulator.

Jawaban harus AKURAT sesuai fitur asli:
- Tetesan Infus
- Syringe Pump
- Insulin
- Pengenceran Obat
- EBV / ABL / MABL

Jangan menambah fitur palsu.
Jika ditanya pembuatnya, jawab:
"ZEDKalkulator dan ZedAI dibuat oleh Muhammad Khairul Zed, S.Kep., Ners."`
        : `Anda adalah ZedAI, asisten AI yang ramah, informatif, dan natural.`
    };

    const messages = [systemPrompt, ...userMessages];

    /* =========================
       TIMEOUT FETCH
    ========================= */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      }
    );

    clearTimeout(timeout);

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(
        JSON.stringify({ error: "Groq API Error", detail: errText }),
        { status: 502 }
      );
    }

    const groqData = await groqRes.json();

    if (!groqData.choices?.length) {
      return new Response(
        JSON.stringify({ error: "Empty response from Groq" }),
        { status: 502 }
      );
    }

    const reply = groqData.choices[0].message?.content
      || "Maaf, saya belum bisa menjawab.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Server Error",
        detail: err?.name === "AbortError"
          ? "Request timeout"
          : String(err)
      }),
      { status: 500 }
    );
  }
}
