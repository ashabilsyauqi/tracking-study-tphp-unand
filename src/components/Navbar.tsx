'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  LogOut,
  User,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Shield,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import NotificationModal from './NotificationModal';

interface Props {
  user: any;
  onUserSwitch?: (newUser: any) => void;
}

export default function Navbar({ user, onUserSwitch }: Props) {
  const router = useRouter();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [lecturersList, setLecturersList] = useState<any[]>([]);

  const fetchUnread = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) setUnreadCount(data.unreadCount || 0);
    } catch (e) {}
  };

  const fetchLecturers = async () => {
    try {
      const res = await fetch('/api/dosen');
      const data = await res.json();
      if (res.ok) setLecturersList(data.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUnread();
    fetchLecturers();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {}
  };

  const switchAccount = async (role: string, userId?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickLoginRole: role,
          quickLoginUserId: userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowRoleSwitcher(false);
        if (onUserSwitch) onUserSwitch(data.user);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <header className="bg-unand-950 text-white border-b border-unand-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-unand-700 to-unand-900 border border-gold-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-gold-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  TPHP StudyTrack
                </span>
                <span className="bg-gold-500/20 text-gold-300 border border-gold-400/40 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  UNAND
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden md:block">
                Teknologi Pangan dan Hasil Pertanian &bull; Fateta Unand
              </p>
            </div>
          </Link>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher for Testing (Section 16: Pengujian alur peran) */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="inline-flex items-center gap-1.5 bg-unand-900 hover:bg-unand-800 text-gold-200 border border-unand-700 text-xs px-2.5 py-1.5 rounded-lg transition"
                title="Ganti Peran Pengguna Cepat (Mode Demonstrasi & Pengujian)"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span className="hidden sm:inline font-medium">Uji Peran:</span>
                <span className="font-bold underline uppercase">{user?.role || 'LOGIN'}</span>
                <ChevronDown className="w-3 h-3 text-gold-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 border-b font-bold text-slate-900 flex items-center justify-between">
                    <span>Ganti Akun Demo / Uji Alur:</span>
                    <span className="text-[10px] text-slate-400">1-Klik Switch</span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => switchAccount('ADMIN')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">1. Administrator / Operator Prodi</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">ADMIN</span>
                    </button>
                    <button
                      onClick={() => switchAccount('KAPRODI')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">2. Ketua Prodi / Tim Pemantauan</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">KAPRODI</span>
                    </button>
                  </div>

                  <div className="px-3 pt-2 pb-1 border-t text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Dosen Pembimbing (20 Dosen Master):
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1 divide-y divide-slate-100">
                    {lecturersList.map((lec) => (
                      <button
                        key={lec.id}
                        onClick={() => switchAccount('DOSEN', lec.id)}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 flex items-center justify-between text-slate-700"
                      >
                        <span className="truncate pr-2">{lec.namaGelar}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {lec.totalBeban ?? 0} Mhs
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panduan Penggunaan Button */}
            <Link
              href="/panduan"
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-200 hover:text-white hover:bg-unand-900 rounded-lg transition flex items-center gap-1.5 text-xs border border-transparent hover:border-unand-700"
              title="Buku Panduan Penggunaan TPHP StudyTrack"
            >
              <HelpCircle className="w-4 h-4 text-gold-300" />
              <span className="hidden sm:inline font-semibold text-slate-200">Panduan</span>
            </Link>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className="relative p-2 text-slate-200 hover:text-white hover:bg-unand-900 rounded-lg transition"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-unand-800">
              <div className="w-8 h-8 rounded-full bg-unand-800 border border-gold-400/50 flex items-center justify-center text-gold-300 font-bold text-xs uppercase">
                {user?.name ? user.name.slice(0, 2) : 'US'}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-white block max-w-[140px] truncate">
                  {user?.name || 'Pengguna'}
                </span>
                <span className="text-[10px] text-emerald-300 block uppercase tracking-wide">
                  {user?.role === 'ADMIN'
                    ? 'Operator Prodi'
                    : user?.role === 'KAPRODI'
                    ? 'Ketua / Tim Pantau'
                    : 'Dosen Pembimbing'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-300 hover:text-red-300 hover:bg-unand-900 rounded-lg transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNotificationRead={fetchUnread}
      />
    </>
  );
}
