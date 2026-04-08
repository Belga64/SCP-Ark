document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "scpList";

  

  let currentSeries = 1;
  let currentFilter = "none"; // none, unreadFirst, readFirst

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
  function animateListUpdate(callback) {
    const container = document.getElementById("scpList");

    // inicia fade out
    container.classList.add("fade-out");

    // espera a animação terminar
    setTimeout(() => {
      callback(); // atualiza conteúdo

      // força reflow (ESSENCIAL pra evitar glitch)
      void container.offsetHeight;

      // remove fade-out e aplica fade-in
      container.classList.remove("fade-out");
      container.classList.add("fade-in");

      setTimeout(() => {
        container.classList.remove("fade-in");
      }, 200);

    }, 200);
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
    container.innerHTML = "";
    
   let scps = await getCachedSCPList();
   scps = filterBySeries(scps);

   const data = await new Promise(resolve =>
    chrome.storage.local.get(STORAGE_KEY, resolve)
   );
   
   const list = data[STORAGE_KEY] || {};

     scps = applyReadFilter(scps, list);

  

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
    animateListUpdate(() => renderList(searchValue));
  });
});
// botão padrão
document.querySelector('#tabs button[data-range="1"]').classList.add("active");

// Eventos dos  filtros de leitura
document.querySelectorAll("#filters button").forEach(btn => {
  btn.addEventListener("click", () => {

    currentFilter = btn.dataset.filter;

    //botão ativo
    document.querySelectorAll("#filters button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    animateListUpdate(() => renderList(document.getElementById("search").value));
  });
});

// padrão sem filtro
document.querySelector('#filters button[data-filter="none"]').classList.add("active");



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

  function applyReadFilter(scps, list) {
    let result = [...scps];

    if (currentFilter === "unreadFirst") {
      result.sort((a, b) => (list[a] ? 1 : 0) - (list[b] ? 1 : 0));
    }

    if (currentFilter === "readFirst") {
      result.sort((a, b) => (list[b] ? 1 : 0) - (list[a] ? 1 : 0));
    }

    return result;
  }




});
