import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const demoCount = await prisma.student.count({
      where: { isDemo: true, isArchived: false },
    });

    const operationalCount = await prisma.student.count({
      where: { isDemo: false, isArchived: false },
    });

    return NextResponse.json({
      demoCount,
      operationalCount,
      totalCount: demoCount + operationalCount,
    });
  } catch (error: any) {
    console.error('Error fetching demo status:', error);
    return NextResponse.json({ error: 'Gagal memeriksa status demo.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Administrator yang berwenang mengelola data demonstrasi.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body; // 'reset' or 'clear'

    if (action === 'clear') {
      const deleted = await prisma.student.deleteMany({
        where: { isDemo: true },
      });

      await logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'DELETE',
        entity: 'DemoData',
        details: `Menghapus seluruh ${deleted.count} data mahasiswa demonstrasi. Data operasional tetap aman.`,
      });

      return NextResponse.json({
        success: true,
        message: `${deleted.count} data mahasiswa demonstrasi berhasil dibersihkan.`,
      });
    }

    if (action === 'reset') {
      // Re-run seed logic for demo students
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('node prisma/seed.js', (err: any, stdout: string) => {
          if (err) reject(err);
          else resolve(stdout);
        });
      });

      await logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'SEED',
        entity: 'DemoData',
        details: 'Mereset ulang 30 data mahasiswa demonstrasi.',
      });

      return NextResponse.json({
        success: true,
        message: '30 data mahasiswa demonstrasi berhasil direset ulang sesuai skenario pengujian.',
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling demo data action:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses data demonstrasi.' }, { status: 500 });
  }
}
