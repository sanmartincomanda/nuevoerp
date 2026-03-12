// src/components/ERP/CierreCajaERP.jsx
// Cierre de Caja ERP - Versión Corregida
// Fórmula de cuadre: Ingreso Total = Desglose Métodos de Pago + Retenciones + Gastos

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { usePlanCuentas } from '../../hooks/useUnifiedAccounting';
import { createCierreCajaERP, updateCierreCajaERPStatus, procesarCierreCajaERP } from '../../services/unifiedAccountingService';
import { uploadMultiplePhotos } from '../../services/accountingService';
import { fmt } from '../../constants';
import { useAuth } from '../../context/AuthContext';

// Iconos SVG
const Icons = {
    plus: "M12 4v16m8-8H4", save: "M5 13l4 4L19 7", x: "M6 18L18 6M6 6l12 12", check: "M5 13l4 4L19 7",
    printer: "M6 9V3h12v6M6 15h12v6H6z M6 9h12", calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    cash: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    creditCard: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    alertCircle: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    unlock: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12", trendingDown: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    camera: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    calculator: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    checkCircle: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", exclamation: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
    </svg>
);

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
            <div className={`flex justify-between items-center px-6 py-4 ${collapsible ? 'cursor-pointer hover:bg-black/5' : ''} transition-colors`} onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}>
                <div className="flex items-center gap-3">
                    {icon && <div className={`p-2.5 rounded-lg ${isDark ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-50'}`}><Icon path={Icons[icon]} className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-600'}`} /></div>}
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                </div>
                <div className="flex items-center gap-3">{right}{collapsible && <div className={`p-1 rounded-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}><svg className={`w-4 h-4 ${isDark ? 'text-white' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>}</div>
            </div>
            {(!collapsible || isOpen) && <div className={`${isDark ? 'bg-white/5' : 'bg-white'} px-6 py-6`}>{children}</div>}
        </div>
    );
};

const Button = ({ children, variant = 'primary', className = '', disabled, size = 'md', ...props }) => {
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
    const variants = { 
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20', 
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20', 
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20', 
        warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20', 
        purple: 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20',
        slate: 'bg-slate-800 hover:bg-slate-900 text-white shadow-md shadow-slate-500/20',
        ghost: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm',
        light: 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
    };
    return <button disabled={disabled} className={`${sizes[size]} rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Badge = ({ children, variant = 'default', size = 'md' }) => {
    const variants = { default: 'bg-slate-100 text-slate-700 border-slate-200', success: 'bg-emerald-100 text-emerald-800 border-emerald-200', danger: 'bg-rose-100 text-rose-800 border-rose-200', warning: 'bg-amber-100 text-amber-800 border-amber-200', info: 'bg-blue-100 text-blue-800 border-blue-200', purple: 'bg-violet-100 text-violet-800 border-violet-200', dark: 'bg-slate-800 text-white border-slate-700' };
    const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm', lg: 'px-4 py-1.5 text-base font-bold' };
    return <span className={`inline-flex items-center rounded-full border font-semibold ${variants[variant]} ${sizes[size]}`}>{children}</span>;
};

const Input = ({ label, icon, type = "text", className = '', helper, ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <div className="space-y-1.5">
            {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">{label}{props.required && <span className="text-rose-500">*</span>}</label>}
            <div className={`relative group transition-all duration-200 ${focus ? 'transform scale-[1.01]' : ''}`}>
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10"><Icon path={Icons[icon]} className={`w-5 h-5 transition-colors duration-200 ${focus ? 'text-blue-600' : 'text-slate-400'}`} /></div>}
                <input type={type} className={`w-full bg-white border-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 ${icon ? 'pl-10' : ''} ${focus ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'} ${className}`} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />
            </div>
            {helper && <p className="text-xs text-slate-500">{helper}</p>}
        </div>
    );
};

const Select = ({ label, icon, options, className = '', ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <div className="space-y-1.5">
            {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}{props.required && <span className="text-rose-500 ml-0.5">*</span>}</label>}
            <div className={`relative transition-all duration-200 ${focus ? 'transform scale-[1.01]' : ''}`}>
                {icon && <Icon path={Icons[icon]} className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focus ? 'text-blue-600' : 'text-slate-400'}`} />}
                <select className={`w-full bg-white border-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all duration-200 appearance-none cursor-pointer ${icon ? 'pl-10' : ''} ${focus ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'} ${className}`} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props}>
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
            </div>
        </div>
    );
};

// Componente: Lista de Facturas Membretadas (individual)
const FacturasMembretadasList = ({ facturas, onChange, monedaDefault = 'NIO' }) => {
    const addFactura = () => onChange([...facturas, { folio: '', cliente: '', monto: '', moneda: monedaDefault, observacion: '' }]);
    const updateFactura = (index, field, value) => { const nuevas = [...facturas]; nuevas[index] = { ...nuevas[index], [field]: value }; onChange(nuevas); };
    const removeFactura = (index) => onChange(facturas.filter((_, i) => i !== index));
    const totalFacturas = facturas.reduce((sum, f) => sum + (Number(f.monto) || 0), 0);
    return (
        <div className="space-y-4">
            {facturas.map((factura, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-3"><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Folio</label><input type="text" value={factura.folio} onChange={(e) => updateFactura(index, 'folio', e.target.value)} placeholder="001-001-000001" className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none" /></div>
                        <div className="col-span-3"><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Cliente</label><input type="text" value={factura.cliente} onChange={(e) => updateFactura(index, 'cliente', e.target.value)} placeholder="Nombre del cliente" className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none" /></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Monto</label><input type="number" step="0.01" value={factura.monto} onChange={(e) => updateFactura(index, 'monto', e.target.value)} placeholder="0.00" className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none" /></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Moneda</label><select value={factura.moneda} onChange={(e) => updateFactura(index, 'moneda', e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"><option value="NIO">C$</option><option value="USD">$</option></select></div>
                        <div className="col-span-1"><button onClick={() => removeFactura(index)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Icon path={Icons.trash} className="w-5 h-5" /></button></div>
                    </div>
                    <div className="mt-3"><input type="text" value={factura.observacion} onChange={(e) => updateFactura(index, 'observacion', e.target.value)} placeholder="Observación (opcional)" className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-blue-500 outline-none" /></div>
                </div>
            ))}
            <Button variant="light" onClick={addFactura} className="w-full py-3 border-dashed border-2"><Icon path={Icons.plus} className="w-4 h-4" />Agregar Factura Membretada</Button>
            {facturas.length > 0 && <div className="p-4 bg-blue-50 rounded-lg border border-blue-100"><div className="flex justify-between items-center"><span className="text-sm font-semibold text-blue-800">Total Facturas Membretadas:</span><span className="text-xl font-black text-blue-700">{fmt(totalFacturas)}</span></div></div>}
        </div>
    );
};

// Componente: Validador de Cuadre
const CuadreValidator = ({ cuadre }) => {
    if (!cuadre) return null;
    const { totalIngreso, totalMediosPago, totalRetenciones, totalGastosCaja, totalEsperado, diferencia, estaCuadrado } = cuadre;
    return (
        <div className={`p-6 rounded-xl border-2 ${estaCuadrado ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${estaCuadrado ? 'bg-emerald-100' : 'bg-rose-100'}`}><Icon path={estaCuadrado ? Icons.checkCircle : Icons.exclamation} className={`w-6 h-6 ${estaCuadrado ? 'text-emerald-600' : 'text-rose-600'}`} /></div>
                <div>
                    <h4 className={`text-lg font-bold ${estaCuadrado ? 'text-emerald-800' : 'text-rose-800'}`}>{estaCuadrado ? '¡Cierre Cuadrado!' : 'Cierre No Cuadrado'}</h4>
                    <p className={`text-sm ${estaCuadrado ? 'text-emerald-600' : 'text-rose-600'}`}>{estaCuadrado ? 'Todos los montos coinciden correctamente' : `Diferencia detectada: ${fmt(diferencia)}`}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200"><p className="text-xs text-slate-500 uppercase font-bold">Ingreso Total</p><p className="text-lg font-black text-slate-800">{fmt(totalIngreso)}</p></div>
                <div className="bg-white p-3 rounded-lg border border-slate-200"><p className="text-xs text-slate-500 uppercase font-bold">Medios de Pago</p><p className="text-lg font-black text-blue-600">{fmt(totalMediosPago)}</p></div>
                <div className="bg-white p-3 rounded-lg border border-slate-200"><p className="text-xs text-slate-500 uppercase font-bold">Retenciones + Gastos</p><p className="text-lg font-black text-rose-600">{fmt(totalRetenciones + totalGastosCaja)}</p></div>
                <div className={`p-3 rounded-lg border ${estaCuadrado ? 'bg-emerald-100 border-emerald-200' : 'bg-rose-100 border-rose-200'}`}><p className={`text-xs uppercase font-bold ${estaCuadrado ? 'text-emerald-700' : 'text-rose-700'}`}>Diferencia</p><p className={`text-lg font-black ${estaCuadrado ? 'text-emerald-700' : 'text-rose-700'}`}>{fmt(diferencia)}</p></div>
            </div>
            {!estaCuadrado && <div className="p-4 bg-rose-100 rounded-lg border border-rose-200"><div className="flex items-start gap-3"><Icon path={Icons.info} className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-rose-800">No se puede cerrar la caja</p><p className="text-sm text-rose-600 mt-1">El cierre solo puede completarse cuando la diferencia sea cero. Revise los montos ingresados o guarde como &quot;Borrador&quot; para revisión posterior.</p></div></div></div>}
        </div>
    );
};

// Componente: Arqueo Modal
const ArqueoModal = ({ isOpen, onClose, onSave, efectivoEsperadoCS, efectivoEsperadoUSD }) => {
    const [conteoCS, setConteoCS] = useState('');
    const [conteoUSD, setConteoUSD] = useState('');
    const [comentario, setComentario] = useState('');
    if (!isOpen) return null;
    const diferenciaCS = Number(conteoCS || 0) - efectivoEsperadoCS;
    const diferenciaUSD = Number(conteoUSD || 0) - efectivoEsperadoUSD;
    const handleGuardar = () => { onSave({ efectivoContadoCS: conteoCS, efectivoContadoUSD: conteoUSD, comentarioDiferencia: comentario, diferenciaCS, diferenciaUSD }); onClose(); };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><Icon path={Icons.calculator} className="w-5 h-5 text-emerald-600" /></div><div><h3 className="text-lg font-bold text-slate-900">Arqueo de Efectivo</h3><p className="text-xs text-slate-500">Conteo físico opcional del efectivo en caja</p></div></div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Icon path={Icons.x} className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-3 mb-4"><div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><span className="text-emerald-700 font-bold text-sm">C$</span></div><h4 className="font-bold text-slate-900">Córdobas Nicaragüenses</h4></div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg border border-emerald-200"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Efectivo Esperado</p><p className="text-xl font-black text-slate-900">{fmt(efectivoEsperadoCS)}</p></div>
                            <div><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Conteo Físico</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">C$</span><input type="number" step="0.01" value={conteoCS} onChange={(e) => setConteoCS(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-lg font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all" placeholder="0.00" autoFocus /></div></div>
                        </div>
                        {conteoCS !== '' && <div className={`p-3 rounded-lg flex items-center gap-2 ${diferenciaCS === 0 ? 'bg-emerald-100 text-emerald-800' : diferenciaCS > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}><Icon path={diferenciaCS === 0 ? Icons.check : Icons.alertCircle} className="w-5 h-5" /><div><span className="text-xs font-bold uppercase">Diferencia:</span><span className="ml-2 font-black">{fmt(diferenciaCS)}</span></div></div>}
                    </div>
                    <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-4"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><span className="text-blue-700 font-bold text-sm">$</span></div><h4 className="font-bold text-slate-900">Dólares Estadounidenses</h4></div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg border border-blue-200"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Efectivo Esperado</p><p className="text-xl font-black text-slate-900">{fmt(efectivoEsperadoUSD, '$')}</p></div>
                            <div><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Conteo Físico</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span><input type="number" step="0.01" value={conteoUSD} onChange={(e) => setConteoUSD(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-lg font-bold text-slate-900 focus:border-blue-500 outline-none transition-all" placeholder="0.00" /></div></div>
                        </div>
                        {conteoUSD !== '' && <div className={`p-3 rounded-lg flex items-center gap-2 ${diferenciaUSD === 0 ? 'bg-emerald-100 text-emerald-800' : diferenciaUSD > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}><Icon path={diferenciaUSD === 0 ? Icons.check : Icons.alertCircle} className="w-5 h-5" /><div><span className="text-xs font-bold uppercase">Diferencia:</span><span className="ml-2 font-black">{fmt(diferenciaUSD, '$')}</span></div></div>}
                    </div>
                    {(conteoCS !== '' && diferenciaCS !== 0) || (conteoUSD !== '' && diferenciaUSD !== 0) ? <div><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Justificación de Diferencias <span className="text-rose-500">*</span></label><textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Explique el motivo de la diferencia encontrada..." className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 resize-none transition-all" /></div> : null}
                </div>
                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="success" onClick={handleGuardar}><Icon path={Icons.save} className="w-4 h-4" />Guardar Arqueo</Button></div>
            </div>
        </div>
    );
};

// Componente: Photo Uploader
const PhotoUploader = ({ fotos, onPhotosChange, maxPhotos = 5 }) => {
    const [previewUrls, setPreviewUrls] = useState([]);
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + fotos.length > maxPhotos) { alert(`Máximo ${maxPhotos} fotos permitidas`); return; }
        const newPhotos = [...fotos, ...files];
        onPhotosChange(newPhotos);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewUrls([...previewUrls, ...newPreviews]);
    };
    const removePhoto = (index) => {
        const newPhotos = fotos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
        if (previewUrls[index]) URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    };
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
                {fotos.map((foto, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 group hover:border-blue-400 transition-colors">
                        <img src={foto instanceof File ? previewUrls[index] : foto.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={() => removePhoto(index)} className="w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"><Icon path={Icons.trash} className="w-4 h-4" /></button></div>
                    </div>
                ))}
                {fotos.length < maxPhotos && <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"><Icon path={Icons.camera} className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" /><span className="text-xs text-slate-500 mt-1 font-medium group-hover:text-blue-600">Agregar</span><input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" /></label>}
            </div>
            <p className="text-xs text-slate-500 font-medium">{fotos.length} de {maxPhotos} fotos</p>
        </div>
    );
};

// ============ COMPONENTE PRINCIPAL ============
export default function CierreCajaERP() {
    const { user } = useAuth();
    const { getGastoAccounts, getCajaAccounts } = usePlanCuentas();
    const [activeTab, setActiveTab] = useState('nuevo');
    const [loading, setLoading] = useState(false);
    const [showArqueoModal, setShowArqueoModal] = useState(false);
    const [cierres, setCierres] = useState([]);
    const [cierresLoading, setCierresLoading] = useState(true);
    const [editingCierre, setEditingCierre] = useState(null);
    
    const cuentasGastos = getGastoAccounts();
    const cajasDisponibles = getCajaAccounts('NIO');

    // Cargar cierres desde Firebase
    useEffect(() => {
        const cierresRef = collection(db, 'cierresCajaERP');
        const q = query(cierresRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setCierres(data);
            setCierresLoading(false);
        }, (err) => { console.error('Error cargando cierres:', err); setCierresLoading(false); });
        return () => unsubscribe();
    }, []);

    // Formulario inicial
    const initialFormData = {
        fecha: new Date().toISOString().substring(0, 10),
        tienda: 'CSM Granada',
        caja: 'Caja Granada 1',
        cajero: '',
        horaApertura: '06:00',
        horaCierre: '18:00',
        observaciones: '',
        totalIngreso: '',
        // Créditos y abonos - solo montos totalizados (simplificado)
        totalFacturasCredito: '',
        totalAbonosRecibidos: '',
        // Métodos de pago
        efectivoCS: '',
        efectivoUSD: '',
        tipoCambio: '36.50',
        posBAC: '',
        posBANPRO: '',
        posLAFISE: '',
        transferenciaBAC: '',
        transferenciaBANPRO: '',
        transferenciaLAFISE: '',
        // Facturas membretadas (solo estas, no tickets)
        facturasMembretadas: [],
        // Retenciones
        retenciones: [],
        // Gastos de caja
        gastosCaja: [],
        // Arqueo
        arqueo: null,
        // Fotos
        fotos: []
    };

    const [formData, setFormData] = useState(initialFormData);

    // Calcular totales
    const totalEfectivo = Number(formData.efectivoCS || 0) + (Number(formData.efectivoUSD || 0) * Number(formData.tipoCambio || 0));
    const totalPOS = Number(formData.posBAC || 0) + Number(formData.posBANPRO || 0) + Number(formData.posLAFISE || 0);
    const totalTransferencias = Number(formData.transferenciaBAC || 0) + Number(formData.transferenciaBANPRO || 0) + Number(formData.transferenciaLAFISE || 0);
    const totalMediosPago = totalEfectivo + totalPOS + totalTransferencias;
    
    const totalRetenciones = formData.retenciones.reduce((sum, r) => sum + (Number(r.monto) || 0), 0);
    const totalGastosCaja = formData.gastosCaja.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
    
    // FÓRMULA DE CUADRE CORREGIDA:
    // Ingreso Total = Desglose Métodos de Pago + Retenciones + Gastos
    const totalIngreso = Number(formData.totalIngreso || 0);
    const totalEsperado = totalMediosPago + totalRetenciones + totalGastosCaja;
    const diferencia = Number((totalIngreso - totalEsperado).toFixed(2));
    const estaCuadrado = Math.abs(diferencia) < 0.01;
    
    const cuadre = {
        totalIngreso,
        totalMediosPago,
        totalRetenciones,
        totalGastosCaja,
        totalEsperado,
        diferencia,
        estaCuadrado
    };

    const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleArqueoSave = (arqueoData) => setFormData(prev => ({ ...prev, arqueo: arqueoData }));

    // Retenciones
    const addRetencion = () => setFormData(prev => ({ ...prev, retenciones: [...prev.retenciones, { tipo: 'IR', monto: '', cliente: '', facturaRelacionada: '' }] }));
    const updateRetencion = (index, field, value) => setFormData(prev => ({ ...prev, retenciones: prev.retenciones.map((r, i) => i === index ? { ...r, [field]: value } : r) }));
    const removeRetencion = (index) => setFormData(prev => ({ ...prev, retenciones: prev.retenciones.filter((_, i) => i !== index) }));

    // Gastos de caja
    const addGastoCaja = () => setFormData(prev => ({ ...prev, gastosCaja: [...prev.gastosCaja, { cuentaContableId: '', cuentaContableName: '', concepto: '', monto: '', responsable: '' }] }));
    const updateGastoCaja = (index, field, value) => {
        setFormData(prev => ({ 
            ...prev, 
            gastosCaja: prev.gastosCaja.map((g, i) => {
                if (i !== index) return g;
                if (field === 'cuentaContableId') {
                    const cuenta = cuentasGastos.find(c => c.id === value);
                    return { ...g, cuentaContableId: value, cuentaContableName: cuenta?.name || '', cuentaContableCode: cuenta?.code || '', concepto: cuenta?.name || g.concepto };
                }
                return { ...g, [field]: value };
            })
        }));
    };
    const removeGastoCaja = (index) => setFormData(prev => ({ ...prev, gastosCaja: prev.gastosCaja.filter((_, i) => i !== index) }));

    // Guardar cierre
    const handleSave = async (estado = 'borrador') => {
        if (estado === 'cerrado' && !estaCuadrado) {
            alert('No se puede cerrar: El cierre no está cuadrado. Diferencia: ' + fmt(diferencia));
            return;
        }
        if (!formData.cajero.trim()) {
            alert('Debe ingresar el nombre del cajero');
            return;
        }

        setLoading(true);
        try {
            const cierreData = { ...formData, estado, cuadre, userId: user?.uid, userEmail: user?.email };
            
            let cierreId;
            if (editingCierre) {
                // Actualizar cierre existente
                await updateDoc(doc(db, 'cierresCajaERP', editingCierre.id), { ...cierreData, updatedAt: Timestamp.now() });
                cierreId = editingCierre.id;
            } else {
                // Crear nuevo cierre
                const result = await createCierreCajaERP(cierreData);
                cierreId = result.id;
            }

            // Subir fotos si hay
            if (formData.fotos.length > 0) {
                const fotoFiles = formData.fotos.filter(f => f instanceof File);
                if (fotoFiles.length > 0) {
                    const fotosUrls = await uploadMultiplePhotos(fotoFiles, 'cierres', cierreId);
                    await updateDoc(doc(db, 'cierresCajaERP', cierreId), { fotos: fotosUrls, updatedAt: Timestamp.now() });
                }
            }

            // Si es cerrado, procesar movimientos contables
            if (estado === 'cerrado') {
                await procesarCierreCajaERP(cierreId, user?.uid, user?.email);
            }

            alert(`Cierre ${editingCierre ? 'actualizado' : 'guardado'} exitosamente como ${estado.toUpperCase()}`);
            
            // Reset form
            setFormData(initialFormData);
            setEditingCierre(null);
            setActiveTab('historial');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Cargar cierre para editar
    const handleEdit = (cierre) => {
        setEditingCierre(cierre);
        setFormData({
            fecha: cierre.fecha || initialFormData.fecha,
            tienda: cierre.tienda || initialFormData.tienda,
            caja: cierre.caja || initialFormData.caja,
            cajero: cierre.cajero || '',
            horaApertura: cierre.horaApertura || '06:00',
            horaCierre: cierre.horaCierre || '18:00',
            observaciones: cierre.observaciones || '',
            totalIngreso: cierre.totalIngreso || '',
            totalFacturasCredito: cierre.totalFacturasCredito || '',
            totalAbonosRecibidos: cierre.totalAbonosRecibidos || '',
            efectivoCS: cierre.efectivoCS || '',
            efectivoUSD: cierre.efectivoUSD || '',
            tipoCambio: cierre.tipoCambio || '36.50',
            posBAC: cierre.posBAC || '',
            posBANPRO: cierre.posBANPRO || '',
            posLAFISE: cierre.posLAFISE || '',
            transferenciaBAC: cierre.transferenciaBAC || '',
            transferenciaBANPRO: cierre.transferenciaBANPRO || '',
            transferenciaLAFISE: cierre.transferenciaLAFISE || '',
            facturasMembretadas: cierre.facturasMembretadas || [],
            retenciones: cierre.retenciones || [],
            gastosCaja: cierre.gastosCaja || [],
            arqueo: cierre.arqueo || null,
            fotos: cierre.fotos || []
        });
        setActiveTab('nuevo');
    };

    // Cambiar estado de cierre
    const handleCambiarEstado = async (cierre, nuevoEstado) => {
        if (nuevoEstado === 'cerrado') {
            // Verificar si cuadra
            const cierreTotalIngreso = Number(cierre.totalIngreso || 0);
            const cierreMediosPago = Number(cierre.efectivoCS || 0) + (Number(cierre.efectivoUSD || 0) * Number(cierre.tipoCambio || 36.5)) + 
                                     Number(cierre.posBAC || 0) + Number(cierre.posBANPRO || 0) + Number(cierre.posLAFISE || 0) +
                                     Number(cierre.transferenciaBAC || 0) + Number(cierre.transferenciaBANPRO || 0) + Number(cierre.transferenciaLAFISE || 0);
            const cierreRetenciones = (cierre.retenciones || []).reduce((sum, r) => sum + (Number(r.monto) || 0), 0);
            const cierreGastos = (cierre.gastosCaja || []).reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
            const cierreDiferencia = Number((cierreTotalIngreso - (cierreMediosPago + cierreRetenciones + cierreGastos)).toFixed(2));
            
            if (Math.abs(cierreDiferencia) >= 0.01) {
                alert('No se puede cerrar: El cierre tiene una diferencia de ' + fmt(cierreDiferencia));
                return;
            }
        }
        
        if (!window.confirm(`¿Está seguro de cambiar el estado a "${nuevoEstado.toUpperCase()}"?`)) return;
        
        setLoading(true);
        try {
            await updateCierreCajaERPStatus(cierre.id, nuevoEstado, user?.uid);
            if (nuevoEstado === 'cerrado') {
                await procesarCierreCajaERP(cierre.id, user?.uid, user?.email);
            }
            alert(`Cierre cambiado a ${nuevoEstado.toUpperCase()}`);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const TIENDAS = [{ value: 'CSM Granada', label: 'CSM Granada' }, { value: 'Carnes Amparito', label: 'Carnes Amparito' }, { value: 'CSM Masaya', label: 'CSM Masaya' }, { value: 'CEDI', label: 'CEDI' }, { value: 'CSM Granada Inmaculada', label: 'CSM Granada Inmaculada' }];
    const CAJAS = [{ value: 'Caja Granada 1', label: 'Caja Granada 1' }, { value: 'Caja Granada 2', label: 'Caja Granada 2' }, { value: 'Caja Ruta', label: 'Caja Ruta' }, { value: 'Caja Amparito', label: 'Caja Amparito' }];

    const getEstadoBadge = (estado) => {
        const badges = { borrador: <Badge variant="warning">Borrador</Badge>, pendiente: <Badge variant="info">Pendiente</Badge>, cerrado: <Badge variant="success">Cerrado</Badge> };
        return badges[estado] || <Badge>{estado}</Badge>;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"><Icon path={Icons.calculator} className="w-6 h-6 text-white" /></div>
                            <div><h1 className="text-xl font-bold text-slate-900">Cierre de Caja ERP</h1><p className="text-xs text-slate-500 font-medium">Sistema Integral de Control</p></div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => { setActiveTab('nuevo'); setEditingCierre(null); setFormData(initialFormData); }} className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${activeTab === 'nuevo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Nuevo Cierre</button>
                            <button onClick={() => setActiveTab('historial')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${activeTab === 'historial' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Historial</button>
                        </div>
                    </div>
                </div>
            </div>

            <ArqueoModal isOpen={showArqueoModal} onClose={() => setShowArqueoModal(false)} onSave={handleArqueoSave} efectivoEsperadoCS={Number(formData.efectivoCS || 0)} efectivoEsperadoUSD={Number(formData.efectivoUSD || 0)} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'nuevo' ? (
                    <div className="space-y-6">
                        {editingCierre && <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3"><Icon path={Icons.info} className="w-5 h-5 text-blue-600" /><span className="text-sm font-semibold text-blue-800">Editando cierre #{editingCierre.id?.slice(-6)} - Estado: {editingCierre.estado}</span></div>}
                        
                        <Card title="Información General" icon="clipboard" collapsible defaultOpen={true}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Input label="Fecha de Cierre" type="date" icon="calendar" value={formData.fecha} onChange={(e) => handleInputChange('fecha', e.target.value)} />
                                <Select label="Sucursal" icon="building" value={formData.tienda} onChange={(e) => handleInputChange('tienda', e.target.value)} options={TIENDAS} />
                                <Select label="Caja" icon="calculator" value={formData.caja} onChange={(e) => handleInputChange('caja', e.target.value)} options={CAJAS} />
                                <Input label="Cajero Responsable" icon="users" value={formData.cajero} onChange={(e) => handleInputChange('cajero', e.target.value)} placeholder="Nombre completo" required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                <Input label="Hora Apertura" type="time" value={formData.horaApertura} onChange={(e) => handleInputChange('horaApertura', e.target.value)} />
                                <Input label="Hora Cierre" type="time" value={formData.horaCierre} onChange={(e) => handleInputChange('horaCierre', e.target.value)} />
                                <div className="flex items-end"><Badge variant="info" size="lg">Turno: {formData.horaApertura} - {formData.horaCierre}</Badge></div>
                            </div>
                        </Card>

                        <CuadreValidator cuadre={cuadre} />

                        <Card title="Resumen de Ventas SICAR" icon="cash" variant="dark" collapsible defaultOpen={true}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div><label className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 block">Total Ingreso <span className="text-rose-300">*</span></label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">C$</span><input type="number" step="0.01" value={formData.totalIngreso} onChange={(e) => handleInputChange('totalIngreso', e.target.value)} className="w-full bg-white text-slate-900 border-0 rounded-lg pl-10 pr-4 py-3 text-lg font-bold placeholder-slate-400 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all" placeholder="0.00" /></div><p className="text-xs text-blue-200/70 mt-1">Total de ingresos según SICAR</p></div>
                                <div><label className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 block">Total Facturas de Crédito</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">C$</span><input type="number" step="0.01" value={formData.totalFacturasCredito} onChange={(e) => handleInputChange('totalFacturasCredito', e.target.value)} className="w-full bg-white text-slate-900 border-0 rounded-lg pl-10 pr-4 py-3 text-lg font-bold placeholder-slate-400 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all" placeholder="0.00" /></div><p className="text-xs text-blue-200/70 mt-1">Monto total de créditos del día</p></div>
                                <div><label className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 block">Total Abonos Recibidos</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">C$</span><input type="number" step="0.01" value={formData.totalAbonosRecibidos} onChange={(e) => handleInputChange('totalAbonosRecibidos', e.target.value)} className="w-full bg-white text-slate-900 border-0 rounded-lg pl-10 pr-4 py-3 text-lg font-bold placeholder-slate-400 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all" placeholder="0.00" /></div><p className="text-xs text-blue-200/70 mt-1">Monto total de abonos del día</p></div>
                            </div>
                        </Card>

                        <Card title="Desglose por Métodos de Pago" icon="cash" collapsible defaultOpen={true}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><Icon path={Icons.cash} className="w-4 h-4 text-emerald-600" /></div><h4 className="font-bold text-slate-900">Efectivo</h4></div>
                                        <Button variant={formData.arqueo ? 'success' : 'ghost'} size="sm" onClick={() => setShowArqueoModal(true)}><Icon path={Icons.calculator} className="w-4 h-4" />{formData.arqueo ? 'Arqueo Realizado' : 'Realizar Arqueo'}</Button>
                                    </div>
                                    {formData.arqueo && <div className={`p-3 rounded-lg mb-4 ${(formData.arqueo?.diferenciaCS || 0) === 0 && (formData.arqueo?.diferenciaUSD || 0) === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Icon path={(formData.arqueo?.diferenciaCS || 0) === 0 && (formData.arqueo?.diferenciaUSD || 0) === 0 ? Icons.check : Icons.alertCircle} className={`w-4 h-4 ${(formData.arqueo?.diferenciaCS || 0) === 0 && (formData.arqueo?.diferenciaUSD || 0) === 0 ? 'text-emerald-600' : 'text-amber-600'}`} /><span className="text-sm font-semibold text-slate-700">{(formData.arqueo?.diferenciaCS || 0) === 0 && (formData.arqueo?.diferenciaUSD || 0) === 0 ? 'Arqueo Cuadrado' : 'Diferencia Detectada'}</span></div>{((formData.arqueo?.diferenciaCS || 0) !== 0 || (formData.arqueo?.diferenciaUSD || 0) !== 0) && <span className="text-sm font-bold text-amber-700">C$: {fmt(formData.arqueo?.diferenciaCS || 0)} / $: {fmt(formData.arqueo?.diferenciaUSD || 0, '$')}</span>}</div></div>}
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Córdobas (C$)" type="number" step="0.01" value={formData.efectivoCS} onChange={(e) => handleInputChange('efectivoCS', e.target.value)} className="text-emerald-700" />
                                        <Input label="Dólares (USD)" type="number" step="0.01" value={formData.efectivoUSD} onChange={(e) => handleInputChange('efectivoUSD', e.target.value)} className="text-emerald-700" />
                                    </div>
                                    <Input label="Tipo de Cambio" type="number" step="0.01" value={formData.tipoCambio} onChange={(e) => handleInputChange('tipoCambio', e.target.value)} helper={formData.efectivoUSD > 0 ? `Equivalente: ${fmt(Number(formData.efectivoUSD) * Number(formData.tipoCambio || 0))}` : ''} />
                                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100"><div className="flex justify-between items-center"><span className="text-sm font-semibold text-emerald-800">Total Efectivo:</span><span className="text-xl font-bold text-emerald-700">{fmt(totalEfectivo)}</span></div></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Icon path={Icons.creditCard} className="w-4 h-4 text-blue-600" /></div><h4 className="font-bold text-slate-900">Terminales POS</h4></div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Input label="BAC" type="number" step="0.01" value={formData.posBAC} onChange={(e) => handleInputChange('posBAC', e.target.value)} className="text-blue-700" />
                                        <Input label="BANPRO" type="number" step="0.01" value={formData.posBANPRO} onChange={(e) => handleInputChange('posBANPRO', e.target.value)} className="text-blue-700" />
                                        <Input label="LAFISE" type="number" step="0.01" value={formData.posLAFISE} onChange={(e) => handleInputChange('posLAFISE', e.target.value)} className="text-blue-700" />
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100"><div className="flex justify-between items-center"><span className="text-sm font-semibold text-blue-800">Total POS:</span><span className="text-xl font-bold text-blue-700">{fmt(totalPOS)}</span></div></div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-4">Transferencias Bancarias</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <Input label="BAC" type="number" step="0.01" value={formData.transferenciaBAC} onChange={(e) => handleInputChange('transferenciaBAC', e.target.value)} className="text-violet-700" />
                                    <Input label="BANPRO" type="number" step="0.01" value={formData.transferenciaBANPRO} onChange={(e) => handleInputChange('transferenciaBANPRO', e.target.value)} className="text-violet-700" />
                                    <Input label="LAFISE" type="number" step="0.01" value={formData.transferenciaLAFISE} onChange={(e) => handleInputChange('transferenciaLAFISE', e.target.value)} className="text-violet-700" />
                                </div>
                                <div className="mt-4 p-4 bg-violet-50 rounded-lg border border-violet-100"><div className="flex justify-between items-center"><span className="text-sm font-semibold text-violet-800">Total Transferencias:</span><span className="text-xl font-bold text-violet-700">{fmt(totalTransferencias)}</span></div></div>
                            </div>
                            <div className="mt-6 p-6 bg-slate-900 rounded-xl shadow-xl"><div className="flex justify-between items-center"><div className="flex items-center gap-3"><Icon path={Icons.calculator} className="w-6 h-6 text-slate-400" /><span className="text-slate-300 font-bold uppercase tracking-wider text-sm">Total Medios de Pago</span></div><span className="text-3xl font-black text-white tracking-tight">{fmt(totalMediosPago)}</span></div></div>
                        </Card>

                        <Card title="Facturas Membretadas" icon="fileText" collapsible defaultOpen={true}>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4"><div className="flex items-center gap-2 text-blue-800 text-sm font-semibold"><Icon path={Icons.info} className="w-4 h-4" />Registre CADA factura membretada individualmente con su folio, cliente y monto</div></div>
                            <FacturasMembretadasList facturas={formData.facturasMembretadas} onChange={(facturas) => handleInputChange('facturasMembretadas', facturas)} />
                        </Card>

                        <Card title="Retenciones Aplicadas" icon="trendingDown" collapsible right={<Badge variant="danger" size="lg">{fmt(totalRetenciones)}</Badge>} defaultOpen={false}>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4"><div className="flex items-center gap-2 text-amber-800 text-sm font-semibold"><Icon path={Icons.info} className="w-4 h-4" />Las retenciones se registrarán automáticamente como pasivos al cerrar la caja</div></div>
                            <div className="space-y-3">
                                {formData.retenciones.map((ret, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 items-end">
                                        <div className="col-span-2"><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Tipo</label><select value={ret.tipo} onChange={(e) => updateRetencion(index, 'tipo', e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none"><option value="IR">IR (2%)</option><option value="Alcaldia">Alcaldía (1%)</option></select></div>
                                        <div className="col-span-2"><Input label="Monto" type="number" step="0.01" value={ret.monto} onChange={(e) => updateRetencion(index, 'monto', e.target.value)} /></div>
                                        <div className="col-span-3"><Input label="Cliente" value={ret.cliente} onChange={(e) => updateRetencion(index, 'cliente', e.target.value)} placeholder="Nombre del cliente" /></div>
                                        <div className="col-span-3"><Input label="Factura Afectada" value={ret.facturaRelacionada} onChange={(e) => updateRetencion(index, 'facturaRelacionada', e.target.value)} placeholder="Número de factura" /></div>
                                        <div className="col-span-2 flex justify-end"><button onClick={() => removeRetencion(index)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"><Icon path={Icons.trash} className="w-5 h-5" /></button></div>
                                    </div>
                                ))}
                                <Button variant="light" onClick={addRetencion} className="w-full py-3 border-dashed border-2"><Icon path={Icons.plus} className="w-4 h-4" />Agregar Retención</Button>
                            </div>
                        </Card>

                        <Card title="Gastos de Caja" icon="trendingDown" collapsible right={<Badge variant="danger" size="lg">{fmt(totalGastosCaja)}</Badge>} defaultOpen={false}>
                            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200 mb-4"><div className="flex items-center gap-2 text-rose-800 text-sm font-semibold"><Icon path={Icons.info} className="w-4 h-4" />Los gastos se registrarán automáticamente en el plan de cuentas al cerrar</div></div>
                            <div className="space-y-4">
                                {formData.gastosCaja.map((gasto, index) => (
                                    <div key={index} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                        <div className="grid grid-cols-12 gap-4 items-end">
                                            <div className="col-span-4"><label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Cuenta Contable</label><select value={gasto.cuentaContableId} onChange={(e) => updateGastoCaja(index, 'cuentaContableId', e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"><option value="">Seleccionar cuenta...</option>{cuentasGastos.map(cat => <option key={cat.id} value={cat.id}>{cat.code} - {cat.name}</option>)}</select></div>
                                            <div className="col-span-3"><Input label="Monto" type="number" step="0.01" value={gasto.monto} onChange={(e) => updateGastoCaja(index, 'monto', e.target.value)} className="text-rose-700" /></div>
                                            <div className="col-span-3"><Input label="Responsable" value={gasto.responsable} onChange={(e) => updateGastoCaja(index, 'responsable', e.target.value)} /></div>
                                            <div className="col-span-2 flex justify-end"><button onClick={() => removeGastoCaja(index)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Icon path={Icons.trash} className="w-5 h-5" /></button></div>
                                        </div>
                                        <div><Input label="Concepto / Detalle" value={gasto.concepto} onChange={(e) => updateGastoCaja(index, 'concepto', e.target.value)} placeholder="Descripción detallada del gasto..." /></div>
                                    </div>
                                ))}
                                <Button variant="light" onClick={addGastoCaja} className="w-full py-3 border-dashed border-2"><Icon path={Icons.plus} className="w-4 h-4" />Agregar Gasto de Caja</Button>
                            </div>
                        </Card>

                        <Card title="Evidencia Fotográfica" icon="camera" collapsible defaultOpen={false}>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4"><div className="flex items-center gap-2 text-blue-800 text-sm font-semibold"><Icon path={Icons.info} className="w-4 h-4" />Adjunte fotos del conteo físico, cierre de SICAR u otros soportes documentales</div></div>
                            <PhotoUploader fotos={formData.fotos} onPhotosChange={(fotos) => handleInputChange('fotos', fotos)} maxPhotos={5} />
                        </Card>

                        <Card title="Observaciones Generales" icon="info" collapsible defaultOpen={false}>
                            <textarea value={formData.observaciones} onChange={(e) => handleInputChange('observaciones', e.target.value)} placeholder="Anulaciones, errores, diferencias u otras observaciones relevantes..." className="w-full h-32 px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none transition-all" />
                        </Card>

                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 z-50">
                            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
                                <Button variant="ghost" onClick={() => handleSave('borrador')} disabled={loading} className="flex-1 sm:flex-none"><Icon path={Icons.save} className="w-4 h-4" />Guardar Borrador</Button>
                                <Button variant="warning" onClick={() => handleSave('pendiente')} disabled={loading} className="flex-1 sm:flex-none"><Icon path={Icons.lock} className="w-4 h-4" />Marcar Pendiente</Button>
                                <div className="flex-1"></div>
                                <Button variant="success" onClick={() => { if (window.confirm('¿Confirmar y cerrar este cierre? Se generarán automáticamente todos los movimientos contables.')) handleSave('cerrado'); }} disabled={loading || !estaCuadrado} size="lg" className="w-full sm:w-auto px-8"><Icon path={Icons.check} className="w-5 h-5" />{loading ? 'Procesando...' : 'Confirmar y Cerrar Caja'}</Button>
                            </div>
                        </div>
                        <div className="h-20"></div>
                    </div>
                ) : (
                    <Card title="Historial de Cierres de Caja" icon="clipboard">
                        {cierresLoading ? (
                            <div className="text-center py-12"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="mt-4 text-slate-500">Cargando cierres...</p></div>
                        ) : cierres.length === 0 ? (
                            <div className="text-center py-16 text-slate-400"><Icon path={Icons.clipboard} className="w-16 h-16 mx-auto mb-4 text-slate-300" /><p className="text-lg font-medium text-slate-600">No hay cierres registrados</p><p className="text-sm">Cree un nuevo cierre para comenzar</p></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600">Fecha</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600">Caja</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-600">Cajero</th>
                                            <th className="px-4 py-3 text-right font-bold text-slate-600">Ingreso Total</th>
                                            <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                                            <th className="px-4 py-3 text-center font-bold text-slate-600">Cuadre</th>
                                            <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cierres.map((cierre) => (
                                            <tr key={cierre.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3"><div className="font-semibold text-slate-900">{cierre.fecha}</div><div className="text-xs text-slate-500">{formatTimestamp(cierre.createdAt)}</div></td>
                                                <td className="px-4 py-3"><div className="font-semibold text-slate-900">{cierre.caja}</div><div className="text-xs text-slate-500">{cierre.tienda}</div></td>
                                                <td className="px-4 py-3 text-slate-700">{cierre.cajero}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(cierre.totalIngreso || 0)}</td>
                                                <td className="px-4 py-3 text-center">{getEstadoBadge(cierre.estado)}</td>
                                                <td className="px-4 py-3 text-center">{cierre.cuadre?.estaCuadrado ? <span className="text-emerald-600 font-bold">✓ Cuadrado</span> : <span className="text-rose-600 font-bold">✗ No cuadra</span>}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {cierre.estado !== 'cerrado' && <Button variant="ghost" size="sm" onClick={() => handleEdit(cierre)}><Icon path={Icons.edit} className="w-4 h-4" /></Button>}
                                                        {cierre.estado === 'borrador' && <Button variant="warning" size="sm" onClick={() => handleCambiarEstado(cierre, 'pendiente')}><Icon path={Icons.lock} className="w-4 h-4" /></Button>}
                                                        {cierre.estado === 'pendiente' && <Button variant="success" size="sm" onClick={() => handleCambiarEstado(cierre, 'cerrado')}><Icon path={Icons.check} className="w-4 h-4" /></Button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
