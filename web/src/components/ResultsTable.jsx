import React from 'react';
import { Download, RotateCcw } from 'lucide-react';

export default function ResultsTable({ t, processedRows, downloadCSV, handleReset }) {
    if (!processedRows) return null;

    return (
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl mb-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-100">{t.resultsTitle}</h2>
                <div className="flex gap-3">
                    <button onClick={downloadCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition flex items-center gap-2 text-xs">
                        <Download className="w-4 h-4" />
                        {t.downloadBtn}
                    </button>
                    <button onClick={handleReset} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl shadow transition flex items-center gap-2 text-xs">
                        <RotateCcw className="w-4 h-4" />
                        {t.resetBtn}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[420px] rounded-2xl border border-slate-800 bg-slate-950 shadow-inner">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/90 backdrop-blur text-slate-400 uppercase text-[11px] tracking-wider sticky top-0 border-b border-slate-800 z-10">
                    <tr>
                        <th className="px-5 py-3.5">{t.tableDate}</th>
                        <th className="px-5 py-3.5 text-right">{t.tableAmount}</th>
                        <th className="px-5 py-3.5 text-center">{t.tableRateCompra}</th>
                        <th className="px-5 py-3.5 text-center">{t.tableRateVenta}</th>
                        <th className="px-5 py-3.5 text-right">{t.tableConvertedCompra}</th>
                        <th className="px-5 py-3.5 text-right">{t.tableConvertedVenta}</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-medium">
                    {processedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition bg-slate-950/40 even:bg-slate-900/20">
                            <td className="px-5 py-4 text-slate-200 font-mono text-xs">{row.Date || row.date || row.FECHA || '-'}</td>
                            <td className="px-5 py-4 text-right font-mono text-slate-100">${row.Amount || row.amount || row.MONTO || '-'}</td>
                            <td className="px-5 py-4 text-center">
                                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40 font-semibold">
                                        {row.Rate_Compra}
                                    </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/40 font-semibold">
                                        {row.Rate_Venta}
                                    </span>
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-emerald-400">
                                S/. {row.Converted_Compra_PEN}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-emerald-300/80">
                                S/. {row.Converted_Venta_PEN}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}