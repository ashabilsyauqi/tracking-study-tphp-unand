'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  BookOpen,
  Calendar,
  Layers,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess: () => void;
  currentLecturerId?: string;
}

const TAHAP_OPTIONS = [
  { value: 'penetapan_judul', label: '1. Penetapan Judul (Pra-Proposal)' },
  { value: 'seminar_proposal', label: '2. Seminar Proposal' },
  { value: 'penelitian', label: '3. Pelaksanaan Penelitian (Lab / Lapangan)' },
  { value: 'penulisan_skripsi', label: '4. Penulisan Naskah Skripsi' },
  { value: 'seminar_hasil', label: '5. Seminar Hasil (Semhas)' },
  { value: 'ujian_sarjana', label: '6. Ujian Sarjana / Sidang Skripsi' },
];

const BIDANG_SUGGESTIONS = [
  'Kimia & Biokimia Pangan',
  'Mikrobiologi & Bioteknologi Pangan',
  'Rekayasa Proses & Pascapanen',
  'Sensoris & Pangan Fungsional',
  'Pengendalian Mutu & Keamanan Pangan',
  'Pengemasan & Penyimpanan Pangan',
  'Pemanfaatan Limbah Agroindustri',
];

export default function EditBimbinganModal({
  isOpen,
  onClose,
  student,
  onSuccess,
  currentLecturerId,
}: Props) {
  if (!isOpen || !student) return null;

  const [judulSkripsi, setJudulSkripsi] = useState(student.judulSkripsi || '');
  const [bidangPenelitian, setBidangPenelitian] = useState(student.bidangPenelitian || '');
  const [tahapUtama, setTahapUtama] = useState(student.tahapUtama || 'penetapan_judul');
  const [targetSelesai, setTargetSelesai] = useState(student.targetSelesai || '');
  const [tglMulaiTugasAkhir, setTglMulaiTugasAkhir] = useState(student.tglMulaiTugasAkhir || '');
  const [noHp, setNoHp] = useState(student.noHp || '');
  const [email, setEmail] = useState(student.email || '');
  const [catatanAdministratif, setCatatanAdministratif] = useState(student.catatanAdministratif || '');
  const [alasanPerubahan, setAlasanPerubahan] = useState('Pembaruan kolom bimbingan oleh Dosen Pembimbing');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<any | null>(null);

  useEffect(() => {
    setJudulSkripsi(student.judulSkripsi || '');
    setBidangPenelitian(student.bidangPenelitian || '');
    setTahapUtama(student.tahapUtama || 'penetapan_judul');
    setTargetSelesai(student.targetSelesai || '');
    setTglMulaiTugasAkhir(student.tglMulaiTugasAkhir || '');
    setNoHp(student.noHp || '');
    setEmail(student.email || '');
    setCatatanAdministratif(student.catatanAdministratif || '');
    setAlasanPerubahan('Pembaruan kolom bimbingan oleh Dosen Pembimbing');
    setError(null);
    setConflictData(null);
  }, [student]);

  const isUtama = currentLecturerId && student.pembimbingUtamaId === currentLecturerId;
  const isPendamping = currentLecturerId && student.pembimbingPendampingId === currentLecturerId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConflictData(null);

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judulSkripsi: judulSkripsi.trim() || null,
          bidangPenelitian: bidangPenelitian.trim() || null,
          tahapUtama,
          targetSelesai: targetSelesai || null,
          tglMulaiTugasAkhir: tglMulaiTugasAkhir || null,
          noHp: noHp.trim() || null,
          email: email.trim() || null,
          catatanAdministratif: catatanAdministratif.trim() || null,
          alasanPerubahan: alasanPerubahan.trim() || 'Pembaruan kolom bimbingan oleh Dosen Pembimbing',
          expectedVersion: student.version,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setConflictData(data);
          setError(data.error || 'Terjadi konflik data karena perubahan oleh pengguna lain.');
          return;
        }
        throw new Error(data.error || 'Gagal menyimpan pembaruan bimbingan.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-unand-950 via-unand-900 to-unand-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                Isi Kolom Bimbingan Tugas Akhir
              </h3>
              <p className="text-xs text-slate-200">
                {student.nama} ({student.nim}) &bull; Angkatan {student.angkatan}
                {isUtama && <span className="ml-2 font-semibold text-emerald-300">[Pembimbing Utama]</span>}
                {isPendamping && <span className="ml-2 font-semibold text-blue-300">[Pembimbing Pendamping]</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold">{error}</p>
                {conflictData && (
                  <p className="mt-1 text-slate-600">
                    Silakan tutup modal ini dan buka kembali untuk memuat data terbaru dari mahasiswa ini.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Alert Guidance */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold">Kelengkapan Data Bimbingan Mahasiswa</p>
              <p className="text-emerald-800 leading-relaxed">
                Anda dapat mengisi atau memperbarui judul skripsi, topik penelitian, tahapan, target sidang, kontak mahasiswa, dan arahan pembimbing. Seluruh perubahan tercatat dalam rekam jejak bimbingan Prodi TPHP.
              </p>
            </div>
          </div>

          {/* 1. Judul Skripsi */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-unand-800" /> Judul Skripsi (Draft / Definitif)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Dapat diperbarui sewaktu-waktu</span>
            </label>
            <textarea
              rows={2}
              value={judulSkripsi}
              onChange={(e) => setJudulSkripsi(e.target.value)}
              placeholder="Contoh: Pengaruh Variasi Suhu dan Lama Pengeringan terhadap Mutu Kimia dan Sensoris Bubuk Teh Kulit Kopi (Cascara)"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
            />
          </div>

          {/* 2. Bidang Penelitian & Tahap Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-unand-800" /> Bidang / Topik Penelitian
                </span>
              </label>
              <input
                type="text"
                list="bidang-suggestions"
                value={bidangPenelitian}
                onChange={(e) => setBidangPenelitian(e.target.value)}
                placeholder="Pilih atau ketik bidang riset..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
              <datalist id="bidang-suggestions">
                {BIDANG_SUGGESTIONS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Contoh: Kimia & Biokimia Pangan, Mikrobiologi, Rekayasa Proses
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-unand-800" /> Tahap Utama Skripsi
                </span>
                <span className="text-[10px] text-slate-400">Tahap terkini</span>
              </label>
              <select
                value={tahapUtama}
                onChange={(e) => setTahapUtama(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden capitalize bg-white"
              >
                {TAHAP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Tanggal Mulai TA & Target Selesai / Sidang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-unand-800" /> Tanggal Mulai Tugas Akhir
              </label>
              <input
                type="date"
                value={tglMulaiTugasAkhir}
                onChange={(e) => setTglMulaiTugasAkhir(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Tanggal mahasiswa mulai bimbingan / penelitian
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-unand-800" /> Target Selesai / Target Sidang
                </span>
              </label>
              <input
                type="date"
                value={targetSelesai}
                onChange={(e) => setTargetSelesai(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Kesepakatan target kelulusan mahasiswa
              </span>
            </div>
          </div>

          {/* 4. Kontak Mahasiswa (No HP & Email) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> Kontak Mahasiswa (Penting untuk Komunikasi Cepat)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">
                  Nomor HP / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">
                  Email Mahasiswa
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.nim@student.unand.ac.id"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Catatan / Arahan Pembimbing */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-unand-800" /> Catatan / Arahan Khusus Pembimbing
              </span>
              <span className="text-[11px] font-normal text-slate-500">Opsional</span>
            </label>
            <textarea
              rows={2}
              value={catatanAdministratif}
              onChange={(e) => setCatatanAdministratif(e.target.value)}
              placeholder="Catatan arahan fokus penelitian, instrumen laboratorium, atau rekomendasi untuk mahasiswa..."
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
            />
          </div>

          {/* 6. Alasan Perubahan (Audit Log) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">
              Catatan Rekam Jejak Audit (Prosedur Administratif Prodi)
            </label>
            <input
              type="text"
              required
              value={alasanPerubahan}
              onChange={(e) => setAlasanPerubahan(e.target.value)}
              placeholder="Alasan perubahan kolom bimbingan..."
              className="w-full border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-unand-800 focus:outline-hidden bg-slate-50"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition text-xs sm:text-sm disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-xs text-xs sm:text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Kolom Bimbingan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
