'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import StatusBadge from '@/components/StatusBadge';
import QuickReportModal from '@/components/QuickReportModal';
import NoChangeModal from '@/components/NoChangeModal';
import EditBimbinganModal from '@/components/EditBimbinganModal';
import AddStudentModal from '@/components/AddStudentModal';
import {
  UserCheck,
  UserPlus,
  Send,
  Clock,
  Eye,
  Search,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Filter,
  Edit3,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  Mail,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function BimbinganPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'utama' | 'pendamping'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);
  const [selectedStudentForNoChange, setSelectedStudentForNoChange] = useState<any>(null);
  const [selectedStudentForEditColumn, setSelectedStudentForEditColumn] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

      // Fetch students with bimbinganOnly flag (enforces server-side lecturer filter)
      const res = await fetch(`/api/students?bimbinganOnly=true&dosenId=${userData.user.lecturerId || ''}&limit=100`);
      const data = await res.json();
      setStudents(data.data || []);

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

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nim.includes(search) ||
      (s.judulSkripsi && s.judulSkripsi.toLowerCase().includes(search.toLowerCase())) ||
      (s.bidangPenelitian && s.bidangPenelitian.toLowerCase().includes(search.toLowerCase()));

    const isUtama = s.pembimbingUtamaId === currentUser?.lecturerId;
    const isPendamping = s.pembimbingPendampingId === currentUser?.lecturerId;

    if (filterRole === 'utama' && !isUtama) return false;
    if (filterRole === 'pendamping' && !isPendamping) return false;

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchData} />}

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-unand-950 via-unand-900 to-unand-800 text-white rounded-2xl p-6 shadow-md border border-unand-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-gold-500 text-slate-950 text-xs font-bold px-2.5 py-0.5 rounded tracking-wide uppercase">
                  Menu Khusus Dosen Pembimbing
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Mahasiswa Bimbingan Saya
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
                Daftar seluruh mahasiswa tugas akhir di bawah bimbingan Anda. Anda dapat <strong>menambahkan mahasiswa bimbingan secara manual</strong>, <strong>mengisi & memperbarui kolom bimbingan</strong> (judul, bidang riset, tahap skripsi, target selesai, kontak), serta melakukan <strong>Pelaporan Cepat (1 Menit)</strong> secara berkala.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition shrink-0"
              title="Tambahkan Mahasiswa Bimbingan Baru Secara Manual"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>+ Tambah Mahasiswa Bimbingan</span>
            </button>
          </div>

          {/* Search, Filter & View Mode Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mahasiswa bimbingan berdasarkan nama, NIM, judul, atau bidang riset..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Peran:</span>
                <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    onClick={() => setFilterRole('all')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      filterRole === 'all' ? 'bg-unand-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({students.length})
                  </button>
                  <button
                    onClick={() => setFilterRole('utama')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      filterRole === 'utama' ? 'bg-unand-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Utama
                  </button>
                  <button
                    onClick={() => setFilterRole('pendamping')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      filterRole === 'pendamping' ? 'bg-unand-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pendamping
                  </button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span className="text-slate-400 font-medium hidden sm:inline">Tampilan:</span>
                <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      viewMode === 'grid' ? 'bg-unand-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilan Kartu"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Kartu</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      viewMode === 'table' ? 'bg-unand-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tabel Kolom Bimbingan"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Tabel Kolom Bimbingan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Student Cards or Table View */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Memuat data mahasiswa bimbingan...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white border rounded-2xl p-12 text-center text-slate-400">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-800 text-base">Tidak ada mahasiswa bimbingan ditemukan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {currentUser?.role === 'ADMIN'
                  ? 'Anda masuk sebagai Admin. Pilih akun Dosen pada tombol "Uji Peran" di atas untuk melihat tampilan spesifik per dosen.'
                  : 'Belum ada mahasiswa bimbingan yang tercatat untuk Anda.'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-unand-800 hover:bg-unand-900 text-white font-semibold rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-gold-400" />
                <span>+ Tambah Mahasiswa Bimbingan Sekarang</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* 1. Tampilan Kartu (Grid View) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((std) => {
                const isUtama = std.pembimbingUtamaId === currentUser?.lecturerId;
                const otherAdvisor = isUtama ? std.pembimbingPendamping : std.pembimbingUtama;
                const otherAdvisorRole = isUtama ? 'Pembimbing Pendamping' : 'Pembimbing Utama';
                const latestRep = std.reports && std.reports.length > 0 ? std.reports[0] : null;

                return (
                  <div
                    key={std.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-unand-700 transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isUtama ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isUtama ? 'Pembimbing Utama' : 'Pembimbing Pendamping'}
                        </span>
                        <StatusBadge
                          status={std.computedAttention?.status || std.statusPerhatian}
                          label={std.computedAttention?.label}
                          reasons={std.computedAttention?.reasons}
                          size="sm"
                        />
                      </div>

                      {/* Student Info */}
                      <Link
                        href={`/mahasiswa/${std.id}`}
                        className="font-bold text-base text-slate-900 hover:text-unand-800 transition block hover:underline"
                      >
                        {std.nama}
                      </Link>
                      <span className="font-mono text-xs text-slate-500">
                        NIM {std.nim} &bull; Angkatan {std.angkatan} (Smtr {std.calculatedSemester || std.semesterManual || '-'})
                      </span>

                      {/* Title & Field */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                            Judul Skripsi:
                          </span>
                          {std.bidangPenelitian && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md truncate max-w-[150px]">
                              {std.bidangPenelitian}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-slate-800 italic line-clamp-2">
                          {std.judulSkripsi ? `"${std.judulSkripsi}"` : (
                            <span className="text-slate-400 not-italic">(Belum diisi &bull; Klik "Isi Kolom" di bawah)</span>
                          )}
                        </p>
                      </div>

                      {/* Tahap Utama & Other Advisor */}
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Tahap Utama:</span>
                          <span className="font-semibold text-unand-900 capitalize bg-unand-50 px-2 py-0.5 rounded border border-unand-200 text-[11px]">
                            {(std.tahapUtama || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Sidang/Selesai:</span>
                          <span className="font-medium text-slate-800">
                            {std.targetSelesai ? std.targetSelesai : <span className="text-slate-400">-</span>}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Rekan {otherAdvisorRole}:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[170px]" title={otherAdvisor?.namaGelar || '-'}>
                            {otherAdvisor?.namaGelar || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Laporan Terakhir:</span>
                          <span className="font-mono text-slate-800">{std.tglLaporanTerakhir || '-'}</span>
                        </div>

                        {/* Contact quick view if available */}
                        {(std.noHp || std.email) && (
                          <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            {std.noHp && (
                              <span className="flex items-center gap-1 font-mono text-slate-700">
                                <Phone className="w-3 h-3 text-emerald-600" /> {std.noHp}
                              </span>
                            )}
                            {std.email && (
                              <span className="flex items-center gap-1 truncate text-slate-600">
                                <Mail className="w-3 h-3 text-blue-500 shrink-0" /> {std.email}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Last Obstacle snippet if present */}
                      {latestRep?.hambatanUtama && latestRep.hambatanUtama !== 'Tidak ada hambatan signifikan.' && (
                        <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                          <span className="font-bold block">Hambatan Lalu:</span>
                          <span className="line-clamp-2">{latestRep.hambatanUtama}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons: Isi Kolom, Lapor Cepat, Detail */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-xs">
                      {/* Primary Guidance Edit Button */}
                      <button
                        onClick={() => setSelectedStudentForEditColumn(std)}
                        className="w-full px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                        title="Isi Judul Skripsi, Bidang Riset, Tahapan, Target, dan Kontak Mahasiswa"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Isi Kolom Bimbingan</span>
                      </button>

                      <div className="flex items-center justify-between gap-1.5">
                        <Link
                          href={`/mahasiswa/${std.id}`}
                          className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition flex items-center gap-1"
                          title="Buka Dossier Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </Link>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedStudentForNoChange(std)}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition shadow-2xs flex items-center gap-1 text-[11px]"
                            title="Perbarui tanggal pelaporan tanpa mengubah tanggal kemajuan substantif"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Belum Berubah</span>
                          </button>

                          <button
                            onClick={() => setSelectedStudentForReport(std)}
                            className="px-3 py-1.5 bg-unand-800 hover:bg-unand-900 text-white rounded-xl font-semibold transition shadow-xs flex items-center gap-1"
                            title="Lapor Cepat (1 Menit)"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Lapor</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 2. Tampilan Tabel Kolom Bimbingan (Table View) */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Tabel Isian Kolom Bimbingan Tugas Akhir
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tinjau dan isi seluruh kolom bimbingan mahasiswa tugas akhir Anda dalam satu tabel ringkas.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-unand-100 text-unand-900 rounded-lg">
                  {filteredStudents.length} Mahasiswa
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3 min-w-[180px]">Mahasiswa & NIM</th>
                      <th className="py-3 px-3 min-w-[120px]">Peran Anda</th>
                      <th className="py-3 px-3 min-w-[220px]">Judul Skripsi</th>
                      <th className="py-3 px-3 min-w-[150px]">Bidang Penelitian</th>
                      <th className="py-3 px-3 min-w-[150px]">Tahap Utama</th>
                      <th className="py-3 px-3 min-w-[120px]">Target Sidang</th>
                      <th className="py-3 px-3 min-w-[150px]">Kontak Mahasiswa</th>
                      <th className="py-3 px-3 min-w-[110px]">Status</th>
                      <th className="py-3 px-3 min-w-[180px] text-center">Aksi Bimbingan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredStudents.map((std, idx) => {
                      const isUtama = std.pembimbingUtamaId === currentUser?.lecturerId;

                      return (
                        <tr key={std.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <Link
                              href={`/mahasiswa/${std.id}`}
                              className="font-bold text-slate-900 hover:text-unand-800 hover:underline block"
                            >
                              {std.nama}
                            </Link>
                            <span className="font-mono text-[11px] text-slate-500">
                              NIM {std.nim} &bull; Th {std.angkatan} (Smtr {std.calculatedSemester || std.semesterManual || '-'})
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                isUtama
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {isUtama ? 'Pembimbing Utama' : 'Pendamping'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {std.judulSkripsi ? (
                              <p className="line-clamp-2 italic text-slate-800" title={std.judulSkripsi}>
                                "{std.judulSkripsi}"
                              </p>
                            ) : (
                              <span className="text-amber-600 font-medium italic text-[11px]">
                                (Belum ada judul)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {std.bidangPenelitian ? (
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-medium text-[11px]">
                                {std.bidangPenelitian}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="capitalize font-semibold text-unand-900 bg-unand-50 border border-unand-200 px-2 py-0.5 rounded text-[11px] inline-block">
                              {(std.tahapUtama || '').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-800">
                            {std.targetSelesai || <span className="text-slate-400">-</span>}
                          </td>
                          <td className="py-3 px-3 text-[11px]">
                            {std.noHp || std.email ? (
                              <div className="space-y-0.5">
                                {std.noHp && (
                                  <a
                                    href={`https://wa.me/${std.noHp.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                                  >
                                    <Phone className="w-3 h-3" /> {std.noHp}
                                  </a>
                                )}
                                {std.email && (
                                  <a
                                    href={`mailto:${std.email}`}
                                    className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[140px]"
                                  >
                                    <Mail className="w-3 h-3" /> {std.email}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge
                              status={std.computedAttention?.status || std.statusPerhatian}
                              label={std.computedAttention?.label}
                              reasons={std.computedAttention?.reasons}
                              size="sm"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedStudentForEditColumn(std)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center gap-1 shadow-2xs text-[11px]"
                                title="Isi / Edit Kolom Bimbingan"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Isi Kolom</span>
                              </button>
                              <button
                                onClick={() => setSelectedStudentForReport(std)}
                                className="px-2 py-1 bg-unand-800 hover:bg-unand-900 text-white rounded-lg font-semibold transition flex items-center gap-1 shadow-2xs text-[11px]"
                                title="Lapor Cepat (1 Menit)"
                              >
                                <Send className="w-3 h-3" />
                                <span>Lapor</span>
                              </button>
                              <Link
                                href={`/mahasiswa/${std.id}`}
                                className="p-1 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                                title="Lihat Dossier Mahasiswa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          currentUser={currentUser}
          onSuccess={(newStd) => {
            fetchData();
            showNotification(`Mahasiswa ${newStd?.nama || ''} berhasil ditambahkan ke daftar bimbingan Anda!`);
          }}
        />
      )}

      {/* Edit Bimbingan Column Modal */}
      {selectedStudentForEditColumn && (
        <EditBimbinganModal
          isOpen={!!selectedStudentForEditColumn}
          onClose={() => setSelectedStudentForEditColumn(null)}
          student={selectedStudentForEditColumn}
          currentLecturerId={currentUser?.lecturerId}
          onSuccess={() => {
            fetchData();
            showNotification('Data kolom bimbingan berhasil diperbarui!');
          }}
        />
      )}

      {/* Quick Report Modal */}
      {selectedStudentForReport && (
        <QuickReportModal
          isOpen={!!selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
          student={selectedStudentForReport}
          onSuccess={() => {
            fetchData();
            showNotification('Laporan kemajuan mahasiswa berhasil disimpan!');
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
            showNotification('Status Belum Ada Perubahan berhasil dicatat.');
          }}
        />
      )}
    </div>
  );
}
