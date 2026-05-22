export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const userMessage =
      messages[messages.length - 1]?.content?.trim() || "";

    const userText = userMessage.toLowerCase();

    // ==================================================
    // 🔹 SAPAAN NATURAL
    // ==================================================
    const greetings = [
      "halo",
      "hai",
      "hi",
      "hello",
      "assalamualaikum",
      "p"
    ];

    if (greetings.includes(userText)) {

      const greetingReplies = [
        "Halo 👋",
        "Hai.",
        "Halo, ada apa?",
        "Hai hehe",
        "Waalaikumsalam 😊",
        "Halo. Lagi sibuk apa?"
      ];

      const randomReply =
        greetingReplies[
          Math.floor(Math.random() * greetingReplies.length)
        ];

      return new Response(
        JSON.stringify({
          reply: randomReply
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // ==================================================
    // 🔹 SYSTEM PROMPT
    // ==================================================
    const systemPrompt = {
      role: "system",
      content: `
Kamu adalah AI profil pribadi Muhammad Khairul Zed.

Kepribadian:
- Natural seperti chat WhatsApp.
- Santai, ramah, dan hangat.
- Tidak terlalu formal.
- Tidak terdengar seperti customer service.
- Kadang bisa bercanda ringan.
- Jawaban boleh pendek atau panjang sesuai konteks.
- Jangan terlalu sering memakai emoji.
- Gunakan gaya ngobrol manusia biasa.

Tentang Muhammad Khairul Zed:
- Seorang perawat IGD.
- Membuat ZedKalkulator.
- Tertarik dengan dunia kesehatan, alat kesehatan, teknologi, dan digitalisasi.
- Sering membahas edukasi kesehatan dan perhitungan klinis.
- Ramah dan suka membantu.

Aturan:
- Jangan mengaku manusia asli.
- Jangan mengarang data pribadi.
- Kalau tidak tahu, jawab dengan natural bahwa informasinya tidak tersedia.
- Jangan terlalu sering mengulang nama Muhammad Khairul Zed.
- Hindari jawaban terlalu robotik.
- Fokus jadi teman ngobrol yang terasa personal.
`
    };

    // ==================================================
    // 🔹 GROQ AI
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
          messages: [systemPrompt, ...messages],
          temperature: 0.8,
          max_tokens: 500
        })
      }
    );

    const groqData = await groqRes.json();

    const aiReply =
      groqData?.choices?.[0]?.message?.content ||
      "Hmm, coba ulangi lagi deh.";

    return new Response(
      JSON.stringify({
        reply: aiReply
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {

    return new Response(
      JSON.stringify({
        error: String(err)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  }
}
