export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    // ============================================
    //   FILTER: Hanya izinkan topik tertentu (diperluas)
    // ============================================
    const userText = messages[messages.length - 1]?.content?.toLowerCase() || "";

    const allowedKeywords = [
      // Aplikasi
      "zedkalkulator", "zedose", "zed ai", "kalkulator infus",
      "syringe pump", "mabl", "abl", "ebv", "pengenceran obat",

      // Keperawatan
      "perawat", "keperawatan", "asuhan keperawatan",
      "diagnosa keperawatan", "intervensi keperawatan",
      "tindakan keperawatan", "catatan keperawatan",

      // Kesehatan & medis umum
      "kesehatan", "medis", "kedokteran", "patofisiologi",
      "tanda gejala", "penyakit", "pemeriksaan fisik",

      // Unit pelayanan
      "igd", "icu", "nicu", "picu", "rawat inap", "rawat jalan",

      // Vital sign
      "vital sign", "tensi", "nadi", "respirasi", "suhu", "spo2",

      // Farmakologi & perhitungan obat
      "dosis", "obat", "farmasi", "formularium",
      "mg", "ml", "mcg", "tetesan", "drip", "infus",
      "perhitungan medis", "konversi obat",

      // Alat medis
      "alat medis", "alat kesehatan", "monitor pasien",
      "defibrillator", "ecg", "xray", "ct scan", "usg",
      "infusion pump",

      // Tindakan klinis
      "resusitasi", "bls", "acls", "p3k", "first aid",
      "pemasangan infus", "pemasangan kateter",
      "pemasangan ngt", "perawatan luka", "dressing",

      // Laboratorium & tanda klinis
      "laboratorium", "gula darah", "elektrolit",
      "natrium", "kalium", "hemoglobin", "hematokrit",

      // Triage dan kegawatdaruratan
      "triage", "gawat darurat", "kedaruratan"
    ];

    // Jika tidak mengandung kata kunci → tolak
    if (!allowedKeywords.some(w => userText.includes(w))) {
      return new Response(
        JSON.stringify({
          reply: "Maaf, saya hanya bisa menjawab topik terkait keperawatan, medis, perhitungan dosis, dan aplikasi ZEDKalkulator."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ============================================
    //   Jawaban khusus: Pembuat aplikasi
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
    //   Jawaban khusus: Lokasi kerja pembuat
    // ============================================
    if (userText.includes("kerja") && userText.includes("khairul")) {
      return new Response(
        JSON.stringify({
          reply: "Muhammad Khairul Zed bekerja di **RSUD dr Doris Sylvanus**."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ============================================
    //           SYSTEM PROMPT KREATIF (UPGRADE)
    // ============================================
    const enhancedSystemPrompt = {
  role: "system",
  content: `
Kamu adalah ZED AI.

MODE JAWABAN:
1. Untuk percakapan umum (selain ZedKalkulator), kamu boleh menjawab BEBAS.
2. Jika pertanyaan menyangkut ZedKalkulator, fitur-fitur, cara kerja, link, atau hal terkait aplikasinya, maka kamu HARUS mengikuti aturan berikut:

DAFTAR FITUR RESMI ZEDKALKULATOR:
- Kalkulator Tetesan Infus
- Syringe Pump (Dengan Berat Badan & Tanpa BB)
- EBV | ABL | MABL (Kalkulator Anestesi)
- Kalkulator Insulin
- Kalkulator Pengenceran Obat
- Halaman About (informasi aplikasi)

ATURAN KHUSUS:
- Jangan menambah fitur yang tidak ada.
- Jika ditanya fitur yang tidak tersedia, jawab: "Maaf, fitur tersebut belum tersedia di ZedKalkulator."
- Jangan berikan informasi medis yang tidak berkaitan dengan aplikasi kecuali diminta secara jelas.

Di luar topik ZedKalkulator, kamu BEBAS menjawab apa pun seperti asisten biasa.
`
};

    // ============================================
    //       KIRIM KE GROQ API
    // ============================================
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [enhancedSystemPrompt, ...messages],
        temperature: 0.9,
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
