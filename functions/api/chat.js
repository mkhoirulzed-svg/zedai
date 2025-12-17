// ================================
//  ZEDAI CHAT CLIENT (chat.js)
// ================================

// SYSTEM PROMPT dimasukkan ke awal array setiap kali request
function getSystemPrompt() {
  return {
    role: "system",
    content: `
Anda adalah ZedAI, asisten cerdas yang dapat menjawab berbagai pertanyaan secara bebas dan variatif.

Keahlian:
- Aplikasi ZEDKalkulator & ZEDose
- Perhitungan medis (dosis, infus, syringe pump, MABL, EBV, ABL)
- Keperawatan & tindakan dasar

Ketentuan:
1. Jika ditanya tentang aplikasi ZEDKalkulator, jelaskan lengkap.
2. Jika ditanya siapa pembuat atau penyusun ZEDKalkulator →
   Jawab: "Penyusun dan pengembang ZedKalkulator adalah Muhammad Khairul Zed, S.Kep.Ns."
3. Boleh jawab topik umum lainnya secara bebas & ramah.
4. Jika topik medis berisiko, beri jawaban aman.

Anda harus menjadi asisten yang ramah & ahli terutama terkait ZEDKalkulator.
`
  };
}


// ==========================================
// FUNGSI MENGIRIM PESAN KE SERVER WORKER
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
          getSystemPrompt(),           // prompt sistem selalu ikut
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await res.json();

    if (data.reply) return data.reply;
    if (data.error) return "Terjadi kesalahan server: " + data.error;

    return "Tidak ada balasan dari server.";

  } catch (err) {
    return "Gagal menghubungi server: " + err.message;
  }
}


// ==========================================
// HANDLE UI CHAT
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
