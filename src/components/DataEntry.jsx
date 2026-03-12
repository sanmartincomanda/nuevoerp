// src/components/DataEntry.jsx
// Entrada de Datos - Ingresos/Gastos + Inventario + Presupuestos

import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { 
    collection, 
    addDoc, 
    deleteDoc,
    doc,
    Timestamp, 
    query, 
    where, 
    getDocs, 
    orderBy,
    updateDoc,
    getDoc,
    onSnapshot
} from 'firebase/firestore';
import { useChartOfAccounts } from '../hooks/useAccounting.jsx';
import { useBranches } from '../hooks/useBranches.jsx';
import { fmt } from '../constants';

// Iconos SVG
const Icons = {
    plus: "M12 4v16m8-8H4",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    arrowUp: "M5 10l7-7m0 0l7 7m-7-7v18",
    arrowDown: "M19 14l-7 7m0 0l-7-7m7 7V3",
    wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    creditCard: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    check: "M5 13l4 4L19 7",
    alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    bank: "M3 21h18M5 21V7l8-4 8 4M8 21v-9a2 2 0 012-2h4a2 2 0 012 2v9",
    transfer: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    currency: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    inventory: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    budget: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    initial: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    final: "M5 13l4 4L19 7",
    calculator: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
        dark: 'bg-slate-800 hover:bg-slate-900 text-white'
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

const TRANSACTION_TYPES = [
    { value: 'ingreso', label: 'Ingreso / Venta', icon: 'arrowUp', color: 'success', debit: true },
    { value: 'gasto', label: 'Gasto / Compra', icon: 'arrowDown', color: 'danger', credit: true },
];

const PAYMENT_METHODS = [
    { value: 'efectivo', label: 'Efectivo', icon: 'cash' },
    { value: 'tarjeta', label: 'Tarjeta', icon: 'creditCard' },
    { value: 'transferencia', label: 'Transferencia', icon: 'transfer' },
    { value: 'cheque', label: 'Cheque', icon: 'fileText' },
    { value: 'deposito', label: 'Deposito', icon: 'bank' },
];

const CURRENCIES = [
    { code: 'NIO', name: 'Córdobas (C$)', symbol: 'C$' },
    { code: 'USD', name: 'Dólares ($)', symbol: '$' }
];

// Categorías de gastos para presupuestos
const EXPENSE_CATEGORIES = [
    'Nómina',
    'Alquiler',
    'Servicios Públicos',
    'Marketing',
    'Mantenimiento',
    'Transporte',
    'Suministros',
    'Otros'
];

export default function DataEntry() {
    const { accounts, refreshAccounts } = useChartOfAccounts();
    const { branches, getBranchName } = useBranches();
    const [currentUser, setCurrentUser] = useState(null);
    
    // Tabs principales
    const [mainTab, setMainTab] = useState('transacciones'); // 'transacciones', 'inventario', 'presupuestos'
    
    // Estados para Transacciones (Ingresos/Gastos)
    const [transactionType, setTransactionType] = useState('ingreso');
    const [selectedCurrency, setSelectedCurrency] = useState('NIO');
    const [transForm, setTransForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        sucursal: '',
        cuentaContableId: '',
        bankAccountId: '',
        paymentMethod: 'efectivo',
        reference: '',
        cliente: '',
        proveedor: '',
        facturaFolio: '',
        notes: ''
    });
    const [savingTrans, setSavingTrans] = useState(false);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);

    // Estados para Inventario
    const [inventarios, setInventarios] = useState([]);
    const [invForm, setInvForm] = useState({
        month: new Date().toISOString().substring(0, 7),
        sucursal: '',
        type: 'inicial',
        amount: ''
    });
    const [savingInv, setSavingInv] = useState(false);

    // Estados para Presupuestos
    const [presupuestos, setPresupuestos] = useState([]);
    const [presForm, setPresForm] = useState({
        month: new Date().toISOString().substring(0, 7),
        category: '',
        amount: ''
    });
    const [savingPres, setSavingPres] = useState(false);

    // Cargar usuario
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Cargar transacciones recientes
    useEffect(() => {
        loadRecentTransactions();
    }, [transactionType, selectedCurrency]);

    const loadRecentTransactions = async () => {
        setLoadingRecent(true);
        try {
            const collectionName = transactionType === 'ingreso' ? 'ingresos' : 'gastos';
            const q = query(
                collection(db, collectionName),
                orderBy('timestamp', 'desc'),
                where('currency', '==', selectedCurrency)
            );
            
            const snapshot = await getDocs(q);
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate?.() || doc.data().timestamp?.toDate?.()
            }));
            
            setRecentTransactions(transactions.slice(0, 10));
        } catch (error) {
            console.error('Error cargando transacciones recientes:', error);
        } finally {
            setLoadingRecent(false);
        }
    };

    // Cargar inventarios y presupuestos en tiempo real
    useEffect(() => {
        const qInventarios = query(collection(db, 'inventarios'), orderBy('month', 'desc'));
        const unsubInventarios = onSnapshot(qInventarios, (snap) => {
            setInventarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const qPresupuestos = query(collection(db, 'presupuestos'), orderBy('month', 'desc'));
        const unsubPresupuestos = onSnapshot(qPresupuestos, (snap) => {
            setPresupuestos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubInventarios();
            unsubPresupuestos();
        };
    }, []);

    // Cuentas filtradas para transacciones
    const filteredAccounts = useMemo(() => {
        if (transactionType === 'ingreso') {
            return accounts.filter(a => a.type === 'INGRESO' && !a.isGroup);
        } else {
            return accounts.filter(a => (a.type === 'GASTO' || a.type === 'COSTO') && !a.isGroup);
        }
    }, [accounts, transactionType]);

    const allBankAccounts = useMemo(() => {
        return accounts.filter(a => {
            if (a.type !== 'ACTIVO' || a.isGroup) return false;
            const isBankByCode = a.code && (a.code.startsWith('1.01.02') || a.code.startsWith('1.01.03'));
            const isBankBySubType = a.subType && (a.subType.toLowerCase().includes('banco') || a.subType.toLowerCase().includes('cuenta_bancaria'));
            const isBankByName = a.name && (a.name.toLowerCase().includes('banco') || a.name.toLowerCase().includes('banpro') || a.name.toLowerCase().includes('bac') || a.name.toLowerCase().includes('lafise'));
            return isBankByCode || isBankBySubType || isBankByName;
        });
    }, [accounts]);

    const bankAccounts = useMemo(() => {
        return allBankAccounts.filter(a => a.currency === selectedCurrency);
    }, [allBankAccounts, selectedCurrency]);

    useEffect(() => {
        setTransForm(prev => ({ ...prev, bankAccountId: '' }));
    }, [selectedCurrency]);

    // Detectar si la cuenta seleccionada es Costo de Ventas (5.01) y bloquear sucursal
    const isCostoVentas = useMemo(() => {
        if (!transForm.cuentaContableId) return false;
        const cuenta = accounts.find(a => a.id === transForm.cuentaContableId);
        return cuenta && cuenta.code && cuenta.code.startsWith('5.01');
    }, [transForm.cuentaContableId, accounts]);

    // Cuando se selecciona cuenta de costo de ventas, limpiar sucursal (es general)
    useEffect(() => {
        if (isCostoVentas && transForm.sucursal) {
            setTransForm(prev => ({ ...prev, sucursal: '' }));
        }
    }, [isCostoVentas]);

    // ========== HANDLERS TRANSACCIONES ==========
    const handleTransChange = (e) => {
        const { name, value } = e.target;
        setTransForm(prev => ({ ...prev, [name]: value }));
    };

    const validateTransForm = () => {
        if (!transForm.amount || parseFloat(transForm.amount) <= 0) {
            alert('El monto debe ser mayor a 0');
            return false;
        }
        if (!transForm.sucursal && !isCostoVentas) {
            alert('Debe seleccionar una sucursal');
            return false;
        }
        if (!transForm.cuentaContableId) {
            alert('Debe seleccionar una cuenta contable');
            return false;
        }
        if (!transForm.bankAccountId) {
            alert('Debe seleccionar una cuenta bancaria');
            return false;
        }
        if (!transForm.description) {
            alert('Debe ingresar una descripcion');
            return false;
        }
        return true;
    };

    const handleSubmitTrans = async (e) => {
        e.preventDefault();
        
        if (!validateTransForm()) return;
        
        setSavingTrans(true);
        
        try {
            const amount = parseFloat(transForm.amount);
            const collectionName = transactionType === 'ingreso' ? 'ingresos' : 'gastos';
            
            const cuentaContable = accounts.find(a => a.id === transForm.cuentaContableId);
            const bankAccount = accounts.find(a => a.id === transForm.bankAccountId);
            
            if (!cuentaContable || !bankAccount) {
                throw new Error('Cuenta contable o bancaria no encontrada');
            }
            
            // 1. Crear transacción principal
            const sucursalData = isCostoVentas 
                ? { name: 'GENERAL', code: 'GEN' } 
                : branches.find(b => b.id === transForm.sucursal);
            const transactionData = {
                fecha: Timestamp.fromDate(new Date(transForm.date)),
                amount: amount,
                description: transForm.description,
                sucursal: isCostoVentas ? 'GENERAL' : transForm.sucursal,
                sucursalName: sucursalData?.name || (isCostoVentas ? 'GENERAL' : ''),
                sucursalCode: sucursalData?.code || (isCostoVentas ? 'GEN' : ''),
                isCostoVentas: isCostoVentas,
                cuentaContableId: transForm.cuentaContableId,
                cuentaContableName: cuentaContable.name,
                cuentaContableCode: cuentaContable.code,
                bankAccountId: transForm.bankAccountId,
                bankAccountName: bankAccount.name,
                bankAccountCode: bankAccount.code,
                paymentMethod: transForm.paymentMethod,
                reference: transForm.reference || '',
                cliente: transForm.cliente || '',
                proveedor: transForm.proveedor || '',
                facturaFolio: transForm.facturaFolio || '',
                notes: transForm.notes || '',
                currency: selectedCurrency,
                is_conciled: false,
                timestamp: Timestamp.now(),
                createdBy: currentUser?.email || 'system',
                userId: currentUser?.uid || null
            };
            
            const docRef = await addDoc(collection(db, collectionName), transactionData);
            
            // 2. CORRECCIÓN CONTABLE: Determinar tipos correctos
            const isIngreso = transactionType === 'ingreso';
            
            // Movimiento para cuenta contable (Ingreso o Gasto)
            const tipoCuentaContable = isIngreso ? 'CREDITO' : 'DEBITO';
            
            // Movimiento para cuenta bancaria (Activo)
            const tipoBanco = isIngreso ? 'DEBITO' : 'CREDITO';
            
            // 3. Crear movimiento contable para CUENTA CONTABLE (Ingreso/Gasto)
            const movimientoCuentaData = {
                fecha: transForm.date,
                monto: amount,
                descripcion: `${isIngreso ? 'Ingreso' : 'Gasto'}: ${transForm.description}`,
                type: tipoCuentaContable,
                accountId: transForm.cuentaContableId,
                accountName: cuentaContable.name,
                accountCode: cuentaContable.code,
                sucursal: isCostoVentas ? 'GENERAL' : transForm.sucursal,
                sucursalName: sucursalData?.name || (isCostoVentas ? 'GENERAL' : ''),
                sucursalCode: sucursalData?.code || (isCostoVentas ? 'GEN' : ''),
                isCostoVentas: isCostoVentas,
                documentoId: docRef.id,
                documentoTipo: transactionType,
                moduloOrigen: 'DataEntry',
                userEmail: currentUser?.email || 'system',
                timestamp: Timestamp.now(),
                currency: selectedCurrency
            };
            
            await addDoc(collection(db, 'movimientosContables'), movimientoCuentaData);
            
            // 4. Crear movimiento contable para BANCO (Activo)
            const movimientoBancoData = {
                fecha: transForm.date,
                monto: amount,
                descripcion: `${isIngreso ? 'Deposito en' : 'Pago desde'} ${bankAccount.name}: ${transForm.description}`,
                type: tipoBanco,
                accountId: transForm.bankAccountId,
                accountName: bankAccount.name,
                accountCode: bankAccount.code,
                sucursal: isCostoVentas ? 'GENERAL' : transForm.sucursal,
                sucursalName: sucursalData?.name || (isCostoVentas ? 'GENERAL' : ''),
                sucursalCode: sucursalData?.code || (isCostoVentas ? 'GEN' : ''),
                isCostoVentas: isCostoVentas,
                documentoId: docRef.id,
                documentoTipo: transactionType,
                moduloOrigen: 'DataEntry',
                userEmail: currentUser?.email || 'system',
                timestamp: Timestamp.now(),
                currency: selectedCurrency
            };
            
            await addDoc(collection(db, 'movimientosContables'), movimientoBancoData);
            
            // 5. Actualizar saldo de CUENTA BANCARIA (Activo)
            const bankRef = doc(db, 'planCuentas', transForm.bankAccountId);
            const bankSnap = await getDoc(bankRef);
            if (bankSnap.exists()) {
                const currentBalance = bankSnap.data().balance || 0;
                const newBalance = isIngreso ? currentBalance + amount : currentBalance - amount;
                await updateDoc(bankRef, { balance: newBalance });
            }
            
            // 6. Actualizar saldo de CUENTA CONTABLE (Ingreso/Gasto)
            const cuentaRef = doc(db, 'planCuentas', transForm.cuentaContableId);
            const cuentaSnap = await getDoc(cuentaRef);
            if (cuentaSnap.exists()) {
                const currentBalance = cuentaSnap.data().balance || 0;
                let newBalance;
                
                if (isIngreso) {
                    newBalance = currentBalance + amount;
                } else {
                    newBalance = currentBalance + amount;
                }
                
                await updateDoc(cuentaRef, { balance: newBalance });
            }
            
            alert(`${isIngreso ? 'Ingreso' : 'Gasto'} registrado exitosamente`);
            
            setTransForm({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                description: '',
                sucursal: '',
                cuentaContableId: '',
                bankAccountId: '',
                paymentMethod: 'efectivo',
                reference: '',
                cliente: '',
                proveedor: '',
                facturaFolio: '',
                notes: ''
            });
            
            loadRecentTransactions();
            
            if (refreshAccounts) refreshAccounts();
            
        } catch (error) {
            console.error('Error guardando transaccion:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setSavingTrans(false);
        }
    };

    // ========== HANDLERS INVENTARIO ==========
    const handleInvChange = (e) => {
        const { name, value } = e.target;
        setInvForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveInventario = async (e) => {
        e.preventDefault();
        
        if (!invForm.sucursal || !invForm.amount || parseFloat(invForm.amount) <= 0) {
            alert('Complete todos los campos correctamente');
            return;
        }

        setSavingInv(true);
        try {
            const existing = inventarios.find(
                i => i.month === invForm.month && 
                     i.sucursal === invForm.sucursal && 
                     i.type === invForm.type
            );

            if (existing) {
                if (!window.confirm(`Ya existe un inventario ${invForm.type} para ${getBranchName(invForm.sucursal)} en ${invForm.month}. ¿Desea reemplazarlo?`)) {
                    setSavingInv(false);
                    return;
                }
                await deleteDoc(doc(db, 'inventarios', existing.id));
            }

            await addDoc(collection(db, 'inventarios'), {
                month: invForm.month,
                sucursal: invForm.sucursal,
                type: invForm.type,
                amount: parseFloat(invForm.amount),
                timestamp: Timestamp.now()
            });

            alert(`Inventario ${invForm.type} guardado exitosamente`);
            setInvForm(prev => ({ ...prev, amount: '' }));
        } catch (error) {
            console.error('Error guardando inventario:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setSavingInv(false);
        }
    };

    const handleDeleteInventario = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este registro de inventario?')) return;
        
        try {
            await deleteDoc(doc(db, 'inventarios', id));
            alert('Inventario eliminado');
        } catch (error) {
            console.error('Error eliminando inventario:', error);
            alert('Error al eliminar');
        }
    };

    // ========== HANDLERS PRESUPUESTO ==========
    const handlePresChange = (e) => {
        const { name, value } = e.target;
        setPresForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSavePresupuesto = async (e) => {
        e.preventDefault();
        
        if (!presForm.category || !presForm.amount || parseFloat(presForm.amount) <= 0) {
            alert('Complete todos los campos correctamente');
            return;
        }

        setSavingPres(true);
        try {
            const existing = presupuestos.find(
                p => p.month === presForm.month && p.category === presForm.category
            );

            if (existing) {
                if (!window.confirm(`Ya existe un presupuesto para ${presForm.category} en ${presForm.month}. ¿Desea reemplazarlo?`)) {
                    setSavingPres(false);
                    return;
                }
                await deleteDoc(doc(db, 'presupuestos', existing.id));
            }

            await addDoc(collection(db, 'presupuestos'), {
                month: presForm.month,
                category: presForm.category,
                amount: parseFloat(presForm.amount),
                timestamp: Timestamp.now()
            });

            alert('Presupuesto guardado exitosamente');
            setPresForm(prev => ({ ...prev, amount: '' }));
        } catch (error) {
            console.error('Error guardando presupuesto:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setSavingPres(false);
        }
    };

    const handleDeletePresupuesto = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este presupuesto?')) return;
        
        try {
            await deleteDoc(doc(db, 'presupuestos', id));
            alert('Presupuesto eliminado');
        } catch (error) {
            console.error('Error eliminando presupuesto:', error);
            alert('Error al eliminar');
        }
    };

    // Agrupar datos
    const inventariosByMonth = inventarios.reduce((acc, item) => {
        if (!acc[item.month]) acc[item.month] = [];
        acc[item.month].push(item);
        return acc;
    }, {});

    const presupuestosByMonth = presupuestos.reduce((acc, item) => {
        if (!acc[item.month]) acc[item.month] = [];
        acc[item.month].push(item);
        return acc;
    }, {});

    const getCurrencySymbol = (code) => CURRENCIES.find(c => c.code === code)?.symbol || code;
    const getAccountById = (id) => accounts.find(a => a.id === id);

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
                                Entrada de <span className="text-blue-600">Datos</span>
                            </h1>
                            <p className="text-slate-500">Registra ingresos, gastos, inventarios y presupuestos</p>
                        </div>
                    </div>
                </FadeIn>

                {/* Main Tabs */}
                <FadeIn delay={100} className="mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setMainTab('transacciones')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                                    mainTab === 'transacciones' 
                                        ? 'bg-blue-600 text-white shadow-lg' 
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Icon path={Icons.wallet} className="w-4 h-4" />
                                Ingresos / Gastos
                            </button>
                            <button
                                onClick={() => setMainTab('inventario')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                                    mainTab === 'inventario' 
                                        ? 'bg-emerald-600 text-white shadow-lg' 
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Icon path={Icons.inventory} className="w-4 h-4" />
                                Inventario
                            </button>
                            <button
                                onClick={() => setMainTab('presupuestos')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                                    mainTab === 'presupuestos' 
                                        ? 'bg-purple-600 text-white shadow-lg' 
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Icon path={Icons.budget} className="w-4 h-4" />
                                Presupuestos
                            </button>
                        </div>
                    </div>
                </FadeIn>

                {/* ========== TAB: TRANSACCIONES (Ingresos/Gastos) ========== */}
                {mainTab === 'transacciones' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulario */}
                        <div className="lg:col-span-2">
                            <FadeIn delay={100}>
                                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                    <div className="flex border-b border-slate-200">
                                        {TRANSACTION_TYPES.map(type => (
                                            <button
                                                key={type.value}
                                                onClick={() => setTransactionType(type.value)}
                                                className={`flex-1 px-4 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                                                    transactionType === type.value 
                                                        ? type.value === 'ingreso' 
                                                            ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' 
                                                            : 'bg-rose-50 text-rose-700 border-b-2 border-rose-500'
                                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                }`}
                                            >
                                                <Icon path={Icons[type.icon]} className="w-5 h-5" />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>

                                    <form onSubmit={handleSubmitTrans} className="p-6 space-y-6">
                                        {/* Selector de Moneda */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Moneda *</label>
                                            <div className="flex gap-2">
                                                {CURRENCIES.map(curr => (
                                                    <button
                                                        key={curr.code}
                                                        type="button"
                                                        onClick={() => setSelectedCurrency(curr.code)}
                                                        className={`flex-1 px-4 py-3 rounded-lg border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                            selectedCurrency === curr.code
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <Icon path={Icons.currency} className="w-5 h-5" />
                                                        {curr.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fecha, Monto y Sucursal */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500">Fecha *</label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={transForm.date}
                                                    onChange={handleTransChange}
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500">Monto ({getCurrencySymbol(selectedCurrency)}) *</label>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={transForm.amount}
                                                    onChange={handleTransChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0.01"
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500">
                                                    <Icon path={Icons.building} className="w-3 h-3 inline mr-1" />
                                                    {isCostoVentas ? 'Sucursal (General)' : 'Sucursal *'}
                                                </label>
                                                {isCostoVentas ? (
                                                    <div className="w-full mt-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-semibold text-amber-700">
                                                        <Icon path={Icons.info} className="w-4 h-4 inline mr-1" />
                                                        GENERAL - Costo de Ventas
                                                    </div>
                                                ) : (
                                                    <select
                                                        name="sucursal"
                                                        value={transForm.sucursal}
                                                        onChange={handleTransChange}
                                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                        required
                                                    >
                                                        <option value="">Seleccionar sucursal...</option>
                                                        {branches.map(branch => (
                                                            <option key={branch.id} value={branch.id}>
                                                                {branch.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cuenta Contable */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500">
                                                {transactionType === 'ingreso' ? 'Cuenta de Ingreso' : 'Cuenta de Gasto'} *
                                            </label>
                                            <select
                                                name="cuentaContableId"
                                                value={transForm.cuentaContableId}
                                                onChange={handleTransChange}
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                required
                                            >
                                                <option value="">Seleccionar cuenta contable...</option>
                                                {filteredAccounts.map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.code} - {account.name} ({account.currency === 'USD' ? '$' : 'C$'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Cuenta Bancaria */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500">
                                                {transactionType === 'ingreso' 
                                                    ? `Cuenta Bancaria de Destino (${selectedCurrency === 'USD' ? 'Dólares' : 'Córdobas'})` 
                                                    : `Cuenta Bancaria de Origen (${selectedCurrency === 'USD' ? 'Dólares' : 'Córdobas'})`} *
                                            </label>
                                            <div className="relative">
                                                <Icon path={Icons.bank} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <select
                                                    name="bankAccountId"
                                                    value={transForm.bankAccountId}
                                                    onChange={handleTransChange}
                                                    className="w-full mt-1 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                    required
                                                >
                                                    <option value="">
                                                        {bankAccounts.length === 0 
                                                            ? `No hay bancos en ${selectedCurrency === 'USD' ? 'dólares' : 'córdobas'}...`
                                                            : `Seleccionar cuenta bancaria...`
                                                        }
                                                    </option>
                                                    {bankAccounts.map(account => (
                                                        <option key={account.id} value={account.id}>
                                                            {account.code} - {account.name} (Saldo: {getCurrencySymbol(selectedCurrency)} {fmt(account.balance || 0)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            {bankAccounts.length === 0 ? (
                                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <p className="text-sm text-amber-700 flex items-center gap-2">
                                                        <Icon path={Icons.alert} className="w-4 h-4" />
                                                        No hay cuentas bancarias en {selectedCurrency === 'USD' ? 'dólares' : 'córdobas'} configuradas.
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {bankAccounts.length} cuenta(s) bancaria(s) disponible(s) en {selectedCurrency === 'USD' ? 'dólares' : 'córdobas'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Metodo de Pago */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500">Metodo de Pago *</label>
                                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-1">
                                                {PAYMENT_METHODS.map(method => (
                                                    <button
                                                        key={method.value}
                                                        type="button"
                                                        onClick={() => setTransForm(prev => ({ ...prev, paymentMethod: method.value }))}
                                                        className={`p-3 rounded-lg border text-center transition-all ${
                                                            transForm.paymentMethod === method.value
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <Icon path={Icons[method.icon]} className="w-5 h-5 mx-auto mb-1" />
                                                        <span className="text-xs font-semibold">{method.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Descripcion */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500">Descripcion *</label>
                                            <textarea
                                                name="description"
                                                value={transForm.description}
                                                onChange={handleTransChange}
                                                placeholder={`Describe el ${transactionType === 'ingreso' ? 'ingreso' : 'gasto'}...`}
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                rows="2"
                                                required
                                            />
                                        </div>

                                        {/* Campos adicionales */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {transactionType === 'ingreso' ? (
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-slate-500">Cliente</label>
                                                    <input
                                                        type="text"
                                                        name="cliente"
                                                        value={transForm.cliente}
                                                        onChange={handleTransChange}
                                                        placeholder="Nombre del cliente"
                                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-slate-500">Proveedor</label>
                                                    <input
                                                        type="text"
                                                        name="proveedor"
                                                        value={transForm.proveedor}
                                                        onChange={handleTransChange}
                                                        placeholder="Nombre del proveedor"
                                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500">Referencia / Folio</label>
                                                <input
                                                    type="text"
                                                    name="reference"
                                                    value={transForm.reference}
                                                    onChange={handleTransChange}
                                                    placeholder="Numero de factura, referencia, etc."
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Notas */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500">Notas Adicionales</label>
                                            <textarea
                                                name="notes"
                                                value={transForm.notes}
                                                onChange={handleTransChange}
                                                placeholder="Notas o comentarios adicionales..."
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                                                rows="2"
                                            />
                                        </div>

                                        {/* Botones */}
                                        <div className="flex gap-3 pt-4">
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                onClick={() => {
                                                    setTransForm({
                                                        date: new Date().toISOString().split('T')[0],
                                                        amount: '',
                                                        description: '',
                                                        sucursal: '',
                                                        cuentaContableId: '',
                                                        bankAccountId: '',
                                                        paymentMethod: 'efectivo',
                                                        reference: '',
                                                        cliente: '',
                                                        proveedor: '',
                                                        facturaFolio: '',
                                                        notes: ''
                                                    });
                                                    setSelectedCurrency('NIO');
                                                }}
                                                className="flex-1"
                                            >
                                                Limpiar
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                variant={transactionType === 'ingreso' ? 'success' : 'danger'} 
                                                disabled={savingTrans || bankAccounts.length === 0} 
                                                className="flex-1"
                                            >
                                                <Icon path={Icons.save} className="w-5 h-5 mr-2" />
                                                {savingTrans ? 'Guardando...' : `Guardar ${transactionType === 'ingreso' ? 'Ingreso' : 'Gasto'}`}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Transacciones Recientes */}
                        <div className="lg:col-span-1">
                            <FadeIn delay={150}>
                                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-slate-800">
                                            {transactionType === 'ingreso' ? 'Ingresos' : 'Gastos'} Recientes
                                        </h3>
                                        <Badge variant={selectedCurrency === 'USD' ? 'info' : 'default'}>
                                            {selectedCurrency === 'USD' ? '$ USD' : 'C$ NIO'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="p-4 max-h-[600px] overflow-y-auto">
                                        {loadingRecent ? (
                                            <div className="text-center py-8">
                                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                            </div>
                                        ) : recentTransactions.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <Icon path={Icons.fileText} className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                                <p className="text-sm">No hay transacciones recientes en {selectedCurrency === 'USD' ? 'dólares' : 'córdobas'}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {recentTransactions.map(tx => (
                                                    <div 
                                                        key={tx.id} 
                                                        className={`p-3 rounded-lg border ${
                                                            transactionType === 'ingreso' 
                                                                ? 'bg-emerald-50 border-emerald-100' 
                                                                : 'bg-rose-50 border-rose-100'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-xs text-slate-500">
                                                                {tx.date?.toLocaleDateString?.('es-ES') || transForm.date}
                                                            </span>
                                                            <span className={`font-bold ${
                                                                transactionType === 'ingreso' ? 'text-emerald-700' : 'text-rose-700'
                                                            }`}>
                                                                {getCurrencySymbol(tx.currency || 'NIO')} {fmt(tx.amount)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                                            {tx.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                            <Icon path={Icons.bank} className="w-3 h-3" />
                                                            <span className="truncate">{tx.bankAccountName || 'Cuenta bancaria'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                )}

                {/* ========== TAB: INVENTARIO ========== */}
                {mainTab === 'inventario' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Formulario de Inventario */}
                        <FadeIn delay={200}>
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Icon path={Icons.box} className="w-5 h-5 text-emerald-600" />
                                        Registrar Inventario
                                    </h3>
                                </div>
                                
                                <form onSubmit={handleSaveInventario} className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            <Icon path={Icons.calendar} className="w-4 h-4 inline mr-1" />
                                            Mes *
                                        </label>
                                        <input
                                            type="month"
                                            name="month"
                                            value={invForm.month}
                                            onChange={handleInvChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-emerald-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            <Icon path={Icons.building} className="w-4 h-4 inline mr-1" />
                                            Sucursal *
                                        </label>
                                        <select
                                            name="sucursal"
                                            value={invForm.sucursal}
                                            onChange={handleInvChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-emerald-500 outline-none"
                                            required
                                        >
                                            <option value="">Seleccionar sucursal...</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Tipo de Inventario *</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setInvForm(prev => ({ ...prev, type: 'inicial' }))}
                                                className={`p-4 rounded-xl border-2 text-center transition-all ${
                                                    invForm.type === 'inicial'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <Icon path={Icons.initial} className="w-6 h-6 mx-auto mb-2" />
                                                <span className="font-bold text-sm">Inicial</span>
                                                <p className="text-xs mt-1 opacity-70">Inicio del período</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInvForm(prev => ({ ...prev, type: 'final' }))}
                                                className={`p-4 rounded-xl border-2 text-center transition-all ${
                                                    invForm.type === 'final'
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <Icon path={Icons.final} className="w-6 h-6 mx-auto mb-2" />
                                                <span className="font-bold text-sm">Final</span>
                                                <p className="text-xs mt-1 opacity-70">Cierre del período</p>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            <Icon path={Icons.budget} className="w-4 h-4 inline mr-1" />
                                            Valor del Inventario (C$) *
                                        </label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={invForm.amount}
                                            onChange={handleInvChange}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-emerald-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        variant="success" 
                                        disabled={savingInv}
                                        className="w-full"
                                    >
                                        <Icon path={Icons.save} className="w-5 h-5 mr-2" />
                                        {savingInv ? 'Guardando...' : 'Guardar Inventario'}
                                    </Button>
                                </form>
                            </div>
                        </FadeIn>

                        {/* Lista de Inventarios */}
                        <FadeIn delay={300}>
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        Inventarios Registrados
                                    </h3>
                                    <Badge variant="info">{inventarios.length} registros</Badge>
                                </div>
                                
                                <div className="p-4 max-h-[600px] overflow-y-auto">
                                    {Object.keys(inventariosByMonth).length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <Icon path={Icons.box} className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                            <p className="text-sm">No hay inventarios registrados</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {Object.entries(inventariosByMonth)
                                                .sort(([a], [b]) => b.localeCompare(a))
                                                .map(([month, items]) => (
                                                <div key={month} className="border border-slate-200 rounded-xl overflow-hidden">
                                                    <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 text-sm">
                                                        {month}
                                                    </div>
                                                    <div className="divide-y divide-slate-100">
                                                        {items.map(item => (
                                                            <div 
                                                                key={item.id} 
                                                                className="p-4 flex items-center justify-between hover:bg-slate-50"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                                        item.type === 'inicial' 
                                                                            ? 'bg-blue-100 text-blue-600' 
                                                                            : 'bg-emerald-100 text-emerald-600'
                                                                    }`}>
                                                                        <Icon path={item.type === 'inicial' ? Icons.initial : Icons.final} className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-slate-800">
                                                                            {getBranchName(item.sucursal)}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500">
                                                                            Inventario {item.type === 'inicial' ? 'Inicial' : 'Final'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <div className="font-black text-slate-800">
                                                                            C$ {fmt(item.amount)}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDeleteInventario(item.id)}
                                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Icon path={Icons.trash} className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                )}

                {/* ========== TAB: PRESUPUESTOS ========== */}
                {mainTab === 'presupuestos' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Formulario de Presupuesto */}
                        <FadeIn delay={200}>
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-purple-50">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Icon path={Icons.budget} className="w-5 h-5 text-purple-600" />
                                        Registrar Presupuesto
                                    </h3>
                                </div>
                                
                                <form onSubmit={handleSavePresupuesto} className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            <Icon path={Icons.calendar} className="w-4 h-4 inline mr-1" />
                                            Mes *
                                        </label>
                                        <input
                                            type="month"
                                            name="month"
                                            value={presForm.month}
                                            onChange={handlePresChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-purple-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            <Icon path={Icons.tag} className="w-4 h-4 inline mr-1" />
                                            Categoría de Gasto *
                                        </label>
                                        <select
                                            name="category"
                                            value={presForm.category}
                                            onChange={handlePresChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-purple-500 outline-none"
                                            required
                                        >
                                            <option value="">Seleccionar categoría...</option>
                                            {EXPENSE_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                            <Icon path={Icons.budget} className="w-4 h-4 inline mr-1" />
                                            Monto Presupuestado (C$) *
                                        </label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={presForm.amount}
                                            onChange={handlePresChange}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:border-purple-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        variant="purple" 
                                        disabled={savingPres}
                                        className="w-full"
                                    >
                                        <Icon path={Icons.save} className="w-5 h-5 mr-2" />
                                        {savingPres ? 'Guardando...' : 'Guardar Presupuesto'}
                                    </Button>
                                </form>
                            </div>
                        </FadeIn>

                        {/* Lista de Presupuestos */}
                        <FadeIn delay={300}>
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        Presupuestos Registrados
                                    </h3>
                                    <Badge variant="purple">{presupuestos.length} registros</Badge>
                                </div>
                                
                                <div className="p-4 max-h-[600px] overflow-y-auto">
                                    {Object.keys(presupuestosByMonth).length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <Icon path={Icons.budget} className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                            <p className="text-sm">No hay presupuestos registrados</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {Object.entries(presupuestosByMonth)
                                                .sort(([a], [b]) => b.localeCompare(a))
                                                .map(([month, items]) => (
                                                <div key={month} className="border border-slate-200 rounded-xl overflow-hidden">
                                                    <div className="bg-purple-50 px-4 py-2 font-bold text-purple-800 text-sm flex justify-between">
                                                        <span>{month}</span>
                                                        <span>Total: C$ {fmt(items.reduce((sum, i) => sum + i.amount, 0))}</span>
                                                    </div>
                                                    <div className="divide-y divide-slate-100">
                                                        {items.map(item => (
                                                            <div 
                                                                key={item.id} 
                                                                className="p-4 flex items-center justify-between hover:bg-slate-50"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                                                        <Icon path={Icons.tag} className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-slate-800">
                                                                            {item.category}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <div className="font-black text-slate-800">
                                                                            C$ {fmt(item.amount)}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDeletePresupuesto(item.id)}
                                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Icon path={Icons.trash} className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                )}
            </div>
        </div>
    );
}
