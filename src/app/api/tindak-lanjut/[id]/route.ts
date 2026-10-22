import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getJakartaDateString } from '@/lib/timezone';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const {
      status,
      hasilTindakLanjut,
      tglEvaluasiBerikutnya,
      tindakanDisepakati,
      penanggungJawab,
      tenggat,
    } = body;

    const existing = await prisma.followUpAction.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data tindak lanjut tidak ditemukan.' }, { status: 404 });
    }

    const isResolving = status === 'selesai' && existing.status !== 'selesai';

    const updated = await prisma.followUpAction.update({
      where: { id },
      data: {
        status: status || existing.status,
        hasilTindakLanjut: hasilTindakLanjut !== undefined ? hasilTindakLanjut : existing.hasilTindakLanjut,
        tglEvaluasiBerikutnya: tglEvaluasiBerikutnya !== undefined ? tglEvaluasiBerikutnya : existing.tglEvaluasiBerikutnya,
        tindakanDisepakati: tindakanDisepakati !== undefined ? tindakanDisepakati : existing.tindakanDisepakati,
        penanggungJawab: penanggungJawab !== undefined ? penanggungJawab : existing.penanggungJawab,
        tenggat: tenggat !== undefined ? tenggat : existing.tenggat,
        resolvedAt: isResolving ? getJakartaDateString() : existing.resolvedAt,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'FollowUpAction',
      entityId: id,
      details: `Pembaruan status tindak lanjut mahasiswa ${existing.student.nama} menjadi '${status}'. Hasil: ${hasilTindakLanjut || '-'}`,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: status === 'selesai' ? 'Tindak lanjut berhasil ditandai selesai.' : 'Data tindak lanjut berhasil diperbarui.',
    });
  } catch (error: any) {
    console.error('Error updating follow up:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui tindak lanjut.' }, { status: 500 });
  }
}
