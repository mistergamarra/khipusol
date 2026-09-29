import React from 'react';
import { Zap, X, Calendar, DollarSign, RotateCcw } from 'lucide-react';

export default function SingleConversionModal({
                                                  isOpen,
                                                  onClose,
                                                  t,
                                                  singleDate,
                                                  setSingleDate,
                                                  singleAmount,
                                                  setSingleAmount,
                                                  singleLoading,
                                                  singleResult,
                                                  handleSingleConvert,
                                                  handleSingleReset
                                              }) {
    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative space-y-6">

                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2.5">
                        <Zap className="w-5 h-5 text-amber-400" />
                        {t.modalTitle}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSingleConvert} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            {t.modalDateLabel}
                        </label>
                        <input
                            type="date"
                            value={singleDate}
                            onChange={(e) => setSingleDate(e.target.value)}
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 text-sm font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            {t.modalAmountLabel}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder={t.modalPlaceholder}
                            value={singleAmount}
                            onChange={(e) => setSingleAmount(e.target.value)}
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 text-sm font-medium"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-2xl transition shadow-lg text-sm">
                            {singleLoading ? t.modalLoading : t.modalSubmit}
                        </button>
                        <button
                            type="button"
                            onClick={handleSingleReset}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3.5 rounded-2xl transition font-medium flex items-center justify-center"
                            title={t.clearForm}>
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </form>

                {singleResult && (
                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                        {singleResult.error ? (
                            <p className="text-red-400 text-sm text-center py-2">{singleResult.error}</p>
                        ) : (
                            <>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-slate-400">
                                        <span>{t.resDate}</span>
                                        <span className="text-slate-200 font-medium capitalize">{singleResult.date}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>{t.resOriginal}</span>
                                        <span className="text-slate-200 font-medium">${singleResult.amount}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>{t.resRateCompra}</span>
                                        <span className="text-blue-400 font-mono font-semibold">{singleResult.rateCompra}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 text-xs">
                                        <span>{t.resRateVenta}</span>
                                        <span className="font-mono">{singleResult.rateVenta}</span>
                                    </div>
                                    <div className="border-t border-slate-800/80 pt-3 flex justify-between font-bold">
                                        <span className="text-slate-200">{t.resConverted}</span>
                                        <span className="text-emerald-400 font-mono text-lg">S/. {singleResult.converted}</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-900 pt-3 text-center text-xs text-slate-500 leading-relaxed">
                                    {t.modalDisclaimer}{' '}
                                    <a
                                        href="https://e-consulta.sunat.gob.pe/cl-at-ittipcam/tcS01Alias"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-400 underline hover:text-blue-300 font-medium">
                                        {t.sunatLinkText}
                                    </a>.
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}