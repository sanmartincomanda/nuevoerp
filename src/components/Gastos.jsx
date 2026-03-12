// src/components/Gastos.jsx
// Módulo de Gestión de Gastos y Compras - Visualización, Edición y Eliminación

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    orderBy, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    Timestamp 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { fmt } from '../constants';

// --- ICONOS SVG INLINE ---
const Icons = {
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.433-4.134l-2.296-2.296a2 2 0 00-2.828 0L5 14V19h5l6.433-6.433a2 2 0 000-2.828z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    alertCircle: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
    check: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    unlock: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    save: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7h8",
    trendDown: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    creditCard: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    briefcase: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// --- COMPONENTES UI ---

const FadeIn = ({ children, delay = 0, className = "" }) => (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
        {children}
    </div>
);

const Card = ({ title, children, className = "", right, icon, gradient = false }) => (
    <div className={`rounded-2xl shadow-lg border border-slate-200/60 bg-white overflow-hidden ${className}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b border-slate-100 ${gradient ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-2 rounded-lg ${gradient ? 'bg-white/10' : 'bg-rose-100'}`}>
                        <Icon path={Icons[icon]} className={`w-5 h-5 ${gradient ? 'text-white' : 'text-rose-600'}`} />
                    </div>
                )}
                <div>
                    <h3 className={`text-lg font-bold ${gradient ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                </div>
            </div>
            {right}
        </div>
        <div className="p-6">{children}</div>
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
        slate: 'bg-slate-100 hover:bg-slate-200 text-slate-700'
    };
    
    return (
        <button disabled={disabled} className={`${sizes[size]} rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Input = ({ label, icon, type = "text", className = '', ...props }) => (
    <div className="space-y-1">
        {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>}
        <div className="relative group">
            {icon && <Icon path={Icons[icon]} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />}
            <input type={type} className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${icon ? 'pl-10' : ''} ${className}`} {...props} />
        </div>
    </div>
);

const Select = ({ label, icon, options, ...props }) => (
    <div className="space-y-1">
        {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>}
        <div className="relative">
            {icon && <Icon path={Icons[icon]} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
            <select className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer ${icon ? 'pl-10' : ''}`} {...props}>
                {options}
            </select>
            <Icon path={Icons.chevronRight} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
        </div>
    </div>
);

const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-100 text-emerald-700',
        danger: 'bg-rose-100 text-rose-700',
        warning: 'bg-amber-100 text-amber-700',
        info: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
        sky: 'bg-sky-100 text-sky-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${variants[variant]}`}>{children}</span>;
};

// --- COMPONENTE PRINCIPAL: GASTOS ---

export default function Gastos() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Estados para filtros
    const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todas');
    const [filtroOrigen, setFiltroOrigen] = useState('todas');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    
    // Estados para datos
    const [gastos, setGastos] = useState([]);
    const [gastosFiltrados, setGastosFiltrados] = useState([]);
    
    // Estados para edición
    const [gastoEditando, setGastoEditando] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Verificar si es administrador
    const isAdmin = user?.email !== "adriandiazc95@gmail.com";

    // Cargar todos los gastos
    const cargarGastos = useCallback(async () => {
        setLoading(true);
        try {
            // Obtener todos los gastos de la colección 'gastos'
            const snapshot = await getDocs(collection(db, 'gastos'));
            
            let docs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                fechaObj: d.data().date?.toDate?.() || d.data().timestamp?.toDate?.() || null
            }));
            
            // Ordenar por fecha descendente
            docs.sort((a, b) => {
                const timeA = a.fechaObj?.getTime?.() || 0;
                const timeB = b.fechaObj?.getTime?.() || 0;
                return timeB - timeA;
            });
            
            setGastos(docs);
            setGastosFiltrados(docs);
        } catch (error) {
            console.error('Error cargando gastos:', error);
            alert('Error al cargar los gastos: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarGastos();
    }, [cargarGastos, refreshKey]);

    // Aplicar filtros
    useEffect(() => {
        let filtrados = [...gastos];
        
        // Filtro por fecha desde
        if (filtroFechaDesde) {
            const fechaDesde = new Date(filtroFechaDesde);
            filtrados = filtrados.filter(g => {
                if (!g.fechaObj) return false;
                return g.fechaObj >= fechaDesde;
            });
        }
        
        // Filtro por fecha hasta
        if (filtroFechaHasta) {
            const fechaHasta = new Date(filtroFechaHasta);
            fechaHasta.setHours(23, 59, 59, 999);
            filtrados = filtrados.filter(g => {
                if (!g.fechaObj) return false;
                return g.fechaObj <= fechaHasta;
            });
        }
        
        // Filtro por tipo (retencion, gasto_caja, etc)
        if (filtroTipo !== 'todas') {
            filtrados = filtrados.filter(g => g.tipo === filtroTipo);
        }
        
        // Filtro por origen (manual vs cierre de caja)
        if (filtroOrigen === 'manual') {
            filtrados = filtrados.filter(g => !g.cierreCajaId);
        } else if (filtroOrigen === 'cierre') {
            filtrados = filtrados.filter(g => g.cierreCajaId);
        }
        
        // Filtro por búsqueda
        if (filtroBusqueda) {
            const busqueda = filtroBusqueda.toLowerCase();
            filtrados = filtrados.filter(g => 
                (g.description?.toLowerCase() || '').includes(busqueda) ||
                (g.cuentaContableName?.toLowerCase() || '').includes(busqueda) ||
                (g.proveedor?.toLowerCase() || '').includes(busqueda) ||
                (g.categoria?.toLowerCase() || '').includes(busqueda) ||
                (g.referencia?.toLowerCase() || '').includes(busqueda)
            );
        }
        
        setGastosFiltrados(filtrados);
    }, [gastos, filtroFechaDesde, filtroFechaHasta, filtroTipo, filtroOrigen, filtroBusqueda]);

    // Eliminar gasto
    const handleEliminar = async (gasto) => {
        // Verificar si está vinculado a un cierre de caja
        if (gasto.cierreCajaId) {
            if (!isAdmin) {
                alert('Este gasto está vinculado a un cierre de caja. Solo un administrador puede eliminarlo.');
                return;
            }
            
            const confirmar = window.confirm(
                '⚠️ ATENCIÓN: Este gasto está vinculado a un CIERRE DE CAJA cerrado.\n\n' +
                'Para eliminar este gasto, debe editar el cierre de caja completo.\n\n' +
                '¿Desea ser redirigido al módulo de Cierre de Caja para editarlo?'
            );
            
            if (confirmar) {
                // Redirigir al cierre de caja
                window.location.href = `/cierre-caja-erp?id=${gasto.cierreCajaId}`;
            }
            return;
        }
        
        // Gasto manual - confirmar eliminación
        if (!window.confirm('¿Está seguro de eliminar este gasto?\n\nEsta acción no se puede deshacer.')) {
            return;
        }
        
        setLoading(true);
        try {
            // Eliminar movimientos contables relacionados
            const movimientosSnapshot = await getDocs(collection(db, 'movimientosContables'));
            const movimientosRelacionados = movimientosSnapshot.docs.filter(
                doc => doc.data().documentoId === gasto.id
            );
            
            for (const movDoc of movimientosRelacionados) {
                await deleteDoc(doc(db, 'movimientosContables', movDoc.id));
            }
            
            // Eliminar el gasto
            await deleteDoc(doc(db, 'gastos', gasto.id));
            
            alert('Gasto eliminado correctamente');
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el gasto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Abrir modal de edición
    const handleEditar = (gasto) => {
        // Verificar si está vinculado a un cierre de caja
        if (gasto.cierreCajaId) {
            if (!isAdmin) {
                alert('Este gasto está vinculado a un cierre de caja. Solo un administrador puede editarlo.');
                return;
            }
            
            const confirmar = window.confirm(
                '⚠️ ATENCIÓN: Este gasto está vinculado a un CIERRE DE CAJA cerrado.\n\n' +
                'Para editar este gasto, debe editar el cierre de caja completo.\n\n' +
                '¿Desea ser redirigido al módulo de Cierre de Caja para editarlo?'
            );
            
            if (confirmar) {
                window.location.href = `/cierre-caja-erp?id=${gasto.cierreCajaId}`;
            }
            return;
        }
        
        setGastoEditando({
            ...gasto,
            fecha: gasto.fechaObj ? gasto.fechaObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setShowEditModal(true);
    };

    // Guardar edición
    const handleGuardarEdicion = async (e) => {
        e.preventDefault();
        
        if (!gastoEditando.description || !gastoEditando.amount) {
            alert('Descripción y monto son obligatorios');
            return;
        }
        
        setLoading(true);
        try {
            const gastoRef = doc(db, 'gastos', gastoEditando.id);
            
            await updateDoc(gastoRef, {
                description: gastoEditando.description,
                amount: parseFloat(gastoEditando.amount),
                proveedor: gastoEditando.proveedor || '',
                reference: gastoEditando.reference || '',
                notes: gastoEditando.notes || '',
                updatedAt: Timestamp.now(),
                updatedBy: user?.email || 'system'
            });
            
            // Actualizar movimientos contables relacionados
            const movimientosSnapshot = await getDocs(collection(db, 'movimientosContables'));
            const movimientosRelacionados = movimientosSnapshot.docs.filter(
                doc => doc.data().documentoId === gastoEditando.id
            );
            
            for (const movDoc of movimientosRelacionados) {
                await updateDoc(doc(db, 'movimientosContables', movDoc.id), {
                    descripcion: `Gasto: ${gastoEditando.description}`,
                    monto: parseFloat(gastoEditando.amount),
                    updatedAt: Timestamp.now()
                });
            }
            
            alert('Gasto actualizado correctamente');
            setShowEditModal(false);
            setGastoEditando(null);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error al actualizar:', error);
            alert('Error al actualizar el gasto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Calcular totales
    const totalGastos = gastosFiltrados.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
    const totalManual = gastosFiltrados.filter(g => !g.cierreCajaId).reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
    const totalCierre = gastosFiltrados.filter(g => g.cierreCajaId).reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);

    // Formatear fecha
    const formatFecha = (fechaObj) => {
        if (!fechaObj) return 'N/A';
        return fechaObj.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    // Obtener tipo de gasto para badge
    const getTipoGasto = (gasto) => {
        if (gasto.tipo === 'retencion') return { label: 'Retención', variant: 'warning' };
        if (gasto.tipo === 'gasto_caja') return { label: 'Gasto Caja', variant: 'danger' };
        if (gasto.tipo === 'compra') return { label: 'Compra', variant: 'purple' };
        return { label: 'Gasto', variant: 'danger' };
    };

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
                                Gestión de <span className="text-rose-600">Gastos</span>
                            </h1>
                            <p className="text-slate-500">Visualice, edite y administre todos los gastos y compras del sistema</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="info">
                                <Icon path={Icons.user} className="w-3 h-3 inline mr-1" />
                                {isAdmin ? 'Administrador' : 'Usuario'}
                            </Badge>
                        </div>
                    </div>
                </FadeIn>

                {/* Resumen */}
                <FadeIn delay={50}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Total Gastos (Filtrado)</div>
                            <div className="text-2xl font-black text-rose-700">{fmt(totalGastos)}</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Gastos Manuales</div>
                            <div className="text-2xl font-black text-blue-700">{fmt(totalManual)}</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Gastos Cierre de Caja</div>
                            <div className="text-2xl font-black text-purple-700">{fmt(totalCierre)}</div>
                        </div>
                    </div>
                </FadeIn>

                {/* Filtros */}
                <FadeIn delay={100}>
                    <Card title="Filtros de Búsqueda" icon="filter" className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <Input 
                                label="Desde" 
                                type="date" 
                                icon="calendar" 
                                value={filtroFechaDesde} 
                                onChange={e => setFiltroFechaDesde(e.target.value)} 
                            />
                            <Input 
                                label="Hasta" 
                                type="date" 
                                icon="calendar" 
                                value={filtroFechaHasta} 
                                onChange={e => setFiltroFechaHasta(e.target.value)} 
                            />
                            <Select 
                                label="Tipo" 
                                icon="tag" 
                                value={filtroTipo} 
                                onChange={e => setFiltroTipo(e.target.value)} 
                                options={
                                    <>
                                        <option value="todas">Todos</option>
                                        <option value="retencion">Retención</option>
                                        <option value="gasto_caja">Gasto de Caja</option>
                                        <option value="compra">Compra</option>
                                    </>
                                } 
                            />
                            <Select 
                                label="Origen" 
                                icon="briefcase" 
                                value={filtroOrigen} 
                                onChange={e => setFiltroOrigen(e.target.value)} 
                                options={
                                    <>
                                        <option value="todas">Todos</option>
                                        <option value="manual">Ingreso Manual</option>
                                        <option value="cierre">Desde Cierre de Caja</option>
                                    </>
                                } 
                            />
                            <Input 
                                label="Buscar" 
                                icon="search" 
                                placeholder="Descripción, proveedor, referencia..." 
                                value={filtroBusqueda} 
                                onChange={e => setFiltroBusqueda(e.target.value)} 
                            />
                            <div className="flex items-end">
                                <Button 
                                    onClick={() => {
                                        setFiltroFechaDesde('');
                                        setFiltroFechaHasta('');
                                        setFiltroTipo('todas');
                                        setFiltroOrigen('todas');
                                        setFiltroBusqueda('');
                                    }} 
                                    variant="ghost" 
                                    className="w-full"
                                >
                                    <Icon path={Icons.refresh} className="w-4 h-4 mr-2" />
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </FadeIn>

                {/* Tabla de Gastos */}
                <FadeIn delay={150}>
                    <Card 
                        title={`Listado de Gastos (${gastosFiltrados.length})`} 
                        icon="trendDown"
                        right={
                            <Button onClick={() => setRefreshKey(prev => prev + 1)} variant="slate" size="sm" disabled={loading}>
                                <Icon path={Icons.refresh} className="w-4 h-4 mr-1" />
                                Actualizar
                            </Button>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Descripción</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Proveedor</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Categoría</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">Monto</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-600">Origen</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center">
                                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : gastosFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                                <Icon path={Icons.alertCircle} className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                                <p>No se encontraron gastos con los filtros aplicados</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        gastosFiltrados.map(gasto => {
                                            const tipoInfo = getTipoGasto(gasto);
                                            return (
                                                <tr key={gasto.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {formatFecha(gasto.fechaObj)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={tipoInfo.variant}>
                                                            {tipoInfo.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-800 max-w-xs truncate" title={gasto.description}>
                                                        {gasto.description}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">
                                                        {gasto.proveedor || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">
                                                        {gasto.categoria || gasto.cuentaContableName || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                        {fmt(gasto.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {gasto.cierreCajaId ? (
                                                            <Badge variant="purple">
                                                                <Icon path={Icons.link} className="w-3 h-3 inline mr-1" />
                                                                Cierre
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="info">Manual</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleEditar(gasto)} 
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Icon path={Icons.edit} className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEliminar(gasto)} 
                                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title={gasto.cierreCajaId ? "Requiere permisos de admin" : "Eliminar"}
                                                            >
                                                                <Icon path={gasto.cierreCajaId ? Icons.lock : Icons.trash} className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                                    <tr>
                                        <td colSpan="5" className="px-4 py-4 font-bold text-slate-800 uppercase text-sm">Total Filtrado</td>
                                        <td className="px-4 py-4 text-right font-black text-xl text-slate-900">{fmt(totalGastos)}</td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </FadeIn>
            </div>

            {/* Modal de Edición */}
            {showEditModal && gastoEditando && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Icon path={Icons.edit} className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Editar Gasto</h3>
                                    <p className="text-xs text-slate-500">Modifique los datos del gasto</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setShowEditModal(false); setGastoEditando(null); }} 
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Icon path={Icons.x} className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleGuardarEdicion} className="p-6 space-y-4">
                            <Input 
                                label="Fecha" 
                                type="date" 
                                icon="calendar" 
                                value={gastoEditando.fecha} 
                                onChange={e => setGastoEditando({...gastoEditando, fecha: e.target.value})} 
                                disabled
                            />
                            
                            <Input 
                                label="Descripción *" 
                                icon="fileText" 
                                value={gastoEditando.description} 
                                onChange={e => setGastoEditando({...gastoEditando, description: e.target.value})} 
                                required 
                            />
                            
                            <Input 
                                label="Monto *" 
                                type="number" 
                                step="0.01" 
                                icon="dollar" 
                                value={gastoEditando.amount} 
                                onChange={e => setGastoEditando({...gastoEditando, amount: e.target.value})} 
                                required 
                            />
                            
                            <Input 
                                label="Proveedor" 
                                icon="user" 
                                value={gastoEditando.proveedor || ''} 
                                onChange={e => setGastoEditando({...gastoEditando, proveedor: e.target.value})} 
                            />
                            
                            <Input 
                                label="Referencia / Folio" 
                                icon="creditCard" 
                                value={gastoEditando.reference || ''} 
                                onChange={e => setGastoEditando({...gastoEditando, reference: e.target.value})} 
                            />
                            
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Notas</label>
                                <textarea 
                                    value={gastoEditando.notes || ''} 
                                    onChange={e => setGastoEditando({...gastoEditando, notes: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    rows="3"
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => { setShowEditModal(false); setGastoEditando(null); }}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="success" 
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    <Icon path={Icons.save} className="w-4 h-4 mr-2" />
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
