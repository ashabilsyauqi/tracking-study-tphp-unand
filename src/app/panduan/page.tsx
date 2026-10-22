'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import {
  BookOpen,
  HelpCircle,
  Users,
  Send,
  ListTodo,
  FileSpreadsheet,
  GraduationCap,
  Settings,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Printer,
  ChevronRight,
  ExternalLink,
  FileText,
  FileDown,
  Layers,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function PanduanPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [demoCount, setDemoCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'semua' | 'dosen' | 'kaprodi' | 'admin' | 'faq'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user);
      }
      const demoRes = await fetch('/api/demo/toggle');
      if (demoRes.ok) {
        const demoData = await demoRes.json();
        setDemoCount(demoData.demoCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchData} />}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-unand-950 via-unand-900 to-unand-850 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-unand-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-gold-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                    PANDUAN RESMI
                  </span>
                  <span className="text-xs text-emerald-300 font-medium">TPHP StudyTrack v1.0</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Bagaimana Cara Menggunakan StudyTrack?
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  Buku petunjuk pengoperasian sistem informasi pemantauan kemajuan tugas akhir mahasiswa Program Studi Teknologi Pangan dan Hasil Pertanian (TPHP), Fakultas Teknologi Pertanian, Universitas Andalas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-xs border border-white/20 transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-gold-300" />
                  <span>Cetak Panduan</span>
                </button>
                <Link
                  href="/dashboard"
                  className="bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <span>Buka Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="mt-8 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'semua', label: 'Ringkasan & Konsep Pokok' },
                  { id: 'dosen', label: 'Panduan Dosen Pembimbing' },
                  { id: 'kaprodi', label: 'Panduan Ketua Prodi' },
                  { id: 'admin', label: 'Panduan Administrator' },
                  { id: 'faq', label: 'Tanya Jawab (FAQ)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      activeTab === tab.id
                        ? 'bg-gold-500 text-slate-950 shadow-sm'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari kata kunci panduan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-900/60 border border-white/20 text-white placeholder-slate-400 focus:bg-slate-900 focus:ring-1 focus:ring-gold-400"
                />
              </div>
            </div>
          </div>

          {/* TAB 1: RINGKASAN & KONSEP POKOK */}
          {(activeTab === 'semua' || searchQuery) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold-500" />
                  1. Konsep Pokok & Prinsip Desain TPHP StudyTrack
                </h2>
                <span className="text-xs text-slate-500 font-mono">Prinsip Section 1 & 2</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Pelaporan Cepat 1 Menit</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistem dirancang seringan mungkin agar dosen pembimbing dapat melaporkan hasil bimbingan dalam waktu &plusmn; 1 menit tanpa beban administratif berlebih.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Tanggal Lapor vs Tanggal Substantif</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Jika mahasiswa belum mengalami kemajuan, klik <strong>"Belum Ada Perubahan"</strong>. Tanggal lapor dosen terbarukan hari ini, namun tanggal kemajuan substantif tetap terjaga untuk deteksi hambatan nyata.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Pencegahan Konflik Bersamaan</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Jika Pembimbing Utama dan Pembimbing Pendamping mengedit mahasiswa secara bersamaan, sistem mendeteksi perbedaan versi (kode 409) sehingga data tidak saling menimpa.
                  </p>
                </div>
              </div>

              {/* 6 Tahapan Utama Skripsi */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-unand-800" />
                  6 Tahapan Utama Tugas Akhir Mahasiswa (Rekonsiliasi 100%)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setiap mahasiswa aktif diposisikan tepat pada <strong>satu Tahap Utama</strong> untuk menjamin data dashboard dapat direkonsiliasi 100% tanpa tumpang tindih:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                  {[
                    { step: '1', title: 'Penetapan Judul', desc: 'Perumusan dan persetujuan topik skripsi' },
                    { step: '2', title: 'Seminar Proposal', desc: 'Ujian proposal penelitian (Sempro)' },
                    { step: '3', title: 'Penelitian', desc: 'Pelaksanaan riset lab/lapangan' },
                    { step: '4', title: 'Penulisan Skripsi', desc: 'Penyusunan naskah Bab I–V' },
                    { step: '5', title: 'Seminar Hasil', desc: 'Penyampaian hasil penelitian (Semhas)' },
                    { step: '6', title: 'Ujian Sarjana', desc: 'Sidang komprehensif kelulusan sarjana' },
                  ].map((t) => (
                    <div key={t.step} className="p-3 bg-slate-50 border rounded-2xl text-center space-y-1">
                      <span className="w-6 h-6 rounded-full bg-unand-800 text-gold-300 text-xs font-black inline-flex items-center justify-center">
                        {t.step}
                      </span>
                      <strong className="block text-xs font-bold text-slate-900 mt-1">{t.title}</strong>
                      <span className="text-[10px] text-slate-500 block leading-tight">{t.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN DOSEN PEMBIMBING */}
          {(activeTab === 'dosen' || activeTab === 'semua' || searchQuery) && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" />
                  2. Panduan Dosen Pembimbing (Utama & Pendamping)
                </h2>
                <span className="text-xs text-slate-500 font-mono">Role: DOSEN</span>
              </div>

              <div className="space-y-4">
                {/* Langkah 1 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center">1</span>
                    Melihat Daftar Mahasiswa Bimbingan Anda
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Masuk ke menu <strong>"Mahasiswa Bimbingan Saya"</strong> di sidebar kiri. Halaman ini hanya menampilkan mahasiswa yang Anda bimbing (baik sebagai Pembimbing Utama maupun Pendamping). Anda dapat melihat status penanda perhatian mahasiswa secara langsung.
                  </p>
                </div>

                {/* Langkah 2 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center">2</span>
                    Alur Pelaporan Cepat (1 Menit)
                  </div>
                  <div className="pl-8 text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p>Klik tombol <strong>"Lapor Cepat"</strong> pada kartu mahasiswa terkait:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Periksa ringkasan kemajuan terakhir dan catatan rekan pembimbing.</li>
                      <li>Perbarui tahapan utama atau progres bab skripsi (Bab I sampai Bab V) yang telah selesai/direvisi.</li>
                      <li>Tuliskan catatan kemajuan singkat, kendala utama (jika ada), dan rencana target berikutnya.</li>
                      <li>Jika mahasiswa mengalami hambatan berat (alat lab rusak, reagen kosong), centang opsi <em>"Memerlukan Bantuan / Intervensi Prodi"</em>.</li>
                      <li>Klik <strong>"Simpan Laporan Kemajuan"</strong>.</li>
                    </ol>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center">3</span>
                    Menggunakan Tombol "Belum Ada Perubahan"
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Jika Anda telah berkomunikasi/bertemu dengan mahasiswa namun belum ada kemajuan naskah/penelitian substantif, klik tombol <strong>"Belum Ada Perubahan"</strong>. Masukkan alasan singkat (misal: <em>"Mahasiswa menunggu hasil pengujian GC-MS"</em>). Tindakan ini membuktikan bahwa dosen tetap aktif memantau, sementara sistem tetap menghitung durasi sejak kemajuan substantif terakhir agar tidak terjadi *false green*.
                  </p>
                </div>

                {/* Langkah 4 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center">4</span>
                    Menghadapi Peringatan Konflik Bersamaan (Kode 409)
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Apabila rekan pembimbing lain baru saja menyimpan laporan saat Anda sedang membuka formulir, sistem akan menampilkan jendela <strong>"Peringatan Konflik Perubahan Data"</strong>. Anda dapat melihat apa saja yang baru diubah oleh rekan pembimbing dan memperbarui data Anda sebelum menyimpannya kembali tanpa khawatir data hilang tertimpa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PANDUAN KETUA PRODI / TIM PEMANTAU */}
          {(activeTab === 'kaprodi' || activeTab === 'semua' || searchQuery) && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-700" />
                  3. Panduan Ketua Program Studi / Tim Pemantau
                </h2>
                <span className="text-xs text-slate-500 font-mono">Role: KAPRODI</span>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">Membaca 11 Indikator Metrik Dashboard</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dashboard menyediakan 11 kartu indikator kunci: Mahasiswa Aktif, Belum Ada Judul, Persiapan Sempro, Sedang Penelitian, Sedang Penulisan Naskah, Menunggu Semhas, Siap Ujian, Lulus Administratif, Perlu Perhatian, Prioritas Pendampingan, dan Belum Update Laporan &gt;30 hari. <strong>Klik kartu metrik mana pun untuk langsung menyaring daftar mahasiswa</strong>.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">
                    Bahan Rapat Evaluasi & Resume Kemajuan Studi (PDF Siap Cetak)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buka menu <strong>"Tindak Lanjut"</strong> &rarr; pilih tab <strong>"Bahan Rapat & Resume Evaluasi"</strong>. Halaman ini otomatis merangkum seluruh mahasiswa berstatus prioritas beserta kendala spesifiknya. Klik tombol <strong>"Download Bahan Rapat (PDF)"</strong> untuk mendapatkan dokumen resmi yang siap diedarkan pada rapat pimpinan lengkap dengan kop surat resmi dan tanda tangan <strong>Ketua Program Studi TPHP (Prof. Dr. Novizar Nazir, NIP 196411251989111001)</strong>.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">Mencatat & Menutup Agenda Tindak Lanjut</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Untuk setiap mahasiswa yang dibahas dalam rapat, prodi dapat mendaftarkan butir tindakan yang disepakati (misal: <em>"Klinik asistensi penulisan Bab IV"</em>), menentukan Penanggung Jawab dan tenggat waktu. Setelah kendala terselesaikan, klik <strong>"Selesaikan Tindak Lanjut"</strong> dan catat hasil akhir penyelesaiannya.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PANDUAN ADMINISTRATOR / OPERATOR */}
          {(activeTab === 'admin' || activeTab === 'semua' || searchQuery) && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-800" />
                  4. Panduan Administrator / Operator Program Studi
                </h2>
                <span className="text-xs text-slate-500 font-mono">Role: ADMIN</span>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">Impor Data Mahasiswa via Excel / CSV</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buka menu <strong>"Mahasiswa"</strong> &rarr; klik tombol <strong>"Impor Excel/CSV"</strong>. Unduh template standar yang telah disediakan. Unggah berkas dan tinjau pratinjau validasi: sistem mencocokkan otomatis 20 nama dosen master dan memeriksa apakah ada NIM yang duplikat sebelum data disimpan ke basis data.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">Koreksi Data Administratif & Jejak Audit</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buka profil mahasiswa &rarr; klik <strong>"Koreksi Data Administratif"</strong>. Setiap perubahan data wajib menyertakan alasan perubahan. Seluruh aktivitas terekam permanen pada menu <strong>Audit Log</strong> sesuai kepatuhan standar mutu akademik universitas.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">Manajemen Pengaturan & Cadangan Database (Backup)</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buka menu <strong>"Pengaturan"</strong> untuk menyesuaikan ambang batas notifikasi (default: 30 hari laporan, 60 hari substantif, semester 8 batas waktu). Administrator dapat mengunduh berkas cadangan database (JSON Backup) kapan saja untuk keamanan arsip data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TANYA JAWAB (FAQ) */}
          {(activeTab === 'faq' || activeTab === 'semua' || searchQuery) && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  5. Tanya Jawab Sering Diajukan (FAQ)
                </h2>
                <span className="text-xs text-slate-500 font-mono">Bantuan & Solusi</span>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                  <strong className="text-sm font-bold text-slate-900 block">
                    Q: Bagaimana cara berganti akun untuk mencoba fitur dari sudut pandang Dosen atau Kaprodi?
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Di bilah navigasi atas (Navbar), klik tombol <strong>"Uji Peran"</strong>. Tersedia fitur 1-Klik Switch untuk berpindah akun secara instan antara Administrator, Ketua Prodi, maupun salah satu dari 20 Dosen Master tanpa perlu mengetik kata sandi ulang.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                  <strong className="text-sm font-bold text-slate-900 block">
                    Q: Apakah data demonstrasi mahasiswa dapat dibersihkan saat prodi siap mengisi data riil?
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ya. Di bagian atas layar terdapat banner <strong>"MODE DATA DEMONSTRASI"</strong>. Administrator dapat mengklik tombol <strong>"Bersihkan"</strong> untuk menghapus seluruh data simulasi ketika siap mengimpor data riil mahasiswa TPHP.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                  <strong className="text-sm font-bold text-slate-900 block">
                    Q: Mengapa mahasiswa berstatus cuti akademik tidak muncul di peringatan perlu perhatian?
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sesuai aturan akademik Universitas Andalas, mahasiswa yang sedang dalam masa cuti resmi dikecualikan dari perhitungan hari keterlambatan laporan agar tidak menimbulkan peringatan palsu (*false positive*).
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                  <strong className="text-sm font-bold text-slate-900 block">
                    Q: Siapa yang menandatangani dokumen PDF Laporan dan Bahan Rapat Evaluasi?
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Seluruh dokumen resmi hasil unduhan sistem secara otomatis dibubuhi lembar pengesahan yang diketahui oleh <strong>Ketua Program Studi TPHP: Prof. Dr. Novizar Nazir (NIP 196411251989111001)</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Help Footer Card */}
          <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-unand-800 text-gold-300 rounded-2xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Program Studi Teknologi Pangan dan Hasil Pertanian</h4>
                <p className="text-xs text-slate-500">Fakultas Teknologi Pertanian, Universitas Andalas &bull; Kampus Limau Manis, Padang</p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="bg-unand-800 hover:bg-unand-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              Kembali ke Beranda Dashboard &rarr;
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
