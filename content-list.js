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

// Marcar lista ao carregar a página
marcarListaSCP();

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

})();
