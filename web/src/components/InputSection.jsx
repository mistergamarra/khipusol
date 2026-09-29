import React from 'react';
import { Upload, FileText, Play, FileSpreadsheet, Info, DollarSign, Calendar } from 'lucide-react';

export default function InputSection({
                                         t,
                                         inputMode,
                                         setInputMode,
                                         csvText,
                                         setCsvText,
                                         fileName,
                                         handleFileUpload,
                                         handleTextProcess
                                     }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

            {/* Left Side: Detailed Fields & Values Guide */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 text-blue-400 font-bold mb-1.5 text-sm">
                        <Info className="w-4 h-4" />
                        {t.guideTitle}
                    </div>
                    <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                        {t.guideSubtitle}
                    </p>

                    <div className="space-y-3.5">
                        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                                    {t.fieldAmount}
                                </span>
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                            </div>
                            <p className="text-[11px] text-slate-300 font-medium">{t.fieldAmountDesc}</p>
                            <p className="text-[10px] text-slate-500 italic bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                                {t.fieldAmountValues}
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded">
                                    {t.fieldDate}
                                </span>
                                <Calendar className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-[11px] text-slate-300 font-medium">{t.fieldDateDesc}</p>
                            <p className="text-[10px] text-slate-500 italic bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                                {t.fieldDateValues}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 italic">
                    💡 Rates for both Compra (C) and Venta (V) will be automatically attached to every row.
                </div>
            </div>

            {/* Right Side: Input Mode Selector + Upload or Text Editor */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex shadow-lg gap-2 self-start">
                    <button
                        onClick={() => setInputMode('file')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${inputMode === 'file' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                        <Upload className="w-4 h-4" />
                        {t.tabFile}
                    </button>
                    <button
                        onClick={() => setInputMode('text')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${inputMode === 'text' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                        <FileText className="w-4 h-4" />
                        {t.tabText}
                    </button>
                </div>

                {inputMode === 'file' ? (
                    <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 transition p-10 rounded-3xl text-center shadow-xl flex-1 flex flex-col justify-center items-center">
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                        <label htmlFor="csv-upload" className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg transition mb-3">
                            <Upload className="w-5 h-5" />
                            {t.selectCsv}
                        </label>
                        <p className="text-sm text-slate-400 mb-2">{t.csvHint}</p>
                        {fileName && <p className="text-emerald-400 mt-3 font-medium flex items-center justify-center gap-1.5"><FileSpreadsheet className="w-4 h-4" /> {t.loaded} {fileName}</p>}
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                {t.tabText}
                            </label>
                            <span className="text-xs text-slate-500">Edit or paste rows</span>
                        </div>
                        <textarea
                            rows={7}
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed resize-none flex-1"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleTextProcess}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg flex items-center gap-2 text-sm">
                                <Play className="w-4 h-4" />
                                {t.processTextBtn}
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}