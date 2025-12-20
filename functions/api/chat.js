
const input = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");

function appendMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = role === "user" ? "user-bubble" : "ai-bubble";
  bubble.textContent = text;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
  return bubble;
}

function typeWriterEffect(element, text, speed = 20) {
  let i = 0;
  element.textContent = "";
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";

  // bubble kosong untuk typing AI
  const aiBubble = appendMessage("assistant", "");

  const res = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      messages: [{ role: "user", content: text }]
    })
  });

  const data = await res.json();
  const reply = data.reply || "Error";

  // animasi mengetik
  typeWriterEffect(aiBubble, reply);
}
