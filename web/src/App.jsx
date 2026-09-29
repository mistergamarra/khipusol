import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultsTable from './components/ResultsTable';
import SingleConversionModal from './components/SingleConversionModal';
import AuthorModal from './components/AuthorModal';
import CalendarModal from './components/CalendarModal';

// Dictionary with Peruvian Spanish & English translations (No icons/emojis in text)
const translations = {
    es: {
        title: "Khipusol",
        subtitle: "Conversión automatizada de moneda SUNAT para comprobantes y pagos en Perú.",
        quickConvert: "Conversión Unitaria",
        calendarBtn: "Calendario",
        meetAuthor: "Conoce al Autor",
        selectCsv: "Seleccionar CSV de Pagos",
        csvHint: "Compatible con formatos CSV estándar que incluyan columnas de fecha y monto.",
        loaded: "Archivo cargado:",
        processing: "Leyendo archivo CSV...",
        processingRow: (current, total) => `Procesando fila ${current} de ${total}...`,
        resultsTitle: "Vista Previa de Resultados",
        downloadBtn: "Descargar CSV",
        resetBtn: "Reiniciar",
        tableDate: "Fecha",
        tableAmount: "Monto",
        tableRateCompra: "Tasa Compra (C)",
        tableRateVenta: "Tasa Venta (V)",
        tableConvertedCompra: "Conv. Compra (PEN)",
        tableConvertedVenta: "Conv. Venta (PEN)",
        disclaimer: "Aviso legal: Confirme siempre los tipos de cambio oficiales directamente en el",
        disclaimerPortal: "portal oficial de SUNAT",
        disclaimerEnd: "para declaraciones tributarias o contables formales.",

        tabFile: "Subir Archivo CSV",
        tabText: "Editor de Texto",
        processTextBtn: "Procesar Texto CSV",
        guideTitle: "Guía de Campos y Valores",
        guideSubtitle: "Tu archivo CSV o texto debe incluir estrictamente las siguientes cabeceras y formatos:",

        fieldAmount: "amount",
        fieldAmountDesc: "Monto numérico de la transacción en moneda extranjera.",
        fieldAmountValues: "Posibles valores: Cualquier número decimal positivo (ej: 3660.00, 150.50).",

        fieldDate: "date",
        fieldDateDesc: "Fecha en la que se realizó la operación o emisión del comprobante.",
        fieldDateValues: "Formato requerido: DD/MM/YYYY (ej: 30/09/2022, 15/01/2026).",

        modalTitle: "Conversión Rápida por Pago Único",
        modalDateLabel: "Fecha del Comprobante / Pago",
        modalAmountLabel: "Monto Original (USD / Extranjera)",
        modalPlaceholder: "ej. 1500.00",
        modalSubmit: "Calcular Conversión",
        modalLoading: "Buscando Tasa SUNAT...",
        resDate: "Fecha:",
        resOriginal: "Monto Original:",
        resRateCompra: "Tasa SUNAT (Compra):",
        resRateVenta: "Tasa informativa (Venta):",
        resConverted: "Total Convertido (Compra):",
        modalDisclaimer: "Verifica y confirma el monto oficial en la",
        sunatLinkText: "web oficial de SUNAT",
        rateNotFound: "No se encontró tasa para la fecha",
        clearForm: "Limpiar Formulario",

        authorTitle: "Sobre el Creador",
        authorBio: "Creador de Khipusol, herramientas de automatización financiera y open-source para desarrolladores y contadores en Perú.",
    },
    en: {
        title: "Khipusol",
        subtitle: "Automated SUNAT Currency Conversion for payments and records in Peru.",
        quickConvert: "Quick Single Convert",
        calendarBtn: "Calendar",
        meetAuthor: "Meet the Author",
        selectCsv: "Select Payments CSV",
        csvHint: "Supports standard CSV formats with date and amount columns.",
        loaded: "Loaded file:",
        processing: "Reading CSV file...",
        processingRow: (current, total) => `Processing row ${current} of ${total}...`,
        resultsTitle: "Conversion Results Preview",
        downloadBtn: "Download CSV",
        resetBtn: "Reset",
        tableDate: "Date",
        tableAmount: "Amount",
        tableRateCompra: "Compra Rate (C)",
        tableRateVenta: "Venta Rate (V)",
        tableConvertedCompra: "Conv. Compra (PEN)",
        tableConvertedVenta: "Conv. Venta (PEN)",
        disclaimer: "Disclaimer: Always verify official exchange rates directly on the",
        disclaimerPortal: "official SUNAT portal",
        disclaimerEnd: "for formal tax or accounting records.",

        tabFile: "Upload CSV File",
        tabText: "Text Editor",
        processTextBtn: "Process CSV Text",
        guideTitle: "Fields & Values Guide",
        guideSubtitle: "Your CSV file or pasted text must strictly use these headers and formats:",

        fieldAmount: "amount",
        fieldAmountDesc: "Numeric transaction amount in foreign currency.",
        fieldAmountValues: "Possible values: Any positive decimal number (e.g. 3660.00, 150.50).",

        fieldDate: "date",
        fieldDateDesc: "Date when the transaction or invoice was issued.",
        fieldDateValues: "Required format: DD/MM/YYYY (e.g. 30/09/2022, 15/01/2026).",

        modalTitle: "Single Payment Conversion",
        modalDateLabel: "Payment / Voucher Date",
        modalAmountLabel: "Original Amount (USD / Foreign)",
        modalPlaceholder: "e.g. 1500.00",
        modalSubmit: "Calculate Conversion",
        modalLoading: "Fetching SUNAT Rate...",
        resDate: "Date:",
        resOriginal: "Original Amount:",
        resRateCompra: "SUNAT Rate (Compra):",
        resRateVenta: "Informative Rate (Venta):",
        resConverted: "Converted Total (Compra):",
        modalDisclaimer: "Verify and confirm official amount on the",
        sunatLinkText: "official SUNAT website",
        rateNotFound: "Rate not found for date",
        clearForm: "Clear Form",

        authorTitle: "About the Creator",
        authorBio: "Creator of Khipusol, financial automation tools, and open-source software for developers and accountants.",
    }
};

export default function App() {
    const [lang, setLang] = useState('es');
    const t = translations[lang];

    const [inputMode, setInputMode] = useState('file');
    const [csvText, setCsvText] = useState("amount,date\n3660.00,30/09/2022\n4400.00,31/10/2022");

    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [processedRows, setProcessedRows] = useState(null);

    // Modal states
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

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
                setIsCalendarModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    const processParsedRows = async (rows) => {
        const updatedRows = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            setStatusText(t.processingRow(i + 1, rows.length));

            const dateStr = row.Date || row.date || row.FECHA || row.fecha || row.Fecha || Object.values(row)[0];
            const parsedDate = parseDateString(dateStr);
            let rateCompra = 0;
            let rateVenta = 0;
            let convertedCompra = 0;
            let convertedVenta = 0;

            const rawAmount = row.Amount || row.amount || row.MONTO || row.monto || row.Monto || Object.values(row)[1] || 0;
            const amountVal = parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, "")) || 0;

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
                        rateCompra = parseFloat(rateCompraEntry.valTipo);
                        if (rateCompra > 0) {
                            convertedCompra = parseFloat((amountVal * rateCompra).toFixed(2));
                        }
                    }

                    if (rateVentaEntry && rateVentaEntry.valTipo) {
                        rateVenta = parseFloat(rateVentaEntry.valTipo);
                        if (rateVenta > 0) {
                            convertedVenta = parseFloat((amountVal * rateVenta).toFixed(2));
                        }
                    }
                }
            }

            updatedRows.push({
                ...row,
                Rate_Compra: rateCompra > 0 ? rateCompra.toFixed(4) : 'N/A',
                Rate_Venta: rateVenta > 0 ? rateVenta.toFixed(4) : 'N/A',
                Converted_Compra_PEN: convertedCompra > 0 ? convertedCompra.toFixed(2) : 'Error/N/A',
                Converted_Venta_PEN: convertedVenta > 0 ? convertedVenta.toFixed(2) : 'Error/N/A'
            });
        }

        setProcessedRows(updatedRows);
        setLoading(false);
        setStatusText('');
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
                await processParsedRows(results.data);
            },
            error: (err) => {
                alert('Error parsing CSV: ' + err.message);
                setLoading(false);
            }
        });
    };

    const handleTextProcess = () => {
        if (!csvText.trim()) return;

        setLoading(true);
        setFileName('manual_input.csv');
        setStatusText(t.processing);

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                await processParsedRows(results.data);
            },
            error: (err) => {
                alert('Error parsing text CSV: ' + err.message);
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
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Header
                t={t}
                lang={lang}
                setLang={setLang}
                onOpenAuthor={() => setIsAuthorModalOpen(true)}
                onOpenCalendar={() => setIsCalendarModalOpen(true)}
                onOpenSingle={() => setIsSingleModalOpen(true)}
            />

            <InputSection
                t={t}
                inputMode={inputMode}
                setInputMode={setInputMode}
                csvText={csvText}
                setCsvText={setCsvText}
                fileName={fileName}
                handleFileUpload={handleFileUpload}
                handleTextProcess={handleTextProcess}
            />

            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
                    <p className="text-yellow-400 font-medium">{statusText}</p>
                </div>
            )}

            <ResultsTable
                t={t}
                processedRows={processedRows}
                downloadCSV={downloadCSV}
                handleReset={handleReset}
            />

            <SingleConversionModal
                isOpen={isSingleModalOpen}
                onClose={() => setIsSingleModalOpen(false)}
                t={t}
                singleDate={singleDate}
                setSingleDate={setSingleDate}
                singleAmount={singleAmount}
                setSingleAmount={setSingleAmount}
                singleLoading={singleLoading}
                singleResult={singleResult}
                handleSingleConvert={handleSingleConvert}
                handleSingleReset={handleSingleReset}
            />

            <CalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                lang={lang}
            />

            <AuthorModal
                isOpen={isAuthorModalOpen}
                onClose={() => setIsAuthorModalOpen(false)}
                t={t}
            />

            {/* Disclaimer */}
            <footer className="mt-12 text-center text-xs text-slate-500 border-t border-slate-900 pt-6">
                <em>{t.disclaimer} <a href="https://e-consulta.sunat.gob.pe/cl-at-ittipcam/tcS01Alias" target="_blank" rel="noreferrer" className="text-blue-400 underline">{t.disclaimerPortal}</a> {t.disclaimerEnd}</em>
            </footer>
        </div>
    );
}