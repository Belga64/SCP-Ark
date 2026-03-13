(() => {

const STORAGE_KEY = "scpList";

const iconRead = chrome.runtime.getURL("icons/read.png");
const iconUnread = chrome.runtime.getURL("icons/unread.png");

let cacheList = {}; // Cache local da lista para acesso rápido no content-scplist.js

function marcarListaSCP() {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    cacheList = data[STORAGE_KEY] || {};
    atualizarIcons(cacheList);
  });
}

function atualizarIcons(list) {
  const links = document.querySelectorAll('a[href*="/scp-"]');

  links.forEach(link => {
    const match = link.href.match(/scp-(\d+)/);
    if (!match) return;

    const scp = match[1];

    let icon = link.querySelector(".scp-order-icon");
    if (!icon) {
      icon = document.createElement("img");
      icon.className = "scp-order-icon";
      icon.style.width = "18px";
      icon.style.height = "18px";
      icon.style.marginRight = "6px";
      icon.style.verticalAlign = "middle";
      icon.style.cursor = "pointer";
      icon.style.opacity = "0.8";

      link.prepend(icon);

      // Clique no icone para toggle lido/não lido 
      icon.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        cacheList[scp] = !cacheList[scp];

        chrome.storage.local.set({ [STORAGE_KEY]: cacheList });

        // Atualizar ícone imediatamente para feedback rápido
        icon.src = cacheList[scp] ? iconRead : iconUnread;
        icon.style.opacity = "1";
      };
    }

    icon.src = list[scp] ? iconRead : iconUnread;
    icon.title = list[scp] ? "SCP lido (clique para desmarcar)" : "SCP não lido (clique para marcar)";
  });
}

// Função para aplicar filtro de exibição 

function applyFilter(type) {

  chrome.storage.local.get("scpList", (data) => {

    const list = data.scpList || {};

    const links = Array.from(
      document.querySelectorAll("#page-content a[href*='/scp-']")
    );

    const items = links.map((link, index) => {

      const match = link.href.match(/scp-(\d+)/);
      if (!match) return null;

      const scp = match[1];

      const li = link.closest("li");
      if (!li) return null;

      // salvar índice original
      if (!li.dataset.originalIndex) {
        li.dataset.originalIndex = index;
      }

      return {
        scp,
        read: !!list[scp],
        element: li,
        originalIndex: parseInt(li.dataset.originalIndex)
      };

    }).filter(Boolean);

    if (items.length === 0) return;

    const container = items[0].element.parentElement;

    let sorted = [...items];

    if (type === "unreadFirst") {
      sorted.sort((a, b) => a.read - b.read);
    }

    if (type === "readFirst") {
      sorted.sort((a, b) => b.read - a.read);
    }

    if (type === "none") {
      sorted.sort((a, b) => a.originalIndex - b.originalIndex);
    }

    sorted.forEach(item => {
      container.appendChild(item.element);
    });

  });

}



// Filtro de pesquisa na página

function createFilterPanel() {
  if (document.getElementById("scpFilterPanel")) return;

  const panel = document.createElement("div");
  panel.id = "scpFilterPanel";

  panel.style = `
    position: sticky;
    top: 0;
    background: #111;
    color: white;
    padding: 8px;
    z-index: 9999;
    border-bottom: 1px solid #444;
    font-size: 14px;
  `;

  panel.innerHTML = `
    <strong>SCP Ark:</strong>
    <button id="filterNone">No Filter</button>
    <button id="filterUnreadFirst">Unread First</button>
    <button id="filterReadFirst">Read First</button>
  `;

  document.body.prepend(panel);

  document.getElementById("filterNone").onclick = () => applyFilter("none");
  document.getElementById("filterUnreadFirst").onclick = () => applyFilter("unreadFirst");
  document.getElementById("filterReadFirst").onclick = () => applyFilter("readFirst");
}




// Observer para páginas dinâmicas
const observer = new MutationObserver(marcarListaSCP);
observer.observe(document.body, { childList: true, subtree: true });

// Atualizar ícones se a lista mudar (ex: popup.js)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    cacheList = changes[STORAGE_KEY].newValue || {};
    atualizarIcons(cacheList);
  }
});

createFilterPanel();
marcarListaSCP();


})();

