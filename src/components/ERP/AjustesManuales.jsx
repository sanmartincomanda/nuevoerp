// src/components/ERP/AjustesManuales.jsx
// Módulo de Ajustes Manuales con flujo de aprobación y trazabilidad

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { usePlanCuentas } from '../../hooks/useUnifiedAccounting';
import { createAjusteManual, aprobarAjusteManual, rechazarAjusteManual } from '../../services/unifiedAccountingService';
import { useAuth } from '../../context/AuthContext';
import { fmt } from '../../constants';

// Iconos SVG
const Icons = {
    plus: "M12 4v16m8-8H4",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    check: "M5 13l4 4L19 7",
    checkCircle: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    calculator: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    alertCircle: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    unlock: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
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

const Card = ({ title, children, className = "", right, icon, variant = "default", collapsible = false, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    const variants = {
        default: "bg-white border-slate-200 shadow-sm",
        primary: "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 shadow-lg shadow-blue-500/25 text-white",
        success: "bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-600 shadow-lg shadow-emerald-500/25 text-white",
        warning: "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-500 shadow-lg shadow-amber-500/25 text-white",
        danger: "bg-gradient-to-br from-rose-600 to-rose-700 border-rose-600 shadow-lg shadow-rose-500/25 text-white",
        dark: "bg-slate-900 border-slate-800 shadow-xl text-white"
    };

    const isDark = variant !== "default";
    
    return (
        <div className={`rounded-xl overflow-hidden border ${variants[variant]} ${className} transition-all duration-300`}>
            <div className={`flex justify-between items-center px-6 py-4 ${collapsible ? 'cursor-pointer hover:bg-black/5' : ''} transition-colors`} 
                 onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}>
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className={`p-2.5 rounded-lg ${isDark ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-50'}`}>
                            <Icon path={Icons[icon]} className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-600'}`} />
                        </div>
                    )}
                    <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {right}
                    {collapsible && (
                        <div className={`p-1 rounded-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                            <svg className={`w-4 h-4 ${isDark ? 'text-white' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
            {(!collapsible || isOpen) && (
                <div className={`${isDark ? 'bg-white/5' : 'bg-white'} px-6 py-6`}>
                    {children}
                </div>
            )}
        </div>
    );
};

// Tipos de ajuste
const TIPOS_AJUSTE = [
    { value: 'saldoInicial', label: 'Saldo Inicial', description: 'Para registrar saldos iniciales de cuentas al iniciar el sistema' },
    { value: 'correccion', label: 'Corrección', description: 'Para corregir errores en transacciones anteriores' },
    { value: 'depreciacion', label: 'Depreciación', description: 'Para registrar depreciación de activos' },
    { value: 'otro', label: 'Otro', description: 'Para cualquier otro tipo de ajuste' }
];

// Estados de ajuste
const ESTADOS_AJUSTE = {
    pendiente: { label: 'Pendiente', color: 'warning' },
    aprobado: { label: 'Aprobado', color: 'success' },
    rechazado: { label: 'Rechazado', color: 'danger' }
};

export default function AjustesManuales() {
    const { user, userRole, canApprove } = useAuth();
    const { accounts, getAccountById } = usePlanCuentas();
    const [ajustes, setAjustes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('nuevo');
    const [showForm, setShowForm] = useState(false);

    // Formulario
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().substring(0, 10),
        tipo: 'saldoInicial',
        cuentaId: '',
        tipoMovimiento: 'DEBITO',
        monto: '',
        montoUSD: '',
        cuentaContrapartidaId: '',
        descripcion: '',
        justificacion: '',
        documentoSoporteURL: ''
    });

    // Cargar ajustes
    useEffect(() => {
        const ajustesRef = collection(db, 'ajustesManuales');
        const q = query(ajustesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAjustes(data);
            setLoading(false);
        }, (error) => {
            console.error('Error cargando ajustes:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = async () => {
        if (!formData.cuentaId || !formData.cuentaContrapartidaId || !formData.monto) {
            alert('Debe completar todos los campos obligatorios');
            return;
        }

        if (formData.cuentaId === formData.cuentaContrapartidaId) {
            alert('La cuenta a ajustar y la contrapartida no pueden ser la misma');
            return;
        }

        setLoading(true);
        try {
            const cuenta = getAccountById(formData.cuentaId);
            const cuentaContrapartida = getAccountById(formData.cuentaContrapartidaId);

            const ajusteData = {
                fecha: formData.fecha,
                tipo: formData.tipo,
                cuentaId: formData.cuentaId,
                cuentaCode: cuenta?.code || '',
                cuentaName: cuenta?.name || '',
                tipoMovimiento: formData.tipoMovimiento,
                monto: Number(formData.monto),
                montoUSD: Number(formData.montoUSD || 0),
                cuentaContrapartidaId: formData.cuentaContrapartidaId,
                cuentaContrapartidaCode: cuentaContrapartida?.code || '',
                cuentaContrapartidaName: cuentaContrapartida?.name || '',
                descripcion: formData.descripcion,
                justificacion: formData.justificacion,
                documentoSoporteURL: formData.documentoSoporteURL,
                userId: user?.uid,
                userEmail: user?.email
            };

            await createAjusteManual(ajusteData);
            
            alert('Ajuste creado exitosamente. Debe ser aprobado por un administrador.');
            
            // Reset form
            setFormData({
                fecha: new Date().toISOString().substring(0, 10),
                tipo: 'saldoInicial',
                cuentaId: '',
                tipoMovimiento: 'DEBITO',
                monto: '',
                montoUSD: '',
                cuentaContrapartidaId: '',
                descripcion: '',
                justificacion: '',
                documentoSoporteURL: ''
            });
            setShowForm(false);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAprobar = async (ajusteId) => {
        if (!window.confirm('¿Está seguro de aprobar este ajuste? Se generarán los movimientos contables correspondientes.')) {
            return;
        }

        setLoading(true);
        try {
            await aprobarAjusteManual(ajusteId, user?.uid);
            alert('Ajuste aprobado exitosamente');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRechazar = async (ajusteId) => {
        const motivo = prompt('Ingrese el motivo del rechazo:');
        if (!motivo) return;

        setLoading(true);
        try {
            await rechazarAjusteManual(ajusteId, motivo, user?.uid);
            alert('Ajuste rechazado');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2">
                                Ajustes <span className="text-violet-600">Manuales</span>
                            </h1>
                            <p className="text-slate-500">Ajustes contables con flujo de aprobación y trazabilidad</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {/* Indicador de rol */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Rol:</span>
                                <Badge variant={canApprove ? 'success' : 'default'} size="sm">
                                    {userRole || 'Usuario'}
                                </Badge>
                                {canApprove && (
                                    <span className="text-xs text-emerald-600 font-semibold">
                                        ✓ Puede aprobar
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant={activeTab === 'nuevo' ? 'primary' : 'ghost'}
                                    onClick={() => setActiveTab('nuevo')}
                                >
                                    Nuevo Ajuste
                                </Button>
                                <Button 
                                    variant={activeTab === 'pendientes' ? 'warning' : 'ghost'}
                                    onClick={() => setActiveTab('pendientes')}
                                >
                                    Pendientes
                                </Button>
                                <Button 
                                    variant={activeTab === 'historial' ? 'primary' : 'ghost'}
                                    onClick={() => setActiveTab('historial')}
                                >
                                    Historial
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulario de Nuevo Ajuste */}
                {activeTab === 'nuevo' && (
                    <div className="space-y-6">
                        <Card title="Crear Nuevo Ajuste Manual" icon="calculator" variant="primary">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Fecha del Ajuste</label>
                                    <input
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Tipo de Ajuste</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                    >
                                        {TIPOS_AJUSTE.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {TIPOS_AJUSTE.find(t => t.value === formData.tipo)?.description}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Tipo de Movimiento</label>
                                    <select
                                        value={formData.tipoMovimiento}
                                        onChange={(e) => setFormData({ ...formData, tipoMovimiento: e.target.value })}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                    >
                                        <option value="DEBITO">DÉBITO (Aumenta cuentas deudoras, disminuye acreedoras)</option>
                                        <option value="CREDITO">CRÉDITO (Aumenta cuentas acreedoras, disminuye deudoras)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                                        Cuenta a Ajustar <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.cuentaId}
                                        onChange={(e) => setFormData({ ...formData, cuentaId: e.target.value })}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                        required
                                    >
                                        <option value="">Seleccionar cuenta...</option>
                                        {accounts.filter(a => !a.isGroup).map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                                        Cuenta Contrapartida <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.cuentaContrapartidaId}
                                        onChange={(e) => setFormData({ ...formData, cuentaContrapartidaId: e.target.value })}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                        required
                                    >
                                        <option value="">Seleccionar cuenta...</option>
                                        {accounts.filter(a => !a.isGroup).map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.type})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                                        Monto (C$) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.monto}
                                        onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                                        Monto (USD) - Opcional
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.montoUSD}
                                        onChange={(e) => setFormData({ ...formData, montoUSD: e.target.value })}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                                    Descripción del Ajuste <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                    placeholder="Ej: Saldo inicial de caja, Corrección de factura #123, etc."
                                    required
                                />
                            </div>

                            <div className="mt-6">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                                    Justificación <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={formData.justificacion}
                                    onChange={(e) => setFormData({ ...formData, justificacion: e.target.value })}
                                    className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none resize-none"
                                    placeholder="Explique el motivo del ajuste y por qué es necesario..."
                                    required
                                />
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-start gap-3">
                                    <Icon path={Icons.info} className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">Información Importante</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Este ajuste quedará en estado &quot;Pendiente&quot; hasta que sea aprobado por un administrador o contador. 
                                            Una vez aprobado, se generarán automáticamente los movimientos contables correspondientes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button variant="ghost" onClick={() => setFormData({
                                    fecha: new Date().toISOString().substring(0, 10),
                                    tipo: 'saldoInicial',
                                    cuentaId: '',
                                    tipoMovimiento: 'DEBITO',
                                    monto: '',
                                    montoUSD: '',
                                    cuentaContrapartidaId: '',
                                    descripcion: '',
                                    justificacion: '',
                                    documentoSoporteURL: ''
                                })}>
                                    <Icon path={Icons.refresh} className="w-4 h-4" />
                                    Limpiar
                                </Button>
                                <Button 
                                    variant="success" 
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    <Icon path={Icons.save} className="w-4 h-4" />
                                    {loading ? 'Creando...' : 'Crear Ajuste Manual'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Lista de Ajustes */}
                {(activeTab === 'pendientes' || activeTab === 'historial') && (
                    <div className="space-y-6">
                        {activeTab === 'pendientes' && (
                            <div className={`border rounded-xl p-4 ${canApprove ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                                <div className="flex items-center gap-3">
                                    <Icon path={canApprove ? Icons.alertCircle : Icons.info} className={`w-6 h-6 ${canApprove ? 'text-amber-600' : 'text-blue-600'}`} />
                                    <div>
                                        <p className={`font-bold ${canApprove ? 'text-amber-800' : 'text-blue-800'}`}>
                                            {canApprove ? 'Ajustes Pendientes de Aprobación' : 'Ajustes Pendientes'}
                                        </p>
                                        <p className={`text-sm ${canApprove ? 'text-amber-700' : 'text-blue-700'}`}>
                                            {canApprove 
                                                ? 'Los ajustes deben ser aprobados por un administrador o contador para generar los movimientos contables.' 
                                                : 'Solo los usuarios con rol Administrador o Contabilidad pueden aprobar ajustes. Contacte a su administrador.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Card title={activeTab === 'pendientes' ? 'Ajustes Pendientes' : 'Historial de Ajustes'} icon="fileText">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-2 text-slate-500">Cargando...</p>
                                </div>
                            ) : ajustes.filter(a => activeTab === 'pendientes' ? a.estado === 'pendiente' : true).length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Icon path={Icons.fileText} className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-lg font-medium text-slate-600">
                                        No hay ajustes {activeTab === 'pendientes' ? 'pendientes' : ''}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Fecha</th>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Tipo</th>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Cuenta</th>
                                                <th className="px-4 py-3 text-center font-bold text-slate-600">Movimiento</th>
                                                <th className="px-4 py-3 text-right font-bold text-slate-600">Monto</th>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Descripción</th>
                                                <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                                                <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {ajustes
                                                .filter(a => activeTab === 'pendientes' ? a.estado === 'pendiente' : true)
                                                .map(ajuste => (
                                                <tr key={ajuste.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-slate-900">{ajuste.fecha}</div>
                                                        <div className="text-xs text-slate-500">{formatTimestamp(ajuste.createdAt)}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-slate-700">
                                                            {TIPOS_AJUSTE.find(t => t.value === ajuste.tipo)?.label || ajuste.tipo}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-slate-900">{ajuste.cuentaName}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{ajuste.cuentaCode}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                            ajuste.tipoMovimiento === 'DEBITO' 
                                                                ? 'bg-emerald-100 text-emerald-800' 
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {ajuste.tipoMovimiento === 'DEBITO' ? 'DÉBITO' : 'CRÉDITO'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold">
                                                        {fmt(ajuste.monto)}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-xs">
                                                        <div className="text-sm text-slate-700 truncate" title={ajuste.descripcion}>
                                                            {ajuste.descripcion}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant={ESTADOS_AJUSTE[ajuste.estado]?.color || 'default'}>
                                                            {ESTADOS_AJUSTE[ajuste.estado]?.label || ajuste.estado}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {ajuste.estado === 'pendiente' && canApprove && (
                                                            <div className="flex justify-center gap-2">
                                                                <Button 
                                                                    variant="success" 
                                                                    size="sm"
                                                                    onClick={() => handleAprobar(ajuste.id)}
                                                                    title="Aprobar ajuste"
                                                                >
                                                                    <Icon path={Icons.check} className="w-4 h-4" />
                                                                </Button>
                                                                <Button 
                                                                    variant="danger" 
                                                                    size="sm"
                                                                    onClick={() => handleRechazar(ajuste.id)}
                                                                    title="Rechazar ajuste"
                                                                >
                                                                    <Icon path={Icons.x} className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {ajuste.estado === 'pendiente' && !canApprove && (
                                                            <span className="text-xs text-slate-400 italic">
                                                                Sin permisos
                                                            </span>
                                                        )}
                                                        {ajuste.estado === 'aprobado' && (
                                                            <span className="text-xs text-emerald-600 font-semibold">
                                                                Aprobado
                                                            </span>
                                                        )}
                                                        {ajuste.estado === 'rechazado' && (
                                                            <span className="text-xs text-rose-600 font-semibold">
                                                                Rechazado
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
