const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DOSEN_LIST = [
  { nip: "196001011985031001", namaGelar: "Prof. Dr. Aisman", email: "aisman@ae.unand.ac.id", username: "aisman" },
  { nip: "196205121987021001", namaGelar: "Prof. Dr. Novizar Nazir", email: "nazir_novizar@ae.unand.ac.id", username: "novizar" },
  { nip: "196304151988032001", namaGelar: "Prof. Rini", email: "rini_fateta@ae.unand.ac.id", username: "rini" },
  { nip: "196508201990022001", namaGelar: "Prof. Tuty Anggraini", email: "tuty_anggraini@ae.unand.ac.id", username: "tuty" },
  { nip: "196511111990032001", namaGelar: "Prof. Kesuma Sayuti", email: "kesumasayuti@ae.unand.ac.id", username: "kesuma" },
  { nip: "196409181989032001", namaGelar: "Prof. Novelina", email: "novelina@ae.unand.ac.id", username: "novelina" },
  { nip: "196010101986031002", namaGelar: "Prof. Dr. Fauzan Azima", email: "fauzan_azima@ae.unand.ac.id", username: "fauzan" },
  { nip: "196112251987032001", namaGelar: "Prof. Rina Yenrina", email: "rinayenrina@ae.unand.ac.id", username: "rina" },
  { nip: "197203141998022001", namaGelar: "Reni Koja", email: "renikoja@ae.unand.ac.id", username: "renikoja" },
  { nip: "198006252005012002", namaGelar: "Felga Zulfia Resdiana", email: "felgazulfia@ae.unand.ac.id", username: "felga" },
  { nip: "196807191994031002", namaGelar: "Dr. Ismed", email: "ismed@ae.unand.ac.id", username: "ismed" },
  { nip: "197805162003122001", namaGelar: "Wellyalina", email: "wellyalina@ae.unand.ac.id", username: "wellyalina" },
  { nip: "198202022006041001", namaGelar: "Surya Aulia", email: "suryaaulia@ae.unand.ac.id", username: "suryaaulia" },
  { nip: "197509122000122001", namaGelar: "Linda Wati", email: "lindawati@ae.unand.ac.id", username: "lindawati" },
  { nip: "197608142001122002", namaGelar: "Diana Silvy", email: "dianasilvy@ae.unand.ac.id", username: "dianasilvy" },
  { nip: "197904222005011003", namaGelar: "Dr. Daimon Syukri", email: "daimonsyukri@ae.unand.ac.id", username: "daimon" },
  { nip: "198401032008122003", namaGelar: "Purnama Dini Hari", email: "purnamadini@ae.unand.ac.id", username: "purnama" },
  { nip: "198607182014041001", namaGelar: "Ridwan Rizkiyanto", email: "ridwanrizkiyanto@ae.unand.ac.id", username: "ridwan" },
  { nip: "198811052015042001", namaGelar: "Cesar Welya Refdi", email: "cesarwelya@ae.unand.ac.id", username: "cesar" },
  { nip: "198902122019031005", namaGelar: "Bastian Nova", email: "bastiannova@ae.unand.ac.id", username: "bastian" },
];

const DEFAULT_SETTINGS = [
  { key: "reminder_report_days", value: "30", description: "Batas hari pengingat pembaruan laporan kemajuan" },
  { key: "reminder_substantive_days", value: "60", description: "Batas hari peringatan perlu ditinjau jika belum ada kemajuan substantif" },
  { key: "study_period_semester_threshold", value: "8", description: "Ambang batas semester studi untuk peringatan masa studi" },
  { key: "semester_active", value: "2024/2025 Genap", description: "Tahun akademik dan semester aktif berjalan" },
  { key: "semester_type", value: "genap", description: "Tipe semester aktif (ganjil/genap)" },
  { key: "current_academic_year", value: "2024/2025", description: "Tahun akademik saat ini" },
  { key: "current_calendar_year", value: "2025", description: "Tahun kalender saat ini" },
  { key: "prodi_name", value: "Teknologi Pangan dan Hasil Pertanian", description: "Nama Program Studi" },
  { key: "prodi_code", value: "TPHP", description: "Kode Program Studi" },
  { key: "faculty_name", value: "Fakultas Teknologi Pertanian", description: "Nama Fakultas" },
  { key: "university_name", value: "Universitas Andalas", description: "Nama Universitas" },
  { key: "app_logo_url", value: "", description: "URL atau Path logo instansi resmi" },
  { key: "wa_integration_enabled", value: "false", description: "Status aktifasi notifikasi keluar WhatsApp (Opsional)" },
  { key: "wa_gateway_url", value: "", description: "Endpoint API Gateway WhatsApp" },
  { key: "wa_api_key", value: "", description: "Kunci API WhatsApp Gateway" },
  { key: "email_integration_enabled", value: "false", description: "Status aktifasi notifikasi keluar Email (Opsional)" },
  { key: "smtp_host", value: "", description: "Server SMTP Email" },
  {
    key: "stage_weights",
    value: JSON.stringify({
      penetapan_judul: 10,
      seminar_proposal: 20,
      penelitian: 25,
      penulisan_skripsi: 20,
      seminar_hasil: 10,
      ujian_sarjana: 15
    }),
    description: "Bobot estimasi kemajuan tahapan studi (total 100%)"
  },
  {
    key: "chapter_config",
    value: JSON.stringify([
      { num: 1, name: "Bab I: Pendahuluan" },
      { num: 2, name: "Bab II: Tinjauan Pustaka" },
      { num: 3, name: "Bab III: Metodologi Penelitian" },
      { num: 4, name: "Bab IV: Hasil dan Pembahasan" },
      { num: 5, name: "Bab V: Kesimpulan dan Saran" }
    ]),
    description: "Konfigurasi nama dan jumlah bab skripsi"
  }
];

const DEMO_STUDENTS = [
  // Angkatan 2020 & 2019 (Semester 10, 12 - perlu perhatian masa studi / prioritas)
  {
    nim: "1911121001",
    nama: "Arief Hidayatullah",
    angkatan: 2019,
    statusAkademik: "aktif",
    semesterManual: 12,
    pUtamaIdx: 0, // Prof. Dr. Aisman
    pPendampingIdx: 10, // Dr. Ismed
    judul: "Karakterisasi Senyawa Bioaktif Ekstrak Daun Gambir (Uncaria gambir Roxb.) Menggunakan Spektrometri Massa",
    bidang: "Kimia & Biokimia Pangan",
    tahapUtama: "penulisan_skripsi",
    statusPerhatian: "prioritas",
    alasanPerhatian: "Masa studi semester 12; butuh intervensi prodi untuk penyelesaian analisis data Bab IV",
    tglLaporan: "2025-01-10",
    tglSubstantif: "2024-11-05",
    hambatan: "Akses alat instrumentasi HPLC sempat terkendala dan draf Bab IV tertunda 2 bulan.",
    tindakan: "Klinik penulisan skripsi intensif dan penjadwalan asistensi Bab IV tiap pekan.",
    pj: "Prof. Dr. Aisman",
    targetTindak: "2025-03-31",
    butuhBantuan: true,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "revisi" },
      { num: 5, status: "draf" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-09-01", tglSelesai: "2023-09-20" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-10-01", tglSelesai: "2023-11-15" },
      penelitian: { status: "selesai", tglMulai: "2023-12-01", tglSelesai: "2024-08-30" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2024-09-01", targetSelesai: "2025-03-31" },
      seminar_hasil: { status: "menunggu_jadwal", targetSelesai: "2025-04-15" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-05-30" }
    }
  },
  {
    nim: "1911122004",
    nama: "Fadhil Muhammad",
    angkatan: 2019,
    statusAkademik: "aktif",
    semesterManual: 12,
    pUtamaIdx: 1, // Prof. Dr. Novizar Nazir
    pPendampingIdx: 11, // Wellyalina
    judul: "Optimasi Ekstraksi Pektin dari Kulit Kakao dengan Gelombang Mikro (MAE) dan Aplikasinya pada Selai Nenas",
    bidang: "Rekayasa Proses Pangan",
    tahapUtama: "seminar_hasil",
    statusPerhatian: "perlu_perhatian",
    alasanPerhatian: "Semester 12; naskah semhas siap, menunggu perbaikan format sitasi",
    tglLaporan: "2025-02-15",
    tglSubstantif: "2025-02-15",
    hambatan: "Koreksi format naskah artikel dan ringkasan skripsi.",
    tindakan: "Penyelesaian revisi format naskah untuk pendaftaran Semhas.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-10",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "disetujui" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-08-10", tglSelesai: "2023-08-25" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-09-01", tglSelesai: "2023-10-20" },
      penelitian: { status: "selesai", tglMulai: "2023-11-01", tglSelesai: "2024-07-15" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2024-07-20", tglSelesai: "2025-01-30" },
      seminar_hasil: { status: "menunggu_jadwal", targetSelesai: "2025-03-15" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-04-30" }
    }
  },
  {
    nim: "2011121002",
    nama: "Siti Rahmawati",
    angkatan: 2020,
    statusAkademik: "aktif",
    semesterManual: 10,
    pUtamaIdx: 2, // Prof. Rini
    pPendampingIdx: 12, // Surya Aulia
    judul: "Pengaruh Formulasi Tepung Sukun Termodifikasi terhadap Karakteristik Sensoris dan Fisikokimia Roti Tawar Non-Gluten",
    bidang: "Teknologi Pengolahan Pangan",
    tahapUtama: "ujian_sarjana",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Tahap ujian sarjana dijadwalkan akhir bulan ini, berkas lengkap",
    tglLaporan: "2025-02-20",
    tglSubstantif: "2025-02-20",
    hambatan: "Tidak ada hambatan berarti.",
    tindakan: "Pemberkasan dan simulasi presentasi ujian sarjana.",
    pj: "Prof. Rini",
    targetTindak: "2025-03-05",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "disetujui" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-09-10", tglSelesai: "2023-09-28" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-10-15", tglSelesai: "2023-11-20" },
      penelitian: { status: "selesai", tglMulai: "2023-12-05", tglSelesai: "2024-06-20" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2024-06-25", tglSelesai: "2024-11-30" },
      seminar_hasil: { status: "selesai", tglMulai: "2024-12-01", tglSelesai: "2025-01-15" },
      ujian_sarjana: { status: "menunggu_jadwal", targetSelesai: "2025-03-08" }
    }
  },
  {
    nim: "2011121008",
    nama: "Nurul Annisa Putri",
    angkatan: 2020,
    statusAkademik: "aktif",
    semesterManual: 10,
    pUtamaIdx: 3, // Prof. Tuty Anggraini
    pPendampingIdx: 13, // Linda Wati
    judul: "Aktivitas Antioksidan dan Sifat Sensori Teh Daun Kopi Robusta dengan Variasi Suhu dan Waktu Penyangraian",
    bidang: "Teknologi Hasil Perkebunan",
    tahapUtama: "penulisan_skripsi",
    statusPerhatian: "perlu_pembaruan",
    alasanPerhatian: "Laporan kemajuan belum diperbarui lebih dari 35 hari",
    tglLaporan: "2025-01-15",
    tglSubstantif: "2025-01-15",
    hambatan: "Penyusunan Bab IV Hasil & Pembahasan grafik korelasi antosianin.",
    tindakan: "Pertemuan bimbingan pembahasan grafik Bab IV.",
    pj: "Prof. Tuty Anggraini",
    targetTindak: "2025-02-28",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "ditinjau_pembimbing" },
      { num: 5, status: "draf" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-10-01", tglSelesai: "2023-10-25" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-11-01", tglSelesai: "2023-12-18" },
      penelitian: { status: "selesai", tglMulai: "2024-01-10", tglSelesai: "2024-09-10" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2024-09-15", targetSelesai: "2025-03-20" },
      seminar_hasil: { status: "belum_dimulai", targetSelesai: "2025-04-10" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-05-15" }
    }
  },
  {
    nim: "2011122015",
    nama: "Ilham Ramadhan",
    angkatan: 2020,
    statusAkademik: "aktif",
    semesterManual: 10,
    pUtamaIdx: 4, // Prof. Kesuma Sayuti
    pPendampingIdx: 14, // Diana Silvy
    judul: "Enkapsulasi Pewarna Alami Antosianin dari Kulit Manggis Menggunakan Kombinasi Maltodekstrin dan Gum Arab",
    bidang: "Bioteknologi & Rekayasa Pangan",
    tahapUtama: "penelitian",
    statusPerhatian: "prioritas",
    alasanPerhatian: "Penelitian terhambat ketersediaan reagen HPLC; dosen menandai butuh fasilitasi prodi",
    tglLaporan: "2025-02-18",
    tglSubstantif: "2024-11-20",
    hambatan: "Reagen baku standar kuersetin dan ketersediaan spray dryer di laboratorium.",
    tindakan: "Fasilitasi penggunaan fasilitas laboratorium pengujian mitra oleh prodi.",
    pj: "Kaprodi / Tim Pemantauan",
    targetTindak: "2025-03-15",
    butuhBantuan: true,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "ditinjau_pembimbing" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-11-01", tglSelesai: "2023-11-25" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-12-01", tglSelesai: "2024-02-10" },
      penelitian: { status: "sedang_berjalan", tglMulai: "2024-03-01", targetSelesai: "2024-12-01" }, // target terlewati!
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2024-05-01", targetSelesai: "2025-04-30" },
      seminar_hasil: { status: "belum_dimulai", targetSelesai: "2025-05-20" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-06-30" }
    }
  },
  {
    nim: "2011122020",
    nama: "Rizky Ananda",
    angkatan: 2020,
    statusAkademik: "aktif",
    semesterManual: 10,
    pUtamaIdx: 5, // Prof. Novelina
    pPendampingIdx: 15, // Dr. Daimon Syukri
    judul: "Pengembangan Edible Film Antimikroba Berbasis Pati Biji Durian dengan Inkorporasi Minyak Atsiri Kulit Jeruk Manis",
    bidang: "Pengemasan Pangan & Pascapanen",
    tahapUtama: "ujian_sarjana",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Ujian sarjana telah selesai, sedang tahap revisi akhir dan kelulusan administratif",
    tglLaporan: "2025-02-10",
    tglSubstantif: "2025-02-10",
    hambatan: "Revisi minor pada abstrak bahasa Inggris dan tanda tangan penguji.",
    tindakan: "Penyelesaian tanda tangan lembar pengesahan.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-01",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "disetujui" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-09-01", tglSelesai: "2023-09-20" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-10-01", tglSelesai: "2023-11-15" },
      penelitian: { status: "selesai", tglMulai: "2023-12-01", tglSelesai: "2024-06-30" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2024-07-01", tglSelesai: "2024-11-15" },
      seminar_hasil: { status: "selesai", tglMulai: "2024-11-20", tglSelesai: "2024-12-20" },
      ujian_sarjana: { status: "selesai", tglMulai: "2025-01-10", tglSelesai: "2025-02-05" }
    }
  },
  {
    nim: "2011123005",
    nama: "Dewi Lestari",
    angkatan: 2020,
    statusAkademik: "cuti",
    semesterManual: 9,
    semesterCuti: 1,
    pUtamaIdx: 6, // Prof. Dr. Fauzan Azima
    pPendampingIdx: 16, // Purnama Dini Hari
    judul: "Fortifikasi Zat Besi dan Seng pada Beras Tiruan Berbasis Tepung Ubi Jalar Ungu Menggunakan Teknologi Ekstrusi",
    bidang: "Teknologi Pengolahan Pangan",
    tahapUtama: "penelitian",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Mahasiswa berstatus cuti resmi semester berjalan; tidak menerima peringatan kemajuan aktif",
    tglLaporan: "2024-09-10",
    tglSubstantif: "2024-09-10",
    hambatan: "Cuti akademik alasan kesehatan (semester ganjil 2024/2025).",
    tindakan: "Registrasi ulang dan perpanjangan masa tugas akhir saat aktif kembali.",
    pj: "Mahasiswa",
    targetTindak: "2025-08-01",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "draf" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-10-01", tglSelesai: "2023-10-25" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-11-10", tglSelesai: "2024-01-15" },
      penelitian: { status: "tertunda", tglMulai: "2024-02-01", catatan: "Tertunda karena cuti resmi" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  // Angkatan 2021 (Semester 8 - Reguler Tingkat Akhir)
  {
    nim: "2111121003",
    nama: "Budi Santoso",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 7, // Prof. Rina Yenrina
    pPendampingIdx: 17, // Ridwan Rizkiyanto
    judul: "Kinetika Penurunan Mutu Minyak Goreng Sawit Berulang dengan Penambahan Antioksidan Alami Ekstrak Daun Salam",
    bidang: "Mutu & Keamanan Pangan",
    tahapUtama: "seminar_proposal",
    statusPerhatian: "perlu_perhatian",
    alasanPerhatian: "Target sempro terlewati 1 bulan; revisi proposal dari pembimbing pendamping belum selesai",
    tglLaporan: "2025-02-01",
    tglSubstantif: "2024-12-15",
    hambatan: "Penyelarasan parameter pengujian asam lemak bebas (FFA) dan bilangan peroksida.",
    tindakan: "Diskusi sinkronisasi metodologi antara pembimbing utama dan pendamping.",
    pj: "Prof. Rina Yenrina",
    targetTindak: "2025-03-08",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "ditinjau_pembimbing" },
      { num: 3, status: "revisi" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-09-01", tglSelesai: "2024-09-25" },
      seminar_proposal: { status: "sedang_berjalan", tglMulai: "2024-10-01", targetSelesai: "2025-01-15" }, // terlewati
      penelitian: { status: "belum_dimulai", targetSelesai: "2025-05-30" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2111121007",
    nama: "Annisa Tri Wahyuni",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 8, // Reni Koja
    pPendampingIdx: 18, // Cesar Welya Refdi
    judul: "Pengembangan Minuman Fungsional Sari Buah Kundur (Benincasa hispida) dengan Penambahan Jahe Merah dan Stevia",
    bidang: "Teknologi Pengolahan Pangan",
    tahapUtama: "penelitian",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Penelitian lab berjalan sesuai jadwal (tahap pengujian sensori dan total mikroba)",
    tglLaporan: "2025-02-19",
    tglSubstantif: "2025-02-19",
    hambatan: "Tidak ada kendala, ketersediaan bahan baku kundur segar terjaga.",
    tindakan: "Penyelesaian analisis proksimat dan rekapitulasi data uji hedonik.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-25",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "draf" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-08-20", tglSelesai: "2024-09-10" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-09-15", tglSelesai: "2024-10-30" },
      penelitian: { status: "sedang_berjalan", tglMulai: "2024-11-05", targetSelesai: "2025-03-31" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2024-12-01", targetSelesai: "2025-05-15" },
      seminar_hasil: { status: "belum_dimulai", targetSelesai: "2025-05-30" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-06-30" }
    }
  },
  {
    nim: "2111121012",
    nama: "Muhammad Rayhan",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 9, // Felga Zulfia Resdiana
    pPendampingIdx: 19, // Bastian Nova
    judul: "Karakteristik Fisik dan Termal Lemak Kakao Terfraksionasi Berdasarkan Variasi Waktu Kristalisasi Kering",
    bidang: "Teknologi Lemak & Minyak Pangan",
    tahapUtama: "penulisan_skripsi",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Data lab selesai, Bab IV sudah 80% ditulis dan siap asistensi",
    tglLaporan: "2025-02-14",
    tglSubstantif: "2025-02-14",
    hambatan: "Penyusunan pembahasan analisis termal DSC (Differential Scanning Calorimetry).",
    tindakan: "Konsultasi interpretasi termogram DSC dengan pembimbing pendamping.",
    pj: "Bastian Nova",
    targetTindak: "2025-03-05",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "ditinjau_pembimbing" },
      { num: 5, status: "draf" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-08-15", tglSelesai: "2024-09-05" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-09-10", tglSelesai: "2024-10-25" },
      penelitian: { status: "selesai", tglMulai: "2024-11-01", tglSelesai: "2025-01-20" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2025-01-10", targetSelesai: "2025-03-31" },
      seminar_hasil: { status: "menunggu_jadwal", targetSelesai: "2025-04-15" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-05-30" }
    }
  },
  {
    nim: "2111122001",
    nama: "Putri Anggraini",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 10, // Dr. Ismed
    pPendampingIdx: 0, // Prof. Dr. Aisman
    judul: "Isolasi dan Seleksi Bakteri Asam Laktat Indigenous Asal Tempoyak Tradisional Minangkabau sebagai Agens Probiotik",
    bidang: "Mikrobiologi & Keamanan Pangan",
    tahapUtama: "seminar_hasil",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Target semhas dalam 30 hari ke depan, berkas sudah didaftarkan ke panitia",
    tglLaporan: "2025-02-18",
    tglSubstantif: "2025-02-18",
    hambatan: "Pencocokan waktu dosen penguji seminar hasil.",
    tindakan: "Koordinasi jadwal seminar hasil bersama prodi.",
    pj: "Tim Pemantauan / Prodi",
    targetTindak: "2025-03-12",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "disetujui" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-07-15", tglSelesai: "2024-08-10" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-08-20", tglSelesai: "2024-10-05" },
      penelitian: { status: "selesai", tglMulai: "2024-10-10", tglSelesai: "2025-01-10" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2025-01-12", tglSelesai: "2025-02-10" },
      seminar_hasil: { status: "menunggu_jadwal", targetSelesai: "2025-03-15" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-04-20" }
    }
  },
  {
    nim: "2111122005",
    nama: "Reza Pratama",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 11, // Wellyalina
    pPendampingIdx: 1, // Prof. Dr. Novizar Nazir
    judul: "Pengaruh Waktu dan Tekanan Homogenisasi terhadap Kestabilan Emulsi Minyak Bekatul Padi (Rice Bran Oil)",
    bidang: "Rekayasa Proses Pangan",
    tahapUtama: "seminar_proposal",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Sempro direncanakan minggu depan, naskah proposal selesai direvisi",
    tglLaporan: "2025-02-17",
    tglSubstantif: "2025-02-17",
    hambatan: "Pengecekan turnitin naskah (hasil 14%, aman).",
    tindakan: "Pendaftaran sempro ke sekretariat prodi.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-01",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-09-10", tglSelesai: "2024-10-01" },
      seminar_proposal: { status: "menunggu_jadwal", tglMulai: "2024-10-10", targetSelesai: "2025-03-05" },
      penelitian: { status: "belum_dimulai", targetSelesai: "2025-06-15" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2111122011",
    nama: "Fadila Zahra",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 12, // Surya Aulia
    pPendampingIdx: 2, // Prof. Rini
    judul: "Karakterisasi Fisikokimia dan Sifat Organoleptik Mie Basah dengan Substitusi Pati Sagu Termodifikasi Fosfat",
    bidang: "Teknologi Karbohidrat Pangan",
    tahapUtama: "penelitian",
    statusPerhatian: "perlu_perhatian",
    alasanPerhatian: "Lebih dari 60 hari belum ada kemajuan substantif karena alat texture analyzer rusak",
    tglLaporan: "2025-02-12",
    tglSubstantif: "2024-12-10",
    hambatan: "Alat Texture Analyzer laboratorium Fateta dalam perbaikan, pengujian tekstur mie tertunda.",
    tindakan: "Rujukan pengujian tekstur ke Lab Terpadu Unand atau instansi mitra di Padang.",
    pj: "Surya Aulia",
    targetTindak: "2025-03-15",
    butuhBantuan: true,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "draf" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-08-25", tglSelesai: "2024-09-15" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-09-20", tglSelesai: "2024-10-25" },
      penelitian: { status: "sedang_berjalan", tglMulai: "2024-11-01", targetSelesai: "2025-02-28" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2024-12-10", targetSelesai: "2025-05-15" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2111122018",
    nama: "Tegar Maulana",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 13, // Linda Wati
    pPendampingIdx: 3, // Prof. Tuty Anggraini
    judul: "Kinetika Fermentasi Kopi Arabika Metode Wine Process dan Pengaruhnya terhadap Profil Citarasa Cupping",
    bidang: "Teknologi Pascapanen & Hasil Perkebunan",
    tahapUtama: "penulisan_skripsi",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Proses penulisan Bab IV dan V berjalan aktif",
    tglLaporan: "2025-02-16",
    tglSubstantif: "2025-02-16",
    hambatan: "Pencocokan deskripsi sensori cupping SCA dengan standar SNI.",
    tindakan: "Penyelesaian draf Bab V dan penyusunan abstrak.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-10",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "ditinjau_pembimbing" },
      { num: 5, status: "draf" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-08-01", tglSelesai: "2024-08-25" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-09-01", tglSelesai: "2024-10-10" },
      penelitian: { status: "selesai", tglMulai: "2024-10-15", tglSelesai: "2025-01-15" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2025-01-10", targetSelesai: "2025-03-25" },
      seminar_hasil: { status: "belum_dimulai", targetSelesai: "2025-04-15" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-05-30" }
    }
  },
  {
    nim: "2111122022",
    nama: "Gita Safitri",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 14, // Diana Silvy
    pPendampingIdx: 4, // Prof. Kesuma Sayuti
    judul: "Pengaruh Waktu Maserasi dan Jenis Pelarut terhadap Kadar Senyawa Fenolik dan Aktivitas Penangkal Radikal Bebas Ekstrak Biji Alpukat",
    bidang: "Kimia Pangan & Bahan Alam",
    tahapUtama: "ujian_sarjana",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Target ujian sarjana dalam 45 hari mendatang, naskah sudah disetujui kedua pembimbing",
    tglLaporan: "2025-02-19",
    tglSubstantif: "2025-02-19",
    hambatan: "Tidak ada hambatan.",
    tindakan: "Pendaftaran sidang sarjana ke bagian akademik fakultas.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-20",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "disetujui" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-07-10", tglSelesai: "2024-08-01" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-08-10", tglSelesai: "2024-09-15" },
      penelitian: { status: "selesai", tglMulai: "2024-09-20", tglSelesai: "2024-12-15" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2024-12-01", tglSelesai: "2025-01-20" },
      seminar_hasil: { status: "selesai", tglMulai: "2025-01-25", tglSelesai: "2025-02-12" },
      ujian_sarjana: { status: "menunggu_jadwal", targetSelesai: "2025-03-28" }
    }
  },
  {
    nim: "2111122026",
    nama: "Fauzi Anwar",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 15, // Dr. Daimon Syukri
    pPendampingIdx: 5, // Prof. Novelina
    judul: "Aplikasi Edible Coating Berbasis Kitosan dan Minyak Serai Wangi untuk Memperpanjang Umur Simpan Cabai Merah Keriting",
    bidang: "Pascapanen & Pengemasan Pangan",
    tahapUtama: "penelitian",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Uji susut bobot dan pembusukan cabai sedang berjalan di incubator",
    tglLaporan: "2025-02-11",
    tglSubstantif: "2025-02-11",
    hambatan: "Ruang inkubator suhu terkontrol fluktuatif sedikit, telah dikalibrasi ulang.",
    tindakan: "Pengamatan interval 3 harian dan pencatatan susut bobot.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-15",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "draf" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-08-20", tglSelesai: "2024-09-12" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-09-20", tglSelesai: "2024-10-28" },
      penelitian: { status: "sedang_berjalan", tglMulai: "2024-11-10", targetSelesai: "2025-03-31" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2024-12-05", targetSelesai: "2025-05-10" },
      seminar_hasil: { status: "belum_dimulai", targetSelesai: "2025-05-25" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-06-30" }
    }
  },
  {
    nim: "2111123001",
    nama: "Cindy Claudia",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 16, // Purnama Dini Hari
    pPendampingIdx: 6, // Prof. Dr. Fauzan Azima
    judul: "Karakteristik Fisik, Kimia, dan Mutu Hedonik Es Krim Nabati Menggunakan Santan Kelapa dan Sari Edamame",
    bidang: "Teknologi Pengolahan Pangan",
    tahapUtama: "seminar_proposal",
    statusPerhatian: "perlu_pembaruan",
    alasanPerhatian: "Belum ada pembaruan laporan dari pembimbing selama 40 hari",
    tglLaporan: "2025-01-10",
    tglSubstantif: "2025-01-10",
    hambatan: "Penyusunan rancangan percobaan faktorial (RAL) untuk perbandingan santan:edamame.",
    tindakan: "Asistensi penentuan rancangan percobaan dan kuisioner uji organoleptik.",
    pj: "Purnama Dini Hari",
    targetTindak: "2025-03-05",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "ditinjau_pembimbing" },
      { num: 3, status: "revisi" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-09-01", tglSelesai: "2024-09-22" },
      seminar_proposal: { status: "sedang_berjalan", tglMulai: "2024-10-01", targetSelesai: "2025-02-28" },
      penelitian: { status: "belum_dimulai" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2111123008",
    nama: "Bayu Prakoso",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 17, // Ridwan Rizkiyanto
    pPendampingIdx: 7, // Prof. Rina Yenrina
    judul: "Evaluasi Sensori dan Profil Volatil Minyak Atsiri Pala Siau Menggunakan Solid-Phase Microextraction (SPME-GCMS)",
    bidang: "Analisis & Keamanan Pangan",
    tahapUtama: "penelitian",
    statusPerhatian: "perlu_perhatian",
    alasanPerhatian: "Belum ada kemajuan substantif 65 hari; instrumen GCMS antri panjang",
    tglLaporan: "2025-02-15",
    tglSubstantif: "2024-12-10",
    hambatan: "Antrian penggunaan GC-MS di laboratorium pusat analisis.",
    tindakan: "Peminjaman slot ekstraksi di laboratorium kimia FMIPA.",
    pj: "Ridwan Rizkiyanto",
    targetTindak: "2025-03-20",
    butuhBantuan: true,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "draf" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-08-10", tglSelesai: "2024-08-30" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-09-05", tglSelesai: "2024-10-20" },
      penelitian: { status: "sedang_berjalan", tglMulai: "2024-10-25", targetSelesai: "2025-03-31" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2024-11-15", targetSelesai: "2025-05-15" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2111123014",
    nama: "Annisa Lathifah",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 18, // Cesar Welya Refdi
    pPendampingIdx: 8, // Reni Koja
    judul: "Pengaruh Waktu Ultrasonikasi terhadap Karakteristik Gelatin Halal Ekstrak Kulit Ikan Patin (Pangasius hypophthalmus)",
    bidang: "Rekayasa Produk Halal Pangan",
    tahapUtama: "penulisan_skripsi",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Revisi Bab IV berlangsung lancar, data kekuatan gel (gel strength) sudah lengkap",
    tglLaporan: "2025-02-16",
    tglSubstantif: "2025-02-16",
    hambatan: "Perbaikan format tabel nilai Bloom dan perbandingan literatur luar negeri.",
    tindakan: "Penyelesaian draf revisi Bab IV untuk diparaf pembimbing.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-08",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "revisi" },
      { num: 5, status: "draf" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-07-20", tglSelesai: "2024-08-15" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-08-25", tglSelesai: "2024-10-10" },
      penelitian: { status: "selesai", tglMulai: "2024-10-15", tglSelesai: "2025-01-15" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2025-01-10", targetSelesai: "2025-03-31" },
      seminar_hasil: { status: "belum_dimulai", targetSelesai: "2025-04-20" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-05-30" }
    }
  },
  {
    nim: "2111123020",
    nama: "Bagas Wicaksono",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 19, // Bastian Nova
    pPendampingIdx: 9, // Felga Zulfia Resdiana
    judul: "Pengembangan Permen Jeli Herbal Berbasis Ekstrak Daun Kelor (Moringa oleifera) dengan Agen Pembentuk Gel Gelatin-Karaginan",
    bidang: "Teknologi Pengolahan Pangan",
    tahapUtama: "seminar_hasil",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Target semhas dalam 30 hari (tanggal 14 Maret 2025), persiapan slide dan draf artikel",
    tglLaporan: "2025-02-18",
    tglSubstantif: "2025-02-18",
    hambatan: "Persiapan slide presentasi dan format artikel ilmiah prodi.",
    tindakan: "Simulasi presentasi hasil penelitian bersama pembimbing.",
    pj: "Bastian Nova",
    targetTindak: "2025-03-05",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "disetujui" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-07-10", tglSelesai: "2024-08-05" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-08-10", tglSelesai: "2024-09-20" },
      penelitian: { status: "selesai", tglMulai: "2024-09-25", tglSelesai: "2024-12-20" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2024-12-15", tglSelesai: "2025-01-25" },
      seminar_hasil: { status: "menunggu_jadwal", targetSelesai: "2025-03-14" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-04-30" }
    }
  },
  // Mahasiswa Belum Memiliki Judul (Angkatan 2021 & 2022)
  {
    nim: "2111123025",
    nama: "Fikri Ramadhana",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 0, // Prof. Dr. Aisman
    pPendampingIdx: null,
    judul: null, // BELUM MEMILIKI JUDUL
    bidang: "Pascapanen & Pengolahan Hasil",
    tahapUtama: "penetapan_judul",
    statusPerhatian: "prioritas",
    alasanPerhatian: "Semester 8 namun belum menetapkan judul skripsi; perlu pendampingan penentuan topik",
    tglLaporan: "2025-01-20",
    tglSubstantif: "2024-10-15",
    hambatan: "Mahasiswa masih bimbang memilih topik antara pascapanen kopi atau olahan gambir.",
    tindakan: "Pertemuan konsultasi khusus penentuan topik dan pembimbing pendamping.",
    pj: "Prof. Dr. Aisman",
    targetTindak: "2025-03-07",
    butuhBantuan: true,
    chapters: [
      { num: 1, status: "belum_dimulai" },
      { num: 2, status: "belum_dimulai" },
      { num: 3, status: "belum_dimulai" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "sedang_berjalan", tglMulai: "2024-09-01", targetSelesai: "2024-11-30" }, // terlewati
      seminar_proposal: { status: "belum_dimulai" },
      penelitian: { status: "belum_dimulai" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2211121001",
    nama: "Zahra Humaira",
    angkatan: 2022,
    statusAkademik: "aktif",
    semesterManual: 6,
    pUtamaIdx: 1, // Prof. Dr. Novizar Nazir
    pPendampingIdx: null,
    judul: null, // BELUM MEMILIKI JUDUL
    bidang: "Bioteknologi Industri Pangan",
    tahapUtama: "penetapan_judul",
    statusPerhatian: "belum_cukup_data",
    alasanPerhatian: "Baru penetapan pembimbing semester ini; proses perumusan ide penelitian",
    tglLaporan: "2025-02-10",
    tglSubstantif: "2025-02-10",
    hambatan: "Studi literatur awal.",
    tindakan: "Pengajuan 2 opsi draf judul ke pembimbing utama.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-15",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "belum_dimulai" },
      { num: 2, status: "belum_dimulai" },
      { num: 3, status: "belum_dimulai" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "sedang_berjalan", tglMulai: "2025-01-15", targetSelesai: "2025-03-25" },
      seminar_proposal: { status: "belum_dimulai" },
      penelitian: { status: "belum_dimulai" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2211121005",
    nama: "Dicky Darmawan",
    angkatan: 2022,
    statusAkademik: "aktif",
    semesterManual: 6,
    pUtamaIdx: 2, // Prof. Rini
    pPendampingIdx: 11, // Wellyalina
    judul: "Potensi Pati Talas Lokal Sumatera Barat sebagai Pengental Alami pada Pembuatan Saus Tomat",
    bidang: "Teknologi Pengolahan Pangan",
    tahapUtama: "penetapan_judul",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Judul telah disetujui, sedang menyusun Bab I proposal skripsi",
    tglLaporan: "2025-02-15",
    tglSubstantif: "2025-02-15",
    hambatan: "Pencarian referensi sifat reologi pati talas termodifikasi.",
    tindakan: "Penyelesaian draf Bab I dan penyerahan ke pembimbing.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-10",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "draf" },
      { num: 2, status: "belum_dimulai" },
      { num: 3, status: "belum_dimulai" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2025-01-10", tglSelesai: "2025-02-05" },
      seminar_proposal: { status: "sedang_berjalan", tglMulai: "2025-02-06", targetSelesai: "2025-05-20" },
      penelitian: { status: "belum_dimulai" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2211122002",
    nama: "Nabila Syahrani",
    angkatan: 2022,
    statusAkademik: "aktif",
    semesterManual: 6,
    pUtamaIdx: 3, // Prof. Tuty Anggraini
    pPendampingIdx: null,
    judul: null, // BELUM MEMILIKI JUDUL
    bidang: "Teknologi Minuman & Perkebunan",
    tahapUtama: "penetapan_judul",
    statusPerhatian: "belum_cukup_data",
    alasanPerhatian: "Tahap awal pemetaan topik riset teh hitam/kopi",
    tglLaporan: "2025-02-01",
    tglSubstantif: "2025-02-01",
    hambatan: "Belum menetapkan judul definitif.",
    tindakan: "Diskusi topik riset dengan kelompok riset pembimbing.",
    pj: "Prof. Tuty Anggraini",
    targetTindak: "2025-03-15",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "belum_dimulai" },
      { num: 2, status: "belum_dimulai" },
      { num: 3, status: "belum_dimulai" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "sedang_berjalan", tglMulai: "2025-01-20", targetSelesai: "2025-03-31" },
      seminar_proposal: { status: "belum_dimulai" },
      penelitian: { status: "belum_dimulai" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  // Mahasiswa yang sudah lulus administratif
  {
    nim: "2011121010",
    nama: "Fani Rahmadani",
    angkatan: 2020,
    statusAkademik: "lulus",
    semesterManual: 9,
    lulusAdministratif: true,
    tglLulusAdministratif: "2025-02-01",
    pUtamaIdx: 4, // Prof. Kesuma Sayuti
    pPendampingIdx: 15, // Dr. Daimon Syukri
    judul: "Karakteristik Fisik dan Kimia Marshmallow dari Gelatin Tulang Ikan Nila dengan Penambahan Sari Stroberi",
    bidang: "Teknologi Pengolahan Pangan",
    tahapUtama: "ujian_sarjana",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Telah lulus ujian sarjana dan menyelesaikan seluruh persyaratan administrasi yudisium",
    tglLaporan: "2025-02-05",
    tglSubstantif: "2025-02-05",
    hambatan: "Tidak ada (selesai).",
    tindakan: "Pengambilan SKL dan pendaftaran wisuda.",
    pj: "Operator Prodi",
    targetTindak: "2025-02-28",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "disetujui" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-08-01", tglSelesai: "2023-08-20" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-09-01", tglSelesai: "2023-10-15" },
      penelitian: { status: "selesai", tglMulai: "2023-11-01", tglSelesai: "2024-05-15" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2024-05-20", tglSelesai: "2024-09-30" },
      seminar_hasil: { status: "selesai", tglMulai: "2024-10-10", tglSelesai: "2024-11-15" },
      ujian_sarjana: { status: "selesai", tglMulai: "2024-12-01", tglSelesai: "2025-01-15" }
    }
  },
  // Tambahan 6 mahasiswa untuk melengkapi 30 mahasiswa demonstrasi
  {
    nim: "2011122016",
    nama: "Ilham Kurniawan",
    angkatan: 2020,
    statusAkademik: "aktif",
    semesterManual: 10,
    pUtamaIdx: 5, // Prof. Novelina
    pPendampingIdx: 14, // Diana Silvy
    judul: "Pengaruh Kemasan Plastik Vakum terhadap Masa Simpan Rendang Daging Suwir pada Suhu Ruang",
    bidang: "Pengemasan & Pengawetan Pangan",
    tahapUtama: "seminar_hasil",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Jadwal semhas dalam 40 hari mendatang, draf naskah semhas telah ditinjau",
    tglLaporan: "2025-02-14",
    tglSubstantif: "2025-02-14",
    hambatan: "Penyusunan ringkasan komparasi mikroba total (TPC).",
    tindakan: "Penyelesaian revisi naskah semhas.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-10",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "ditinjau_pembimbing" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-10-05", tglSelesai: "2023-10-25" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-11-01", tglSelesai: "2023-12-15" },
      penelitian: { status: "selesai", tglMulai: "2024-01-10", tglSelesai: "2024-08-20" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2024-09-01", tglSelesai: "2025-01-20" },
      seminar_hasil: { status: "menunggu_jadwal", targetSelesai: "2025-03-20" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-05-15" }
    }
  },
  {
    nim: "2111121015",
    nama: "Miftahul Jannah",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 6, // Prof. Dr. Fauzan Azima
    pPendampingIdx: 13, // Linda Wati
    judul: "Pengaruh Perlakuan Sonikasi terhadap Rendemen dan Kualitas Minyak Atsiri Kulit Kayu Manis (Cinnamomum burmannii)",
    bidang: "Teknologi Minyak Atsiri & Rempah",
    tahapUtama: "penelitian",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Analisis kadar sinamaldehid sedang berlangsung di lab",
    tglLaporan: "2025-02-18",
    tglSubstantif: "2025-02-18",
    hambatan: "Pengulangan ekstraksi sampel ulangan ketiga.",
    tindakan: "Penyelesaian analisis refraktometer dan GC.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-25",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "draf" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-08-10", tglSelesai: "2024-09-01" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-09-10", tglSelesai: "2024-10-20" },
      penelitian: { status: "sedang_berjalan", tglMulai: "2024-11-01", targetSelesai: "2025-04-10" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2024-12-01", targetSelesai: "2025-05-20" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2111122028",
    nama: "Wahyu Tri Nugroho",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 7, // Prof. Rina Yenrina
    pPendampingIdx: 12, // Surya Aulia
    judul: "Karakteristik Fisikokimia dan Mutu Organoleptik Kerupuk Ikan Gabus dengan Penambahan Tepung Wortel sebagai Sumber Beta-Karoten",
    bidang: "Teknologi Pengolahan Pangan & Fortifikasi",
    tahapUtama: "seminar_proposal",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Penyusunan Bab I-III selesai, persiapan pendaftaran sempro",
    tglLaporan: "2025-02-17",
    tglSubstantif: "2025-02-17",
    hambatan: "Pengecekan kesiapan laboratorium penjemuran dan penggorengan.",
    tindakan: "Persetujuan naskah sempro dari kedua pembimbing.",
    pj: "Prof. Rina Yenrina",
    targetTindak: "2025-03-08",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-09-15", tglSelesai: "2024-10-10" },
      seminar_proposal: { status: "menunggu_jadwal", tglMulai: "2024-10-15", targetSelesai: "2025-03-10" },
      penelitian: { status: "belum_dimulai" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2111122030",
    nama: "Dina Mariana",
    angkatan: 2021,
    statusAkademik: "aktif",
    semesterManual: 8,
    pUtamaIdx: 8, // Reni Koja
    pPendampingIdx: 16, // Purnama Dini Hari
    judul: "Pengembangan Minuman Serbuk Instan Jahe Merah dan Daun Kelor dengan Metode Foam Mat Drying",
    bidang: "Rekayasa Pengeringan Pangan",
    tahapUtama: "penulisan_skripsi",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Bab IV dan V dalam penyusunan akhir, siap mendaftar seminar hasil",
    tglLaporan: "2025-02-19",
    tglSubstantif: "2025-02-19",
    hambatan: "Format penyajian grafik laju pengeringan.",
    tindakan: "Pemberian masukan format grafik oleh pembimbing pendamping.",
    pj: "Purnama Dini Hari",
    targetTindak: "2025-03-02",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "ditinjau_pembimbing" },
      { num: 5, status: "draf" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2024-08-01", tglSelesai: "2024-08-25" },
      seminar_proposal: { status: "selesai", tglMulai: "2024-09-01", tglSelesai: "2024-10-15" },
      penelitian: { status: "selesai", tglMulai: "2024-10-20", tglSelesai: "2025-01-20" },
      penulisan_skripsi: { status: "sedang_berjalan", tglMulai: "2025-01-15", targetSelesai: "2025-03-25" },
      seminar_hasil: { status: "belum_dimulai", targetSelesai: "2025-04-10" },
      ujian_sarjana: { status: "belum_dimulai", targetSelesai: "2025-05-25" }
    }
  },
  {
    nim: "2211121010",
    nama: "Faris Alamsyah",
    angkatan: 2022,
    statusAkademik: "aktif",
    semesterManual: 6,
    pUtamaIdx: 9, // Felga Zulfia Resdiana
    pPendampingIdx: null,
    judul: null, // BELUM MEMILIKI JUDUL
    bidang: "Teknologi Lemak & Emulsi",
    tahapUtama: "penetapan_judul",
    statusPerhatian: "belum_cukup_data",
    alasanPerhatian: "Mahasiswa angkatan 2022 baru menetapkan pembimbing utama, sedang tinjauan pustaka awal",
    tglLaporan: "2025-02-05",
    tglSubstantif: "2025-02-05",
    hambatan: "Pemilihan fokus bahan nabati lokal.",
    tindakan: "Pengumpulan 5 artikel rujukan bereputasi.",
    pj: "Mahasiswa",
    targetTindak: "2025-03-20",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "belum_dimulai" },
      { num: 2, status: "belum_dimulai" },
      { num: 3, status: "belum_dimulai" },
      { num: 4, status: "belum_dimulai" },
      { num: 5, status: "belum_dimulai" }
    ],
    stages: {
      penetapan_judul: { status: "sedang_berjalan", tglMulai: "2025-01-20", targetSelesai: "2025-04-15" },
      seminar_proposal: { status: "belum_dimulai" },
      penelitian: { status: "belum_dimulai" },
      penulisan_skripsi: { status: "belum_dimulai" },
      seminar_hasil: { status: "belum_dimulai" },
      ujian_sarjana: { status: "belum_dimulai" }
    }
  },
  {
    nim: "2011122019",
    nama: "Hendra Wijaya",
    angkatan: 2020,
    statusAkademik: "aktif",
    semesterManual: 10,
    pUtamaIdx: 10, // Dr. Ismed
    pPendampingIdx: 17, // Ridwan Rizkiyanto
    judul: "Pengaruh Penambahan Ekstrak Daun Sirih Merah terhadap Umur Simpan dan Kualitas Mikrobiologis Daging Ayam Broiler",
    bidang: "Mikrobiologi & Pengawetan Pangan",
    tahapUtama: "ujian_sarjana",
    statusPerhatian: "sesuai_rencana",
    alasanPerhatian: "Telah seminar hasil, draf skripsi final disetujui, pendaftaran ujian sarjana minggu ini",
    tglLaporan: "2025-02-18",
    tglSubstantif: "2025-02-18",
    hambatan: "Penyelarasan jadwal dewan penguji ujian sarjana.",
    tindakan: "Koordinasi sekretariat prodi untuk penjadwalan ujian.",
    pj: "Tim Pemantauan / Prodi",
    targetTindak: "2025-03-10",
    butuhBantuan: false,
    chapters: [
      { num: 1, status: "disetujui" },
      { num: 2, status: "disetujui" },
      { num: 3, status: "disetujui" },
      { num: 4, status: "disetujui" },
      { num: 5, status: "disetujui" }
    ],
    stages: {
      penetapan_judul: { status: "selesai", tglMulai: "2023-09-15", tglSelesai: "2023-10-10" },
      seminar_proposal: { status: "selesai", tglMulai: "2023-10-20", tglSelesai: "2023-11-25" },
      penelitian: { status: "selesai", tglMulai: "2023-12-01", tglSelesai: "2024-07-20" },
      penulisan_skripsi: { status: "selesai", tglMulai: "2024-07-25", tglSelesai: "2024-11-30" },
      seminar_hasil: { status: "selesai", tglMulai: "2024-12-10", tglSelesai: "2025-01-20" },
      ujian_sarjana: { status: "menunggu_jadwal", targetSelesai: "2025-03-12" }
    }
  }
];

async function main() {
  console.log("Memulai seeding data awal TPHP StudyTrack...");

  // 1. Settings
  for (const s of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: { key: s.key, value: s.value, description: s.description }
    });
  }
  console.log("✓ Pengaturan sistem berhasil disiapkan.");

  // 2. Initial Lecturers (20 exact lecturers)
  const lecturerMap = [];
  for (const d of DOSEN_LIST) {
    const existing = await prisma.lecturer.findFirst({
      where: { namaGelar: d.namaGelar }
    });
    let lec;
    if (existing) {
      lec = await prisma.lecturer.update({
        where: { id: existing.id },
        data: { nip: d.nip, email: d.email }
      });
    } else {
      lec = await prisma.lecturer.create({
        data: {
          nip: d.nip,
          namaGelar: d.namaGelar,
          email: d.email,
          isActive: true
        }
      });
    }
    lecturerMap.push(lec);
  }
  console.log(`✓ Master 20 Dosen berhasil disimpan.`);

  // 3. User Accounts (Admin, Kaprodi, and Dosen accounts)
  const defaultPasswordHash = await bcrypt.hash("admin123", 10);
  const kaprodiPasswordHash = await bcrypt.hash("kaprodi123", 10);
  const dosenPasswordHash = await bcrypt.hash("dosen123", 10);

  // Admin / Operator Prodi
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      name: "Administrator / Operator Prodi",
      email: "operator.tphp@ae.unand.ac.id",
      role: "ADMIN"
    },
    create: {
      username: "admin",
      password: defaultPasswordHash,
      name: "Administrator / Operator Prodi",
      email: "operator.tphp@ae.unand.ac.id",
      role: "ADMIN",
      isActive: true
    }
  });

  // Ketua Prodi / Tim Pemantauan
  const kaprodiUser = await prisma.user.upsert({
    where: { username: "kaprodi" },
    update: {
      name: "Ketua Prodi / Tim Pemantauan Studi TPHP",
      email: "kaprodi.tphp@ae.unand.ac.id",
      lecturerId: lecturerMap[1].id,
      role: "KAPRODI"
    },
    create: {
      username: "kaprodi",
      password: kaprodiPasswordHash,
      name: "Ketua Prodi / Tim Pemantauan Studi TPHP",
      email: "kaprodi.tphp@ae.unand.ac.id",
      lecturerId: lecturerMap[1].id,
      role: "KAPRODI",
      isActive: true
    }
  });

  // Dosen Accounts for all 20 lecturers
  for (let i = 0; i < DOSEN_LIST.length; i++) {
    const d = DOSEN_LIST[i];
    const lec = lecturerMap[i];
    await prisma.user.upsert({
      where: { username: d.username },
      update: {
        name: d.namaGelar,
        email: d.email,
        lecturerId: lec.id,
        role: "DOSEN"
      },
      create: {
        username: d.username,
        password: dosenPasswordHash,
        name: d.namaGelar,
        email: d.email,
        role: "DOSEN",
        lecturerId: lec.id,
        isActive: true
      }
    });
  }
  console.log("✓ Akun pengguna (Admin, Kaprodi, dan 20 Dosen) berhasil disiapkan.");

  // 4. Demonstration Data: 30 Fictitious Students with Stages, Chapters, and Reports
  console.log("Menyiapkan Data Demonstrasi (30 Mahasiswa)...");

  // Hapus data demo lama jika ada
  await prisma.student.deleteMany({
    where: { isDemo: true }
  });

  for (const item of DEMO_STUDENTS) {
    const pUtama = lecturerMap[item.pUtamaIdx];
    const pPendamping = item.pPendampingIdx !== null ? lecturerMap[item.pPendampingIdx] : null;

    const student = await prisma.student.create({
      data: {
        nim: item.nim,
        nama: item.nama,
        angkatan: item.angkatan,
        prodi: "Teknologi Pangan dan Hasil Pertanian",
        statusAkademik: item.statusAkademik,
        semesterManual: item.semesterManual,
        semesterCuti: item.semesterCuti || 0,
        pembimbingUtamaId: pUtama ? pUtama.id : null,
        pembimbingPendampingId: pPendamping ? pPendamping.id : null,
        tglPenetapanPembimbing: "2024-08-01",
        judulSkripsi: item.judul,
        bidangPenelitian: item.bidang,
        tglMulaiTugasAkhir: "2024-08-15",
        targetSelesai: "2025-06-30",
        email: `${item.nim}@alumni.unand.ac.id`,
        noHp: `08126789${item.nim.slice(-4)}`,
        isDemo: true,
        isArchived: false,
        version: 1,
        tglLaporanTerakhir: item.tglLaporan,
        tglKemajuanSubstantif: item.tglSubstantif,
        statusPerhatian: item.statusPerhatian,
        alasanPerhatian: item.alasanPerhatian,
        tahapUtama: item.tahapUtama,
        lulusAdministratif: item.lulusAdministratif || false,
        tglLulusAdministratif: item.tglLulusAdministratif || null,
        catatanAdministratif: "Data dimasukkan dalam mode demonstrasi pengujian alur prodi."
      }
    });

    // Seed 6 stages for student
    const stageDefs = [
      { key: "penetapan_judul", name: "Penetapan Judul" },
      { key: "seminar_proposal", name: "Seminar Proposal" },
      { key: "penelitian", name: "Penelitian" },
      { key: "penulisan_skripsi", name: "Penulisan Skripsi" },
      { key: "seminar_hasil", name: "Seminar Hasil" },
      { key: "ujian_sarjana", name: "Ujian Sarjana" },
    ];

    for (const def of stageDefs) {
      const stageData = item.stages && item.stages[def.key] ? item.stages[def.key] : null;
      await prisma.studentStage.create({
        data: {
          studentId: student.id,
          stageKey: def.key,
          stageName: def.name,
          status: stageData ? stageData.status : "belum_dilaporkan",
          tglMulai: stageData?.tglMulai || null,
          targetSelesai: stageData?.targetSelesai || null,
          tglSelesaiAktual: stageData?.tglSelesai || null,
          catatan: stageData?.catatan || null
        }
      });
    }

    // Seed 5 chapters
    const defaultChapters = [
      "Bab I: Pendahuluan",
      "Bab II: Tinjauan Pustaka",
      "Bab III: Metodologi Penelitian",
      "Bab IV: Hasil dan Pembahasan",
      "Bab V: Kesimpulan dan Saran"
    ];
    for (let c = 1; c <= 5; c++) {
      const ch = item.chapters ? item.chapters.find(x => x.num === c) : null;
      await prisma.thesisChapterProgress.create({
        data: {
          studentId: student.id,
          chapterNum: c,
          chapterName: defaultChapters[c - 1],
          status: ch ? ch.status : "belum_dimulai",
          tglDraf: ch && ch.status !== "belum_dimulai" ? "2024-11-01" : null,
          tglDisetujui: ch && ch.status === "disetujui" ? "2025-01-15" : null
        }
      });
    }

    // Seed Progress Report
    if (item.tglLaporan) {
      await prisma.progressReport.create({
        data: {
          studentId: student.id,
          reporterId: adminUser.id,
          reporterName: pUtama ? pUtama.namaGelar : "Operator Prodi",
          reporterRole: "Pembimbing Utama",
          tglLaporan: `${item.tglLaporan} 14:30`,
          tglKondisi: item.tglLaporan,
          substantiveProgressDate: item.tglSubstantif,
          isNoChange: false,
          ringkasanKemajuan: `Kemajuan pada tahap ${item.tahapUtama.replace('_', ' ')}. Kondisi terkontrol.`,
          tglBimbinganTerakhir: item.tglLaporan,
          hambatanUtama: item.hambatan || "Tidak ada kendala spesifik.",
          tindakanBerikutnya: item.tindakan || "Lanjutkan sesuai jadwal.",
          penanggungJawabTindakan: item.pj || (pUtama ? pUtama.namaGelar : "Mahasiswa"),
          targetTindakLanjut: item.targetTindak || "2025-03-31",
          kebutuhanBantuanProdi: item.butuhBantuan || false,
          kebutuhanBantuanCatatan: item.butuhBantuan ? "Mohon dukungan koordinasi dari program studi." : null,
          isRetrospektif: false
        }
      });
    }

    // Seed Follow Up Action if needed
    if (item.butuhBantuan || item.statusPerhatian === "prioritas") {
      await prisma.followUpAction.create({
        data: {
          studentId: student.id,
          masalah: item.hambatan || "Memerlukan percepatan penyelesaian studi.",
          tindakanDisepakati: item.tindakan || "Pertemuan evaluasi prodi bersama pembimbing dan mahasiswa.",
          penanggungJawab: item.pj || "Kaprodi / Tim Pemantauan",
          tenggat: item.targetTindak || "2025-03-31",
          status: "sedang_ditangani",
          tglEvaluasiBerikutnya: "2025-03-15",
          createdByName: "Ketua Prodi / Tim Pemantauan"
        }
      });
    }

    // Seed Title History if student has title
    if (item.judul) {
      await prisma.titleHistory.create({
        data: {
          studentId: student.id,
          oldTitle: null,
          newTitle: item.judul,
          statusJudul: item.tahapUtama === "penetapan_judul" ? "sementara" : "definitif",
          changeDate: "2024-09-01",
          reason: "Penetapan judul awal skripsi oleh tim komisi pembimbing",
          changedBy: pUtama ? pUtama.namaGelar : "Operator Prodi"
        }
      });
    }

    // Seed Advisor Assignment History
    await prisma.advisorAssignmentHistory.create({
      data: {
        studentId: student.id,
        oldUtamaNama: null,
        oldPendampingNama: null,
        newUtamaNama: pUtama ? pUtama.namaGelar : "-",
        newPendampingNama: pPendamping ? pPendamping.namaGelar : "-",
        changeDate: "2024-08-01",
        reason: "Surat Keputusan (SK) Penetapan Dosen Pembimbing Skripsi Mahasiswa Tingkat Akhir",
        changedBy: "Operator Prodi"
      }
    });
  }

  // 5. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      action: "SEED",
      entity: "System",
      details: "Inisialisasi sistem, 20 dosen master, dan 30 data mahasiswa demonstrasi."
    }
  });

  // 6. In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: "Selamat Datang di TPHP StudyTrack",
        message: "Aplikasi siap digunakan untuk pemantauan skripsi dan pelaporan kemajuan studi mahasiswa TPHP Fateta Unand.",
        type: "info",
        targetRole: "ALL",
        isRead: false
      },
      {
        title: "Permintaan Bantuan Prodi Terdeteksi",
        message: "Dosen pembimbing menandai perlunya intervensi prodi untuk mahasiswa Arief Hidayatullah (NIM 1911121001).",
        type: "assistance_request",
        targetRole: "KAPRODI",
        isRead: false
      },
      {
        title: "Peringatan Target Terlewati",
        message: "Target seminar proposal Budi Santoso (NIM 2111121003) telah melewati tenggat.",
        type: "overdue",
        targetRole: "DOSEN",
        isRead: false
      }
    ]
  });

  console.log("✓ Seeding selesai sepenuhnya dengan sukses!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
