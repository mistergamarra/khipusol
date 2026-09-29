import React from 'react';
import { Sun, Zap, CalendarDays, User } from 'lucide-react';

export default function Header({ t, lang, setLang, onOpenAuthor, onOpenCalendar, onOpenSingle }) {
    return (
        <>
            {/* Top Bar for Language Switcher & Meet Author */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onOpenAuthor}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-sm transition flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    {t.meetAuthor}
                </button>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex shadow-sm">
                    <button
                        onClick={() => setLang('es')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${lang === 'es' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                        🇵🇪 ES
                    </button>
                    <button
                        onClick={() => setLang('en')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${lang === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                        🇺🇸 EN
                    </button>
                </div>
            </div>

            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-slate-900 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                        <Sun className="w-8 h-8 text-amber-400" />
                        {t.title.replace('☀️ ', '')}
                    </h1>
                    <p className="text-slate-400 max-w-xl">{t.subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={onOpenCalendar}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 font-medium px-4 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 text-sm shrink-0">
                        <CalendarDays className="w-4 h-4 text-emerald-400" />
                        {t.calendarBtn}
                    </button>
                    <button
                        onClick={onOpenSingle}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 font-medium px-4 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 text-sm shrink-0">
                        <Zap className="w-4 h-4 text-amber-400" />
                        {t.quickConvert}
                    </button>
                </div>
            </header>
        </>
    );
}