document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "scpList";

  

  let currentSeries = 1;


  // Fetch da lista de SCPs 

  async function fetchSCPList() {
    const pages = [
      "https://scp-wiki.wikidot.com/scp-series",
      "https://scp-wiki.wikidot.com/scp-series-2",
      "https://scp-wiki.wikidot.com/scp-series-3",
      "https://scp-wiki.wikidot.com/scp-series-4",
      "https://scp-wiki.wikidot.com/scp-series-5",
      "https://scp-wiki.wikidot.com/scp-series-6",
      "https://scp-wiki.wikidot.com/scp-series-7",
      "https://scp-wiki.wikidot.com/scp-series-8",
      "https://scp-wiki.wikidot.com/scp-series-9",
      "https://scp-wiki.wikidot.com/scp-series-10",
    ];
    
    let scps = [];

    for (const url of pages) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        const links = doc.querySelectorAll('#page-content a');

        links.forEach(link => {
          const text = link.textContent;
           const href = link.getAttribute("href") || "";

          const match =
          text.match(/SCP-(\d{3,4})/) ||
          href.match(/scp-(\d{3,4})/i);
          if (match) {
            scps.push(match[1].padStart(3, "0"));
          }
        });

      } catch (err) {
        console.error("Error fetching SCP list from", url, err);
      }
    }

    return [...new Set(scps)].sort((a, b) => a - b);
  }

  // Cache da lista para evitar fetchs repetidos

  function getCachedSCPList() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["cachedSCPs", "lastUpdate"], async (data) => {

        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (!data.cachedSCPs || !data.lastUpdate || (now - data.lastUpdate) > ONE_DAY) {
          const scps = await fetchSCPList();

          chrome.storage.local.set({
            cachedSCPs: scps,
            lastUpdate: now
          });
          
          resolve(scps);
        } else {
          resolve(data.cachedSCPs);
        }
      });
    });
  }
   
  // Carregar lista e marcar os checkboxes

  function loadSaved()  {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const list = data[STORAGE_KEY] || {};

      document.querySelectorAll("input[type='checkbox']").forEach(cb => {
        if (list[cb.dataset.scp]) {
          cb.checked = true;
        }
      });
    });
  }

  // Salvar estado ao clicar no checkbox

  function save(scp, checked) {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const list = data[STORAGE_KEY] || {};

      list[scp] = checked;

      chrome.storage.local.set({ [STORAGE_KEY]: list });
    });
  }

  // Renderizar a lista de SCPs no popup

  async function renderList(filter = "") {
    const container = document.getElementById("scpList");
    container.innerHTML = "Loading...";
    
    let scps = await getCachedSCPList();
    scps = filterBySeries(scps);

    container.innerHTML = "";

    scps.forEach(scp => {
      if (!scp.includes(filter)) return;

      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" data-scp="${scp}"> SCP-${scp}`;

      container.appendChild(label);
      container.appendChild(document.createElement("br"));
    });

    loadSaved();
  }

  // Eventos

  document.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      save(e.target.dataset.scp, e.target.checked);
    }
  });

  document.getElementById("search").addEventListener("input", (e) => {
    renderList(e.target.value);
  });


  // Eventos tabs
document.querySelectorAll("#tabs button").forEach(btn => {
  btn.addEventListener("click", () => {

    currentSeries = parseInt(btn.dataset.range);

    document.querySelectorAll("#tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const searchValue = document.getElementById("search").value;
    renderList(searchValue);
  });
});

// botão padrão
document.querySelector('#tabs button[data-range="1"]').classList.add("active");


  // Inicialização

  renderList();


  // Função para filtrar por série

  function filterBySeries(scps) {
    const start = (currentSeries - 1) * 1000 + 1;
    const end = currentSeries * 1000;

    return scps.filter(scp => {
      const num = parseInt(scp);
      return num >= start && num <= end;
    });
  }


});
