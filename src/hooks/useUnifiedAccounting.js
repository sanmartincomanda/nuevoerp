// src/hooks/useUnifiedAccounting.js
// Hook unificado para el ERP - Centraliza todas las operaciones contables

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
    collection, query, where, orderBy, onSnapshot,
    doc, getDoc, Timestamp
} from 'firebase/firestore';

// ============================================
// HOOK: PLAN DE CUENTAS
// ============================================

export const usePlanCuentas = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const accountsRef = collection(db, 'planCuentas');
        const q = query(accountsRef, where('isActive', '==', true), orderBy('code'));
        
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setAccounts(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error cargando plan de cuentas:', err);
                setError(err.message);
                setLoading(false);
            }
        );
        
        return () => unsubscribe();
    }, []);

    const getAccountByCode = useCallback((code) => {
        return accounts.find(a => a.code === code);
    }, [accounts]);

    const getAccountById = useCallback((id) => {
        return accounts.find(a => a.id === id);
    }, [accounts]);

    const getAccountsByType = useCallback((type) => {
        return accounts.filter(a => a.type === type && !a.isGroup);
    }, [accounts]);

    const getCajaAccounts = useCallback((currency = 'NIO') => {
        return accounts.filter(a => 
            a.subType === 'caja' && 
            (a.currency === currency || (!a.currency && currency === 'NIO')) &&
            !a.isGroup
        );
    }, [accounts]);

const getBancoAccounts = useCallback((currency = 'NIO') => {
    const prefix = currency === 'USD' ? '1.01.03.' : '1.01.02.';

    return accounts
        .filter(acc =>
            acc &&
            acc.isActive === true &&
            !acc.isGroup &&
            acc.type === 'ACTIVO' &&
            acc.subType === 'banco' &&
            acc.currency === currency &&
            typeof acc.code === 'string' &&
            acc.code.startsWith(prefix)
        )
        .filter((acc, index, arr) =>
            index === arr.findIndex(x => x.code === acc.code)
        )
        .sort((a, b) => (a.code || '').localeCompare(b.code || ''));
}, [accounts]);

    const getTransitoAccounts = useCallback((currency = null) => {
        if (currency) {
            return accounts.filter(a => 
                a.subType === 'transito' && 
                (a.currency === currency || (!a.currency && currency === 'NIO')) &&
                !a.isGroup
            );
        }
        return accounts.filter(a => a.subType === 'transito' && !a.isGroup);
    }, [accounts]);

    const getGastoAccounts = useCallback(() => {
        return accounts.filter(a => 
            a.type === 'GASTO' && 
            !a.isGroup &&
            a.isActive !== false
        );
    }, [accounts]);

    return {
        accounts,
        loading,
        error,
        getAccountByCode,
        getAccountById,
        getAccountsByType,
        getCajaAccounts,
        getBancoAccounts,
        getTransitoAccounts,
        getGastoAccounts
    };
};

// ============================================
// HOOK: MOVIMIENTOS CONTABLES (HISTORIAL UNIFICADO)
// ============================================

export const useMovimientosContables = (filters = {}) => {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const movimientosRef = collection(db, 'movimientosContables');
        let q = query(movimientosRef, orderBy('timestamp', 'desc'));
        
        if (filters.accountId) {
            q = query(q, where('accountId', '==', filters.accountId));
        }
        if (filters.documentoTipo) {
            q = query(q, where('documentoTipo', '==', filters.documentoTipo));
        }
        if (filters.moduloOrigen) {
            q = query(q, where('moduloOrigen', '==', filters.moduloOrigen));
        }
        if (filters.fechaDesde) {
            q = query(q, where('fecha', '>=', filters.fechaDesde));
        }
        if (filters.fechaHasta) {
            q = query(q, where('fecha', '<=', filters.fechaHasta));
        }
        if (filters.referencia) {
            q = query(q, where('referencia', '==', filters.referencia));
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setMovimientos(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error cargando movimientos:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [
        filters.accountId, 
        filters.documentoTipo, 
        filters.moduloOrigen,
        filters.fechaDesde,
        filters.fechaHasta,
        filters.referencia
    ]);

    const getMovimientosByDocumento = useCallback((documentoId, documentoTipo) => {
        return movimientos.filter(m => 
            m.documentoId === documentoId && m.documentoTipo === documentoTipo
        );
    }, [movimientos]);

    const getMovimientosByCuenta = useCallback((accountId) => {
        return movimientos.filter(m => m.accountId === accountId);
    }, [movimientos]);

    return {
        movimientos,
        loading,
        error,
        getMovimientosByDocumento,
        getMovimientosByCuenta
    };
};

// ============================================
// HOOK: CIERRES DE CAJA ERP
// ============================================

export const useCierresCajaERP = (filters = {}) => {
    const [cierres, setCierres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cierresRef = collection(db, 'cierresCajaERP');
        let q = query(cierresRef, orderBy('createdAt', 'desc'));

        if (filters.estado) {
            q = query(q, where('estado', '==', filters.estado));
        }
        if (filters.fechaDesde) {
            q = query(q, where('fecha', '>=', filters.fechaDesde));
        }
        if (filters.fechaHasta) {
            q = query(q, where('fecha', '<=', filters.fechaHasta));
        }
        if (filters.caja) {
            q = query(q, where('caja', '==', filters.caja));
        }
        if (filters.cajero) {
            q = query(q, where('cajero', '==', filters.cajero));
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setCierres(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error cargando cierres:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [filters.estado, filters.fechaDesde, filters.fechaHasta, filters.caja, filters.cajero]);

    const getCierreById = useCallback(async (id) => {
        const cierreRef = doc(db, 'cierresCajaERP', id);
        const snap = await getDoc(cierreRef);
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }, []);

    const getCierresPendientes = useCallback(() => {
        return cierres.filter(c => c.estado === 'pendiente');
    }, [cierres]);

    const getCierresNoCuadrados = useCallback(() => {
        return cierres.filter(c => c.estado === 'borrador' && !c.cuadre?.estaCuadrado);
    }, [cierres]);

    return {
        cierres,
        loading,
        error,
        getCierreById,
        getCierresPendientes,
        getCierresNoCuadrados
    };
};

// ============================================
// HOOK: DEPÓSITOS EN TRÁNSITO
// ============================================

export const useDepositosTransitoERP = (estado = null) => {
    const [depositos, setDepositos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const depositosRef = collection(db, 'depositosTransito');
        let q = query(depositosRef, orderBy('createdAt', 'desc'));

        if (estado) {
            q = query(q, where('estado', '==', estado));
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setDepositos(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error cargando depósitos:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [estado]);

    const getDepositosPendientes = useCallback(() => {
        return depositos.filter(d => d.estado === 'pendiente');
    }, [depositos]);

    return {
        depositos,
        loading,
        error,
        getDepositosPendientes
    };
};

// ============================================
// HOOK: DEPÓSITOS BANCARIOS
// ============================================

export const useDepositosBancariosERP = (filters = {}) => {
    const [depositos, setDepositos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const depositosRef = collection(db, 'depositosBancarios');
        let q = query(depositosRef, orderBy('createdAt', 'desc'));

        if (filters.bancoId) {
            q = query(q, where('bancoDestinoId', '==', filters.bancoId));
        }
        if (filters.fechaDesde) {
            q = query(q, where('fecha', '>=', filters.fechaDesde));
        }
        if (filters.fechaHasta) {
            q = query(q, where('fecha', '<=', filters.fechaHasta));
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setDepositos(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error cargando depósitos bancarios:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [filters.bancoId, filters.fechaDesde, filters.fechaHasta]);

    return {
        depositos,
        loading,
        error
    };
};

// ============================================
// HOOK: AJUSTES MANUALES
// ============================================

export const useAjustesManuales = (estado = null) => {
    const [ajustes, setAjustes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const ajustesRef = collection(db, 'ajustesManuales');
        let q = query(ajustesRef, orderBy('createdAt', 'desc'));

        if (estado) {
            q = query(q, where('estado', '==', estado));
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setAjustes(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error cargando ajustes:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [estado]);

    const getAjustesPendientes = useCallback(() => {
        return ajustes.filter(a => a.estado === 'pendiente');
    }, [ajustes]);

    return {
        ajustes,
        loading,
        error,
        getAjustesPendientes
    };
};

// ============================================
// HOOK: DASHBOARD ERP
// ============================================

export const useDashboardERP = () => {
    const { accounts, loading: accountsLoading } = usePlanCuentas();
    const [dashboard, setDashboard] = useState({
        saldos: {
            activos: 0,
            pasivos: 0,
            capital: 0,
            patrimonio: 0
        },
        cajas: { NIO: [], USD: [] },
        bancos: { NIO: [], USD: [] },
        transito: { NIO: [], USD: [] },
        totales: {
            cajas: { NIO: 0, USD: 0 },
            bancos: { NIO: 0, USD: 0 },
            transito: { NIO: 0, USD: 0 }
        }
    });

    useEffect(() => {
        if (accountsLoading || accounts.length === 0) return;

        // Calcular saldos por tipo
        const activos = accounts.filter(a => a.type === 'ACTIVO' && !a.isGroup);
        const pasivos = accounts.filter(a => a.type === 'PASIVO' && !a.isGroup);
        const capital = accounts.filter(a => a.type === 'CAPITAL' && !a.isGroup);

        const saldos = {
            activos: activos.reduce((sum, a) => sum + (a.balance || 0), 0),
            pasivos: pasivos.reduce((sum, a) => sum + (a.balance || 0), 0),
            capital: capital.reduce((sum, a) => sum + (a.balance || 0), 0),
            patrimonio: 0
        };
        saldos.patrimonio = saldos.activos - saldos.pasivos;

        // Cajas
        const cajasNIO = accounts.filter(a => a.subType === 'caja' && (a.currency === 'NIO' || !a.currency));
        const cajasUSD = accounts.filter(a => a.subType === 'caja' && a.currency === 'USD');

        // Bancos
        const bancosNIO = accounts.filter(a => a.subType === 'banco' && (a.currency === 'NIO' || !a.currency));
        const bancosUSD = accounts.filter(a => a.subType === 'banco' && a.currency === 'USD');

        // Tránsito
        const transitoNIO = accounts.filter(a => a.subType === 'transito' && (a.currency === 'NIO' || !a.currency));
        const transitoUSD = accounts.filter(a => a.subType === 'transito' && a.currency === 'USD');

        setDashboard({
            saldos,
            cajas: { NIO: cajasNIO, USD: cajasUSD },
            bancos: { NIO: bancosNIO, USD: bancosUSD },
            transito: { NIO: transitoNIO, USD: transitoUSD },
            totales: {
                cajas: {
                    NIO: cajasNIO.reduce((sum, a) => sum + (a.balance || 0), 0),
                    USD: cajasUSD.reduce((sum, a) => sum + (a.balanceUSD || 0), 0)
                },
                bancos: {
                    NIO: bancosNIO.reduce((sum, a) => sum + (a.balance || 0), 0),
                    USD: bancosUSD.reduce((sum, a) => sum + (a.balanceUSD || 0), 0)
                },
                transito: {
                    NIO: transitoNIO.reduce((sum, a) => sum + (a.balance || 0), 0),
                    USD: transitoUSD.reduce((sum, a) => sum + (a.balanceUSD || 0), 0)
                }
            }
        });
    }, [accounts, accountsLoading]);

    return { dashboard, loading: accountsLoading };
};

// ============================================
// HOOK PRINCIPAL UNIFICADO
// ============================================

export const useUnifiedAccounting = () => {
    const planCuentas = usePlanCuentas();
    const movimientos = useMovimientosContables();
    const dashboard = useDashboardERP();

    return {
        // Plan de cuentas
        ...planCuentas,
        
        // Movimientos
        movimientos: movimientos.movimientos,
        movimientosLoading: movimientos.loading,
        movimientosError: movimientos.error,
        
        // Dashboard
        dashboard: dashboard.dashboard,
        dashboardLoading: dashboard.loading
    };
};

export default {
    usePlanCuentas,
    useMovimientosContables,
    useCierresCajaERP,
    useDepositosTransitoERP,
    useDepositosBancariosERP,
    useAjustesManuales,
    useDashboardERP,
    useUnifiedAccounting
};
