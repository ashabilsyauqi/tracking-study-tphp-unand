'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import {
  Settings,
  Bell,
  Shield,
  Database,
  History,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  MessageSquare,
  Mail,
  Sliders,
  Image,
} from 'lucide-react';

export default function PengaturanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [demoCount, setDemoCount] = useState(0);

  // Active settings state
  const [reminderReportDays, setReminderReportDays] = useState('30');
  const [reminderSubstantiveDays, setReminderSubstantiveDays] = useState('60');
  const [studyPeriodThreshold, setStudyPeriodThreshold] = useState('8');
  const [semesterActive, setSemesterActive] = useState('2024/2025 Genap');
  const [semesterType, setSemesterType] = useState('genap');
  const [currentYear, setCurrentYear] = useState('2025');
  const [appLogoUrl, setAppLogoUrl] = useState('');

  // WhatsApp & Email configurations
  const [waEnabled, setWaEnabled] = useState(false);
  const [waGatewayUrl, setWaGatewayUrl] = useState('');
  const [waApiKey, setWaApiKey] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      if (userData.user.role !== 'ADMIN' && userData.user.role !== 'KAPRODI') {
        router.push('/dashboard');
        return;
      }
      setCurrentUser(userData.user);

      const res = await fetch('/api/settings');
      const data = await res.json();
      const map = data.data || {};

      setReminderReportDays(map['reminder_report_days'] || '30');
      setReminderSubstantiveDays(map['reminder_substantive_days'] || '60');
      setStudyPeriodThreshold(map['study_period_semester_threshold'] || '8');
      setSemesterActive(map['semester_active'] || '2024/2025 Genap');
      setSemesterType(map['semester_type'] || 'genap');
      setCurrentYear(map['current_calendar_year'] || '2025');
      setAppLogoUrl(map['app_logo_url'] || '');
      setWaEnabled(map['wa_integration_enabled'] === 'true');
      setWaGatewayUrl(map['wa_gateway_url'] || '');
      setWaApiKey(map['wa_api_key'] || '');
      setEmailEnabled(map['email_integration_enabled'] === 'true');
      setSmtpHost(map['smtp_host'] || '');

      // Load audit logs
      const logRes = await fetch('/api/audit-log?limit=40');
      const logData = await logRes.json();
      setAuditLogs(logData.data || []);

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
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        settings: {
          reminder_report_days: reminderReportDays,
          reminder_substantive_days: reminderSubstantiveDays,
          study_period_semester_threshold: studyPeriodThreshold,
          semester_active: semesterActive,
          semester_type: semesterType,
          current_calendar_year: currentYear,
          app_logo_url: appLogoUrl,
          wa_integration_enabled: String(waEnabled),
          wa_gateway_url: waGatewayUrl,
          wa_api_key: waApiKey,
          email_integration_enabled: String(emailEnabled),
          smtp_host: smtpHost,
        },
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gagal menyimpan pengaturan.');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      fetchSettings();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/settings/backup', '_blank');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('PERINGATAN: Memulihkan database cadangan akan menggabungkan/memperbarui data master dan mahasiswa saat ini. Lanjutkan?')) {
      return;
    }

    setRestoreLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        const res = await fetch('/api/settings/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupContent: parsed }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memulihkan cadangan.');

        alert('Pemulihan database berhasil diselesaikan!');
        fetchSettings();
      } catch (err: any) {
        alert(err.message || 'Gagal membaca berkas cadangan JSON.');
      } finally {
        setRestoreLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchSettings} />}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pengaturan Sistem & Administrasi Prodi
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi ambang peringatan, aturan semester, integrasi notifikasi, pencadangan database, dan log audit.
              </p>
            </div>

            {saveSuccess && (
              <div className="px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Pengaturan berhasil disimpan!
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Group 1: Ambang Peringatan & Prioritas Pendampingan (Section 9) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Sliders className="w-5 h-5 text-unand-800" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Aturan Awal Ambang Peringatan & Prioritas Pendampingan
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Angka berikut adalah pengaturan awal aplikasi yang dapat disesuaikan prodi, bukan ketentuan akademik resmi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Batas Pengingat Laporan (Hari) *
                  </label>
                  <input
                    type="number"
                    required
                    min={7}
                    max={180}
                    value={reminderReportDays}
                    onChange={(e) => setReminderReportDays(e.target.value)}
                    className="w-full border rounded-lg p-2 font-mono text-slate-800 focus:ring-2 focus:ring-unand-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Penanda "Perlu Pembaruan Laporan" jika belum ada pelaporan dari dosen &gt; {reminderReportDays} hari.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Batas Perlu Ditinjau / Substantif (Hari) *
                  </label>
                  <input
                    type="number"
                    required
                    min={14}
                    max={365}
                    value={reminderSubstantiveDays}
                    onChange={(e) => setReminderSubstantiveDays(e.target.value)}
                    className="w-full border rounded-lg p-2 font-mono text-slate-800 focus:ring-2 focus:ring-unand-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Penanda "Perlu Perhatian" jika belum ada kemajuan substantif &gt; {reminderSubstantiveDays} hari.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ambang Batas Masa Studi (Semester) *
                  </label>
                  <input
                    type="number"
                    required
                    min={6}
                    max={14}
                    value={studyPeriodThreshold}
                    onChange={(e) => setStudyPeriodThreshold(e.target.value)}
                    className="w-full border rounded-lg p-2 font-mono text-slate-800 focus:ring-2 focus:ring-unand-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Mahasiswa aktif semester &gt;= {studyPeriodThreshold} otomatis menerima perhatian masa studi intensif.
                  </span>
                </div>
              </div>
            </div>

            {/* Group 2: Tahun Akademik & Aturan Semester */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Settings className="w-5 h-5 text-unand-800" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Tahun Akademik & Rumus Semester Berjalan
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dasar perhitungan otomatis semester studi dan perlakuan cuti akademik mahasiswa.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester & Tahun Akademik Aktif</label>
                  <input
                    type="text"
                    value={semesterActive}
                    onChange={(e) => setSemesterActive(e.target.value)}
                    className="w-full border rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Semester Berjalan</label>
                  <select
                    value={semesterType}
                    onChange={(e) => setSemesterType(e.target.value)}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="genap">Genap</option>
                    <option value="ganjil">Ganjil</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Kalender Aktif</label>
                  <input
                    type="number"
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    className="w-full border rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl text-xs text-slate-600">
                <strong>Rumus Transparan:</strong> Semester = ((Tahun Kalender Aktif - Angkatan) &times; 2 {semesterType === 'genap' ? '+ 0' : '- 1'}) - Jumlah Semester Cuti. Administrator tetap dapat memverifikasi atau mengisi secara manual per mahasiswa.
              </div>
            </div>

            {/* Group 3: Logo Instansi Resmi (Section 14) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Image className="w-5 h-5 text-unand-800" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Logo Resmi Program Studi & Universitas
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sediakan URL atau tautan logo resmi Universitas Andalas / Fakultas Teknologi Pertanian.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Logo Resmi (Opsional)</label>
                  <input
                    type="text"
                    value={appLogoUrl}
                    onChange={(e) => setAppLogoUrl(e.target.value)}
                    placeholder="https://unand.ac.id/images/logo.png"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border">
                  <div className="w-10 h-10 rounded-lg bg-unand-900 text-gold-300 font-bold flex items-center justify-center text-sm">
                    UNAND
                  </div>
                  <span className="text-xs text-slate-500">
                    Logo default Universitas Andalas (Hijau Tua & Emas) aktif di bilah navigasi.
                  </span>
                </div>
              </div>
            </div>

            {/* Group 4: Integrasi Notifikasi Eksternal (WhatsApp & Email - Section 13) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Pengaturan Integrasi Eksternal (WhatsApp & Email Gateway)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kepatuhan Section 13: "Siapkan integrasi email atau WhatsApp sebagai pengembangan opsional. Jangan menampilkan keberhasilan pengiriman jika integrasinya belum terpasang."
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* WhatsApp */}
                <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" /> Integrasi WhatsApp Gateway
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${waEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {waEnabled ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waEnabled}
                      onChange={(e) => setWaEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700"
                    />
                    <span className="font-medium text-slate-700">Aktifkan Pengiriman WhatsApp</span>
                  </label>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">API Endpoint Gateway:</label>
                    <input
                      type="text"
                      disabled={!waEnabled}
                      value={waGatewayUrl}
                      onChange={(e) => setWaGatewayUrl(e.target.value)}
                      placeholder="https://api.fonnte.com/send"
                      className="w-full border rounded p-1.5 bg-white disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">API Key / Token:</label>
                    <input
                      type="password"
                      disabled={!waEnabled}
                      value={waApiKey}
                      onChange={(e) => setWaApiKey(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full border rounded p-1.5 bg-white disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-blue-600" /> Integrasi Email SMTP
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${emailEnabled ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                      {emailEnabled ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-700"
                    />
                    <span className="font-medium text-slate-700">Aktifkan Pengiriman Email</span>
                  </label>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Server SMTP Host:</label>
                    <input
                      type="text"
                      disabled={!emailEnabled}
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.unand.ac.id"
                      className="w-full border rounded p-1.5 bg-white disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button for Settings */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-unand-800 hover:bg-unand-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan Pengaturan...' : 'Simpan Seluruh Pengaturan'}
              </button>
            </div>
          </form>

          {/* Group 5: Pencadangan & Pemulihan Database (Section 15) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Database className="w-5 h-5 text-unand-800" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Prosedur Pencadangan & Pemulihan Database (Backup & Restore)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Unduh snapshot persisten seluruh skema, data dosen, mahasiswa, tahapan, dan riwayat laporan dalam format JSON standar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Backup Card */}
              <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl space-y-3">
                <span className="font-bold text-emerald-950 text-sm block">1. Unduh Cadangan Sistem (Backup)</span>
                <p className="text-slate-600 leading-relaxed">
                  Menghasilkan berkas cadangan JSON lengkap berformat aman yang mencakup seluruh mahasiswa, dosen, laporan dosen, dan pengaturan prodi.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Unduh Berkas Cadangan (.json)
                </button>
              </div>

              {/* Restore Card */}
              <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl space-y-3">
                <span className="font-bold text-amber-950 text-sm block">2. Pulihkan Cadangan (Restore)</span>
                <p className="text-slate-600 leading-relaxed">
                  Unggah berkas cadangan JSON yang telah diunduh sebelumnya untuk mengembalikan keadaan data sistem.
                </p>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-semibold transition shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>{restoreLoading ? 'Memulihkan data...' : 'Pilih Berkas Cadangan (.json)'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFile}
                      className="hidden"
                      disabled={restoreLoading}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Group 6: Audit Log Viewer (Section 15) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-unand-800" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Log Audit & Riwayat Perubahan Administratif (Audit Trail)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    "Setiap perubahan penting memiliki pelaku, waktu, dan riwayat."
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {auditLogs.length} Catatan Terakhir
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Waktu (WIB)</th>
                    <th className="py-2 px-3">Pelaku</th>
                    <th className="py-2 px-3">Aksi</th>
                    <th className="py-2 px-3">Entitas</th>
                    <th className="py-2 px-3">Rincian Perubahan</th>
                    <th className="py-2 px-3">Alasan Tercatat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-400">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-semibold text-slate-900">
                        {log.userName} ({log.userRole})
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-unand-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-600">
                        {log.entity}
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate" title={log.details || ''}>
                        {log.details || '-'}
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate text-amber-900" title={log.alasanPerubahan || ''}>
                        {log.alasanPerubahan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
