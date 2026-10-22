import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Administrator yang berwenang melihat log audit.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const action = searchParams.get('action');

    const where: any = {};
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true, role: true } },
      },
    });

    return NextResponse.json({ data: logs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Gagal memuat log audit.' }, { status: 500 });
  }
}
