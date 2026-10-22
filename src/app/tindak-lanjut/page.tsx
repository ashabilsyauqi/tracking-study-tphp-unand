'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import StatusBadge from '@/components/StatusBadge';
import {
  ListTodo,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Check,
  X,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  FileDown,
  Printer,
  Sparkles,
  BarChart3,
  GraduationCap,
  Award,
  Layers,
} from 'lucide-react';
import { exportBahanRapatPDF } from '@/lib/exportHelper';

export function TindakLanjutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBahanRapat = searchParams.get('bahanRapat') === 'true';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'daftar' | 'bahanRapat'>(
    initialBahanRapat ? 'bahanRapat' : 'daftar'
  );
  const [loading, setLoading] = useState(true);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [priorityStudents, setPriorityStudents] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [demoCount, setDemoCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Bahan Rapat Quick Search & PDF state
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [bahanRapatSearch, setBahanRapatSearch] = useState('');
  const [bahanRapatAngkatanFilter, setBahanRapatAngkatanFilter] = useState('all');

  // Add Follow Up Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [masalah, setMasalah] = useState('');
  const [tindakanDisepakati, setTindakanDisepakati] = useState('');
  const [penanggungJawab, setPenanggungJawab] = useState('Ketua Prodi / Tim Pemantauan');
  const [tenggat, setTenggat] = useState('');
  const [tglEvaluasiBerikutnya, setTglEvaluasiBerikutnya] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resolve Follow Up Modal
  const [resolvingItem, setResolvingItem] = useState<any>(null);
  const [hasilTindakLanjut, setHasilTindakLanjut] = useState('');
  const [resolvingLoading, setResolvingLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      // Fetch follow ups
      const res = await fetch(`/api/tindak-lanjut?bahanRapat=true`);
      const data = await res.json();
      setFollowUps(data.data || []);
      setPriorityStudents(data.priorityStudents || []);

      // Fetch students for selector
      const stdRes = await fetch('/api/students?limit=150');
      const stdData = await stdRes.json();
      setStudentsList(stdData.data || []);

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

  const handleDownloadBahanRapatPDF = () => {
    try {
      setGeneratingPdf(true);
      exportBahanRapatPDF({
        priorityStudents,
        followUps,
        generatedBy: currentUser?.name || currentUser?.username || 'Tim Pemantauan TPHP',
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal menghasilkan file PDF. Pastikan data termuat lengkap.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Computed Resume Statistics for Bahan Rapat
  const prioritasCount = priorityStudents.filter((s) => s.statusPerhatian === 'prioritas').length;
  const perluPerhatianCount = priorityStudents.filter((s) => s.statusPerhatian === 'perlu_perhatian').length;
  const criticalSemesterCount = priorityStudents.filter(
    (s) => (s.calculatedSemester || s.semesterManual || 0) >= 8 || s.angkatan <= 2021
  ).length;
  const activeFollowUpsCount = priorityStudents.reduce(
    (acc, s) => acc + (s.followUps?.length || 0),
    0
  );

  const angkatanCounts: Record<number, number> = {};
  const tahapCounts: Record<string, number> = {};
  priorityStudents.forEach((s) => {
    angkatanCounts[s.angkatan] = (angkatanCounts[s.angkatan] || 0) + 1;
    const st = (s.tahapUtama || 'penetapan_judul').replace(/_/g, ' ');
    tahapCounts[st] = (tahapCounts[st] || 0) + 1;
  });

  // Top bottleneck stage
  const topBottleneckStage =
    Object.entries(tahapCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Penelitian Laboratorium';

  // Filtered priority students for the quick search
  const filteredPriorityStudents = priorityStudents.filter((std) => {
    if (bahanRapatAngkatanFilter !== 'all' && String(std.angkatan) !== bahanRapatAngkatanFilter) {
      return false;
    }
    if (!bahanRapatSearch.trim()) return true;
    const q = bahanRapatSearch.toLowerCase();
    const namaMatch = std.nama?.toLowerCase().includes(q);
    const nimMatch = std.nim?.toLowerCase().includes(q);
    const d1Match = std.pembimbingUtama?.namaGelar?.toLowerCase().includes(q);
    const d2Match = std.pembimbingPendamping?.namaGelar?.toLowerCase().includes(q);
    const reasonMatch = std.alasanPerhatian?.toLowerCase().includes(q);
    return namaMatch || nimMatch || d1Match || d2Match || reasonMatch;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !masalah || !tindakanDisepakati || !tenggat) {
      alert('Mohon lengkapi seluruh field wajib.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tindak-lanjut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          masalah,
          tindakanDisepakati,
          penanggungJawab,
          tenggat,
          tglEvaluasiBerikutnya: tglEvaluasiBerikutnya || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan agenda.');

      setShowAddModal(false);
      setMasalah('');
      setTindakanDisepakati('');
      setTenggat('');
      fetchData();
      alert('Agenda tindak lanjut berhasil ditambahkan.');
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;

    setResolvingLoading(true);
    try {
      const res = await fetch(`/api/tindak-lanjut/${resolvingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'selesai',
          hasilTindakLanjut: hasilTindakLanjut.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui status.');

      setResolvingItem(null);
      setHasilTindakLanjut('');
      fetchData();
      alert('Tindak lanjut berhasil ditandai selesai.');
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setResolvingLoading(false);
    }
  };

  const filteredFollowUps = followUps.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const matchName = item.student?.nama?.toLowerCase().includes(term);
      const matchNim = item.student?.nim?.includes(term);
      const matchAction = item.tindakanDisepakati?.toLowerCase().includes(term);
      const matchProblem = item.masalah?.toLowerCase().includes(term);
      return matchName || matchNim || matchAction || matchProblem;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchData} />}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Tindak Lanjut & Evaluasi Program Studi
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengelolaan intervensi, bantuan laboratorium, klinik penulisan, dan bahan rapat evaluasi pimpinan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Catat Tindak Lanjut Baru
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-4 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => setActiveTab('daftar')}
              className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'daftar'
                  ? 'border-unand-800 text-unand-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Daftar Tindak Lanjut ({followUps.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bahanRapat')}
              className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'bahanRapat'
                  ? 'border-amber-600 text-amber-950 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Bahan Rapat & Resume Evaluasi ({priorityStudents.length} Mahasiswa)</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                PDF Siap Download
              </span>
            </button>
          </div>

          {/* TAB 1: DAFTAR TINDAK LANJUT */}
          {activeTab === 'daftar' && (
            <div className="space-y-4">
              {/* Filter Toolbar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari berdasarkan mahasiswa, masalah, atau tindakan..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-unand-800"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        statusFilter === 'all' ? 'bg-unand-800 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setStatusFilter('terbuka')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        statusFilter === 'terbuka' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Terbuka
                    </button>
                    <button
                      onClick={() => setStatusFilter('sedang_ditangani')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        statusFilter === 'sedang_ditangani' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sedang Ditangani
                    </button>
                    <button
                      onClick={() => setStatusFilter('selesai')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        statusFilter === 'selesai' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              </div>

              {/* Follow Ups List */}
              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Memuat data tindak lanjut...</div>
              ) : filteredFollowUps.length === 0 ? (
                <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 text-xs">
                  Tidak ada agenda tindak lanjut yang cocok.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFollowUps.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white border rounded-2xl p-5 shadow-xs transition space-y-3 ${
                        item.status === 'selesai'
                          ? 'border-emerald-200'
                          : item.status === 'sedang_ditangani'
                          ? 'border-blue-200'
                          : 'border-amber-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/mahasiswa/${item.student?.id}`}
                              className="font-bold text-sm text-slate-900 hover:text-unand-800 transition hover:underline"
                            >
                              {item.student?.nama}
                            </Link>
                            <span className="font-mono text-xs text-slate-500">
                              (NIM {item.student?.nim} &bull; Angkatan {item.student?.angkatan})
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            Pembimbing: {item.student?.pembimbingUtama?.namaGelar || '-'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs uppercase font-bold px-2.5 py-0.5 rounded-full ${
                              item.status === 'selesai'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'sedang_ditangani'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status.replace(/_/g, ' ')}
                          </span>

                          {item.status !== 'selesai' && (
                            <button
                              onClick={() => {
                                setResolvingItem(item);
                                setHasilTindakLanjut('');
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition shadow-2xs flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Selesaikan
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="font-bold text-slate-700 block mb-1">Masalah / Hambatan:</span>
                          <p className="text-slate-600 leading-relaxed">{item.masalah}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="font-bold text-slate-700 block mb-1">Tindakan Yang Disepakati:</span>
                          <p className="text-slate-800 font-medium leading-relaxed">{item.tindakanDisepakati}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                        <div className="flex flex-wrap items-center gap-4">
                          <span>Penanggung Jawab: <strong className="text-slate-800">{item.penanggungJawab}</strong></span>
                          <span>Tenggat: <strong className="text-slate-800 font-mono">{item.tenggat}</strong></span>
                          {item.tglEvaluasiBerikutnya && (
                            <span>Evaluasi Berikutnya: <strong className="text-slate-800 font-mono">{item.tglEvaluasiBerikutnya}</strong></span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">Dicatat oleh: {item.createdByName}</span>
                      </div>

                      {item.hasilTindakLanjut && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                          <strong>Hasil Akhir Tindak Lanjut:</strong> {item.hasilTindakLanjut}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BAHAN RAPAT EVALUASI PRODI & RESUME EKSEKUTIF */}
          {activeTab === 'bahanRapat' && (
            <div className="space-y-6">
              {/* Header Banner & Tombol Download Bahan Rapat PDF */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-amber-100 text-amber-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                      Dokumen Komisi Skripsi & Pimpinan Prodi
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Semester Genap 2024/2025</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                    Bahan Rapat Evaluasi & Resume Kemajuan Studi
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-2xl">
                    Rangkuman otomatis kasus prioritas pendampingan, hambatan tahapan riset, dan agenda tindak lanjut prodi untuk bahan pertimbangan komisi skripsi dan rapat pimpinan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadBahanRapatPDF}
                    disabled={generatingPdf || priorityStudents.length === 0}
                    className="bg-unand-800 hover:bg-unand-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 border border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Download seluruh bahan rapat dan resume dalam satu file PDF resmi yang siap cetak"
                  >
                    <FileDown className="w-4 h-4 text-gold-300 group-hover:scale-110 transition-transform" />
                    <span>{generatingPdf ? 'Menyiapkan PDF...' : 'Download Bahan Rapat (PDF)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId('');
                      setMasalah('');
                      setShowAddModal(true);
                    }}
                    className="bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Catat Agenda Rapat</span>
                  </button>
                </div>
              </div>

              {/* KARTU RESUME EKSEKUTIF (Ditampilkan Langsung Dalam Form / Halaman Ini) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                {/* Header Resume */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-unand-800 rounded-xl border border-emerald-100">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        Resume Eksekutif Forum Evaluasi Kemajuan Studi
                        <span className="text-[11px] font-normal bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Rekap Real-Time
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Konsolidasi statistik kendala masa studi, sebaran angkatan, dan butir rekomendasi kebijakan operasional program studi.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 border px-3 py-1 rounded-lg">
                    Zona Waktu: Asia/Jakarta (WIB)
                  </span>
                </div>

                {/* 4 Kartu Indikator Pokok Resume */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50/40 border border-red-200">
                    <span className="text-[11px] font-bold text-red-800 block uppercase tracking-wider">Total Kasus Rapat</span>
                    <strong className="text-2xl font-black text-red-900 mt-1 block">{priorityStudents.length} Mahasiswa</strong>
                    <span className="text-[10px] text-red-700 block mt-0.5">
                      {prioritasCount} Prioritas &bull; {perluPerhatianCount} Perlu Perhatian
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50/40 border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-800 block uppercase tracking-wider">Semester Kritis (&ge;8)</span>
                    <strong className="text-2xl font-black text-amber-900 mt-1 block">{criticalSemesterCount} Mahasiswa</strong>
                    <span className="text-[10px] text-amber-700 block mt-0.5">
                      Perlu mitigasi batas masa studi DO
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200">
                    <span className="text-[11px] font-bold text-blue-800 block uppercase tracking-wider">Bottleneck Tahap</span>
                    <strong className="text-lg font-black text-blue-950 mt-1 block truncate capitalize" title={topBottleneckStage}>
                      {topBottleneckStage}
                    </strong>
                    <span className="text-[10px] text-blue-700 block mt-0.5">
                      Konsentrasi hambatan terbesar
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">Agenda Berjalan</span>
                    <strong className="text-2xl font-black text-emerald-950 mt-1 block">{activeFollowUpsCount} Tindakan</strong>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      Tindak lanjut dalam penanganan
                    </span>
                  </div>
                </div>

                {/* 2 Panel Analisis: Sebaran Kasus & Rekomendasi Rapat */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Panel Kiri (6 Kolom): Distribusi Angkatan & Tahap */}
                  <div className="lg:col-span-6 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                      <span>Sebaran Kasus Menurut Angkatan & Tahap</span>
                      <span className="text-[10px] font-normal text-slate-500">Klasifikasi Studi</span>
                    </h4>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-600 block">Distribusi per Angkatan:</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(angkatanCounts).map(([ang, count]) => (
                          <div key={ang} className="bg-white border rounded-xl px-3 py-1.5 text-xs shadow-2xs flex items-center gap-2">
                            <span className="font-bold text-slate-800">Angkatan {ang}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${Number(ang) <= 2019 ? 'bg-red-100 text-red-800' : Number(ang) === 2020 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                              {count} Mahasiswa
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-600 block">Distribusi Tahapan Utama yang Tertahan:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(tahapCounts).map(([thp, count]) => (
                          <div key={thp} className="bg-white border rounded-lg p-2 flex items-center justify-between">
                            <span className="text-slate-700 capitalize truncate mr-1">{thp}</span>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panel Kanan (6 Kolom): 4 Rekomendasi Forum Rapat */}
                  <div className="lg:col-span-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                      <span>Rekomendasi Kebijakan Forum Rapat</span>
                    </h4>
                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="p-2.5 bg-white border border-emerald-200/80 rounded-xl">
                        <strong className="text-slate-900 block font-bold">1. Intervensi Laboratorium & Riset Terpadu</strong>
                        <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                          Bagi mahasiswa tertahan pada analisis instrumen/reagen, prodi memfasilitasi akses prioritas lab penelitian FATETA.
                        </span>
                      </div>
                      <div className="p-2.5 bg-white border border-emerald-200/80 rounded-xl">
                        <strong className="text-slate-900 block font-bold">2. Fasilitasi Klinik Penulisan Skripsi</strong>
                        <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                          Pendampingan intensif penulisan naskah Bab IV & V bagi mahasiswa semester 8+ yang telah selesai penelitian.
                        </span>
                      </div>
                      <div className="p-2.5 bg-white border border-emerald-200/80 rounded-xl">
                        <strong className="text-slate-900 block font-bold">3. Rekonsiliasi & Harmonisasi Bimbingan</strong>
                        <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                          Menyelaraskan masukan antara Pembimbing Utama & Pendamping untuk menghindari revisi ganda yang berulang.
                        </span>
                      </div>
                      <div className="p-2.5 bg-white border border-emerald-200/80 rounded-xl">
                        <strong className="text-slate-900 block font-bold">4. Penetapan Target Sidang 30–60 Hari</strong>
                        <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                          Surat komitmen percepatan dan penjadwalan ujian sarjana bagi mahasiswa semester kritis (angkatan 2019–2020).
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matriks Ringkas Kasus Evaluasi (Quick Summary Matrix Table) */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4 text-unand-800" />
                      <span>Matriks Ringkas Mahasiswa Kasus Rapat</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={bahanRapatAngkatanFilter}
                        onChange={(e) => setBahanRapatAngkatanFilter(e.target.value)}
                        className="text-xs border rounded-lg bg-slate-50 p-1.5 focus:bg-white"
                      >
                        <option value="all">Semua Angkatan</option>
                        <option value="2019">Angkatan 2019</option>
                        <option value="2020">Angkatan 2020</option>
                        <option value="2021">Angkatan 2021</option>
                        <option value="2022">Angkatan 2022</option>
                      </select>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Cari nama / NIM / dosen..."
                          value={bahanRapatSearch}
                          onChange={(e) => setBahanRapatSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-unand-800 w-48 sm:w-60"
                        />
                      </div>
                      {bahanRapatSearch && (
                        <button
                          type="button"
                          onClick={() => setBahanRapatSearch('')}
                          className="text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabel Ringkas Auto-Scroll */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b">
                        <tr>
                          <th className="p-3 w-10 text-center">No</th>
                          <th className="p-3">Mahasiswa</th>
                          <th className="p-3">Tim Pembimbing</th>
                          <th className="p-3">Tahap & Judul</th>
                          <th className="p-3">Kendala / Alasan Evaluasi</th>
                          <th className="p-3">Tindak Lanjut</th>
                          <th className="p-3 text-center">Aksi Cepat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredPriorityStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                              Tidak ada mahasiswa yang cocok dengan kriteria pencarian bahan rapat.
                            </td>
                          </tr>
                        ) : (
                          filteredPriorityStudents.map((std, idx) => (
                            <tr key={std.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 text-center font-mono font-bold text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="p-3">
                                <Link
                                  href={`/mahasiswa/${std.id}`}
                                  className="font-bold text-slate-900 hover:text-unand-800 hover:underline block truncate max-w-[170px]"
                                  title={std.nama}
                                >
                                  {std.nama}
                                </Link>
                                <span className="text-[11px] text-slate-500 font-mono block">
                                  {std.nim} &bull; Angk {std.angkatan} (Smtr {std.calculatedSemester || std.semesterManual || '-'})
                                </span>
                              </td>
                              <td className="p-3 text-[11px]">
                                <span className="block truncate max-w-[150px]" title={std.pembimbingUtama?.namaGelar}>
                                  <strong>U:</strong> {std.pembimbingUtama?.namaGelar || '-'}
                                </span>
                                <span className="block text-slate-500 truncate max-w-[150px]" title={std.pembimbingPendamping?.namaGelar}>
                                  <strong>P:</strong> {std.pembimbingPendamping?.namaGelar || '-'}
                                </span>
                              </td>
                              <td className="p-3 text-[11px]">
                                <span className="font-semibold text-slate-800 uppercase block">
                                  {(std.tahapUtama || '').replace(/_/g, ' ')}
                                </span>
                                <span className="text-slate-500 line-clamp-1 text-[10px]" title={std.judulSkripsi}>
                                  {std.judulSkripsi || '(Belum ada judul)'}
                                </span>
                              </td>
                              <td className="p-3 max-w-[200px]">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <StatusBadge
                                    status={std.statusPerhatian}
                                    label={std.statusPerhatian === 'prioritas' ? 'Prioritas' : 'Perhatian'}
                                    size="xs"
                                  />
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2" title={std.alasanPerhatian}>
                                  {std.alasanPerhatian || 'Memerlukan evaluasi percepatan studi.'}
                                </p>
                              </td>
                              <td className="p-3 text-[11px] max-w-[160px]">
                                {std.followUps && std.followUps.length > 0 ? (
                                  <span className="text-emerald-700 font-medium block">
                                    {std.followUps.length} agenda aktif ({std.followUps[0].status})
                                  </span>
                                ) : (
                                  <span className="text-amber-700 italic block">
                                    Belum ada agenda
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentId(std.id);
                                    setMasalah(std.alasanPerhatian || '');
                                    setShowAddModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-unand-50 hover:bg-unand-100 text-unand-800 font-semibold rounded-lg text-[11px] border border-unand-200 transition"
                                  title="Tambah agenda tindak lanjut untuk mahasiswa ini"
                                >
                                  + Tindak Lanjut
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* DAFTAR KARTU DETAIL MAHASISWA PRIORITAS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-unand-800" />
                    <span>Daftar Rinci Mahasiswa Bahan Rapat ({filteredPriorityStudents.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Klik nama mahasiswa untuk melihat riwayat progres lengkap
                  </span>
                </div>

                {filteredPriorityStudents.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 text-xs">
                    Tidak ada mahasiswa yang cocok dengan kriteria filter saat ini.
                  </div>
                ) : (
                  filteredPriorityStudents.map((std, idx) => (
                    <div
                      key={std.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              #{idx + 1}
                            </span>
                            <Link
                              href={`/mahasiswa/${std.id}`}
                              className="font-black text-base text-slate-900 hover:text-unand-800 transition hover:underline"
                            >
                              {std.nama}
                            </Link>
                            <span className="text-xs text-slate-500 font-mono font-medium">
                              (NIM {std.nim} &bull; Angkatan {std.angkatan} &bull; Semester {std.calculatedSemester || std.semesterManual || '-'})
                            </span>
                          </div>
                          <span className="text-xs text-slate-600 mt-1 block">
                            Pembimbing Utama: <strong>{std.pembimbingUtama?.namaGelar || '-'}</strong> &bull; Pendamping: {std.pembimbingPendamping?.namaGelar || '-'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge
                            status={std.statusPerhatian}
                            label={std.statusPerhatian === 'prioritas' ? 'Prioritas Pendampingan' : 'Perlu Perhatian'}
                            size="md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(std.id);
                              setMasalah(std.alasanPerhatian || '');
                              setShowAddModal(true);
                            }}
                            className="px-3 py-1 bg-gold-50 hover:bg-gold-100 text-slate-900 border border-gold-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 text-gold-600" />
                            <span>Tindak Lanjut</span>
                          </button>
                        </div>
                      </div>

                      {/* Judul Skripsi & Tahap */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                        <div className="sm:col-span-4">
                          <span className="text-[11px] text-slate-400 block">Tahapan Tugas Akhir:</span>
                          <strong className="text-slate-800 uppercase font-bold text-xs mt-0.5 block">
                            {(std.tahapUtama || 'penetapan_judul').replace(/_/g, ' ')}
                          </strong>
                        </div>
                        <div className="sm:col-span-8">
                          <span className="text-[11px] text-slate-400 block">Judul Penelitian:</span>
                          <p className="text-slate-700 italic mt-0.5">
                            {std.judulSkripsi || '(Judul skripsi belum didaftarkan)'}
                          </p>
                        </div>
                      </div>

                      {/* Problem & Reason */}
                      <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-2xl text-xs text-red-950 space-y-1">
                        <strong className="block text-red-900 font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                          Alasan Kebutuhan Evaluasi & Rekomendasi Rapat:
                        </strong>
                        <p className="leading-relaxed">
                          {std.alasanPerhatian || std.reports?.[0]?.hambatanUtama || 'Memerlukan koordinasi percepatan masa studi dan tindak lanjut terarah.'}
                        </p>
                      </div>

                      {/* Open Follow-up Actions */}
                      {std.followUps && std.followUps.length > 0 && (
                        <div className="space-y-2 pt-1 text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-unand-800" />
                            Agenda Tindak Lanjut yang Sedang Berjalan:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {std.followUps.map((f: any) => (
                              <div key={f.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-2 shadow-2xs">
                                <div>
                                  <span className="font-semibold text-slate-800 block leading-snug">
                                    {f.tindakanDisepakati}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block mt-1">
                                    PJ: <strong>{f.penanggungJawab}</strong> &bull; Tenggat: <strong>{f.tenggat || '-'}</strong>
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                                  {f.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Follow Up Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-unand-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Catat Agenda Tindak Lanjut Program Studi</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Mahasiswa *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs bg-white"
                >
                  <option value="">-- Pilih Mahasiswa --</option>
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nim} - Angk {s.angkatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Masalah yang Perlu Diselesaikan *</label>
                <textarea
                  required
                  rows={2}
                  value={masalah}
                  onChange={(e) => setMasalah(e.target.value)}
                  placeholder="Contoh: Kesulitan akses instrumen spektrofotometri, atau naskah Bab IV belum diserahkan..."
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tindakan yang Disepakati *</label>
                <textarea
                  required
                  rows={2}
                  value={tindakanDisepakati}
                  onChange={(e) => setTindakanDisepakati(e.target.value)}
                  placeholder="Contoh: Pertemuan mahasiswa dengan pembimbing / Fasilitasi akses laboratorium / Klinik skripsi..."
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab *</label>
                  <input
                    type="text"
                    required
                    value={penanggungJawab}
                    onChange={(e) => setPenanggungJawab(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenggat Target *</label>
                  <input
                    type="date"
                    required
                    value={tenggat}
                    onChange={(e) => setTenggat(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Evaluasi Berikutnya (Opsional)</label>
                <input
                  type="date"
                  value={tglEvaluasiBerikutnya}
                  onChange={(e) => setTglEvaluasiBerikutnya(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Follow Up Modal */}
      {resolvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Tandai Tindak Lanjut Selesai</h3>
              <button onClick={() => setResolvingItem(null)} className="text-white/70 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <span className="font-bold text-slate-800 block">Mahasiswa: {resolvingItem.student?.nama}</span>
                <p className="text-slate-600">Tindakan: {resolvingItem.tindakanDisepakati}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hasil Akhir Tindak Lanjut *</label>
                <textarea
                  required
                  rows={3}
                  value={hasilTindakLanjut}
                  onChange={(e) => setHasilTindakLanjut(e.target.value)}
                  placeholder="Contoh: Mahasiswa telah bertemu pembimbing utama dan menyerahkan draf Bab IV perbaikan..."
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setResolvingItem(null)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resolvingLoading}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  {resolvingLoading ? 'Menyimpan...' : 'Tandai Selesai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TindakLanjutPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Memuat agenda tindak lanjut...</div>}>
      <TindakLanjutContent />
    </React.Suspense>
  );
}

