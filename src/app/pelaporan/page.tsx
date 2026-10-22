'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import {
  Send,
  Clock,
  History,
  CheckCircle,
  AlertCircle,
  User,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';

export default function PelaporanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

      const res = await fetch('/api/students?limit=150');
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

  // Collect all reports from students
  const allReports = students.flatMap((s) =>
    (s.reports || []).map((r: any) => ({
      ...r,
      studentName: s.nama,
      studentNim: s.nim,
      studentId: s.id,
      angkatan: s.angkatan,
    }))
  ).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const filteredReports = allReports.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(term) ||
      r.studentNim.includes(term) ||
      r.reporterName.toLowerCase().includes(term) ||
      (r.ringkasanKemajuan && r.ringkasanKemajuan.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchData} />}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Riwayat & Log Pelaporan Kemajuan
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan kronologis berkas pelaporan yang dikirimkan oleh dosen pembimbing secara real-time.
              </p>
            </div>

            <Link
              href="/bimbingan"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              Lapor Mahasiswa Bimbingan
            </Link>
          </div>

          {/* Search Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama mahasiswa, NIM, dosen pelapor, atau isi laporan..."
              className="w-full text-xs sm:text-sm focus:outline-hidden"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
                Reset
              </button>
            )}
          </div>

          {/* Reports Timeline */}
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Memuat log pelaporan...</div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 text-xs">
              Tidak ada catatan laporan kemajuan yang cocok.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition space-y-3 ${
                    rep.isNoChange ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/mahasiswa/${rep.studentId}`}
                          className="font-bold text-sm text-slate-900 hover:text-unand-800 transition hover:underline"
                        >
                          {rep.studentName}
                        </Link>
                        <span className="font-mono text-xs text-slate-500">
                          (NIM {rep.studentNim} &bull; Angkatan {rep.angkatan})
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 mt-0.5 block">
                        Pelapor: <strong>{rep.reporterName}</strong> ({rep.reporterRole})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-semibold text-slate-700 block">
                        {rep.tglLaporan}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        WIB (Asia/Jakarta)
                      </span>
                    </div>
                  </div>

                  {rep.isNoChange ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        Konfirmasi "Belum Ada Perubahan"
                      </span>
                      <p><strong>Alasan:</strong> {rep.noChangeReason}</p>
                      <p><strong>Rencana Tindakan:</strong> {rep.noChangeNextPlan}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                      <div className="p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                          Perkembangan Kemajuan
                        </span>
                        <p>{rep.ringkasanKemajuan || '-'}</p>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                          Hambatan Utama
                        </span>
                        <p>{rep.hambatanUtama || 'Tidak ada hambatan.'}</p>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                          Tindakan & Target
                        </span>
                        <p>{rep.tindakanBerikutnya || '-'}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          PJ: {rep.penanggungJawabTindakan || '-'} &bull; Target: {rep.targetTindakLanjut || '-'}
                        </span>
                      </div>
                    </div>
                  )}

                  {rep.kebutuhanBantuanProdi && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        <strong>Dosen Menandai Kebutuhan Bantuan Prodi:</strong>{' '}
                        {rep.kebutuhanBantuanCatatan || 'Memerlukan intervensi/dukungan koordinasi prodi.'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
