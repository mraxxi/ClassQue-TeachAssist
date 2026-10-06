import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Receipt } from 'lucide-react';
import { TeachingSession, TeachingClaim, Teacher, Cohort } from '../../types';
import { localMonthStr } from '../../utils/date';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useTeacherStore } from '../../store/useTeacherStore';
import { claimStatusLabel } from '../../utils/i18n';

interface ClaimInvoiceModalProps {
  isOpen: boolean;
  claim: TeachingClaim | null;
  sessions: TeachingSession[];
  cohorts: Cohort[];
  teacher: Teacher;
  onClose: () => void;
}

export const ClaimInvoiceModal: React.FC<ClaimInvoiceModalProps> = ({
  isOpen,
  claim,
  sessions,
  cohorts,
  teacher,
  onClose,
}) => {
  useEscapeKey(onClose, isOpen);
  const { language } = useTeacherStore();
  const id = language === 'id';

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat(id ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: teacher.currency || 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const period = claim?.claimPeriod || localMonthStr();
  const claimNumber = claim?.claimNumber || `CLM-${period.replace('-', '')}-001`;

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const baseAmount = sessions.reduce((acc, s) => acc + s.totalClaimAmount, 0);
  const allowanceAmount = claim?.allowanceAmount || 0;
  const grandTotal = baseAmount + allowanceAmount;

  return createPortal(
    <div className="print-portal fixed inset-0 z-50 scrim backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="print-sheet bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-700" />
            <span className="text-sm font-extrabold text-stone-900">{id ? 'Lembar Klaim Honorarium Mengajar (A4)' : 'Teaching Claim Sheet (A4)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{id ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label={id ? 'Tutup' : 'Close'}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formal Printable Document Layout */}
        <div className="space-y-6 text-stone-900 font-sans">
          
          {/* Institutional Header */}
          <div className="border-b-2 border-stone-900 pb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">{teacher.schoolName || 'Garuda Language Academy'}</h1>
              <p className="text-xs text-stone-600 font-medium mt-0.5">{id ? 'Klaim Honorarium Mengajar Resmi' : 'Formal Teaching Claim (Honorarium)'}</p>
              <p className="text-[11px] text-stone-400 font-mono mt-0.5">{id ? 'ID Guru' : 'Teacher ID'}: {teacher.id} • {teacher.email}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal-900 text-teal-200 rounded-lg text-xs font-mono font-bold">
                REF: {claimNumber}
              </span>
              <p className="text-xs font-bold text-stone-700 mt-1">{id ? 'Periode Klaim' : 'Claim Period'}: {period}</p>
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 mt-1">
                STATUS: {claimStatusLabel(claim?.status || 'draft', language).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Teacher Summary Block */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">{id ? 'Nama Guru' : 'Teacher Name'}</span>
              <span className="font-extrabold text-stone-900">{teacher.name}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">{id ? 'Sesi Terverifikasi' : 'Verified Sessions'}</span>
              <span className="font-extrabold text-stone-900">{sessions.length} {id ? 'Sesi Pembelajaran' : 'Teaching Sessions'}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">{id ? 'Total Jam Mengajar' : 'Total Hours Taught'}</span>
              <span className="font-extrabold text-teal-900 font-mono">{totalHours} {id ? 'jam' : 'hours'}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">{id ? 'Total Klaim' : 'Total Claim Amount'}</span>
              <span className="font-black text-emerald-700 text-sm font-mono">{formatIDR(grandTotal)}</span>
            </div>
          </div>

          {/* Sessions Breakdown Table */}
          <div className="space-y-2">
            <h2 className="text-xs font-black text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-1">
              {id ? 'Rincian Sesi Pembelajaran Terverifikasi' : 'Itemized Verified Teaching Sessions'}
            </h2>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-300 text-[10px] text-stone-500 uppercase font-black">
                  <th className="py-2 px-2">No.</th>
                  <th className="py-2 px-2">{id ? 'Tanggal' : 'Date'}</th>
                  <th className="py-2 px-2">{id ? 'Kelas' : 'Cohort'}</th>
                  <th className="py-2 px-2">{id ? 'Waktu' : 'Time'}</th>
                  <th className="py-2 px-2 text-right">{id ? 'Durasi (Menit)' : 'Duration (Min)'}</th>
                  <th className="py-2 px-2 text-right">{id ? 'Tarif Honor / Jam' : 'Hourly Rate'}</th>
                  <th className="py-2 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {sessions.map((sess, idx) => {
                  const cohort = cohorts.find((c) => c.id === sess.cohortId);
                  return (
                    <tr key={sess.id}>
                      <td className="py-2 px-2 font-mono text-stone-400">{idx + 1}</td>
                      <td className="py-2 px-2 font-mono font-medium">{sess.sessionDate}</td>
                      <td className="py-2 px-2 font-bold text-stone-900">{cohort?.name || (id ? 'Rombel dihapus' : 'Deleted cohort')}</td>
                      <td className="py-2 px-2 font-mono text-stone-500">{sess.startTime} - {sess.endTime}</td>
                      <td className="py-2 px-2 text-right font-mono">{sess.durationMinutes}m</td>
                      <td className="py-2 px-2 text-right font-mono">{formatIDR(sess.hourlyRate)}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-stone-900">{formatIDR(sess.totalClaimAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Allowances Calculation Box */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>{id ? 'Total Honor Sesi:' : 'Session Honorarium:'}</span>
                <span className="font-mono font-bold text-stone-900">{formatIDR(baseAmount)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>{id ? 'Tunjangan:' : 'Allowances:'}</span>
                <span className="font-mono font-bold text-stone-900">{formatIDR(allowanceAmount)}</span>
              </div>
              <div className="border-t-2 border-stone-900 pt-2 flex justify-between font-black text-sm text-stone-900">
                <span>{id ? 'Total Klaim:' : 'Total Claim:'}</span>
                <span className="font-mono text-emerald-800">{formatIDR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Formal Signature & Verification Area */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-stone-500">
            <div>
              <p className="font-bold text-stone-700">{id ? 'Diajukan Oleh (Guru):' : 'Submitted By (Teacher):'}</p>
              <div className="h-16 border-b border-stone-400 flex items-end pb-1 font-bold text-stone-900">
                {teacher.name}
              </div>
              <p className="text-[10px] text-stone-400 mt-1">{id ? 'Tanggal' : 'Date'}: {new Date().toLocaleDateString(id ? 'id-ID' : 'en-US')}</p>
            </div>

            <div className="text-right">
              <p className="font-bold text-stone-700">{id ? 'Diverifikasi Oleh (Lembaga / Koordinator):' : 'Verified By (Institution / Coordinator):'}</p>
              <div className="h-16 border-b border-stone-400 flex items-end justify-end pb-1 font-bold text-stone-400 italic">
                {id ? '(Tanda Tangan & Cap Lembaga)' : '(Signature & Institution Stamp)'}
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Status: {claimStatusLabel(claim?.status || 'draft', language).toUpperCase()}</p>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
