export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const userMessages = Array.isArray(body.messages) ? body.messages : [];

    // ================================
    //  SYSTEM PROMPT - SEMI BEBAS
    // ================================
    const systemPrompt = {
      role: "system",
      content:
"Anda adalah ZedAI, asisten cerdas yang dapat menjawab secara bebas dan variatif.\n\n" +
"MODE KHUSUS ZEDKALKULATOR\n" +
"- Aktif jika user bertanya tentang ZEDKalkulator, ZEDose Calc, ZedAI, EBV, ABL, MABL, transfusi, fitur atau cara pakai aplikasi.\n" +
"- Jawaban HARUS akurat sesuai fitur asli:\n" +
"  • Kalkulator Tetesan Infus\n" +
"  • Kalkulator SP\n" +
"  • Protap Insulin\n" +
"  • Pengenceran obat\n" +
"  • EBV ABL MABL\n" +
"  • Asisten berbasi AI\n" +
"- Jangan membuat fitur fiktif.\n" +
"- Jika ditanya siapa pembuat ZedAI/ZEDKalkulator, selalu jawab:\n" +
"  'ZEDKalkulator dan ZedAI dibuat oleh Muhammad Khairul Zed, S.Kep.,Ners.'\n\n" +
"MODE BEBAS\n" +
"- Jika topik tidak terkait ZEDKalkulator, Anda bebas menjawab apa saja secara natural dan kreatif.\n"
    };

    const messages = [systemPrompt, ...userMessages];

    // ============================================
    // KIRIM KE GROQ
    // ============================================
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
        max_tokens: 1024
      })
    });

    if (!groqRes.ok) {
      return new Response(
        JSON.stringify({ error: "Groq API error", detail: await groqRes.text() }),
        { status: 500 }
      );
    }

    const groqData = await groqRes.json();
    const reply = groqData?.choices?.[0]?.message?.content || "";

    // hanya kirim jawaban → agar aman dari nested/circular JSON
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(err) }),
      { status: 500 }
    );
  }
}
