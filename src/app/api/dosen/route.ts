import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const lecturers = await prisma.lecturer.findMany({
      where: search
        ? {
            OR: [
              { namaGelar: { contains: search } },
              { nip: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: {
            mahasiswaUtama: { where: { isArchived: false, statusAkademik: 'aktif' } },
            mahasiswaPendamping: { where: { isArchived: false, statusAkademik: 'aktif' } },
          },
        },
      },
      orderBy: { namaGelar: 'asc' },
    });

    const formatted = lecturers.map((lec) => ({
      id: lec.id,
      nip: lec.nip,
      namaGelar: lec.namaGelar,
      email: lec.email,
      noHp: lec.noHp,
      bidangKeahlian: lec.bidangKeahlian,
      isActive: lec.isActive,
      totalBimbinganUtama: lec._count.mahasiswaUtama,
      totalBimbinganPendamping: lec._count.mahasiswaPendamping,
      totalBeban: lec._count.mahasiswaUtama + lec._count.mahasiswaPendamping,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    console.error('Error fetching lecturers:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dosen.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Administrator yang dapat menambah dosen.' }, { status: 403 });
    }

    const body = await req.json();
    const { nip, namaGelar, email, noHp, bidangKeahlian } = body;

    if (!namaGelar || !namaGelar.trim()) {
      return NextResponse.json({ error: 'Nama dan gelar dosen wajib diisi.' }, { status: 400 });
    }

    const lecturer = await prisma.lecturer.create({
      data: {
        nip: nip?.trim() || null,
        namaGelar: namaGelar.trim(),
        email: email?.trim() || null,
        noHp: noHp?.trim() || null,
        bidangKeahlian: bidangKeahlian?.trim() || null,
        isActive: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE',
      entity: 'Lecturer',
      entityId: lecturer.id,
      details: `Menambahkan dosen baru: ${lecturer.namaGelar}`,
    });

    return NextResponse.json({
      success: true,
      data: lecturer,
      message: `Dosen ${lecturer.namaGelar} berhasil ditambahkan.`,
    });
  } catch (error: any) {
    console.error('Error creating lecturer:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan dosen.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Administrator yang dapat mengubah data dosen.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, nip, namaGelar, email, noHp, bidangKeahlian, isActive } = body;

    if (!id || !namaGelar) {
      return NextResponse.json({ error: 'ID dan Nama Dosen wajib diisi.' }, { status: 400 });
    }

    const updated = await prisma.lecturer.update({
      where: { id },
      data: {
        nip: nip !== undefined ? (nip ? nip.trim() : null) : undefined,
        namaGelar: namaGelar.trim(),
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        noHp: noHp !== undefined ? (noHp ? noHp.trim() : null) : undefined,
        bidangKeahlian: bidangKeahlian !== undefined ? bidangKeahlian.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'Lecturer',
      entityId: id,
      details: `Pembaruan data dosen ${updated.namaGelar}`,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Data dosen ${updated.namaGelar} berhasil diperbarui.`,
    });
  } catch (error: any) {
    console.error('Error updating lecturer:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui dosen.' }, { status: 500 });
  }
}
