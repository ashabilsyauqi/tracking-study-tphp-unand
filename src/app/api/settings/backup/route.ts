import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getJakartaDateString } from '@/lib/timezone';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Administrator yang berwenang mengunduh cadangan.' }, { status: 403 });
    }

    // Export all major collections
    const settings = await prisma.setting.findMany();
    const lecturers = await prisma.lecturer.findMany();
    const students = await prisma.student.findMany({
      include: {
        stages: true,
        chapters: true,
        reports: true,
        followUps: true,
        advisorHistory: true,
        titleHistory: true,
      },
    });
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        lecturerId: true,
        isActive: true,
      },
    });

    const backupData = {
      app: 'TPHP StudyTrack',
      institution: 'Program Studi Teknologi Pangan dan Hasil Pertanian, FATETA, Universitas Andalas',
      backupDate: getJakartaDateString(),
      generatedBy: user.name,
      version: '1.0.0',
      data: {
        settings,
        lecturers,
        students,
        users,
      },
    };

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'EXPORT',
      entity: 'SystemBackup',
      details: 'Mengunduh berkas cadangan database JSON sistem.',
    });

    const jsonStr = JSON.stringify(backupData, null, 2);

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="TPHP_StudyTrack_Backup_${getJakartaDateString()}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating backup:', error);
    return NextResponse.json({ error: 'Gagal membuat berkas cadangan.' }, { status: 500 });
  }
}
