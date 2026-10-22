'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import StatusBadge from '@/components/StatusBadge';
import QuickReportModal from '@/components/QuickReportModal';
import NoChangeModal from '@/components/NoChangeModal';
import EditBimbinganModal from '@/components/EditBimbinganModal';
import ProgressEstimator from '@/components/ProgressEstimator';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  GraduationCap,
  BookOpen,
  Send,
  History,
  FileText,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Paperclip,
  Edit,
  Edit3,
  ShieldAlert,
  Info,
  Check,
  Award,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNoChangeModal, setShowNoChangeModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showEditBimbinganModal, setShowEditBimbinganModal] = useState(false);

  // Admin edit form states
  const [editNama, setEditNama] = useState('');
  const [editStatusAkademik, setEditStatusAkademik] = useState('aktif');
  const [editSemesterManual, setEditSemesterManual] = useState<number | ''>('');
  const [editSemesterCuti, setEditSemesterCuti] = useState(0);
  const [editJudul, setEditJudul] = useState('');
  const [editBidang, setEditBidang] = useState('');
  const [editTargetSelesai, setEditTargetSelesai] = useState('');
  const [editAlasanPerubahan, setEditAlasanPerubahan] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchStudentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      const res = await fetch(`/api/students/${studentId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat rincian mahasiswa.');
      }

      setStudent(data.data);
      setEditNama(data.data.nama);
      setEditStatusAkademik(data.data.statusAkademik);
      setEditSemesterManual(data.data.semesterManual || '');
      setEditSemesterCuti(data.data.semesterCuti || 0);
      setEditJudul(data.data.judulSkripsi || '');
      setEditBidang(data.data.bidangPenelitian || '');
      setEditTargetSelesai(data.data.targetSelesai || '');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAlasanPerubahan.trim()) {
      setEditError('Alasan perubahan wajib dicatat sesuai prosedur audit administratif prodi.');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: editNama.trim(),
          statusAkademik: editStatusAkademik,
          semesterManual: editSemesterManual === '' ? null : Number(editSemesterManual),
          semesterCuti: editSemesterCuti,
          judulSkripsi: editJudul.trim() || null,
          bidangPenelitian: editBidang.trim() || null,
          targetSelesai: editTargetSelesai || null,
          alasanPerubahan: editAlasanPerubahan.trim(),
          expectedVersion: student.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui data administratif.');
      }

      setShowEditAdminModal(false);
      setEditAlasanPerubahan('');
      fetchStudentData();
      alert('Data administratif berhasil diperbarui dan tercatat pada riwayat.');
    } catch (err: any) {
      setEditError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-unand-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Memuat dossier mahasiswa...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center border border-red-200">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Akses Dibatasi atau Data Tidak Ditemukan</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {error || 'Anda tidak memiliki hak akses untuk membuka dossier mahasiswa ini.'}
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-unand-800 text-white rounded-xl text-xs font-semibold hover:bg-unand-900 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reports = student.reports || [];
  const followUps = student.followUps || [];
  const advisorHistory = student.advisorHistory || [];
  const titleHistory = student.titleHistory || [];
  const stages = student.stages || [];
  const chapters = student.chapters || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/mahasiswa"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-unand-800 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Tabel Pemantauan
            </Link>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowNoChangeModal(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                title="Perbarui tanggal pelaporan tanpa mengubah tanggal kemajuan substantif"
              >
                <Clock className="w-3.5 h-3.5" />
                Belum Ada Perubahan
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-1.5 bg-unand-800 hover:bg-unand-900 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                title="Pelaporan Cepat (1 Menit)"
              >
                <Send className="w-3.5 h-3.5" />
                Lapor Kemajuan Cepat (1 Menit)
              </button>

              {(student?.isSupervisor || currentUser?.role === 'ADMIN' || currentUser?.role === 'KAPRODI') && (
                <button
                  onClick={() => setShowEditBimbinganModal(true)}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5"
                  title="Isi Judul Skripsi, Bidang Riset, Tahapan, Target, dan Kontak Mahasiswa"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                  Isi Kolom Bimbingan
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'KAPRODI') && (
                <button
                  onClick={() => setShowEditAdminModal(true)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  Koreksi Data Administratif
                </button>
              )}
            </div>
          </div>

          {/* Student Hero Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-unand-800 bg-unand-50 border border-unand-200 px-2 py-0.5 rounded">
                    NIM {student.nim}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    Angkatan {student.angkatan}
                  </span>
                  <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Semester {student.calculatedSemester || student.semesterManual}
                  </span>
                  <StatusBadge
                    status={student.computedAttention?.status || student.statusPerhatian}
                    label={student.computedAttention?.label}
                    reasons={student.computedAttention?.reasons}
                    size="md"
                  />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mt-1">{student.nama}</h1>
                <p className="text-xs text-slate-500">
                  Program Studi {student.prodi} &bull; Fakultas Teknologi Pertanian, Universitas Andalas
                </p>
              </div>

              <div className="text-right text-xs space-y-1">
                <div className="text-slate-500">
                  Target Selesai Studi: <strong className="text-slate-900">{student.targetSelesai || 'Belum diisi'}</strong>
                </div>
                <div className="text-slate-500">
                  Pelaporan Terakhir: <strong className="text-slate-900">{student.tglLaporanTerakhir || 'Belum pernah'}</strong>
                </div>
                <div className="text-slate-500">
                  Kemajuan Substantif: <strong className="text-slate-900">{student.tglKemajuanSubstantif || 'Belum pernah'}</strong>
                </div>
              </div>
            </div>

            {/* Current Thesis Title Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1.5 text-unand-800">
                  <BookOpen className="w-4 h-4" />
                  Judul Skripsi Terbaru
                </span>
                <span className="text-[10px] text-slate-400 capitalize font-normal">
                  Bidang: {student.bidangPenelitian || 'Umum'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 italic leading-snug">
                {student.judulSkripsi ? `"${student.judulSkripsi}"` : '(Mahasiswa belum memiliki judul skripsi definitif)'}
              </p>
            </div>

            {/* Advisors & Active Activities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-3 bg-slate-50/70 border rounded-xl">
                <span className="text-slate-400 block font-medium">Pembimbing Utama:</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {student.pembimbingUtama?.namaGelar || '(Belum ditetapkan)'}
                </span>
                <span className="text-[10px] text-slate-500">{student.pembimbingUtama?.email || ''}</span>
              </div>

              <div className="p-3 bg-slate-50/70 border rounded-xl">
                <span className="text-slate-400 block font-medium">Pembimbing Pendamping:</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {student.pembimbingPendamping?.namaGelar || '(Tidak ada / Belum ditetapkan)'}
                </span>
                <span className="text-[10px] text-slate-500">{student.pembimbingPendamping?.email || ''}</span>
              </div>

              <div className="p-3 bg-slate-50/70 border rounded-xl">
                <span className="text-slate-400 block font-medium">Tahap Utama & Aktivitas Berjalan:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="font-bold text-unand-800 bg-unand-50 border border-unand-200 px-2 py-0.5 rounded capitalize">
                    {student.tahapUtama?.replace(/_/g, ' ')}
                  </span>
                  {(student.activeActivities || []).map((act: string, idx: number) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200">
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Optional Progress Estimator (Section 11) */}
          {student.estimatedProgress && (
            <ProgressEstimator
              percentage={student.estimatedProgress.percentage}
              breakdown={student.estimatedProgress.breakdown}
              formulaDescription={student.estimatedProgress.formulaDescription}
              initiallyOpen={false}
            />
          )}

          {/* 6 Stages Timeline & Details (Section 5) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-unand-800" />
                  Linimasa & Kemajuan 6 Tahapan Studi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Setiap tahapan mencakup target selesai, tanggal aktual, catatan, dan bukti pendukung.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {stages.map((stg: any) => {
                let badgeColor = 'bg-slate-100 text-slate-700';
                if (stg.status === 'selesai') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                else if (stg.status === 'sedang_berjalan') badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                else if (stg.status === 'menunggu_jadwal') badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                else if (stg.status === 'tertunda') badgeColor = 'bg-red-100 text-red-800 border-red-200';

                return (
                  <div key={stg.stageKey} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{stg.stageName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${badgeColor}`}>
                        {stg.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Selesai:</span>
                        <span className="font-mono text-slate-800">{stg.targetSelesai || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tgl Selesai Aktual:</span>
                        <span className="font-mono text-slate-800">{stg.tglSelesaiAktual || '-'}</span>
                      </div>
                      {stg.catatan && (
                        <div className="mt-2 pt-2 border-t text-slate-700 italic">
                          "{stg.catatan}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skripsi Chapters (Bab I - V) Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-unand-800" />
              Kemajuan Bab Naskah Skripsi (Bab I – V)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              {chapters.map((ch: any) => {
                let badge = 'bg-slate-100 text-slate-600';
                if (ch.status === 'disetujui') badge = 'bg-emerald-100 text-emerald-800 font-bold';
                else if (ch.status === 'ditinjau_pembimbing') badge = 'bg-blue-100 text-blue-800 font-medium';
                else if (ch.status === 'revisi') badge = 'bg-amber-100 text-amber-800 font-medium';
                else if (ch.status === 'draf') badge = 'bg-indigo-50 text-indigo-700';

                return (
                  <div key={ch.chapterNum} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5 text-center">
                    <span className="font-bold text-slate-800 block text-xs">
                      {ch.chapterName}
                    </span>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${badge}`}>
                      {ch.status.replace(/_/g, ' ')}
                    </span>
                    {ch.tglDisetujui && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Disetujui: {ch.tglDisetujui}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Follow Ups (Tindak Lanjut Prodi) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-amber-600" />
                Catatan Hambatan & Tindak Lanjut Program Studi
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {followUps.length} Catatan Tindak Lanjut
              </span>
            </div>

            {followUps.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                Belum ada agenda tindak lanjut khusus untuk mahasiswa ini.
              </p>
            ) : (
              <div className="space-y-3">
                {followUps.map((item: any) => (
                  <div
                    key={item.id}
                    className={`border rounded-xl p-4 text-xs space-y-2 ${
                      item.status === 'selesai'
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.tindakanDisepakati}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          item.status === 'selesai'
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-slate-700">
                      <strong>Masalah:</strong> {item.masalah}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                      <div>Penanggung Jawab: <strong className="text-slate-800">{item.penanggungJawab}</strong></div>
                      <div>Tenggat: <strong className="text-slate-800">{item.tenggat}</strong></div>
                      <div>Dicatat Oleh: <strong className="text-slate-800">{item.createdByName}</strong></div>
                    </div>

                    {item.hasilTindakLanjut && (
                      <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-[11px] text-emerald-900">
                        <strong>Hasil Akhir:</strong> {item.hasilTindakLanjut}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Logs: Progress Reports, Advisor Changes, Title Changes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Reports History */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b pb-2">
                <History className="w-5 h-5 text-unand-800" />
                Riwayat Pelaporan Kemajuan Dosen ({reports.length})
              </h3>

              {reports.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Belum ada laporan kemajuan yang dikirimkan.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {reports.map((rep: any) => (
                    <div
                      key={rep.id}
                      className={`border rounded-xl p-3.5 text-xs space-y-2 ${
                        rep.isNoChange ? 'bg-amber-50/30 border-amber-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-1">
                        <div>
                          <span className="font-bold text-slate-900">{rep.reporterName}</span>
                          <span className="text-[10px] text-slate-500 ml-1">({rep.reporterRole})</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{rep.tglLaporan}</span>
                      </div>

                      {rep.isNoChange ? (
                        <div className="text-amber-900 text-xs">
                          <span className="font-bold block">Status: Belum Ada Perubahan</span>
                          <span className="text-slate-600 block mt-0.5">Alasan: {rep.noChangeReason}</span>
                          <span className="text-slate-600 block mt-0.5">Rencana: {rep.noChangeNextPlan}</span>
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-700">
                          <p><strong>Perkembangan:</strong> {rep.ringkasanKemajuan || '-'}</p>
                          <p><strong>Hambatan:</strong> {rep.hambatanUtama || '-'}</p>
                          <p><strong>Tindakan:</strong> {rep.tindakanBerikutnya || '-'}</p>
                          {rep.kebutuhanBantuanProdi && (
                            <span className="inline-block text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded mt-1">
                              Memerlukan Bantuan Prodi: {rep.kebutuhanBantuanCatatan || 'Ya'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advisor History & Title Revision History */}
            <div className="space-y-6">
              {/* Advisor History */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b pb-2">
                  <User className="w-5 h-5 text-unand-800" />
                  Riwayat Penugasan Pembimbing ({advisorHistory.length})
                </h3>

                {advisorHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Belum ada riwayat perubahan pembimbing.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {advisorHistory.map((adv: any) => (
                      <div key={adv.id} className="p-2.5 bg-slate-50 border rounded-lg">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>Utama: {adv.newUtamaNama} | Pendamping: {adv.newPendampingNama}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{adv.changeDate}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Alasan: "{adv.reason}" &bull; Dicatat oleh: {adv.changedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title History */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b pb-2">
                  <BookOpen className="w-5 h-5 text-unand-800" />
                  Riwayat Perubahan Judul Skripsi ({titleHistory.length})
                </h3>

                {titleHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Belum ada riwayat revisi judul.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {titleHistory.map((ttl: any) => (
                      <div key={ttl.id} className="p-2.5 bg-slate-50 border rounded-lg">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span className="line-clamp-1 italic">"{ttl.newTitle}"</span>
                          <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-2">{ttl.changeDate}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Status: {ttl.statusJudul} &bull; Alasan: "{ttl.reason}" ({ttl.changedBy})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Quick Report Modal */}
      {showReportModal && (
        <QuickReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          student={student}
          onSuccess={() => {
            fetchStudentData();
            alert('Laporan kemajuan mahasiswa berhasil disimpan!');
          }}
          onReloadStudent={fetchStudentData}
        />
      )}

      {/* No Change Modal */}
      {showNoChangeModal && (
        <NoChangeModal
          isOpen={showNoChangeModal}
          onClose={() => setShowNoChangeModal(false)}
          student={student}
          onSuccess={() => {
            fetchStudentData();
            alert('Status Belum Ada Perubahan berhasil dicatat.');
          }}
        />
      )}

      {/* Edit Administrative Data Modal with Change Reason (Section 2A & 4) */}
      {showEditAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-unand-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Koreksi Data Administratif Mahasiswa</h3>
                <p className="text-xs text-slate-300">Wajib menyertakan alasan perubahan untuk jejak audit prodi</p>
              </div>
              <button onClick={() => setShowEditAdminModal(false)} className="text-white/70 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminUpdate} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {editError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Mahasiswa</label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akademik</label>
                  <select
                    value={editStatusAkademik}
                    onChange={(e) => setEditStatusAkademik(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="cuti">Cuti</option>
                    <option value="lulus">Lulus</option>
                    <option value="mengundurkan_diri">Mengundurkan Diri</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester Manual (Opsional)</label>
                  <input
                    type="number"
                    value={editSemesterManual}
                    onChange={(e) => setEditSemesterManual(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Auto hitung jika kosong"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester Cuti</label>
                  <input
                    type="number"
                    value={editSemesterCuti}
                    onChange={(e) => setEditSemesterCuti(Number(e.target.value))}
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Skripsi Definitif</label>
                <textarea
                  rows={2}
                  value={editJudul}
                  onChange={(e) => setEditJudul(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan Perubahan Administratif <span className="text-red-500">* (Wajib diisi sesuai SOP prodi)</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={editAlasanPerubahan}
                  onChange={(e) => setEditAlasanPerubahan(e.target.value)}
                  placeholder="Contoh: Penyesuaian judul berdasarkan SK Pengesahan Judul Komisi Pembimbing Nomor..."
                  className="w-full border border-red-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-red-500 bg-red-50/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditAdminModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bimbingan Modal */}
      {showEditBimbinganModal && student && (
        <EditBimbinganModal
          isOpen={showEditBimbinganModal}
          onClose={() => setShowEditBimbinganModal(false)}
          student={student}
          currentLecturerId={currentUser?.lecturerId}
          onSuccess={() => {
            fetchStudentData();
            alert('Kolom bimbingan mahasiswa berhasil diperbarui!');
          }}
        />
      )}
    </div>
  );
}
