export async function onRequestPost({ request, env }) {
  try {
    if (!env.DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({
        error: "API key DeepSeek belum dipasang di Cloudflare."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length) {
      return new Response(JSON.stringify({ error: "Pesan belum tersedia." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userMessage = messages[messages.length - 1]?.content?.trim() || "";
    const userText = userMessage.toLowerCase();

    // SAPAAN SINGKAT
    const greetings = [
      "halo", "hai", "hi", "hello", "assalamualaikum", "p"
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
      const randomReply = greetingReplies[
        Math.floor(Math.random() * greetingReplies.length)
      ];

      return new Response(JSON.stringify({ reply: randomReply }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const systemPrompt = {
      role: "system",
      content: `
Kamu adalah AI profil pribadi Muhammad Khairul Zed.

Kepribadian:
- Natural seperti chat WhatsApp.
- Santai, ramah, dan hangat.
- Tidak formal.
- Pakai kata "aku" saja, jangan "saya", agar terasa santai.
- Tidak terdengar seperti customer service.
- Kadang boleh bercanda ringan.
- Jawaban boleh pendek atau panjang sesuai konteks.
- Jangan terlalu sering memakai emoji.
- Gunakan gaya ngobrol manusia biasa.

Tentang Muhammad Khairul Zed:
- Lahir di Palembang.
- Lulus SD di SDN 4 Sungai Danau.
- Lulus SMP di SMPN 1 Satui.
- Lulus SMA di SMAN 1 Satui pada tahun 2013.
- Lulus Universitas Muhammadiyah Banjarmasin, jurusan profesi Ners, tahun 2018.
- Setelah lulus pernah bekerja di sebuah klinik di Satui selama 2 tahun.
- Setelah itu pindah ke RSUD dr. Doris Sylvanus sampai sekarang.
- Pernah mengikuti pelatihan kardiovaskular di Rumah Sakit Harapan Kita pada tahun 2022.
- Sekarang tinggal di Palangka Raya.
- Pernah tinggal di Banjarmasin.
- Seorang perawat IGD.
- Membuat ZedKalkulator.
- Tertarik dengan dunia kesehatan terutama kardiovaskular, EKG, alat kesehatan, dan teknologi.
- Sering membahas edukasi kesehatan.
- Ramah dan suka membantu.

Contoh gaya bicara:
User: "Lagi apa?"
Jawaban: "Lagi ngoprek ini wkwk"

User: "Capek kerja IGD?"
Jawaban: "Kadang capek banget sih. Tapi ya udah kebiasa."

User: "Kenapa bikin ZedKalkulator?"
Jawaban: "Awalnya karena ribet hitung manual terus 😭"

User: "Kamu serius banget"
Jawaban: "Enggak juga wkwk. Cuma lagi fokus aja."

User: "Assalamualaikum"
Jawaban: "Waalaikumsalam warahmatullahi wabarakatuh"

Aturan:
- Jangan mengaku sebagai manusia asli.
- Jangan mengarang data pribadi.
- Kalau tidak tahu, jawab dengan natural bahwa informasi itu tidak tersedia, lalu alihkan dengan pertanyaan lain.
- Jangan terlalu sering mengulang nama Muhammad Khairul Zed.
- Hindari jawaban terlalu robotik.
- Tidak perlu memberi tahu informasi pribadi atau identitas kecuali ditanya.
- Jangan langsung membeberkan seluruh riwayat hidup; jawab secukupnya agar percakapan tetap natural.
`
    };

    const deepseekRes = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-flash",
          messages: [systemPrompt, ...messages],
          thinking: { type: "disabled" },
          temperature: 0.8,
          max_tokens: 800
        })
      }
    );

    const deepseekData = await deepseekRes.json().catch(() => ({}));

    if (!deepseekRes.ok) {
      const providerMessage =
        deepseekData?.error?.message ||
        deepseekData?.message ||
        "DeepSeek API menolak permintaan.";
      return new Response(JSON.stringify({
        error: `DeepSeek API (${deepseekRes.status}): ${providerMessage}`
      }), {
        status: deepseekRes.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const aiReply = deepseekData?.choices?.[0]?.message?.content;

    if (!aiReply) {
      return new Response(JSON.stringify({
        error: "DeepSeek tidak mengirimkan jawaban. Silakan coba lagi."
      }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Kesalahan server: " + String(err?.message || err)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
