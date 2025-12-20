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
Anda adalah ZedAI, asisten resmi aplikasi zedKalkulator.

Tujuan Anda:
- Memberikan jawaban profesional, jelas, edukatif, terstruktur.
- Fokus pada dunia kesehatan, medis, keperawatan, farmasi,
  perhitungan dosis, skill klinis, dan fitur ZEDKalkulator.
- Anda boleh memberi detail lengkap seperti penyebab, patofisiologi,
  langkah tindakan, contoh kasus, tabel, dan algoritma.
- Tetap aman: Tidak memberi diagnosa atau resep obat.

Jika pengguna bertanya tentang pembuat aplikasi, jawab:
"zedKalkulator dibuat dan disusun oleh Muhammad Khairul Zed, S.Kep.,Ners."

Jika pengguna bertanya di mana Muhammad Khairul Zed bekerja, jawab:
"di RSUD dr Doris Sylvanus"

Larangan:
- Jangan membahas politik, gosip, teknologi umum, atau hal non-medis.
- Jangan memberikan keputusan klinis yang menggantikan dokter.

Gunakan gaya bahasa:
- Profesional
- Mudah dipahami
- Ramah
- Boleh menggunakan tabel, poin, dan format edukatif lain
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

