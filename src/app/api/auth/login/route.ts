import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, quickLoginRole, quickLoginUserId } = body;

    let user;

    // Fast-login feature for convenient testing and role switching
    if (quickLoginUserId) {
      user = await prisma.user.findUnique({
        where: { id: quickLoginUserId },
        include: { lecturer: true },
      });
    } else if (quickLoginRole) {
      user = await prisma.user.findFirst({
        where: { role: quickLoginRole, isActive: true },
        include: { lecturer: true },
      });
    } else {
      if (!username || !password) {
        return NextResponse.json(
          { error: 'Username dan kata sandi wajib diisi.' },
          { status: 400 }
        );
      }

      user = await prisma.user.findFirst({
        where: {
          OR: [{ username: username }, { email: username }],
        },
        include: { lecturer: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Username atau kata sandi tidak valid.' },
          { status: 401 }
        );
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Username atau kata sandi tidak valid.' },
          { status: 401 }
        );
      }
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Akun dinonaktifkan atau tidak ditemukan.' },
        { status: 403 }
      );
    }

    const sessionPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'KAPRODI' | 'DOSEN',
      lecturerId: user.lecturerId,
    };

    const token = signToken(sessionPayload);

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: `Pengguna ${user.name} (${user.role}) berhasil masuk ke sistem.`,
    });

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      message: `Selamat datang, ${user.name}!`,
    });

    // Set cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Error saat login:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat proses masuk.' },
      { status: 500 }
    );
  }
}
