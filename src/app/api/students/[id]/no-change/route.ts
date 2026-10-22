import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, canAccessStudent } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getJakartaDateTimeString, getJakartaDateString } from '@/lib/timezone';
import { calculateSemester, evaluateAttentionStatus } from '@/lib/calculations';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { id } = params;

    // RBAC check
    const access = await canAccessStudent(user, id);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason || 'Akses ditolak.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      noChangeReason,
      noChangeNextPlan,
      expectedVersion,
    } = body;

    if (!noChangeReason || !noChangeReason.trim()) {
      return NextResponse.json(
        { error: 'Mohon isi alasan singkat mengapa belum ada perubahan kemajuan.' },
        { status: 400 }
      );
    }

    if (!noChangeNextPlan || !noChangeNextPlan.trim()) {
      return NextResponse.json(
        { error: 'Mohon isi rencana tindakan berikutnya.' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        stages: true,
        followUps: true,
      },
    });

    if (!student || student.isArchived) {
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 });
    }

    // Concurrency check
    if (expectedVersion !== undefined && student.version !== expectedVersion) {
      return NextResponse.json(
        {
          error: 'Peringatan Konflik: Data mahasiswa telah diperbarui oleh pengguna lain saat Anda membuka formulir.',
          isConflict: true,
          currentVersion: student.version,
        },
        { status: 409 }
      );
    }

    let reporterRole = 'Dosen';
    if (user.role === 'ADMIN') reporterRole = 'Administrator Prodi';
    else if (user.role === 'KAPRODI') reporterRole = 'Ketua / Tim Pemantauan Prodi';
    else if (access.isPrimary) reporterRole = 'Pembimbing Utama';
    else if (access.isSupervisor) reporterRole = 'Pembimbing Pendamping';

    const nowJakartaStr = getJakartaDateTimeString();
    const todayJakartaDate = getJakartaDateString();

    // Create report with isNoChange: true
    // SubstantiveProgressDate stays UNCHANGED!
    const report = await prisma.progressReport.create({
      data: {
        studentId: id,
        reporterId: user.id,
        reporterName: user.name,
        reporterRole,
        tglLaporan: nowJakartaStr,
        tglKondisi: todayJakartaDate,
        substantiveProgressDate: student.tglKemajuanSubstantif, // UNCHANGED
        isNoChange: true,
        noChangeReason: noChangeReason.trim(),
        noChangeNextPlan: noChangeNextPlan.trim(),
        ringkasanKemajuan: `Konfirmasi belum ada perubahan kemajuan: ${noChangeReason.trim()}`,
        hambatanUtama: noChangeReason.trim(),
        tindakanBerikutnya: noChangeNextPlan.trim(),
        penanggungJawabTindakan: user.name,
        targetTindakLanjut: null,
        kebutuhanBantuanProdi: false,
      },
    });

    // Re-evaluate attention status (reporting date is updated to today, but substantive date remains old!)
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

    const attention = evaluateAttentionStatus({
      statusAkademik: student.statusAkademik,
      semester: semCalc.semester,
      tglLaporanTerakhir: todayJakartaDate,
      tglKemajuanSubstantif: student.tglKemajuanSubstantif, // Old date preserved!
      kebutuhanBantuanProdi: student.followUps.some((f) => f.status !== 'selesai'),
      targetTahapanTerlewati: false,
      tahapUtama: student.tahapUtama,
      hasJudul: !!student.judulSkripsi,
      rules: {
        reminderReportDays,
        reminderSubstantiveDays,
        studyPeriodSemesterThreshold: studyPeriodThreshold,
      },
    });

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        tglLaporanTerakhir: todayJakartaDate,
        // tglKemajuanSubstantif NOT updated!
        statusPerhatian: attention.status,
        alasanPerhatian: attention.reasons.join('; '),
        version: student.version + 1,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'REPORT',
      entity: 'Student',
      entityId: id,
      details: `Konfirmasi 'Belum Ada Perubahan' untuk mahasiswa ${student.nama} (${student.nim}). Tanggal laporan diperbarui, tanggal substantif tetap dipertahankan.`,
    });

    return NextResponse.json({
      success: true,
      message: `Konfirmasi 'Belum Ada Perubahan' berhasil dicatat untuk ${student.nama}. Tanggal laporan diperbarui tanpa mengubah riwayat kemajuan substantif.`,
      data: {
        report,
        student: updatedStudent,
        newVersion: updatedStudent.version,
      },
    });
  } catch (error: any) {
    console.error('Error submitting no-change report:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan status.' }, { status: 500 });
  }
}
