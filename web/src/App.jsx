import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
    Sun,
    Upload,
    Download,
    RotateCcw,
    Zap,
    User,
    Mail,
    X,
    FileSpreadsheet,
    Calendar,
    DollarSign
} from 'lucide-react';

// Dictionary with Peruvian Spanish & English translations
const translations = {
    es: {
        title: "☀️ Khipusol Web",
        subtitle: "Conversión automatizada de moneda SUNAT para comprobantes y pagos en Perú.",
        quickConvert: "Conversión Unitaria",
        meetAuthor: "Conoce al Autor",
        selectCsv: "Seleccionar CSV de Pagos",
        csvHint: "Compatible con formatos CSV estándar que incluyan columnas de fecha y monto.",
        loaded: "Archivo cargado:",
        processing: "Leyendo archivo CSV...",
        processingRow: (current, total) => `Procesando fila ${current} de ${total}...`,
        resultsTitle: "✨ Vista Previa de Resultados",
        downloadBtn: "Descargar CSV",
        resetBtn: "Reiniciar",
        tableDate: "Fecha",
        tableAmount: "Monto",
        tableRate: "Tasa SUNAT (Compra)",
        tableConverted: "Convertido (PEN)",
        disclaimer: "⚠️ Aviso legal: Confirme siempre los tipos de cambio oficiales directamente en el",
        disclaimerPortal: "portal oficial de SUNAT",
        disclaimerEnd: "para declaraciones tributarias o contables formales.",

        // Single Conversion Modal
        modalTitle: "Conversión Rápida por Pago Único",
        modalDateLabel: "Fecha del Comprobante / Pago",
        modalAmountLabel: "Monto Original (USD / Extranjera)",
        modalPlaceholder: "ej. 1500.00",
        modalSubmit: "Calcular Conversión",
        modalLoading: "Buscando Tasa SUNAT...",
        resDate: "Fecha:",
        resOriginal: "Monto Original:",
        resRateCompra: "Tasa SUNAT (Compra):",
        resRateVenta: "ℹ️ Tasa informativa (Venta):",
        resConverted: "Total Convertido (Compra):",
        modalDisclaimer: "Verifica y confirma el monto oficial en la",
        sunatLinkText: "web oficial de SUNAT",
        rateNotFound: "No se encontró tasa para la fecha",
        clearForm: "Limpiar Formulario",

        // Author Modal
        authorTitle: "Sobre el Creador",
        authorBio: "Creador de Khipusol, herramientas de automatización financiera y open-source para desarrolladores y contadores en Perú.",
        emailLabel: "Correo Electrónico",
        githubLabel: "Perfil de GitHub",
        linkedinLabel: "Perfil de LinkedIn",
    },
    en: {
        title: "☀️ Khipusol Web",
        subtitle: "Automated SUNAT Currency Conversion for payments and records in Peru.",
        quickConvert: "Quick Single Convert",
        meetAuthor: "Meet the Author",
        selectCsv: "Select Payments CSV",
        csvHint: "Supports standard CSV formats with date and amount columns.",
        loaded: "Loaded file:",
        processing: "Reading CSV file...",
        processingRow: (current, total) => `Processing row ${current} of ${total}...`,
        resultsTitle: "✨ Conversion Results Preview",
        downloadBtn: "Download CSV",
        resetBtn: "Reset",
        tableDate: "Date",
        tableAmount: "Amount",
        tableRate: "SUNAT Rate (Compra)",
        tableConverted: "Converted (PEN)",
        disclaimer: "⚠️ Disclaimer: Always verify official exchange rates directly on the",
        disclaimerPortal: "official SUNAT portal",
        disclaimerEnd: "for formal tax or accounting records.",

        // Single Conversion Modal
        modalTitle: "⚡ Single Payment Conversion",
        modalDateLabel: "Payment / Voucher Date",
        modalAmountLabel: "Original Amount (USD / Foreign)",
        modalPlaceholder: "e.g. 1500.00",
        modalSubmit: "Calculate Conversion",
        modalLoading: "Fetching SUNAT Rate...",
        resDate: "Date:",
        resOriginal: "Original Amount:",
        resRateCompra: "SUNAT Rate (Compra):",
        resRateVenta: "ℹ️ Informative Rate (Venta):",
        resConverted: "Converted Total (Compra):",
        modalDisclaimer: "Verify and confirm official amount on the",
        sunatLinkText: "official SUNAT website",
        rateNotFound: "Rate not found for date",
        clearForm: "Clear Form",

        // Author Modal
        authorTitle: "👨‍💻 About the Creator",
        authorBio: "Creator of Khipusol, financial automation tools, and open-source software for developers and accountants.",
        emailLabel: "Email Address",
        githubLabel: "GitHub Profile",
        linkedinLabel: "LinkedIn Profile",
    }
};

export default function App() {
    const [lang, setLang] = useState('es'); // Spanish (Peru) default
    const t = translations[lang];

    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [processedRows, setProcessedRows] = useState(null);

    // Modal states
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);

    // Single conversion form states
    const [singleDate, setSingleDate] = useState('');
    const [singleAmount, setSingleAmount] = useState('');
    const [singleResult, setSingleResult] = useState(null);
    const [singleLoading, setSingleLoading] = useState(false);

    // Global ESC listener to close modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsSingleModalOpen(false);
                setIsAuthorModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // In-memory cache for fetched monthly JSON rates
    const ratesCache = {};

    const fetchMonthlyRates = async (year, month) => {
        const cacheKey = `${year}-${month}`;
        if (ratesCache[cacheKey]) return ratesCache[cacheKey];

        const paddedMonth = month.padStart(2, '0');
        const url = `https://cdn.jsdelivr.net/gh/mistergamarra/khipusol@main/rates/${year}/${paddedMonth}.json`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            ratesCache[cacheKey] = data;
            return data;
        } catch (err) {
            console.warn(`Could not fetch rates for ${paddedMonth}/${year}:`, err.message);
            return null;
        }
    };

    const parseDateString = (dateStr) => {
        if (!dateStr) return null;
        let cleanDate = String(dateStr).trim();

        if (cleanDate.includes('-')) {
            const parts = cleanDate.split('-');
            if (parts.length === 3) {
                return {
                    day: parts[2],
                    paddedDay: parts[2].padStart(2, '0'),
                    month: parts[1].padStart(2, '0'),
                    year: parts[0]
                };
            }
        } else if (cleanDate.includes('/')) {
            const parts = cleanDate.split('/');
            if (parts.length === 3) {
                return {
                    day: parts[0],
                    paddedDay: parts[0].padStart(2, '0'),
                    month: parts[1].padStart(2, '0'),
                    year: parts[2]
                };
            }
        }
        return null;
    };

    const formatLongDate = (paddedDay, monthStr, yearStr, locale) => {
        const dayNum = parseInt(paddedDay, 10);
        const monthNum = parseInt(monthStr, 10) - 1;
        const yearNum = parseInt(yearStr, 10);
        const dateObj = new Date(yearNum, monthNum, dayNum);

        if (isNaN(dateObj.getTime())) return `${paddedDay}/${monthStr}/${yearStr}`;

        return dateObj.toLocaleDateString(locale === 'es' ? 'es-PE' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleSingleConvert = async (e) => {
        e.preventDefault();
        if (!singleDate || !singleAmount) return;

        setSingleLoading(true);
        setSingleResult(null);

        const parsedDate = parseDateString(singleDate);
        const amountVal = parseFloat(singleAmount) || 0;

        if (parsedDate) {
            const monthlyRatesArray = await fetchMonthlyRates(parsedDate.year, parsedDate.month);

            if (Array.isArray(monthlyRatesArray)) {
                const targetDateStr = `${parsedDate.paddedDay}/${parsedDate.month}/${parsedDate.year}`;

                const rateCompraEntry = monthlyRatesArray.find(
                    item => item.fecPublica === targetDateStr && item.codTipo === "C"
                );
                const rateVentaEntry = monthlyRatesArray.find(
                    item => item.fecPublica === targetDateStr && item.codTipo === "V"
                );

                if (rateCompraEntry && rateCompraEntry.valTipo) {
                    const rateCompra = parseFloat(rateCompraEntry.valTipo);
                    const rateVenta = rateVentaEntry ? parseFloat(rateVentaEntry.valTipo) : 0;
                    const converted = parseFloat((amountVal * rateCompra).toFixed(2));

                    const longFormattedDate = formatLongDate(parsedDate.paddedDay, parsedDate.month, parsedDate.year, lang);

                    setSingleResult({
                        date: longFormattedDate,
                        amount: amountVal.toFixed(2),
                        rateCompra: rateCompra.toFixed(4),
                        rateVenta: rateVenta > 0 ? rateVenta.toFixed(4) : 'N/A',
                        converted: converted.toFixed(2)
                    });
                } else {
                    setSingleResult({ error: `${t.rateNotFound} ${targetDateStr}` });
                }
            } else {
                setSingleResult({ error: `${t.rateNotFound} ${parsedDate.month}/${parsedDate.year}` });
            }
        }
        setSingleLoading(false);
    };

    const handleSingleReset = () => {
        setSingleDate('');
        setSingleAmount('');
        setSingleResult(null);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);
        setStatusText(t.processing);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data;
                const updatedRows = [];

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    setStatusText(t.processingRow(i + 1, rows.length));

                    const dateStr = row.Date || row.date || row.FECHA || row.fecha || row.Fecha || Object.values(row)[0];
                    const parsedDate = parseDateString(dateStr);
                    let rateCompra = 0;
                    let converted = 0;

                    const rawAmount = row.Amount || row.amount || row.MONTO || row.monto || row.Monto || Object.values(row)[1] || 0;
                    const amountVal = parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, "")) || 0;

                    if (parsedDate) {
                        const monthlyRatesArray = await fetchMonthlyRates(parsedDate.year, parsedDate.month);

                        if (Array.isArray(monthlyRatesArray)) {
                            const targetDateStr = `${parsedDate.paddedDay}/${parsedDate.month}/${parsedDate.year}`;
                            const rateEntry = monthlyRatesArray.find(
                                item => item.fecPublica === targetDateStr && item.codTipo === "C"
                            );

                            if (rateEntry && rateEntry.valTipo) {
                                rateCompra = parseFloat(rateEntry.valTipo);
                                if (rateCompra > 0) {
                                    converted = parseFloat((amountVal * rateCompra).toFixed(2));
                                }
                            }
                        }
                    }

                    updatedRows.push({
                        ...row,
                        Rate_Compra: rateCompra > 0 ? rateCompra.toFixed(4) : 'N/A',
                        Converted_PEN: converted > 0 ? converted.toFixed(2) : 'Error/N/A'
                    });
                }

                setProcessedRows(updatedRows);
                setLoading(false);
                setStatusText('');
            },
            error: (err) => {
                alert('Error parsing CSV: ' + err.message);
                setLoading(false);
            }
        });
    };

    const downloadCSV = () => {
        if (!processedRows) return;
        const csv = Papa.unparse(processedRows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `converted_${fileName || 'payments.csv'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFileName('');
        setProcessedRows(null);
        setLoading(false);
        setStatusText('');
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Top Bar for Language Switcher & Meet Author */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => setIsAuthorModalOpen(true)}
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
                <button
                    onClick={() => setIsSingleModalOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 font-medium px-5 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 text-sm shrink-0">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {t.quickConvert}
                </button>
            </header>

            {/* Upload Box */}
            <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 transition p-10 rounded-2xl text-center mb-8 shadow-xl">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg transition">
                    <Upload className="w-5 h-5" />
                    {t.selectCsv}
                </label>
                <p className="text-sm text-slate-500 mt-3">{t.csvHint}</p>
                {fileName && <p className="text-emerald-400 mt-2 font-medium flex items-center justify-center gap-1.5"><FileSpreadsheet className="w-4 h-4" /> {t.loaded} {fileName}</p>}
            </div>

            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
                    <p className="text-yellow-400 font-medium">{statusText}</p>
                </div>
            )}

            {/* Results Section */}
            {processedRows && !loading && (
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-200">{t.resultsTitle}</h2>
                        <div className="flex gap-3">
                            <button onClick={downloadCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                {t.downloadBtn}
                            </button>
                            <button onClick={handleReset} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                {t.resetBtn}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-800">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800 text-slate-200 uppercase text-xs sticky top-0">
                            <tr>
                                <th className="px-4 py-3">{t.tableDate}</th>
                                <th className="px-4 py-3">{t.tableAmount}</th>
                                <th className="px-4 py-3">{t.tableRate}</th>
                                <th className="px-4 py-3">{t.tableConverted}</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                            {processedRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40">
                                    <td className="px-4 py-3">{row.Date || row.date || row.FECHA || '-'}</td>
                                    <td className="px-4 py-3">{row.Amount || row.amount || row.MONTO || '-'}</td>
                                    <td className="px-4 py-3 text-blue-400 font-mono">{row.Rate_Compra}</td>
                                    <td className="px-4 py-3 text-emerald-400 font-mono font-bold">{row.Converted_PEN}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Single Conversion Modal (Spacious & Airy Layout) */}
            {isSingleModalOpen && (
                <div
                    onClick={() => setIsSingleModalOpen(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative space-y-6">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2.5">
                                <Zap className="w-5 h-5 text-amber-400" />
                                {t.modalTitle}
                            </h3>
                            <button
                                onClick={() => setIsSingleModalOpen(false)}
                                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Inputs with Generous Spacing */}
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

                        {/* Modal Results Display with Airy Padding */}
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

                                        {/* Confirmation disclaimer link */}
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
            )}

            {/* Meet the Author Modal */}
            {isAuthorModalOpen && (
                <div
                    onClick={() => setIsAuthorModalOpen(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-8 shadow-2xl relative text-center space-y-5">
                        <button
                            onClick={() => setIsAuthorModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                            <User className="w-8 h-8" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-200 mb-1.5">{t.authorTitle}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed">{t.authorBio}</p>
                        </div>

                        <div className="space-y-3 pt-1">
                            <a
                                href="mailto:mister.gamarra@gmail.com"
                                className="flex items-center gap-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-4 py-3 rounded-xl text-slate-300 hover:text-white transition text-xs font-medium">
                                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="truncate">mister.gamarra@gmail.com</span>
                            </a>
                            <a
                                href="https://github.com/mistergamarra"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-4 py-3 rounded-xl text-slate-300 hover:text-white transition text-xs font-medium">
                                <svg className="w-4 h-4 fill-current text-purple-400 shrink-0" viewBox="0 0 24 24">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02_0 0024 12c0-6.63-5.37-12-12-12z"/>
                                </svg>
                                <span>github.com/mistergamarra</span>
                            </a>
                            <a
                                href="https://linkedin.com/in/arnold-gamarra"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-4 py-3 rounded-xl text-slate-300 hover:text-white transition text-xs font-medium">
                                <svg className="w-4 h-4 fill-current text-cyan-400 shrink-0" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                </svg>
                                <span>LinkedIn Profile</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Disclaimer */}
            <footer className="mt-12 text-center text-xs text-slate-500 border-t border-slate-900 pt-6">
                <em>{t.disclaimer} <a href="https://e-consulta.sunat.gob.pe/cl-at-ittipcam/tcS01Alias" target="_blank" rel="noreferrer" className="text-blue-400 underline">{t.disclaimerPortal}</a> {t.disclaimerEnd}</em>
            </footer>
        </div>
    );
}