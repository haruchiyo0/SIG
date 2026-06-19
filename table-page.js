const dataVersion = "2026-06-19-genangan-refined-v5";

function dataUrl(file) {
  return `${file}?v=${dataVersion}`;
}

function statusClass(status) {
  return String(status || "").toLowerCase();
}

async function loadJson(file) {
  const response = await fetch(dataUrl(file), { cache: "no-store" });
  return response.json();
}

function setupTableSearch() {
  const search = document.getElementById("tableSearch");

  search.addEventListener("input", () => {
    const keyword = search.value.trim().toLowerCase();

    document.querySelectorAll(".searchable-table tbody tr").forEach((row) => {
      row.hidden = keyword && !row.textContent.toLowerCase().includes(keyword);
    });
  });
}

async function initTablePage() {
  const [routes, priorities, posko, floods] = await Promise.all([
    loadJson("data/rute_evakuasi.geojson"),
    loadJson("data/korban_terisolir.geojson"),
    loadJson("data/posko_evakuasi.geojson"),
    loadJson("data/genangan_banjir.geojson"),
  ]);

  document.getElementById("routeRows").innerHTML = routes.features.map((feature) => {
    const p = feature.properties;
    return `<tr><td>${p.nama_rute}</td><td><span class="status-pill ${statusClass(p.status)}">${p.status}</span></td><td>${p.jarak_km} km</td></tr>`;
  }).join("");

  document.getElementById("priorityRows").innerHTML = priorities.features
    .sort((a, b) => Number(b.properties.genangan_cm) - Number(a.properties.genangan_cm))
    .map((feature) => {
      const p = feature.properties;
      return `<tr><td>${p.lokasi}</td><td><span class="status-pill ${statusClass(p.prioritas)}">${p.prioritas}</span></td><td>${p.genangan_cm} cm</td></tr>`;
    }).join("");

  document.getElementById("poskoRows").innerHTML = posko.features.map((feature) => {
    const p = feature.properties;
    return `<tr><td>${p.nama_posko}</td><td>${p.kapasitas_orang} orang</td><td>${p.fasilitas}</td></tr>`;
  }).join("");

  document.getElementById("floodRows").innerHTML = floods.features.map((feature) => {
    const p = feature.properties;
    return `<tr><td>${p.lokasi}</td><td><span class="status-pill ${statusClass(p.risiko)}">${p.risiko}</span></td><td>${p.kedalaman} cm</td></tr>`;
  }).join("");

  setupTableSearch();
}

initTablePage();
