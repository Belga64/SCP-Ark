document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("scpList");
  const search = document.getElementById("search");
  const TOTAL_SCP = 9999;

  function renderList(filter = "") {
    container.innerHTML = "";

    for (let i = 1; i <= TOTAL_SCP; i++) {
      const scp = i.toString().padStart(3, "0");
      if (!scp.includes(filter)) continue;

      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" id="scp-${scp}" data-scp="${scp}">
        SCP-${scp}
      `;
      container.appendChild(label);
      container.appendChild(document.createElement("br"));
    }

    loadSaved();
  }

  function loadSaved() {
    chrome.storage.local.get("scpList", (data) => {
      const lidos = data.scpList || {};

      document.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (lidos[cb.dataset.scp]) cb.checked = true;
      });
    });
  }

  function save(scp, checked) {
    chrome.storage.local.get("scpList", (data) => {
      const lidos = data.scpList || {};
      lidos[scp] = checked;
      chrome.storage.local.set({ scpList: lidos });
    });
  }

  document.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      save(e.target.dataset.scp, e.target.checked);
    }
  });

  search.addEventListener("input", () => {
    renderList(search.value);
  });

  renderList();
});
