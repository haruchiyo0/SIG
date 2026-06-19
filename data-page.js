const dataVersion = "2026-06-19-genangan-refined-v5";

const datasets = [
  {
    key: "batas",
    name: "Batas Kecamatan",
    file: "data/batas_wilayah.geojson",
    source: "GADM 4.1",
    status: "Referensi administratif",
  },
  {
    key: "genangan",
    name: "Genangan Banjir",
    file: "data/genangan_banjir.geojson",
    source: "Prototype visual refined",
    status: "Indikatif",
  },
  {
    key: "rute",
    name: "Rute Evakuasi",
    file: "data/rute_evakuasi.geojson",
    source: "OSRM/OpenStreetMap",
    status: "Indikatif, perlu validasi",
  },
  {
    key: "prioritas",
    name: "Prioritas Evakuasi",
    file: "data/korban_terisolir.geojson",
    source: "Turunan genangan prototype",
    status: "Estimasi warga prioritas",
  },
  {
    key: "posko",
    name: "Posko Evakuasi",
    file: "data/posko_evakuasi.geojson",
    source: "Skenario sarana evakuasi",
    status: "Indikatif",
  },
  {
    key: "alat",
    name: "Sarana & Alat",
    file: "data/alat_berat.geojson",
    source: "Skenario operasional",
    status: "Indikatif",
  },
  {
    key: "sungai",
    name: "Sungai/Drainase",
    file: "data/sungai_drainase.geojson",
    source: "OpenStreetMap",
    status: "Data terbuka",
  },
  {
    key: "permukiman",
    name: "Kepadatan Permukiman",
    file: "data/kepadatan_permukiman.geojson",
    source: "Agregasi bangunan OSM",
    status: "Indeks turunan",
  },
  {
    key: "jalan",
    name: "Jalan OSM",
    file: "data/jalan.geojson",
    source: "OpenStreetMap",
    status: "Data terbuka",
  },
];

function dataUrl(file) {
  return `${file}?v=${dataVersion}`;
}

function statusClass(status) {
  const value = status.toLowerCase();
  if (value.includes("terbuka") || value.includes("referensi")) return "ok";
  if (value.includes("estimasi") || value.includes("turunan")) return "warn";
  return "alert";
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function renderKpis(store) {
  const totalPrioritas = store.prioritas.features.reduce((sum, feature) => sum + Number(feature.properties.jumlah_korban || 0), 0);
  const closedRoutes = store.rute.features.filter((feature) => feature.properties.status === "tertutup").length;
  const highFloods = store.genangan.features.filter((feature) => String(feature.properties.risiko || "").toLowerCase() === "tinggi").length;
  const totalAssets = store.alat.features.reduce((sum, feature) => sum + Number(feature.properties.jumlah || 0), 0);

  const cards = [
    ["Wilayah", store.batas.features.length],
    ["Genangan Tinggi", highFloods],
    ["Warga Prioritas", totalPrioritas],
    ["Rute Tertutup", closedRoutes],
    ["Posko", store.posko.features.length],
    ["Unit Sarana", totalAssets],
  ];

  document.getElementById("dataKpis").innerHTML = cards
    .map(([label, value]) => `<div class="data-kpi"><strong>${formatNumber(value)}</strong><span>${label}</span></div>`)
    .join("");
}

function renderDatasetRows(store) {
  const rows = datasets.map((dataset) => {
    const count = store[dataset.key]?.features?.length ?? 0;

    return `<tr>
      <td><strong>${dataset.name}</strong><span>${dataset.file}</span></td>
      <td>${formatNumber(count)} fitur</td>
      <td>${dataset.source}</td>
      <td><span class="status-pill ${statusClass(dataset.status)}">${dataset.status}</span></td>
    </tr>`;
  });

  document.getElementById("datasetRows").innerHTML = rows.join("");
}

function setupTableSearch() {
  const search = document.getElementById("tableSearch");
  const rows = () => Array.from(document.querySelectorAll("#datasetRows tr"));

  search.addEventListener("input", () => {
    const keyword = search.value.trim().toLowerCase();

    rows().forEach((row) => {
      row.hidden = keyword && !row.textContent.toLowerCase().includes(keyword);
    });
  });
}

async function initDataPage() {
  const entries = await Promise.all(
    datasets.map(async (dataset) => {
      const response = await fetch(dataUrl(dataset.file), { cache: "no-store" });
      const data = await response.json();

      return [dataset.key, data];
    })
  );
  const store = Object.fromEntries(entries);

  renderKpis(store);
  renderDatasetRows(store);
  setupTableSearch();
}

initDataPage();
