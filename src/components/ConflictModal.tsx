'use client';

import React from 'react';
import { AlertTriangle, X, RefreshCw, Eye } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conflictData: any;
  onReload: () => void;
}

export default function ConflictModal({ isOpen, onClose, conflictData, onReload }: Props) {
  if (!isOpen || !conflictData) return null;

  const latest = conflictData.latestReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-200 animate-bounce" />
            <h3 className="font-bold text-base">Peringatan Konflik Data Bersamaan</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-700">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 leading-relaxed">
            Data mahasiswa ini telah diperbarui oleh pengguna lain (misalnya pembimbing pendamping atau administrator prodi) sesaat sebelum Anda menekan tombol simpan. Sistem mencegah perubahan Anda menimpa data terbaru secara diam-diam.
          </div>

          {latest && (
            <div className="bg-slate-50 border rounded-lg p-3.5 space-y-2">
              <div className="font-semibold text-slate-900 border-b pb-1 flex items-center justify-between text-xs">
                <span>Perubahan Terbaru Yang Masuk:</span>
                <span className="text-slate-500 font-normal">{latest.tglLaporan}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Oleh:</span>
                  <span className="font-medium text-slate-800">{latest.reporterName} ({latest.reporterRole})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ringkasan:</span>
                  <span className="font-medium text-slate-800">{latest.ringkasan || '-'}</span>
                </div>
              </div>
              {latest.hambatan && (
                <div className="text-xs pt-1 border-t">
                  <span className="text-slate-400 block">Hambatan yang dicatat:</span>
                  <span className="text-slate-800">{latest.hambatan}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-slate-600">
            Silakan muat ulang data terbaru terlebih dahulu untuk melihat catatan rekan pembimbing, lalu simpan kembali penyesuaian Anda dengan aman.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
          >
            Tutup & Tinjau Draf Saya
          </button>
          <button
            onClick={onReload}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang Data Terbaru
          </button>
        </div>
      </div>
    </div>
  );
}
