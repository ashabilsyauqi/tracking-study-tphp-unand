'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

interface Props {
  status: string;
  label?: string;
  reasons?: string[] | string | null;
  size?: 'sm' | 'md' | 'lg';
  showReasonsPopover?: boolean;
}

export default function StatusBadge({
  status,
  label,
  reasons,
  size = 'md',
  showReasonsPopover = true,
}: Props) {
  const [showPopover, setShowPopover] = useState(false);

  let icon = <HelpCircle className="w-3.5 h-3.5" />;
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let defaultLabel = 'Belum Cukup Data';

  switch (status) {
    case 'sesuai_rencana':
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      defaultLabel = 'Sesuai Rencana';
      break;
    case 'perlu_pembaruan':
      icon = <Clock className="w-3.5 h-3.5 text-yellow-600" />;
      colorClasses = 'bg-yellow-50 text-yellow-800 border-yellow-200';
      defaultLabel = 'Perlu Pembaruan Laporan';
      break;
    case 'perlu_perhatian':
      icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      defaultLabel = 'Perlu Perhatian';
      break;
    case 'prioritas':
      icon = <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse" />;
      colorClasses = 'bg-red-50 text-red-800 border-red-300 font-medium';
      defaultLabel = 'Prioritas Pendampingan';
      break;
    case 'belum_cukup_data':
    default:
      icon = <HelpCircle className="w-3.5 h-3.5 text-slate-500" />;
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      defaultLabel = 'Belum Cukup Data';
      break;
  }

  const displayLabel = label || defaultLabel;

  // Parse reasons if array or string
  const reasonsList: string[] = Array.isArray(reasons)
    ? reasons
    : typeof reasons === 'string' && reasons
    ? reasons.split(';').map((r) => r.trim())
    : [];

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-sm px-3 py-1.5 gap-2'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        onClick={() => setShowPopover(!showPopover)}
        className={`inline-flex items-center rounded-full border shadow-xs cursor-pointer select-none transition-all hover:brightness-95 ${sizeClasses} ${colorClasses}`}
      >
        {icon}
        <span>{displayLabel}</span>
        {reasonsList.length > 0 && showReasonsPopover && (
          <Info className="w-3 h-3 text-current opacity-60 hover:opacity-100 ml-0.5" />
        )}
      </span>

      {showPopover && showReasonsPopover && reasonsList.length > 0 && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 bg-white text-slate-800 text-xs rounded-lg shadow-xl border border-slate-200 p-3 pointer-events-none transition-opacity">
          <div className="font-semibold text-slate-900 border-b pb-1 mb-1.5 flex items-center justify-between">
            <span>Alasan Status Penanda:</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100">
              {displayLabel}
            </span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            {reasonsList.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
          <div className="mt-2 pt-1 border-t text-[10px] text-slate-400 italic">
            *Penanda objektif aplikasi, bukan peringkat kinerja dosen atau vonis mahasiswa.
          </div>
        </div>
      )}
    </div>
  );
}
