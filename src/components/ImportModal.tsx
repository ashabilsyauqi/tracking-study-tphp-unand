'use client';

import React, { useState } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: Props) {
  if (!isOpen) return null;

  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Template download helper (Section 12 requirement: Template impor Excel/CSV dengan kolom minimum)
  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      'NIM',
      'Nama',
      'Angkatan',
      'Status Akademik',
      'Semester Studi',
      'Pembimbing Utama',
      'Pembimbing Pendamping',
      'Judul',
      'Target Selesai',
    ];

    const sampleRows = [
      [
        '2111124001',
        'Contoh Mahasiswa 1',
        2021,
        'aktif',
        8,
        'Prof. Dr. Aisman',
        'Dr. Ismed',
        'Studi Komparasi Karakteristik Fisikokimia Ekstrak Gambir',
        '2025-06-30',
      ],
      [
        '2111124002',
        'Contoh Mahasiswa 2',
        2021,
        'aktif',
        8,
        'Prof. Dr. Novizar Nazir',
        'Wellyalina',
        'Optimasi Ekstraksi Pektin Kulit Buah Lokal',
        '2025-07-15',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Mahasiswa');

    if (format === 'csv') {
      XLSX.writeFile(wb, 'Template_Impor_Mahasiswa_TPHP.csv', { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, 'Template_Impor_Mahasiswa_TPHP.xlsx', { bookType: 'xlsx' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          throw new Error('Berkas kosong atau format tidak sesuai.');
        }

        setParsedRows(data);

        // Call API for validation preview
        const res = await fetch('/api/students/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'preview', rows: data }),
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Gagal memvalidasi data impor.');

        setPreviewData(resData);
        setStep('preview');
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal membaca berkas Excel/CSV.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.preview) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'commit',
          rows: previewData.preview,
          overwriteExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses impor.');

      setImportResult(data);
      setStep('result');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-unand-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-gold-400" />
            <div>
              <h3 className="font-bold text-base text-white">Impor Data Mahasiswa (Excel / CSV)</h3>
              <p className="text-xs text-slate-300">Validasi duplikat, pencocokan 20 master dosen, dan konfirmasi timpa data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template Download Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Unduh Template Standar:</span>
                  <span className="text-slate-500">
                    Kolom: NIM, Nama, Angkatan, Status Akademik, Semester Studi, Pembimbing Utama, Pembimbing Pendamping, Judul, Target Selesai
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadTemplate('xlsx')}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    Unduh Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    Unduh CSV (.csv)
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-unand-600 rounded-2xl p-10 text-center transition bg-slate-50/50">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm">Pilih berkas Excel atau CSV untuk diunggah</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Format yang didukung: .xlsx, .xls, .csv. Sistem akan menampilkan pratinjau dan verifikasi sebelum disimpan.
                </p>

                <div className="mt-5">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-unand-800 hover:bg-unand-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{loading ? 'Membaca berkas...' : 'Pilih Berkas Komputer'}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-slate-500 block">Total Baris:</span>
                  <span className="text-lg font-bold text-slate-800">{previewData.summary.totalRows} Data</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-700 block">Data Valid / Siap Impor:</span>
                  <span className="text-lg font-bold text-emerald-900">{previewData.summary.validCount} Data</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-blue-700 block">NIM Sudah Terdaftar:</span>
                  <span className="text-lg font-bold text-blue-900">{previewData.summary.existingCount} Data</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-red-700 block">Baris Bermasalah:</span>
                  <span className="text-lg font-bold text-red-900">{previewData.summary.errorCount} Data</span>
                </div>
              </div>

              {/* Confirmation Overwrite Checkbox (Section 12: Jangan menimpa data tanpa konfirmasi) */}
              {previewData.summary.existingCount > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 mt-0.5"
                    />
                    <div>
                      <strong className="block font-semibold">Konfirmasi Pembaruan NIM Yang Sudah Ada:</strong>
                      <span>
                        Ditemukan {previewData.summary.existingCount} data dengan NIM yang sudah ada di sistem. Centang kotak ini jika Anda setuju memperbarui data administratif mereka dengan data dari berkas impor. (Jika tidak dicentang, data lama akan dipertahankan/dilewati).
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b">
                      <tr>
                        <th className="py-2 px-2.5">No</th>
                        <th className="py-2 px-2.5">NIM & Nama</th>
                        <th className="py-2 px-2.5">Angkatan</th>
                        <th className="py-2 px-2.5">Pembimbing Utama</th>
                        <th className="py-2 px-2.5">Pembimbing Pendamping</th>
                        <th className="py-2 px-2.5">Status Validasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.preview.map((r: any, idx: number) => (
                        <tr
                          key={idx}
                          className={r.hasErrors ? 'bg-red-50/70' : r.isExistingInDb ? 'bg-amber-50/40' : 'hover:bg-slate-50'}
                        >
                          <td className="py-2 px-2.5 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-2.5">
                            <span className="font-bold text-slate-900 block">{r.nama || '-'}</span>
                            <span className="font-mono text-slate-500">{r.nim || '-'}</span>
                          </td>
                          <td className="py-2 px-2.5">{r.angkatan || '-'}</td>
                          <td className="py-2 px-2.5">
                            <span className={r.matchedUtamaId ? 'text-slate-800' : 'text-slate-400'}>
                              {r.matchedUtamaNama}
                            </span>
                          </td>
                          <td className="py-2 px-2.5">
                            <span className={r.matchedPendampingId ? 'text-slate-800' : 'text-slate-400'}>
                              {r.matchedPendampingNama}
                            </span>
                          </td>
                          <td className="py-2 px-2.5">
                            {r.hasErrors ? (
                              <span className="text-red-700 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> {r.errors.join(', ')}
                              </span>
                            ) : r.isExistingInDb ? (
                              <span className="text-amber-800 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> NIM Sudah Ada
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  &larr; Pilih Berkas Lain
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={loading || previewData.summary.validCount === 0}
                  className="px-5 py-2.5 bg-unand-800 hover:bg-unand-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? 'Memproses Impor...' : `Konfirmasi & Impor Data`}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Impor Data Mahasiswa Berhasil!</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {importResult.message}
              </p>

              <div className="flex justify-center gap-2 pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-unand-800 text-white rounded-xl text-xs font-semibold hover:bg-unand-900 transition"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
