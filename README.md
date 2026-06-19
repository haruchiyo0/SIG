# SIGMA Flood

Prototype WebGIS mitigasi banjir Kota Bandar Lampung.

## Halaman

- `index.html` - Dashboard peta
- `data.html` - Data dan sumber
- `metodologi.html` - Metodologi pengolahan
- `tabel.html` - Tabel data
- `tentang.html` - Tentang aplikasi

## Menjalankan Lokal

```powershell
python -m http.server 8000
```

Buka:

```text
http://127.0.0.1:8000/
```

## Deploy GitHub Pages

1. Push semua file ke branch `main`.
2. Buka repository GitHub.
3. Masuk ke `Settings > Pages`.
4. Pada `Build and deployment`, pilih `Deploy from a branch`.
5. Pilih branch `main` dan folder `/ (root)`.
6. Klik `Save`.

Website akan tersedia di:

```text
https://haruchiyo0.github.io/SIG/
```

## Deploy Netlify

1. Buka Netlify dan pilih `Add new site > Import an existing project`.
2. Hubungkan repository GitHub `haruchiyo0/SIG`.
3. Gunakan pengaturan:
   - Build command: kosongkan
   - Publish directory: `.`
4. Klik `Deploy`.

File `netlify.toml` sudah disiapkan, jadi Netlify bisa langsung membaca konfigurasi publish dari repository.

## Deploy Vercel

1. Buka Vercel dan pilih `Add New > Project`.
2. Import repository GitHub `haruchiyo0/SIG`.
3. Gunakan pengaturan:
   - Framework Preset: `Other`
   - Build Command: kosongkan
   - Output Directory: `.`
4. Klik `Deploy`.

File `vercel.json` sudah disiapkan untuk URL bersih dan header GeoJSON.

## Catatan Data

Website ini menggunakan data OpenStreetMap, OSRM, GADM, dan data indikatif untuk kebutuhan prototype. Bukan sistem resmi untuk operasi darurat.
