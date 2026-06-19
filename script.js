const map = L.map("map").setView([-5.3971, 105.2668], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const layers = {
  genangan: null,
  permukiman: null,
  rute: null,
  korban: null,
  posko: null,
  alat: null,
  sungai: null,
  jalan: null,
  batas: null,
};

const layerFiles = {
  genangan: "data/genangan_banjir.geojson",
  permukiman: "data/kepadatan_permukiman.geojson",
  rute: "data/rute_evakuasi.geojson",
  korban: "data/korban_terisolir.geojson",
  posko: "data/posko_evakuasi.geojson",
  alat: "data/alat_berat.geojson",
  sungai: "data/sungai_drainase.geojson",
  jalan: "data/jalan.geojson",
  batas: "data/batas_wilayah.geojson",
};

const dataVersion = "2026-06-19-genangan-refined-v5";

function getDataUrl(key) {
  return `${layerFiles[key]}?v=${dataVersion}`;
}

function getRiskColor(risk) {
  if (!risk) return "#118ab2";

  const value = risk.toLowerCase();
  if (value === "tinggi") return "#d90429";
  if (value === "sedang") return "#f77f00";
  if (value === "rendah") return "#06d6a0";

  return "#118ab2";
}

function styleGenangan(feature) {
  const risiko = feature.properties.risiko;

  return {
    color: getRiskColor(risiko),
    weight: 2,
    fillColor: getRiskColor(risiko),
    fillOpacity: 0.35,
  };
}

function stylePermukiman(feature) {
  const kelas = feature.properties.kelas_kepadatan;
  let color = "#f77f00";

  if (kelas === "Tinggi") color = "#ef476f";
  if (kelas === "Sedang") color = "#ffd166";
  if (kelas === "Rendah") color = "#06d6a0";

  return {
    color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.25,
  };
}

function styleRute(feature) {
  const status = feature.properties.status;
  let color = "#06d6a0";

  if (status === "terbatas") color = "#ffd166";
  if (status === "tertutup") color = "#ef476f";

  return {
    color,
    weight: 4,
    opacity: 0.86,
  };
}

function styleSungai() {
  return {
    color: "#118ab2",
    weight: 4,
    opacity: 0.85,
  };
}

function styleBatas(feature) {
  const color = feature.properties.risiko_dominan === "-" ? "#111827" : getRiskColor(feature.properties.risiko_dominan);

  return {
    color,
    weight: 2,
    opacity: 0.72,
    fillOpacity: 0,
    dashArray: "6 6",
  };
}

function styleJalan(feature) {
  const kelas = feature.properties.kelas_jalan;
  let weight = 2;
  let color = "#64748b";

  if (kelas === "trunk" || kelas === "primary") {
    weight = 4;
    color = "#334155";
  } else if (kelas === "secondary" || kelas === "tertiary") {
    weight = 3;
    color = "#475569";
  }

  return {
    color,
    weight,
    opacity: 0.72,
  };
}

function korbanMarker(feature, latlng) {
  return L.circleMarker(latlng, {
    radius: 9,
    color: "#ffffff",
    weight: 2,
    fillColor: "#d90429",
    fillOpacity: 1,
  });
}

function poskoMarker(feature, latlng) {
  return L.circleMarker(latlng, {
    radius: 10,
    color: "#ffffff",
    weight: 2,
    fillColor: "#7c3aed",
    fillOpacity: 1,
  });
}

function alatMarker(feature, latlng) {
  return L.circleMarker(latlng, {
    radius: 9,
    color: "#ffffff",
    weight: 2,
    fillColor: "#ffd166",
    fillOpacity: 1,
  });
}

function popupGenangan(feature) {
  const p = feature.properties;
  const kedalaman = p.kedalaman ?? p.kedalaman_cm ?? "-";

  return `<span class="popup-title">Area Genangan Banjir</span><br>Lokasi: ${p.lokasi}<br>Kedalaman: ${kedalaman} cm<br>Risiko: ${p.risiko}<br>Dampak: ${p.dampak}<br><span class="popup-badge red">Genangan</span>`;
}

function popupPermukiman(feature) {
  const p = feature.properties;

  return `<span class="popup-title">Kepadatan Permukiman</span><br>Wilayah: ${p.wilayah ?? p.kecamatan}<br>Jumlah bangunan: ${p.jumlah_bangunan ?? "-"}<br>Indeks kepadatan: ${p.kepadatan_per_km2} bangunan/km²<br>Kelas: ${p.kelas_kepadatan}<br>Sumber: ${p.sumber_data ?? "-"}`;
}

function popupRute(feature) {
  const p = feature.properties;
  const badgeClass = p.status === "aman" ? "green" : p.status === "terbatas" ? "yellow" : "red";

  return `<span class="popup-title">Rute Evakuasi</span><br>Nama Rute: ${p.nama_rute}<br>Status: ${p.status}<br>Jarak: ${p.jarak_km ?? "-"} km<br>Estimasi: ${p.estimasi_menit} menit<br>Tujuan: ${p.posko_tujuan ?? "-"}<br>Metode: ${p.metode_rute ?? "-"}<br>Catatan: ${p.catatan}<br>Sumber: ${p.sumber_geometri ?? "-"}<br><span class="popup-badge ${badgeClass}">${p.status.toUpperCase()}</span>`;
}

function popupKorban(feature) {
  const p = feature.properties;
  const jenisData = p.jenis_data ?? "Titik korban terisolir";
  const statusData = p.status_data ?? "Data operasional";

  return `<span class="popup-title">${jenisData}</span><br>Lokasi: ${p.lokasi}<br>Kecamatan: ${p.kecamatan}<br>Jumlah prioritas: ${p.jumlah_korban} orang<br>Genangan: ${p.genangan_cm} cm<br>Prioritas: ${p.prioritas}<br>Kebutuhan: ${p.kebutuhan}<br>Status data: ${statusData}<br><span class="popup-badge red">PRIORITAS ${p.prioritas.toUpperCase()}</span>`;
}

function popupAlat(feature) {
  const p = feature.properties;

  return `<span class="popup-title">Lokasi Sarana Evakuasi</span><br>Jenis: ${p.jenis}<br>Kategori: ${p.kategori ?? "-"}<br>Jumlah: ${p.jumlah} unit<br>Status: ${p.status}<br>Posko: ${p.posko}<br>Wilayah layanan: ${p.wilayah_layanan ?? "-"}<br>Fungsi: ${p.fungsi ?? "-"}<br>Kontak: ${p.kontak}<br>Tingkat kepercayaan: ${p.tingkat_kepercayaan ?? "-"}<br><span class="popup-badge yellow">${p.status.toUpperCase()}</span>`;
}

function popupPosko(feature) {
  const p = feature.properties;

  return `<span class="popup-title">Posko Evakuasi</span><br>Nama: ${p.nama_posko}<br>Status: ${p.status}<br>Kapasitas: ${p.kapasitas_orang} orang<br>Fasilitas: ${p.fasilitas}<br>Wilayah layanan: ${p.wilayah_layanan}<br>Kontak: ${p.kontak}<br>Sumber: ${p.sumber_data}`;
}

function popupBatas(feature) {
  const p = feature.properties;

  return `<span class="popup-title">Batas Kecamatan</span><br>Kecamatan: ${p.nama_wilayah}<br>Kota: ${p.kota ?? "-"}<br>Provinsi: ${p.provinsi ?? "-"}<br>Jenis: ${p.jenis_batas}<br>Catatan: ${p.catatan}`;
}

function popupJalan(feature) {
  const p = feature.properties;

  return `<span class="popup-title">Jaringan Jalan OSM</span><br>Nama: ${p.nama_jalan}<br>Kelas: ${p.kelas_jalan}<br>Permukaan: ${p.permukaan}<br>Sumber: ${p.sumber_data}`;
}

async function loadLayer(key, addToMap = true) {
  const response = await fetch(getDataUrl(key), { cache: "no-store" });
  const data = await response.json();
  let geoLayer;

  if (key === "genangan") {
    geoLayer = L.geoJSON(data, {
      style: styleGenangan,
      onEachFeature: (feature, layer) => layer.bindPopup(popupGenangan(feature)),
    });
  }

  if (key === "permukiman") {
    geoLayer = L.geoJSON(data, {
      style: stylePermukiman,
      onEachFeature: (feature, layer) => layer.bindPopup(popupPermukiman(feature)),
    });
  }

  if (key === "rute") {
    geoLayer = L.geoJSON(data, {
      style: styleRute,
      onEachFeature: (feature, layer) => layer.bindPopup(popupRute(feature)),
    });
  }

  if (key === "korban") {
    geoLayer = L.geoJSON(data, {
      pointToLayer: korbanMarker,
      onEachFeature: (feature, layer) => layer.bindPopup(popupKorban(feature)),
    });
  }

  if (key === "posko") {
    geoLayer = L.geoJSON(data, {
      pointToLayer: poskoMarker,
      onEachFeature: (feature, layer) => layer.bindPopup(popupPosko(feature)),
    });
  }

  if (key === "alat") {
    geoLayer = L.geoJSON(data, {
      pointToLayer: alatMarker,
      onEachFeature: (feature, layer) => layer.bindPopup(popupAlat(feature)),
    });
  }

  if (key === "sungai") {
    geoLayer = L.geoJSON(data, {
      style: styleSungai,
      onEachFeature: (feature, layer) => {
        const p = feature.properties;

        layer.bindPopup(`<span class="popup-title">Sungai/Drainase</span><br>Nama: ${p.nama}<br>Kondisi: ${p.kondisi}`);
      },
    });
  }

  if (key === "jalan") {
    geoLayer = L.geoJSON(data, {
      style: styleJalan,
      onEachFeature: (feature, layer) => layer.bindPopup(popupJalan(feature)),
    });
  }

  if (key === "batas") {
    geoLayer = L.geoJSON(data, {
      style: styleBatas,
      onEachFeature: (feature, layer) => layer.bindPopup(popupBatas(feature)),
    });
  }

  layers[key] = geoLayer;
  if (addToMap) geoLayer.addTo(map);

  return data;
}

function toggleLayer(checkboxId, layerKey) {
  const checkbox = document.getElementById(checkboxId);

  checkbox.addEventListener("change", () => {
    if (!layers[layerKey]) return;

    if (checkbox.checked) layers[layerKey].addTo(map);
    else map.removeLayer(layers[layerKey]);
  });
}

function setupOptionalLayer(checkboxId, layerKey) {
  const checkbox = document.getElementById(checkboxId);

  checkbox.addEventListener("change", async () => {
    if (!layers[layerKey]) await loadLayer(layerKey, false);

    if (checkbox.checked) layers[layerKey].addTo(map);
    else map.removeLayer(layers[layerKey]);
  });
}

function filterRoutes(status) {
  if (!layers.rute) return;

  layers.rute.clearLayers();

  fetch(getDataUrl("rute"), { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      const filtered = {
        type: "FeatureCollection",
        features: status === "all" ? data.features : data.features.filter((feature) => feature.properties.status === status),
      };

      layers.rute.addData(filtered);
    });
}

function filterFloods(risk) {
  if (!layers.genangan) return;

  layers.genangan.clearLayers();

  fetch(getDataUrl("genangan"), { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      const filtered = {
        type: "FeatureCollection",
        features: risk === "all" ? data.features : data.features.filter((feature) => String(feature.properties.risiko || "").toLowerCase() === risk),
      };

      layers.genangan.addData(filtered);
    });
}

function filterPriorities(priority) {
  if (!layers.korban) return;

  layers.korban.clearLayers();

  fetch(getDataUrl("korban"), { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      const filtered = {
        type: "FeatureCollection",
        features: priority === "all" ? data.features : data.features.filter((feature) => feature.properties.prioritas === priority),
      };

      layers.korban.addData(filtered);
    });
}

function setupRouteFilters() {
  document.querySelectorAll(".route-filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".route-filter").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      filterRoutes(button.dataset.filter);
    });
  });
}

function setupFloodFilters() {
  document.querySelectorAll(".flood-filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".flood-filter").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      filterFloods(button.dataset.filter);
    });
  });
}

function setupPriorityFilters() {
  document.querySelectorAll(".priority-filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".priority-filter").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      filterPriorities(button.dataset.filter);
    });
  });
}

function setupAreaSelect(boundaryData) {
  const select = document.getElementById("areaSelect");

  boundaryData.features
    .sort((a, b) => a.properties.nama_wilayah.localeCompare(b.properties.nama_wilayah))
    .forEach((feature) => {
      const option = document.createElement("option");
      option.value = feature.properties.nama_wilayah;
      option.textContent = feature.properties.nama_wilayah;
      select.appendChild(option);
    });

  select.addEventListener("change", () => {
    if (!select.value || !layers.batas) return;

    layers.batas.eachLayer((layer) => {
      if (layer.feature?.properties?.nama_wilayah === select.value) {
        map.fitBounds(layer.getBounds(), { maxZoom: 14, padding: [24, 24] });
        layer.openPopup();
      }
    });
  });
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  const button = document.getElementById("searchBtn");

  function runSearch() {
    const keyword = input.value.trim().toLowerCase();
    if (!keyword) return;

    let found = false;

    Object.values(layers).forEach((layerGroup) => {
      if (!layerGroup) return;

      layerGroup.eachLayer((layer) => {
        const props = layer.feature?.properties || {};
        const values = Object.values(props).join(" ").toLowerCase();

        if (values.includes(keyword) && !found) {
          found = true;

          if (layer.getLatLng) {
            map.setView(layer.getLatLng(), 15);
            layer.openPopup();
          } else if (layer.getBounds) {
            map.fitBounds(layer.getBounds(), { maxZoom: 15 });
            layer.openPopup();
          }
        }
      });
    });

    if (!found) alert("Lokasi tidak ditemukan di data prototype.");
  }

  button.addEventListener("click", runSearch);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runSearch();
  });
}

function updateSummary(korbanData, ruteData, alatData, poskoData, batasData, genanganData) {
  const totalKorban = korbanData.features.reduce((sum, feature) => sum + Number(feature.properties.jumlah_korban || 0), 0);
  const totalRuteAman = ruteData.features.filter((feature) => feature.properties.status === "aman").length;
  const totalRuteTertutup = ruteData.features.filter((feature) => feature.properties.status === "tertutup").length;
  const totalAlat = alatData.features.reduce((sum, feature) => sum + Number(feature.properties.jumlah || 0), 0);

  document.getElementById("totalKorban").textContent = totalKorban;
  document.getElementById("totalRuteAman").textContent = totalRuteAman;
  document.getElementById("totalRuteTertutup").textContent = totalRuteTertutup;
  document.getElementById("totalPosko").textContent = poskoData.features.length;
  document.getElementById("totalWilayah").textContent = batasData.features.length;
  document.getElementById("totalAlat").textContent = totalAlat;

  const priorityList = document.getElementById("priorityList");
  priorityList.innerHTML = "";

  korbanData.features
    .sort((a, b) => Number(b.properties.genangan_cm) - Number(a.properties.genangan_cm))
    .forEach((feature, index) => {
      const p = feature.properties;
      const item = document.createElement("div");

      item.className = "priority-item";
      item.innerHTML = `<strong>${index + 1}. ${p.lokasi}</strong>${p.jumlah_korban} warga prioritas | Genangan ${p.genangan_cm} cm | ${p.prioritas}`;
      priorityList.appendChild(item);
    });

  const highestFlood = [...genanganData.features].sort((a, b) => Number(b.properties.kedalaman || 0) - Number(a.properties.kedalaman || 0))[0];
  const closedRoutes = ruteData.features.filter((feature) => feature.properties.status === "tertutup");
  const analysisList = document.getElementById("analysisList");
  analysisList.innerHTML = `
    <p><strong>Genangan terdalam:</strong> ${highestFlood.properties.lokasi}, ${highestFlood.properties.kedalaman ?? "-"} cm.</p>
    <p><strong>Rute tertutup:</strong> ${closedRoutes.length ? closedRoutes.map((feature) => feature.properties.lokasi_asal || feature.properties.nama_rute.split(" - ")[0]).join(", ") : "Tidak ada"}.</p>
    <p><strong>Prioritas tertinggi:</strong> ${korbanData.features.filter((feature) => feature.properties.prioritas === "Tinggi").length} titik perlu respons cepat.</p>
  `;
}

async function init() {
  await Promise.all([
    loadLayer("genangan"),
    loadLayer("permukiman"),
    loadLayer("rute"),
    loadLayer("korban"),
    loadLayer("posko"),
    loadLayer("alat"),
    loadLayer("sungai"),
    loadLayer("batas"),
  ]);

  toggleLayer("toggleBatas", "batas");
  toggleLayer("toggleGenangan", "genangan");
  toggleLayer("togglePermukiman", "permukiman");
  toggleLayer("toggleRute", "rute");
  toggleLayer("toggleKorban", "korban");
  toggleLayer("togglePosko", "posko");
  toggleLayer("toggleAlat", "alat");
  toggleLayer("toggleSungai", "sungai");
  setupOptionalLayer("toggleJalan", "jalan");
  setupRouteFilters();
  setupFloodFilters();
  setupPriorityFilters();
  setupSearch();

  const [korbanData, ruteData, alatData, poskoData, batasData, genanganData] = await Promise.all([
    fetch(getDataUrl("korban"), { cache: "no-store" }).then((response) => response.json()),
    fetch(getDataUrl("rute"), { cache: "no-store" }).then((response) => response.json()),
    fetch(getDataUrl("alat"), { cache: "no-store" }).then((response) => response.json()),
    fetch(getDataUrl("posko"), { cache: "no-store" }).then((response) => response.json()),
    fetch(getDataUrl("batas"), { cache: "no-store" }).then((response) => response.json()),
    fetch(getDataUrl("genangan"), { cache: "no-store" }).then((response) => response.json()),
  ]);

  setupAreaSelect(batasData);
  updateSummary(korbanData, ruteData, alatData, poskoData, batasData, genanganData);
}

init();
