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
        { error: access.reason || 'Akses ditolak: Anda tidak memiliki wewenang untuk melaporkan mahasiswa ini.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      expectedVersion,
      tglKondisi = getJakartaDateString(),
      substantiveProgressDate = getJakartaDateString(),
      ringkasanKemajuan,
      tglBimbinganTerakhir,
      hambatanUtama,
      tindakanBerikutnya,
      penanggungJawabTindakan,
      targetTindakLanjut,
      kebutuhanBantuanProdi = false,
      kebutuhanBantuanCatatan,
      stageUpdates = [],
      chapterUpdates = [],
      tahapUtamaBaru,
      isRetrospektif = false,
    } = body;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        stages: true,
        chapters: true,
        pembimbingUtama: true,
        pembimbingPendamping: true,
        reports: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student || student.isArchived) {
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 });
    }

    // Concurrency Conflict Detection:
    // If another supervisor edited while this user was filling the form:
    if (expectedVersion !== undefined && student.version !== expectedVersion) {
      const latestReport = student.reports[0];
      return NextResponse.json(
        {
          error: 'Peringatan Konflik Data: Data mahasiswa telah diperbarui oleh pengguna lain sesaat yang lalu.',
          isConflict: true,
          currentVersion: student.version,
          latestReport: latestReport
            ? {
                reporterName: latestReport.reporterName,
                reporterRole: latestReport.reporterRole,
                tglLaporan: latestReport.tglLaporan,
                ringkasan: latestReport.ringkasanKemajuan,
                hambatan: latestReport.hambatanUtama,
                tindakan: latestReport.tindakanBerikutnya,
              }
            : null,
          currentStudent: {
            tglLaporanTerakhir: student.tglLaporanTerakhir,
            tglKemajuanSubstantif: student.tglKemajuanSubstantif,
            stages: student.stages,
            chapters: student.chapters,
          },
        },
        { status: 409 }
      );
    }

    // Determine reporter role
    let reporterRole = 'Dosen';
    if (user.role === 'ADMIN') reporterRole = 'Administrator Prodi';
    else if (user.role === 'KAPRODI') reporterRole = 'Ketua / Tim Pemantauan Prodi';
    else if (access.isPrimary) reporterRole = 'Pembimbing Utama';
    else if (access.isSupervisor) reporterRole = 'Pembimbing Pendamping';

    const nowJakartaStr = getJakartaDateTimeString();

    // 1. Create Progress Report record
    const report = await prisma.progressReport.create({
      data: {
        studentId: id,
        reporterId: user.id,
        reporterName: user.name,
        reporterRole,
        tglLaporan: nowJakartaStr,
        tglKondisi,
        substantiveProgressDate,
        isNoChange: false,
        ringkasanKemajuan: ringkasanKemajuan?.trim() || null,
        tglBimbinganTerakhir: tglBimbinganTerakhir || null,
        hambatanUtama: hambatanUtama?.trim() || 'Tidak ada hambatan signifikan.',
        tindakanBerikutnya: tindakanBerikutnya?.trim() || 'Melanjutkan sesuai jadwal pembimbingan.',
        penanggungJawabTindakan: penanggungJawabTindakan?.trim() || user.name,
        targetTindakLanjut: targetTindakLanjut || null,
        kebutuhanBantuanProdi: Boolean(kebutuhanBantuanProdi),
        kebutuhanBantuanCatatan: kebutuhanBantuanCatatan?.trim() || null,
        isRetrospektif: Boolean(isRetrospektif),
      },
    });

    // 2. Update Student Stages if provided
    if (Array.isArray(stageUpdates) && stageUpdates.length > 0) {
      for (const stg of stageUpdates) {
        if (!stg.stageKey) continue;
        await prisma.studentStage.upsert({
          where: {
            id: stg.id || 'non-existent-id',
          },
          update: {
            status: stg.status,
            tglMulai: stg.tglMulai || undefined,
            targetSelesai: stg.targetSelesai || undefined,
            tglSelesaiAktual: stg.tglSelesaiAktual || undefined,
            catatan: stg.catatan || undefined,
          },
          create: {
            studentId: id,
            stageKey: stg.stageKey,
            stageName: stg.stageName || stg.stageKey,
            status: stg.status,
            tglMulai: stg.tglMulai || null,
            targetSelesai: stg.targetSelesai || null,
            tglSelesaiAktual: stg.tglSelesaiAktual || null,
            catatan: stg.catatan || null,
          },
        });
      }
    }

    // 3. Update Thesis Chapters if provided
    if (Array.isArray(chapterUpdates) && chapterUpdates.length > 0) {
      for (const ch of chapterUpdates) {
        if (!ch.chapterNum) continue;
        const existingCh = await prisma.thesisChapterProgress.findFirst({
          where: { studentId: id, chapterNum: ch.chapterNum },
        });

        if (existingCh) {
          await prisma.thesisChapterProgress.update({
            where: { id: existingCh.id },
            data: {
              status: ch.status,
              tglDraf: ch.status !== 'belum_dimulai' ? ch.tglDraf || getJakartaDateString() : undefined,
              tglDisetujui: ch.status === 'disetujui' ? ch.tglDisetujui || getJakartaDateString() : undefined,
              catatan: ch.catatan !== undefined ? ch.catatan : existingCh.catatan,
            },
          });
        }
      }
    }

    // 4. If assistance requested from prodi -> create follow up item and notification
    if (kebutuhanBantuanProdi) {
      await prisma.followUpAction.create({
        data: {
          studentId: id,
          masalah: hambatanUtama || 'Dosen meminta intervensi / bantuan prodi.',
          tindakanDisepakati: tindakanBerikutnya || 'Koordinasi tindak lanjut prodi.',
          penanggungJawab: penanggungJawabTindakan || 'Ketua Prodi / Tim Pemantauan',
          tenggat: targetTindakLanjut || getJakartaDateString(),
          status: 'terbuka',
          createdByName: `${user.name} (${reporterRole})`,
        },
      });

      await prisma.notification.create({
        data: {
          title: `Bantuan Prodi Dibutuhkan: ${student.nama}`,
          message: `${user.name} (${reporterRole}) melaporkan kebutuhan intervensi prodi untuk mahasiswa ${student.nama} (${student.nim}). Hambatan: "${hambatanUtama || '-'}"`,
          type: 'assistance_request',
          targetRole: 'KAPRODI',
          linkUrl: `/mahasiswa/${student.id}`,
        },
      });
    }

    // 5. Re-evaluate Attention Status
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
      tglLaporanTerakhir: nowJakartaStr.split(' ')[0],
      tglKemajuanSubstantif: substantiveProgressDate,
      kebutuhanBantuanProdi: Boolean(kebutuhanBantuanProdi),
      targetTahapanTerlewati: false,
      tahapUtama: tahapUtamaBaru || student.tahapUtama,
      hasJudul: !!student.judulSkripsi,
      rules: {
        reminderReportDays,
        reminderSubstantiveDays,
        studyPeriodSemesterThreshold: studyPeriodThreshold,
      },
    });

    // 6. Update student metadata and increment version
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        tglLaporanTerakhir: nowJakartaStr.split(' ')[0],
        tglKemajuanSubstantif: substantiveProgressDate,
        tahapUtama: tahapUtamaBaru || student.tahapUtama,
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
      details: `Pelaporan kemajuan mahasiswa ${student.nama} (${student.nim}) oleh ${user.name}. Status perhatian baru: ${attention.label}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Laporan kemajuan mahasiswa ${student.nama} berhasil disimpan dalam waktu singkat!`,
      data: {
        report,
        student: updatedStudent,
        newVersion: updatedStudent.version,
      },
    });
  } catch (error: any) {
    console.error('Error submitting progress report:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan laporan kemajuan.' }, { status: 500 });
  }
}
