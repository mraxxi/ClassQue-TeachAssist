import React, { useState } from 'react';
import { Settings, Save, Database } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';

export const SettingsHub: React.FC = () => {
  const { teacher, updateTeacher, language, setLanguage } = useTeacherStore();
  const t = useTranslation(language);

  const [name, setName] = useState(teacher.name);
  const [email, setEmail] = useState(teacher.email);
  const [schoolName, setSchoolName] = useState(teacher.schoolName);
  const [hourlyRate, setHourlyRate] = useState(teacher.defaultHourlyRate.toString());
  const [currency] = useState(teacher.currency);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeacher({
      name,
      email,
      schoolName,
      defaultHourlyRate: parseFloat(hourlyRate) || 150000,
      currency,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-700" />
            {t.nav.settings}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {language === 'id' 
              ? 'Kelola profil guru, tarif honorarium default, preferensi bahasa, dan status sinkronisasi Cloudflare D1.' 
              : 'Manage teacher profile, default honorarium rates, language preferences, and Cloudflare D1 sync status.'}
          </p>
        </div>
      </div>

      {/* Profile & Rates Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
        <h3 className="text-sm font-extrabold text-stone-900 border-b border-stone-100 pb-2">
          {language === 'id' ? 'Profil Guru & Tarif Honorarium' : 'Teacher Profile & Rate Configuration'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Nama Lengkap Guru</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Nama Sekolah / Lembaga</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Tarif Honor Standar per Jam</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-mono"
              />
              <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-2 rounded-xl border border-stone-200">
                {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="border-t border-stone-100 pt-4 space-y-4">
          <h3 className="text-sm font-extrabold text-stone-900">
            {language === 'id' ? 'Preferensi Bahasa' : 'Language & Display'}
          </h3>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                language === 'id' ? 'bg-teal-800 text-white shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              🇮🇩 Bahasa Indonesia
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                language === 'en' ? 'bg-teal-800 text-white shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end pt-4 border-t border-stone-100">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? 'Tersimpan! ✓' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* Cloudflare D1 & Offline Storage Diagnostics */}
      <div className="bg-stone-100 rounded-2xl p-6 border border-stone-200/90 text-xs text-stone-600 space-y-3">
        <h4 className="font-extrabold text-stone-900 flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 text-teal-700" />
          Cloudflare D1 Edge & Offline Status
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-white p-3 rounded-xl border border-stone-200">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Penyimpanan Lokal</span>
            <span className="font-bold text-teal-800 mt-0.5 block">IndexedDB / LocalStorage</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Cloudflare Edge DB</span>
            <span className="font-bold text-teal-800 mt-0.5 block">D1 (SQLite at the Edge)</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Biaya Langganan</span>
            <span className="font-bold text-emerald-700 mt-0.5 block">100% Free Tier</span>
          </div>
        </div>
      </div>

    </div>
  );
};
