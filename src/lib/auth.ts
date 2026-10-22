import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'tphp-unand-studytrack-supersecret-jwt-key-2025';
const COOKIE_NAME = 'tphp_session';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: 'ADMIN' | 'KAPRODI' | 'DOSEN';
  lecturerId: string | null;
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      lecturerId: user.lecturerId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Optional check in DB to ensure user is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, name: true, email: true, role: true, lecturerId: true, isActive: true },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'KAPRODI' | 'DOSEN',
      lecturerId: user.lecturerId,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if current user has permission to view a specific student.
 * Lecturers can only access their own supervised students (as primary or co-advisor).
 * Admin and Kaprodi can access all students.
 */
export async function canAccessStudent(
  user: SessionUser,
  studentId: string
): Promise<{ allowed: boolean; isSupervisor: boolean; isPrimary: boolean; reason?: string }> {
  if (user.role === 'ADMIN' || user.role === 'KAPRODI') {
    return { allowed: true, isSupervisor: false, isPrimary: false };
  }

  if (user.role === 'DOSEN') {
    if (!user.lecturerId) {
      return { allowed: false, isSupervisor: false, isPrimary: false, reason: 'Akun dosen belum ditautkan dengan data dosen.' };
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, pembimbingUtamaId: true, pembimbingPendampingId: true },
    });

    if (!student) {
      return { allowed: false, isSupervisor: false, isPrimary: false, reason: 'Mahasiswa tidak ditemukan.' };
    }

    const isPrimary = student.pembimbingUtamaId === user.lecturerId;
    const isCo = student.pembimbingPendampingId === user.lecturerId;

    if (isPrimary || isCo) {
      return { allowed: true, isSupervisor: true, isPrimary };
    }

    return {
      allowed: false,
      isSupervisor: false,
      isPrimary: false,
      reason: 'Akses ditolak: Anda bukan dosen pembimbing utama maupun pendamping untuk mahasiswa ini.',
    };
  }

  return { allowed: false, isSupervisor: false, isPrimary: false, reason: 'Peran pengguna tidak memiliki hak akses.' };
}

export { COOKIE_NAME };
