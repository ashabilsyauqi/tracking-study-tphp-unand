'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import { exportStudentsToExcel, exportStudentsToPDF, exportBahanRapatPDF } from '@/lib/exportHelper';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Users,
  Calendar,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Award,
  CheckCircle,
} from 'lucide-react';

export default function LaporanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [selectedAngkatan, setSelectedAngkatan] = useState('2021');
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

      const stdRes = await fetch('/api/students?limit=250');
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
  }, []);

  // 7 Presets as specified in Section 12:
  const presets = [
    {
      id: 'all',
      title: 'Seluruh Mahasiswa Tingkat Akhir',
      desc: 'Mencakup seluruh mahasiswa aktif, status tahapan, dan dosen pembimbing.',
      icon: Users,
      color: 'text-unand-800 bg-unand-50 border-unand-200',
      getFilter: () => students.filter((s) => s.statusAkademik === 'aktif'),
    },
    {
      id: 'per_dosen',
      title: 'Mahasiswa per Dosen Pembimbing',
      desc: 'Daftar mahasiswa bimbingan khusus untuk dosen yang dipilih.',
      icon: GraduationCap,
      color: 'text-blue-800 bg-blue-50 border-blue-200',
      hasLecturerSelect: true,
      getFilter: () =>
        students.filter(
          (s) =>
            s.pembimbingUtamaId === selectedLecturerId ||
            s.pembimbingPendampingId === selectedLecturerId
        ),
    },
    {
      id: 'per_angkatan',
      title: 'Mahasiswa per Angkatan',
      desc: 'Daftar pemantauan mahasiswa berdasarkan kohort angkatan.',
      icon: Calendar,
      color: 'text-violet-800 bg-violet-50 border-violet-200',
      hasAngkatanSelect: true,
      getFilter: () => students.filter((s) => String(s.angkatan) === String(selectedAngkatan)),
    },
    {
      id: 'perhatian',
      title: 'Mahasiswa Memerlukan Perhatian & Prioritas',
      desc: 'Mahasiswa dengan hambatan aktif, keterlambatan laporan >30 hari, atau masa studi kritis.',
      icon: AlertCircle,
      color: 'text-red-800 bg-red-50 border-red-200',
      getFilter: () =>
        students.filter(
          (s) =>
            s.computedAttention?.status === 'perlu_perhatian' ||
            s.computedAttention?.status === 'prioritas'
        ),
    },
    {
      id: 'tanpa_judul',
      title: 'Mahasiswa Belum Memiliki Judul Skripsi',
      desc: 'Mahasiswa tingkat akhir yang belum menetapkan judul atau topik penelitian.',
      icon: BookOpen,
      color: 'text-amber-800 bg-amber-50 border-amber-200',
      getFilter: () => students.filter((s) => !s.judulSkripsi),
    },
    {
      id: 'target_mendatang',
      title: 'Target Seminar & Ujian Mendatang (30–60 Hari)',
      desc: 'Mahasiswa yang dijadwalkan seminar proposal, seminar hasil, atau ujian dalam 60 hari.',
      icon: Award,
      color: 'text-teal-800 bg-teal-50 border-teal-200',
      getFilter: () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const next60 = new Date();
        next60.setDate(next60.getDate() + 60);
        const next60Str = next60.toISOString().split('T')[0];
        return students.filter((s) =>
          (s.stages || []).some(
            (st: any) =>
              st.targetSelesai &&
              st.targetSelesai >= todayStr &&
              st.targetSelesai <= next60Str &&
              st.status !== 'selesai'
          )
        );
      },
    },
    {
      id: 'rekap_rapat',
      title: 'Rekap Bulanan & Bahan Rapat Evaluasi',
      desc: 'Format eksekutif ringkasan capaian bulanan dan kendala untuk rapat pimpinan prodi.',
      icon: FileSpreadsheet,
      color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      getFilter: () =>
        students.filter(
          (s) =>
            s.statusAkademik === 'aktif' &&
            (s.computedAttention?.status === 'prioritas' ||
              s.computedAttention?.status === 'perlu_perhatian' ||
              (s.followUps && s.followUps.length > 0))
        ),
    },
  ];

  const handleExport = (preset: any, format: 'excel' | 'pdf') => {
    const data = preset.getFilter();
    let filterLabel = preset.title;
    if (preset.hasLecturerSelect) {
      const lec = lecturers.find((l) => l.id === selectedLecturerId);
      filterLabel += ` - ${lec ? lec.namaGelar : 'Semua Dosen'}`;
    }
    if (preset.hasAngkatanSelect) {
      filterLabel += ` - Angkatan ${selectedAngkatan}`;
    }

    const metadata = {
      title: preset.title,
      reportDate: new Date().toISOString().split('T')[0],
      filterSummary: filterLabel,
      generatedBy: currentUser?.name || 'Sistem',
    };

    if (format === 'excel') {
      exportStudentsToExcel(
        data,
        metadata,
        `${preset.id}_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } else {
      if (preset.id === 'rekap_rapat') {
        exportBahanRapatPDF({
          priorityStudents: data,
          generatedBy: currentUser?.name || 'Sistem',
          filename: `Bahan_Rapat_Evaluasi_TPHP_${new Date().toISOString().split('T')[0]}.pdf`,
        });
      } else {
        exportStudentsToPDF(
          data,
          metadata,
          `${preset.id}_${new Date().toISOString().split('T')[0]}.pdf`
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchData} />}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-unand-950 via-unand-900 to-unand-800 text-white rounded-2xl p-6 shadow-md border border-unand-800">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Pusat Laporan & Ekspor Data (Excel / PDF)
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
              Sediakan ekspor resmi data pemantauan sesuai 7 kategori standar akademik program studi. Laporan menyertakan tanggal ekspor, metadata filter aktif, dan glosarium definisi indikator.
            </p>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((preset) => {
              const Icon = preset.icon;
              const count = preset.getFilter().length;

              return (
                <div
                  key={preset.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-unand-600 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl border ${preset.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{preset.title}</h3>
                          <span className="text-[11px] font-mono font-semibold text-slate-500">
                            {count} Mahasiswa Terfilter
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{preset.desc}</p>

                    {/* Secondary selector for per_dosen */}
                    {preset.hasLecturerSelect && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Pilih Dosen Pembimbing:
                        </label>
                        <select
                          value={selectedLecturerId}
                          onChange={(e) => setSelectedLecturerId(e.target.value)}
                          className="w-full text-xs border rounded-lg p-2 bg-white"
                        >
                          <option value="">-- Semua Dosen (20 Dosen) --</option>
                          {lecturers.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.namaGelar}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Secondary selector for per_angkatan */}
                    {preset.hasAngkatanSelect && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Pilih Tahun Angkatan:
                        </label>
                        <select
                          value={selectedAngkatan}
                          onChange={(e) => setSelectedAngkatan(e.target.value)}
                          className="w-full text-xs border rounded-lg p-2 bg-white"
                        >
                          <option value="2019">Angkatan 2019 (Semester 12)</option>
                          <option value="2020">Angkatan 2020 (Semester 10)</option>
                          <option value="2021">Angkatan 2021 (Semester 8)</option>
                          <option value="2022">Angkatan 2022 (Semester 6)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Export Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => handleExport(preset, 'excel')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-semibold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      Unduh Excel (.xlsx)
                    </button>

                    <button
                      onClick={() => handleExport(preset, 'pdf')}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-xl font-semibold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-red-700" />
                      Unduh PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
