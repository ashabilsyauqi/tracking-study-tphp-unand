'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Lock,
  User,
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setError('Mohon masukkan nama pengguna dan kata sandi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: string, userUname: string, pass: string) => {
    setUsername(userUname);
    setPassword(pass);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userUname, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-unand-950 via-unand-900 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Unand Emblem / Branding Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-unand-800 to-unand-700 border-2 border-gold-400 shadow-xl mb-3">
          <GraduationCap className="w-9 h-9 text-gold-300" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          TPHP StudyTrack
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-emerald-200 font-medium">
          Sistem Informasi Pemantauan Studi Mahasiswa Tingkat Akhir
        </p>
        <p className="text-[11px] text-slate-400">
          Program Studi Teknologi Pangan dan Hasil Pertanian &bull; FATETA Universitas Andalas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-100 sm:px-10">
          {/* Foto Kegiatan FATETA Unand */}
          <div className="mb-5 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-50 group">
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img
                src="/beranda-kegiatan.jpg"
                alt="Fakultas Teknologi Pertanian Unand"
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 bg-slate-950/75 text-gold-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                  <GraduationCap className="w-3 h-3 text-gold-300" />
                  FATETA UNAND
                </span>
              </div>
            </div>
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-medium truncate">TPHP go Global to Prince of Songkla University, Thailand</span>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">Thailand</span>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pengguna / NIP / Email
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / kaprodi / aisman"
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-unand-800 focus:border-unand-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-unand-800 focus:border-unand-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs sm:text-sm font-semibold text-white bg-unand-800 hover:bg-unand-900 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-unand-700 transition"
            >
              <span>{loading ? 'Memeriksa kredensial...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Role Switcher for Verification & Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              <span>Akses Cepat Pengujian Alur (Demo Mode):</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Klik salah satu peran di bawah ini untuk langsung masuk dan menguji sistem:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN', 'admin', 'admin123')}
                className="w-full text-left p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-emerald-950 block">Operator / Administrator Prodi</span>
                  <span className="text-[10px] text-emerald-700">Kelola master data, impor data, atur ambang batas</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('KAPRODI', 'kaprodi', 'kaprodi123')}
                className="w-full text-left p-2.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-blue-950 block">Ketua Prodi / Tim Pemantauan</span>
                  <span className="text-[10px] text-blue-700">Lihat seluruh dashboard, tindak lanjut & bahan rapat evaluasi</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
                  kaprodi
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('DOSEN', 'aisman', 'dosen123')}
                className="w-full text-left p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-amber-950 block">Dosen: Prof. Dr. Aisman</span>
                  <span className="text-[10px] text-amber-800">Uji pelaporan cepat 1 menit & "Belum ada perubahan"</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  aisman
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('DOSEN', 'ismed', 'dosen123')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">Dosen: Dr. Ismed</span>
                  <span className="text-[10px] text-slate-500">Uji sudut pandang pembimbing pendamping</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  ismed
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Hak akses diterapkan ketat pada server dan database &bull; Zona Waktu Asia/Jakarta
        </p>
      </div>
    </div>
  );
}
