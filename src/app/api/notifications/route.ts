import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const where: any = {
      OR: [
        { targetRole: 'ALL' },
        { targetRole: user.role },
        { userId: user.id },
      ],
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Gagal memuat notifikasi.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          OR: [{ targetRole: 'ALL' }, { targetRole: user.role }, { userId: user.id }],
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca.' });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Parameter tidak valid.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Gagal memperbarui notifikasi.' }, { status: 500 });
  }
}
