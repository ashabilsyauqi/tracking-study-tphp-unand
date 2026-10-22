'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Send,
  ListTodo,
  FileSpreadsheet,
  GraduationCap,
  Settings,
  ChevronRight,
  ClipboardList,
  BookOpen,
} from 'lucide-react';

interface Props {
  userRole: 'ADMIN' | 'KAPRODI' | 'DOSEN' | string;
}

export default function Sidebar({ userRole }: Props) {
  const pathname = usePathname();

  // 8 Main Menus strictly as specified in Section 14
  const menuItems = [
    {
      title: '1. Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'KAPRODI', 'DOSEN'],
    },
    {
      title: '2. Mahasiswa',
      href: '/mahasiswa',
      icon: Users,
      roles: ['ADMIN', 'KAPRODI'], // Dosen accesses via Mahasiswa Bimbingan Saya or can view
    },
    {
      title: '3. Mahasiswa Bimbingan Saya',
      href: '/bimbingan',
      icon: UserCheck,
      roles: ['DOSEN', 'ADMIN', 'KAPRODI'],
      highlight: userRole === 'DOSEN',
    },
    {
      title: '4. Pelaporan Kemajuan',
      href: '/pelaporan',
      icon: Send,
      roles: ['DOSEN', 'ADMIN', 'KAPRODI'],
    },
    {
      title: '5. Tindak Lanjut',
      href: '/tindak-lanjut',
      icon: ListTodo,
      roles: ['ADMIN', 'KAPRODI', 'DOSEN'],
    },
    {
      title: '6. Laporan & Ekspor',
      href: '/laporan',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'KAPRODI', 'DOSEN'],
    },
    {
      title: '7. Data Dosen',
      href: '/dosen',
      icon: GraduationCap,
      roles: ['ADMIN', 'KAPRODI'],
    },
    {
      title: '8. Pengaturan',
      href: '/pengaturan',
      icon: Settings,
      roles: ['ADMIN'], // Only Administrator
    },
    {
      title: '9. Panduan Penggunaan',
      href: '/panduan',
      icon: BookOpen,
      roles: ['ADMIN', 'KAPRODI', 'DOSEN'],
    },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col shrink-0">
      {/* Role Context Pill */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
          Akses Menu Berdasarkan Peran:
        </span>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800">
            {userRole === 'ADMIN'
              ? 'Administrator / Operator'
              : userRole === 'KAPRODI'
              ? 'Ketua / Tim Pemantau'
              : 'Dosen Pembimbing'}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              userRole === 'ADMIN'
                ? 'bg-emerald-100 text-emerald-800'
                : userRole === 'KAPRODI'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {userRole}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-unand-900 text-white shadow-xs font-semibold'
                  : item.highlight
                  ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-gold-300'
                      : item.highlight
                      ? 'text-amber-700'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span>{item.title}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-gold-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Program Studi Info Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-700">Prodi TPHP FATETA</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Universitas Andalas, Padang</p>
        <p className="text-[10px] text-emerald-700 mt-1 font-mono">v1.0 &bull; Database Aktif</p>
      </div>
    </aside>
  );
}
