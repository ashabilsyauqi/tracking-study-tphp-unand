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

    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ data: settingsMap, raw: settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Gagal mengambil pengaturan.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Administrator yang dapat mengubah pengaturan sistem.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { settings = {} } = body;

    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'Setting',
      details: `Memperbarui konfigurasi sistem (${Object.keys(settings).join(', ')})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Pengaturan sistem berhasil diperbarui.',
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan pengaturan.' }, { status: 500 });
  }
}
