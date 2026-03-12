// src/components/CierreCaja.jsx - VERSIÓN CORPORATIVA PREMIUM
// Diseño tipo ERP moderno con alto contraste y legibilidad profesional

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, getDoc, query, where, getDocs } from 'firebase/firestore';
import { useChartOfAccounts } from '../hooks/useAccounting.jsx';
import { createCierreCaja, updateCierreCajaStatus, procesarCierreCaja, uploadMultiplePhotos } from '../services/accountingService';
import { fmt } from '../constants';
import { useAuth } from '../context/AuthContext';

// Iconos SVG optimizados
const Icons = {
    plus: "M12 4v16m8-8H4",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    check: "M5 13l4 4L19 7",
    printer: "M6 9V3h12v6M6 15h12v6H6z M6 9h12",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    cash: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    creditCard: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    receipt: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    alertCircle: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    unlock: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12",
    trendingDown: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    camera: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
    credit: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    calculator: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
    </svg>
);

// Componente Card Corporativo
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

// Botón Corporativo
const Button = ({ children, variant = 'primary', className = '', disabled, size = 'md', ...props }) => {
    const sizes = { 
        sm: 'px-3 py-1.5 text-xs', 
        md: 'px-4 py-2.5 text-sm', 
        lg: 'px-6 py-3 text-base' 
    };
    
    const variants = { 
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30', 
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30', 
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30', 
        warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30', 
        purple: 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20',
        slate: 'bg-slate-800 hover:bg-slate-900 text-white shadow-md shadow-slate-500/20',
        ghost: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm',
        light: 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
    };
    
    return (
        <button 
            disabled={disabled} 
            className={`${sizes[size]} rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${variants[variant]} ${className}`} 
            {...props}
        >
            {children}
        </button>
    );
};

// Badge Corporativo
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

// Input Corporativo de Alto Contraste
const Input = ({ label, icon, type = "text", className = '', helper, ...props }) => {
    const [focus, setFocus] = useState(false);
    
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    {label}
                    {props.required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div className={`relative group transition-all duration-200 ${focus ? 'transform scale-[1.01]' : ''}`}>
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                        <Icon path={Icons[icon]} className={`w-5 h-5 transition-colors duration-200 ${focus ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                )}
                <input 
                    type={type} 
                    className={`
                        w-full bg-white border-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 
                        placeholder-slate-400 outline-none transition-all duration-200
                        ${icon ? 'pl-10' : ''} 
                        ${focus ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'}
                        ${className}
                    `} 
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                    {...props} 
                />
            </div>
            {helper && <p className="text-xs text-slate-500">{helper}</p>}
        </div>
    );
};

// Select Corporativo
const Select = ({ label, icon, options, className = '', ...props }) => {
    const [focus, setFocus] = useState(false);
    
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {label}
                    {props.required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
            )}
            <div className={`relative transition-all duration-200 ${focus ? 'transform scale-[1.01]' : ''}`}>
                {icon && (
                    <Icon path={Icons[icon]} className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focus ? 'text-blue-600' : 'text-slate-400'}`} />
                )}
                <select 
                    className={`
                        w-full bg-white border-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 
                        outline-none transition-all duration-200 appearance-none cursor-pointer
                        ${icon ? 'pl-10' : ''} 
                        ${focus ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'}
                        ${className}
                    `}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                    {...props}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

// Componente para subir fotos mejorado
const PhotoUploader = ({ fotos, onPhotosChange, maxPhotos = 5, label }) => {
    const [previewUrls, setPreviewUrls] = useState([]);
    
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + fotos.length > maxPhotos) {
            alert(`Máximo ${maxPhotos} fotos permitidas`);
            return;
        }
        
        const newPhotos = [...fotos, ...files];
        onPhotosChange(newPhotos);
        
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewUrls([...previewUrls, ...newPreviews]);
    };
    
    const removePhoto = (index) => {
        const newPhotos = fotos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
        
        if (previewUrls[index]) {
            URL.revokeObjectURL(previewUrls[index]);
        }
        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    };
    
    return (
        <div className="space-y-3">
            {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
            <div className="flex flex-wrap gap-3">
                {fotos.map((foto, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 group hover:border-blue-400 transition-colors">
                        <img 
                            src={foto instanceof File ? previewUrls[index] : foto.url} 
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => removePhoto(index)}
                                className="w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"
                            >
                                <Icon path={Icons.trash} className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {fotos.length < maxPhotos && (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
                        <Icon path={Icons.camera} className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs text-slate-500 mt-1 font-medium group-hover:text-blue-600">Agregar</span>
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                    </label>
                )}
            </div>
            <p className="text-xs text-slate-500 font-medium">{fotos.length} de {maxPhotos} fotos</p>
        </div>
    );
};

// Separador de sección
const SectionDivider = ({ title, subtitle }) => (
    <div className="flex items-center gap-4 my-6">
        <div className="h-px bg-slate-200 flex-1"></div>
        <div className="text-center">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h4>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="h-px bg-slate-200 flex-1"></div>
    </div>
);

// ============ MODAL DE ARQUEO DE EFECTIVO ============
const ArqueoModal = ({ isOpen, onClose, onSave, efectivoEsperadoCS, efectivoEsperadoUSD, tipoCambio }) => {
    const [conteoCS, setConteoCS] = useState('');
    const [conteoUSD, setConteoUSD] = useState('');
    const [comentario, setComentario] = useState('');
    
    if (!isOpen) return null;
    
    const diferenciaCS = Number(conteoCS || 0) - efectivoEsperadoCS;
    const diferenciaUSD = Number(conteoUSD || 0) - efectivoEsperadoUSD;
    
    const handleGuardar = () => {
        onSave({
            efectivoContadoCS: conteoCS,
            efectivoContadoUSD: conteoUSD,
            comentarioDiferencia: comentario,
            diferenciaCS,
            diferenciaUSD
        });
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Icon path={Icons.calculator} className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Arqueo de Efectivo</h3>
                            <p className="text-xs text-slate-500">Conteo físico opcional del efectivo en caja</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Icon path={Icons.x} className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Córdobas */}
                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <span className="text-emerald-700 font-bold text-sm">C$</span>
                            </div>
                            <h4 className="font-bold text-slate-900">Córdobas Nicaragüenses</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg border border-emerald-200">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Efectivo Esperado</p>
                                <p className="text-xl font-black text-slate-900">{fmt(efectivoEsperadoCS)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Conteo Físico</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">C$</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={conteoCS} 
                                        onChange={(e) => setConteoCS(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-lg font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {conteoCS !== '' && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 ${
                                diferenciaCS === 0 ? 'bg-emerald-100 text-emerald-800' : 
                                diferenciaCS > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                                <Icon path={diferenciaCS === 0 ? Icons.check : Icons.alertCircle} className="w-5 h-5" />
                                <div>
                                    <span className="text-xs font-bold uppercase">Diferencia:</span>
                                    <span className="ml-2 font-black">{fmt(diferenciaCS)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Dólares */}
                    <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-700 font-bold text-sm">$</span>
                            </div>
                            <h4 className="font-bold text-slate-900">Dólares Estadounidenses</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Efectivo Esperado</p>
                                <p className="text-xl font-black text-slate-900">{fmt(efectivoEsperadoUSD, '$')}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Conteo Físico</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={conteoUSD} 
                                        onChange={(e) => setConteoUSD(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-lg font-bold text-slate-900 focus:border-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {conteoUSD !== '' && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 ${
                                diferenciaUSD === 0 ? 'bg-emerald-100 text-emerald-800' : 
                                diferenciaUSD > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                                <Icon path={diferenciaUSD === 0 ? Icons.check : Icons.alertCircle} className="w-5 h-5" />
                                <div>
                                    <span className="text-xs font-bold uppercase">Diferencia:</span>
                                    <span className="ml-2 font-black">{fmt(diferenciaUSD, '$')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Comentario de diferencias */}
                    {(conteoCS !== '' && diferenciaCS !== 0) || (conteoUSD !== '' && diferenciaUSD !== 0) ? (
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">
                                Justificación de Diferencias <span className="text-rose-500">*</span>
                            </label>
                            <textarea 
                                value={comentario} 
                                onChange={(e) => setComentario(e.target.value)}
                                placeholder="Explique el motivo de la diferencia encontrada..."
                                className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 resize-none transition-all"
                            />
                        </div>
                    ) : null}
                </div>
                
                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={handleGuardar}>
                        <Icon path={Icons.save} className="w-4 h-4" />
                        Guardar Arqueo
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ============ COMPONENTE PRINCIPAL CIERRE DE CAJA ERP ============
export default function CierreCaja() {
    const { user } = useAuth();
    const { getCajaAccounts, accounts } = useChartOfAccounts();
    const [activeTab, setActiveTab] = useState('nuevo');
    const [loading, setLoading] = useState(false);
    const [categoriasGastos, setCategoriasGastos] = useState([]);
    const [savedCierres, setSavedCierres] = useState([]);
    
    // Estado para el modal de arqueo
    const [showArqueoModal, setShowArqueoModal] = useState(false);
    
    // Cargar categorías de gastos
    useEffect(() => {
        const loadCategorias = async () => {
            const q = query(collection(db, 'categorias'), where('tipo', '==', 'gasto'));
            const snap = await getDocs(q);
            setCategoriasGastos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        loadCategorias();
    }, []);

    // Formulario de cierre
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().substring(0, 10),
        tienda: 'CSM Granada',
        caja: 'Caja Granada 1',
        cajero: '',
        horaApertura: '06:00',
        horaCierre: '18:00',
        observaciones: '',
        totalIngreso: '',  // CAMBIO: Total Ventas -> Total Ingreso
        totalTickets: '',
        totalFacturas: '',
        // === Créditos y Abonos ===
        facturasCredito: '',
        totalFacturasCredito: '',
        abonosRecibidos: '',
        totalAbonos: '',
        // ================================
        efectivoCS: '',
        efectivoUSD: '',
        tipoCambio: '36.50',
        posBAC: '',
        posBANPRO: '',
        posLAFISE: '',
        transferenciaBAC: '',
        transferenciaBANPRO: '',
        transferenciaLAFISE: '',
        cantidadFacturasMembretadas: '',
        folioInicial: '',
        folioFinal: '',
        montoFacturasMembretadas: '',
        cantidadTickets: '',
        montoTickets: '',
        tieneFacturaResumen: false,
        retenciones: [],
        gastosCaja: [],
        // Arqueo opcional (guardado desde el modal)
        arqueo: null,  // { efectivoContadoCS, efectivoContadoUSD, comentarioDiferencia, diferenciaCS, diferenciaUSD }
        fotos: []
    });

    // Calcular totales
    const totalEfectivo = Number(formData.efectivoCS || 0) + (Number(formData.efectivoUSD || 0) * Number(formData.tipoCambio || 0));
    const totalPOS = Number(formData.posBAC || 0) + Number(formData.posBANPRO || 0) + Number(formData.posLAFISE || 0);
    const totalTransferencias = Number(formData.transferenciaBAC || 0) + Number(formData.transferenciaBANPRO || 0) + Number(formData.transferenciaLAFISE || 0);
    // CAMBIO: Usar totalIngreso en lugar de totalVentas
    const ventasReales = Number(formData.totalIngreso || 0) + Number(formData.totalFacturasCredito || 0) - Number(formData.totalAbonos || 0);
    const totalMediosPago = totalEfectivo + totalPOS + totalTransferencias;
    const totalRetenciones = formData.retenciones.reduce((sum, r) => sum + (Number(r.monto) || 0), 0);
    const totalGastosCaja = formData.gastosCaja.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
    
    // Efectivo esperado para el arqueo
    const efectivoEsperadoCS = Number(formData.efectivoCS || 0) - totalRetenciones - totalGastosCaja;
    const efectivoEsperadoUSD = Number(formData.efectivoUSD || 0);
    
    // Diferencias del arqueo (si existe)
    const diferenciaCS = formData.arqueo?.diferenciaCS || 0;
    const diferenciaUSD = formData.arqueo?.diferenciaUSD || 0;

    const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    
    // Guardar resultado del arqueo desde el modal
    const handleArqueoSave = (arqueoData) => {
        setFormData(prev => ({ 
            ...prev, 
            arqueo: arqueoData 
        }));
    };

    // Retenciones
    const addRetencion = () => setFormData(prev => ({ 
        ...prev, 
        retenciones: [...prev.retenciones, { tipo: 'IR', monto: '', cliente: '', facturaRelacionada: '', observacion: '', categoriaGastoId: '', categoriaGastoNombre: '' }] 
    }));
    
    const updateRetencion = (index, field, value) => {
        setFormData(prev => ({ 
            ...prev, 
            retenciones: prev.retenciones.map((r, i) => {
                if (i !== index) return r;
                if (field === 'categoriaGastoId') {
                    const cat = categoriasGastos.find(c => c.id === value);
                    return { ...r, categoriaGastoId: value, categoriaGastoNombre: cat?.nombre || '' };
                }
                return { ...r, [field]: value };
            })
        }));
    };
    
    const removeRetencion = (index) => setFormData(prev => ({ 
        ...prev, 
        retenciones: prev.retenciones.filter((_, i) => i !== index) 
    }));

    // Gastos de caja
    const addGastoCaja = () => setFormData(prev => ({ 
        ...prev, 
        gastosCaja: [...prev.gastosCaja, { categoriaId: '', categoriaNombre: '', concepto: '', monto: '', responsable: '', comentario: '', fotos: [] }] 
    }));
    
    const updateGastoCaja = (index, field, value) => {
        setFormData(prev => ({ 
            ...prev, 
            gastosCaja: prev.gastosCaja.map((g, i) => {
                if (i !== index) return g;
                if (field === 'categoriaId') {
                    const cat = categoriasGastos.find(c => c.id === value);
                    return { ...g, categoriaId: value, categoriaNombre: cat?.nombre || '', concepto: cat?.nombre || '' };
                }
                return { ...g, [field]: value };
            })
        }));
    };
    
    const removeGastoCaja = (index) => setFormData(prev => ({ 
        ...prev, 
        gastosCaja: prev.gastosCaja.filter((_, i) => i !== index) 
    }));

    const handleFotosChange = (fotos) => setFormData(prev => ({ ...prev, fotos }));

  const handleSave = async (estado = 'borrador') => {
    setLoading(true);
    try {
        // VALIDACIÓN PARA CIERRE DIRECTO
        if (estado === 'cerrado') {
            // Verificar que haya datos mínimos
            if (!formData.totalIngreso || Number(formData.totalIngreso) <= 0) {
                throw new Error('Debe ingresar el Total Ingreso para cerrar la caja');
            }
            if (!formData.cajero) {
                throw new Error('Debe ingresar el nombre del cajero');
            }
        }

        const cierreData = { 
            ...formData, 
            estado,  // Guardar con el estado deseado directamente
            ventasReales,
            userId: user?.uid, 
            userEmail: user?.email 
        };
        
        // 1. Crear el cierre
        const cierreResult = await createCierreCaja(cierreData);

        // 2. Subir fotos si hay
        let fotosUrls = [];
        if (formData.fotos.length > 0) {
            const fotoFiles = formData.fotos.filter(f => f instanceof File);
            if (fotoFiles.length > 0) {
                fotosUrls = await uploadMultiplePhotos(fotoFiles, 'cierres', cierreResult.id);
                await updateDoc(doc(db, 'cierresCaja', cierreResult.id), {
                    fotos: fotosUrls,
                    updatedAt: Timestamp.now()
                });
            }
        }

        // 3. Si es cierre, actualizar estado a 'cerrado' explícitamente primero
        // (Esto asegura que procesarCierreCaja vea el estado correcto)
        if (estado === 'cerrado') {
            await updateCierreCajaStatus(cierreResult.id, 'cerrado', user?.uid);
            
            // Pequeña pausa para asegurar que Firestore actualizó el estado
            await new Promise(resolve => setTimeout(resolve, 500));

            // Registrar INGRESOS
            if (ventasReales > 0) {
                await addDoc(collection(db, 'ingresos'), {
                    fecha: formData.fecha,
                    monto: ventasReales,
                    descripcion: `Ingresos - Cierre ${formData.caja} ${formData.fecha}`,
                    categoria: 'Ingresos',
                    sucursal: formData.tienda,
                    referencia: `CIERRE-${cierreResult.id}`,
                    cierreCajaId: cierreResult.id,
                    createdAt: Timestamp.now(),
                    createdBy: user?.uid,
                    createdByEmail: user?.email
                });
            }

            // Registrar CRÉDITOS
            if (Number(formData.totalFacturasCredito) > 0) {
                await addDoc(collection(db, 'ingresos'), {
                    fecha: formData.fecha,
                    monto: Number(formData.totalFacturasCredito),
                    descripcion: `Facturas de Crédito - Cierre ${formData.caja} ${formData.fecha}`,
                    categoria: 'Ventas al Crédito',
                    sucursal: formData.tienda,
                    referencia: `CIERRE-${cierreResult.id}`,
                    cierreCajaId: cierreResult.id,
                    tipo: 'credito',
                    cantidadFacturas: Number(formData.facturasCredito) || 0,
                    createdAt: Timestamp.now(),
                    createdBy: user?.uid,
                    createdByEmail: user?.email
                });
            }

            // Registrar ABONOS
            if (Number(formData.totalAbonos) > 0) {
                await addDoc(collection(db, 'ingresos'), {
                    fecha: formData.fecha,
                    monto: Number(formData.totalAbonos),
                    descripcion: `Abonos Recibidos - Cierre ${formData.caja} ${formData.fecha}`,
                    categoria: 'Abonos Clientes',
                    sucursal: formData.tienda,
                    referencia: `CIERRE-${cierreResult.id}`,
                    cierreCajaId: cierreResult.id,
                    tipo: 'abono',
                    cantidadAbonos: Number(formData.abonosRecibidos) || 0,
                    createdAt: Timestamp.now(),
                    createdBy: user?.uid,
                    createdByEmail: user?.email
                });
            }

            // Registrar GASTOS DE CAJA
            for (const gasto of formData.gastosCaja) {
                if (Number(gasto.monto) > 0) {
                    let gastoFotos = [];
                    if (gasto.fotos && gasto.fotos.length > 0) {
                        const fotoFiles = gasto.fotos.filter(f => f instanceof File);
                        if (fotoFiles.length > 0) {
                            gastoFotos = await uploadMultiplePhotos(fotoFiles, 'gastos', `cierre-${cierreResult.id}`);
                        }
                    }

                    await addDoc(collection(db, 'gastos'), {
                        fecha: formData.fecha,
                        monto: Number(gasto.monto),
                        descripcion: `Gasto de caja: ${gasto.concepto} - Cierre ${formData.caja}`,
                        categoria: gasto.categoriaNombre || 'Otros Gastos',
                        categoriaId: gasto.categoriaId || null,
                        sucursal: formData.tienda,
                        responsable: gasto.responsable,
                        referencia: `CIERRE-${cierreResult.id}`,
                        cierreCajaId: cierreResult.id,
                        tipo: 'gasto_caja',
                        fotos: gastoFotos,
                        createdAt: Timestamp.now(),
                        createdBy: user?.uid,
                        createdByEmail: user?.email
                    });
                }
            }

            // Registrar RETENCIONES
            for (const ret of formData.retenciones) {
                if (Number(ret.monto) > 0) {
                    await addDoc(collection(db, 'gastos'), {
                        fecha: formData.fecha,
                        monto: Number(ret.monto),
                        descripcion: `Retención ${ret.tipo}: ${ret.tipo === 'IR' ? '2% IR' : '1% Alcaldía'} - Factura ${ret.facturaRelacionada || 'N/A'}`,
                        categoria: ret.categoriaGastoNombre || `Retención ${ret.tipo}`,
                        categoriaId: ret.categoriaGastoId || null,
                        sucursal: formData.tienda,
                        cliente: ret.cliente,
                        facturaRelacionada: ret.facturaRelacionada,
                        referencia: `CIERRE-${cierreResult.id}`,
                        cierreCajaId: cierreResult.id,
                        tipo: 'retencion',
                        tipoRetencion: ret.tipo,
                        createdAt: Timestamp.now(),
                        createdBy: user?.uid,
                        createdByEmail: user?.email
                    });
                }
            }

            // AHORA procesar el cierre contablemente (con estado ya actualizado)
            try {
                await procesarCierreCaja(cierreResult.id, user?.uid, user?.email);
            } catch (procError) {
                console.error('Error en procesarCierreCaja:', procError);
                alert(`Cierre guardado pero error en movimientos contables: ${procError.message}`);
                // No lanzar error para que no se rompa todo, pero informar
            }
        }

        alert(`Cierre guardado exitosamente como ${estado.toUpperCase()}`);
        
        if (estado === 'cerrado') {
            // Reset form...
            setFormData({ 
                fecha: new Date().toISOString().substring(0, 10), 
                tienda: 'CSM Granada', 
                caja: 'Caja Granada 1', 
                cajero: '', 
                horaApertura: '06:00', 
                horaCierre: '18:00', 
                observaciones: '', 
                totalIngreso: '',  
                totalTickets: '', 
                totalFacturas: '', 
                facturasCredito: '',
                totalFacturasCredito: '',
                abonosRecibidos: '',
                totalAbonos: '',
                efectivoCS: '', 
                efectivoUSD: '', 
                tipoCambio: '36.50', 
                posBAC: '', 
                posBANPRO: '', 
                posLAFISE: '', 
                transferenciaBAC: '', 
                transferenciaBANPRO: '', 
                transferenciaLAFISE: '', 
                cantidadFacturasMembretadas: '', 
                folioInicial: '', 
                folioFinal: '', 
                montoFacturasMembretadas: '', 
                cantidadTickets: '', 
                montoTickets: '', 
                tieneFacturaResumen: false, 
                retenciones: [], 
                gastosCaja: [], 
                arqueo: null,
                fotos: []
            });
        }
    } catch (error) {
        console.error('Error completo:', error);
        alert('Error: ' + error.message);
    } finally {
        setLoading(false);
    }
};

    const TIENDAS = [
        { value: 'CSM Granada', label: 'CSM Granada' },
        { value: 'Carnes Amparito', label: 'Carnes Amparito' },
        { value: 'CSM Masaya', label: 'CSM Masaya' },
        { value: 'CEDI', label: 'CEDI' },
        { value: 'CSM Granada Inmaculada', label: 'CSM Granada Inmaculada' }
    ];

    const CAJAS = [
        { value: 'Caja Granada 1', label: 'Caja Granada 1' },
        { value: 'Caja Granada 2', label: 'Caja Granada 2' },
        { value: 'Caja Ruta', label: 'Caja Ruta' },
        { value: 'Caja Amparito', label: 'Caja Amparito' }
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header Corporativo */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Icon path={Icons.calculator} className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Cierre de Caja</h1>
                                <p className="text-xs text-slate-500 font-medium">Sistema Integral de Control de Activos y Resultados</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('nuevo')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                                    activeTab === 'nuevo' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Nuevo Cierre
                            </button>
                            <button
                                onClick={() => setActiveTab('historial')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                                    activeTab === 'historial' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Historial
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Arqueo */}
            <ArqueoModal 
                isOpen={showArqueoModal}
                onClose={() => setShowArqueoModal(false)}
                onSave={handleArqueoSave}
                efectivoEsperadoCS={efectivoEsperadoCS}
                efectivoEsperadoUSD={efectivoEsperadoUSD}
                tipoCambio={formData.tipoCambio}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'nuevo' ? (
                    <div className="space-y-6">
                        {/* Info General */}
                        <Card title="Información General" icon="clipboard" collapsible defaultOpen={true}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Input 
                                    label="Fecha de Cierre" 
                                    type="date" 
                                    icon="calendar" 
                                    value={formData.fecha} 
                                    onChange={(e) => handleInputChange('fecha', e.target.value)} 
                                />
                                <Select 
                                    label="Sucursal" 
                                    icon="building"
                                    value={formData.tienda} 
                                    onChange={(e) => handleInputChange('tienda', e.target.value)}
                                    options={TIENDAS}
                                />
                                <Select 
                                    label="Caja" 
                                    icon="calculator"
                                    value={formData.caja} 
                                    onChange={(e) => handleInputChange('caja', e.target.value)}
                                    options={CAJAS}
                                />
                                <Input 
                                    label="Cajero Responsable" 
                                    icon="users" 
                                    value={formData.cajero} 
                                    onChange={(e) => handleInputChange('cajero', e.target.value)} 
                                    placeholder="Nombre completo"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                <Input 
                                    label="Hora Apertura" 
                                    type="time" 
                                    value={formData.horaApertura} 
                                    onChange={(e) => handleInputChange('horaApertura', e.target.value)} 
                                />
                                <Input 
                                    label="Hora Cierre" 
                                    type="time" 
                                    value={formData.horaCierre} 
                                    onChange={(e) => handleInputChange('horaCierre', e.target.value)} 
                                />
                                <div className="flex items-end">
                                    <Badge variant="info" size="lg">
                                        Turno: {formData.horaApertura} - {formData.horaCierre}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        {/* Datos SICAR - CAMBIO: Total Ventas -> Total Ingreso */}
                        <Card title="Resumen de Ventas SICAR" icon="receipt" variant="dark" collapsible defaultOpen={true}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 block">Total Ingreso</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">C$</span>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={formData.totalIngreso} 
                                            onChange={(e) => handleInputChange('totalIngreso', e.target.value)}
                                            className="w-full bg-white text-slate-900 border-0 rounded-lg pl-10 pr-4 py-3 text-lg font-bold placeholder-slate-400 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-xs text-blue-200/70 mt-1">Total de ingresos según SICAR</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 block">Total Tickets</label>
                                    <input 
                                        type="number" 
                                        value={formData.totalTickets} 
                                        onChange={(e) => handleInputChange('totalTickets', e.target.value)}
                                        className="w-full bg-white text-slate-900 border-0 rounded-lg px-4 py-3 text-lg font-bold placeholder-slate-400 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 block">Total Facturas</label>
                                    <input 
                                        type="number" 
                                        value={formData.totalFacturas} 
                                        onChange={(e) => handleInputChange('totalFacturas', e.target.value)}
                                        className="w-full bg-white text-slate-900 border-0 rounded-lg px-4 py-3 text-lg font-bold placeholder-slate-400 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            
                            {/* Créditos y Abonos */}
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <h4 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                    <Icon path={Icons.credit} className="w-4 h-4 text-blue-300" />
                                    Créditos y Abonos del Día
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                        <h5 className="text-xs font-bold text-blue-200 uppercase mb-3">Facturas de Crédito</h5>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-blue-200/70 block mb-1">Cantidad</label>
                                                <input 
                                                    type="number" 
                                                    value={formData.facturasCredito} 
                                                    onChange={(e) => handleInputChange('facturasCredito', e.target.value)}
                                                    className="w-full bg-white text-slate-900 border-0 rounded-lg px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-blue-500/30 outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-blue-200/70 block mb-1">Monto Total</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">C$</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        value={formData.totalFacturasCredito} 
                                                        onChange={(e) => handleInputChange('totalFacturasCredito', e.target.value)}
                                                        className="w-full bg-white text-slate-900 border-0 rounded-lg pl-8 pr-3 py-2 text-sm font-bold focus:ring-4 focus:ring-blue-500/30 outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                        <h5 className="text-xs font-bold text-blue-200 uppercase mb-3">Abonos Recibidos</h5>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-blue-200/70 block mb-1">Cantidad</label>
                                                <input 
                                                    type="number" 
                                                    value={formData.abonosRecibidos} 
                                                    onChange={(e) => handleInputChange('abonosRecibidos', e.target.value)}
                                                    className="w-full bg-white text-slate-900 border-0 rounded-lg px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-blue-500/30 outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-blue-200/70 block mb-1">Monto Total</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">C$</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        value={formData.totalAbonos} 
                                                        onChange={(e) => handleInputChange('totalAbonos', e.target.value)}
                                                        className="w-full bg-white text-slate-900 border-0 rounded-lg pl-8 pr-3 py-2 text-sm font-bold focus:ring-4 focus:ring-blue-500/30 outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Cálculo de Ventas Reales */}
                                <div className="mt-4 p-4 bg-emerald-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                                                <Icon path={Icons.calculator} className="w-5 h-5 text-emerald-300" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-emerald-200 uppercase">Ventas Reales del Día</p>
                                                <p className="text-xs text-emerald-200/70">Ingresos + Créditos - Abonos</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-white tracking-tight">{fmt(ventasReales)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Métodos de Pago con Botón de Arqueo */}
                        <Card title="Desglose por Métodos de Pago" icon="cash" collapsible defaultOpen={true}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Efectivo con botón de arqueo */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <Icon path={Icons.cash} className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-900">Efectivo</h4>
                                        </div>
                                        {/* Botón de Arqueo Opcional */}
                                        <Button 
                                            variant={formData.arqueo ? 'success' : 'ghost'} 
                                            size="sm"
                                            onClick={() => setShowArqueoModal(true)}
                                        >
                                            <Icon path={Icons.calculator} className="w-4 h-4" />
                                            {formData.arqueo ? 'Arqueo Realizado' : 'Realizar Arqueo'}
                                        </Button>
                                    </div>
                                    
                                    {/* Mostrar resultado del arqueo si existe */}
                                    {formData.arqueo && (
                                        <div className={`p-3 rounded-lg mb-4 ${
                                            diferenciaCS === 0 && diferenciaUSD === 0 
                                                ? 'bg-emerald-50 border border-emerald-200' 
                                                : 'bg-amber-50 border border-amber-200'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Icon path={diferenciaCS === 0 && diferenciaUSD === 0 ? Icons.check : Icons.alertCircle} 
                                                          className={`w-4 h-4 ${diferenciaCS === 0 && diferenciaUSD === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {diferenciaCS === 0 && diferenciaUSD === 0 
                                                            ? 'Arqueo Cuadrado' 
                                                            : 'Diferencia Detectada'}
                                                    </span>
                                                </div>
                                                {(diferenciaCS !== 0 || diferenciaUSD !== 0) && (
                                                    <span className="text-sm font-bold text-amber-700">
                                                        C$: {fmt(diferenciaCS)} / $: {fmt(diferenciaUSD, '$')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input 
                                            label="Córdobas (C$)" 
                                            type="number" 
                                            step="0.01" 
                                            value={formData.efectivoCS} 
                                            onChange={(e) => handleInputChange('efectivoCS', e.target.value)}
                                            className="text-emerald-700"
                                        />
                                        <Input 
                                            label="Dólares (USD)" 
                                            type="number" 
                                            step="0.01" 
                                            value={formData.efectivoUSD} 
                                            onChange={(e) => handleInputChange('efectivoUSD', e.target.value)}
                                            className="text-emerald-700"
                                        />
                                    </div>
                                    
                                    <Input 
                                        label="Tipo de Cambio" 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.tipoCambio} 
                                        onChange={(e) => handleInputChange('tipoCambio', e.target.value)}
                                        helper={formData.efectivoUSD > 0 ? `Equivalente: ${fmt(Number(formData.efectivoUSD) * Number(formData.tipoCambio || 0))}` : ''}
                                    />
                                    
                                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-emerald-800">Total Efectivo</span>
                                            <span className="text-xl font-bold text-emerald-700">{fmt(totalEfectivo)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* POS */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Icon path={Icons.creditCard} className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <h4 className="font-bold text-slate-900">Terminales POS</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3">
                                        <Input label="BAC" type="number" step="0.01" value={formData.posBAC} onChange={(e) => handleInputChange('posBAC', e.target.value)} className="text-blue-700" />
                                        <Input label="BANPRO" type="number" step="0.01" value={formData.posBANPRO} onChange={(e) => handleInputChange('posBANPRO', e.target.value)} className="text-blue-700" />
                                        <Input label="LAFISE" type="number" step="0.01" value={formData.posLAFISE} onChange={(e) => handleInputChange('posLAFISE', e.target.value)} className="text-blue-700" />
                                    </div>
                                    
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-blue-800">Total POS</span>
                                            <span className="text-xl font-bold text-blue-700">{fmt(totalPOS)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <SectionDivider title="Transferencias Bancarias" />

                            <div className="grid grid-cols-3 gap-4">
                                <Input label="BAC" type="number" step="0.01" value={formData.transferenciaBAC} onChange={(e) => handleInputChange('transferenciaBAC', e.target.value)} className="text-violet-700" />
                                <Input label="BANPRO" type="number" step="0.01" value={formData.transferenciaBANPRO} onChange={(e) => handleInputChange('transferenciaBANPRO', e.target.value)} className="text-violet-700" />
                                <Input label="LAFISE" type="number" step="0.01" value={formData.transferenciaLAFISE} onChange={(e) => handleInputChange('transferenciaLAFISE', e.target.value)} className="text-violet-700" />
                            </div>
                            
                            <div className="mt-6 p-4 bg-violet-50 rounded-lg border border-violet-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-violet-800">Total Transferencias</span>
                                    <span className="text-xl font-bold text-violet-700">{fmt(totalTransferencias)}</span>
                                </div>
                            </div>

                            {/* Total General */}
                            <div className="mt-6 p-6 bg-slate-900 rounded-xl shadow-xl">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Icon path={Icons.calculator} className="w-6 h-6 text-slate-400" />
                                        <span className="text-slate-300 font-bold uppercase tracking-wider text-sm">Total Medios de Pago</span>
                                    </div>
                                    <span className="text-3xl font-black text-white tracking-tight">{fmt(totalMediosPago)}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Facturas y Tickets */}
                        <Card title="Documentos Fiscales" icon="fileText" collapsible defaultOpen={false}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Badge variant="info" size="sm">Fiscal</Badge>
                                        Facturas Membretadas
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Cantidad" type="number" value={formData.cantidadFacturasMembretadas} onChange={(e) => handleInputChange('cantidadFacturasMembretadas', e.target.value)} />
                                        <Input label="Monto Total" type="number" step="0.01" value={formData.montoFacturasMembretadas} onChange={(e) => handleInputChange('montoFacturasMembretadas', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Folio Inicial" value={formData.folioInicial} onChange={(e) => handleInputChange('folioInicial', e.target.value)} placeholder="001-001-000001" />
                                        <Input label="Folio Final" value={formData.folioFinal} onChange={(e) => handleInputChange('folioFinal', e.target.value)} placeholder="001-001-000050" />
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Badge variant="warning" size="sm">Interno</Badge>
                                        Tickets y Resúmenes
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Cantidad Tickets" type="number" value={formData.cantidadTickets} onChange={(e) => handleInputChange('cantidadTickets', e.target.value)} />
                                        <Input label="Monto Tickets" type="number" step="0.01" value={formData.montoTickets} onChange={(e) => handleInputChange('montoTickets', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <input 
                                            type="checkbox" 
                                            id="facturaResumen" 
                                            checked={formData.tieneFacturaResumen} 
                                            onChange={(e) => handleInputChange('tieneFacturaResumen', e.target.checked)} 
                                            className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor="facturaResumen" className="text-sm font-semibold text-slate-700">
                                            ¿Existe factura resumen de tickets?
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Retenciones */}
                        <Card 
                            title="Retenciones Aplicadas" 
                            icon="trendingDown" 
                            collapsible 
                            right={<Badge variant="danger" size="lg">{fmt(totalRetenciones)}</Badge>}
                            defaultOpen={false}
                        >
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                                <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
                                    <Icon path={Icons.info} className="w-4 h-4" />
                                    Las retenciones se registrarán automáticamente como gastos al cerrar la caja
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {formData.retenciones.map((ret, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 items-end">
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Tipo</label>
                                            <select 
                                                value={ret.tipo} 
                                                onChange={(e) => updateRetencion(index, 'tipo', e.target.value)} 
                                                className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none"
                                            >
                                                <option value="IR">IR (2%)</option>
                                                <option value="Alcaldia">Alcaldía (1%)</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <Input 
                                                label="Monto" 
                                                type="number" 
                                                step="0.01" 
                                                value={ret.monto} 
                                                onChange={(e) => updateRetencion(index, 'monto', e.target.value)} 
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Categoría</label>
                                            <select 
                                                value={ret.categoriaGastoId} 
                                                onChange={(e) => updateRetencion(index, 'categoriaGastoId', e.target.value)} 
                                                className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {categoriasGastos.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <Input 
                                                label="Factura Afectada" 
                                                value={ret.facturaRelacionada} 
                                                onChange={(e) => updateRetencion(index, 'facturaRelacionada', e.target.value)} 
                                                placeholder="Número de factura"
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button 
                                                onClick={() => removeRetencion(index)} 
                                                className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                            >
                                                <Icon path={Icons.trash} className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="light" onClick={addRetencion} className="w-full py-3 border-dashed border-2">
                                    <Icon path={Icons.plus} className="w-4 h-4" />
                                    Agregar Retención
                                </Button>
                            </div>
                        </Card>

                        {/* Gastos de Caja */}
                        <Card 
                            title="Gastos de Caja" 
                            icon="trendingDown" 
                            collapsible 
                            right={<Badge variant="danger" size="lg">{fmt(totalGastosCaja)}</Badge>}
                            defaultOpen={false}
                        >
                            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200 mb-4">
                                <div className="flex items-center gap-2 text-rose-800 text-sm font-semibold">
                                    <Icon path={Icons.info} className="w-4 h-4" />
                                    Los gastos se registrarán automáticamente en el módulo de Gastos al cerrar
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {formData.gastosCaja.map((gasto, index) => (
                                    <div key={index} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                        <div className="grid grid-cols-12 gap-4 items-end">
                                            <div className="col-span-4">
                                                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Categoría</label>
                                                <select 
                                                    value={gasto.categoriaId} 
                                                    onChange={(e) => updateGastoCaja(index, 'categoriaId', e.target.value)} 
                                                    className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none"
                                                >
                                                    <option value="">Seleccionar categoría...</option>
                                                    {categoriasGastos.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <Input 
                                                    label="Monto" 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={gasto.monto} 
                                                    onChange={(e) => updateGastoCaja(index, 'monto', e.target.value)} 
                                                    className="text-rose-700"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input 
                                                    label="Responsable" 
                                                    value={gasto.responsable} 
                                                    onChange={(e) => updateGastoCaja(index, 'responsable', e.target.value)} 
                                                />
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <button 
                                                    onClick={() => removeGastoCaja(index)} 
                                                    className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Icon path={Icons.trash} className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input 
                                                label="Concepto / Detalle" 
                                                value={gasto.comentario} 
                                                onChange={(e) => updateGastoCaja(index, 'comentario', e.target.value)} 
                                                placeholder="Descripción detallada del gasto..."
                                            />
                                            <PhotoUploader 
                                                fotos={gasto.fotos || []} 
                                                onPhotosChange={(fotos) => updateGastoCaja(index, 'fotos', fotos)}
                                                maxPhotos={3}
                                                label="Evidencia fotográfica"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button variant="light" onClick={addGastoCaja} className="w-full py-3 border-dashed border-2">
                                    <Icon path={Icons.plus} className="w-4 h-4" />
                                    Agregar Gasto de Caja
                                </Button>
                            </div>
                        </Card>

                        {/* Fotos del Cierre */}
                        <Card title="Evidencia Fotográfica" icon="camera" collapsible defaultOpen={false}>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                                <div className="flex items-center gap-2 text-blue-800 text-sm font-semibold">
                                    <Icon path={Icons.info} className="w-4 h-4" />
                                    Adjunte fotos del conteo físico, cierre de SICAR u otros soportes documentales
                                </div>
                            </div>
                            <PhotoUploader 
                                fotos={formData.fotos} 
                                onPhotosChange={handleFotosChange}
                                maxPhotos={5}
                            />
                        </Card>

                        {/* Observaciones */}
                        <Card title="Observaciones Generales" icon="info" collapsible defaultOpen={false}>
                            <textarea 
                                value={formData.observaciones} 
                                onChange={(e) => handleInputChange('observaciones', e.target.value)} 
                                placeholder="Anulaciones, errores, diferencias u otras observaciones relevantes..."
                                className="w-full h-32 px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none transition-all"
                            />
                        </Card>

                        {/* Barra de Acciones Fija */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 z-50">
                            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
                                <Button variant="ghost" onClick={() => handleSave('borrador')} disabled={loading} className="flex-1 sm:flex-none">
                                    <Icon path={Icons.save} className="w-4 h-4" />
                                    Guardar Borrador
                                </Button>
                                <Button variant="warning" onClick={() => handleSave('pendiente')} disabled={loading} className="flex-1 sm:flex-none">
                                    <Icon path={Icons.lock} className="w-4 h-4" />
                                    Marcar Pendiente
                                </Button>
                                <div className="flex-1"></div>
                                <Button 
                                    variant="success" 
                                    onClick={() => { 
                                        if (window.confirm('¿Confirmar y cerrar este cierre? Se generarán automáticamente: Ingresos, Créditos, Abonos, Gastos de caja, Retenciones como gastos, y Movimientos contables.')) 
                                            handleSave('cerrado'); 
                                    }} 
                                    disabled={loading} 
                                    size="lg"
                                    className="w-full sm:w-auto px-8"
                                >
                                    <Icon path={Icons.check} className="w-5 h-5" />
                                    {loading ? 'Procesando...' : 'Confirmar y Cerrar Caja'}
                                </Button>
                            </div>
                        </div>
                        
                        {/* Spacer para la barra fija */}
                        <div className="h-20"></div>
                    </div>
                ) : (
                    <Card title="Historial de Cierres" icon="calendar" variant="default">
                        <div className="text-center py-16 text-slate-400">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon path={Icons.calendar} className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600 mb-1">Próximamente</p>
                            <p className="text-sm text-slate-400">El historial completo estará disponible en la próxima actualización</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
