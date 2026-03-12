// src/components/ConfiguracionERP.jsx
// Configuración Maestra del ERP - Plan de Cuentas, Roles, Tasas, General

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
    collection, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    Timestamp,
    query,
    orderBy,
    where,
    getDocs
} from 'firebase/firestore';

// ==========================================
// SISTEMA DE ICONOS
// ==========================================
const Icons = {
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    plus: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    eyeOff: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.87m3.875-3.875A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.574 2.87M9 9l3 3m-3 3l6-6",
    book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    categories: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    chart: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    unlock: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    check: "M5 13l4 4L19 7",
    alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    chevronRight: "M9 5l7 7-7 7",
    chevronDown: "M19 9l-7 7-7-7",
    folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    trendingUp: "M13 7h8m0 0v8m0-8l-8-8-4 4-6-6",
    scale: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// ==========================================
// TIPOS DE CUENTAS CONTABLES
// ==========================================
const ACCOUNT_TYPES = [
    { id: 'asset', name: 'Activos', code: '1', color: 'blue', icon: 'trendingUp', nature: 'debit' },
    { id: 'liability', name: 'Pasivos', code: '2', color: 'rose', icon: 'scale', nature: 'credit' },
    { id: 'equity', name: 'Patrimonio', code: '3', color: 'purple', icon: 'users', nature: 'credit' },
    { id: 'income', name: 'Ingresos', code: '4', color: 'emerald', icon: 'dollar', nature: 'credit' },
    { id: 'expense', name: 'Gastos', code: '5', color: 'orange', icon: 'book', nature: 'debit' }
];

const ACCOUNT_LEVELS = [
    { id: 'group', name: 'Grupo (Clase)', level: 1, digits: 'X' },
    { id: 'subgroup', name: 'Subgrupo', level: 2, digits: 'X.X' },
    { id: 'account', name: 'Cuenta Mayor', level: 3, digits: 'X.X.X' },
    { id: 'subaccount', name: 'Subcuenta', level: 4, digits: 'X.X.X.XX' },
    { id: 'auxiliary', name: 'Auxiliar', level: 5, digits: 'X.X.X.XX.XX' }
];

// ==========================================
// COMPONENTES UI
// ==========================================
const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', ...props }) => {
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3' };
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200',
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
        ghost: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
        purple: 'bg-purple-600 hover:bg-purple-700 text-white'
    };
    
    return (
        <button className={`${sizes[size]} rounded-xl font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 ${variants[variant]} ${className}`} {...props}>
            {icon && <Icon path={Icons[icon]} className="w-4 h-4" />}
            {children}
        </button>
    );
};

const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-600 border-slate-200',
        success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        danger: 'bg-rose-100 text-rose-700 border-rose-200',
        warning: 'bg-amber-100 text-amber-700 border-amber-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${variants[variant]}`}>{children}</span>;
};

const Tabs = ({ activeTab, onChange, tabs }) => (
    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl mb-6">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                    activeTab === tab.id 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
            >
                <Icon path={Icons[tab.icon]} className="w-4 h-4" />
                {tab.label}
            </button>
        ))}
    </div>
);

// ==========================================
// SECCIÓN: PLAN DE CUENTAS CONTABLE
// ==========================================
const ChartOfAccountsManager = ({ accounts, loading, onSave, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'asset',
        level: 'account',
        parentId: '',
        nature: 'debit',
        description: '',
        isActive: true
    });

    // Organizar cuentas en jerarquía
    const organizeHierarchy = (accounts) => {
        const map = {};
        const roots = [];
        
        // Primero crear mapa
        accounts.forEach(acc => {
            map[acc.id] = { ...acc, children: [] };
        });
        
        // Luego construir árbol
        accounts.forEach(acc => {
            if (acc.parentId && map[acc.parentId]) {
                map[acc.parentId].children.push(map[acc.id]);
            } else {
                roots.push(map[acc.id]);
            }
        });
        
        // Ordenar por código
        const sortByCode = (items) => {
            items.sort((a, b) => a.code.localeCompare(b.code));
            items.forEach(item => {
                if (item.children.length > 0) sortByCode(item.children);
            });
            return items;
        };
        
        return sortByCode(roots);
    };

    const toggleGroup = (id) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openCreate = (parentAccount = null) => {
        setEditingAccount(null);
        setFormData({
            code: parentAccount ? `${parentAccount.code}.` : '',
            name: '',
            type: parentAccount ? parentAccount.type : 'asset',
            level: parentAccount ? 'subaccount' : 'group',
            parentId: parentAccount ? parentAccount.id : '',
            nature: parentAccount ? parentAccount.nature : 'debit',
            description: '',
            isActive: true
        });
        setShowModal(true);
    };

    const openEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            code: account.code,
            name: account.name,
            type: account.type,
            level: account.level || 'account',
            parentId: account.parentId || '',
            nature: account.nature || 'debit',
            description: account.description || '',
            isActive: account.isActive !== false
        });
        setShowModal(true);
    };

    const handleSave = () => {
        onSave(formData, editingAccount?.id);
        setShowModal(false);
    };

    const getTypeInfo = (typeId) => ACCOUNT_TYPES.find(t => t.id === typeId) || ACCOUNT_TYPES[0];
    const getLevelInfo = (levelId) => ACCOUNT_LEVELS.find(l => l.id === levelId) || ACCOUNT_LEVELS[2];

    // Renderizar árbol recursivamente
    const renderTree = (items, depth = 0) => {
        return items.map(account => {
            const typeInfo = getTypeInfo(account.type);
            const levelInfo = getLevelInfo(account.level);
            const hasChildren = account.children && account.children.length > 0;
            const isExpanded = expandedGroups[account.id];
            const paddingLeft = depth * 24;
            
            // Filtrar por búsqueda
            if (searchTerm && !account.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !account.code.includes(searchTerm)) {
                return null;
            }
            
            // Filtrar por tipo
            if (filterType !== 'all' && account.type !== filterType) {
                return hasChildren ? renderTree(account.children, depth + 1) : null;
            }

            return (
                <div key={account.id}>
                    <div 
                        className={`flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 transition-colors group ${
                            account.level === 'group' ? 'bg-slate-50/80 font-bold' : ''
                        } ${account.level === 'auxiliary' ? 'text-slate-600' : ''}`}
                        style={{ paddingLeft: `${paddingLeft + 16}px` }}
                    >
                        {/* Indicador de expansión */}
                        <div className="w-6 flex justify-center">
                            {hasChildren ? (
                                <button 
                                    onClick={() => toggleGroup(account.id)}
                                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                                >
                                    <Icon 
                                        path={isExpanded ? Icons.chevronDown : Icons.chevronRight} 
                                        className="w-4 h-4 text-slate-500" 
                                    />
                                </button>
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                        </div>

                        {/* Código con color según tipo */}
                        <div className={`w-24 font-mono text-sm font-bold text-${typeInfo.color}-600 bg-${typeInfo.color}-50 px-2 py-1 rounded`}>
                            {account.code}
                        </div>

                        {/* Nombre y nivel */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-medium ${account.level === 'group' ? 'text-slate-900 text-base' : 'text-slate-700'}`}>
                                    {account.name}
                                </span>
                                {account.level === 'auxiliary' && (
                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Aux</span>
                                )}
                            </div>
                            {account.description && (
                                <p className="text-xs text-slate-400 mt-0.5 truncate">{account.description}</p>
                            )}
                        </div>

                        {/* Naturaleza */}
                        <div className="w-24 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                account.nature === 'debit' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {account.nature === 'debit' ? 'Deudora' : 'Acreedora'}
                            </span>
                        </div>

                        {/* Tipo */}
                        <div className="w-32 hidden md:block">
                            <span className={`text-xs flex items-center gap-1 text-${typeInfo.color}-600`}>
                                <Icon path={Icons[typeInfo.icon]} className="w-3 h-3" />
                                {typeInfo.name}
                            </span>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => openCreate(account)} 
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Agregar subcuenta"
                            >
                                <Icon path={Icons.plus} className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => openEdit(account)} 
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                <Icon path={Icons.edit} className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => onDelete(account.id)} 
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                disabled={hasChildren}
                            >
                                <Icon path={Icons.trash} className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Renderizar hijos si está expandido */}
                    {hasChildren && isExpanded && renderTree(account.children, depth + 1)}
                </div>
            );
        });
    };

    const hierarchicalAccounts = organizeHierarchy(accounts);

    if (loading) return <div className="text-center py-12 text-slate-500">Cargando plan de cuentas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-800">Plan de Cuentas</h3>
                    <p className="text-sm text-slate-500 mt-1">Estructura contable del sistema</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="primary" icon="plus" onClick={() => openCreate()}>
                        Nueva Cuenta
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Icon path={Icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por código o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                    />
                </div>
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                >
                    <option value="all">Todas las cuentas</option>
                    {ACCOUNT_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ACCOUNT_TYPES.map(type => {
                    const count = accounts.filter(a => a.type === type.id).length;
                    return (
                        <div key={type.id} className={`bg-${type.color}-50 border border-${type.color}-200 rounded-xl p-3`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Icon path={Icons[type.icon]} className={`w-4 h-4 text-${type.color}-600`} />
                                <span className="text-xs font-bold text-slate-600">{type.name}</span>
                            </div>
                            <p className={`text-2xl font-black text-${type.color}-700`}>{count}</p>
                            <p className="text-[10px] text-slate-500">Cuentas registradas</p>
                        </div>
                    );
                })}
            </div>

            {/* Árbol de cuentas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <div className="w-6"></div>
                    <div className="w-24">Código</div>
                    <div className="flex-1">Nombre de la Cuenta</div>
                    <div className="w-24 text-center">Naturaleza</div>
                    <div className="w-32 hidden md:block">Clase</div>
                    <div className="w-20 text-right">Acciones</div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                    {hierarchicalAccounts.length > 0 ? (
                        renderTree(hierarchicalAccounts)
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <Icon path={Icons.book} className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="font-medium">No hay cuentas registradas</p>
                            <p className="text-sm mt-1">Comienza creando el primer grupo contable</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear/Editar Cuenta */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">
                                    {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta Contable'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {editingAccount ? 'Modificar cuenta existente' : 'Agregar al plan de cuentas'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <Icon path={Icons.x} className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Código *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        placeholder="Ej: 1.1.01"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:border-blue-500 outline-none"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Formato: X.X.X.XX</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="Ej: Caja General"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Tipo de Cuenta *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => {
                                            const type = e.target.value;
                                            const typeInfo = ACCOUNT_TYPES.find(t => t.id === type);
                                            setFormData({...formData, type, nature: typeInfo.nature});
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none"
                                    >
                                        {ACCOUNT_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.code} - {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Nivel *</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none"
                                    >
                                        {ACCOUNT_LEVELS.map(level => (
                                            <option key={level.id} value={level.id}>
                                                {level.level}. {level.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Naturaleza *</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, nature: 'debit'})}
                                            className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                                formData.nature === 'debit'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 text-slate-600 hover:border-blue-300'
                                            }`}
                                        >
                                            Deudora (Cargo +)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, nature: 'credit'})}
                                            className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                                formData.nature === 'credit'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                                            }`}
                                        >
                                            Acreedora (Abono +)
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Cuenta Padre</label>
                                    <select
                                        value={formData.parentId}
                                        onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Sin padre (Cuenta raíz)</option>
                                        {accounts.filter(a => a.level !== 'auxiliary').map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:border-blue-500 outline-none resize-none"
                                    placeholder="Descripción o notas sobre el uso de esta cuenta..."
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="isActive" className="font-bold text-slate-700 cursor-pointer">
                                    Cuenta activa y disponible para operaciones
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button variant="success" icon="save" onClick={handleSave}>
                                {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// SECCIÓN: GESTIÓN DE ROLES (igual que antes)
// ==========================================
const RolesManager = ({ roles, loading, onSave, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: 'blue',
        permissions: {}
    });

    const SYSTEM_MODULES = [
        { id: 'dashboard', name: 'Dashboard', icon: 'chart', description: 'Panel principal' },
        { id: 'dataEntry', name: 'Ingresos/Gastos', icon: 'edit', description: 'Registro contable' },
        { id: 'gastosDiarios', name: 'Gastos Diarios', icon: 'dollar', description: 'Caja menor' },
        { id: 'accountsPayable', name: 'Cuentas por Pagar', icon: 'book', description: 'Proveedores' },
        { id: 'bankReconciliation', name: 'Conciliación', icon: 'shield', description: 'Bancos' },
        { id: 'reports', name: 'Reportes', icon: 'chart', description: 'Informes' },
        { id: 'chartOfAccounts', name: 'Plan de Cuentas', icon: 'book', description: 'Estructura contable' },
        { id: 'configuracion', name: 'Configuración', icon: 'settings', description: 'Ajustes' }
    ];

    const PERMISSION_LEVELS = {
        none: { label: 'Sin Acceso', color: 'slate', icon: 'eyeOff' },
        read: { label: 'Solo Lectura', color: 'amber', icon: 'eye' },
        write: { label: 'Acceso Total', color: 'emerald', icon: 'shield' }
    };

    const colors = ['blue', 'emerald', 'amber', 'rose', 'purple', 'cyan', 'slate', 'orange'];

    const openCreate = () => {
        setEditingRole(null);
        setFormData({
            name: '',
            color: 'blue',
            permissions: Object.fromEntries(SYSTEM_MODULES.map(m => [m.id, 'none']))
        });
        setShowModal(true);
    };

    const openEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            color: role.color || 'blue',
            permissions: { ...role.permissions }
        });
        setShowModal(true);
    };

    const handleSave = () => {
        onSave(formData, editingRole?.id);
        setShowModal(false);
    };

    const cyclePermission = (moduleId) => {
        const current = formData.permissions[moduleId] || 'none';
        const order = ['none', 'read', 'write'];
        const nextIndex = (order.indexOf(current) + 1) % order.length;
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleId]: order[nextIndex]
            }
        }));
    };

    if (loading) return <div className="text-center py-12 text-slate-500">Cargando roles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black text-slate-800">Roles del Sistema</h3>
                    <p className="text-sm text-slate-500 mt-1">Define permisos granulares por rol</p>
                </div>
                <Button variant="primary" icon="plus" onClick={openCreate}>
                    Nuevo Rol
                </Button>
            </div>

            <div className="grid gap-4">
                {roles.map(role => (
                    <div key={role.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-${role.color || 'blue'}-100 flex items-center justify-center`}>
                                    <Icon path={Icons.shield} className={`w-6 h-6 text-${role.color || 'blue'}-600`} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800">{role.name}</h4>
                                    <p className="text-xs text-slate-500">
                                        {Object.values(role.permissions || {}).filter(p => p !== 'none').length} módulos configurados
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(role)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Icon path={Icons.edit} className="w-5 h-5" />
                                </button>
                                <button onClick={() => onDelete(role.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                                    <Icon path={Icons.trash} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {SYSTEM_MODULES.map(mod => {
                                const perm = role.permissions?.[mod.id] || 'none';
                                const config = PERMISSION_LEVELS[perm];
                                return (
                                    <div key={mod.id} className={`p-2 rounded-lg bg-${config.color}-50 border border-${config.color}-200`}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Icon path={Icons[mod.icon]} className={`w-3 h-3 text-${config.color}-600`} />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{mod.name}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold text-${config.color}-700 flex items-center gap-1`}>
                                            <Icon path={Icons[config.icon]} className="w-3 h-3" />
                                            {config.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">
                                    {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Configura permisos por módulo</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full">
                                <Icon path={Icons.x} className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Nombre del Rol *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                                        placeholder="Ej: Contador Senior"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {colors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                                className={`w-10 h-10 rounded-xl bg-${color}-500 transition-all ${
                                                    formData.color === color ? 'ring-4 ring-offset-2 ring-slate-300 scale-110' : ''
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <h4 className="font-bold text-slate-800 mb-4">Permisos por Módulo</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {SYSTEM_MODULES.map(mod => {
                                        const perm = formData.permissions[mod.id] || 'none';
                                        const config = PERMISSION_LEVELS[perm];
                                        
                                        return (
                                            <button
                                                key={mod.id}
                                                onClick={() => cyclePermission(mod.id)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                                    perm === 'none' ? 'border-slate-200 bg-slate-50 opacity-60' :
                                                    perm === 'read' ? 'border-amber-200 bg-amber-50' :
                                                    'border-emerald-200 bg-emerald-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Icon path={Icons[mod.icon]} className="w-5 h-5 text-slate-600" />
                                                        <span className="font-bold text-slate-800">{mod.name}</span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold bg-${config.color}-100 text-${config.color}-700`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500">{mod.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button variant="success" icon="save" onClick={handleSave}>
                                {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// SECCIÓN: TASA DE CAMBIO (igual)
// ==========================================
const ExchangeRateManager = ({ config, onSave }) => {
    const [rate, setRate] = useState(config?.exchangeRate || 36.5);

    const handleSave = () => {
        onSave({ exchangeRate: parseFloat(rate) }, 'config');
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-black text-slate-800">Tasa de Cambio</h3>
                <p className="text-sm text-slate-500 mt-1">Configuración C$ / USD</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md">
                <div className="mb-6">
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Tipo de Cambio Actual</label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-400">C$</span>
                        <input
                            type="number"
                            step="0.01"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            className="flex-1 text-4xl font-black text-slate-800 border-b-2 border-blue-500 bg-transparent outline-none py-2"
                        />
                        <span className="text-sm text-slate-500">x 1 USD</span>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        Esta tasa se utilizará para todas las conversiones de moneda en el sistema.
                    </p>
                </div>

                <Button variant="success" icon="save" onClick={handleSave} className="w-full">
                    Actualizar Tasa
                </Button>
            </div>
        </div>
    );
};

// ==========================================
// SECCIÓN: CONFIGURACIÓN GENERAL (igual)
// ==========================================
const GeneralConfig = ({ config, onSave }) => {
    const [formData, setFormData] = useState({
        companyName: config?.companyName || 'Distribuidoras SR',
        defaultBranch: config?.defaultBranch || 'Granada',
        fiscalYear: config?.fiscalYear || new Date().getFullYear(),
        ...config
    });

    const handleSave = () => {
        onSave(formData, 'config');
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-black text-slate-800">Configuración General</h3>
                <p className="text-sm text-slate-500 mt-1">Parámetros del sistema</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-4">
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Nombre de la Empresa</label>
                    <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2">Sucursal Principal</label>
                        <select
                            value={formData.defaultBranch}
                            onChange={(e) => setFormData({...formData, defaultBranch: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                            <option value="Granada">Granada</option>
                            <option value="Managua">Managua</option>
                            <option value="Masaya">Masaya</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2">Año Fiscal</label>
                        <input
                            type="number"
                            value={formData.fiscalYear}
                            onChange={(e) => setFormData({...formData, fiscalYear: parseInt(e.target.value)})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <Button variant="success" icon="save" onClick={handleSave} className="w-full">
                        Guardar Configuración
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function ConfiguracionERP() {
    const [activeTab, setActiveTab] = useState('roles');
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [config, setConfig] = useState({});

    useEffect(() => {
        setLoading(true);
        
        const unsubRoles = onSnapshot(collection(db, 'roles'), (snap) => {
            setRoles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubAccounts = onSnapshot(collection(db, 'chartOfAccounts'), (snap) => {
            setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (snap) => {
            if (snap.exists()) setConfig(snap.data());
        });

        setLoading(false);

        return () => {
            unsubRoles();
            unsubAccounts();
            unsubConfig();
        };
    }, []);

    const handleSaveRole = async (data, id) => {
        try {
            if (id) {
                await updateDoc(doc(db, 'roles', id), { ...data, updatedAt: Timestamp.now() });
            } else {
                await addDoc(collection(db, 'roles'), { ...data, createdAt: Timestamp.now() });
            }
        } catch (error) {
            alert('Error al guardar rol: ' + error.message);
        }
    };

    const handleDeleteRole = async (id) => {
        if (!window.confirm('¿Eliminar este rol?')) return;
        try {
            await deleteDoc(doc(db, 'roles', id));
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    };

    const handleSaveAccount = async (data, id) => {
        try {
            if (id) {
                await updateDoc(doc(db, 'chartOfAccounts', id), data);
            } else {
                await addDoc(collection(db, 'chartOfAccounts'), data);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDeleteAccount = async (id) => {
        if (!window.confirm('¿Eliminar esta cuenta?')) return;
        // Verificar si tiene hijos o movimientos (simplificado)
        const hasChildren = accounts.some(a => a.parentId === id);
        if (hasChildren) {
            alert('No se puede eliminar: tiene subcuentas asociadas');
            return;
        }
        await deleteDoc(doc(db, 'chartOfAccounts', id));
    };

    const handleSaveConfig = async (data) => {
        try {
            await updateDoc(doc(db, 'config', 'general'), data);
            alert('Configuración guardada');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const tabs = [
        { id: 'roles', label: 'Roles y Permisos', icon: 'shield' },
        { id: 'chartOfAccounts', label: 'Plan de Cuentas', icon: 'book' },
        { id: 'exchange', label: 'Tasa de Cambio', icon: 'dollar' },
        { id: 'general', label: 'Configuración General', icon: 'settings' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-8">
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
            `}</style>

            <div className="max-w-6xl mx-auto animate-fade-in">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg">
                            <Icon path={Icons.settings} className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                Configuración <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">ERP</span>
                            </h1>
                            <p className="text-slate-500 mt-1">Gestión maestra del sistema financiero</p>
                        </div>
                    </div>
                </div>

                <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

                <div className="animate-fade-in">
                    {activeTab === 'roles' && (
                        <RolesManager 
                            roles={roles} 
                            loading={loading} 
                            onSave={handleSaveRole}
                            onDelete={handleDeleteRole}
                        />
                    )}
                    
                    {activeTab === 'chartOfAccounts' && (
                        <ChartOfAccountsManager 
                            accounts={accounts}
                            loading={loading}
                            onSave={handleSaveAccount}
                            onDelete={handleDeleteAccount}
                        />
                    )}
                    
                    {activeTab === 'exchange' && (
                        <ExchangeRateManager 
                            config={config}
                            onSave={handleSaveConfig}
                        />
                    )}
                    
                    {activeTab === 'general' && (
                        <GeneralConfig 
                            config={config}
                            onSave={handleSaveConfig}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}