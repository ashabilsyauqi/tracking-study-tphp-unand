import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TPHP StudyTrack - Sistem Pemantauan Tugas Akhir Mahasiswa',
  description:
    'Sistem Informasi Pemantauan Kemajuan Studi dan Skripsi Mahasiswa Tingkat Akhir Program Studi Teknologi Pangan dan Hasil Pertanian, Fakultas Teknologi Pertanian, Universitas Andalas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
