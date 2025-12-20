
// ==============================
// CHAT.JS FRONT-END
// ==============================

// Riwayat percakapan (supaya AI ingat konteks)
let conversation = [];

async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  // Tambahkan pesan user ke percakapan
  conversation.push({
    role: "user",
    content: text
    // kamu juga bisa menambah id user, dsb jika perlu
  });

  // Tampilkan pesan user
  addMessageToChat("User", text);

  input.value = "";
  input.disabled = true;

  // ================================
  // KIRIM KE WORKER CLOUDLFARE
  // ================================
  try {
    const res = await fetch("/api", {      // <--- endpoint worker kamu
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversation
      })
    });

    const data = await res.json();

    // Jika worker ada error
    if (data.error) {
      addMessageToChat("ZedAI (error)", data.error);
      input.disabled = false;
      return;
    }

    const reply = data.reply || "(Tidak ada jawaban)";
    addMessageToChat("ZedAI", reply);

    // Tambahkan balasan AI ke riwayat
    conversation.push({
      role: "assistant",
      content: reply
    });

  } catch (e) {
    addMessageToChat("ZedAI (error)", "Server tidak merespon.");
  }

  input.disabled = false;
}


// ==============================
// Fungsi menampilkan chat
// ==============================
function addMessageToChat(sender, text) {
  const chatBox = document.getElementById("chat-box");

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.innerHTML = `<strong>${sender}:</strong> ${text}`;

  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}


// ==============================
// Enter untuk mengirim
// ==============================
document.getElementById("user-input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});
