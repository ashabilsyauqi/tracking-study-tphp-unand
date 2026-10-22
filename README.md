# TPHP StudyTrack
### Sistem Informasi Pemantauan Kemajuan Tugas Akhir Mahasiswa
**Program Studi Teknologi Pangan dan Hasil Pertanian (TPHP)**  
**Fakultas Teknologi Pertanian, Universitas Andalas**

---

## 1. Ringkasan & Tujuan Aplikasi

**TPHP StudyTrack** dirancang untuk membantu Program Studi Teknologi Pangan dan Hasil Pertanian (FATETA Universitas Andalas) dalam:
- Mengetahui mahasiswa yang sudah dan belum memiliki judul skripsi.
- Memantau kemajuan 6 tahapan utama: **Penetapan Judul**, **Seminar Proposal**, **Penelitian**, **Penulisan Skripsi (Bab I–V)**, **Seminar Hasil**, dan **Ujian Sarjana**.
- Memfasilitasi dosen pembimbing melaporkan perkembangan bimbingan dalam waktu **sekitar 1 menit** (*Pelaporan Cepat*).
- Menyediakan tombol khusus **"Belum Ada Perubahan"** yang memperbarui tanggal pelaporan tanpa memajukan tanggal kemajuan substantif.
- Mengidentifikasi hambatan dini mahasiswa (perlu perhatian / prioritas pendampingan).
- Mencegah penimpaan data tanpa sengaja saat dua pembimbing mengedit bersamaan (*Optimistic Concurrency Control*).
- Menyediakan **Showcase Beranda Interaktif**: Foto kegiatan dan koordinasi akademik FATETA UNAND dalam rasio asli 16:9 tanpa pemotongan dengan fitur *lightbox modal zoom* resolusi penuh.
- Menyediakan **Resume Eksekutif & Unduh Bahan Rapat Evaluasi (PDF)**: Dokumen resmi siap cetak dalam 1 file PDF terpadu (Kop surat resmi, resume statistik, rekomendasi kebijakan rapat, matriks rinci mahasiswa prioritas, dan lembar pengesahan tanda tangan ketua prodi).
- Menghasilkan laporan dan ekspor resmi ke format **Excel (.xlsx)** dan **PDF**.

---

## 2. Kredensial Pengguna Awal (Demo & Pengujian)

Untuk kemudahan pengujian alur, halaman Login menyediakan tombol **"Uji Peran: 1-Klik Switch"** dan akun default berikut:

| Peran | Nama Akun | Username | Kata Sandi | Wewenang Utama |
|---|---|---|---|---|
| **Administrator / Operator Prodi** | Administrator / Operator Prodi | `admin` | `admin123` | Kelola master data, impor Excel/CSV, ubah ambang batas, backup/restore, audit log |
| **Ketua Prodi / Tim Pemantau** | Ketua Prodi TPHP | `kaprodi` | `kaprodi123` | Lihat seluruh dashboard, buat tindak lanjut, bahan rapat evaluasi, unduh laporan |
| **Dosen Pembimbing Utama** | Prof. Dr. Aisman | `aisman` | `dosen123` | Lapor cepat 1 menit, konfirmasi belum ada perubahan, lihat riwayat pembimbing lain |
| **Dosen Pembimbing Pendamping** | Dr. Ismed | `ismed` | `dosen123` | Melihat catatan pembimbing utama, memperbarui progres bimbingan bersama |

*(Seluruh 20 dosen master memiliki akun aktif dengan kata sandi `dosen123`)*

---

## 3. Data Awal 20 Dosen Master

Nama dan gelar resmi dipertahankan tanpa penambahan gelar yang belum dikonfirmasi:

1. **Prof. Dr. Aisman**
2. **Prof. Dr. Novizar Nazir**
3. **Prof. Rini**
4. **Prof. Tuty Anggraini**
5. **Prof. Kesuma Sayuti**
6. **Prof. Novelina**
7. **Prof. Dr. Fauzan Azima**
8. **Prof. Rina Yenrina**
9. **Reni Koja**
10. **Felga Zulfia Resdiana**
11. **Dr. Ismed**
12. **Wellyalina**
13. **Surya Aulia**
14. **Linda Wati**
15. **Diana Silvy**
16. **Dr. Daimon Syukri**
17. **Purnama Dini Hari**
18. **Ridwan Rizkiyanto**
19. **Cesar Welya Refdi**
20. **Bastian Nova**

*Catatan: Sistem menggunakan ID unik (CUID) dosen sebagai relasi data (Foreign Key), bukan nama dosen.*

---

## 4. Struktur Database & Model Persisten

Aplikasi menggunakan SQLite persisten (`tphp_studytrack.db`) melalui Prisma ORM dengan struktur terpisah:
- `User`: Akun pengguna, peran (ADMIN, KAPRODI, DOSEN), tautan `lecturerId`, hash bcrypt.
- `Lecturer`: Master 20 dosen, NIP, nama & gelar resmi, kontak, beban bimbingan.
- `Student`: NIM unik, nama, angkatan, status akademik (aktif, cuti, lulus), semester studi, judul, target, versi concurrency (`version`), soft-delete (`isArchived`).
- `StudentStage`: 6 tahapan utama (Penetapan Judul, Sempro, Penelitian, Penulisan Skripsi, Semhas, Ujian Sarjana) dengan status: *Belum dilaporkan, Belum dimulai, Sedang berjalan, Menunggu jadwal/persetujuan, Selesai, Tertunda*.
- `ThesisChapterProgress`: Kemajuan Bab I sampai Bab V (status: *Belum dimulai, Draf, Ditinjau pembimbing, Revisi, Disetujui*).
- `ProgressReport`: Laporan berkala dosen, tanggal kondisi, tanggal substantif, penanda `isNoChange`, hambatan, tindakan berikutnya, PJ, target, kebutuhan bantuan prodi. Zona waktu: **Asia/Jakarta (WIB)**.
- `AdvisorAssignmentHistory`: Riwayat perubahan pembimbing (pembimbing lama, pembimbing baru, alasan perubahan, pencatat).
- `TitleHistory`: Riwayat perubahan judul skripsi (judul lama, baru, status sementara/definitif, alasan).
- `FollowUpAction`: Tindak lanjut prodi (masalah, tindakan, penanggung jawab, tenggat, status: terbuka, sedang ditangani, selesai, hasil akhir).
- `Setting`: Konfigurasi ambang batas, aturan semester aktif, bobot estimasi tahapan, logo instansi.
- `Notification`: Notifikasi in-app untuk batas pelaporan, target terlewati, dan permohonan bantuan prodi.
- `AuditLog`: Jejak audit setiap perubahan penting (siapa, kapan, aksi, entitas, alasan perubahan).

---

## 5. Data Demonstrasi Terpisah (30 Mahasiswa)

Sistem dilengkapi **Mode Data Demonstrasi** dengan 30 mahasiswa fiktif yang mewakili:
- Angkatan 2019, 2020, 2021, 2022 (Semester 6, 8, 10, 12).
- Mahasiswa belum memiliki judul.
- Mahasiswa yang sedang penelitian dan penulisan skripsi secara simultan.
- Mahasiswa dengan status cuti resmi (dikecualikan dari peringatan aktif).
- Mahasiswa yang telah menyelesaikan ujian dan berstatus lulus administratif.
- Mahasiswa dengan berbagai hambatan nyata (alat lab rusak, reagen habis, antrian GC-MS, revisi Bab IV tertunda).
- Banner peringatan jelas **"MODE DATA DEMONSTRASI"** di bagian atas dengan tombol **Reset Demo** dan **Bersihkan** untuk beralih ke data operasional riil.

---

## 6. Panduan Menjalankan Aplikasi

### Kebutuhan Sistem:
- **Node.js**: v18+ atau v20+
- **NPM**: v9+ atau v10+

### Langkah Menjalankan:
1. Pastikan dependensi telah terpasang:
   ```bash
   npm install
   ```
2. Pastikan basis data tersinkronisasi:
   ```bash
   npx prisma db push
   ```
3. Isi data awal 20 dosen, pengaturan sistem, dan 30 data demo:
   ```bash
   npm run seed
   ```
4. Jalankan aplikasi dalam mode pengembangan:
   ```bash
   npm run dev
   ```
   *Buka peramban di `http://localhost:3000`*

5. Atau jalankan build produksi:
   ```bash
   npm run build
   npm run start
   ```

---

## 7. Panduan Singkat Pengguna

### A. Untuk Administrator / Operator Prodi:
1. Masuk menggunakan akun `admin` / `admin123`.
2. **Tambah Mahasiswa**: Buka menu **Mahasiswa** &rarr; klik tombol **Tambah Mahasiswa**.
3. **Impor Excel / CSV**:
   - Buka menu **Mahasiswa** &rarr; klik **Impor Excel/CSV**.
   - Unduh template standar (`.xlsx` atau `.csv`).
   - Unggah berkas. Sistem menampilkan **Pratinjau**, validasi NIM duplikat, dan pencocokan otomatis 20 master dosen.
   - Jika ada NIM yang sudah terdaftar, berikan konfirmasi sebelum menimpa data.
4. **Koreksi Data Administratif**:
   - Buka detail mahasiswa &rarr; klik **Koreksi Data Administratif**.
   - Sistem mewajibkan pengisian **Alasan Perubahan** sesuai SOP audit prodi.
5. **Pengaturan & Cadangan Database**:
   - Buka menu **Pengaturan** untuk menyesuaikan ambang batas pengingat laporan (default 30 hari), tinjauan substantif (default 60 hari), atau batas masa studi (semester 8).
   - Unduh cadangan database format JSON kapan saja, atau pulihkan dari berkas cadangan sebelumnya.

### B. Untuk Dosen Pembimbing:
1. Masuk menggunakan akun dosen (misal `aisman` / `dosen123`).
2. Buka menu **Mahasiswa Bimbingan Saya** (hanya menampilkan mahasiswa yang Anda bimbing).
3. **Alur Pelaporan Cepat (1 Menit)**:
   - Klik tombol **Lapor Cepat** pada mahasiswa terkait.
   - Lihat ringkasan laporan sebelumnya dan catatan rekan pembimbing.
   - Perbarui tahapan atau bab naskah yang mengalami kemajuan.
   - Tuliskan ringkasan perkembangan, hambatan, dan rencana tindakan berikutnya.
   - Jika butuh bantuan pimpinan prodi, centang opsi *Memerlukan Bantuan Prodi*.
   - Klik **Simpan Laporan Kemajuan**.
4. **Tombol "Belum Ada Perubahan"**:
   - Jika mahasiswa belum menunjukkan progres baru sejak bimbingan terakhir, klik tombol **Belum Ada Perubahan**.
   - Masukkan alasan singkat dan rencana pertemuan berikutnya.
   - Tindakan ini memperbarui tanggal lapor hari ini tanpa memajukan tanggal kemajuan substantif.
5. **Peringatan Konflik Bersamaan**:
   - Jika rekan pembimbing lain memperbarui mahasiswa tersebut saat Anda membuka formulir, sistem mendeteksi konflik versi (kode 409) dan menampilkan perbedaan terbaru sebelum Anda menyimpan. Data tidak akan tertimpa secara diam-diam.

---

## 8. Hasil Pengujian 10 Alur Utama

Jalankan pengujian otomatis kapan saja dengan perintah:
```bash
npm test
# atau: node test_flows.js
```

### Hasil Verifikasi Sistem:
```
================================================================
 PENGUJIAN 10 ALUR UTAMA SISTEM TPHP STUDYTRACK
 Berdasarkan Dokumen Spesifikasi Akademik
================================================================

[PASS] Alur 1: Administrator menambah mahasiswa dan menetapkan pembimbing
       -> Mahasiswa uji coba berhasil dibuat dengan Pembimbing Utama & Pendamping. Riwayat penugasan tersimpan.
[PASS] Alur 2: Dosen melihat mahasiswa bimbingannya
       -> Dosen hanya melihat mahasiswa bimbingannya. Mahasiswa di luar bimbingan otomatis terfilter secara server-side.
[PASS] Alur 3: Dosen memperbarui kemajuan dan data tersimpan
       -> Laporan kemajuan berhasil dicatat. Versi mahasiswa naik dan tanggal substantif terisi.
[PASS] Alur 4: Pembimbing pendamping melihat laporan terbaru
       -> Pembimbing pendamping dapat melihat riwayat laporan lengkap dari pembimbing utama.
[PASS] Alur 5: Dashboard menghitung ulang sesuai data
       -> Metrik program studi terhitung akurat secara real-time.
[PASS] Alur 6: Prodi membuat tindak lanjut dan menutupnya setelah selesai
       -> Tindak lanjut dibuat status 'sedang_ditangani' lalu diselesaikan dengan pencatatan hasil akhir.
[PASS] Alur 7: Filter dan ekspor menghasilkan data yang konsisten
       -> Filter menghasilkan data yang 100% konsisten dengan kriteria aktif.
[PASS] Alur 8: Impor menolak NIM duplikat yang tidak ditangani
       -> Database menolak pembuatan mahasiswa dengan NIM duplikat (Unique Constraint).
[PASS] Alur 9: Hak akses mencegah pembacaan dan perubahan tanpa kewenangan
       -> Server-side RBAC memblokir dosen lain mengakses mahasiswa di luar penugasannya.
[PASS] Alur 10: Dua pembimbing yang mengedit bersamaan tidak saling menimpa tanpa peringatan
       -> Optimistic Concurrency Control mendeteksi perbedaan versi (HTTP 409 Conflict) dan meminta peninjauan.

================================================================
 HASIL PENGUJIAN: 10/10 ALUR BERHASIL (100% SUKSES)
================================================================
```

---

## 9. Daftar Integrasi yang Memerlukan Konfigurasi Lanjutan

Sesuai ketentuan Section 13:
1. **WhatsApp Gateway Notification (Opsional)**:
   - Antarmuka pengaturan telah disediakan di menu **Pengaturan** &rarr; **Integrasi WhatsApp**.
   - Status saat ini dinonaktifkan secara aman (`wa_integration_enabled = false`).
   - Memerlukan konfigurasi endpoint API gateway (misal Fonnte, Waba, Twilio) dan API Key resmi saat akan dihubungkan ke nomor instansi.
2. **Email SMTP Notification (Opsional)**:
   - Antarmuka pengaturan telah disediakan di menu **Pengaturan** &rarr; **Integrasi Email SMTP**.
   - Status dinonaktifkan (`email_integration_enabled = false`).
   - Memerlukan server SMTP resmi Universitas Andalas (`smtp.unand.ac.id`, port, user, dan password).

*Sistem menjamin tidak menampilkan notifikasi palsu (false positive) apabila integrasi eksternal belum diaktifkan oleh Administrator.*
