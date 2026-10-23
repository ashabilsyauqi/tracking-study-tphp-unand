import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { calculateSemester, evaluateAttentionStatus } from '@/lib/calculations';
import { getJakartaDateString } from '@/lib/timezone';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const angkatan = searchParams.get('angkatan');
    const semester = searchParams.get('semester');
    const dosenId = searchParams.get('dosenId');
    const tahap = searchParams.get('tahap');
    const statusAkademik = searchParams.get('statusAkademik');
    const statusPerhatian = searchParams.get('statusPerhatian');
    const butuhBantuan = searchParams.get('butuhBantuan');
    const targetTerlewati = searchParams.get('targetTerlewati');
    const umurLaporan = searchParams.get('umurLaporan');
    const includeDemo = searchParams.get('includeDemo') !== 'false';
    const demoOnly = searchParams.get('demoOnly') === 'true';
    const bimbinganOnly = searchParams.get('bimbinganOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') || 'nim';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    // Base WHERE clause
    const where: any = {
      isArchived: false,
    };

    if (demoOnly) {
      where.isDemo = true;
    } else if (!includeDemo) {
      where.isDemo = false;
    }

    // Role-based Access Control (Enforced at Server & DB level)
    if (user.role === 'DOSEN') {
      if (!user.lecturerId) {
        return NextResponse.json({ data: [], total: 0, page, totalPages: 0 });
      }
      // Dosen can ONLY see students they advise (primary or co-advisor)
      where.OR = [
        { pembimbingUtamaId: user.lecturerId },
        { pembimbingPendampingId: user.lecturerId },
      ];
    } else if (bimbinganOnly && dosenId) {
      where.OR = [
        { pembimbingUtamaId: dosenId },
        { pembimbingPendampingId: dosenId },
      ];
    } else if (dosenId) {
      where.OR = [
        { pembimbingUtamaId: dosenId },
        { pembimbingPendampingId: dosenId },
      ];
    }

    // Filters
    if (search) {
      const searchConditions = [
        { nim: { contains: search } },
        { nama: { contains: search } },
        { judulSkripsi: { contains: search } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    if (angkatan) {
      where.angkatan = parseInt(angkatan, 10);
    }

    if (statusAkademik) {
      where.statusAkademik = statusAkademik;
    }

    if (statusPerhatian) {
      where.statusPerhatian = statusPerhatian;
    }

    if (tahap) {
      where.tahapUtama = tahap;
    }

    // Fetch students with relations
    const total = await prisma.student.count({ where });

    let orderBy: any = {};
    if (sortBy === 'nama') orderBy = { nama: sortOrder };
    else if (sortBy === 'angkatan') orderBy = { angkatan: sortOrder };
    else if (sortBy === 'tglLaporan') orderBy = { tglLaporanTerakhir: sortOrder };
    else if (sortBy === 'statusPerhatian') orderBy = { statusPerhatian: sortOrder };
    else orderBy = { nim: sortOrder };

    const students = await prisma.student.findMany({
      where,
      include: {
        pembimbingUtama: true,
        pembimbingPendamping: true,
        stages: true,
        chapters: true,
        reports: { orderBy: { createdAt: 'desc' } },
        followUps: {
          where: { status: { in: ['terbuka', 'sedang_ditangani'] } },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    });

    // Fetch prodi settings for calculation consistency
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const reminderReportDays = parseInt(settingsMap['reminder_report_days'] || '30', 10);
    const reminderSubstantiveDays = parseInt(settingsMap['reminder_substantive_days'] || '60', 10);
    const studyPeriodThreshold = parseInt(settingsMap['study_period_semester_threshold'] || '8', 10);
    const currentYear = parseInt(settingsMap['current_calendar_year'] || '2025', 10);
    const semesterType = (settingsMap['semester_type'] || 'genap') as 'ganjil' | 'genap';

    // Enrich students with dynamic calculation details
    const enriched = students.map((std) => {
      const semCalc = calculateSemester(
        std.angkatan,
        std.semesterManual,
        std.semesterCuti,
        currentYear,
        semesterType
      );

      // Check overdue milestone target
      const todayStr = getJakartaDateString();
      const hasOverdueTarget = std.stages.some((st) => {
        return (
          st.targetSelesai &&
          st.targetSelesai < todayStr &&
          st.status !== 'selesai' &&
          st.status !== 'belum_dilaporkan'
        );
      });

      const attention = evaluateAttentionStatus({
        statusAkademik: std.statusAkademik,
        semester: semCalc.semester,
        tglLaporanTerakhir: std.tglLaporanTerakhir,
        tglKemajuanSubstantif: std.tglKemajuanSubstantif,
        kebutuhanBantuanProdi: std.followUps.length > 0 || std.alasanPerhatian?.includes('bantuan prodi'),
        targetTahapanTerlewati: hasOverdueTarget,
        tahapUtama: std.tahapUtama,
        hasJudul: !!std.judulSkripsi,
        rules: {
          reminderReportDays,
          reminderSubstantiveDays,
          studyPeriodSemesterThreshold: studyPeriodThreshold,
        },
      });

      // Filter by semester if requested
      return {
        ...std,
        calculatedSemester: semCalc.semester,
        semesterBasis: semCalc.basis,
        isSemesterManual: semCalc.isManual,
        computedAttention: attention,
        hasOverdueTarget,
      };
    });

    // Post-filter if semester or targetTerlewati or umurLaporan was passed
    let filtered = enriched;
    if (semester) {
      filtered = filtered.filter((s) => s.calculatedSemester === parseInt(semester, 10));
    }
    if (targetTerlewati === 'true') {
      filtered = filtered.filter((s) => s.hasOverdueTarget);
    }
    if (butuhBantuan === 'true') {
      filtered = filtered.filter((s) => s.computedAttention.reasons.some((r) => r.includes('bantuan') || r.includes('intervensi')));
    }
    if (umurLaporan) {
      const days = parseInt(umurLaporan, 10);
      filtered = filtered.filter((s) => (s.computedAttention.daysSinceLastReport ?? 999) >= days);
    }

    return NextResponse.json({
      data: filtered,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Gagal mengambil data mahasiswa.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'KAPRODI' && user.role !== 'DOSEN') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak akses untuk menambahkan data mahasiswa.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      nim,
      nama,
      angkatan,
      statusAkademik = 'aktif',
      semesterManual,
      pembimbingUtamaId,
      pembimbingPendampingId,
      peranDosen, // 'utama' | 'pendamping' (khusus bila dosen yang menginput)
      tglPenetapanPembimbing,
      tahapUtama,
      judulSkripsi,
      bidangPenelitian,
      tglMulaiTugasAkhir,
      targetSelesai,
      email,
      noHp,
      catatanAdministratif,
      isDemo = false,
    } = body;

    if (!nim || !nama || !angkatan) {
      return NextResponse.json(
        { error: 'NIM, Nama Lengkap, dan Angkatan wajib diisi.' },
        { status: 400 }
      );
    }

    // Check duplicate NIM
    const existing = await prisma.student.findUnique({
      where: { nim: nim.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: `NIM ${nim} sudah terdaftar dalam sistem (Nama: ${existing.nama}).` },
        { status: 400 }
      );
    }

    let finalPembimbingUtamaId = pembimbingUtamaId || null;
    let finalPembimbingPendampingId = pembimbingPendampingId || null;

    // Jika diinput oleh Dosen Pembimbing, pastikan dosen tersebut terdaftar sebagai pembimbing mahasiswa ini
    if (user.role === 'DOSEN') {
      if (!user.lecturerId) {
        return NextResponse.json(
          { error: 'Profil dosen Anda belum terhubung dengan akun pengguna.' },
          { status: 400 }
        );
      }

      if (peranDosen === 'pendamping') {
        finalPembimbingPendampingId = user.lecturerId;
      } else {
        // default jika dosen input adalah Pembimbing Utama
        finalPembimbingUtamaId = user.lecturerId;
      }

      // Pastikan dosen login menjadi salah satu pembimbing
      if (finalPembimbingUtamaId !== user.lecturerId && finalPembimbingPendampingId !== user.lecturerId) {
        finalPembimbingUtamaId = user.lecturerId;
      }
    }

    // Tahap awal skripsi
    const finalTahapUtama = tahapUtama || (judulSkripsi ? 'penetapan_judul' : 'penetapan_judul');

    const student = await prisma.student.create({
      data: {
        nim: nim.trim(),
        nama: nama.trim(),
        angkatan: parseInt(String(angkatan), 10),
        statusAkademik,
        semesterManual: semesterManual ? parseInt(String(semesterManual), 10) : null,
        pembimbingUtamaId: finalPembimbingUtamaId,
        pembimbingPendampingId: finalPembimbingPendampingId,
        tglPenetapanPembimbing: tglPenetapanPembimbing || getJakartaDateString(),
        judulSkripsi: judulSkripsi?.trim() || null,
        bidangPenelitian: bidangPenelitian?.trim() || null,
        tglMulaiTugasAkhir: tglMulaiTugasAkhir || null,
        targetSelesai: targetSelesai || null,
        email: email?.trim() || null,
        noHp: noHp?.trim() || null,
        catatanAdministratif: catatanAdministratif || null,
        tahapUtama: finalTahapUtama,
        statusPerhatian: 'belum_cukup_data',
        alasanPerhatian:
          user.role === 'DOSEN'
            ? 'Mahasiswa bimbingan ditambahkan secara manual oleh Dosen Pembimbing.'
            : 'Data mahasiswa baru didaftarkan; menunggu pelaporan kemajuan dari dosen pembimbing.',
        isDemo: Boolean(isDemo),
        version: 1,
      },
      include: {
        pembimbingUtama: true,
        pembimbingPendamping: true,
      },
    });

    // Seed default 6 stages
    const defaultStages = [
      { key: 'penetapan_judul', name: 'Penetapan Judul' },
      { key: 'seminar_proposal', name: 'Seminar Proposal' },
      { key: 'penelitian', name: 'Penelitian' },
      { key: 'penulisan_skripsi', name: 'Penulisan Skripsi' },
      { key: 'seminar_hasil', name: 'Seminar Hasil' },
      { key: 'ujian_sarjana', name: 'Ujian Sarjana' },
    ];

    for (const stg of defaultStages) {
      const isCurrentStage = stg.key === finalTahapUtama;
      await prisma.studentStage.create({
        data: {
          studentId: student.id,
          stageKey: stg.key,
          stageName: stg.name,
          status: isCurrentStage ? 'sedang_berjalan' : 'belum_dilaporkan',
          tglMulai: isCurrentStage ? (tglMulaiTugasAkhir || getJakartaDateString()) : null,
        },
      });
    }

    // Seed Bab I-V
    const defaultChapters = [
      'Bab I: Pendahuluan',
      'Bab II: Tinjauan Pustaka',
      'Bab III: Metodologi Penelitian',
      'Bab IV: Hasil dan Pembahasan',
      'Bab V: Kesimpulan dan Saran',
    ];
    for (let i = 1; i <= 5; i++) {
      await prisma.thesisChapterProgress.create({
        data: {
          studentId: student.id,
          chapterNum: i,
          chapterName: defaultChapters[i - 1],
          status: 'belum_dimulai',
        },
      });
    }

    // Record initial advisor history if advisors are assigned
    if (student.pembimbingUtama || student.pembimbingPendamping) {
      await prisma.advisorAssignmentHistory.create({
        data: {
          studentId: student.id,
          oldUtamaNama: null,
          oldPendampingNama: null,
          newUtamaNama: student.pembimbingUtama?.namaGelar || '-',
          newPendampingNama: student.pembimbingPendamping?.namaGelar || '-',
          changeDate: tglPenetapanPembimbing || getJakartaDateString(),
          reason:
            user.role === 'DOSEN'
              ? 'Penetapan pembimbing saat pendaftaran bimbingan mandiri oleh dosen.'
              : 'Penetapan pembimbing awal saat pendaftaran mahasiswa.',
          changedBy: user.name,
        },
      });
    }

    // Record initial title history if title is provided
    if (judulSkripsi) {
      await prisma.titleHistory.create({
        data: {
          studentId: student.id,
          oldTitle: null,
          newTitle: judulSkripsi.trim(),
          statusJudul: 'sementara',
          changeDate: getJakartaDateString(),
          reason: 'Pengusulan judul awal.',
          changedBy: user.name,
        },
      });
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE',
      entity: 'Student',
      entityId: student.id,
      details: `${
        user.role === 'DOSEN' ? `Dosen Pembimbing (${user.name})` : user.role
      } menambahkan data mahasiswa bimbingan baru secara manual: ${student.nama} (NIM: ${student.nim}).`,
    });

    return NextResponse.json({
      success: true,
      data: student,
      message: `Mahasiswa ${student.nama} (${student.nim}) berhasil ditambahkan.`,
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan mahasiswa.' },
      { status: 500 }
    );
  }
}
