'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DemoBanner from '@/components/DemoBanner';
import {
  GraduationCap,
  Users,
  Search,
  Plus,
  Edit,
  Mail,
  Phone,
  CheckCircle,
  X,
  ExternalLink,
} from 'lucide-react';

export default function DosenPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [demoCount, setDemoCount] = useState(0);

  // Edit / Add modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<any>(null);
  const [namaGelar, setNamaGelar] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [bidangKeahlian, setBidangKeahlian] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      const res = await fetch('/api/dosen');
      const data = await res.json();
      setLecturers(data.data || []);

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
    fetchData();
  }, []);

  const openEdit = (lec: any) => {
    setSelectedLecturer(lec);
    setNamaGelar(lec.namaGelar);
    setNip(lec.nip || '');
    setEmail(lec.email || '');
    setNoHp(lec.noHp || '');
    setBidangKeahlian(lec.bidangKeahlian || '');
    setShowEditModal(true);
  };

  const openAdd = () => {
    setSelectedLecturer(null);
    setNamaGelar('');
    setNip('');
    setEmail('');
    setNoHp('');
    setBidangKeahlian('');
    setShowEditModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const method = selectedLecturer ? 'PUT' : 'POST';
      const body: any = {
        namaGelar: namaGelar.trim(),
        nip: nip.trim() || null,
        email: email.trim() || null,
        noHp: noHp.trim() || null,
        bidangKeahlian: bidangKeahlian.trim() || null,
      };
      if (selectedLecturer) body.id = selectedLecturer.id;

      const res = await fetch('/api/dosen', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan dosen.');

      setShowEditModal(false);
      fetchData();
      alert(`Data dosen ${data.data.namaGelar} berhasil disimpan.`);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setModalLoading(false);
    }
  };

  const filtered = lecturers.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.namaGelar.toLowerCase().includes(term) ||
      (l.nip && l.nip.includes(term)) ||
      (l.email && l.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onUserSwitch={(u) => setCurrentUser(u)} />
      {demoCount > 0 && <DemoBanner demoCount={demoCount} onRefresh={fetchData} />}

      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role || 'DOSEN'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Data Dosen Pembimbing Skripsi
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar 20 dosen pembimbing master program studi TPHP Fateta Unand beserta beban pembimbingan terkini.
              </p>
            </div>

            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'KAPRODI') && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Tambah Dosen Baru
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari dosen berdasarkan nama lengkap, gelar, atau NIP..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-unand-800"
              />
            </div>
            <span className="text-slate-400">
              Total: <strong>{filtered.length} Dosen</strong>
            </span>
          </div>

          {/* Lecturers Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Dosen & Gelar Resmi</th>
                    <th className="py-3 px-4">NIP / Identitas</th>
                    <th className="py-3 px-4">Kontak (Email / No. HP)</th>
                    <th className="py-3 px-4 text-center">Bimbingan Utama</th>
                    <th className="py-3 px-4 text-center">Bimbingan Pendamping</th>
                    <th className="py-3 px-4 text-center">Total Beban</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((lec, idx) => (
                    <tr key={lec.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block text-sm">
                          {lec.namaGelar}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ID: <span className="font-mono">{lec.id}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {lec.nip || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{lec.email || '-'}</div>
                        <div className="text-[11px] text-slate-400">{lec.noHp || ''}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/mahasiswa?dosenId=${lec.id}`}
                          className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-xs hover:underline"
                        >
                          {lec.totalBimbinganUtama || 0} Mhs
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/mahasiswa?dosenId=${lec.id}`}
                          className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 text-xs hover:underline"
                        >
                          {lec.totalBimbinganPendamping || 0} Mhs
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 text-sm">
                        {lec.totalBeban || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/mahasiswa?dosenId=${lec.id}`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Lihat Mahasiswa Bimbingan Dosen Ini"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </Link>

                          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'KAPRODI') && (
                            <button
                              onClick={() => openEdit(lec)}
                              className="p-1.5 bg-unand-800 hover:bg-unand-900 text-white rounded-lg transition"
                              title="Edit Data Dosen"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Edit / Add Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-unand-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {selectedLecturer ? 'Edit Data Dosen' : 'Tambah Dosen Baru'}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-white/70 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Resmi *
                </label>
                <input
                  type="text"
                  required
                  value={namaGelar}
                  onChange={(e) => setNamaGelar(e.target.value)}
                  placeholder="Contoh: Prof. Dr. Aisman"
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-unand-800"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  *Pertahankan nama dan gelar sesuai ketetapan; jangan menambahkan gelar yang belum dikonfirmasi.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="196001011985031001"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@ae.unand.ac.id"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="08123456789"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bidang Keahlian / Minat Riset</label>
                <input
                  type="text"
                  value={bidangKeahlian}
                  onChange={(e) => setBidangKeahlian(e.target.value)}
                  placeholder="Teknologi Pengolahan Pangan / Kimia Pangan"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-unand-800 hover:bg-unand-900 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  {modalLoading ? 'Menyimpan...' : 'Simpan Dosen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
