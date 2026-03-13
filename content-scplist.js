const STORAGE_KEY = "scpList";

function getSCPNumber() {
  const url = location.pathname;
  const match = url.match(/scp-(\d+)/);
  return match ? match[1] : null;
}

let scp = getSCPNumber();
if (!scp) {
  console.log("Não é SCP");
} else {
  iniciarDeteccao();
}

function iniciarDeteccao() {

  let marcado = false;

  // Criar botão flutuante para marcar como lido/não lido
  const btn = document.createElement("button");
  btn.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 14px;
    background: black;
    color: white;
    border: none;
    border-radius: 6px;
    z-index: 9999;
    cursor: pointer;
    font-weight: bold;
  `;
  document.body.appendChild(btn);

  // Checar estado inicial
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const list = data[STORAGE_KEY] || {};

    marcado = !!list[scp];
    atualizarBotao();
  });

  // Scroll auto marcar (só se não marcado)
  window.addEventListener("scroll", () => {
    if (marcado) return;

    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 50) {
      marcar(true);
    }
  });

  // Clique manual toggle
  btn.onclick = () => {
    marcar(!marcado);
  };

  function marcar(valor) {
    marcado = valor;
    atualizarBotao();

    chrome.runtime.sendMessage({
      scpToggle: true,
      scp: scp,
      value: valor
    });
  }

  function atualizarBotao() {
    if (marcado) {
      btn.innerText = "❌ Desmarcar como lido";
      btn.style.background = "crimson";
    } else {
      btn.innerText = "✔ Marcar como lido";
      btn.style.background = "black";
    }
  }
}
