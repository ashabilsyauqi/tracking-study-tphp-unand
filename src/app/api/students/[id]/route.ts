import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, canAccessStudent } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { calculateSemester, evaluateAttentionStatus, calculateEstimatedProgress } from '@/lib/calculations';
import { getJakartaDateString } from '@/lib/timezone';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { id } = params;

    // Server-level RBAC check
    const access = await canAccessStudent(user, id);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason || 'Akses ditolak ke data mahasiswa ini.' },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        pembimbingUtama: true,
        pembimbingPendamping: true,
        stages: {
          orderBy: { stageKey: 'asc' },
        },
        chapters: {
          orderBy: { chapterNum: 'asc' },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
        advisorHistory: {
          orderBy: { createdAt: 'desc' },
        },
        titleHistory: {
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student || student.isArchived) {
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 });
    }

    // Fetch settings for calculation
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => (settingsMap[s.key] = s.value));

    const reminderReportDays = parseInt(settingsMap['reminder_report_days'] || '30', 10);
    const reminderSubstantiveDays = parseInt(settingsMap['reminder_substantive_days'] || '60', 10);
    const studyPeriodThreshold = parseInt(settingsMap['study_period_semester_threshold'] || '8', 10);
    const currentYear = parseInt(settingsMap['current_calendar_year'] || '2025', 10);
    const semesterType = (settingsMap['semester_type'] || 'genap') as 'ganjil' | 'genap';

    const semCalc = calculateSemester(
      student.angkatan,
      student.semesterManual,
      student.semesterCuti,
      currentYear,
      semesterType
    );

    const hasOverdueTarget = student.stages.some(
      (st) =>
        st.targetSelesai &&
        st.targetSelesai < getJakartaDateString() &&
        st.status !== 'selesai' &&
        st.status !== 'belum_dilaporkan'
    );

    const attention = evaluateAttentionStatus({
      statusAkademik: student.statusAkademik,
      semester: semCalc.semester,
      tglLaporanTerakhir: student.tglLaporanTerakhir,
      tglKemajuanSubstantif: student.tglKemajuanSubstantif,
      kebutuhanBantuanProdi: student.followUps.some((f) => f.status !== 'selesai') || student.alasanPerhatian?.includes('bantuan prodi'),
      targetTahapanTerlewati: hasOverdueTarget,
      tahapUtama: student.tahapUtama,
      hasJudul: !!student.judulSkripsi,
      rules: {
        reminderReportDays,
        reminderSubstantiveDays,
        studyPeriodSemesterThreshold: studyPeriodThreshold,
      },
    });

    let stageWeights = undefined;
    if (settingsMap['stage_weights']) {
      try {
        stageWeights = JSON.parse(settingsMap['stage_weights']);
      } catch (e) {}
    }

    const estimatedProgress = calculateEstimatedProgress(
      student.stages.map((s) => ({ stageKey: s.stageKey, status: s.status })),
      stageWeights
    );

    // Active activities (can overlap, e.g. penelitian + penulisan skripsi)
    const activeActivities = student.stages
      .filter((s) => s.status === 'sedang_berjalan' || s.status === 'menunggu_jadwal')
      .map((s) => s.stageName);

    return NextResponse.json({
      data: {
        ...student,
        calculatedSemester: semCalc.semester,
        semesterBasis: semCalc.basis,
        isSemesterManual: semCalc.isManual,
        computedAttention: attention,
        estimatedProgress,
        activeActivities,
        userRole: user.role,
        isSupervisor: access.isSupervisor,
        isPrimary: access.isPrimary,
      },
    });
  } catch (error: any) {
    console.error('Error fetching student detail:', error);
    return NextResponse.json({ error: 'Gagal mengambil rincian mahasiswa.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { id } = params;

    // Only Admin or Kaprodi can update administrative data
    if (user.role !== 'ADMIN' && user.role !== 'KAPRODI') {
      return NextResponse.json(
        { error: 'Hanya Administrator atau Ketua Prodi yang dapat memperbarui data administratif.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      nama,
      angkatan,
      statusAkademik,
      semesterManual,
      semesterCuti,
      pembimbingUtamaId,
      pembimbingPendampingId,
      tglPenetapanPembimbing,
      judulSkripsi,
      bidangPenelitian,
      tglMulaiTugasAkhir,
      targetSelesai,
      email,
      noHp,
      catatanAdministratif,
      alasanPerubahan,
      expectedVersion,
      lulusAdministratif,
      tglLulusAdministratif,
    } = body;

    if (!alasanPerubahan || !alasanPerubahan.trim()) {
      return NextResponse.json(
        { error: 'Alasan perubahan wajib dicatat sesuai prosedur audit administratif prodi.' },
        { status: 400 }
      );
    }

    const currentStudent = await prisma.student.findUnique({
      where: { id },
      include: { pembimbingUtama: true, pembimbingPendamping: true },
    });

    if (!currentStudent || currentStudent.isArchived) {
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 });
    }

    // Optimistic Concurrency Control
    if (expectedVersion !== undefined && currentStudent.version !== expectedVersion) {
      return NextResponse.json(
        {
          error: 'Konflik Data: Data mahasiswa telah diubah oleh pengguna lain saat Anda membuka formulir.',
          isConflict: true,
          currentVersion: currentStudent.version,
          currentData: currentStudent,
        },
        { status: 409 }
      );
    }

    // Check if advisors changed -> Record Advisor Assignment History
    const advisorsChanged =
      (pembimbingUtamaId !== undefined && pembimbingUtamaId !== currentStudent.pembimbingUtamaId) ||
      (pembimbingPendampingId !== undefined && pembimbingPendampingId !== currentStudent.pembimbingPendampingId);

    if (advisorsChanged) {
      const newUtama = pembimbingUtamaId
        ? await prisma.lecturer.findUnique({ where: { id: pembimbingUtamaId } })
        : null;
      const newPendamping = pembimbingPendampingId
        ? await prisma.lecturer.findUnique({ where: { id: pembimbingPendampingId } })
        : null;

      await prisma.advisorAssignmentHistory.create({
        data: {
          studentId: id,
          oldUtamaNama: currentStudent.pembimbingUtama?.namaGelar || '-',
          oldPendampingNama: currentStudent.pembimbingPendamping?.namaGelar || '-',
          newUtamaNama: newUtama?.namaGelar || '-',
          newPendampingNama: newPendamping?.namaGelar || '-',
          changeDate: getJakartaDateString(),
          reason: alasanPerubahan.trim(),
          changedBy: user.name,
        },
      });
    }

    // Check if Title changed -> Record Title History
    const titleChanged =
      judulSkripsi !== undefined &&
      judulSkripsi?.trim() !== (currentStudent.judulSkripsi || '');

    if (titleChanged && judulSkripsi?.trim()) {
      await prisma.titleHistory.create({
        data: {
          studentId: id,
          oldTitle: currentStudent.judulSkripsi,
          newTitle: judulSkripsi.trim(),
          statusJudul: 'definitif',
          changeDate: getJakartaDateString(),
          reason: alasanPerubahan.trim(),
          changedBy: user.name,
        },
      });
    }

    // Update Student record
    const updated = await prisma.student.update({
      where: { id },
      data: {
        nama: nama ? nama.trim() : currentStudent.nama,
        angkatan: angkatan ? parseInt(String(angkatan), 10) : currentStudent.angkatan,
        statusAkademik: statusAkademik || currentStudent.statusAkademik,
        semesterManual: semesterManual !== undefined ? (semesterManual ? parseInt(String(semesterManual), 10) : null) : currentStudent.semesterManual,
        semesterCuti: semesterCuti !== undefined ? parseInt(String(semesterCuti), 10) : currentStudent.semesterCuti,
        pembimbingUtamaId: pembimbingUtamaId !== undefined ? pembimbingUtamaId : currentStudent.pembimbingUtamaId,
        pembimbingPendampingId: pembimbingPendampingId !== undefined ? pembimbingPendampingId : currentStudent.pembimbingPendampingId,
        tglPenetapanPembimbing: tglPenetapanPembimbing !== undefined ? tglPenetapanPembimbing : currentStudent.tglPenetapanPembimbing,
        judulSkripsi: judulSkripsi !== undefined ? (judulSkripsi ? judulSkripsi.trim() : null) : currentStudent.judulSkripsi,
        bidangPenelitian: bidangPenelitian !== undefined ? bidangPenelitian?.trim() : currentStudent.bidangPenelitian,
        tglMulaiTugasAkhir: tglMulaiTugasAkhir !== undefined ? tglMulaiTugasAkhir : currentStudent.tglMulaiTugasAkhir,
        targetSelesai: targetSelesai !== undefined ? targetSelesai : currentStudent.targetSelesai,
        email: email !== undefined ? email?.trim() : currentStudent.email,
        noHp: noHp !== undefined ? noHp?.trim() : currentStudent.noHp,
        catatanAdministratif: catatanAdministratif !== undefined ? catatanAdministratif : currentStudent.catatanAdministratif,
        lulusAdministratif: lulusAdministratif !== undefined ? Boolean(lulusAdministratif) : currentStudent.lulusAdministratif,
        tglLulusAdministratif: tglLulusAdministratif !== undefined ? tglLulusAdministratif : currentStudent.tglLulusAdministratif,
        version: currentStudent.version + 1,
      },
      include: {
        pembimbingUtama: true,
        pembimbingPendamping: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'Student',
      entityId: id,
      alasanPerubahan: alasanPerubahan.trim(),
      details: `Pembaruan data administratif mahasiswa ${updated.nama} (${updated.nim}).`,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Data administratif mahasiswa berhasil diperbarui.',
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data mahasiswa.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Administrator yang berwenang mengarsipkan data mahasiswa.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const reason = body.alasan || 'Pengarsipan administratif oleh Admin.';

    const student = await prisma.student.update({
      where: { id },
      data: {
        isArchived: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DELETE',
      entity: 'Student',
      entityId: id,
      alasanPerubahan: reason,
      details: `Mengarsipkan data mahasiswa ${student.nama} (NIM: ${student.nim}). Soft-delete diterapkan agar riwayat tetap utuh.`,
    });

    return NextResponse.json({
      success: true,
      message: `Data mahasiswa ${student.nama} (${student.nim}) berhasil diarsipkan secara aman.`,
    });
  } catch (error: any) {
    console.error('Error soft-deleting student:', error);
    return NextResponse.json({ error: 'Gagal mengarsipkan data mahasiswa.' }, { status: 500 });
  }
}
