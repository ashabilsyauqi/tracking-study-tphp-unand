import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Administrator yang berwenang memulihkan data.' }, { status: 403 });
    }

    const body = await req.json();
    const { backupContent } = body;

    if (!backupContent || !backupContent.data) {
      return NextResponse.json({ error: 'Format berkas cadangan tidak valid.' }, { status: 400 });
    }

    const { settings = [], lecturers = [], students = [] } = backupContent.data;

    // Restore Settings
    for (const s of settings) {
      if (s.key && s.value) {
        await prisma.setting.upsert({
          where: { key: s.key },
          update: { value: s.value, description: s.description },
          create: { key: s.key, value: s.value, description: s.description },
        });
      }
    }

    // Restore Lecturers
    for (const lec of lecturers) {
      if (lec.namaGelar) {
        await prisma.lecturer.upsert({
          where: { id: lec.id },
          update: {
            nip: lec.nip,
            namaGelar: lec.namaGelar,
            email: lec.email,
            noHp: lec.noHp,
            bidangKeahlian: lec.bidangKeahlian,
            isActive: lec.isActive !== undefined ? lec.isActive : true,
          },
          create: {
            id: lec.id,
            nip: lec.nip,
            namaGelar: lec.namaGelar,
            email: lec.email,
            noHp: lec.noHp,
            bidangKeahlian: lec.bidangKeahlian,
            isActive: lec.isActive !== undefined ? lec.isActive : true,
          },
        });
      }
    }

    // Restore Students
    for (const std of students) {
      if (std.nim && std.nama) {
        await prisma.student.upsert({
          where: { nim: std.nim },
          update: {
            nama: std.nama,
            angkatan: std.angkatan,
            statusAkademik: std.statusAkademik,
            semesterManual: std.semesterManual,
            semesterCuti: std.semesterCuti,
            pembimbingUtamaId: std.pembimbingUtamaId,
            pembimbingPendampingId: std.pembimbingPendampingId,
            tglPenetapanPembimbing: std.tglPenetapanPembimbing,
            judulSkripsi: std.judulSkripsi,
            bidangPenelitian: std.bidangPenelitian,
            tglMulaiTugasAkhir: std.tglMulaiTugasAkhir,
            targetSelesai: std.targetSelesai,
            statusPerhatian: std.statusPerhatian,
            alasanPerhatian: std.alasanPerhatian,
            tahapUtama: std.tahapUtama,
            tglLaporanTerakhir: std.tglLaporanTerakhir,
            tglKemajuanSubstantif: std.tglKemajuanSubstantif,
            isDemo: Boolean(std.isDemo),
            isArchived: Boolean(std.isArchived),
            version: std.version || 1,
          },
          create: {
            id: std.id,
            nim: std.nim,
            nama: std.nama,
            angkatan: std.angkatan,
            statusAkademik: std.statusAkademik,
            semesterManual: std.semesterManual,
            semesterCuti: std.semesterCuti,
            pembimbingUtamaId: std.pembimbingUtamaId,
            pembimbingPendampingId: std.pembimbingPendampingId,
            tglPenetapanPembimbing: std.tglPenetapanPembimbing,
            judulSkripsi: std.judulSkripsi,
            bidangPenelitian: std.bidangPenelitian,
            tglMulaiTugasAkhir: std.tglMulaiTugasAkhir,
            targetSelesai: std.targetSelesai,
            statusPerhatian: std.statusPerhatian,
            alasanPerhatian: std.alasanPerhatian,
            tahapUtama: std.tahapUtama,
            tglLaporanTerakhir: std.tglLaporanTerakhir,
            tglKemajuanSubstantif: std.tglKemajuanSubstantif,
            isDemo: Boolean(std.isDemo),
            isArchived: Boolean(std.isArchived),
            version: std.version || 1,
          },
        });
      }
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RESTORE',
      entity: 'SystemBackup',
      details: `Pemulihan data cadangan berhasil diproses (${students.length} data mahasiswa).`,
    });

    return NextResponse.json({
      success: true,
      message: 'Pemulihan data cadangan berhasil diselesaikan.',
    });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: error.message || 'Gagal memulihkan cadangan.' }, { status: 500 });
  }
}
