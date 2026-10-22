'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import StatusBadge from '@/components/StatusBadge';
import QuickReportModal from '@/components/QuickReportModal';
import NoChangeModal from '@/components/NoChangeModal';
import ImportModal from '@/components/ImportModal';
import { exportStudentsToExcel, exportStudentsToPDF } from '@/lib/exportHelper';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  Eye,
  Send,
  RefreshCw,
  Clock,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
  FileText,
  HelpCircle,
  X,
} from 'lucide-react';

export function MahasiswaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [demoCount, setDemoCount] = useState(0);

  // Active Filters & Search
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedDosen, setSelectedDosen] = useState(searchParams.get('dosenId') || '');
  const [selectedAngkatan, setSelectedAngkatan] = useState(searchParams.get('angkatan') || '');
  const [selectedSemester, setSelectedSemester] = useState(searchParams.get('semester') || '');
  const [selectedTahap, setSelectedTahap] = useState(searchParams.get('tahap') || '');
  const [selectedStatusAkademik, setSelectedStatusAkademik] = useState(searchParams.get('statusAkademik') || '');
  const [selectedStatusPerhatian, setSelectedStatusPerhatian] = useState(searchParams.get('statusPerhatian') || '');
  const [filterButuhBantuan, setFilterButuhBantuan] = useState(searchParams.get('butuhBantuan') || '');
  const [filterTargetTerlewati, setFilterTargetTerlewati] = useState(searchParams.get('targetTerlewati') || '');
  const [filterUmurLaporan, setFilterUmurLaporan] = useState(searchParams.get('umurLaporan') || '');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('nim');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);
  const [selectedStudentForNoChange, setSelectedStudentForNoChange] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add new student form states
  const [newNim, setNewNim] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newAngkatan, setNewAngkatan] = useState(2021);
  const [newUtamaId, setNewUtamaId] = useState('');
  const [newPendampingId, setNewPendampingId] = useState('');
  const [newJudul, setNewJudul] = useState('');
  const [newTargetSelesai, setNewTargetSelesai] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

      // Build query string
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (selectedDosen) q.set('dosenId', selectedDosen);
      if (selectedAngkatan) q.set('angkatan', selectedAngkatan);
      if (selectedTahap) q.set('tahap', selectedTahap);
      if (selectedStatusAkademik) q.set('statusAkademik', selectedStatusAkademik);
      if (selectedStatusPerhatian) q.set('statusPerhatian', selectedStatusPerhatian);
      if (filterButuhBantuan) q.set('butuhBantuan', filterButuhBantuan);
      if (filterTargetTerlewati) q.set('targetTerlewati', filterTargetTerlewati);
      if (filterUmurLaporan) q.set('umurLaporan', filterUmurLaporan);
      q.set('limit', '300');

      const stdRes = await fetch(`/api/students?${q.toString()}`);
      const stdData = await stdRes.json();
      setStudents(stdData.data || []);

      const lecRes = await fetch('/api/dosen');
      const lecData = await lecRes.json();
      setLecturers(lecData.data || []);

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
  }, [
    search,
    selectedDosen,
    selectedAngkatan,
    selectedSemester,
    selectedTahap,
    selectedStatusAkademik,
    selectedStatusPerhatian,
    filterButuhBantuan,
    filterTargetTerlewati,
    filterUmurLaporan,
  ]);

  // Client-side sorting & semester filter
  const processedStudents = useMemo(() => {
    let list = [...students];

    if (selectedSemester) {
      list = list.filter((s) => s.calculatedSemester === parseInt(selectedSemester, 10));
    }

    list.sort((a, b) => {
      let aVal = a[sortBy] ?? '';
      let bVal = b[sortBy] ?? '';

      if (sortBy === 'statusPerhatian') {
        aVal = a.computedAttention?.status || '';
        bVal = b.computedAttention?.status || '';
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [students, sortBy, sortOrder, selectedSemester]);

  // Pagination slice
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedStudents.slice(start, start + pageSize);
  }, [processedStudents, page, pageSize]);

  const totalPages = Math.ceil(processedStudents.length / pageSize) || 1;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExportExcel = () => {
    exportStudentsToExcel(
      processedStudents,
      {
        title: 'Daftar Pemantauan Kemajuan Tugas Akhir Mahasiswa',
        filterSummary: `Dosen: ${selectedDosen || 'Semua'}, Angkatan: ${selectedAngkatan || 'Semua'}, Tahap: ${selectedTahap || 'Semua'}`,
        generatedBy: currentUser?.name || 'Sistem',
      },
      `Pemantauan_Mhs_TPHP_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handleExportPDF = () => {
    exportStudentsToPDF(
      processedStudents,
      {
        title: 'Daftar Pemantauan Kemajuan Tugas Akhir Mahasiswa',
        filterSummary: `Dosen: ${selectedDosen || 'Semua'}, Angkatan: ${selectedAngkatan || 'Semua'}, Tahap: ${selectedTahap || 'Semua'}`,
        generatedBy: currentUser?.name || 'Sistem',
      },
      `Pemantauan_Mhs_TPHP_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nim: newNim.trim(),
          nama: newNama.trim(),
          angkatan: newAngkatan,
          pembimbingUtamaId: newUtamaId || null,
          pembimbingPendampingId: newPendampingId || null,
          judulSkripsi: newJudul || null,
          targetSelesai: newTargetSelesai || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan mahasiswa.');

      setShowAddModal(false);
      setNewNim('');
      setNewNama('');
      setNewJudul('');
      fetchData();
      alert(`Mahasiswa ${data.data.nama} (${data.data.nim}) berhasil ditambahkan.`);
    } catch (err: any) {
      setAddError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setAddLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedDosen('');
    setSelectedAngkatan('');
    setSelectedSemester('');
    setSelectedTahap('');
    setSelectedStatusAkademik('');
    setSelectedStatusPerhatian('');
    setFilterButuhBantuan('');
    setFilterTargetTerlewati('');
    setFilterUmurLaporan('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchData} />}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-5">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Tabel Pemantauan Utama Mahasiswa
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan menyeluruh seluruh mahasiswa tingkat akhir TPHP, riwayat pelaporan dosen, hambatan, dan status perhatian.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition"
                title="Ekspor tabel sesuai filter aktif ke Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Ekspor Excel
              </button>

              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition"
                title="Ekspor tabel sesuai filter aktif ke PDF"
              >
                <FileText className="w-3.5 h-3.5 text-red-600" />
                Ekspor PDF
              </button>

              {currentUser?.role === 'ADMIN' && (
                <>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition"
                    title="Impor dari berkas Excel atau CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                    Impor Excel/CSV
                  </button>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Mahasiswa
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Top row: search + reset */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari berdasarkan NIM, Nama Mahasiswa, atau Judul Skripsi..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  Ditemukan: <strong>{processedStudents.length} Mahasiswa</strong>
                </span>
                {(search ||
                  selectedDosen ||
                  selectedAngkatan ||
                  selectedSemester ||
                  selectedTahap ||
                  selectedStatusAkademik ||
                  selectedStatusPerhatian ||
                  filterButuhBantuan ||
                  filterTargetTerlewati ||
                  filterUmurLaporan) && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" /> Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
              {/* Dosen Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Dosen</label>
                <select
                  value={selectedDosen}
                  onChange={(e) => {
                    setSelectedDosen(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs border rounded-lg p-1.5 bg-slate-50 focus:bg-white truncate"
                >
                  <option value="">Semua Dosen (20)</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.namaGelar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Angkatan Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Angkatan</label>
                <select
                  value={selectedAngkatan}
                  onChange={(e) => {
                    setSelectedAngkatan(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs border rounded-lg p-1.5 bg-slate-50 focus:bg-white"
                >
                  <option value="">Semua Angkatan</option>
                  <option value="2019">2019 (Smtr 12)</option>
                  <option value="2020">2020 (Smtr 10)</option>
                  <option value="2021">2021 (Smtr 8)</option>
                  <option value="2022">2022 (Smtr 6)</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs border rounded-lg p-1.5 bg-slate-50 focus:bg-white"
                >
                  <option value="">Semua Semester</option>
                  <option value="6">Semester 6</option>
                  <option value="8">Semester 8 (Reguler)</option>
                  <option value="10">Semester 10 (Perhatian)</option>
                  <option value="12">Semester 12 (Kritis)</option>
                  <option value="14">Semester 14 (Batas Akhir)</option>
                </select>
              </div>

              {/* Tahap Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Tahap Utama</label>
                <select
                  value={selectedTahap}
                  onChange={(e) => {
                    setSelectedTahap(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs border rounded-lg p-1.5 bg-slate-50 focus:bg-white"
                >
                  <option value="">Semua Tahap</option>
                  <option value="penetapan_judul">Penetapan Judul</option>
                  <option value="seminar_proposal">Seminar Proposal</option>
                  <option value="penelitian">Penelitian</option>
                  <option value="penulisan_skripsi">Penulisan Skripsi</option>
                  <option value="seminar_hasil">Seminar Hasil</option>
                  <option value="ujian_sarjana">Ujian Sarjana</option>
                </select>
              </div>

              {/* Status Akademik */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Status Mhs</label>
                <select
                  value={selectedStatusAkademik}
                  onChange={(e) => {
                    setSelectedStatusAkademik(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs border rounded-lg p-1.5 bg-slate-50 focus:bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="cuti">Cuti</option>
                  <option value="lulus">Lulus</option>
                </select>
              </div>

              {/* Status Perhatian */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Status Penanda</label>
                <select
                  value={selectedStatusPerhatian}
                  onChange={(e) => {
                    setSelectedStatusPerhatian(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs border rounded-lg p-1.5 bg-slate-50 focus:bg-white"
                >
                  <option value="">Semua Penanda</option>
                  <option value="sesuai_rencana">Sesuai Rencana</option>
                  <option value="perlu_pembaruan">Perlu Pembaruan</option>
                  <option value="perlu_perhatian">Perlu Perhatian</option>
                  <option value="prioritas">Prioritas Pendampingan</option>
                  <option value="belum_cukup_data">Belum Cukup Data</option>
                </select>
              </div>

              {/* Butuh Bantuan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Bantuan Prodi</label>
                <select
                  value={filterButuhBantuan}
                  onChange={(e) => {
                    setFilterButuhBantuan(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs border rounded-lg p-1.5 bg-slate-50 focus:bg-white"
                >
                  <option value="">Semua</option>
                  <option value="true">Butuh Bantuan Prodi</option>
                </select>
              </div>

              {/* Umur Laporan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Umur Laporan</label>
                <select
                  value={filterUmurLaporan}
                  onChange={(e) => {
                    setFilterUmurLaporan(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs border rounded-lg p-1.5 bg-slate-50 focus:bg-white"
                >
                  <option value="">Semua Umur</option>
                  <option value="30">&gt; 30 Hari</option>
                  <option value="60">&gt; 60 Hari</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Table (Section 8: Tabel pemantauan utama) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('nim')}>
                      <div className="flex items-center gap-1">
                        <span>NIM & Nama Mahasiswa</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('angkatan')}>
                      <div className="flex items-center gap-1">
                        <span>Angkatan & Semester</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Pembimbing (Utama / Pendamping)</th>
                    <th className="py-3 px-3">Judul Skripsi</th>
                    <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('tahapUtama')}>
                      <div className="flex items-center gap-1">
                        <span>Tahap Utama</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Aktivitas Berjalan</th>
                    <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('tglLaporanTerakhir')}>
                      <div className="flex items-center gap-1">
                        <span>Tgl Laporan Terakhir</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Tgl Kemajuan Substantif</th>
                    <th className="py-3 px-3">Hambatan Utama</th>
                    <th className="py-3 px-3">Target Berikutnya</th>
                    <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('statusPerhatian')}>
                      <div className="flex items-center gap-1">
                        <span>Status Penanda Perhatian</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center sticky right-0 bg-slate-100 shadow-xs">
                      Aksi & Pembaruan
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-sm">Tidak ada mahasiswa yang cocok dengan filter aktif.</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Coba atur ulang filter pencarian atau gunakan tombol reset filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((std) => {
                      const latestRep = std.reports && std.reports.length > 0 ? std.reports[0] : null;
                      const activeStgs = (std.stages || [])
                        .filter((s: any) => s.status === 'sedang_berjalan' || s.status === 'menunggu_jadwal')
                        .map((s: any) => s.stageName);

                      return (
                        <tr
                          key={std.id}
                          className="hover:bg-slate-50/80 transition group"
                        >
                          {/* 1. NIM & Nama */}
                          <td className="py-3 px-3 font-medium">
                            <Link
                              href={`/mahasiswa/${std.id}`}
                              className="font-bold text-slate-900 hover:text-unand-800 transition block hover:underline"
                            >
                              {std.nama}
                            </Link>
                            <span className="font-mono text-[11px] text-slate-500 block">
                              {std.nim}
                            </span>
                            {std.isDemo && (
                              <span className="inline-block bg-amber-100 text-amber-800 text-[9px] px-1 rounded font-mono mt-0.5">
                                Demo
                              </span>
                            )}
                          </td>

                          {/* 2. Angkatan & Semester */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 block">
                              Angkatan {std.angkatan}
                            </span>
                            <span
                              className={`text-[11px] font-mono ${
                                (std.calculatedSemester || std.semesterManual) >= 10
                                  ? 'text-red-600 font-bold'
                                  : 'text-slate-500'
                              }`}
                              title={std.semesterBasis || ''}
                            >
                              Semester {std.calculatedSemester || std.semesterManual || '-'}
                            </span>
                          </td>

                          {/* 3. Pembimbing */}
                          <td className="py-3 px-3 min-w-[160px]">
                            <div className="text-[11px]">
                              <span className="text-slate-400 text-[10px] block">Utama:</span>
                              <span className="font-semibold text-slate-800 line-clamp-1">
                                {std.pembimbingUtama?.namaGelar || '-'}
                              </span>
                            </div>
                            <div className="text-[11px] mt-1">
                              <span className="text-slate-400 text-[10px] block">Pendamping:</span>
                              <span className="text-slate-700 line-clamp-1">
                                {std.pembimbingPendamping?.namaGelar || '-'}
                              </span>
                            </div>
                          </td>

                          {/* 4. Judul Singkat */}
                          <td className="py-3 px-3 max-w-[200px]">
                            <p
                              className="line-clamp-2 text-slate-700 text-[11px] leading-tight"
                              title={std.judulSkripsi || 'Belum ada judul'}
                            >
                              {std.judulSkripsi ? (
                                `"${std.judulSkripsi}"`
                              ) : (
                                <span className="text-amber-600 italic">Belum ada judul skripsi</span>
                              )}
                            </p>
                          </td>

                          {/* 5. Tahap Utama */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-800 capitalize border">
                              {(std.tahapUtama || '').replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* 6. Aktivitas Berjalan */}
                          <td className="py-3 px-3 min-w-[140px]">
                            {activeStgs.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {activeStgs.map((st: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded"
                                  >
                                    {st}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Belum ada</span>
                            )}
                          </td>

                          {/* 7. Tgl Laporan Terakhir */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                            {std.tglLaporanTerakhir ? (
                              <span className="text-slate-800">{std.tglLaporanTerakhir}</span>
                            ) : (
                              <span className="text-slate-400 italic">Belum lapor</span>
                            )}
                          </td>

                          {/* 8. Tgl Kemajuan Substantif */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                            {std.tglKemajuanSubstantif ? (
                              <span className="text-slate-800">{std.tglKemajuanSubstantif}</span>
                            ) : (
                              <span className="text-slate-400 italic">Belum ada</span>
                            )}
                          </td>

                          {/* 9. Hambatan Utama */}
                          <td className="py-3 px-3 max-w-[180px]">
                            <p
                              className="line-clamp-2 text-slate-600 text-[11px]"
                              title={latestRep?.hambatanUtama || 'Tidak ada hambatan'}
                            >
                              {latestRep?.hambatanUtama || '-'}
                            </p>
                          </td>

                          {/* 10. Target Berikutnya */}
                          <td className="py-3 px-3 max-w-[160px]">
                            <p
                              className="line-clamp-2 text-slate-600 text-[11px]"
                              title={latestRep?.tindakanBerikutnya || std.targetSelesai || '-'}
                            >
                              {latestRep?.tindakanBerikutnya || std.targetSelesai || '-'}
                            </p>
                          </td>

                          {/* 11. Status Penanda Perhatian */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <StatusBadge
                              status={std.computedAttention?.status || std.statusPerhatian}
                              label={std.computedAttention?.label}
                              reasons={std.computedAttention?.reasons}
                              size="sm"
                            />
                          </td>

                          {/* 12. Tombol Aksi */}
                          <td className="py-3 px-3 whitespace-nowrap text-center sticky right-0 bg-white group-hover:bg-slate-50 transition border-l border-slate-100">
                            <div className="flex items-center justify-center gap-1">
                              {/* Detail Dossier */}
                              <Link
                                href={`/mahasiswa/${std.id}`}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                title="Buka Profil & Dossier Lengkap Mahasiswa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>

                              {/* Lapor Cepat 1 Menit */}
                              <button
                                onClick={() => setSelectedStudentForReport(std)}
                                className="p-1.5 bg-unand-800 hover:bg-unand-900 text-white rounded-lg transition"
                                title="Pelaporan Cepat (1 Menit)"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Belum Ada Perubahan */}
                              <button
                                onClick={() => setSelectedStudentForNoChange(std)}
                                className="p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                                title="Konfirmasi Belum Ada Perubahan"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border rounded p-1 text-xs bg-white"
                >
                  <option value={15}>15 baris</option>
                  <option value={25}>25 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                </select>
                <span>
                  Menampilkan {(page - 1) * pageSize + 1} -{' '}
                  {Math.min(page * pageSize, processedStudents.length)} dari{' '}
                  {processedStudents.length} Mahasiswa
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 border rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
                </button>
                <span className="px-2 font-semibold">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 border rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  Berikutnya <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Quick Report Modal */}
      {selectedStudentForReport && (
        <QuickReportModal
          isOpen={!!selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
          student={selectedStudentForReport}
          onSuccess={() => {
            fetchData();
            alert('Laporan kemajuan mahasiswa berhasil disimpan!');
          }}
          onReloadStudent={fetchData}
        />
      )}

      {/* No Change Modal */}
      {selectedStudentForNoChange && (
        <NoChangeModal
          isOpen={!!selectedStudentForNoChange}
          onClose={() => setSelectedStudentForNoChange(null)}
          student={selectedStudentForNoChange}
          onSuccess={() => {
            fetchData();
            alert('Status Belum Ada Perubahan berhasil dicatat.');
          }}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchData}
      />

      {/* Add Student Modal (Admin only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-unand-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Tambah Data Mahasiswa Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-4 text-xs">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIM (Wajib & Unik) *</label>
                  <input
                    type="text"
                    required
                    value={newNim}
                    onChange={(e) => setNewNim(e.target.value)}
                    placeholder="Contoh: 2111122045"
                    className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Angkatan *</label>
                  <input
                    type="number"
                    required
                    value={newAngkatan}
                    onChange={(e) => setNewAngkatan(Number(e.target.value))}
                    className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Mahasiswa *</label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Nama lengkap sesuai data akademik"
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pembimbing Utama</label>
                  <select
                    value={newUtamaId}
                    onChange={(e) => setNewUtamaId(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="">-- Pilih Pembimbing Utama --</option>
                    {lecturers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.namaGelar}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pembimbing Pendamping (Opsional)</label>
                  <select
                    value={newPendampingId}
                    onChange={(e) => setNewPendampingId(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="">-- Pilih Pembimbing Pendamping --</option>
                    {lecturers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.namaGelar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Skripsi (Sementara / Definitif)</label>
                <input
                  type="text"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  placeholder="Judul skripsi (kosongkan jika belum memiliki topik/judul)"
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Penyelesaian Studi</label>
                <input
                  type="date"
                  value={newTargetSelesai}
                  onChange={(e) => setNewTargetSelesai(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
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
                  disabled={addLoading}
                  className="px-5 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  {addLoading ? 'Menyimpan...' : 'Simpan Mahasiswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MahasiswaPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Memuat data pemantauan mahasiswa...</div>}>
      <MahasiswaContent />
    </React.Suspense>
  );
}

