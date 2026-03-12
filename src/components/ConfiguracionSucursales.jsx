// src/components/ConfiguracionSucursales.jsx
// VERSIÓN NUCLEAR COMPLETA - Eliminación directa a Firestore

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    collection, getDocs, deleteDoc, doc, query, where, 
    onSnapshot, writeBatch, getDoc, updateDoc, setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

const Icons = {
    plus: "M12 4v16m8-8H4",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.433-4.433A5.001 5.001 0 0119.9 6.1m-1.433 4.433L12 15l-3 1 1-3 6.467-6.467m1.433-1.433a5.001 5.001 0 01-1.433 1.433",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    check: "M5 13l4 4L19 7",
    alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    bug: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    fire: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
    warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
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
        dark: 'bg-slate-800 hover:bg-slate-900 text-white',
        nuclear: 'bg-red-700 hover:bg-red-900 text-white border-2 border-red-900 shadow-lg shadow-red-500/50'
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
        purple: 'bg-purple-100 text-purple-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${variants[variant]}`}>{children}</span>;
};

export default function ConfiguracionSucursales() {
    // ESTADO LOCAL INDEPENDIENTE
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    
    const [showForm, setShowForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '', code: '', order: 0, address: '', phone: '', manager: ''
    });

    const addLog = useCallback((msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const log = { msg, type, time: timestamp, id: Date.now() + Math.random() };
        setLogs(prev => [log, ...prev].slice(0, 20));
        console.log(`[${type.toUpperCase()}] ${msg}`);
    }, []);

    // CARGA DIRECTA DE FIRESTORE
    const loadBranches = useCallback(async () => {
        addLog('Cargando desde Firestore...', 'info');
        setLoading(true);
        try {
            const q = query(collection(db, 'sucursales'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            addLog(`Cargadas ${data.length} sucursales`, 'success');
            setBranches(data);
        } catch (err) {
            addLog(`Error: ${err.message}`, 'error');
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadBranches();
    }, [loadBranches]);

    const duplicates = useMemo(() => {
        const codeMap = {};
        branches.forEach(branch => {
            const code = (branch.code || '').toLowerCase().trim();
            if (code) {
                if (!codeMap[code]) codeMap[code] = [];
                codeMap[code].push(branch);
            }
        });
        return Object.entries(codeMap).filter(([code, items]) => items.length > 1);
    }, [branches]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'order' ? parseInt(value) || 0 : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.code.trim()) {
            alert('Nombre y código son obligatorios');
            return;
        }

        const codeExists = branches.some(
            b => b.code.toLowerCase() === formData.code.toLowerCase() && 
                (!editingBranch || b.id !== editingBranch.id)
        );
        if (codeExists) {
            alert('El código ya existe');
            return;
        }

        setSaving(true);
        try {
            if (editingBranch) {
                const ref = doc(db, 'sucursales', editingBranch.id);
                await updateDoc(ref, { ...formData, updatedAt: new Date() });
                addLog(`Actualizada: ${editingBranch.id}`, 'success');
            } else {
                const newRef = doc(collection(db, 'sucursales'));
                await setDoc(newRef, { 
                    ...formData, 
                    id: newRef.id,
                    active: true, 
                    createdAt: new Date() 
                });
                addLog(`Creada: ${newRef.id}`, 'success');
            }
            resetForm();
            await loadBranches();
        } catch (err) {
            addLog(`Error: ${err.message}`, 'error');
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ELIMINACIÓN NUCLEAR
    const nuclearDelete = async (branch) => {
        if (!window.confirm(
            `☢️ ELIMINAR: ${branch.name}\nID: ${branch.id}\n\n¿Confirmar eliminación física?`
        )) return;

        addLog(`🚨 Eliminando: ${branch.id}`, 'warning');
        
        // Eliminar visualmente INMEDIATAMENTE
        setBranches(prev => prev.filter(b => b.id !== branch.id));
        
        try {
            const docRef = doc(db, 'sucursales', branch.id);
            
            // Verificar existencia
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
                addLog('Ya no existe en Firestore', 'warning');
                return;
            }
            
            // Hard delete
            await deleteDoc(docRef);
            addLog('✅ Eliminada físicamente', 'success');
            
            // Verificar
            const verify = await getDoc(docRef);
            if (verify.exists()) {
                addLog('⚠️ Sigues existiendo!', 'error');
                alert('ERROR: No se pudo eliminar. Revisa permisos de Firestore.');
            }
        } catch (err) {
            addLog(`❌ Error: ${err.message}`, 'error');
            alert('Error: ' + err.message);
            // Revertir
            setBranches(prev => [...prev, branch]);
        }
    };

    // LIMPIEZA MASIVA
    const handleCleanDuplicates = async () => {
        if (!window.confirm('☢️ Eliminar TODOS los duplicados excepto el primero?')) return;

        let deleted = 0;
        for (const [code, items] of duplicates) {
            const toDelete = items.slice(1);
            for (const branch of toDelete) {
                try {
                    setBranches(prev => prev.filter(b => b.id !== branch.id));
                    await deleteDoc(doc(db, 'sucursales', branch.id));
                    deleted++;
                    addLog(`Eliminado duplicado: ${branch.code}`, 'success');
                } catch (err) {
                    addLog(`Falló: ${branch.id}`, 'error');
                }
            }
        }
        alert(`Eliminados: ${deleted}`);
    };

    // PURGA TOTAL
    const handleNuclearPurge = async () => {
        if (!window.confirm('💣 Eliminar TODAS las sucursales?')) return;
        
        let count = 0;
        for (const branch of branches) {
            try {
                await deleteDoc(doc(db, 'sucursales', branch.id));
                count++;
            } catch (e) {
                console.error(e);
            }
        }
        setBranches([]);
        addLog(`Purga completada: ${count} eliminados`, 'success');
    };

    const resetForm = () => {
        setFormData({ name: '', code: '', order: branches.length + 1, address: '', phone: '', manager: '' });
        setEditingBranch(null);
        setShowForm(false);
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name || '',
            code: branch.code || '',
            order: branch.order || 0,
            address: branch.address || '',
            phone: branch.phone || '',
            manager: branch.manager || ''
        });
        setShowForm(true);
    };

    if (loading && branches.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">
                            Gestión de <span className="text-blue-600">Sucursales</span>
                            <span className="ml-3 text-xs bg-red-600 text-white px-2 py-1 rounded">MODO DIRECTO</span>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={loadBranches}>
                            <Icon path={Icons.refresh} className="w-4 h-4 mr-2" />
                            Recargar
                        </Button>
                        {duplicates.length > 0 && (
                            <Button variant="nuclear" size="sm" onClick={handleCleanDuplicates}>
                                <Icon path={Icons.fire} className="w-4 h-4 mr-2" />
                                Limpiar {duplicates.length} Duplicados
                            </Button>
                        )}
                        <Button variant="primary" onClick={() => setShowForm(true)}>
                            <Icon path={Icons.plus} className="w-4 h-4 mr-2" />
                            Nueva
                        </Button>
                    </div>
                </div>

                {/* Consola de Logs */}
                <div className="mb-6 bg-slate-900 rounded-lg p-4 font-mono text-xs max-h-48 overflow-y-auto border border-slate-700">
                    <div className="flex justify-between items-center mb-2 sticky top-0 bg-slate-900 pb-2 border-b border-slate-700">
                        <span className="text-slate-400 font-bold">🖥️ LOGS EN TIEMPO REAL</span>
                        <button onClick={() => setLogs([])} className="text-slate-500 hover:text-white">Limpiar</button>
                    </div>
                    {logs.length === 0 ? (
                        <span className="text-slate-600">Esperando operaciones...</span>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className={`mb-1 ${
                                log.type === 'error' ? 'text-red-400' : 
                                log.type === 'warning' ? 'text-yellow-400' : 
                                log.type === 'success' ? 'text-green-400' : 'text-blue-300'
                            }`}>
                                <span className="text-slate-500">[{log.time}]</span> {log.msg}
                            </div>
                        ))
                    )}
                </div>

                {/* Alerta Duplicados */}
                {duplicates.length > 0 && (
                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Icon path={Icons.alert} className="w-6 h-6 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-bold text-red-800">☢️ {duplicates.length} CÓDIGOS DUPLICADOS DETECTADOS</h4>
                                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                    {duplicates.map(([code, items]) => (
                                        <div key={code} className="bg-white p-3 rounded border border-red-200">
                                            <div className="font-bold text-red-700 text-sm mb-2">
                                                "{code.toUpperCase()}" aparece {items.length} veces:
                                            </div>
                                            <div className="space-y-1">
                                                {items.map((item, idx) => (
                                                    <div key={item.id} className={`text-xs font-mono p-2 rounded flex justify-between items-center ${
                                                        idx === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        <span className="truncate">{idx === 0 ? '✅ KEEP: ' : '❌ DEL: '} {item.id}</span>
                                                        {idx !== 0 && (
                                                            <button 
                                                                onClick={() => nuclearDelete(item)}
                                                                className="px-2 py-1 bg-red-600 text-white rounded text-[10px] hover:bg-red-700 ml-2"
                                                            >
                                                                ELIMINAR
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulario */}
                {showForm && (
                    <div className="mb-6 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-lg font-bold mb-4">{editingBranch ? 'Editar' : 'Nueva'} Sucursal</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" value={formData.name} onChange={handleInputChange} 
                                placeholder="Nombre *" className="px-4 py-2 border rounded" required />
                            <input name="code" value={formData.code} onChange={handleInputChange} 
                                placeholder="Código *" className="px-4 py-2 border rounded uppercase" required />
                            <input name="order" type="number" value={formData.order} onChange={handleInputChange} 
                                placeholder="Orden" className="px-4 py-2 border rounded" />
                            <input name="phone" value={formData.phone} onChange={handleInputChange} 
                                placeholder="Teléfono" className="px-4 py-2 border rounded" />
                            <input name="address" value={formData.address} onChange={handleInputChange} 
                                placeholder="Dirección" className="px-4 py-2 border rounded md:col-span-2" />
                            <input name="manager" value={formData.manager} onChange={handleInputChange} 
                                placeholder="Encargado" className="px-4 py-2 border rounded md:col-span-2" />
                            
                            <div className="md:col-span-2 flex gap-2 mt-4">
                                <Button type="button" variant="ghost" className="flex-1" onClick={resetForm}>Cancelar</Button>
                                <Button type="submit" variant="primary" disabled={saving} className="flex-1">
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Sucursales ({branches.length})</h3>
                        <Badge variant={duplicates.length > 0 ? 'danger' : 'success'}>
                            {duplicates.length > 0 ? `${duplicates.length} duplicados` : 'OK'}
                        </Badge>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">ORDEN</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">ID FIRESTORE</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">CÓDIGO</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">NOMBRE</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 w-32">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {branches.sort((a,b) => (a.order||0)-(b.order||0)).map((branch, idx) => {
                                    const isDup = duplicates.some(([code, items]) => 
                                        items.some(i => i.id === branch.id && items.indexOf(i) > 0)
                                    );
                                    
                                    return (
                                        <tr key={branch.id} className={isDup ? 'bg-red-50' : 'hover:bg-slate-50'}>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg font-bold text-slate-600 text-xs">
                                                    {branch.order || idx + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-purple-600 max-w-[200px] truncate" title={branch.id}>
                                                {branch.id}
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className={`px-2 py-1 rounded font-mono text-xs font-bold ${
                                                    isDup ? 'bg-red-200 text-red-800' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                    {branch.code || 'SIN-CÓDIGO'}
                                                </code>
                                                {isDup && <span className="ml-2 text-[10px] text-red-600 font-bold">DUP</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-800">{branch.name}</div>
                                                {branch.manager && <div className="text-xs text-slate-500">{branch.manager}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handleEdit(branch)} 
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                                                        <Icon path={Icons.edit} className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => nuclearDelete(branch)} 
                                                        className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 shadow-lg shadow-red-500/30"
                                                        title="ELIMINAR">
                                                        ☢️ DEL
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Zona de Peligro */}
                <div className="mt-8 border-2 border-red-300 rounded-xl p-6 bg-red-50">
                    <h4 className="text-red-800 font-bold mb-4 flex items-center gap-2">
                        <Icon path={Icons.warning} className="w-5 h-5" />
                        ZONA DE EMERGENCIA
                    </h4>
                    <div className="flex gap-4">
                        <Button variant="nuclear" onClick={handleNuclearPurge}>
                            💣 ELIMINAR TODO
                        </Button>
                        <Button variant="ghost" onClick={() => window.location.reload()}>
                            🔄 Recargar Página
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}