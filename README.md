# Google Card Review — Landing Page

Situs statis untuk kartu NFC & QR ulasan Google. Tanpa build tool, tanpa
dependensi, tanpa framework. Cukup buka `index.html`.

---

## 1. Struktur Berkas

```
index.html                Halaman utama (18 section)
style.css                 Semua gaya + tema terang/gelap
script.js                 Tilt 3D, tema, menu, demo, kalkulator, form, analitik

privasi.html              Kebijakan Privasi
syarat-ketentuan.html     Syarat & Ketentuan

assets/
  favicon.svg             Favicon (dipakai browser modern)
  og-image.svg           Gambar bagikan (Open Graph) — sumber untuk PNG
  og-image.png            <-- hasil generate dari tools/
  apple-touch-icon.png    <-- hasil generate
  favicon-16.png          <-- hasil generate
  favicon-32.png          <-- hasil generate
  icon-192.png            <-- hasil generate
  icon-512.png            <-- hasil generate
  video-demo.mp4          <-- OPSIONAL, lihat bagian 4

tools/
  make-images.html        Generator PNG (hanya untuk sekali pakai, hapus setelah)

robots.txt                Petunjuk untuk search engine
sitemap.xml               Peta halaman (ganti domainnya)
site.webmanifest          Manifest PWA
_headers                  Aturan cache + header keamanan (Netlify)
```

---

## 2. WAJIB: Ganti-placeholder

Cari dan ganti **sebelum** situs ditayangkan:

| Yang | Di mana | Nilai sekarang |
|---|---|---|
| Nomor WhatsApp | `script.js` baris `var WA = "..."` | `6288212725000` |
| **Diskon jumlah** | `script.js` blok `DISKON` | 5% / 8% / 12% (PLACEHOLDER) |
| Domain | `index.html` (canonical + og:image), `robots.txt`, `sitemap.xml` | `reviewcard.example` |
| Logo PNG | `tools/make-images.html` | klik "Unduh PNG" 5× |

Contoh cara ganti domain:

```bash
# dari folder proyek
grep -rl "reviewcard.example" . | xargs sed -i '' 's/reviewcard.example/domain-anda.com/g'
```

---

## 3. Cara Membuat Ikon & Gambar Bagikan

1. Buka `tools/make-images.html` di browser (butuh `assets/og-image.svg` & `assets/favicon.svg`)
2. Klik **Unduh PNG** untuk `og-image`
3. Klik unduh untuk masing-masing ikon
4. Simpan semuanya ke `assets/`
5. Hapus folder `tools/` sebelum upload

Tidak ada yang diunggah ke internet — semuanya berjalan di browser Anda.

> **Catatan WhatsApp:** WhatsApp meng-cache gambar preview. Kalau gambar lama
> masih muncul, ganti nama file jadi `og-image-2.png` dan perbarui di `<head>`.

---

## 4. Video Demo (opsional)

1. Buat video 10–15 detik: HP menyentuh kartu → halaman ulasan terbuka
2. Kompres dulu supaya maksimal ±5 MB. Gratis: <https://squoosh.app>
3. Simpan sebagai `assets/video-demo.mp4`
4. Hapus blok `<div class="vid__ph">` dari `index.html` (ada komentar panduan di atasnya)

Video otomatis tersembunyi begitu `<video>` punya file yang valid.

---

## 5. Hosting & Domain ( gratis)

### Opsi A — Netlify (paling mudah)

1. Buka <https://app.netlify.com/drop>
2. Seret seluruh folder proyek ke halaman itu
3. Situs langsung online di URL `.netlify.app`
4. **Domain sendiri:** Netlify → *Domain settings* → *Add custom domain* → masukkan domain Anda
5. Arahkan DNS sesuai instruksi Netlify (biasanyatambahkan CNAME ke `*.netlify.app`)

File `_headers` sudah ikut, jadi cache dan header keamanan otomatis aktif.

### Opsi B — Vercel

```bash
npm i -g vercel
vercel            # pilih folder, selesai
vercel --prod     # produksi
```

### Opsi C — GitHub Pages (gratis, tanpa kartu kredit)

```bash
git init
git add .
git commit -m "mulai"
git branch -M main
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

Lalu di GitHub: **Settings → Pages → Source: `main` / `root`**.
Alamatnya: `https://USER.github.io/REPO/`

> Untuk Pages, `_headers` tidak dipakai. Tidak masalah — hanya kehilangan
> aturan cache.

### Beli domain

- Namecheap, Google Domains, Cloudflare Registrar, atau Registrar lokal
- Harga `.com` sekitar Rp 130.000–250.000/tahun
- **Cloudflare Registrar** menjual di harga biaya, tapi DNS-nya harus di
  Cloudflare

---

## 6. Analytics (opsional)

Tanpa library. Yang dilacak:

| Event | Kapan |
|---|---|
| `wa_click` | Pengunjung menekan tombol WhatsApp mana pun |
| `order_submit` | Pengvisitor mengisi form pesanan |

### Cara pasang

1. Buka <https://analytics.google.com> → *Admin* → *Data streams* → *Web*
2. Salin **Measurement ID** (format `G-XXXXXXXXXX`)
3. Tempel di `script.js`:

```js
var GA_ID = "G-XXXXXXXXXX";
```

Sudah otomatis: loading script GA4, `anonymize_ip`, dan event kustom.

> ** Privacy:** GA4 sudah melakukan anonymization IP, tapi tetap lebih baik
> tampilkan banner persetujuan cookie jika Anda melayani Uni Eropa. Untuk
> Indonesia, GDPR tidak berlaku, tapi tetap bagus practise.

---

## 7. SEO

Sudah dipasang:

- `<title>` + meta description dengan kata kunci utama
- Open Graph & Twitter Card (link jadi cantik saat dibagikan)
- `canonical`, `robots.txt`, `sitemap.xml`
- Semantic HTML: satu `<h1>`, heading berurutan
- `alt` pada gambar, skip-link untuk aksesibilitas

### Setelah online

1. Kirim URL ke <https://search.google.com/search-console>
2. VerifikasiOwnership
3. Daftarkan `sitemap.xml`
4. Ganti `reviewcard.example` di `index.html`, `robots.txt`, `sitemap.xml`

---

## 8. Performa

Situs ini **tidak memakai gambar raster sama sekali** — semua visual adalah
SVG & CSS. Jadi:

- Tidak ada yang perlu dikompres
- Ukuran total ≈ 145 KB (belum termasuk font & video)
- SVG tajam di layar retina, ukuran kecil

Yang paling berat: **video** (kalau Anda tambahkan) dan **Google Fonts**.
Kalau ingin lebih ringan, ganti Google Fonts dengan `<link rel="preload">`
atau self-host font-nya.

---

## 9. Checklist Sebelum Tayang

- [ ] Nomor WhatsApp benar (satu baris di `script.js`)
- [ ] Diskon jumlah sudah disetujui (blok `DISKON`)
- [ ] Domain sudah diganti di 3 tempat
- [ ] Ikon & `og-image.png` sudah di-generate
- [ ] Link di navbar diperbarui (tambah **Demo**, **Harga**, **Pesan**)
- [ ] Alamat & email asli ditambahkan (sengaja dikosongkan)
- [ ] 6 testimoni diganti dengan pelanggan sungguhan
- [ ] Statistik hero (2.400+, 4,9/5, 3×) bisa dipertanggungjawabkan
- [ ] Logo bisnis Anda (bukan huruf "G" Google) siap diunggah
- [ ] `tools/` dihapus
- [ ] Video ditambahkan (opsional)
- [ ] Analytics dipasang (opsional)

---

## 10. Sumber Daya

- Google Fonts — <https://fonts.google.com>
- Kompres video — <https://squoosh.app>
- Kompres gambar — <https://squoosh.app>
- Host — <https://app.netlify.com/drop>
- Search Console — <https://search.google.com/search-console>
- Daftar domain — <https://www.cloudflare.com/products/registrar/>

---

© 2026 Google Card Review
