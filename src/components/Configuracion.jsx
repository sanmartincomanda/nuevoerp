// src/components/ConfiguracionERP.jsx
// Módulo de configuración del ERP - Categorías, Usuarios, Roles, Permisos, Tasas, Estructura Contable

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Icons = {
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    plus: "M12 4v16m8-8H4",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    check: "M5 13l4 4L19 7",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    layer: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>
);

const Button = ({ children, variant = 'primary', className = '', disabled, size = 'md', ...props }) => {
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2', lg: 'px-6 py-3' };
    const variants = { 
        primary: 'bg-blue-600 hover:bg-blue-700 text-white', 
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white', 
        danger: 'bg-rose-600 hover:bg-rose-700 text-white', 
        warning: 'bg-amber-500 hover:bg-amber-600 text-white', 
        purple: 'bg-purple-600 hover:bg-purple-700 text-white', 
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border border-slate-200', 
        dark: 'bg-slate-800 hover:bg-slate-900 text-white' 
    };
    return <button disabled={disabled} className={`${sizes[size]} rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Badge = ({ children, variant = 'default' }) => {
    const variants = { 
        default: 'bg-slate-100 text-slate-600', 
        success: 'bg-emerald-100 text-emerald-700', 
        danger: 'bg-rose-100 text-rose-700', 
        warning: 'bg-amber-100 text-amber-700', 
        info: 'bg-blue-100 text-blue-700', 
        purple: 'bg-purple-100 text-purple-700',
        dark: 'bg-slate-800 text-white'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${variants[variant]}`}>{children}</span>;
};

// ============ CONFIGURACIÓN ERP ============
export default function ConfiguracionERP() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('categorias');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // ============ CATEGORÍAS ============
    const [categorias, setCategorias] = useState([]);
    const [newCategoria, setNewCategoria] = useState({ nombre: '', tipo: 'gasto', descripcion: '' });
    const [editingCategoria, setEditingCategoria] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'categorias'), (snap) => {
            setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const saveCategoria = async () => {
        if (!newCategoria.nombre.trim()) return;
        setLoading(true);
        try {
            if (editingCategoria) {
                await updateDoc(doc(db, 'categorias', editingCategoria.id), { ...newCategoria, updatedAt: Timestamp.now() });
                setMessage('Categoría actualizada');
            } else {
                await addDoc(collection(db, 'categorias'), { ...newCategoria, createdAt: Timestamp.now() });
                setMessage('Categoría creada');
            }
            setNewCategoria({ nombre: '', tipo: 'gasto', descripcion: '' });
            setEditingCategoria(null);
        } catch (e) { setMessage('Error: ' + e.message); }
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    const deleteCategoria = async (id) => {
        if (!window.confirm('¿Eliminar esta categoría?')) return;
        await deleteDoc(doc(db, 'categorias', id));
    };

    // ============ ESTRUCTURA CONTABLE (TIPOS Y SUBTIPOS) ============
    const [estructuraContable, setEstructuraContable] = useState([]);
    const [selectedTipo, setSelectedTipo] = useState(null);
    const [newSubtipo, setNewSubtipo] = useState({ value: '', label: '', descripcion: '', afecta: '' });
    const [editingSubtipo, setEditingSubtipo] = useState(null);
    
    const TIPOS_CUENTA = {
        ACTIVO: { name: 'Activo', color: 'blue', icon: 'folder', naturaleza: 'Deudora' },
        PASIVO: { name: 'Pasivo', color: 'rose', icon: 'shield', naturaleza: 'Acreedora' },
        CAPITAL: { name: 'Capital', color: 'purple', icon: 'layer', naturaleza: 'Acreedora' },
        INGRESO: { name: 'Ingreso', color: 'emerald', icon: 'dollar', naturaleza: 'Acreedora' },
        COSTO: { name: 'Costo', color: 'amber', icon: 'tag', naturaleza: 'Deudora' },
        GASTO: { name: 'Gasto', color: 'orange', icon: 'grid', naturaleza: 'Deudora' },
        ORDEN: { name: 'Cuentas de Orden', color: 'slate', icon: 'folder', naturaleza: 'Variable' }
    };

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'estructuraContable'), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEstructuraContable(data);
            // Si no hay datos, inicializar con estructura por defecto
            if (data.length === 0) {
                initializeDefaultEstructura();
            }
        });
        return () => unsub();
    }, []);

    const initializeDefaultEstructura = async () => {
        const defaultEstructura = [
            {
                tipo: 'ACTIVO',
                subtipos: [
                    { value: 'caja', label: 'Caja', descripcion: 'Efectivo en caja registradora', afecta: 'balance' },
                    { value: 'banco', label: 'Bancos', descripcion: 'Cuentas bancarias', afecta: 'balance' },
                    { value: 'transito', label: 'En Tránsito', descripcion: 'Fondos en tránsito entre cuentas', afecta: 'balance' },
                    { value: 'inventario', label: 'Inventarios', descripcion: 'Inventario de mercadería', afecta: 'balance' },
                    { value: 'por_cobrar', label: 'Cuentas por Cobrar', descripcion: 'Clientes y documentos por cobrar', afecta: 'balance' },
                    { value: 'credito_fiscal', label: 'Crédito Fiscal IVA', descripcion: 'IVA acreditable', afecta: 'balance' },
                    { value: 'activo_fijo', label: 'Activo Fijo', descripcion: 'Bienes de uso prolongado', afecta: 'balance' }
                ]
            },
            {
                tipo: 'PASIVO',
                subtipos: [
                    { value: 'por_pagar', label: 'Cuentas por Pagar', descripcion: 'Proveedores y obligaciones', afecta: 'balance' },
                    { value: 'deuda_bancaria', label: 'Deuda Bancaria', descripcion: 'Préstamos y líneas de crédito', afecta: 'balance' },
                    { value: 'debito_fiscal', label: 'Débito Fiscal IVA', descripcion: 'IVA por pagar', afecta: 'balance' },
                    { value: 'provisiones', label: 'Provisiones', descripcion: 'Reservas técnicas', afecta: 'balance' }
                ]
            },
            {
                tipo: 'CAPITAL',
                subtipos: [
                    { value: 'capital_social', label: 'Capital Social', descripcion: 'Aportaciones de socios', afecta: 'balance' },
                    { value: 'reservas', label: 'Reservas', descripcion: 'Reservas legales y estatutarias', afecta: 'balance' },
                    { value: 'utilidades', label: 'Utilidades', descripcion: 'Utilidades retenidas o del ejercicio', afecta: 'balance' }
                ]
            },
            {
                tipo: 'INGRESO',
                subtipos: [
                    { value: 'ventas', label: 'Ventas', descripcion: 'Ingresos por ventas principales', afecta: 'resultados' },
                    { value: 'ventas_activos', label: 'Ventas Activos', descripcion: 'Ingresos por venta de activos', afecta: 'resultados' },
                    { value: 'ingresos_financieros', label: 'Ingresos Financieros', descripcion: 'Intereses ganados', afecta: 'resultados' },
                    { value: 'otros_ingresos', label: 'Otros Ingresos', descripcion: 'Ingresos diversos', afecta: 'resultados' }
                ]
            },
            {
                tipo: 'COSTO',
                subtipos: [
                    { value: 'costo_ventas', label: 'Costo de Ventas', descripcion: 'Costo de lo vendido', afecta: 'resultados' },
                    { value: 'costo_produccion', label: 'Costo de Producción', descripcion: 'Materia prima y mano de obra directa', afecta: 'resultados' },
                    { value: 'importacion', label: 'Gastos de Importación', descripcion: 'Costos asociados a importaciones', afecta: 'resultados' }
                ]
            },
            {
                tipo: 'GASTO',
                subtipos: [
                    { value: 'gastos_operativos', label: 'Gastos Operativos', descripcion: 'Gastos fijos de operación', afecta: 'resultados' },
                    { value: 'gastos_admin', label: 'Gastos Administrativos', descripcion: 'Sueldos, servicios, oficina', afecta: 'resultados' },
                    { value: 'gastos_ventas', label: 'Gastos de Ventas', descripcion: 'Publicidad, comisiones, flete', afecta: 'resultados' },
                    { value: 'gastos_financieros', label: 'Gastos Financieros', descripcion: 'Intereses pagados, comisiones bancarias', afecta: 'resultados' },
                    { value: 'impuestos', label: 'Impuestos', descripcion: 'Impuestos sobre la renta y otros', afecta: 'resultados' },
                    { value: 'mermas', label: 'Mermas y Desperdicios', descripcion: 'Pérdidas de inventario', afecta: 'resultados' }
                ]
            }
        ];

        try {
            for (const item of defaultEstructura) {
                await addDoc(collection(db, 'estructuraContable'), {
                    ...item,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
            }
        } catch (e) {
            console.error('Error inicializando estructura:', e);
        }
    };

    const saveSubtipo = async () => {
        if (!selectedTipo || !newSubtipo.value.trim() || !newSubtipo.label.trim()) {
            setMessage('Complete todos los campos requeridos');
            return;
        }
        setLoading(true);
        try {
            const existingIndex = estructuraContable.findIndex(e => e.tipo === selectedTipo);
            
            if (editingSubtipo) {
                // Actualizar subtipo existente
                const docRef = doc(db, 'estructuraContable', editingSubtipo.docId);
                const currentData = estructuraContable.find(e => e.tipo === selectedTipo);
                const updatedSubtipos = currentData.subtipos.map(s => 
                    s.value === editingSubtipo.value ? { ...newSubtipo } : s
                );
                await updateDoc(docRef, { subtipos: updatedSubtipos, updatedAt: Timestamp.now() });
                setMessage('Subtipo actualizado');
            } else {
                // Agregar nuevo subtipo
                if (existingIndex >= 0) {
                    const docRef = doc(db, 'estructuraContable', estructuraContable[existingIndex].id);
                    const currentSubtipos = estructuraContable[existingIndex].subtipos || [];
                    await updateDoc(docRef, { 
                        subtipos: [...currentSubtipos, { ...newSubtipo }], 
                        updatedAt: Timestamp.now() 
                    });
                } else {
                    await addDoc(collection(db, 'estructuraContable'), {
                        tipo: selectedTipo,
                        subtipos: [{ ...newSubtipo }],
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now()
                    });
                }
                setMessage('Subtipo agregado');
            }
            
            setNewSubtipo({ value: '', label: '', descripcion: '', afecta: 'balance' });
            setEditingSubtipo(null);
        } catch (e) { setMessage('Error: ' + e.message); }
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    const deleteSubtipo = async (tipo, subtipoValue, docId) => {
        if (!window.confirm('¿Eliminar este subtipo? Las cuentas contables que lo usen quedarán sin clasificación específica.')) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'estructuraContable', docId);
            const currentData = estructuraContable.find(e => e.tipo === tipo);
            const updatedSubtipos = currentData.subtipos.filter(s => s.value !== subtipoValue);
            await updateDoc(docRef, { subtipos: updatedSubtipos, updatedAt: Timestamp.now() });
            setMessage('Subtipo eliminado');
        } catch (e) { setMessage('Error: ' + e.message); }
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    const editSubtipo = (tipo, subtipo, docId) => {
        setSelectedTipo(tipo);
        setNewSubtipo({ ...subtipo });
        setEditingSubtipo({ ...subtipo, docId });
    };

    // ============ TASAS DE CAMBIO ============
    const [tasas, setTasas] = useState({ usdToNio: 36.50, nioToUsd: 0.0274, fecha: new Date().toISOString().substring(0, 10) });
    const [historialTasas, setHistorialTasas] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'tasasCambio'), where('activa', '==', true));
        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const t = snap.docs[0].data();
                setTasas({ usdToNio: t.usdToNio, nioToUsd: t.nioToUsd, fecha: t.fecha, id: snap.docs[0].id });
            }
        });
        const unsubHist = onSnapshot(collection(db, 'tasasCambio'), (snap) => {
            setHistorialTasas(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
        });
        return () => { unsub(); unsubHist(); };
    }, []);

    const saveTasa = async () => {
        setLoading(true);
        try {
            if (tasas.id) await updateDoc(doc(db, 'tasasCambio', tasas.id), { activa: false });
            await addDoc(collection(db, 'tasasCambio'), { usdToNio: Number(tasas.usdToNio), nioToUsd: Number(tasas.nioToUsd), fecha: tasas.fecha, activa: true, createdAt: Timestamp.now() });
            setMessage('Tasa de cambio actualizada');
        } catch (e) { setMessage('Error: ' + e.message); }
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    // ============ USUARIOS Y ROLES ============
    const [usuarios, setUsuarios] = useState([]);
    const [newUsuario, setNewUsuario] = useState({ email: '', rol: 'cajero', nombre: '' });
    const ROLES = {
        admin: { name: 'Administrador', permisos: ['todo'], color: 'purple' },
        contabilidad: { name: 'Contabilidad', permisos: ['plan-cuentas', 'depositos', 'reportes', 'dashboard'], color: 'blue' },
        cajero: { name: 'Cajero', permisos: ['cierre-caja', 'gastos-diarios'], color: 'emerald' },
        limitado: { name: 'Usuario Limitado', permisos: ['cuentas-pagar'], color: 'slate' }
    };

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'usuarios'), (snap) => {
            setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const saveUsuario = async () => {
        if (!newUsuario.email.trim()) return;
        setLoading(true);
        try {
            await addDoc(collection(db, 'usuarios'), { ...newUsuario, createdAt: Timestamp.now(), createdBy: user?.email });
            setNewUsuario({ email: '', rol: 'cajero', nombre: '' });
            setMessage('Usuario agregado');
        } catch (e) { setMessage('Error: ' + e.message); }
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    const deleteUsuario = async (id) => {
        if (!window.confirm('¿Eliminar este usuario?')) return;
        await deleteDoc(doc(db, 'usuarios', id));
    };

    // ============ CONFIGURACIÓN GENERAL ============
    const [config, setConfig] = useState({ cuotaFijaMensual: 3400, nombreEmpresa: 'FinanzasApp', monedaPrincipal: 'NIO' });

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'configuracion'), (snap) => {
            if (!snap.empty) setConfig(snap.docs[0].data());
        });
        return () => unsub();
    }, []);

    const saveConfig = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'configuracion'));
            if (snap.empty) await addDoc(collection(db, 'configuracion'), { ...config, updatedAt: Timestamp.now() });
            else await updateDoc(doc(db, 'configuracion', snap.docs[0].id), { ...config, updatedAt: Timestamp.now() });
            setMessage('Configuración guardada');
        } catch (e) { setMessage('Error: ' + e.message); }
        setLoading(false);
        setTimeout(() => setMessage(''), 3000);
    };

    const tabs = [
        { id: 'categorias', label: 'Categorías', icon: 'tag' },
        { id: 'plan-cuentas', label: 'Plan Contable NIC', icon: 'book' },
        { id: 'estructura', label: 'Estructura Contable', icon: 'layer' },
        { id: 'tasas', label: 'Tasas de Cambio', icon: 'dollar' },
        { id: 'usuarios', label: 'Usuarios y Roles', icon: 'users' },
        { id: 'general', label: 'Configuración General', icon: 'settings' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.5s ease-out; }`}</style>
            <div className="max-w-7xl mx-auto">
                <div className="animate-fade-in mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 mb-2">Configuración <span className="text-blue-600">ERP</span></h1>
                            <p className="text-slate-500">Gestiona categorías, estructura contable, usuarios, roles y parámetros del sistema</p>
                        </div>
                        {message && <div className={`px-4 py-2 rounded-lg font-semibold ${message.includes('Error') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{message}</div>}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                            <Icon path={Icons[tab.icon]} className="w-4 h-4" />{tab.label}
                        </button>
                    ))}
                </div>

                {/* ============ CATEGORÍAS ============ */}
                {activeTab === 'categorias' && (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{editingCategoria ? 'Editar' : 'Nueva'} Categoría</h3>
                            <div className="space-y-4">
                                <div><label className="text-xs font-bold uppercase text-slate-500">Nombre</label><input type="text" value={newCategoria.nombre} onChange={(e) => setNewCategoria({ ...newCategoria, nombre: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" placeholder="Ej: Suministros de Oficina" /></div>
                                <div><label className="text-xs font-bold uppercase text-slate-500">Tipo</label><select value={newCategoria.tipo} onChange={(e) => setNewCategoria({ ...newCategoria, tipo: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></div>
                                <div><label className="text-xs font-bold uppercase text-slate-500">Descripción</label><textarea value={newCategoria.descripcion} onChange={(e) => setNewCategoria({ ...newCategoria, descripcion: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold h-20 resize-none" placeholder="Descripción opcional..." /></div>
                                <div className="flex gap-2">
                                    {editingCategoria && <Button variant="ghost" onClick={() => { setEditingCategoria(null); setNewCategoria({ nombre: '', tipo: 'gasto', descripcion: '' }); }} className="flex-1">Cancelar</Button>}
                                    <Button variant="success" onClick={saveCategoria} disabled={loading} className="flex-1"><Icon path={Icons.save} className="w-4 h-4 mr-2" />{editingCategoria ? 'Actualizar' : 'Guardar'}</Button>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Lista de Categorías ({categorias.length})</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left font-bold text-slate-600">Nombre</th><th className="px-4 py-3 text-center font-bold text-slate-600">Tipo</th><th className="px-4 py-3 text-left font-bold text-slate-600">Descripción</th><th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {categorias.map(cat => (
                                            <tr key={cat.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-slate-800">{cat.nombre}</td>
                                                <td className="px-4 py-3 text-center"><Badge variant={cat.tipo === 'ingreso' ? 'success' : 'danger'}>{cat.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}</Badge></td>
                                                <td className="px-4 py-3 text-slate-600">{cat.descripcion || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => { setEditingCategoria(cat); setNewCategoria({ nombre: cat.nombre, tipo: cat.tipo, descripcion: cat.descripcion || '' }); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1"><Icon path={Icons.edit} className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteCategoria(cat.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Icon path={Icons.trash} className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ PLAN CONTABLE NIC ============ */}
                {activeTab === 'plan-cuentas' && (
                    <div className="animate-fade-in space-y-6">
                        {/* Info Card */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Plan de Cuentas NIC</h3>
                                    <p className="text-indigo-100 text-sm mb-4">
                                        Catálogo contable basado en Normas Internacionales de Contabilidad (NIC). 
                                        Incluye 80+ cuentas estándar organizadas por clases contables.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <Icon path={Icons.shield} className="w-3 h-3" /> NIC Estándar
                                        </span>
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <Icon path={Icons.check} className="w-3 h-3" /> 80+ Cuentas
                                        </span>
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <Icon path={Icons.layer} className="w-3 h-3" /> Jerarquía Completa
                                        </span>
                                    </div>
                                </div>
                                <a 
                                    href="/plan-cuentas" 
                                    className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2"
                                >
                                    <Icon path={Icons.book} className="w-5 h-5" />
                                    Gestionar Plan Contable
                                </a>
                            </div>
                        </div>

                        {/* Clases Contables */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { code: '1', name: 'ACTIVO', color: 'blue', desc: 'Recursos controlados por la empresa', nature: 'Deudora' },
                                { code: '2', name: 'PASIVO', color: 'rose', desc: 'Obligaciones presentes', nature: 'Acreedora' },
                                { code: '3', name: 'PATRIMONIO', color: 'purple', desc: 'Intereses residuales en activos', nature: 'Acreedora' },
                                { code: '4', name: 'INGRESOS', color: 'emerald', desc: 'Aumentos en beneficios económicos', nature: 'Acreedora' },
                                { code: '5', name: 'GASTOS Y COSTOS', color: 'amber', desc: 'Disminuciones en beneficios', nature: 'Deudora' }
                            ].map(clase => (
                                <div key={clase.code} className={`bg-${clase.color}-50 rounded-xl border border-${clase.color}-200 p-5`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-2xl font-black text-${clase.color}-700`}>{clase.code}</span>
                                        <span className={`px-2 py-1 bg-${clase.color}-100 text-${clase.color}-700 rounded text-xs font-bold`}>
                                            {clase.nature}
                                        </span>
                                    </div>
                                    <h4 className={`font-bold text-${clase.color}-800 mb-1`}>{clase.name}</h4>
                                    <p className={`text-sm text-${clase.color}-600`}>{clase.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Estructura del Código */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Estructura del Código de Cuentas</h3>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                                        <span className="text-2xl font-black text-blue-700">X</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600">Clase</p>
                                    <p className="text-xs text-slate-400">1-5</p>
                                </div>
                                <span className="text-2xl text-slate-300">.</span>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
                                        <span className="text-xl font-bold text-blue-600">XX</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600">Grupo</p>
                                    <p className="text-xs text-slate-400">01-99</p>
                                </div>
                                <span className="text-2xl text-slate-300">.</span>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-50/50 rounded-xl flex items-center justify-center mb-2">
                                        <span className="text-xl font-bold text-blue-500">XX</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600">Subgrupo</p>
                                    <p className="text-xs text-slate-400">01-99</p>
                                </div>
                                <span className="text-2xl text-slate-300">.</span>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-2">
                                        <span className="text-xl font-bold text-slate-600">XX</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600">Cuenta</p>
                                    <p className="text-xs text-slate-400">01-99</p>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-600 text-center">
                                    <strong>Ejemplo:</strong> <code className="bg-white px-2 py-1 rounded font-mono text-blue-600">1.01.01.01</code> = Activo Corriente - Caja - Caja General
                                </p>
                            </div>
                        </div>

                        {/* Características */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-6">
                                <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                                    <Icon path={Icons.shield} className="w-5 h-5" />
                                    Cuentas NIC Estándar
                                </h4>
                                <ul className="space-y-2 text-sm text-indigo-700">
                                    <li className="flex items-start gap-2">
                                        <Icon path={Icons.check} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        No se pueden eliminar (solo desactivar)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Icon path={Icons.check} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        Edición limitada (solo nombre y descripción)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Icon path={Icons.check} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        Identificadas con badge "NIC"
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                                <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                    <Icon path={Icons.user} className="w-5 h-5" />
                                    Cuentas Personalizadas
                                </h4>
                                <ul className="space-y-2 text-sm text-emerald-700">
                                    <li className="flex items-start gap-2">
                                        <Icon path={Icons.check} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        Pueden crearse, editarse y eliminarse
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Icon path={Icons.check} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        Edición completa de todos los campos
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Icon path={Icons.check} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        Identificadas con badge "Personalizada"
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ ESTRUCTURA CONTABLE ============ */}
                {activeTab === 'estructura' && (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">
                                    {editingSubtipo ? 'Editar' : 'Nuevo'} Subtipo
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500">Tipo de Cuenta</label>
                                        <select 
                                            value={selectedTipo || ''} 
                                            onChange={(e) => { setSelectedTipo(e.target.value); setEditingSubtipo(null); setNewSubtipo({ value: '', label: '', descripcion: '', afecta: 'balance' }); }}
                                            className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                                        >
                                            <option value="">Seleccione tipo...</option>
                                            {Object.entries(TIPOS_CUENTA).map(([key, config]) => (
                                                <option key={key} value={key}>{config.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {selectedTipo && (
                                        <>
                                            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                                                <span className="font-bold">Naturaleza:</span> {TIPOS_CUENTA[selectedTipo].naturaleza}<br/>
                                                <span className="font-bold">Afecta:</span> Estado de {TIPOS_CUENTA[selectedTipo].naturaleza === 'Variable' ? 'Situación y Resultados' : TIPOS_CUENTA[selectedTipo].naturaleza === 'Deudora' ? 'Situación Financiera' : 'Resultados'}
                                            </div>
                                            
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500">Código (valor interno)</label>
                                                <input 
                                                    type="text" 
                                                    value={newSubtipo.value} 
                                                    onChange={(e) => setNewSubtipo({ ...newSubtipo, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })} 
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" 
                                                    placeholder="ej: caja_chica" 
                                                    disabled={editingSubtipo}
                                                />
                                                <span className="text-xs text-slate-400 mt-1 block">Se usa para vincular con transacciones</span>
                                            </div>
                                            
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500">Nombre Visible</label>
                                                <input 
                                                    type="text" 
                                                    value={newSubtipo.label} 
                                                    onChange={(e) => setNewSubtipo({ ...newSubtipo, label: e.target.value })} 
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" 
                                                    placeholder="Ej: Caja Chica" 
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500">Afectación Contable</label>
                                                <select 
                                                    value={newSubtipo.afecta || 'balance'} 
                                                    onChange={(e) => setNewSubtipo({ ...newSubtipo, afecta: e.target.value })} 
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                                                >
                                                    <option value="balance">Balance General (Estado de Situación)</option>
                                                    <option value="resultados">Estado de Resultados</option>
                                                    <option value="ambos">Ambos (Flujo de efectivo)</option>
                                                    <option value="ninguno">Cuentas de Orden</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500">Descripción</label>
                                                <textarea 
                                                    value={newSubtipo.descripcion} 
                                                    onChange={(e) => setNewSubtipo({ ...newSubtipo, descripcion: e.target.value })} 
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold h-20 resize-none" 
                                                    placeholder="Para qué se usa este subtipo..." 
                                                />
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {editingSubtipo && (
                                                    <Button 
                                                        variant="ghost" 
                                                        onClick={() => { setEditingSubtipo(null); setNewSubtipo({ value: '', label: '', descripcion: '', afecta: 'balance' }); }} 
                                                        className="flex-1"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="success" 
                                                    onClick={saveSubtipo} 
                                                    disabled={loading || !newSubtipo.value || !newSubtipo.label} 
                                                    className="flex-1"
                                                >
                                                    <Icon path={Icons.save} className="w-4 h-4 mr-2" />
                                                    {editingSubtipo ? 'Actualizar' : 'Guardar'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                                <h4 className="font-bold text-blue-800 mb-2">¿Para qué sirve?</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                    Los subtipos permiten clasificar cuentas contables específicamente. 
                                    Por ejemplo, dentro de <strong>ACTIVO</strong> puedes distinguir entre:
                                </p>
                                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                    <li>Caja (efectivo disponible)</li>
                                    <li>Bancos (cuentas corrientes/ahorro)</li>
                                    <li>Inventarios (mercadería)</li>
                                    <li>Crédito Fiscal (IVA acreditable)</li>
                                </ul>
                                <p className="text-sm text-blue-700 mt-3">
                                    Esto permite generar reportes detallados y vincular automáticamente transacciones con el tipo correcto.
                                </p>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Estructura Contable Configurada</h3>
                            
                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                {Object.entries(TIPOS_CUENTA).map(([tipoKey, tipoConfig]) => {
                                    const estructura = estructuraContable.find(e => e.tipo === tipoKey);
                                    const subtipos = estructura?.subtipos || [];
                                    
                                    return (
                                        <div key={tipoKey} className="border border-slate-200 rounded-xl overflow-hidden">
                                            <div className={`bg-${tipoConfig.color}-50 px-4 py-3 border-b border-${tipoConfig.color}-100 flex items-center justify-between`}>
                                                <div className="flex items-center gap-3">
                                                    <Icon path={Icons[tipoConfig.icon]} className={`w-5 h-5 text-${tipoConfig.color}-600`} />
                                                    <div>
                                                        <h4 className={`font-bold text-${tipoConfig.color}-800`}>{tipoConfig.name}</h4>
                                                        <span className={`text-xs text-${tipoConfig.color}-600`}>Naturaleza {tipoConfig.naturaleza}</span>
                                                    </div>
                                                </div>
                                                <Badge variant={subtipos.length > 0 ? 'success' : 'warning'}>
                                                    {subtipos.length} subtipo{subtipos.length !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            
                                            <div className="divide-y divide-slate-100">
                                                {subtipos.length === 0 ? (
                                                    <div className="px-4 py-4 text-sm text-slate-400 text-center">
                                                        No hay subtipos configurados
                                                    </div>
                                                ) : (
                                                    subtipos.map((subtipo, idx) => (
                                                        <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 group">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-slate-800">{subtipo.label}</span>
                                                                    <span className="text-xs text-slate-400 font-mono">({subtipo.value})</span>
                                                                    {subtipo.afecta && (
                                                                        <Badge variant={subtipo.afecta === 'balance' ? 'info' : subtipo.afecta === 'resultados' ? 'success' : 'default'}>
                                                                            {subtipo.afecta === 'balance' ? 'Balance' : subtipo.afecta === 'resultados' ? 'Resultados' : 'Orden'}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {subtipo.descripcion && (
                                                                    <p className="text-xs text-slate-500 mt-1">{subtipo.descripcion}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={() => editSubtipo(tipoKey, subtipo, estructura.id)}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                >
                                                                    <Icon path={Icons.edit} className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => deleteSubtipo(tipoKey, subtipo.value, estructura.id)}
                                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                >
                                                                    <Icon path={Icons.trash} className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            
                                            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                                                <button 
                                                    onClick={() => { setSelectedTipo(tipoKey); setActiveTab('estructura'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                    className={`text-xs font-semibold text-${tipoConfig.color}-600 hover:text-${tipoConfig.color}-700 flex items-center gap-1`}
                                                >
                                                    <Icon path={Icons.plus} className="w-3 h-3" />
                                                    Agregar subtipo a {tipoConfig.name}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ TASAS DE CAMBIO ============ */}
                {activeTab === 'tasas' && (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Tasa de Cambio Actual</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="text-sm text-blue-600 font-bold uppercase mb-1">1 USD =</div>
                                    <div className="text-3xl font-black text-blue-700">C$ {Number(tasas.usdToNio).toFixed(2)}</div>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="text-sm text-emerald-600 font-bold uppercase mb-1">1 C$ =</div>
                                    <div className="text-3xl font-black text-emerald-700">$ {Number(tasas.nioToUsd).toFixed(4)}</div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div><label className="text-xs font-bold uppercase text-slate-500">Nueva Tasa USD → C$</label><input type="number" step="0.01" value={tasas.usdToNio} onChange={(e) => setTasas({ ...tasas, usdToNio: e.target.value, nioToUsd: (1 / Number(e.target.value || 1)).toFixed(4) })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" /></div>
                                    <div><label className="text-xs font-bold uppercase text-slate-500">Fecha de vigencia</label><input type="date" value={tasas.fecha} onChange={(e) => setTasas({ ...tasas, fecha: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" /></div>
                                    <Button variant="success" onClick={saveTasa} disabled={loading} className="w-full"><Icon path={Icons.refresh} className="w-4 h-4 mr-2" />Actualizar Tasa</Button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Historial de Tasas</h3>
                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 sticky top-0"><tr><th className="px-4 py-3 text-left font-bold text-slate-600">Fecha</th><th className="px-4 py-3 text-right font-bold text-slate-600">USD → C$</th><th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {historialTasas.map(t => (
                                            <tr key={t.id} className={`${t.activa ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                                                <td className="px-4 py-3 text-slate-700">{t.fecha}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800">C$ {Number(t.usdToNio).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">{t.activa ? <Badge variant="success">Activa</Badge> : <Badge variant="default">Histórica</Badge>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ USUARIOS Y ROLES ============ */}
                {activeTab === 'usuarios' && (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Nuevo Usuario</h3>
                            <div className="space-y-4">
                                <div><label className="text-xs font-bold uppercase text-slate-500">Email</label><input type="email" value={newUsuario.email} onChange={(e) => setNewUsuario({ ...newUsuario, email: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" placeholder="usuario@email.com" /></div>
                                <div><label className="text-xs font-bold uppercase text-slate-500">Nombre</label><input type="text" value={newUsuario.nombre} onChange={(e) => setNewUsuario({ ...newUsuario, nombre: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" placeholder="Nombre completo" /></div>
                                <div><label className="text-xs font-bold uppercase text-slate-500">Rol</label><select value={newUsuario.rol} onChange={(e) => setNewUsuario({ ...newUsuario, rol: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold">{Object.entries(ROLES).map(([key, r]) => <option key={key} value={key}>{r.name}</option>)}</select></div>
                                <Button variant="success" onClick={saveUsuario} disabled={loading} className="w-full"><Icon path={Icons.plus} className="w-4 h-4 mr-2" />Agregar Usuario</Button>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-slate-700 mb-3">Permisos por Rol</h4>
                                <div className="space-y-2">
                                    {Object.entries(ROLES).map(([key, r]) => (
                                        <div key={key} className={`p-3 rounded-lg bg-${r.color}-50 border border-${r.color}-100`}>
                                            <div className={`font-bold text-${r.color}-700 text-sm`}>{r.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">{r.permisos.join(', ')}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Usuarios del Sistema ({usuarios.length})</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left font-bold text-slate-600">Email</th><th className="px-4 py-3 text-left font-bold text-slate-600">Nombre</th><th className="px-4 py-3 text-center font-bold text-slate-600">Rol</th><th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {usuarios.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-slate-800">{u.email}</td>
                                                <td className="px-4 py-3 text-slate-600">{u.nombre || '-'}</td>
                                                <td className="px-4 py-3 text-center"><Badge variant={ROLES[u.rol]?.color === 'purple' ? 'purple' : ROLES[u.rol]?.color === 'blue' ? 'info' : ROLES[u.rol]?.color === 'emerald' ? 'success' : 'default'}>{ROLES[u.rol]?.name || u.rol}</Badge></td>
                                                <td className="px-4 py-3 text-center"><button onClick={() => deleteUsuario(u.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Icon path={Icons.trash} className="w-4 h-4" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ CONFIGURACIÓN GENERAL ============ */}
                {activeTab === 'general' && (
                    <div className="animate-fade-in max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Configuración General del Sistema</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold uppercase text-slate-500">Nombre de la Empresa</label><input type="text" value={config.nombreEmpresa} onChange={(e) => setConfig({ ...config, nombreEmpresa: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" /></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">Cuota Fija Mensual (C$)</label><input type="number" value={config.cuotaFijaMensual} onChange={(e) => setConfig({ ...config, cuotaFijaMensual: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" /></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">Moneda Principal</label><select value={config.monedaPrincipal} onChange={(e) => setConfig({ ...config, monedaPrincipal: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"><option value="NIO">C$ (Córdoba Nicaragüense)</option><option value="USD">$ (Dólar Estadounidense)</option></select></div>
                            <div className="pt-4 border-t border-slate-100"><Button variant="success" onClick={saveConfig} disabled={loading} className="w-full"><Icon path={Icons.save} className="w-4 h-4 mr-2" />Guardar Configuración</Button></div>
                        </div>
                        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-700 text-sm"><Icon path={Icons.info} className="w-4 h-4" /><span>La cuota fija mensual se utiliza para calcular el <strong>KPI de Carga Fiscal Real</strong></span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}