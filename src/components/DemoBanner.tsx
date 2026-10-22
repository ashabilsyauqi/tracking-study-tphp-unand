'use client';

import React, { useState } from 'react';
import { AlertCircle, RotateCcw, Trash2, CheckCircle, ShieldCheck } from 'lucide-react';

interface Props {
  demoCount?: number;
  onRefresh?: () => void;
}

export default function DemoBanner({ demoCount = 30, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm('Reset ulang data 30 mahasiswa demonstrasi sesuai skenario awal pengujian?')) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/demo/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(data.message || 'Data demonstrasi berhasil direset.');
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Gagal mereset data demo.');
      }
    } catch (e: any) {
      alert(e.message || 'Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('PERINGATAN: Hapus seluruh data mahasiswa demonstrasi? Hanya data operasional riil yang akan dipertahankan.')) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/demo/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(data.message || 'Data demo dibersihkan.');
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Gagal membersihkan data demo.');
      }
    } catch (e: any) {
      alert(e.message || 'Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 border-b border-amber-600 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-black text-amber-300 font-bold px-2 py-0.5 rounded text-xs tracking-wider uppercase">
          <AlertCircle className="w-3.5 h-3.5" />
          Mode Data Demonstrasi
        </span>
        <span className="hidden sm:inline text-amber-950">
          Sistem sedang memuat <strong>{demoCount} data mahasiswa fiktif</strong> untuk uji coba alur (Angkatan 2019–2022, berbagai tahapan & hambatan).
        </span>
      </div>

      <div className="flex items-center gap-2">
        {msg && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-950 bg-amber-300 px-2 py-0.5 rounded">
            <CheckCircle className="w-3 h-3 text-emerald-800" /> {msg}
          </span>
        )}
        <button
          onClick={handleReset}
          disabled={loading}
          className="inline-flex items-center gap-1 bg-amber-900 text-amber-100 hover:bg-black px-2.5 py-1 rounded text-xs transition"
          title="Reset ulang 30 mahasiswa demo"
        >
          <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Reset Demo
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          className="inline-flex items-center gap-1 bg-amber-800/80 text-white hover:bg-red-800 px-2.5 py-1 rounded text-xs transition"
          title="Bersihkan data fiktif untuk beralih ke data operasional"
        >
          <Trash2 className="w-3 h-3" />
          Bersihkan
        </button>
      </div>
    </div>
  );
}
