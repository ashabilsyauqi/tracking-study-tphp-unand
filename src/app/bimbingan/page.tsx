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
import {
  UserCheck,
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
} from 'lucide-react';

export default function BimbinganPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'utama' | 'pendamping'>('all');

  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);
  const [selectedStudentForNoChange, setSelectedStudentForNoChange] = useState<any>(null);
  const [demoCount, setDemoCount] = useState(0);

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

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nim.includes(search) ||
      (s.judulSkripsi && s.judulSkripsi.toLowerCase().includes(search.toLowerCase()));

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

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-unand-950 via-unand-900 to-unand-800 text-white rounded-2xl p-6 shadow-md border border-unand-800">
            <div className="flex items-center gap-2">
              <span className="bg-gold-500 text-slate-950 text-xs font-bold px-2.5 py-0.5 rounded tracking-wide uppercase">
                Menu Khusus Dosen Pembimbing
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Mahasiswa Bimbingan Saya
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
              Daftar seluruh mahasiswa tugas akhir di bawah bimbingan Anda (sebagai Pembimbing Utama maupun Pendamping). Gunakan fitur <strong>Pelaporan Cepat (1 Menit)</strong> untuk memperbarui kemajuan berkala.
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mahasiswa bimbingan berdasarkan nama, NIM, atau topik..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Peran Bimbingan:</span>
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
          </div>

          {/* Student Cards Grid */}
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
                  : 'Belum ada mahasiswa yang ditugaskan kepada Anda atau sesuai dengan filter pencarian.'}
              </p>
            </div>
          ) : (
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
                        NIM {std.nim} &bull; Angkatan {std.angkatan} (Smtr {std.calculatedSemester || std.semesterManual})
                      </span>

                      {/* Title */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                          Judul Skripsi:
                        </span>
                        <p className="font-medium text-slate-800 italic line-clamp-2 mt-0.5">
                          {std.judulSkripsi ? `"${std.judulSkripsi}"` : '(Belum memiliki judul)'}
                        </p>
                      </div>

                      {/* Tahap Utama & Other Advisor */}
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tahap Utama:</span>
                          <span className="font-semibold text-slate-800 capitalize">
                            {std.tahapUtama?.replace(/_/g, ' ')}
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
                      </div>

                      {/* Last Obstacle snippet if present */}
                      {latestRep?.hambatanUtama && latestRep.hambatanUtama !== 'Tidak ada hambatan signifikan.' && (
                        <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                          <span className="font-bold block">Hambatan Lalu:</span>
                          <span className="line-clamp-2">{latestRep.hambatanUtama}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Quick Action Buttons (Section 6) */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <Link
                        href={`/mahasiswa/${std.id}`}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition flex items-center gap-1"
                        title="Buka Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedStudentForNoChange(std)}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition shadow-2xs flex items-center gap-1"
                          title="Perbarui tanggal pelaporan tanpa mengubah tanggal kemajuan substantif"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Belum Ada Perubahan</span>
                        </button>

                        <button
                          onClick={() => setSelectedStudentForReport(std)}
                          className="px-3 py-1.5 bg-unand-800 hover:bg-unand-900 text-white rounded-xl font-semibold transition shadow-xs flex items-center gap-1"
                          title="Lapor Cepat (1 Menit)"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Lapor Cepat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
    </div>
  );
}
