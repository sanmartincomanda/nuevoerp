// src/components/ERP/MovimientosContables.jsx
// Historial unificado de movimientos contables - La única fuente de verdad del ERP

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { usePlanCuentas } from '../../hooks/useUnifiedAccounting';
import { fmt } from '../../constants';

// Iconos SVG
const Icons = {
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
    arrowDown: "M19 14l-7 7m0 0l-7-7m7 7V3",
    arrowUp: "M5 10l7-7m0 0l7 7m-7-7v18",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    calculator: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    x: "M6 18L18 6M6 6l12 12",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
    </svg>
);

const Button = ({ children, variant = 'primary', className = '', disabled, size = 'md', ...props }) => {
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
    const variants = { 
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20', 
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20', 
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20', 
        warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20', 
        purple: 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20',
        slate: 'bg-slate-700 hover:bg-slate-800 text-white shadow-md shadow-slate-500/20',
        ghost: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm',
        light: 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
    };
    
    return (
        <button disabled={disabled} className={`${sizes[size]} rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Badge = ({ children, variant = 'default', size = 'md' }) => {
    const variants = { 
        default: 'bg-slate-100 text-slate-700 border-slate-200', 
        success: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        danger: 'bg-rose-100 text-rose-800 border-rose-200', 
        warning: 'bg-amber-100 text-amber-800 border-amber-200', 
        info: 'bg-blue-100 text-blue-800 border-blue-200', 
        purple: 'bg-violet-100 text-violet-800 border-violet-200',
        dark: 'bg-slate-800 text-white border-slate-700'
    };
    
    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base font-bold'
    };
    
    return (
        <span className={`inline-flex items-center rounded-full border font-semibold ${variants[variant]} ${sizes[size]}`}>
            {children}
        </span>
    );
};

// Tipos de documentos
const DOCUMENT_TYPES_LABELS = {
    cierreCaja: { label: 'Cierre de Caja', color: 'blue' },
    depositoTransito: { label: 'Depósito en Tránsito', color: 'amber' },
    depositoBancario: { label: 'Depósito Bancario', color: 'emerald' },
    facturaCuentaPagar: { label: 'Factura por Pagar', color: 'rose' },
    abonoCuentaPagar: { label: 'Abono a Cuenta', color: 'violet' },
    gasto: { label: 'Gasto', color: 'orange' },
    ingreso: { label: 'Ingreso', color: 'cyan' },
    ajusteManual: { label: 'Ajuste Manual', color: 'purple' },
    diferenciaCaja: { label: 'Diferencia de Caja', color: 'red' }
};

// Módulos de origen
const MODULOS_ORIGEN = {
    cierreCaja: 'Cierre de Caja',
    depositosTransito: 'Depósitos en Tránsito',
    depositosBancarios: 'Depósitos Bancarios',
    cuentasPagar: 'Cuentas por Pagar',
    gastos: 'Gastos',
    ingresos: 'Ingresos',
    ajustesManuales: 'Ajustes Manuales'
};

export default function MovimientosContables() {
    const { accounts, getAccountById } = usePlanCuentas();
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        fechaDesde: '',
        fechaHasta: '',
        accountId: '',
        documentoTipo: '',
        moduloOrigen: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Cargar movimientos
    useEffect(() => {
        const movimientosRef = collection(db, 'movimientosContables');
        let q = query(movimientosRef, orderBy('timestamp', 'desc'));
        
        // Aplicar filtros
        if (filters.fechaDesde) {
            q = query(q, where('fecha', '>=', filters.fechaDesde));
        }
        if (filters.fechaHasta) {
            q = query(q, where('fecha', '<=', filters.fechaHasta));
        }
        if (filters.accountId) {
            q = query(q, where('accountId', '==', filters.accountId));
        }
        if (filters.documentoTipo) {
            q = query(q, where('documentoTipo', '==', filters.documentoTipo));
        }
        if (filters.moduloOrigen) {
            q = query(q, where('moduloOrigen', '==', filters.moduloOrigen));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMovimientos(data);
            setLoading(false);
        }, (error) => {
            console.error('Error cargando movimientos:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [filters]);

    // Calcular totales
    const totalDebitos = movimientos.filter(m => m.type === 'DEBITO').reduce((sum, m) => sum + m.monto, 0);
    const totalCreditos = movimientos.filter(m => m.type === 'CREDITO').reduce((sum, m) => sum + m.monto, 0);

    // Agrupar por fecha
    const movimientosPorFecha = movimientos.reduce((acc, m) => {
        const fecha = m.fecha;
        if (!acc[fecha]) acc[fecha] = [];
        acc[fecha].push(m);
        return acc;
    }, {});

    const formatFecha = (fechaStr) => {
        const [year, month, day] = fechaStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDocumentoLabel = (tipo) => {
        return DOCUMENT_TYPES_LABELS[tipo] || { label: tipo, color: 'default' };
    };

    const handleClearFilters = () => {
        setFilters({
            fechaDesde: '',
            fechaHasta: '',
            accountId: '',
            documentoTipo: '',
            moduloOrigen: ''
        });
    };

    const handleExportCSV = () => {
        const headers = ['Fecha', 'Hora', 'Cuenta', 'Código', 'Tipo', 'Monto', 'Descripción', 'Referencia', 'Documento', 'Módulo', 'Usuario'];
        const rows = movimientos.map(m => [
            m.fecha,
            formatTimestamp(m.timestamp),
            m.accountName,
            m.accountCode,
            m.type,
            m.monto,
            m.descripcion,
            m.referencia,
            getDocumentoLabel(m.documentoTipo).label,
            MODULOS_ORIGEN[m.moduloOrigen] || m.moduloOrigen,
            m.userEmail
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `movimientos_contables_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2">
                                Movimientos <span className="text-blue-600">Contables</span>
                            </h1>
                            <p className="text-slate-500">Historial unificado de todas las transacciones del sistema ERP</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
                                <Icon path={Icons.filter} className="w-4 h-4" />
                                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                            </Button>
                            <Button variant="slate" onClick={handleExportCSV}>
                                <Icon path={Icons.download} className="w-4 h-4" />
                                Exportar CSV
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                {showFilters && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Desde</label>
                                <input
                                    type="date"
                                    value={filters.fechaDesde}
                                    onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Hasta</label>
                                <input
                                    type="date"
                                    value={filters.fechaHasta}
                                    onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Cuenta</label>
                                <select
                                    value={filters.accountId}
                                    onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                >
                                    <option value="">Todas las cuentas</option>
                                    {accounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Tipo de Documento</label>
                                <select
                                    value={filters.documentoTipo}
                                    onChange={(e) => setFilters({ ...filters, documentoTipo: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                >
                                    <option value="">Todos</option>
                                    {Object.entries(DOCUMENT_TYPES_LABELS).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Módulo</label>
                                <select
                                    value={filters.moduloOrigen}
                                    onChange={(e) => setFilters({ ...filters, moduloOrigen: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                >
                                    <option value="">Todos</option>
                                    {Object.entries(MODULOS_ORIGEN).map(([key, val]) => (
                                        <option key={key} value={key}>{val}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button variant="light" size="sm" onClick={handleClearFilters}>
                                <Icon path={Icons.refresh} className="w-4 h-4" />
                                Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                )}

                {/* Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Icon path={Icons.calculator} className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase">Total Movimientos</p>
                                <p className="text-2xl font-black text-slate-900">{movimientos.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Icon path={Icons.arrowDown} className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase">Total Débitos</p>
                                <p className="text-2xl font-black text-emerald-600">{fmt(totalDebitos)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                                <Icon path={Icons.arrowUp} className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase">Total Créditos</p>
                                <p className="text-2xl font-black text-rose-600">{fmt(totalCreditos)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                <Icon path={Icons.cash} className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase">Balance</p>
                                <p className={`text-2xl font-black ${totalDebitos === totalCreditos ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {fmt(totalDebitos - totalCreditos)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de Movimientos */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-slate-500 font-medium">Cargando movimientos...</p>
                        </div>
                    ) : movimientos.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Icon path={Icons.fileText} className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-lg font-medium text-slate-600">No hay movimientos</p>
                            <p className="text-sm">Ajuste los filtros para ver más resultados</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600">Fecha/Hora</th>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600">Cuenta</th>
                                        <th className="px-4 py-3 text-center font-bold text-slate-600">Tipo</th>
                                        <th className="px-4 py-3 text-right font-bold text-slate-600">Monto</th>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600">Descripción</th>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600">Referencia</th>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600">Documento</th>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600">Módulo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(movimientosPorFecha).map(([fecha, movs]) => (
                                        <React.Fragment key={fecha}>
                                            <tr className="bg-slate-100">
                                                <td colSpan="8" className="px-4 py-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                        {formatFecha(fecha)}
                                                    </span>
                                                </td>
                                            </tr>
                                            {movs.map((mov) => {
                                                const docInfo = getDocumentoLabel(mov.documentoTipo);
                                                return (
                                                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-xs text-slate-500">{formatTimestamp(mov.timestamp)}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-slate-900">{mov.accountName}</div>
                                                            <div className="text-xs text-slate-500 font-mono">{mov.accountCode}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                mov.type === 'DEBITO' 
                                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                                    : 'bg-rose-100 text-rose-800'
                                                            }`}>
                                                                {mov.type === 'DEBITO' ? 'DÉBITO' : 'CRÉDITO'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`font-bold ${
                                                                mov.type === 'DEBITO' ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {mov.type === 'DEBITO' ? '+' : '-'}{fmt(mov.monto)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 max-w-xs">
                                                            <div className="text-sm text-slate-700 truncate" title={mov.descripcion}>
                                                                {mov.descripcion}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                                {mov.referencia}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant={docInfo.color === 'blue' ? 'info' : docInfo.color === 'emerald' ? 'success' : docInfo.color === 'rose' ? 'danger' : docInfo.color === 'amber' ? 'warning' : 'purple'} size="sm">
                                                                {docInfo.label}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs text-slate-600">
                                                                {MODULOS_ORIGEN[mov.moduloOrigen] || mov.moduloOrigen}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
