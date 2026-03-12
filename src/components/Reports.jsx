// src/components/Reports.jsx
// Estado de Resultados con COS, Gastos desglosados y porcentajes

import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, onSnapshot } from 'firebase/firestore';
import { useBranches } from '../hooks/useBranches.jsx';
import { fmt } from '../constants';

// Iconos SVG
const Icons = {
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    trendUp: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    trendDown: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    package: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    percentage: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    eyeOff: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const FadeIn = ({ children, delay = 0, className = "" }) => (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
        {children}
    </div>
);

const Card = ({ children, className = "", variant = "default" }) => {
    const variants = {
        default: "bg-white border-slate-200",
        success: "bg-emerald-50 border-emerald-200",
        danger: "bg-rose-50 border-rose-200",
        warning: "bg-amber-50 border-amber-200",
        info: "bg-blue-50 border-blue-200",
        purple: "bg-purple-50 border-purple-200"
    };
    return (
        <div className={`rounded-2xl shadow-lg border p-6 ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
};

const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-100 text-emerald-700',
        danger: 'bg-rose-100 text-rose-700',
        warning: 'bg-amber-100 text-amber-700',
        info: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${variants[variant]}`}>{children}</span>;
};

const ProgressBar = ({ value, max, color = "blue", label }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const colors = {
        blue: "bg-blue-500",
        emerald: "bg-emerald-500",
        rose: "bg-rose-500",
        amber: "bg-amber-500",
        purple: "bg-purple-500"
    };
    
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">{label}</span>
                <span className="font-bold text-slate-700">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                    className={`${colors[color]} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
};

// Función para obtener mes de una fecha
const getMonthFromDate = (date) => {
    if (!date) return null;
    if (date.toDate) {
        const d = date.toDate();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (typeof date === 'string') {
        return date.substring(0, 7);
    }
    return null;
};

export default function Reports() {
    const { branches, getBranchName } = useBranches();
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
    const [selectedBranch, setSelectedBranch] = useState(''); // '' = todas
    const [showGastosDetail, setShowGastosDetail] = useState(false);
    
    // Estados para datos
    const [ventas, setVentas] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [inventarios, setInventarios] = useState([]);
    const [movimientosContables, setMovimientosContables] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar datos en tiempo real
    useEffect(() => {
        setLoading(true);
        
        // Ventas (ingresos)
        const qVentas = query(collection(db, 'ingresos'), orderBy('timestamp', 'desc'));
        const unsubVentas = onSnapshot(qVentas, (snap) => {
            setVentas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Gastos
        const qGastos = query(collection(db, 'gastos'), orderBy('timestamp', 'desc'));
        const unsubGastos = onSnapshot(qGastos, (snap) => {
            setGastos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Inventarios
        const qInventarios = query(collection(db, 'inventarios'), orderBy('month', 'desc'));
        const unsubInventarios = onSnapshot(qInventarios, (snap) => {
            setInventarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Movimientos contables (para costos de ventas 5.01)
        const qMovimientos = query(collection(db, 'movimientosContables'), orderBy('timestamp', 'desc'));
        const unsubMovimientos = onSnapshot(qMovimientos, (snap) => {
            setMovimientosContables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => {
            unsubVentas();
            unsubGastos();
            unsubInventarios();
            unsubMovimientos();
        };
    }, []);

    // Filtrar datos por mes
    const filteredData = useMemo(() => {
        const ventasFiltradas = ventas.filter(v => {
            const month = getMonthFromDate(v.fecha) || v.month;
            return month === selectedMonth;
        });
        
        const gastosFiltrados = gastos.filter(g => {
            const month = getMonthFromDate(g.fecha) || g.month;
            return month === selectedMonth;
        });
        
        const inventariosFiltrados = inventarios.filter(i => i.month === selectedMonth);
        
        const movimientosFiltrados = movimientosContables.filter(m => {
            const month = m.fecha ? m.fecha.substring(0, 7) : null;
            return month === selectedMonth;
        });
        
        return { ventasFiltradas, gastosFiltrados, inventariosFiltrados, movimientosFiltrados };
    }, [ventas, gastos, inventarios, movimientosContables, selectedMonth]);

    // Filtrar por sucursal si está seleccionada
    const dataByBranch = useMemo(() => {
        const { ventasFiltradas, gastosFiltrados, inventariosFiltrados, movimientosFiltrados } = filteredData;
        
        if (!selectedBranch) {
            return {
                ventas: ventasFiltradas,
                gastos: gastosFiltrados,
                inventarios: inventariosFiltrados,
                movimientos: movimientosFiltrados
            };
        }
        
        return {
            ventas: ventasFiltradas.filter(v => v.sucursal === selectedBranch),
            gastos: gastosFiltrados.filter(g => g.sucursal === selectedBranch),
            inventarios: inventariosFiltrados.filter(i => i.sucursal === selectedBranch),
            movimientos: movimientosFiltrados.filter(m => m.sucursal === selectedBranch)
        };
    }, [filteredData, selectedBranch]);

    // Calcular totales
    const reportData = useMemo(() => {
        const { ventas, gastos, inventarios, movimientos } = dataByBranch;
        
        // VENTAS TOTALES
        const totalVentas = ventas.reduce((sum, v) => sum + (v.amount || 0), 0);
        
        // COS (Costo de Ventas)
        // Inventario Inicial (todas las sucursales si se filtra por una)
        const inventarioInicial = inventarios
            .filter(i => i.type === 'inicial')
            .reduce((sum, i) => sum + (i.amount || 0), 0);
        
        // Inventario Final (todas las sucursales)
        const inventarioFinal = inventarios
            .filter(i => i.type === 'final')
            .reduce((sum, i) => sum + (i.amount || 0), 0);
        
        // Costos de Ventas desde movimientos contables (cuentas que empiezan con 5.01)
        const costosVentasMovimientos = movimientos
            .filter(m => m.accountCode && m.accountCode.startsWith('5.01'))
            .reduce((sum, m) => sum + (m.monto || 0), 0);
        
        // COS = Inventario Inicial + Costos de Ventas - Inventario Final
        const cos = inventarioInicial + costosVentasMovimientos - inventarioFinal;
        
        // GASTOS desglosados (excluyendo costos de ventas 5.01)
        const gastosDetalle = {};
        let totalGastos = 0;
        
        gastos.forEach(g => {
            const categoria = g.cuentaContableName || 'Otros';
            if (!gastosDetalle[categoria]) {
                gastosDetalle[categoria] = { amount: 0, count: 0 };
            }
            gastosDetalle[categoria].amount += (g.amount || 0);
            gastosDetalle[categoria].count += 1;
            totalGastos += (g.amount || 0);
        });
        
        // También agregar gastos desde movimientos contables (tipo GASTO)
        movimientos
            .filter(m => {
                // Excluir costos de ventas (5.01) y cuentas de ingreso
                if (m.accountCode && m.accountCode.startsWith('5.01')) return false;
                if (m.accountCode && m.accountCode.startsWith('4.')) return false; // Ingresos
                return m.type === 'DEBITO'; // Gastos son débito
            })
            .forEach(m => {
                const categoria = m.accountName || 'Otros';
                if (!gastosDetalle[categoria]) {
                    gastosDetalle[categoria] = { amount: 0, count: 0 };
                }
                gastosDetalle[categoria].amount += (m.monto || 0);
                gastosDetalle[categoria].count += 1;
                totalGastos += (m.monto || 0);
            });
        
        // UTILIDAD BRUTA = Ventas - COS
        const utilidadBruta = totalVentas - cos;
        
        // RESULTADO DE OPERACIÓN = Utilidad Bruta - Gastos
        const resultadoOperacion = utilidadBruta - totalGastos;
        
        // PORCENTAJES (sobre ventas totales)
        const porcentajes = {
            cos: totalVentas > 0 ? (cos / totalVentas) * 100 : 0,
            gastos: totalVentas > 0 ? (totalGastos / totalVentas) * 100 : 0,
            utilidadBruta: totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0,
            resultado: totalVentas > 0 ? (resultadoOperacion / totalVentas) * 100 : 0
        };
        
        // Porcentajes por categoría de gasto
        const gastosConPorcentaje = Object.entries(gastosDetalle).map(([categoria, data]) => ({
            categoria,
            ...data,
            porcentaje: totalVentas > 0 ? (data.amount / totalVentas) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);
        
        return {
            totalVentas,
            inventarioInicial,
            inventarioFinal,
            costosVentasMovimientos,
            cos,
            totalGastos,
            gastosDetalle: gastosConPorcentaje,
            utilidadBruta,
            resultadoOperacion,
            porcentajes,
            cantidadVentas: ventas.length,
            cantidadGastos: gastos.length
        };
    }, [dataByBranch]);

    // Calcular COS por sucursal (para mostrar cuando se filtra)
    const cosPorSucursal = useMemo(() => {
        if (!selectedBranch) return null;
        
        const { inventariosFiltrados, movimientosFiltrados } = filteredData;
        
        // Inventarios de la sucursal seleccionada
        const invInicialSucursal = inventariosFiltrados
            .filter(i => i.sucursal === selectedBranch && i.type === 'inicial')
            .reduce((sum, i) => sum + (i.amount || 0), 0);
        
        const invFinalSucursal = inventariosFiltrados
            .filter(i => i.sucursal === selectedBranch && i.type === 'final')
            .reduce((sum, i) => sum + (i.amount || 0), 0);
        
        // COS de la sucursal
        const cosSucursal = invInicialSucursal + reportData.costosVentasMovimientos - invFinalSucursal;
        
        // Ventas de la sucursal
        const ventasSucursal = reportData.totalVentas;
        
        return {
            invInicial: invInicialSucursal,
            invFinal: invFinalSucursal,
            cos: cosSucursal,
            porcentajeCos: ventasSucursal > 0 ? (cosSucursal / ventasSucursal) * 100 : 0
        };
    }, [selectedBranch, filteredData, reportData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <FadeIn className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 mb-2">
                                Estado de <span className="text-blue-600">Resultados</span>
                            </h1>
                            <p className="text-slate-500">Reporte financiero con COS y desglose de gastos</p>
                        </div>
                    </div>
                </FadeIn>

                {/* Filtros */}
                <FadeIn delay={50} className="mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                    <Icon path={Icons.calendar} className="w-4 h-4 inline mr-1" />
                                    Período
                                </label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                    <Icon path={Icons.building} className="w-4 h-4 inline mr-1" />
                                    Sucursal
                                </label>
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                >
                                    <option value="">Todas las sucursales</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {selectedBranch && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Icon path={Icons.info} className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-amber-800">
                                            <strong>Nota:</strong> Los costos de ventas (5.01) se calculan de forma general 
                                            ya que pueden existir transferencias entre sucursales.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </FadeIn>

                {/* Resumen Principal */}
                <FadeIn delay={100} className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card variant="success">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-emerald-600 font-bold uppercase">Ventas Totales</p>
                                    <p className="text-3xl font-black text-emerald-800 mt-1">C$ {fmt(reportData.totalVentas)}</p>
                                    <p className="text-xs text-emerald-600 mt-1">{reportData.cantidadVentas} transacciones</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Icon path={Icons.dollar} className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </Card>

                        <Card variant="warning">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-amber-600 font-bold uppercase">COS</p>
                                    <p className="text-3xl font-black text-amber-800 mt-1">C$ {fmt(reportData.cos)}</p>
                                    <p className="text-xs text-amber-600 mt-1">{reportData.porcentajes.cos.toFixed(1)}% de ventas</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Icon path={Icons.package} className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </Card>

                        <Card variant="danger">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-rose-600 font-bold uppercase">Gastos</p>
                                    <p className="text-3xl font-black text-rose-800 mt-1">C$ {fmt(reportData.totalGastos)}</p>
                                    <p className="text-xs text-rose-600 mt-1">{reportData.porcentajes.gastos.toFixed(1)}% de ventas</p>
                                </div>
                                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                                    <Icon path={Icons.wallet} className="w-6 h-6 text-rose-600" />
                                </div>
                            </div>
                        </Card>

                        <Card variant={reportData.resultadoOperacion >= 0 ? 'success' : 'danger'}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-bold uppercase ${reportData.resultadoOperacion >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        Resultado Operación
                                    </p>
                                    <p className={`text-3xl font-black mt-1 ${reportData.resultadoOperacion >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                                        C$ {fmt(reportData.resultadoOperacion)}
                                    </p>
                                    <p className={`text-xs mt-1 ${reportData.resultadoOperacion >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {reportData.porcentajes.resultado.toFixed(1)}% de ventas
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${reportData.resultadoOperacion >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                    <Icon path={reportData.resultadoOperacion >= 0 ? Icons.trendUp : Icons.trendDown} 
                                          className={`w-6 h-6 ${reportData.resultadoOperacion >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                                </div>
                            </div>
                        </Card>
                    </div>
                </FadeIn>

                {/* Estado de Resultados Detallado */}
                <FadeIn delay={150} className="mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Icon path={Icons.chart} className="w-5 h-5 text-blue-600" />
                                Estado de Resultados Detallado
                            </h3>
                        </div>
                        
                        <div className="p-6">
                            {/* VENTAS */}
                            <div className="mb-6 pb-6 border-b border-slate-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800">VENTAS TOTALES</h4>
                                        <p className="text-sm text-slate-500">Ingresos manuales + Créditos + Cierres de caja</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-emerald-600">C$ {fmt(reportData.totalVentas)}</p>
                                        <p className="text-sm text-slate-500">100.0%</p>
                                    </div>
                                </div>
                                <ProgressBar value={reportData.totalVentas} max={reportData.totalVentas} color="emerald" label="Base 100%" />
                            </div>

                            {/* COS */}
                            <div className="mb-6 pb-6 border-b border-slate-200">
                                <h4 className="text-lg font-bold text-slate-800 mb-4">COSTO DE VENTAS (COS)</h4>
                                
                                <div className="space-y-3 pl-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">(+) Inventario Inicial</span>
                                        <span className="font-semibold text-slate-800">C$ {fmt(reportData.inventarioInicial)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">(+) Costos de Ventas (5.01)</span>
                                        <span className="font-semibold text-slate-800">C$ {fmt(reportData.costosVentasMovimientos)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">(-) Inventario Final</span>
                                        <span className="font-semibold text-slate-800">C$ {fmt(reportData.inventarioFinal)}</span>
                                    </div>
                                    
                                    <div className="pt-3 border-t border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-amber-700">= COSTO DE VENTAS</span>
                                            <div className="text-right">
                                                <span className="text-xl font-black text-amber-700">C$ {fmt(reportData.cos)}</span>
                                                <span className="ml-3 text-sm text-amber-600">({reportData.porcentajes.cos.toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                        <ProgressBar value={reportData.cos} max={reportData.totalVentas} color="amber" label="% sobre ventas" />
                                    </div>
                                </div>

                                {/* COS por sucursal si hay filtro */}
                                {selectedBranch && cosPorSucursal && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <h5 className="font-bold text-blue-800 mb-2">
                                            COS de {getBranchName(selectedBranch)}
                                        </h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-blue-600">Inv. Inicial:</span>
                                                <span className="font-semibold">C$ {fmt(cosPorSucursal.invInicial)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-blue-600">Inv. Final:</span>
                                                <span className="font-semibold">C$ {fmt(cosPorSucursal.invFinal)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-blue-200">
                                                <span className="font-bold text-blue-800">COS Sucursal:</span>
                                                <span className="font-bold text-blue-800">C$ {fmt(cosPorSucursal.cos)} ({cosPorSucursal.porcentajeCos.toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* UTILIDAD BRUTA */}
                            <div className="mb-6 pb-6 border-b border-slate-200">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-bold text-slate-800">UTILIDAD BRUTA</h4>
                                    <div className="text-right">
                                        <span className={`text-xl font-black ${reportData.utilidadBruta >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                            C$ {fmt(reportData.utilidadBruta)}
                                        </span>
                                        <span className={`ml-3 text-sm ${reportData.utilidadBruta >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                                            ({reportData.porcentajes.utilidadBruta.toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                                <ProgressBar 
                                    value={Math.abs(reportData.utilidadBruta)} 
                                    max={reportData.totalVentas} 
                                    color={reportData.utilidadBruta >= 0 ? 'blue' : 'rose'} 
                                    label="% sobre ventas" 
                                />
                            </div>

                            {/* GASTOS */}
                            <div className="mb-6 pb-6 border-b border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-bold text-slate-800">GASTOS OPERATIVOS</h4>
                                    <button
                                        onClick={() => setShowGastosDetail(!showGastosDetail)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-600 transition-colors"
                                    >
                                        <Icon path={showGastosDetail ? Icons.eyeOff : Icons.eye} className="w-4 h-4" />
                                        {showGastosDetail ? 'Ocultar detalle' : 'Ver detalle'}
                                    </button>
                                </div>

                                {/* Total Gastos */}
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-rose-700">TOTAL GASTOS</span>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-rose-700">C$ {fmt(reportData.totalGastos)}</span>
                                        <span className="ml-3 text-sm text-rose-600">({reportData.porcentajes.gastos.toFixed(1)}%)</span>
                                    </div>
                                </div>
                                <ProgressBar value={reportData.totalGastos} max={reportData.totalVentas} color="rose" label="% sobre ventas" />

                                {/* Desglose de Gastos */}
                                {showGastosDetail && reportData.gastosDetalle.length > 0 && (
                                    <div className="mt-4 space-y-3 pl-4">
                                        {reportData.gastosDetalle.map((gasto, index) => (
                                            <div key={index} className="p-3 bg-slate-50 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-slate-700">{gasto.categoria}</span>
                                                    <div className="text-right">
                                                        <span className="font-bold text-slate-800">C$ {fmt(gasto.amount)}</span>
                                                        <span className="ml-2 text-xs text-slate-500">({gasto.porcentaje.toFixed(1)}%)</span>
                                                    </div>
                                                </div>
                                                <ProgressBar 
                                                    value={gasto.amount} 
                                                    max={reportData.totalVentas} 
                                                    color="rose" 
                                                    label={`${gasto.count} transacciones`} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showGastosDetail && reportData.gastosDetalle.length === 0 && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center text-slate-500">
                                        No hay gastos registrados para este período
                                    </div>
                                )}
                            </div>

                            {/* RESULTADO DE OPERACIÓN */}
                            <div>
                                <div className="flex justify-between items-center p-4 bg-slate-100 rounded-xl">
                                    <h4 className="text-xl font-bold text-slate-800">RESULTADO DE LA OPERACIÓN</h4>
                                    <div className="text-right">
                                        <span className={`text-3xl font-black ${reportData.resultadoOperacion >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            C$ {fmt(reportData.resultadoOperacion)}
                                        </span>
                                        <span className={`ml-3 text-sm font-bold ${reportData.resultadoOperacion >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            ({reportData.porcentajes.resultado.toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                {/* Resumen por Sucursales */}
                {!selectedBranch && (
                    <FadeIn delay={200}>
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Icon path={Icons.building} className="w-5 h-5 text-blue-600" />
                                    Resumen por Sucursal
                                </h3>
                            </div>
                            
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Sucursal</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Ventas</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Inv. Inicial</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Inv. Final</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">COS</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Gastos</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Resultado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {branches.map(branch => {
                                                // Calcular datos por sucursal
                                                const ventasSuc = ventas
                                                    .filter(v => {
                                                        const month = getMonthFromDate(v.fecha) || v.month;
                                                        return month === selectedMonth && v.sucursal === branch.id;
                                                    })
                                                    .reduce((sum, v) => sum + (v.amount || 0), 0);
                                                
                                                const invInicialSuc = inventarios
                                                    .filter(i => i.month === selectedMonth && i.sucursal === branch.id && i.type === 'inicial')
                                                    .reduce((sum, i) => sum + (i.amount || 0), 0);
                                                
                                                const invFinalSuc = inventarios
                                                    .filter(i => i.month === selectedMonth && i.sucursal === branch.id && i.type === 'final')
                                                    .reduce((sum, i) => sum + (i.amount || 0), 0);
                                                
                                                const gastosSuc = gastos
                                                    .filter(g => {
                                                        const month = getMonthFromDate(g.fecha) || g.month;
                                                        return month === selectedMonth && g.sucursal === branch.id;
                                                    })
                                                    .reduce((sum, g) => sum + (g.amount || 0), 0);
                                                
                                                const cosSuc = invInicialSuc + reportData.costosVentasMovimientos - invFinalSuc;
                                                const resultadoSuc = ventasSuc - cosSuc - gastosSuc;
                                                
                                                return (
                                                    <tr key={branch.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-semibold text-slate-800">{branch.name}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">C$ {fmt(ventasSuc)}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">C$ {fmt(invInicialSuc)}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">C$ {fmt(invFinalSuc)}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-amber-600">C$ {fmt(cosSuc)}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-rose-600">C$ {fmt(gastosSuc)}</td>
                                                        <td className={`px-4 py-3 text-right font-bold ${resultadoSuc >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            C$ {fmt(resultadoSuc)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                )}
            </div>
        </div>
    );
}
