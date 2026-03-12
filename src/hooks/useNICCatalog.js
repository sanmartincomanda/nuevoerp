// src/hooks/useNICCatalog.js
import { useState, useEffect, useCallback } from 'react';
import { 
    NIC_CATALOG, 
    NIC_DETAILED_ACCOUNTS, 
    initializeNICCatalog, 
    getNICCatalogStatus,
    getMissingNICAccounts 
} from '../services/nicCatalogService';
import { useChartOfAccounts } from './useAccounting';

export const useNICCatalog = () => {
    const { accounts, loading: accountsLoading, refreshAccounts } = useChartOfAccounts();
    const [nicStatus, setNicStatus] = useState(null);
    const [missingAccounts, setMissingAccounts] = useState([]);
    const [initializing, setInitializing] = useState(false);
    const [error, setError] = useState(null);

    // Cargar estado NIC cuando cambien las cuentas
    useEffect(() => {
        if (!accountsLoading && accounts.length > 0) {
            const status = {
                totalInSystem: accounts.length,
                nicAccounts: accounts.filter(acc => acc.isNICStandard).length,
                customAccounts: accounts.filter(acc => !acc.isNICStandard).length,
                coverage: getMissingNICAccounts(accounts)
            };
            setNicStatus(status);
            
            const missing = getMissingNICAccounts(accounts);
            setMissingAccounts(missing);
        }
    }, [accounts, accountsLoading]);

    const initializeCatalog = useCallback(async (preserveExisting = true) => {
        setInitializing(true);
        setError(null);
        
        try {
            const result = await initializeNICCatalog(preserveExisting);
            await refreshAccounts();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setInitializing(false);
        }
    }, [refreshAccounts]);

    const getCatalogStructure = useCallback(() => {
        return NIC_CATALOG;
    }, []);

    const getAllNICAccounts = useCallback(() => {
        return NIC_DETAILED_ACCOUNTS;
    }, []);

    const isNICCode = useCallback((code) => {
        return NIC_DETAILED_ACCOUNTS.some(acc => acc.code === code);
    }, []);

    return {
        nicStatus,
        missingAccounts,
        initializing,
        error,
        initializeCatalog,
        getCatalogStructure,
        getAllNICAccounts,
        isNICCode,
        catalog: NIC_CATALOG,
        standardAccounts: NIC_DETAILED_ACCOUNTS
    };
};

export default useNICCatalog;