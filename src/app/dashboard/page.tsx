'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import StatusBadge from '@/components/StatusBadge';
import {
  Users,
  AlertTriangle,
  Clock,
  BookOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  Award,
  Calendar,
  ChevronRight,
  TrendingUp,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Filter,
  Maximize2,
  ZoomIn,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [demoCount, setDemoCount] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Current user
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      // 2. All students
      const stdRes = await fetch('/api/students?limit=200');
      const stdData = await stdRes.json();
      setStudents(stdData.data || []);

      // 3. Lecturers
      const lecRes = await fetch('/api/dosen');
      const lecData = await lecRes.json();
      setLecturers(lecData.data || []);

      // 4. Demo count
      const demoRes = await fetch('/api/demo/toggle');
      const demoData = await demoRes.json();
      setDemoCount(demoData.demoCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics according to Section 7:
  const activeStudents = students.filter((s) => s.statusAkademik === 'aktif');
  const totalActive = activeStudents.length;

  // 1. TAHAP UTAMA MAHASISWA (Mutually Exclusive: 1 category per student -> Reconciles to 100% of active students)
  const tahapUtamaCounts = {
    penetapan_judul: activeStudents.filter((s) => s.tahapUtama === 'penetapan_judul').length,
    seminar_proposal: activeStudents.filter((s) => s.tahapUtama === 'seminar_proposal').length,
    penelitian: activeStudents.filter((s) => s.tahapUtama === 'penelitian').length,
    penulisan_skripsi: activeStudents.filter((s) => s.tahapUtama === 'penulisan_skripsi').length,
    seminar_hasil: activeStudents.filter((s) => s.tahapUtama === 'seminar_hasil').length,
    ujian_sarjana: activeStudents.filter((s) => s.tahapUtama === 'ujian_sarjana').length,
  };

  // Specific metric cards:
  const belumAdaJudulCount = activeStudents.filter((s) => !s.judulSkripsi).length;
  const sudahUjianCount = students.filter((s) => {
    const uj = s.stages?.find((st: any) => st.stageKey === 'ujian_sarjana');
    return uj && uj.status === 'selesai';
  }).length;
  const lulusAdministratifCount = students.filter((s) => s.lulusAdministratif).length;
  const perluPerhatianCount = activeStudents.filter(
    (s) => s.computedAttention?.status === 'perlu_perhatian' || s.computedAttention?.status === 'prioritas'
  ).length;
  const belumUpdateLaporanCount = activeStudents.filter(
    (s) => (s.computedAttention?.daysSinceLastReport ?? 999) > 30
  ).length;

  // 2. AKTIVITAS YANG SEDANG BERJALAN (May overlap, e.g. research + thesis writing simultaneously)
  const aktivitasBerjalanCounts = {
    persiapan_sempro: activeStudents.filter((s) => {
      const st = s.stages?.find((x: any) => x.stageKey === 'seminar_proposal');
      return st?.status === 'sedang_berjalan' || st?.status === 'menunggu_jadwal';
    }).length,
    sedang_penelitian: activeStudents.filter((s) => {
      const st = s.stages?.find((x: any) => x.stageKey === 'penelitian');
      return st?.status === 'sedang_berjalan';
    }).length,
    sedang_penulisan: activeStudents.filter((s) => {
      const st = s.stages?.find((x: any) => x.stageKey === 'penelitian');
      const sk = s.stages?.find((x: any) => x.stageKey === 'penulisan_skripsi');
      return sk?.status === 'sedang_berjalan';
    }).length,
    persiapan_semhas: activeStudents.filter((s) => {
      const st = s.stages?.find((x: any) => x.stageKey === 'seminar_hasil');
      return st?.status === 'sedang_berjalan' || st?.status === 'menunggu_jadwal';
    }).length,
    persiapan_ujian: activeStudents.filter((s) => {
      const st = s.stages?.find((x: any) => x.stageKey === 'ujian_sarjana');
      return st?.status === 'sedang_berjalan' || st?.status === 'menunggu_jadwal';
    }).length,
  };

  // Cohort breakdown
  const cohortGroups: Record<number, number> = {};
  activeStudents.forEach((s) => {
    cohortGroups[s.angkatan] = (cohortGroups[s.angkatan] || 0) + 1;
  });

  // Upcoming Milestones (30 - 60 days)
  const today = new Date();
  const next60Days = new Date();
  next60Days.setDate(today.getDate() + 60);
  const todayStr = today.toISOString().split('T')[0];
  const next60Str = next60Days.toISOString().split('T')[0];

  const upcomingTargets = activeStudents
    .flatMap((s) =>
      (s.stages || [])
        .filter(
          (st: any) =>
            (st.stageKey === 'seminar_proposal' ||
              st.stageKey === 'seminar_hasil' ||
              st.stageKey === 'ujian_sarjana') &&
            st.targetSelesai &&
            st.targetSelesai >= todayStr &&
            st.targetSelesai <= next60Str &&
            st.status !== 'selesai'
        )
        .map((st: any) => ({
          student: s,
          stageName: st.stageName,
          targetDate: st.targetSelesai,
        }))
    )
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  // Navigate to filtered list helper (Section 7: "Semua kartu dan grafik harus dapat diklik untuk membuka daftar mahasiswa terkait")
  const navigateWithFilter = (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    router.push(`/mahasiswa?${query}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-unand-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Memuat Dashboard TPHP StudyTrack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchData} />}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Hero Showcase & Beranda Utama */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Kolom Kiri: Foto Kegiatan Utama (Rasio Asli 16:9, Jelas & Tanpa Bayangan Menutupi Orang) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              {/* Wadah Gambar 16:9 */}
              <div
                className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden cursor-pointer"
                onClick={() => setShowImageModal(true)}
              >
                <img
                  src="/beranda-kegiatan.jpg"
                  alt="TPHP go Global to Prince of Songkla University, Thailand"
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                />

                {/* Floating Badges: Diposisikan di sudut atas agar bersih dan tidak menutupi wajah siapapun */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 bg-slate-950/80 text-gold-300 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-md">
                    <Award className="w-3.5 h-3.5 text-gold-400" />
                    Dokumentasi Prodi TPHP
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-slate-950/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-md transition group-hover:bg-gold-500 group-hover:text-slate-950 group-hover:border-gold-400"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Perbesar Foto</span>
                  </button>
                </div>
              </div>

              {/* Caption Bar Terpisah di Bawah Gambar (100% Menjaga Foto Tetap Bersih & Jelas) */}
              <div className="p-4 bg-white flex-1 flex flex-col justify-center border-t border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      TPHP go Global to Prince of Songkla University, Thailand
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Program Studi Teknologi Pangan dan Hasil Pertanian &bull; FATETA Universitas Andalas
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="shrink-0 text-[11px] font-semibold text-unand-800 hover:text-unand-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Resolusi Penuh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Identitas Program Studi, Ringkasan, & Aksi Cepat */}
            <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between bg-gradient-to-br from-unand-950 via-unand-900 to-unand-850 text-white rounded-3xl border border-unand-800 shadow-sm">
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-gold-500 text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded tracking-wide uppercase shadow-xs">
                      PRODI TPHP
                    </span>
                    <span className="text-xs text-emerald-300 font-medium">T.A. 2024/2025 Genap</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
                    TPHP StudyTrack
                  </h1>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Sistem Informasi Pemantauan Kemajuan Tugas Akhir Mahasiswa Program Studi Teknologi Pangan dan Hasil Pertanian, Fakultas Teknologi Pertanian, Universitas Andalas.
                  </p>
                </div>

                {/* Highlight Chips */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/10 border border-white/10 rounded-xl p-3">
                    <span className="text-slate-300 text-[11px] block">Mahasiswa Aktif</span>
                    <strong className="text-xl font-black text-gold-300">{totalActive} Mahasiswa</strong>
                  </div>
                  <div className="bg-white/10 border border-white/10 rounded-xl p-3">
                    <span className="text-slate-300 text-[11px] block">Dosen Pembimbing</span>
                    <strong className="text-xl font-black text-white">{lecturers.length} Dosen</strong>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-4 border-t border-white/15 space-y-2 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => router.push('/tindak-lanjut?bahanRapat=true')}
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-slate-950" />
                    <span>Bahan Rapat Evaluasi</span>
                  </button>
                  <button
                    onClick={() => router.push('/bimbingan')}
                    className="bg-unand-700 hover:bg-unand-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-4 h-4 text-emerald-200" />
                    <span>Bimbingan Saya</span>
                  </button>
                </div>
                <button
                  onClick={() => router.push('/pelaporan')}
                  className="w-full text-center text-xs text-emerald-200 hover:text-white py-1 transition flex items-center justify-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-gold-300" />
                  <span>Lihat Kronologi Log Pelaporan Dosen &rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Top 11 Indicator Metric Cards */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Ringkasan Metrik Utama Program Studi</span>
              <span className="text-[11px] text-slate-400 font-normal">Klik kartu mana pun untuk memfilter daftar mahasiswa</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Card 1: Aktif */}
              <div
                onClick={() => navigateWithFilter({ statusAkademik: 'aktif' })}
                className="bg-white border border-slate-200 hover:border-unand-700 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Mhs Aktif</span>
                  <Users className="w-4 h-4 text-unand-800" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-unand-900">{totalActive}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Tingkat akhir</span>
                </div>
              </div>

              {/* Card 2: Belum Memiliki Judul */}
              <div
                onClick={() => navigateWithFilter({ tahap: 'penetapan_judul' })}
                className="bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Belum Ada Judul</span>
                  <BookOpen className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-amber-700">{belumAdaJudulCount}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Tahap perumusan</span>
                </div>
              </div>

              {/* Card 3: Menyiapkan Sempro */}
              <div
                onClick={() => navigateWithFilter({ tahap: 'seminar_proposal' })}
                className="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Siap Sempro</span>
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-blue-900">{tahapUtamaCounts.seminar_proposal}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Proposal skripsi</span>
                </div>
              </div>

              {/* Card 4: Sedang Penelitian */}
              <div
                onClick={() => navigateWithFilter({ tahap: 'penelitian' })}
                className="bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Penelitian</span>
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-indigo-900">{tahapUtamaCounts.penelitian}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Lab & analisis data</span>
                </div>
              </div>

              {/* Card 5: Menulis Skripsi */}
              <div
                onClick={() => navigateWithFilter({ tahap: 'penulisan_skripsi' })}
                className="bg-white border border-slate-200 hover:border-violet-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Tulis Skripsi</span>
                  <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-violet-900">{tahapUtamaCounts.penulisan_skripsi}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Kemajuan Bab I–V</span>
                </div>
              </div>

              {/* Card 6: Siap Semhas */}
              <div
                onClick={() => navigateWithFilter({ tahap: 'seminar_hasil' })}
                className="bg-white border border-slate-200 hover:border-teal-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Siap Semhas</span>
                  <Award className="w-4 h-4 text-teal-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-teal-900">{tahapUtamaCounts.seminar_hasil}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Seminar hasil</span>
                </div>
              </div>

              {/* Card 7: Menyiapkan Ujian */}
              <div
                onClick={() => navigateWithFilter({ tahap: 'ujian_sarjana' })}
                className="bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Siap Ujian</span>
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-emerald-900">{tahapUtamaCounts.ujian_sarjana}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Sidang sarjana</span>
                </div>
              </div>

              {/* Card 8: Sudah Ujian */}
              <div
                onClick={() => navigateWithFilter({ tahap: 'ujian_sarjana' })}
                className="bg-white border border-slate-200 hover:border-emerald-600 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Sudah Ujian</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-emerald-800">{sudahUjianCount}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Menunggu revisi/yudisium</span>
                </div>
              </div>

              {/* Card 9: Lulus Administratif */}
              <div
                onClick={() => navigateWithFilter({ statusAkademik: 'lulus' })}
                className="bg-white border border-slate-200 hover:border-emerald-700 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold text-slate-700">Lulus Adm.</span>
                  <Award className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-emerald-900">{lulusAdministratifCount}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Yudisium selesai</span>
                </div>
              </div>

              {/* Card 10: Perlu Perhatian */}
              <div
                onClick={() => navigateWithFilter({ statusPerhatian: 'perlu_perhatian' })}
                className="bg-white border-2 border-red-200 hover:border-red-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between bg-red-50/20"
              >
                <div className="flex items-center justify-between text-red-600">
                  <span className="text-xs font-bold text-red-800">Perlu Perhatian</span>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-red-700">{perluPerhatianCount}</span>
                  <span className="text-[10px] text-red-600/80 block mt-0.5">Hambatan / Masa Studi</span>
                </div>
              </div>

              {/* Card 11: Belum Diperbarui Laporannya */}
              <div
                onClick={() => navigateWithFilter({ umurLaporan: '30' })}
                className="bg-white border border-slate-200 hover:border-yellow-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between bg-yellow-50/20"
              >
                <div className="flex items-center justify-between text-yellow-600">
                  <span className="text-xs font-semibold text-yellow-800">Laporan &gt; 30 Hari</span>
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-yellow-800">{belumUpdateLaporanCount}</span>
                  <span className="text-[10px] text-yellow-700/80 block mt-0.5">Perlu update dosen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Section 7 Requirement: Differentiate the 2 Types of Summaries */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-3 mb-4">
              <Info className="w-5 h-5 text-unand-800 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Penjelasan Dua Jenis Ringkasan (Rekonsiliasi Angka vs Aktivitas Tumpang-Tindih)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Dashboard membedakan secara tegas antara <strong>Tahap Utama Mahasiswa</strong> (kategori saling bebas, total 100% mahasiswa aktif) dan <strong>Aktivitas yang Sedang Berjalan</strong> (boleh tumpang tindih karena penelitian lab dan penulisan skripsi diperbolehkan berjalan secara simultan).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Type 1: Tahap Utama (Reconciled) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-unand-700" />
                    1. Tahap Utama (Satu Kategori per Mahasiswa)
                  </span>
                  <span className="text-xs font-mono font-semibold text-unand-800">
                    Total: {totalActive} Mhs (100%)
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {Object.entries(tahapUtamaCounts).map(([key, count]) => {
                    const pct = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
                    const labels: Record<string, string> = {
                      penetapan_judul: 'Penetapan Judul',
                      seminar_proposal: 'Seminar Proposal',
                      penelitian: 'Penelitian',
                      penulisan_skripsi: 'Penulisan Skripsi',
                      seminar_hasil: 'Seminar Hasil',
                      ujian_sarjana: 'Ujian Sarjana',
                    };
                    return (
                      <div
                        key={key}
                        onClick={() => navigateWithFilter({ tahap: key })}
                        className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition border border-slate-100"
                      >
                        <div className="flex justify-between font-medium text-slate-700 mb-1">
                          <span>{labels[key]}</span>
                          <span className="font-bold text-slate-900">{count} mhs ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-unand-800 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Type 2: Aktivitas Berjalan (Overlapping) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    2. Aktivitas yang Sedang Berjalan (Boleh Tumpang-Tindih)
                  </span>
                  <span className="text-xs text-slate-400 italic">Simultan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    onClick={() => navigateWithFilter({ tahap: 'seminar_proposal' })}
                    className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100/70 transition"
                  >
                    <span className="text-[11px] text-blue-700 font-medium block">Penyusunan Proposal</span>
                    <span className="text-xl font-black text-blue-950 mt-1 block">
                      {aktivitasBerjalanCounts.persiapan_sempro} Mahasiswa
                    </span>
                  </div>

                  <div
                    onClick={() => navigateWithFilter({ tahap: 'penelitian' })}
                    className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100/70 transition"
                  >
                    <span className="text-[11px] text-indigo-700 font-medium block">Pelaksanaan Lab / Riset</span>
                    <span className="text-xl font-black text-indigo-950 mt-1 block">
                      {aktivitasBerjalanCounts.sedang_penelitian} Mahasiswa
                    </span>
                  </div>

                  <div
                    onClick={() => navigateWithFilter({ tahap: 'penulisan_skripsi' })}
                    className="p-3 bg-violet-50/60 border border-violet-200 rounded-xl cursor-pointer hover:bg-violet-100/70 transition"
                  >
                    <span className="text-[11px] text-violet-700 font-medium block">Penulisan Bab I-V Berjalan</span>
                    <span className="text-xl font-black text-violet-950 mt-1 block">
                      {aktivitasBerjalanCounts.sedang_penulisan} Mahasiswa
                    </span>
                  </div>

                  <div
                    onClick={() => navigateWithFilter({ tahap: 'seminar_hasil' })}
                    className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl cursor-pointer hover:bg-teal-100/70 transition"
                  >
                    <span className="text-[11px] text-teal-700 font-medium block">Persiapan Semhas / Ujian</span>
                    <span className="text-xl font-black text-teal-950 mt-1 block">
                      {aktivitasBerjalanCounts.persiapan_semhas + aktivitasBerjalanCounts.persiapan_ujian} Mahasiswa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visualizations & Upcoming Milestones (Section 7) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual 1: Distribusi Angkatan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Kemajuan Menurut Angkatan
                </h3>
                <span className="text-[11px] text-slate-400">Kohort</span>
              </div>

              <div className="space-y-3">
                {Object.entries(cohortGroups)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([angkatan, count]) => {
                    const pct = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
                    const isOld = Number(angkatan) <= 2020;
                    return (
                      <div
                        key={angkatan}
                        onClick={() => navigateWithFilter({ angkatan })}
                        className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition"
                      >
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className={isOld ? 'text-red-700 font-bold' : 'text-slate-800'}>
                            Angkatan {angkatan} {isOld && '(Masa Studi Kritis)'}
                          </span>
                          <span className="text-slate-900 font-mono">{count} Mhs</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isOld ? 'bg-red-600' : 'bg-unand-800'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Visual 2: Beban Bimbingan per Dosen (Top 8) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Beban Bimbingan Dosen
                </h3>
                <Link
                  href="/dosen"
                  className="text-[11px] text-unand-800 hover:underline font-semibold"
                >
                  Semua (20) &rarr;
                </Link>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {lecturers
                  .sort((a, b) => (b.totalBeban || 0) - (a.totalBeban || 0))
                  .slice(0, 7)
                  .map((lec) => (
                    <div
                      key={lec.id}
                      onClick={() => navigateWithFilter({ dosenId: lec.id })}
                      className="p-2 border rounded-lg hover:bg-slate-50 cursor-pointer transition text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 truncate pr-2" title={lec.namaGelar}>
                        {lec.namaGelar}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono">
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold" title="Pembimbing Utama">
                          U: {lec.totalBimbinganUtama || 0}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded" title="Pembimbing Pendamping">
                          P: {lec.totalBimbinganPendamping || 0}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Visual 3: Target Seminar / Ujian dalam 30–60 Hari Mendatang */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-unand-800" />
                  Target Sempro / Semhas / Ujian (30–60 Hari)
                </h3>
                <span className="text-[11px] font-mono font-bold text-unand-800 bg-unand-50 px-2 py-0.5 rounded">
                  {upcomingTargets.length} Agenda
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {upcomingTargets.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Tidak ada jadwal target dalam 60 hari ke depan.
                  </div>
                ) : (
                  upcomingTargets.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => router.push(`/mahasiswa/${item.student.id}`)}
                      className="p-2.5 bg-slate-50 border rounded-xl hover:bg-emerald-50/50 cursor-pointer transition text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          {item.student.nama}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          NIM {item.student.nim} &bull; {item.stageName}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-unand-800 bg-white border px-2 py-1 rounded shrink-0">
                        {item.targetDate}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Lightbox Modal: Foto Dokumentasi Resolusi Penuh & Bebas Distorsi */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/95 border-b border-white/10 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    TPHP go Global to Prince of Songkla University, Thailand
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Program Studi Teknologi Pangan dan Hasil Pertanian &bull; FATETA Universitas Andalas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Area Gambar Asli */}
            <div className="p-2 sm:p-4 bg-black/90 flex items-center justify-center overflow-auto flex-1">
              <img
                src="/beranda-kegiatan.jpg"
                alt="TPHP go Global to Prince of Songkla University, Thailand - Resolusi Penuh"
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 bg-slate-950/95 border-t border-white/10 text-xs text-slate-300 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-slate-300">
                  Rasio Asli 16:9 &bull; Tampil utuh tanpa pemotongan dan tanpa penutup teks
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold text-white transition"
              >
                Tutup Tampilan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
