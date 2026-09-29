import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function CalendarModal({ isOpen, onClose, lang }) {
    // Default to current year and month (e.g., September 2026)
    const [year, setYear] = useState(2026);
    const [month, setMonth] = useState(9); // 1-12
    const [ratesData, setRatesData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Translations for calendar header
    const translations = {
        es: {
            title: "Calendario de Tipo de Cambio SUNAT",
            close: "Cerrar",
            loading: "Cargando tasas del mes...",
            compra: "Compra",
            venta: "Venta",
            days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
            months: [
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ]
        },
        en: {
            title: "SUNAT Exchange Rate Calendar",
            close: "Close",
            loading: "Loading monthly rates...",
            compra: "Compra",
            venta: "Venta",
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            months: [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ]
        }
    };

    const t = translations[lang || 'es'];

    // Fetch monthly rates when year or month changes
    useEffect(() => {
        if (!isOpen) return;

        // Only fetch if year is a valid 4-digit number (prevents 404s while typing)
        if (!year || String(year).length !== 4) return;

        const fetchRates = async () => {
            setLoading(true);
            const paddedMonth = String(month).padStart(2, '0');
            const url = `https://cdn.jsdelivr.net/gh/mistergamarra/khipusol@main/rates/${year}/${paddedMonth}.json`;

            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Status ${res.status}`);
                const data = await res.json();
                setRatesData(Array.isArray(data) ? data : []);
            } catch (err) {
                console.warn(`Could not fetch calendar rates for ${paddedMonth}/${year}:`, err.message);
                setRatesData([]);
            }
            setLoading(false);
        };

        fetchRates();
    }, [isOpen, year, month]);

    if (!isOpen) return null;

    // Handlers for month navigation
    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    // Build calendar matrix (Grid matching SUNAT layout)
    // First day of month and total days in month
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Map fetched rates by day string ("01", "02", etc.)
    const ratesByDay = {};
    ratesData.forEach(item => {
        // fecPublica format is "DD/MM/YYYY"
        const parts = item.fecPublica.split('/');
        if (parts.length === 3) {
            const dayKey = parts[0];
            if (!ratesByDay[dayKey]) ratesByDay[dayKey] = {};
            if (item.codTipo === 'C') ratesByDay[dayKey].compra = item.valTipo;
            if (item.codTipo === 'V') ratesByDay[dayKey].venta = item.valTipo;
        }
    });

    // Generate grid cells
    const gridCells = [];
    // Padding for previous month trailing days
    for (let i = 0; i < firstDayIndex; i++) {
        gridCells.push({ empty: true, key: `empty-prev-${i}` });
    }
    // Actual days of month
    for (let d = 1; d <= totalDaysInMonth; d++) {
        const paddedD = String(d).padStart(2, '0');
        gridCells.push({
            empty: false,
            dayNum: d,
            paddedDay: paddedD,
            rates: ratesByDay[paddedD] || null,
            key: `day-${d}`
        });
    }

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative my-8 space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-100">{t.title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Month / Year Navigator */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-bold text-slate-100 min-w-[180px] text-center">
                            {t.months[month - 1]} {year}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500 font-medium">
                            {t.months.map((mName, idx) => (
                                <option key={idx} value={idx + 1}>{mName}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500 font-medium text-center"
                        />
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    {loading ? (
                        <div className="text-center py-20 space-y-3">
                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                            <p className="text-slate-400 text-sm font-medium">{t.loading}</p>
                        </div>
                    ) : (
                        <div className="min-w-[700px]">
                            {/* Days of week header */}
                            <div className="grid grid-cols-7 bg-slate-900 border-b border-slate-800 text-slate-300 text-xs font-bold uppercase text-center py-3">
                                {t.days.map((dayName, idx) => (
                                    <div key={idx}>{dayName}</div>
                                ))}
                            </div>

                            {/* Grid cells */}
                            <div className="grid grid-cols-7 gap-px bg-slate-800">
                                {gridCells.map((cell) => {
                                    if (cell.empty) {
                                        return <div key={cell.key} className="bg-slate-950/40 min-h-[90px] p-2 opacity-30"></div>;
                                    }

                                    return (
                                        <div key={cell.key} className="bg-slate-950 hover:bg-slate-900/60 transition p-2.5 min-h-[95px] flex flex-col justify-between">
                                            <span className="text-xs font-bold text-slate-400">{cell.dayNum}</span>

                                            {cell.rates ? (
                                                <div className="space-y-1 mt-1">
                                                    <div className="bg-emerald-950/60 border border-emerald-800/60 rounded px-1.5 py-0.5 flex justify-between text-[11px]">
                                                        <span className="text-emerald-400 font-medium">{t.compra}</span>
                                                        <span className="text-emerald-200 font-mono font-bold">{cell.rates.compra}</span>
                                                    </div>
                                                    <div className="bg-sky-950/60 border border-sky-800/60 rounded px-1.5 py-0.5 flex justify-between text-[11px]">
                                                        <span className="text-sky-400 font-medium">{t.venta}</span>
                                                        <span className="text-sky-200 font-mono font-bold">{cell.rates.venta}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-slate-600 italic text-center my-auto">--</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer close */}
                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-6 py-2.5 rounded-xl transition text-sm">
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
    );
}