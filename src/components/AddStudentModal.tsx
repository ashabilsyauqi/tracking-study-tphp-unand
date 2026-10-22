'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  BookOpen,
  Calendar,
  Layers,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStudent: any) => void;
  currentUser: any;
  lecturersList?: any[];
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

export default function AddStudentModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  lecturersList = [],
}: Props) {
  if (!isOpen) return null;

  const isDosen = currentUser?.role === 'DOSEN';

  // Form states
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [angkatan, setAngkatan] = useState<number>(2021);
  const [peranDosen, setPeranDosen] = useState<'utama' | 'pendamping'>('utama');
  const [pembimbingUtamaId, setPembimbingUtamaId] = useState('');
  const [pembimbingPendampingId, setPembimbingPendampingId] = useState('');
  const [rekanDosenId, setRekanDosenId] = useState('');
  const [tahapUtama, setTahapUtama] = useState('penetapan_judul');
  const [judulSkripsi, setJudulSkripsi] = useState('');
  const [bidangPenelitian, setBidangPenelitian] = useState('');
  const [tglMulaiTugasAkhir, setTglMulaiTugasAkhir] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [targetSelesai, setTargetSelesai] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [catatanAdministratif, setCatatanAdministratif] = useState('');

  const [dosenOptions, setDosenOptions] = useState<any[]>(lecturersList);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch lecturers list if not passed
  useEffect(() => {
    if (dosenOptions.length === 0) {
      fetch('/api/dosen')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setDosenOptions(data.data);
        })
        .catch(() => {});
    }
  }, [dosenOptions.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nim.trim() || !nama.trim() || !angkatan) {
      setError('NIM, Nama Lengkap, dan Angkatan wajib diisi.');
      return;
    }

    setLoading(true);

    let finalUtamaId: string | null = null;
    let finalPendampingId: string | null = null;

    if (isDosen) {
      if (peranDosen === 'utama') {
        finalUtamaId = currentUser.lecturerId;
        finalPendampingId = rekanDosenId || null;
      } else {
        finalPendampingId = currentUser.lecturerId;
        finalUtamaId = rekanDosenId || null;
      }
    } else {
      finalUtamaId = pembimbingUtamaId || null;
      finalPendampingId = pembimbingPendampingId || null;
    }

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nim: nim.trim(),
          nama: nama.trim(),
          angkatan: Number(angkatan),
          pembimbingUtamaId: finalUtamaId,
          pembimbingPendampingId: finalPendampingId,
          peranDosen: isDosen ? peranDosen : undefined,
          tahapUtama,
          judulSkripsi: judulSkripsi.trim() || null,
          bidangPenelitian: bidangPenelitian.trim() || null,
          tglMulaiTugasAkhir: tglMulaiTugasAkhir || null,
          targetSelesai: targetSelesai || null,
          noHp: noHp.trim() || null,
          email: email.trim() || null,
          catatanAdministratif: catatanAdministratif.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambahkan data mahasiswa.');
      }

      onSuccess(data.data);
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {isDosen ? 'Tambah Mahasiswa Bimbingan Baru' : 'Tambah Mahasiswa Tugas Akhir Baru'}
              </h3>
              <p className="text-xs text-slate-200">
                {isDosen
                  ? `Mendaftarkan mahasiswa bimbingan secara mandiri oleh ${currentUser?.name || 'Dosen Pembimbing'}`
                  : 'Registrasi data mahasiswa tugas akhir ke dalam sistem pemantauan prodi'}
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Alert Guidance */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold">Penambahan Mahasiswa Mandiri oleh Dosen</p>
              <p className="text-emerald-800 leading-relaxed">
                Mahasiswa yang Anda tambahkan akan otomatis masuk ke daftar <strong>Bimbingan Saya</strong> dan langsung dapat dipantau tahapan, target sidang, serta kemajuannya.
              </p>
            </div>
          </div>

          {/* 1. NIM, Nama, Angkatan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                NIM Mahasiswa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Contoh: 2111122045"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                Nama Lengkap Mahasiswa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap sesuai data akademik"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Angkatan <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={2015}
                max={2030}
                value={angkatan}
                onChange={(e) => setAngkatan(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Tahap Utama Terkini
              </label>
              <select
                value={tahapUtama}
                onChange={(e) => setTahapUtama(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden bg-white"
              >
                {TAHAP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Konfigurasi Pembimbing */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-unand-800" /> Penugasan Pembimbing
            </span>

            {isDosen ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    Peran Anda untuk Mahasiswa Ini:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPeranDosen('utama')}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        peranDosen === 'utama'
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>🔘 Pembimbing Utama</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeranDosen('pendamping')}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        peranDosen === 'pendamping'
                          ? 'bg-blue-100 border-blue-400 text-blue-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>🔘 Pembimbing Pendamping</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">
                    Rekan Dosen {peranDosen === 'utama' ? 'Pembimbing Pendamping' : 'Pembimbing Utama'} (Opsional):
                  </label>
                  <select
                    value={rekanDosenId}
                    onChange={(e) => setRekanDosenId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden bg-white"
                  >
                    <option value="">-- Belum ada / Belum ditentukan --</option>
                    {dosenOptions
                      .filter((d) => d.id !== currentUser.lecturerId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.namaGelar} ({d.nip || d.username})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">
                    Pembimbing Utama:
                  </label>
                  <select
                    value={pembimbingUtamaId}
                    onChange={(e) => setPembimbingUtamaId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden bg-white"
                  >
                    <option value="">-- Pilih Pembimbing Utama --</option>
                    {dosenOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.namaGelar}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">
                    Pembimbing Pendamping:
                  </label>
                  <select
                    value={pembimbingPendampingId}
                    onChange={(e) => setPembimbingPendampingId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden bg-white"
                  >
                    <option value="">-- Pilih Pembimbing Pendamping --</option>
                    {dosenOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.namaGelar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 3. Judul Skripsi & Bidang Penelitian */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-unand-800" /> Judul Skripsi (Draft / Definitif)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Opsional</span>
            </label>
            <textarea
              rows={2}
              value={judulSkripsi}
              onChange={(e) => setJudulSkripsi(e.target.value)}
              placeholder="Contoh: Pengaruh Variasi Suhu dan Lama Pengeringan terhadap Mutu Kimia dan Sensoris Bubuk Teh Kulit Kopi (Cascara)"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-unand-800" /> Bidang / Topik Penelitian
              </label>
              <input
                type="text"
                list="add-bidang-suggestions"
                value={bidangPenelitian}
                onChange={(e) => setBidangPenelitian(e.target.value)}
                placeholder="Pilih atau ketik bidang..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
              <datalist id="add-bidang-suggestions">
                {BIDANG_SUGGESTIONS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-unand-800" /> Target Selesai / Sidang
              </label>
              <input
                type="date"
                value={targetSelesai}
                onChange={(e) => setTargetSelesai(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> No. HP / WhatsApp Mahasiswa
              </label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Mahasiswa
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama.nim@student.unand.ac.id"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-unand-800" /> Catatan / Arahan Khusus Awal
              </span>
              <span className="text-[11px] font-normal text-slate-500">Opsional</span>
            </label>
            <textarea
              rows={2}
              value={catatanAdministratif}
              onChange={(e) => setCatatanAdministratif(e.target.value)}
              placeholder="Catatan topik riset, lab penelitian, atau panduan awal..."
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-unand-800 focus:outline-hidden"
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
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Tambahkan Mahasiswa Bimbingan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
