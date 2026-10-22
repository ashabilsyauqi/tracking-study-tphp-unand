'use client';

import React, { useState } from 'react';
import { Info, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface BreakdownItem {
  stageKey: string;
  stageName: string;
  weight: number;
  earned: number;
  status: string;
}

interface Props {
  percentage: number;
  breakdown: BreakdownItem[];
  formulaDescription: string;
  initiallyOpen?: boolean;
}

export default function ProgressEstimator({
  percentage,
  breakdown = [],
  formulaDescription,
  initiallyOpen = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800">
              Estimasi Berdasarkan Tahapan
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              Fitur Indikator Opsional
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Perhitungan bobot administratif milestone skripsi mahasiswa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold text-unand-800">{percentage}%</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"
            title="Lihat rincian rumus & bobot"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
        <div
          className="bg-unand-800 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Expandable Breakdown and Formula */}
      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-3 animate-in fade-in duration-200">
          <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Peringatan Penting:</strong> {formulaDescription}
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-800 block mb-1.5 text-[11px]">
              Tabel Pembobotan Tahapan:
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border border-slate-200 rounded">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="py-1.5 px-2 text-left font-semibold">Tahapan</th>
                    <th className="py-1.5 px-2 text-center font-semibold">Bobot Maks</th>
                    <th className="py-1.5 px-2 text-center font-semibold">Status Saat Ini</th>
                    <th className="py-1.5 px-2 text-right font-semibold">Capaian Bobot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdown.map((item) => (
                    <tr key={item.stageKey} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2">{item.stageName}</td>
                      <td className="py-1.5 px-2 text-center font-mono">{item.weight}%</td>
                      <td className="py-1.5 px-2 text-center capitalize text-slate-500">
                        {item.status.replace(/_/g, ' ')}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-unand-800 font-mono">
                        {item.earned}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-1.5 px-2">Total Estimasi Capaian</td>
                    <td className="py-1.5 px-2 text-center font-mono">100%</td>
                    <td></td>
                    <td className="py-1.5 px-2 text-right text-unand-800 font-mono">{percentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
