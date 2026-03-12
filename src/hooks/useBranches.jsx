// src/hooks/useBranches.js
// Hook para gestionar sucursales en toda la aplicación

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
    subscribeToBranches,
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    initializeBranches,
    getBranchName,
    getBranchCode
} from '../services/branchesService';

// Crear contexto para sucursales
const BranchesContext = createContext(null);

// Provider component
export const BranchesProvider = ({ children }) => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Inicializar sucursales por defecto si es necesario
        initializeBranches().catch(console.error);

        // Suscribirse a cambios en tiempo real
        const unsubscribe = subscribeToBranches((newBranches) => {
            setBranches(newBranches);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshBranches = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getBranches();
            setBranches(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addBranch = useCallback(async (branchData) => {
        try {
            const newBranch = await createBranch(branchData);
            await refreshBranches();
            return newBranch;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [refreshBranches]);

    const editBranch = useCallback(async (branchId, branchData) => {
        try {
            const updated = await updateBranch(branchId, branchData);
            await refreshBranches();
            return updated;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [refreshBranches]);

    const removeBranch = useCallback(async (branchId) => {
        try {
            await deleteBranch(branchId);
            await refreshBranches();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [refreshBranches]);

    const value = {
        branches,
        loading,
        error,
        refreshBranches,
        addBranch,
        editBranch,
        removeBranch,
        getBranchName: (branchId) => getBranchName(branches, branchId),
        getBranchCode: (branchId) => getBranchCode(branches, branchId)
    };

    return (
        <BranchesContext.Provider value={value}>
            {children}
        </BranchesContext.Provider>
    );
};

// Hook para usar el contexto
export const useBranches = () => {
    const context = useContext(BranchesContext);
    if (!context) {
        throw new Error('useBranches debe usarse dentro de BranchesProvider');
    }
    return context;
};

// Hook standalone (sin contexto) para componentes que no pueden usar el provider
export const useBranchesStandalone = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        initializeBranches().catch(console.error);

        const unsubscribe = subscribeToBranches((newBranches) => {
            setBranches(newBranches);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return {
        branches,
        loading,
        error,
        getBranchName: (branchId) => getBranchName(branches, branchId),
        getBranchCode: (branchId) => getBranchCode(branches, branchId)
    };
};

export default useBranches;
