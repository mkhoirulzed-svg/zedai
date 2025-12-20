export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    // ============================================
    //   FILTER: Hanya izinkan topik tertentu
    // ============================================
    const userText =
      messages[messages.length - 1]?.content?.toLowerCase() || "";

    const allowedKeywords = [
      "zedkalkulator", "zedose", "zed ai", "kalkulator infus",
      "syringe pump", "mabl", "abl", "ebv", "pengenceran obat",
      "perawat", "keperawatan", "asuhan keperawatan",
      "diagnosa keperawatan", "intervensi keperawatan",
      "tindakan keperawatan", "catatan keperawatan",
      "kesehatan", "medis", "kedokteran", "patofisiologi",
      "igd", "icu", "nicu", "picu",
      "vital sign", "tensi", "nadi", "suhu",
      "dosis", "obat", "infus",
      "alat medis", "alat kesehatan",
      "triage", "gawat darurat"
    ];

    // ============================================
//   MODE JAWAB BEBAS (NON MEDIS / UMUM)
// ============================================
const freeModeKeywords = [
  "apa itu",
  "jelaskan",
  "bagaimana",
  "kenapa",
  "mengapa",
  "contoh",
  "ringkas",
  "buatkan",
  "tolong",
  "bantu"
];

const isFreeMode = freeModeKeywords.some(k =>
  userText.startsWith(k) || userText.includes(k)
);

// Jika pertanyaan umum → lewati filter keyword
if (isFreeMode) {
  // lanjut ke AI tanpa ditolak
} else if (!allowedKeywords.some(w => userText.includes(w))) {
  return new Response(
    JSON.stringify({
      reply:
        "Maaf, saya hanya bisa menjawab topik medis, keperawatan, dan zedkalkulator."
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

   const isMedicalTopic = allowedKeywords.some(w =>
  userText.includes(w)
);

        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ==================================================
    //   🔒 SUMBER KEBENARAN FITUR (DITAMBAHKAN)
    // ==================================================
    const ZED_FEATURES = {
      "kalkulator infus": [
        "Hitung tetesan infus (tts/menit)",
        "Hitung kecepatan infus (ml/jam)",
        "Konversi tetesan ke flow rate"
      ],
      "syringe pump": [
        "Hitung kecepatan syringe pump (ml/jam)",
        "Konversi dosis obat ke kecepatan pompa"
      ],
      "ebv": ["Perhitungan Estimated Blood Volume (EBV)"],
      "abl": ["Perhitungan Allowable Blood Loss (ABL)"],
      "mabl": ["Perhitungan Maximum Allowable Blood Loss (MABL)"],
      "pengenceran obat": [
        "Konversi mg ke ml",
        "Perhitungan pengenceran obat injeksi"
        "Protap insulin"
    "Zed AI"
      ]
    };

    // ==================================================
    //   🧠 INTERSEP PERTANYAAN FITUR (ANTI SALAH)
    // ==================================================
    if (
      userText.includes("fitur") ||
      userText.includes("bisa apa") ||
      userText.includes("fungsi") ||
      userText.includes("menu")
    ) {
      let reply = "**Fitur Resmi ZEDKalkulator:**\n\n";

      for (const [fitur, list] of Object.entries(ZED_FEATURES)) {
        reply += `🔹 **${fitur.toUpperCase()}**\n`;
        list.forEach(item => {
          reply += `- ${item}\n`;
        });
        reply += "\n";
      }

      return new Response(
        JSON.stringify({ reply }),
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
      userText.includes("siapa pembuat")
    ) {
      return new Response(
        JSON.stringify({
          reply:
            "Aplikasi zedKalkulator dibuat dan disusun oleh **Muhammad Khairul Zed, S.Kep., Ners**."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ============================================
    //   SYSTEM PROMPT (DIKUNCI)
    // ============================================
    const enhancedSystemPrompt = {
      role: "system",
      content: `
Anda adalah ZedAI, asisten resmi aplikasi zedKalkulator.

Fitur resmi ZEDKalkulator HANYA:
- Kalkulator infus
- Syringe pump
- EBV, ABL, MABL
- Pengenceran obat
- Protap Insulin
- Ai zedcalc
Jangan menyebut fitur lain di luar daftar.
Jika ragu, katakan "fitur tersebut belum tersedia".

Berikan jawaban profesional, aman, dan edukatif.
`
    };

    // ============================================
    //       KIRIM KE GROQ API
    // ============================================
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
          messages: [enhancedSystemPrompt, ...messages],
          temperature: 0.3, // 🔥 lebih akurat
          stream: false
        })
      }
    );

    const groqData = await groqRes.json();
    const reply = groqData?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
