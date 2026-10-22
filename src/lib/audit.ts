import prisma from './prisma';

export interface AuditParams {
  userId?: string | null;
  userName?: string;
  userRole?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'EXPORT' | 'REPORT' | 'LOGIN' | 'RESTORE' | 'SEED';
  entity: string;
  entityId?: string | null;
  details?: string;
  alasanPerubahan?: string;
  ipAddress?: string;
}

export async function logAudit(params: AuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userName: params.userName || 'Sistem',
        userRole: params.userRole || 'SYSTEM',
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: params.details || null,
        alasanPerubahan: params.alasanPerubahan || null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Gagal mencatat audit log:', error);
  }
}
