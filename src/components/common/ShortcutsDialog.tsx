import React, { useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import type { Language } from '../../types';

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-7 px-2 h-7 rounded-lg border border-stone-300 bg-stone-100 text-stone-800 text-xs font-mono font-bold shadow-2xs">{children}</kbd>
);

/** Keyboard shortcut reference, opened with `?`. Shortcuts are ignored while typing in a field. */
export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ isOpen, onClose, language }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEscapeKey(onClose, isOpen);
  useEffect(() => { if (isOpen) closeRef.current?.focus(); }, [isOpen]);
  if (!isOpen) return null;
  const id = language === 'id';

  const groups: { title: string; rows: { keys: React.ReactNode; text: string }[] }[] = [
    {
      title: id ? 'Kelas langsung' : 'Live class',
      rows: [
        { keys: <Key>Space</Key>, text: id ? 'Jeda / lanjutkan stopwatch' : 'Pause / resume the stopwatch' },
        { keys: <span className="flex gap-1"><Key>1</Key><Key>2</Key><Key>3</Key><Key>4</Key></span>, text: id ? 'Presensi siswa terpilih: Hadir · Alpa · Terlambat · Izin, lalu pindah ke siswa berikutnya' : 'Roll-call for the highlighted student: Present · Absent · Late · Excused, then move to the next' },
        { keys: <Key>Esc</Key>, text: id ? 'Tutup tampilan kokpit (kelas tetap berjalan)' : 'Close the cockpit view (the class keeps running)' },
      ],
    },
    {
      title: id ? 'Di mana saja' : 'Anywhere',
      rows: [
        { keys: <Key>Esc</Key>, text: id ? 'Tutup dialog atau pop-up yang terbuka' : 'Close the open dialog or popover' },
        { keys: <Key>?</Key>, text: id ? 'Tampilkan bantuan ini' : 'Show this help' },
        { keys: <span className="flex gap-1"><Key>Tab</Key><Key>Enter</Key></span>, text: id ? 'Semua tombol dapat dijangkau dan dioperasikan dengan keyboard' : 'Every control is reachable and operable by keyboard' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[90] scrim flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="shortcuts-title" className="text-lg font-black text-stone-900 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-teal-700" aria-hidden="true" />
            {id ? 'Pintasan keyboard' : 'Keyboard shortcuts'}
          </h2>
          <button ref={closeRef} onClick={onClose} aria-label={id ? 'Tutup' : 'Close'} className="p-2 -m-2 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        {groups.map((g) => (
          <section key={g.title} aria-label={g.title} className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">{g.title}</h3>
            <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200">
              {g.rows.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-sm">
                  <span className="text-stone-700">{r.text}</span>
                  <span className="shrink-0">{r.keys}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};
