export interface UserSession {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: 'ADMIN' | 'KAPRODI' | 'DOSEN';
  lecturerId: string | null;
  lecturer?: {
    id: string;
    namaGelar: string;
    nip: string | null;
    email: string | null;
  } | null;
}

export interface Lecturer {
  id: string;
  nip: string | null;
  namaGelar: string;
  email: string | null;
  noHp: string | null;
  bidangKeahlian: string | null;
  isActive: boolean;
  totalBimbinganUtama?: number;
  totalBimbinganPendamping?: number;
  totalBeban?: number;
}

export interface StudentStage {
  id: string;
  studentId: string;
  stageKey: string;
  stageName: string;
  status: 'belum_dilaporkan' | 'belum_dimulai' | 'sedang_berjalan' | 'menunggu_jadwal' | 'selesai' | 'tertunda';
  tglMulai: string | null;
  targetSelesai: string | null;
  tglSelesaiAktual: string | null;
  catatan: string | null;
  isRetrospektif?: boolean;
}

export interface ThesisChapter {
  id: string;
  studentId: string;
  chapterNum: number;
  chapterName: string;
  status: 'belum_dimulai' | 'draf' | 'ditinjau_pembimbing' | 'revisi' | 'disetujui';
  tglDraf: string | null;
  tglRevisi: string | null;
  tglDisetujui: string | null;
  catatan: string | null;
}

export interface ProgressReport {
  id: string;
  studentId: string;
  reporterId: string;
  reporterName: string;
  reporterRole: string;
  tglLaporan: string;
  tglKondisi: string;
  substantiveProgressDate: string | null;
  isNoChange: boolean;
  noChangeReason?: string | null;
  noChangeNextPlan?: string | null;
  ringkasanKemajuan: string | null;
  tglBimbinganTerakhir: string | null;
  hambatanUtama: string | null;
  tindakanBerikutnya: string | null;
  penanggungJawabTindakan: string | null;
  targetTindakLanjut: string | null;
  kebutuhanBantuanProdi: boolean;
  kebutuhanBantuanCatatan: string | null;
  isRetrospektif?: boolean;
  createdAt: string;
}

export interface FollowUpAction {
  id: string;
  studentId: string;
  masalah: string;
  tindakanDisepakati: string;
  penanggungJawab: string;
  tenggat: string;
  status: 'terbuka' | 'sedang_ditangani' | 'selesai';
  hasilTindakLanjut?: string | null;
  tglEvaluasiBerikutnya?: string | null;
  createdByName: string;
  resolvedAt?: string | null;
  createdAt: string;
  student?: {
    id: string;
    nim: string;
    nama: string;
    angkatan: number;
    tahapUtama: string;
    statusPerhatian: string;
    alasanPerhatian?: string | null;
    pembimbingUtama?: { namaGelar: string } | null;
    pembimbingPendamping?: { namaGelar: string } | null;
  };
}

export interface AdvisorHistory {
  id: string;
  oldUtamaNama: string | null;
  oldPendampingNama: string | null;
  newUtamaNama: string | null;
  newPendampingNama: string | null;
  changeDate: string;
  reason: string;
  changedBy: string;
}

export interface TitleHistory {
  id: string;
  oldTitle: string | null;
  newTitle: string;
  statusJudul: string;
  changeDate: string;
  reason: string;
  changedBy: string;
}

export interface Student {
  id: string;
  nim: string;
  nama: string;
  angkatan: number;
  prodi: string;
  statusAkademik: 'aktif' | 'cuti' | 'lulus' | 'mengundurkan_diri' | 'lainnya';
  semesterManual: number | null;
  semesterCuti: number;
  calculatedSemester?: number;
  semesterBasis?: string;
  isSemesterManual?: boolean;
  pembimbingUtamaId: string | null;
  pembimbingPendampingId: string | null;
  pembimbingUtama?: Lecturer | null;
  pembimbingPendamping?: Lecturer | null;
  tglPenetapanPembimbing: string | null;
  judulSkripsi: string | null;
  bidangPenelitian: string | null;
  tglMulaiTugasAkhir: string | null;
  targetSelesai: string | null;
  email: string | null;
  noHp: string | null;
  catatanAdministratif: string | null;
  isDemo: boolean;
  isArchived: boolean;
  version: number;
  tglLaporanTerakhir: string | null;
  tglKemajuanSubstantif: string | null;
  statusPerhatian: 'sesuai_rencana' | 'perlu_pembaruan' | 'perlu_perhatian' | 'prioritas' | 'belum_cukup_data';
  alasanPerhatian: string | null;
  tahapUtama: string;
  lulusAdministratif: boolean;
  tglLulusAdministratif?: string | null;
  hasOverdueTarget?: boolean;
  activeActivities?: string[];
  stages: StudentStage[];
  chapters: ThesisChapter[];
  reports?: ProgressReport[];
  followUps?: FollowUpAction[];
  advisorHistory?: AdvisorHistory[];
  titleHistory?: TitleHistory[];
  computedAttention?: {
    status: string;
    label: string;
    badgeColor: string;
    reasons: string[];
    isOverdueTarget: boolean;
    daysSinceLastReport: number | null;
    daysSinceLastSubstantive: number | null;
  };
  estimatedProgress?: {
    percentage: number;
    breakdown: { stageKey: string; stageName: string; weight: number; earned: number; status: string }[];
    formulaDescription: string;
  };
}
