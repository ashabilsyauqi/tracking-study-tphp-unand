import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Get additional info like lecturer name
  let lecturer = null;
  if (user.lecturerId) {
    lecturer = await prisma.lecturer.findUnique({
      where: { id: user.lecturerId },
    });
  }

  return NextResponse.json({
    user: {
      ...user,
      lecturer,
    },
  });
}
