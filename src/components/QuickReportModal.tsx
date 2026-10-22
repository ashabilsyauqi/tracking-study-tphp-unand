'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  AlertCircle,
  FileText,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calendar,
  UserCheck,
} from 'lucide-react';
import ConflictModal from './ConflictModal';
import NoChangeModal from './NoChangeModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess: (data: any) => void;
  onReloadStudent?: () => void;
}

export default function QuickReportModal({
  isOpen,
  onClose,
  student,
  onSuccess,
  onReloadStudent,
}: Props) {
  if (!isOpen || !student) return null;

  // Form states
  const [tglKondisi, setTglKondisi] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [substantiveProgressDate, setSubstantiveProgressDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tglBimbinganTerakhir, setTglBimbinganTerakhir] = useState(
    student.tglLaporanTerakhir || new Date().toISOString().split('T')[0]
  );
  const [ringkasanKemajuan, setRingkasanKemajuan] = useState('');
  const [hambatanUtama, setHambatanUtama] = useState('');
  const [tindakanBerikutnya, setTindakanBerikutnya] = useState('');
  const [penanggungJawabTindakan, setPenanggungJawabTindakan] = useState('Mahasiswa');
  const [targetTindakLanjut, setTargetTindakLanjut] = useState('');
  const [kebutuhanBantuanProdi, setKebutuhanBantuanProdi] = useState(false);
  const [kebutuhanBantuanCatatan, setKebutuhanBantuanCatatan] = useState('');
  const [tahapUtamaBaru, setTahapUtamaBaru] = useState(student.tahapUtama || 'penetapan_judul');

  // Stages & Chapters local state
  const [stageUpdates, setStageUpdates] = useState<any[]>([]);
  const [chapterUpdates, setChapterUpdates] = useState<any[]>([]);

  // Sub-modal states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<any>(null);
  const [showNoChangeModal, setShowNoChangeModal] = useState(false);

  useEffect(() => {
    if (student) {
      setTahapUtamaBaru(student.tahapUtama || 'penetapan_judul');
      if (student.stages) {
        setStageUpdates(
          student.stages.map((st: any) => ({
            id: st.id,
            stageKey: st.stageKey,
            stageName: st.stageName,
            status: st.status,
            targetSelesai: st.targetSelesai || '',
            tglSelesaiAktual: st.tglSelesaiAktual || '',
          }))
        );
      }
      if (student.chapters) {
        setChapterUpdates(
          student.chapters.map((ch: any) => ({
            id: ch.id,
            chapterNum: ch.chapterNum,
            chapterName: ch.chapterName,
            status: ch.status,
          }))
        );
      }
    }
  }, [student]);

  const latestReport = student.reports && student.reports.length > 0 ? student.reports[0] : null;

  const handleStageStatusChange = (index: number, newStatus: string) => {
    setStageUpdates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: newStatus };
      return copy;
    });
  };

  const handleChapterStatusChange = (index: number, newStatus: string) => {
    setChapterUpdates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: newStatus };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ringkasanKemajuan.trim()) {
      setErrorMsg('Ringkasan perkembangan kemajuan wajib diisi secara singkat.');
      return;
    }
    if (!hambatanUtama.trim()) {
      setErrorMsg('Catatan hambatan utama wajib diisi (isi "Tidak ada" bila lancar).');
      return;
    }
    if (!tindakanBerikutnya.trim()) {
      setErrorMsg('Tindakan berikutnya wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/students/${student.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedVersion: student.version,
          tglKondisi,
          substantiveProgressDate,
          ringkasanKemajuan,
          tglBimbinganTerakhir,
          hambatanUtama,
          tindakanBerikutnya,
          penanggungJawabTindakan,
          targetTindakLanjut,
          kebutuhanBantuanProdi,
          kebutuhanBantuanCatatan,
          tahapUtamaBaru,
          stageUpdates,
          chapterUpdates,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Concurrency conflict!
        setConflictData(data);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan laporan.');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-unand-900 text-white flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-gold-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                  Pelaporan Cepat (1 Menit)
                </span>
                <span className="text-emerald-300 text-xs font-mono">NIM {student.nim}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">{student.nama}</h2>
              <p className="text-xs text-slate-300 line-clamp-1 italic">
                {student.judulSkripsi ? `"${student.judulSkripsi}"` : '(Belum memiliki judul skripsi)'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Action: "Belum Ada Perubahan" Button Banner */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Tidak ada perubahan baru sejak laporan terakhir? Tekan tombol ini untuk memperbarui tanggal lapor tanpa merusak linimasa.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNoChangeModal(true)}
                className="px-3.5 py-1.5 bg-amber-700 text-white hover:bg-amber-800 rounded-lg font-medium transition shadow-xs flex items-center gap-1.5 text-xs"
              >
                Tombol "Belum Ada Perubahan"
              </button>
            </div>

            {/* Previous Report Summary (Section 6 requirement 4) */}
            {latestReport ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
                <div className="font-semibold text-slate-900 flex items-center justify-between border-b pb-1">
                  <span className="flex items-center gap-1 text-unand-800">
                    <History className="w-3.5 h-3.5" /> Ringkasan Laporan Sebelumnya ({latestReport.tglLaporan})
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Oleh: {latestReport.reporterName} ({latestReport.reporterRole})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Perkembangan Terakhir:</span>
                    <span className="text-slate-800">{latestReport.ringkasanKemajuan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Hambatan Lalu:</span>
                    <span className="text-slate-800">{latestReport.hambatanUtama || 'Nihil'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Rencana Tindakan Lalu:</span>
                    <span className="text-slate-800">{latestReport.tindakanBerikutnya || '-'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 italic">
                Belum ada riwayat laporan sebelumnya. Laporan ini akan menjadi laporan perdana.
              </div>
            )}

            {/* Grid 1: Tahap Utama & Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tahap Utama Mahasiswa Saat Ini
                </label>
                <select
                  value={tahapUtamaBaru}
                  onChange={(e) => setTahapUtamaBaru(e.target.value)}
                  className="w-full text-xs sm:text-sm border rounded-lg p-2 focus:ring-2 focus:ring-unand-500 bg-white"
                >
                  <option value="penetapan_judul">Penetapan Judul</option>
                  <option value="seminar_proposal">Seminar Proposal</option>
                  <option value="penelitian">Penelitian</option>
                  <option value="penulisan_skripsi">Penulisan Skripsi</option>
                  <option value="seminar_hasil">Seminar Hasil</option>
                  <option value="ujian_sarjana">Ujian Sarjana</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Satu tahap tunggal untuk rekonsiliasi data prodi.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tanggal Bimbingan Terakhir
                </label>
                <input
                  type="date"
                  value={tglBimbinganTerakhir}
                  onChange={(e) => setTglBimbinganTerakhir(e.target.value)}
                  className="w-full text-xs sm:text-sm border rounded-lg p-2 focus:ring-2 focus:ring-unand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tanggal Kemajuan Substantif
                </label>
                <input
                  type="date"
                  value={substantiveProgressDate}
                  onChange={(e) => setSubstantiveProgressDate(e.target.value)}
                  className="w-full text-xs sm:text-sm border rounded-lg p-2 focus:ring-2 focus:ring-unand-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Tanggal saat mahasiswa menunjukkan progres nyata.
                </span>
              </div>
            </div>

            {/* Stages Grid (Section 5: Flexible parallel execution!) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-unand-700" />
                  Status 6 Tahapan Utama
                </h4>
                <span className="text-[11px] text-slate-400">
                  (Penelitian & Penulisan boleh berjalan bersamaan)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stageUpdates.map((stg, idx) => (
                  <div key={stg.stageKey} className="bg-white border rounded-lg p-2.5 shadow-2xs">
                    <span className="font-semibold text-xs text-slate-800 block mb-1">
                      {stg.stageName}
                    </span>
                    <select
                      value={stg.status}
                      onChange={(e) => handleStageStatusChange(idx, e.target.value)}
                      className="w-full text-xs border rounded p-1.5 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-unand-500"
                    >
                      <option value="belum_dilaporkan">Belum Dilaporkan</option>
                      <option value="belum_dimulai">Belum Dimulai</option>
                      <option value="sedang_berjalan">Sedang Berjalan</option>
                      <option value="menunggu_jadwal">Menunggu Jadwal / Persetujuan</option>
                      <option value="selesai">Selesai</option>
                      <option value="tertunda">Tertunda</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapters Bab I - V Progress */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-unand-700" />
                Kemajuan Naskah Skripsi (Bab I – V)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {chapterUpdates.map((ch, idx) => (
                  <div key={ch.chapterNum} className="bg-white border rounded-lg p-2 text-center">
                    <span className="font-medium text-[11px] text-slate-800 block truncate" title={ch.chapterName}>
                      {ch.chapterName.split(':')[0]}
                    </span>
                    <select
                      value={ch.status}
                      onChange={(e) => handleChapterStatusChange(idx, e.target.value)}
                      className="w-full text-[11px] border rounded p-1 mt-1 bg-slate-50 focus:bg-white text-slate-700"
                    >
                      <option value="belum_dimulai">Belum Dimulai</option>
                      <option value="draf">Draf</option>
                      <option value="ditinjau_pembimbing">Ditinjau</option>
                      <option value="revisi">Revisi</option>
                      <option value="disetujui">Disetujui</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Ringkasan Perkembangan Kemajuan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={ringkasanKemajuan}
                  onChange={(e) => setRingkasanKemajuan(e.target.value)}
                  placeholder="Contoh: Mahasiswa telah menyelesaikan 3 ulangan analisis proksimat dan mulai asistensi Bab IV..."
                  className="w-full text-xs sm:text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-unand-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Hambatan Utama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={hambatanUtama}
                    onChange={(e) => setHambatanUtama(e.target.value)}
                    placeholder="Contoh: Reagen ekstraksi di lab sedang habis, atau naskah Bab IV belum diserahkan..."
                    className="w-full text-xs sm:text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-unand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tindakan Berikutnya <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={tindakanBerikutnya}
                    onChange={(e) => setTindakanBerikutnya(e.target.value)}
                    placeholder="Contoh: Mahasiswa menyerahkan perbaikan tabel Bab IV pekan depan..."
                    className="w-full text-xs sm:text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-unand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Penanggung Jawab Tindakan
                  </label>
                  <input
                    type="text"
                    value={penanggungJawabTindakan}
                    onChange={(e) => setPenanggungJawabTindakan(e.target.value)}
                    placeholder="Mahasiswa / Dosen Pembimbing / Tim Lab"
                    className="w-full text-xs sm:text-sm border rounded-lg p-2 focus:ring-2 focus:ring-unand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Target Tindak Lanjut
                  </label>
                  <input
                    type="date"
                    value={targetTindakLanjut}
                    onChange={(e) => setTargetTindakLanjut(e.target.value)}
                    className="w-full text-xs sm:text-sm border rounded-lg p-2 focus:ring-2 focus:ring-unand-500"
                  />
                </div>
              </div>

              {/* Bantuan Prodi Toggle */}
              <div className="border border-red-200 bg-red-50/50 rounded-xl p-3.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kebutuhanBantuanProdi}
                    onChange={(e) => setKebutuhanBantuanProdi(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-red-300"
                  />
                  <span className="text-xs font-bold text-red-900">
                    Memerlukan Bantuan / Intervensi Program Studi (misal: fasilitas lab, klinik skripsi, kendala komisi pembimbing)
                  </span>
                </label>

                {kebutuhanBantuanProdi && (
                  <div className="mt-2.5 pl-6">
                    <textarea
                      rows={2}
                      value={kebutuhanBantuanCatatan}
                      onChange={(e) => setKebutuhanBantuanCatatan(e.target.value)}
                      placeholder="Jelaskan bentuk dukungan spesifik yang diharapkan dari pimpinan/tim pemantauan prodi..."
                      className="w-full text-xs border border-red-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                Pencatatan waktu otomatis: Asia/Jakarta (WIB)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Menyimpan...' : 'Simpan Laporan Kemajuan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Concurrency Conflict Resolution Dialog */}
      {conflictData && (
        <ConflictModal
          isOpen={!!conflictData}
          onClose={() => setConflictData(null)}
          conflictData={conflictData}
          onReload={() => {
            setConflictData(null);
            onClose();
            if (onReloadStudent) onReloadStudent();
          }}
        />
      )}

      {/* Sub-modal "Belum Ada Perubahan" */}
      {showNoChangeModal && (
        <NoChangeModal
          isOpen={showNoChangeModal}
          onClose={() => setShowNoChangeModal(false)}
          student={student}
          onSuccess={(res) => {
            setShowNoChangeModal(false);
            onSuccess(res);
            onClose();
          }}
        />
      )}
    </>
  );
}
