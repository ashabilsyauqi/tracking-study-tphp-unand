import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getJakartaDateString } from '@/lib/timezone';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Administrator yang berwenang mengimpor data mahasiswa.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { mode = 'preview', rows = [], overwriteExisting = false } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris data yang dikirim untuk diimpor.' }, { status: 400 });
    }

    // Load all active lecturers for fuzzy/exact matching
    const masterLecturers = await prisma.lecturer.findMany({
      where: { isActive: true },
    });

    const matchLecturer = (inputName: string | undefined | null) => {
      if (!inputName || !inputName.trim()) return null;
      const clean = inputName.trim().toLowerCase().replace(/^(prof\.|dr\.|ir\.|mp|msi|stp|ph\.d|\.)+/g, '').trim();

      // Try exact match first
      const exact = masterLecturers.find(
        (l) => l.namaGelar.toLowerCase() === inputName.trim().toLowerCase()
      );
      if (exact) return exact;

      // Try substring match on lecturer name
      const matched = masterLecturers.find((l) => {
        const lClean = l.namaGelar.toLowerCase().replace(/^(prof\.|dr\.|ir\.|mp|msi|stp|ph\.d|\.)+/g, '').trim();
        return (
          l.namaGelar.toLowerCase().includes(clean) ||
          clean.includes(lClean) ||
          (l.nip && l.nip === inputName.trim())
        );
      });
      return matched || null;
    };

    if (mode === 'preview') {
      // 1. PREVIEW MODE
      const seenNims = new Set<string>();
      const existingStudents = await prisma.student.findMany({
        where: { isArchived: false },
        select: { nim: true, nama: true },
      });
      const dbNimMap = new Map(existingStudents.map((s) => [s.nim, s.nama]));

      const validatedRows = rows.map((row: any, idx: number) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const nim = String(row.NIM || row.nim || '').trim();
        const nama = String(row.Nama || row.nama || '').trim();
        const angkatanRaw = row.Angkatan || row.angkatan;
        const angkatan = parseInt(String(angkatanRaw), 10);
        const statusAkademik = String(row['Status Akademik'] || row.statusAkademik || 'aktif').toLowerCase().trim();
        const semesterStudi = parseInt(String(row['Semester Studi'] || row.semesterStudi || '0'), 10) || null;
        const rawUtama = String(row['Pembimbing Utama'] || row.pembimbingUtama || '').trim();
        const rawPendamping = String(row['Pembimbing Pendamping'] || row.pembimbingPendamping || '').trim();
        const judul = String(row.Judul || row.judul || '').trim();
        const targetSelesai = String(row['Target Selesai'] || row.targetSelesai || '').trim();

        if (!nim) errors.push('NIM tidak boleh kosong.');
        if (!nama) errors.push('Nama lengkap tidak boleh kosong.');
        if (isNaN(angkatan) || angkatan < 2010 || angkatan > 2030) errors.push('Format angkatan tidak valid (misal: 2021).');

        if (seenNims.has(nim)) {
          errors.push(`NIM duplikat terdeteksi dalam berkas impor (NIM: ${nim}).`);
        } else if (nim) {
          seenNims.add(nim);
        }

        const isExistingInDb = dbNimMap.has(nim);
        if (isExistingInDb) {
          warnings.push(`NIM sudah ada di database (${dbNimMap.get(nim)}). Data akan diperbarui jika opsi timpa dipilih.`);
        }

        const matchedUtama = matchLecturer(rawUtama);
        if (rawUtama && !matchedUtama) {
          warnings.push(`Pembimbing Utama "${rawUtama}" tidak cocok dengan data master 20 dosen. Akan disimpan kosong.`);
        }

        const matchedPendamping = matchLecturer(rawPendamping);
        if (rawPendamping && !matchedPendamping) {
          warnings.push(`Pembimbing Pendamping "${rawPendamping}" tidak cocok dengan data master dosen.`);
        }

        return {
          rowIndex: idx + 1,
          nim,
          nama,
          angkatan,
          statusAkademik: ['aktif', 'cuti', 'lulus', 'mengundurkan_diri'].includes(statusAkademik) ? statusAkademik : 'aktif',
          semesterStudi,
          rawUtama,
          matchedUtamaId: matchedUtama?.id || null,
          matchedUtamaNama: matchedUtama?.namaGelar || (rawUtama ? `[Tidak cocok: ${rawUtama}]` : '-'),
          rawPendamping,
          matchedPendampingId: matchedPendamping?.id || null,
          matchedPendampingNama: matchedPendamping?.namaGelar || (rawPendamping ? `[Tidak cocok: ${rawPendamping}]` : '-'),
          judul: judul || null,
          targetSelesai: targetSelesai || null,
          isExistingInDb,
          hasErrors: errors.length > 0,
          errors,
          warnings,
          isValid: errors.length === 0,
        };
      });

      const totalRows = validatedRows.length;
      const validCount = validatedRows.filter((r) => r.isValid).length;
      const errorCount = validatedRows.filter((r) => r.hasErrors).length;
      const existingCount = validatedRows.filter((r) => r.isExistingInDb && r.isValid).length;
      const newCount = validCount - existingCount;

      return NextResponse.json({
        success: true,
        preview: validatedRows,
        summary: {
          totalRows,
          validCount,
          errorCount,
          existingCount,
          newCount,
        },
      });
    }

    if (mode === 'commit') {
      // 2. COMMIT MODE
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      const defaultStages = [
        { key: 'penetapan_judul', name: 'Penetapan Judul' },
        { key: 'seminar_proposal', name: 'Seminar Proposal' },
        { key: 'penelitian', name: 'Penelitian' },
        { key: 'penulisan_skripsi', name: 'Penulisan Skripsi' },
        { key: 'seminar_hasil', name: 'Seminar Hasil' },
        { key: 'ujian_sarjana', name: 'Ujian Sarjana' },
      ];

      const defaultChapters = [
        'Bab I: Pendahuluan',
        'Bab II: Tinjauan Pustaka',
        'Bab III: Metodologi Penelitian',
        'Bab IV: Hasil dan Pembahasan',
        'Bab V: Kesimpulan dan Saran',
      ];

      for (const item of rows) {
        if (!item.nim || !item.nama) {
          skippedCount++;
          continue;
        }

        const existing = await prisma.student.findUnique({
          where: { nim: item.nim },
        });

        if (existing) {
          if (!overwriteExisting) {
            skippedCount++;
            continue;
          }

          // Update existing student with confirmation
          await prisma.student.update({
            where: { id: existing.id },
            data: {
              nama: item.nama,
              angkatan: item.angkatan || existing.angkatan,
              statusAkademik: item.statusAkademik || existing.statusAkademik,
              semesterManual: item.semesterStudi || existing.semesterManual,
              pembimbingUtamaId: item.matchedUtamaId || existing.pembimbingUtamaId,
              pembimbingPendampingId: item.matchedPendampingId || existing.pembimbingPendampingId,
              judulSkripsi: item.judul || existing.judulSkripsi,
              targetSelesai: item.targetSelesai || existing.targetSelesai,
              version: existing.version + 1,
            },
          });
          updatedCount++;
        } else {
          // Create new student
          const newStudent = await prisma.student.create({
            data: {
              nim: item.nim,
              nama: item.nama,
              angkatan: item.angkatan,
              statusAkademik: item.statusAkademik || 'aktif',
              semesterManual: item.semesterStudi || null,
              pembimbingUtamaId: item.matchedUtamaId || null,
              pembimbingPendampingId: item.matchedPendampingId || null,
              tglPenetapanPembimbing: item.matchedUtamaId ? getJakartaDateString() : null,
              judulSkripsi: item.judul || null,
              targetSelesai: item.targetSelesai || null,
              tahapUtama: 'penetapan_judul',
              statusPerhatian: 'belum_cukup_data',
              alasanPerhatian: 'Data diimpor melalui Excel/CSV; menunggu pembaruan bimbingan.',
              isDemo: false,
              version: 1,
            },
          });

          // Seed stages as "belum_dilaporkan"
          for (const stg of defaultStages) {
            await prisma.studentStage.create({
              data: {
                studentId: newStudent.id,
                stageKey: stg.key,
                stageName: stg.name,
                status: 'belum_dilaporkan',
              },
            });
          }

          // Seed chapters
          for (let c = 1; c <= 5; c++) {
            await prisma.thesisChapterProgress.create({
              data: {
                studentId: newStudent.id,
                chapterNum: c,
                chapterName: defaultChapters[c - 1],
                status: 'belum_dimulai',
              },
            });
          }

          createdCount++;
        }
      }

      await logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'IMPORT',
        entity: 'Student',
        details: `Impor data mahasiswa selesai: ${createdCount} mahasiswa baru, ${updatedCount} diperbarui, ${skippedCount} dilewati.`,
      });

      return NextResponse.json({
        success: true,
        message: `Impor berhasil diproses: ${createdCount} data baru ditambahkan, ${updatedCount} data diperbarui, ${skippedCount} data dilewati.`,
        createdCount,
        updatedCount,
        skippedCount,
      });
    }

    return NextResponse.json({ error: 'Mode impor tidak dikenal.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error importing students:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses impor data mahasiswa.' }, { status: 500 });
  }
}
