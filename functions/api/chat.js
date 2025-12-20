
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const userMessages = Array.isArray(body.messages) ? body.messages : [];

    // ================================
    // System Prompt secara aman (split)
    // ================================
    const promptLines = [
      "Anda adalah ZedAI, asisten cerdas yang dapat menjawab secara bebas.",
      "",
      "MODE KHUSUS ZEDKALKULATOR:",
      "- Aktif jika user bertanya tentang ZEDKalkulator, ZEDose Calc, ZedAI, EBV, ABL, MABL, transfusi, fitur, atau cara pakai aplikasi.",
      "- Jawaban harus akurat sesuai fitur asli:",
      "  - Kalkulator Tetesan Infus",
      "  - Kalkulator Syringe Pump",
      "  - Protap Insulin",
      "  - Pengenceran obat",
      "  - EBV, ABL, MABL",
      "  - Asisten berbasis AI",
      "- Jangan membuat fitur fiktif.",
      "- Jika user bertanya siapa pembuat ZedAI atau ZEDKalkulator:",
      "  Jawab: ZEDKalkulator dan ZedAI dibuat oleh Muhammad Khairul Zed, S.Kep.,Ners.",
      "",
      "MODE BEBAS:",
      "- Jika bukan terkait aplikasi, Anda boleh menjawab secara natural dan kreatif."
    ];

    const systemPrompt = {
      role: "system",
      content: promptLines.join("\n")
    };

    const messages = [systemPrompt, ...userMessages];

    // ================================
    // KIRIM KE GROQ
    // ================================
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages,
        temperature: 0.8,
        max_tokens: 800 // kurangi agar tidak memicu crash
      })
    });

    if (!groqRes.ok) {
      const txt = await groqRes.text();
      return new Response(JSON.stringify({ error: "Groq API Error", detail: txt }), {
        status: 500
      });
    }

    const groqData = await groqRes.json();

    // Proteksi tambahan agar Worker tidak crash
    const replyContent =
      groqData?.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";

    return new Response(JSON.stringify({ reply: replyContent }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Server error",
      detail: err?.message || String(err)
    }), { status: 500 });
  }
}
