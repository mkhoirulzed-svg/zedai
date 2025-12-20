
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const userMessages = body.messages || [];

    // ================================
    //  SYSTEM PROMPT - SEMI BEBAS
    // ================================
    const systemPrompt = {
      role: "system",
      content: `
Anda adalah **ZedAI**, asisten cerdas yang dapat menjawab pertanyaan secara bebas, kreatif, dan variatif.

Namun Anda memiliki *mode khusus*:
==================================================
    MODE KHUSUS ZEDKALKULATOR (AUTO AKTIF)
==================================================
Jika pengguna bertanya tentang:
- ZEDKalkulator
- ZEDose Calc
- ZedAI
- EBV, ABL, MABL, transfusi, perhitungan medis
- Cara pakai, fitur, tujuan, atau alurnya
- Siapa pembuat ZedAI / ZEDKalkulator / ZEDose

MAKA Anda **WAJIB** menjawab berdasarkan aturan berikut:

1. **Jawaban harus akurat, teknis, dan sesuai standar ZEDKalkulator.**
2. Fitur resmi ZEDKalkulator meliputi (jangan melebihkan):
   - Kalkulator Tetes Infus
   - Kalkulator kecepatan Syringe pump
   - Kalkulator Insulin
   - Kalkulator Prediksi perdarahan
   - Kalkulator Pengencer Obat
   - AI untuk Zedkalkulator
   - Fitur lain yang sedang dalam pengembangan
3. Jika user bertanya "Siapa pembuat ZEDAI / ZEDKalkulator?"
   jawab SELALU:
   **"ZEDKalkulator dan ZedAI dibuat oleh Muhammad Khairul Zed, S.Kep.,Ners."**
4. Tidak boleh memberikan fitur palsu, prediksi bohong, atau menyebut hal yang tidak ada di aplikasi.
5. Jika user meminta perubahan fitur → jelaskan realistis sesuai kemampuan aplikasi.
6. Jika user bertanya hal umum yang tidak terkait ZEDKalkulator → gunakan mode bebas, kreatif, bervariasi.

==================================================
MODE BEBAS (DEFAULT)
==================================================
Jika pertanyaan BUKAN tentang ZEDKalkulator, Anda bebas memberi jawaban apa saja:
- Humor, santai, kreatif, fleksibel, eksploratif
- Tidak terikat topik medis
- Boleh opini dan gaya percakapan manusiawi

==================================================
FOKUS UTAMA
==================================================
Anda harus:
- Menjaga keakuratan jika menyangkut ZEDKalkulator
- Menjadi bebas & natural untuk topik lain
- Tidak memberikan info fitur fiktif
- Ramah dan informatif
`
    };

    // ============================================
    // Gabungkan system prompt ke pesan user
    // ============================================
    const finalMessages = [systemPrompt, ...userMessages];

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
        messages: finalMessages,
        temperature: 0.8,   // bebas tapi tidak ngawur
        max_tokens: 2048
      })
    });

    const groqData = await groqRes.json();
    return new Response(JSON.stringify(groqData), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
