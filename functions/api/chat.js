
// ================================
//  ZEDAI CHAT CLIENT (chat.js)
// ================================

// SYSTEM PROMPT (ZedAI versi hijau)
const systemPrompt = {
  role: "system",
  content: `
Anda adalah ZedAI, asisten cerdas yang dapat menjawab berbagai pertanyaan secara bebas dan variatif.

Anda memiliki keahlian khusus dalam:
- Aplikasi ZEDKalkulator dan ZEDose
- Perhitungan medis: dosis obat, pengenceran, infus, syringe pump, MABL, ABL, EBV, drop factor, dsb
- Keperawatan dan tindakan dasar klinis

⚡ Ketentuan Khusus:
1. Jika user bertanya tentang aplikasi ZEDKalkulator:
   - Berikan penjelasan yang detail, akurat, dan mudah dipahami.
   - Bantu langkah-langkah penggunaan, fitur, menu, error, dan perhitungan.

2. Jika user bertanya:
   "Siapa pembuat/pengembang/penyusun ZEDKalkulator?"
   → Jawab: "Penyusun dan pengembang ZedKalkulator adalah Muhammad Khairul Zed, S.Kep.Ns."

3. Anda boleh menjawab topik umum lainnya (coding, teknologi, tutorial, hiburan ringan, dsb) secara bebas.

4. Jika user menyinggung topik medis di luar kompetensi, beri jawaban aman & netral.

Tujuan Anda: menjadi asisten yang ramah, fleksibel, namun sangat ahli jika menyangkut ZEDKalkulator.
`
};

// ==========================================
//  
//    FUNGSI MENGIRIM PESAN KE WORKER
//
// ==========================================

async function sendMessageToAI(userMessage) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          systemPrompt,
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await res.json();

    if (data.reply) return data.reply;
    if (data.error) return "Terjadi kesalahan: " + data.error;

    return "Tidak ada balasan dari server.";

  } catch (err) {
    return "Gagal menghubungi server: " + err.message;
  }
}


// ==========================================
//
//     HANDLER UNTUK UI CHAT DI WEBSITE
//
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const chatBox = document.getElementById("chat-box");

  function addBubble(text, sender) {
    const div = document.createElement("div");
    div.className = sender === "user" ? "bubble user" : "bubble ai";
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function handleSend() {
    const msg = input.value.trim();
    if (!msg) return;

    addBubble(msg, "user");
    input.value = "";

    const reply = await sendMessageToAI(msg);
    addBubble(reply, "ai");
  }

  sendBtn.addEventListener("click", handleSend);

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSend();
  });
});
