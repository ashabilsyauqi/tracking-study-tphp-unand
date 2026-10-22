import { diffDays } from './timezone';

export interface AttentionResult {
  status: 'sesuai_rencana' | 'perlu_pembaruan' | 'perlu_perhatian' | 'prioritas' | 'belum_cukup_data';
  label: string;
  badgeColor: string; // Tailwind color class
  reasons: string[];
  isOverdueTarget: boolean;
  daysSinceLastReport: number | null;
  daysSinceLastSubstantive: number | null;
}

/**
 * Calculates current semester based on cohort year, current year, active semester type, and leave semesters.
 * Also returns calculation explanation formula for transparency.
 */
export function calculateSemester(
  angkatan: number,
  semesterManual?: number | null,
  semesterCuti: number = 0,
  currentYear: number = 2025,
  semesterType: 'ganjil' | 'genap' = 'genap'
): { semester: number; basis: string; isManual: boolean } {
  if (semesterManual && semesterManual > 0) {
    return {
      semester: semesterManual,
      basis: `Ditentukan secara manual oleh Administrator (${semesterManual} semester, tercatat cuti: ${semesterCuti} semester).`,
      isManual: true,
    };
  }

  // Automatic calculation formula:
  // Base = (currentYear - angkatan) * 2 + (semesterType === 'genap' ? 0 : -1)
  // Minus cuti
  const yearDiff = currentYear - angkatan;
  const rawSemester = yearDiff * 2 + (semesterType === 'genap' ? 0 : -1);
  const calculated = Math.max(1, rawSemester - semesterCuti);

  const basis = `Dihitung otomatis: (Tahun Aktif ${currentYear} - Angkatan ${angkatan}) × 2 ${
    semesterType === 'genap' ? '+ 0 (Semester Genap)' : '- 1 (Semester Ganjil)'
  } - ${semesterCuti} Cuti = ${calculated}`;

  return {
    semester: calculated,
    basis,
    isManual: false,
  };
}

/**
 * Evaluates attention status and priority based on prodi configurable rules:
 * - Pengingat laporan: belum ada pembaruan selama reminderReportDays (default 30)
 * - Perlu ditinjau: belum ada kemajuan substantif selama reminderSubstantiveDays (default 60)
 * - Target terlewati: target tahapan lewat dan belum selesai
 * - Perhatian masa studi: semester >= studyPeriodThreshold (default 8)
 * - Butuh bantuan: dosen menandai kebutuhan intervensi prodi
 * - Cuti students are exempted from punitive active alerts.
 */
export function evaluateAttentionStatus(params: {
  statusAkademik: string;
  semester: number;
  tglLaporanTerakhir?: string | null;
  tglKemajuanSubstantif?: string | null;
  kebutuhanBantuanProdi?: boolean;
  targetTahapanTerlewati?: boolean;
  tahapUtama?: string;
  hasJudul?: boolean;
  rules?: {
    reminderReportDays?: number;
    reminderSubstantiveDays?: number;
    studyPeriodSemesterThreshold?: number;
  };
}): AttentionResult {
  const {
    statusAkademik,
    semester,
    tglLaporanTerakhir,
    tglKemajuanSubstantif,
    kebutuhanBantuanProdi = false,
    targetTahapanTerlewati = false,
    tahapUtama,
    hasJudul = true,
    rules = {},
  } = params;

  const reportDaysLimit = rules.reminderReportDays ?? 30;
  const substantiveDaysLimit = rules.reminderSubstantiveDays ?? 60;
  const semesterThreshold = rules.studyPeriodSemesterThreshold ?? 8;

  const daysSinceReport = diffDays(tglLaporanTerakhir);
  const daysSinceSubstantive = diffDays(tglKemajuanSubstantif);

  const reasons: string[] = [];

  // Special cases:
  if (statusAkademik === 'lulus') {
    return {
      status: 'sesuai_rencana',
      label: 'Lulus',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      reasons: ['Mahasiswa telah menyelesaikan studi.'],
      isOverdueTarget: false,
      daysSinceLastReport: daysSinceReport,
      daysSinceLastSubstantive: daysSinceSubstantive,
    };
  }

  if (statusAkademik === 'cuti') {
    return {
      status: 'sesuai_rencana',
      label: 'Cuti Akademik',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      reasons: ['Mahasiswa berstatus cuti resmi; dikecualikan dari peringatan aktif.'],
      isOverdueTarget: false,
      daysSinceLastReport: daysSinceReport,
      daysSinceLastSubstantive: daysSinceSubstantive,
    };
  }

  if (!tglLaporanTerakhir && !tglKemajuanSubstantif) {
    reasons.push('Belum pernah ada pelaporan kemajuan dari dosen.');
    return {
      status: 'belum_cukup_data',
      label: 'Belum Cukup Data',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      reasons,
      isOverdueTarget: false,
      daysSinceLastReport: null,
      daysSinceLastSubstantive: null,
    };
  }

  // Critical indicators (PRIORITAS PENDAMPINGAN)
  let isPriority = false;
  if (kebutuhanBantuanProdi) {
    isPriority = true;
    reasons.push('Dosen pembimbing menandai kebutuhan intervensi/bantuan prodi.');
  }

  if (semester >= semesterThreshold + 2) {
    // E.g. semester 10+ or 12+
    isPriority = true;
    reasons.push(`Masa studi mencapai semester ${semester} (ambang kritis prodi).`);
  }

  if (!hasJudul && semester >= semesterThreshold) {
    isPriority = true;
    reasons.push(`Mahasiswa semester ${semester} belum memiliki judul skripsi definitif.`);
  }

  if (isPriority) {
    if (targetTahapanTerlewati) {
      reasons.push('Target tahapan studi telah melewati tenggat jadwal.');
    }
    if (daysSinceSubstantive !== null && daysSinceSubstantive > substantiveDaysLimit) {
      reasons.push(`Belum ada kemajuan substantif selama ${daysSinceSubstantive} hari (ambang: ${substantiveDaysLimit} hari).`);
    }
    return {
      status: 'prioritas',
      label: 'Prioritas Pendampingan',
      badgeColor: 'bg-red-100 text-red-800 border-red-300',
      reasons,
      isOverdueTarget: targetTahapanTerlewati,
      daysSinceLastReport: daysSinceReport,
      daysSinceLastSubstantive: daysSinceSubstantive,
    };
  }

  // Attention indicators (PERLU PERHATIAN)
  let isAttention = false;
  if (daysSinceSubstantive !== null && daysSinceSubstantive > substantiveDaysLimit) {
    isAttention = true;
    reasons.push(`Belum ada kemajuan substantif selama ${daysSinceSubstantive} hari (ambang prodi ${substantiveDaysLimit} hari).`);
  }

  if (targetTahapanTerlewati) {
    isAttention = true;
    reasons.push('Target penyelesaian tahapan studi terlewati.');
  }

  if (semester >= semesterThreshold) {
    isAttention = true;
    reasons.push(`Semester studi (${semester}) mencapai batas pemantauan intensif (>= ${semesterThreshold}).`);
  }

  if (isAttention) {
    return {
      status: 'perlu_perhatian',
      label: 'Perlu Perhatian',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      reasons,
      isOverdueTarget: targetTahapanTerlewati,
      daysSinceLastReport: daysSinceReport,
      daysSinceLastSubstantive: daysSinceSubstantive,
    };
  }

  // Reporting delay only (PERLU PEMBARUAN LAPORAN)
  // Prompt principle: "Pisahkan keterlambatan laporan dari keterlambatan kemajuan studi. Laporan yang lama tidak cukup untuk menyimpulkan mahasiswa tidak berkembang."
  if (daysSinceReport !== null && daysSinceReport > reportDaysLimit) {
    reasons.push(`Laporan belum diperbarui selama ${daysSinceReport} hari (ambang: ${reportDaysLimit} hari). Kemajuan substantif tetap terpelihara.`);
    return {
      status: 'perlu_pembaruan',
      label: 'Perlu Pembaruan Laporan',
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      reasons,
      isOverdueTarget: false,
      daysSinceLastReport: daysSinceReport,
      daysSinceLastSubstantive: daysSinceSubstantive,
    };
  }

  // Default: SESUAI RENCANA
  reasons.push('Aktivitas dan pelaporan kemajuan berjalan sesuai linimasa rencana.');
  return {
    status: 'sesuai_rencana',
    label: 'Sesuai Rencana',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    reasons,
    isOverdueTarget: false,
    daysSinceLastReport: daysSinceReport,
    daysSinceLastSubstantive: daysSinceSubstantive,
  };
}

/**
 * Calculates estimated stage progress percentage with configurable weights.
 * Section 11: "Jika memakai persentase kemajuan, beri label 'Estimasi berdasarkan tahapan',
 * tampilkan rumus serta bobotnya, dan jadikan fitur opsional. Jangan menyamakan persentase tersebut
 * dengan peluang lulus atau mutu skripsi."
 */
export function calculateEstimatedProgress(
  stages: { stageKey: string; status: string }[],
  customWeights?: Record<string, number>
): {
  percentage: number;
  breakdown: { stageKey: string; stageName: string; weight: number; earned: number; status: string }[];
  formulaDescription: string;
} {
  const defaultWeights: Record<string, { name: string; weight: number }> = {
    penetapan_judul: { name: 'Penetapan Judul', weight: 10 },
    seminar_proposal: { name: 'Seminar Proposal', weight: 20 },
    penelitian: { name: 'Penelitian', weight: 25 },
    penulisan_skripsi: { name: 'Penulisan Skripsi', weight: 20 },
    seminar_hasil: { name: 'Seminar Hasil', weight: 10 },
    ujian_sarjana: { name: 'Ujian Sarjana', weight: 15 },
  };

  const breakdown = Object.entries(defaultWeights).map(([key, def]) => {
    const weight = customWeights && customWeights[key] !== undefined ? customWeights[key] : def.weight;
    const stageObj = stages.find((s) => s.stageKey === key);
    const status = stageObj ? stageObj.status : 'belum_dilaporkan';

    let earned = 0;
    if (status === 'selesai') {
      earned = weight;
    } else if (status === 'sedang_berjalan' || status === 'menunggu_jadwal') {
      earned = Math.round(weight * 0.5);
    } else {
      earned = 0;
    }

    return {
      stageKey: key,
      stageName: def.name,
      weight,
      earned,
      status,
    };
  });

  const totalEarned = breakdown.reduce((acc, curr) => acc + curr.earned, 0);
  const totalWeight = breakdown.reduce((acc, curr) => acc + curr.weight, 0);
  const percentage = Math.min(100, Math.round((totalEarned / (totalWeight || 100)) * 100));

  const formulaDescription =
    'Estimasi dihitung dari total bobot capaian tahapan: Selesai = 100% bobot tahapan, Sedang Berjalan/Menunggu = 50% bobot tahapan, Belum Dimulai/Belum Dilaporkan = 0%. Persentase ini semata perkiraan administratif tahapan dan tidak merefleksikan mutu ilmiah maupun kepastian kelulusan skripsi.';

  return {
    percentage,
    breakdown,
    formulaDescription,
  };
}
