// src/hooks/useAccounting.jsx
// Hook para gestionar el Plan Contable

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
    subscribeToAccounts,
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    initializeNICChartOfAccounts,
    getNICAccounts,
    getCustomAccounts
} from '../services/chartOfAccountsService';

// Crear contexto
const AccountingContext = createContext(null);

// Provider
export const AccountingProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Inicializar plan contable NIC si es necesario
        initializeNICChartOfAccounts().catch(console.error);

        // Suscribirse a cambios
        const unsubscribe = subscribeToAccounts((newAccounts) => {
            setAccounts(newAccounts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addAccount = useCallback(async (accountData) => {
        try {
            const newAccount = await createAccount(accountData);
            await refreshAccounts();
            return newAccount;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [refreshAccounts]);

    const editAccount = useCallback(async (accountId, accountData) => {
        try {
            const updated = await updateAccount(accountId, accountData);
            await refreshAccounts();
            return updated;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [refreshAccounts]);

    const removeAccount = useCallback(async (accountId) => {
        try {
            await deleteAccount(accountId);
            await refreshAccounts();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [refreshAccounts]);

    // Funciones auxiliares
    const getAccountById = useCallback((id) => {
        return accounts.find(a => a.id === id);
    }, [accounts]);

    const getAccountByCode = useCallback((code) => {
        return accounts.find(a => a.code === code);
    }, [accounts]);

    const getAccountsByType = useCallback((type) => {
        return accounts.filter(a => a.type === type && a.active !== false);
    }, [accounts]);

    const getNICAccounts = useCallback(() => {
        return accounts.filter(a => a.nicStandard === true && a.active !== false);
    }, [accounts]);

    const getCustomAccounts = useCallback(() => {
        return accounts.filter(a => a.nicStandard !== true && a.active !== false);
    }, [accounts]);

    const value = {
        accounts,
        loading,
        error,
        refreshAccounts,
        addAccount,
        editAccount,
        removeAccount,
        getAccountById,
        getAccountByCode,
        getAccountsByType,
        getNICAccounts,
        getCustomAccounts
    };

    return (
        <AccountingContext.Provider value={value}>
            {children}
        </AccountingContext.Provider>
    );
};

// Hook para usar el contexto
export const useAccounting = () => {
    const context = useContext(AccountingContext);
    if (!context) {
        throw new Error('useAccounting debe usarse dentro de AccountingProvider');
    }
    return context;
};

// Hook standalone (sin provider)
export const useChartOfAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        initializeNICChartOfAccounts().catch(console.error);

        const unsubscribe = subscribeToAccounts((newAccounts) => {
            setAccounts(newAccounts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        accounts,
        loading,
        error,
        refreshAccounts
    };
};

// Hook para depósitos en tránsito (stub)
export const useDepositosTransito = () => {
    return {
        depositos: [],
        loading: false,
        error: null,
        refresh: () => {},
        addDeposito: () => {},
        confirmDeposito: () => {}
    };
};

// Hook para depósitos bancarios (stub)
export const useDepositosBancarios = () => {
    return {
        depositos: [],
        loading: false,
        error: null,
        refresh: () => {},
        addDeposito: () => {},
        getDepositosByAccount: () => []
    };
};

export default useAccounting;
