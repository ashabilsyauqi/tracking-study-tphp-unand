'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    nim: string;
    nama: string;
    version: number;
    tglKemajuanSubstantif?: string | null;
  };
  onSuccess: (result: any) => void;
}

export default function NoChangeModal({ isOpen, onClose, student, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Alasan singkat mengapa belum ada kemajuan wajib diisi.');
      return;
    }
    if (!nextPlan.trim()) {
      setError('Rencana tindakan berikutnya wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${student.id}/no-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noChangeReason: reason.trim(),
          noChangeNextPlan: nextPlan.trim(),
          expectedVersion: student.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan status pelaporan.');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Konfirmasi Belum Ada Perubahan</h3>
              <p className="text-xs text-amber-100">{student.nama} ({student.nim})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 leading-relaxed">
            <strong>Catatan Kebijakan:</strong> Tindakan ini memperbarui <strong>tanggal pelaporan</strong> terakhir Anda hari ini, tanpa memajukan <strong>tanggal kemajuan substantif</strong> ({student.tglKemajuanSubstantif || 'Belum ada'}). Hal ini memastikan prodi mengetahui mahasiswa tetap terpantau aktif.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan Singkat Belum Ada Perubahan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Mahasiswa sedang menunggu antrian pengujian lab, atau sedang fokus revisi Bab IV..."
              className="w-full text-xs sm:text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rencana Tindakan Berikutnya <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={nextPlan}
              onChange={(e) => setNextPlan(e.target.value)}
              placeholder="Contoh: Bimbingan tatap muka dijadwalkan hari Rabu pekan depan untuk reviu grafik hasil..."
              className="w-full text-xs sm:text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-700 text-white rounded-lg text-xs font-medium hover:bg-amber-800 transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Status Pelaporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
