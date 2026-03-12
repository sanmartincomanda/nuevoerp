// src/components/ChartOfAccounts.jsx
// Plan de Cuentas NIC Completo con gestión avanzada

import React, { useState, useMemo, useEffect } from 'react';
import { useAccounting } from '../hooks/useAccounting.jsx';
import { fmt } from '../constants';

// Iconos SVG
const Icons = {
    plus: "M12 4v16m8-8H4",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.433-4.433A5.001 5.001 0 0119.9 6.1m-1.433 4.433L12 15l-3 1 1-3 6.467-6.467m1.433-1.433a5.001 5.001 0 01-1.433 1.433",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
    book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    arrowUp: "M5 10l7-7m0 0l7 7m-7-7v18",
    arrowDown: "M19 14l-7 7m0 0l-7-7m7 7V3",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    check: "M5 13l4 4L19 7",
    warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    document: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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

const Button = ({ children, variant = 'primary', className = '', disabled, size = 'md', ...props }) => {
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2', lg: 'px-6 py-3' };
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        danger: 'bg-rose-600 hover:bg-rose-700 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
        purple: 'bg-purple-600 hover:bg-purple-700 text-white',
        sky: 'bg-sky-600 hover:bg-sky-700 text-white',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border border-slate-200',
        dark: 'bg-slate-800 hover:bg-slate-900 text-white',
        slate: 'bg-slate-500 hover:bg-slate-600 text-white'
    };
    
    return (
        <button disabled={disabled} className={`${sizes[size]} rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-100 text-emerald-700',
        danger: 'bg-rose-100 text-rose-700',
        warning: 'bg-amber-100 text-amber-700',
        info: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
        nic: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
        custom: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${variants[variant]}`}>{children}</span>;
};

// Colores por tipo de cuenta
const TYPE_COLORS = {
    ACTIVO: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' },
    PASIVO: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-600' },
    PATRIMONIO: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-600' },
    INGRESO: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600' },
    GASTO: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600' },
    COSTO: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'text-orange-600' }
};

// Naturaleza contable
const NATURE_LABELS = {
    deudora: { label: 'Deudora', color: 'text-blue-600', bg: 'bg-blue-50' },
    acreedora: { label: 'Acreedora', color: 'text-rose-600', bg: 'bg-rose-50' }
};

export default function ChartOfAccounts() {
    const { 
        accounts, 
        loading, 
        error, 
        refreshAccounts, 
        addAccount, 
        editAccount, 
        removeAccount,
        getNICAccounts,
        getCustomAccounts 
    } = useAccounting();

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterOrigin, setFilterOrigin] = useState(''); // 'all', 'nic', 'custom'
    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [saving, setSaving] = useState(false);

    // Formulario
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'ACTIVO',
        subType: '',
        nature: 'deudora',
        description: '',
        isGroup: false,
        parentCode: ''
    });

    // Filtrar cuentas
    const filteredAccounts = useMemo(() => {
        let result = [...accounts];

        // Filtro de búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(a => 
                a.code.toLowerCase().includes(term) ||
                a.name.toLowerCase().includes(term) ||
                (a.description && a.description.toLowerCase().includes(term))
            );
        }

        // Filtro por tipo
        if (filterType) {
            result = result.filter(a => a.type === filterType);
        }

        // Filtro por origen
        if (filterOrigin === 'nic') {
            result = result.filter(a => a.nicStandard === true);
        } else if (filterOrigin === 'custom') {
            result = result.filter(a => a.nicStandard !== true);
        }

        return result.sort((a, b) => a.code.localeCompare(b.code));
    }, [accounts, searchTerm, filterType, filterOrigin]);

    // Estadísticas
    const stats = useMemo(() => {
        const nic = accounts.filter(a => a.nicStandard === true).length;
        const custom = accounts.filter(a => a.nicStandard !== true).length;
        const byType = {};
        accounts.forEach(a => {
            byType[a.type] = (byType[a.type] || 0) + 1;
        });
        return { total: accounts.length, nic, custom, byType };
    }, [accounts]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.code.trim() || !formData.name.trim()) {
            alert('El código y nombre de la cuenta son obligatorios');
            return;
        }

        // Validar formato de código (X.XX.XX.XX)
        const codeRegex = /^\d\.\d{2}\.\d{2}\.\d{2}$/;
        if (!codeRegex.test(formData.code)) {
            alert('El código debe tener el formato: X.XX.XX.XX (ej: 1.01.01.01)');
            return;
        }

        setSaving(true);
        try {
            if (editingAccount) {
                await editAccount(editingAccount.id, formData);
                alert('Cuenta actualizada correctamente');
            } else {
                await addAccount(formData);
                alert('Cuenta creada correctamente');
            }
            resetForm();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            code: account.code || '',
            name: account.name || '',
            type: account.type || 'ACTIVO',
            subType: account.subType || '',
            nature: account.nature || 'deudora',
            description: account.description || '',
            isGroup: account.isGroup || false,
            parentCode: account.parentCode || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (account) => {
        const isNIC = account.nicStandard === true;
        
        if (isNIC) {
            const message = `La cuenta "${account.name}" es una cuenta NIC estándar.\n\n` +
                          `Las cuentas NIC no se pueden eliminar, solo desactivar.\n\n` +
                          `¿Desea desactivar esta cuenta?`;
            
            if (!window.confirm(message)) return;
        } else {
            const message = `¿Está seguro de eliminar la cuenta "${account.name}"?\n\n` +
                          `Esta acción desactivará la cuenta. Los movimientos existentes no se eliminarán.`;
            
            if (!window.confirm(message)) return;
        }

        try {
            await removeAccount(account.id);
            alert(isNIC ? 'Cuenta NIC desactivada' : 'Cuenta eliminada');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            type: 'ACTIVO',
            subType: '',
            nature: 'deudora',
            description: '',
            isGroup: false,
            parentCode: ''
        });
        setEditingAccount(null);
        setShowForm(false);
    };

    const toggleGroup = (code) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(code)) {
                newSet.delete(code);
            } else {
                newSet.add(code);
            }
            return newSet;
        });
    };

    const handleNew = () => {
        resetForm();
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generar código automáticamente
    const generateCode = () => {
        const typeMap = {
            'ACTIVO': '1',
            'PASIVO': '2',
            'PATRIMONIO': '3',
            'INGRESO': '4',
            'GASTO': '5',
            'COSTO': '5'
        };
        
        const prefix = typeMap[formData.type] || '1';
        const existingCodes = accounts
            .filter(a => a.code.startsWith(prefix))
            .map(a => a.code);
        
        // Encontrar el siguiente número disponible
        let maxNum = 0;
        existingCodes.forEach(code => {
            const parts = code.split('.');
            if (parts.length >= 2) {
                const num = parseInt(parts[1]) || 0;
                if (num > maxNum) maxNum = num;
            }
        });
        
        const nextNum = String(maxNum + 1).padStart(2, '0');
        setFormData(prev => ({ ...prev, code: `${prefix}.${nextNum}.01.01` }));
    };

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
                                Plan de <span className="text-blue-600">Cuentas NIC</span>
                            </h1>
                            <p className="text-slate-500">Catálogo contable basado en Normas Internacionales de Contabilidad</p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="ghost" 
                                onClick={refreshAccounts}
                                className="flex items-center gap-2"
                            >
                                <Icon path={Icons.refresh} className="w-4 h-4" />
                                Actualizar
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleNew}
                                className="flex items-center gap-2"
                            >
                                <Icon path={Icons.plus} className="w-5 h-5" />
                                Nueva Cuenta
                            </Button>
                        </div>
                    </div>
                </FadeIn>

                {/* Estadísticas */}
                <FadeIn delay={50} className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <p className="text-xs font-bold uppercase text-slate-500">Total Cuentas</p>
                            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-200 p-4">
                            <p className="text-xs font-bold uppercase text-indigo-600">NIC Estándar</p>
                            <p className="text-2xl font-black text-indigo-800">{stats.nic}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 p-4">
                            <p className="text-xs font-bold uppercase text-emerald-600">Personalizadas</p>
                            <p className="text-2xl font-black text-emerald-800">{stats.custom}</p>
                        </div>
                        {Object.entries(stats.byType).map(([type, count]) => (
                            <div key={type} className={`${TYPE_COLORS[type]?.bg || 'bg-slate-50'} rounded-xl shadow-sm border ${TYPE_COLORS[type]?.border || 'border-slate-200'} p-4`}>
                                <p className={`text-xs font-bold uppercase ${TYPE_COLORS[type]?.text || 'text-slate-600'}`}>{type}</p>
                                <p className={`text-2xl font-black ${TYPE_COLORS[type]?.text || 'text-slate-800'}`}>{count}</p>
                            </div>
                        ))}
                    </div>
                </FadeIn>

                {/* Formulario */}
                {showForm && (
                    <FadeIn delay={100} className="mb-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className={`px-6 py-4 border-b ${editingAccount?.nicStandard ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-200'}`}>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Icon path={editingAccount ? Icons.edit : Icons.plus} className={`w-5 h-5 ${editingAccount?.nicStandard ? 'text-indigo-600' : 'text-blue-600'}`} />
                                    {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
                                    {editingAccount?.nicStandard && (
                                        <Badge variant="nic">NIC - Solo edición limitada</Badge>
                                    )}
                                </h3>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Código */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            Código *
                                            <span className="text-xs font-normal text-slate-400 ml-1">(Formato: X.XX.XX.XX)</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                placeholder="1.01.01.01"
                                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none font-mono"
                                                required
                                                disabled={editingAccount?.nicStandard}
                                                pattern="^\d\.\d{2}\.\d{2}\.\d{2}$"
                                            />
                                            {!editingAccount && (
                                                <Button type="button" variant="ghost" onClick={generateCode} size="sm">
                                                    Auto
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nombre */}
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            Nombre de la Cuenta *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Ej: Caja General"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Tipo */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            Tipo de Cuenta *
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                            required
                                            disabled={editingAccount?.nicStandard}
                                        >
                                            <option value="ACTIVO">ACTIVO (1)</option>
                                            <option value="PASIVO">PASIVO (2)</option>
                                            <option value="PATRIMONIO">PATRIMONIO (3)</option>
                                            <option value="INGRESO">INGRESO (4)</option>
                                            <option value="GASTO">GASTO (5)</option>
                                            <option value="COSTO">COSTO (5)</option>
                                        </select>
                                    </div>

                                    {/* Subtipo */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            Subtipo
                                        </label>
                                        <select
                                            name="subType"
                                            value={formData.subType}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                            disabled={editingAccount?.nicStandard}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="corriente">Corriente</option>
                                            <option value="no_corriente">No Corriente</option>
                                            <option value="banco">Banco</option>
                                            <option value="cxc">Cuentas por Cobrar</option>
                                            <option value="cxp">Cuentas por Pagar</option>
                                            <option value="inventario">Inventario</option>
                                            <option value="fijo">Fijo</option>
                                            <option value="intangible">Intangible</option>
                                            <option value="laboral">Laboral</option>
                                            <option value="impuesto">Impuesto</option>
                                            <option value="financiero">Financiero</option>
                                            <option value="provision">Provisión</option>
                                            <option value="capital">Capital</option>
                                            <option value="reserva">Reserva</option>
                                            <option value="resultado">Resultado</option>
                                            <option value="operativo">Operativo</option>
                                            <option value="no_operativo">No Operativo</option>
                                            <option value="administrativo">Administrativo</option>
                                            <option value="ventas">Ventas</option>
                                            <option value="costo_ventas">Costo de Ventas</option>
                                            <option value="otros">Otros</option>
                                        </select>
                                    </div>

                                    {/* Naturaleza */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            Naturaleza Contable *
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, nature: 'deudora' }))}
                                                className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                                                    formData.nature === 'deudora'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-slate-200 bg-white text-slate-600'
                                                }`}
                                                disabled={editingAccount?.nicStandard}
                                            >
                                                <Icon path={Icons.arrowUp} className="w-4 h-4 inline mr-1" />
                                                Deudora
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, nature: 'acreedora' }))}
                                                className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                                                    formData.nature === 'acreedora'
                                                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                        : 'border-slate-200 bg-white text-slate-600'
                                                }`}
                                                disabled={editingAccount?.nicStandard}
                                            >
                                                <Icon path={Icons.arrowDown} className="w-4 h-4 inline mr-1" />
                                                Acreedora
                                            </button>
                                        </div>
                                    </div>

                                    {/* Es grupo */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="isGroup"
                                            id="isGroup"
                                            checked={formData.isGroup}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-blue-600 rounded border-slate-300"
                                            disabled={editingAccount?.nicStandard}
                                        />
                                        <label htmlFor="isGroup" className="text-sm font-semibold text-slate-700">
                                            Es cuenta de grupo (sumaria)
                                        </label>
                                    </div>

                                    {/* Descripción */}
                                    <div className="md:col-span-3">
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            Descripción
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Descripción detallada de la cuenta..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                            rows="2"
                                        />
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={resetForm}
                                        className="flex-1"
                                    >
                                        <Icon path={Icons.x} className="w-5 h-5 mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        variant={editingAccount?.nicStandard ? 'warning' : 'primary'}
                                        disabled={saving}
                                        className="flex-1"
                                    >
                                        <Icon path={Icons.save} className="w-5 h-5 mr-2" />
                                        {saving ? 'Guardando...' : (editingAccount ? 'Actualizar Cuenta' : 'Guardar Cuenta')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </FadeIn>
                )}

                {/* Filtros */}
                <FadeIn delay={150} className="mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Búsqueda */}
                            <div className="flex-1 relative">
                                <Icon path={Icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por código o nombre..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Filtro Tipo */}
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                            >
                                <option value="">Todos los tipos</option>
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="PASIVO">PASIVO</option>
                                <option value="PATRIMONIO">PATRIMONIO</option>
                                <option value="INGRESO">INGRESO</option>
                                <option value="GASTO">GASTO</option>
                                <option value="COSTO">COSTO</option>
                            </select>

                            {/* Filtro Origen */}
                            <select
                                value={filterOrigin}
                                onChange={(e) => setFilterOrigin(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                            >
                                <option value="">Todas las cuentas</option>
                                <option value="nic">NIC Estándar</option>
                                <option value="custom">Personalizadas</option>
                            </select>
                        </div>
                    </div>
                </FadeIn>

                {/* Lista de Cuentas */}
                <FadeIn delay={200}>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Icon path={Icons.book} className="w-5 h-5 text-blue-600" />
                                Catálogo de Cuentas
                            </h3>
                            <Badge variant="info">{filteredAccounts.length} cuentas</Badge>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Nombre</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Tipo</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Naturaleza</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Origen</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Saldo</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAccounts.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                                                <Icon path={Icons.book} className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                                <p className="text-sm">No se encontraron cuentas</p>
                                                <p className="text-xs mt-1">Ajuste los filtros o cree una nueva cuenta</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAccounts.map((account) => {
                                            const typeColors = TYPE_COLORS[account.type] || TYPE_COLORS.ACTIVO;
                                            const natureInfo = NATURE_LABELS[account.nature] || NATURE_LABELS.deudora;
                                            
                                            return (
                                                <tr key={account.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-4 py-3">
                                                        <code className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono font-bold">
                                                            {account.code}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-slate-800">{account.name}</div>
                                                        {account.description && (
                                                            <div className="text-xs text-slate-500 mt-1">{account.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${typeColors.bg} ${typeColors.text}`}>
                                                            <Icon path={Icons.folder} className={`w-3 h-3 ${typeColors.icon}`} />
                                                            {account.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${natureInfo.bg} ${natureInfo.color}`}>
                                                            <Icon path={account.nature === 'deudora' ? Icons.arrowUp : Icons.arrowDown} className="w-3 h-3" />
                                                            {natureInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {account.nicStandard ? (
                                                            <Badge variant="nic">
                                                                <Icon path={Icons.shield} className="w-3 h-3 inline mr-1" />
                                                                NIC
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="custom">
                                                                <Icon path={Icons.user} className="w-3 h-3 inline mr-1" />
                                                                Personalizada
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`font-bold ${(account.balance || 0) >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                                            C$ {fmt(account.balance || 0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleEdit(account)}
                                                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Icon path={Icons.edit} className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(account)}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    account.nicStandard 
                                                                        ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' 
                                                                        : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                                                                }`}
                                                                title={account.nicStandard ? 'Desactivar (NIC)' : 'Eliminar'}
                                                            >
                                                                <Icon path={account.nicStandard ? Icons.warning : Icons.trash} className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </FadeIn>

                {/* Leyenda */}
                <FadeIn delay={250} className="mt-6">
                    <div className="bg-slate-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Leyenda</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Badge variant="nic">NIC</Badge>
                                <span className="text-slate-600">Cuenta NIC estándar - Edición limitada</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="custom">Personalizada</Badge>
                                <span className="text-slate-600">Cuenta creada por el usuario</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">Deudora</span>
                                <span className="text-slate-600">Aumenta con débito</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded text-xs font-bold">Acreedora</span>
                                <span className="text-slate-600">Aumenta con crédito</span>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
