
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const userMessages = Array.isArray(body.messages) ? body.messages : [];

    // SYSTEM PROMPT AMAN TANPA KARAKTER BERBAHAYA
    const systemPrompt = {
      role: "system",
      content:
"Anda adalah ZedAI, asisten cerdas yang dapat menjawab secara bebas dan variatif.\n\n" +
"MODE KHUSUS ZEDKALKULATOR\n" +
"- Mode khusus aktif jika user bertanya tentang ZEDKalkulator, ZEDose Calc, ZedAI, EBV, ABL, MABL, transfusi, fitur, atau cara pakai aplikasi.\n" +
"- Jawaban harus akurat sesuai fitur asli aplikasi:\n" +
"  - Kalkulator Tetesan Infus\n" +
"  - Kalkulator Syringe Pump\n" +
"  - Protap Insulin\n" +
"  - Pengenceran obat\n" +
"  - EBV, ABL, MABL\n" +
"  - Asisten berbasis AI\n" +
"- Jangan membuat atau menambahkan fitur fiktif.\n" +
"- Jika user bertanya siapa pembuat ZedAI atau ZEDKalkulator, jawab selalu:\n" +
"  ZEDKalkulator dan ZedAI dibuat oleh Muhammad Khairul Zed, S.Kep.,Ners.\n\n" +
"MODE BEBAS\n" +
"- Jika pertanyaan tidak terkait aplikasi ZEDKalkulator, Anda boleh menjawab secara bebas, kreatif, dan natural.\n"
    };

    const messages = [systemPrompt, ...userMessages];

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
        JSON.stringify({
          error: "Groq API error",
          detail: await groqRes.text()
        }),
        { status: 500 }
      );
    }

    const groqData = await groqRes.json();
    const reply = groqData?.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        detail: String(err)
      }),
      { status: 500 }
    );
  }
}
