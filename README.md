# DraftDeal

Web app generik untuk membuat draft proposal jasa + hitungan ROI. Isi data discovery, ROI dihitung deterministik di kode, lalu Claude menulis proposal + 3 opsi paket.

Dibuat sebagai final project program Claude for Non-Tech Professional (MBCL Cohort 1).

## Prinsip

Angka uang tidak dikarang model. Semua hitungan ROI ada di [`lib/roi.ts`](lib/roi.ts) (ada self-check). Claude hanya menulis prosanya.

## Jalankan lokal

```bash
npm install
cp .env.example .env.local   # lalu isi GEMINI_API_KEY
npm run check                # self-check ROI
npm run dev                  # http://localhost:3000
```

ROI live jalan tanpa API key. Tombol "Buat Proposal" butuh `GEMINI_API_KEY`.

## Environment

| Var | Wajib | Default |
|---|---|---|
| `GEMINI_API_KEY` | ya (untuk generate) | - |
| `MODEL` | tidak | `gemini-2.5-flash` |

## Deploy

App ada di root repo ini.

- **Replit:** import repo ini dari GitHub. File `.replit` sudah disiapkan (Autoscale, Node 22, port 3000 -> 80). Pasang secret `GEMINI_API_KEY` di DUA tempat: pane Secrets (dev) dan pane Deployments (live).
- **Vercel:** import repo, framework Next.js terdeteksi otomatis, set env `GEMINI_API_KEY` di dashboard.

## Skrip

- `npm run dev` — server pengembangan
- `npm run build` — build produksi
- `npm run start` — jalankan hasil build (bind 0.0.0.0 untuk Replit)
- `npm run check` — self-check kalkulasi ROI
