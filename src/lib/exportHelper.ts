import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatJakartaDate, getJakartaDateString } from './timezone';

export interface ExportMetadata {
  title: string;
  reportDate?: string;
  filterSummary?: string;
  generatedBy?: string;
}

export function exportStudentsToExcel(
  students: any[],
  metadata: ExportMetadata,
  filename = 'Laporan_Mahasiswa_TPHP.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Header info rows
  const metaRows = [
    ['SISTEM INFORMASI PEMANTAUAN TUGAS AKHIR TPHP STUDYTRACK'],
    ['PROGRAM STUDI TEKNOLOGI PANGAN DAN HASIL PERTANIAN - FATETA UNIVERSITAS ANDALAS'],
    [`Judul Laporan: ${metadata.title}`],
    [`Tanggal Cetak / Ekspor: ${metadata.reportDate || getJakartaDateString()}`],
    [`Filter Aktif: ${metadata.filterSummary || 'Semua Data'}`],
    [`Dicetak oleh: ${metadata.generatedBy || 'Sistem'}`],
    [], // Empty row
  ];

  // Column headers
  const columns = [
    'No',
    'NIM',
    'Nama Lengkap',
    'Angkatan',
    'Semester Studi',
    'Status Akademik',
    'Tahap Utama',
    'Status Penanda Perhatian',
    'Alasan Penanda',
    'Pembimbing Utama',
    'Pembimbing Pendamping',
    'Judul Skripsi',
    'Tgl Laporan Terakhir',
    'Tgl Kemajuan Substantif',
    'Hambatan Utama',
    'Target Berikutnya',
  ];

  // Data rows
  const dataRows = students.map((s, idx) => [
    idx + 1,
    s.nim,
    s.nama,
    s.angkatan,
    s.calculatedSemester || s.semesterManual || '-',
    s.statusAkademik,
    (s.tahapUtama || '').replace(/_/g, ' '),
    s.computedAttention?.label || s.statusPerhatian || '-',
    Array.isArray(s.computedAttention?.reasons)
      ? s.computedAttention.reasons.join('; ')
      : s.alasanPerhatian || '-',
    s.pembimbingUtama?.namaGelar || '-',
    s.pembimbingPendamping?.namaGelar || '-',
    s.judulSkripsi || '(Belum ada judul)',
    s.tglLaporanTerakhir || '-',
    s.tglKemajuanSubstantif || '-',
    s.reports?.[0]?.hambatanUtama || '-',
    s.reports?.[0]?.tindakanBerikutnya || s.targetSelesai || '-',
  ]);

  // Indicator glossary footer
  const footerRows = [
    [],
    ['GLOSARIUM DEFINISI INDIKATOR STATUS PERHATIAN:'],
    ['1. Sesuai Rencana: Aktivitas dan pelaporan kemajuan berjalan sesuai jadwal.'],
    ['2. Perlu Pembaruan Laporan: Belum ada pelaporan baru selama >30 hari (substantif tetap terpelihara).'],
    ['3. Perlu Perhatian: Belum ada kemajuan substantif >60 hari, target terlewati, atau semester >= 8.'],
    ['4. Prioritas Pendampingan: Dosen menandai kebutuhan intervensi prodi atau semester kritis (>=10).'],
    ['5. Belum Cukup Data: Mahasiswa baru didaftarkan atau belum pernah ada pelaporan kemajuan.'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([...metaRows, columns, ...dataRows, ...footerRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 26 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
    { wch: 26 },
    { wch: 26 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Pemantauan_Mhs');
  XLSX.writeFile(wb, filename);
}

export function exportStudentsToPDF(
  students: any[],
  metadata: ExportMetadata,
  filename = 'Laporan_Mahasiswa_TPHP.pdf'
) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

  // Institution Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRAM STUDI TEKNOLOGI PANGAN DAN HASIL PERTANIAN', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Fakultas Teknologi Pertanian - Universitas Andalas, Kampus Limau Manis Padang', 14, 19);

  doc.setLineWidth(0.5);
  doc.line(14, 21, 283, 21);

  // Document Title & Metadata
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(metadata.title.toUpperCase(), 14, 28);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal Cetak: ${metadata.reportDate || getJakartaDateString()}  |  Filter: ${metadata.filterSummary || 'Semua Data'}  |  Pencetak: ${metadata.generatedBy || 'Sistem'}`, 14, 33);

  // AutoTable data
  const head = [
    ['No', 'NIM & Nama', 'Angk/Smtr', 'Pembimbing', 'Judul Skripsi', 'Tahap Utama', 'Status Penanda & Alasan']
  ];

  const body = students.map((s, idx) => [
    idx + 1,
    `${s.nama}\n(${s.nim})`,
    `${s.angkatan} / Smtr ${s.calculatedSemester || s.semesterManual || '-'}`,
    `U: ${s.pembimbingUtama?.namaGelar || '-'}\nP: ${s.pembimbingPendamping?.namaGelar || '-'}`,
    s.judulSkripsi ? (s.judulSkripsi.length > 50 ? s.judulSkripsi.substring(0, 50) + '...' : s.judulSkripsi) : '(Belum ada judul)',
    (s.tahapUtama || '').replace(/_/g, ' '),
    `[${s.computedAttention?.label || s.statusPerhatian || '-'}]\n${
      Array.isArray(s.computedAttention?.reasons) ? s.computedAttention.reasons[0] : (s.alasanPerhatian || '-')
    }`
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 37,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 42 },
      2: { cellWidth: 22 },
      3: { cellWidth: 48 },
      4: { cellWidth: 65 },
      5: { cellWidth: 32 },
      6: { cellWidth: 50 },
    },
    didDrawPage: (data) => {
      // Footer definitions
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'TPHP StudyTrack - Laporan Resmi Pemantauan Tugas Akhir Mahasiswa TPHP Unand',
        14,
        doc.internal.pageSize.height - 8
      );
    }
  });

  doc.save(filename);
}

export function exportBahanRapatPDF(params: {
  priorityStudents: any[];
  followUps?: any[];
  generatedBy?: string;
  filename?: string;
}) {
  const {
    priorityStudents,
    followUps = [],
    generatedBy = 'Tim Pemantauan TPHP',
    filename = `Bahan_Rapat_Evaluasi_TPHP_${getJakartaDateString()}.pdf`,
  } = params;

  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width; // 297 mm
  const pageHeight = doc.internal.pageSize.height; // 210 mm
  const margin = 14;

  // 1. KOP SURAT RESMI
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45); // Unand Green
  doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', margin, 12);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('UNIVERSITAS ANDALAS - FAKULTAS TEKNOLOGI PERTANIAN', margin, 17);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRAM STUDI TEKNOLOGI PANGAN DAN HASIL PERTANIAN (TPHP)', margin, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(
    'Kampus Limau Manis, Kec. Pauh, Padang, Sumatera Barat 25163 | Laman: fateta.unand.ac.id | Email: tphp@fateta.unand.ac.id',
    margin,
    26
  );

  // Double horizontal rule
  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(0.8);
  doc.line(margin, 28, pageWidth - margin, 28);
  doc.setLineWidth(0.2);
  doc.line(margin, 29.2, pageWidth - margin, 29.2);

  // 2. JUDUL DOKUMEN & METADATA
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DOKUMEN RESMI: RESUME & BAHAN RAPAT EVALUASI KEMAJUAN STUDI MAHASISWA', margin, 35);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const printDate = formatJakartaDate(new Date());
  doc.text(
    `Tahun Akademik: 2024/2025 Genap  |  Tanggal Cetak: ${printDate}  |  Dicetak oleh: ${generatedBy}  |  Total Kasus Rapat: ${priorityStudents.length} Mahasiswa`,
    margin,
    40
  );

  // 3. BAGIAN I: RESUME EKSEKUTIF (RINGKASAN STATISTIK & REKOMENDASI RAPAT)
  const totalMhs = priorityStudents.length;
  const angkatanCounts: Record<number, number> = {};
  const tahapCounts: Record<string, number> = {};
  let totalOpenFollowUps = 0;
  let criticalSemesterCount = 0;

  priorityStudents.forEach((s) => {
    angkatanCounts[s.angkatan] = (angkatanCounts[s.angkatan] || 0) + 1;
    const stName = (s.tahapUtama || 'penetapan_judul').replace(/_/g, ' ');
    tahapCounts[stName] = (tahapCounts[stName] || 0) + 1;
    if (s.followUps) {
      totalOpenFollowUps += s.followUps.length;
    }
    const sem = s.calculatedSemester || s.semesterManual || 0;
    if (sem >= 8 || s.angkatan <= 2021) {
      criticalSemesterCount++;
    }
  });

  // Resume Box with subtle background
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(margin, 43, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text('I. RESUME EKSEKUTIF & REKOMENDASI FORUM RAPAT EVALUASI', margin + 3, 47.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const angkatanText =
    Object.entries(angkatanCounts)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([ang, count]) => `Angk ${ang}: ${count} mhs`)
      .join(', ') || '-';

  const tahapText =
    Object.entries(tahapCounts)
      .map(([thp, count]) => `${thp}: ${count}`)
      .join(', ') || '-';

  doc.text(
    `• Rekap Kasus: ${totalMhs} Mahasiswa Kasus Rapat (${criticalSemesterCount} mhs di Semester >= 8)  |  Sebaran Angkatan: ${angkatanText}`,
    margin + 3,
    52
  );
  doc.text(
    `• Sebaran Bottleneck Tahap: ${tahapText}  |  Agenda Tindak Lanjut Terbuka / Berjalan: ${totalOpenFollowUps} butir`,
    margin + 3,
    56.5
  );
  doc.text(
    '• Poin Rekomendasi Rapat: 1) Fasilitasi lab & bahan kimia; 2) Klinik penulisan naskah Bab 4-5; 3) Penetapan target sidang 30-60 hari.',
    margin + 3,
    61
  );

  // 4. BAGIAN II: MATRIKS DETAIL MAHASISWA PRIORITAS (AUTOTABLE)
  const head = [
    [
      'No',
      'Identitas Mahasiswa\n(NIM, Nama, Angkatan, Smtr)',
      'Dosen Pembimbing\n(Utama & Pendamping)',
      'Tahap Studi &\nJudul Skripsi',
      'Status & Alasan Kebutuhan\nEvaluasi / Hambatan',
      'Agenda Tindak Lanjut\nDisepakati (PJ & Tenggat)',
    ],
  ];

  const body = priorityStudents.map((s, idx) => {
    const sem = s.calculatedSemester || s.semesterManual || '-';
    const identitas = `${s.nama}\nNIM: ${s.nim}\nAngk ${s.angkatan} (Smtr ${sem})`;
    const pembimbing = `U: ${s.pembimbingUtama?.namaGelar || '-'}\nP: ${s.pembimbingPendamping?.namaGelar || '-'}`;
    const tahap = `[${(s.tahapUtama || '').replace(/_/g, ' ').toUpperCase()}]\n${
      s.judulSkripsi
        ? s.judulSkripsi.length > 55
          ? s.judulSkripsi.substring(0, 55) + '...'
          : s.judulSkripsi
        : '(Judul belum ditetapkan)'
    }`;

    // Status & Alasan
    const statusLabel =
      s.statusPerhatian === 'prioritas' ? '[PRIORITAS PENDAMPINGAN]' : '[PERLU PERHATIAN]';
    const reason =
      s.alasanPerhatian ||
      s.reports?.[0]?.hambatanUtama ||
      'Memerlukan koordinasi percepatan penyelesaian tugas akhir.';
    const statusAlasan = `${statusLabel}\n${reason}`;

    // Follow-ups list
    let followUpText = '-';
    if (s.followUps && s.followUps.length > 0) {
      followUpText = s.followUps
        .map(
          (f: any, fIdx: number) =>
            `${fIdx + 1}. ${f.tindakanDisepakati}\n(PJ: ${f.penanggungJawab} | Tgt: ${f.tenggat || '-'})`
        )
        .join('\n\n');
    } else {
      followUpText = 'Belum ada agenda terdaftar.\n(Disarankan dirumuskan dalam rapat)';
    }

    return [idx + 1, identitas, pembimbing, tahap, statusAlasan, followUpText];
  });

  autoTable(doc, {
    head,
    body,
    startY: 67,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      valign: 'top',
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [20, 83, 45], // Unand green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 48 },
      3: { cellWidth: 58 },
      4: { cellWidth: 53 },
      5: { cellWidth: 54 },
    },
    didDrawPage: (data) => {
      // Running Footer on each page
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `TPHP StudyTrack - Dokumen Resmi Bahan Rapat Evaluasi Tugas Akhir FATETA UNAND  |  Halaman ${data.pageNumber}`,
        margin,
        pageHeight - 6
      );
    },
  });

  // 5. BAGIAN III: LEMBAR PENGESAHAN & TANDA TANGAN (Setelah tabel)
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  let signY = finalY + 10;
  if (signY + 36 > pageHeight - margin) {
    doc.addPage();
    signY = 25;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Padang, ${printDate}`, pageWidth - margin - 75, signY);

  doc.text('Mengetahui,', margin + 10, signY + 5);
  doc.text('Ketua Program Studi TPHP', margin + 10, signY + 9);

  doc.text('Notulis / Tim Pemantauan Tugas Akhir,', pageWidth - margin - 75, signY + 5);
  doc.text('Komisi Skripsi & Evaluasi Mahasiswa', pageWidth - margin - 75, signY + 9);

  // Blank signature space
  doc.setFont('helvetica', 'bold');
  doc.text('Dr. Daimon Syukri, S.Si, M.Si', margin + 10, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 198007252008121002', margin + 10, signY + 32);

  doc.setFont('helvetica', 'bold');
  doc.text(generatedBy || 'Tim Evaluasi Akademik', pageWidth - margin - 75, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('FATETA Universitas Andalas', pageWidth - margin - 75, signY + 32);

  doc.save(filename);
}
