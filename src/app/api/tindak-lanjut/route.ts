import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getJakartaDateString } from '@/lib/timezone';
import { calculateSemester } from '@/lib/calculations';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const bahanRapat = searchParams.get('bahanRapat') === 'true';

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (studentId) {
      where.studentId = studentId;
    }

    // Role filter: if dosen, only show follow-ups for students they advise
    if (user.role === 'DOSEN' && user.lecturerId) {
      where.student = {
        OR: [
          { pembimbingUtamaId: user.lecturerId },
          { pembimbingPendampingId: user.lecturerId },
        ],
      };
    }

    const items = await prisma.followUpAction.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nim: true,
            nama: true,
            angkatan: true,
            tahapUtama: true,
            statusPerhatian: true,
            alasanPerhatian: true,
            pembimbingUtama: { select: { namaGelar: true } },
            pembimbingPendamping: { select: { namaGelar: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { tenggat: 'asc' }],
    });

    // If requested for "Bahan Rapat Evaluasi", also gather priority students
    let priorityStudents: any[] = [];
    if (bahanRapat) {
      const rawStudents = await prisma.student.findMany({
        where: {
          isArchived: false,
          OR: [
            { statusPerhatian: 'prioritas' },
            { statusPerhatian: 'perlu_perhatian' },
            { followUps: { some: { status: { in: ['terbuka', 'sedang_ditangani'] } } } },
          ],
        },
        include: {
          pembimbingUtama: { select: { namaGelar: true } },
          pembimbingPendamping: { select: { namaGelar: true } },
          followUps: {
            where: { status: { in: ['terbuka', 'sedang_ditangani'] } },
          },
          reports: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          stages: true,
        },
        orderBy: [{ statusPerhatian: 'desc' }, { angkatan: 'asc' }],
      });

      priorityStudents = rawStudents.map((s) => {
        const sem = calculateSemester(s.angkatan, s.semesterManual, s.semesterCuti, 2025, 'genap');
        return {
          ...s,
          calculatedSemester: sem.semester,
        };
      });
    }

    return NextResponse.json({
      data: items,
      priorityStudents: bahanRapat ? priorityStudents : undefined,
    });
  } catch (error: any) {
    console.error('Error fetching follow ups:', error);
    return NextResponse.json({ error: 'Gagal mengambil data tindak lanjut.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const {
      studentId,
      masalah,
      tindakanDisepakati,
      penanggungJawab,
      tenggat,
      status = 'terbuka',
      tglEvaluasiBerikutnya,
    } = body;

    if (!studentId || !masalah || !tindakanDisepakati || !penanggungJawab || !tenggat) {
      return NextResponse.json(
        { error: 'Mahasiswa, masalah, tindakan yang disepakati, penanggung jawab, dan tenggat wajib diisi.' },
        { status: 400 }
      );
    }

    const item = await prisma.followUpAction.create({
      data: {
        studentId,
        masalah: masalah.trim(),
        tindakanDisepakati: tindakanDisepakati.trim(),
        penanggungJawab: penanggungJawab.trim(),
        tenggat,
        status,
        tglEvaluasiBerikutnya: tglEvaluasiBerikutnya || null,
        createdByName: user.name,
      },
      include: {
        student: {
          select: { nama: true, nim: true },
        },
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE',
      entity: 'FollowUpAction',
      entityId: item.id,
      details: `Membuat agenda tindak lanjut untuk ${item.student.nama}: "${item.tindakanDisepakati}" (PJ: ${item.penanggungJawab}).`,
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Agenda tindak lanjut berhasil dicatat.',
    });
  } catch (error: any) {
    console.error('Error creating follow up:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat tindak lanjut.' }, { status: 500 });
  }
}
