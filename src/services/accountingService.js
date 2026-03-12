// src/services/accountingService.js
// Servicio centralizado para operaciones contables y financieras

import { db, storage } from '../firebase';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, 
    query, where, orderBy, getDocs, Timestamp, runTransaction, getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// PLAN DE CUENTAS - CONFIGURACIÓN BASE
// ============================================

export const ACCOUNT_TYPES = {
    ACTIVO: { id: 'ACTIVO', name: 'Activos', nature: 'deudora', icon: 'wallet' },
    PASIVO: { id: 'PASIVO', name: 'Pasivos', nature: 'acreedora', icon: 'creditCard' },
    CAPITAL: { id: 'CAPITAL', name: 'Capital/Patrimonio', nature: 'acreedora', icon: 'scale' },
    INGRESO: { id: 'INGRESO', name: 'Ingresos', nature: 'acreedora', icon: 'trendingUp' },
    COSTO: { id: 'COSTO', name: 'Costos', nature: 'deudora', icon: 'shoppingCart' },
    GASTO: { id: 'GASTO', name: 'Gastos', nature: 'deudora', icon: 'trendingDown' },
    ORDEN: { id: 'ORDEN', name: 'Cuentas de Orden', nature: 'deudora', icon: 'fileText' }
};

export const CURRENCIES = {
    NIO: { code: 'NIO', symbol: 'C$', name: 'Córdoba Nicaragüense' },
    USD: { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' }
};

// Plan de cuentas base predefinido para el negocio
export const DEFAULT_CHART_OF_ACCOUNTS = [
    // === ACTIVOS ===
    { code: '1.01', name: 'Activos Corrientes', type: 'ACTIVO', subType: 'corriente', isGroup: true },
    { code: '1.01.01', name: 'Efectivo y Equivalentes', type: 'ACTIVO', subType: 'corriente', isGroup: true, parentCode: '1.01' },
    
    // Cajas en C$
    { code: '1.01.01.01', name: 'Caja Granada 1 C$', type: 'ACTIVO', subType: 'caja', currency: 'NIO', parentCode: '1.01.01' },
    { code: '1.01.01.02', name: 'Caja Granada 2 C$', type: 'ACTIVO', subType: 'caja', currency: 'NIO', parentCode: '1.01.01' },
    { code: '1.01.01.03', name: 'Caja Ruta C$', type: 'ACTIVO', subType: 'caja', currency: 'NIO', parentCode: '1.01.01' },
    { code: '1.01.01.04', name: 'Caja Amparito C$', type: 'ACTIVO', subType: 'caja', currency: 'NIO', parentCode: '1.01.01' },
    
    // Cajas en USD
    { code: '1.01.01.10', name: 'Caja Granada 1 USD', type: 'ACTIVO', subType: 'caja', currency: 'USD', parentCode: '1.01.01' },
    { code: '1.01.01.11', name: 'Caja Granada 2 USD', type: 'ACTIVO', subType: 'caja', currency: 'USD', parentCode: '1.01.01' },
    { code: '1.01.01.12', name: 'Caja Ruta USD', type: 'ACTIVO', subType: 'caja', currency: 'USD', parentCode: '1.01.01' },
    { code: '1.01.01.13', name: 'Caja Amparito USD', type: 'ACTIVO', subType: 'caja', currency: 'USD', parentCode: '1.01.01' },
    
    // Efectivo en tránsito
    { code: '1.01.01.20', name: 'Efectivo en Tránsito C$', type: 'ACTIVO', subType: 'transito', currency: 'NIO', parentCode: '1.01.01' },
    { code: '1.01.01.21', name: 'Efectivo en Tránsito USD', type: 'ACTIVO', subType: 'transito', currency: 'USD', parentCode: '1.01.01' },
    
    // Bancos C$
    { code: '1.01.02', name: 'Bancos C$', type: 'ACTIVO', subType: 'banco', currency: 'NIO', isGroup: true, parentCode: '1.01' },
    { code: '1.01.02.01', name: 'BANPRO C$', type: 'ACTIVO', subType: 'banco', currency: 'NIO', parentCode: '1.01.02' },
    { code: '1.01.02.02', name: 'BAC C$', type: 'ACTIVO', subType: 'banco', currency: 'NIO', parentCode: '1.01.02' },
    { code: '1.01.02.03', name: 'LAFISE C$', type: 'ACTIVO', subType: 'banco', currency: 'NIO', parentCode: '1.01.02' },
    
    // Bancos USD
    { code: '1.01.03', name: 'Bancos USD', type: 'ACTIVO', subType: 'banco', currency: 'USD', isGroup: true, parentCode: '1.01' },
    { code: '1.01.03.01', name: 'BANPRO USD', type: 'ACTIVO', subType: 'banco', currency: 'USD', parentCode: '1.01.03' },
    { code: '1.01.03.02', name: 'BAC USD', type: 'ACTIVO', subType: 'banco', currency: 'USD', parentCode: '1.01.03' },
    { code: '1.01.03.03', name: 'LAFISE USD', type: 'ACTIVO', subType: 'banco', currency: 'USD', parentCode: '1.01.03' },
    
    // POS y Transferencias
    { code: '1.01.04', name: 'POS y Transferencias Pendientes', type: 'ACTIVO', subType: 'por_cobrar', isGroup: true, parentCode: '1.01' },
    { code: '1.01.04.01', name: 'POS BAC', type: 'ACTIVO', subType: 'pos', currency: 'NIO', parentCode: '1.01.04' },
    { code: '1.01.04.02', name: 'POS BANPRO', type: 'ACTIVO', subType: 'pos', currency: 'NIO', parentCode: '1.01.04' },
    { code: '1.01.04.03', name: 'POS LAFISE', type: 'ACTIVO', subType: 'pos', currency: 'NIO', parentCode: '1.01.04' },
    { code: '1.01.04.10', name: 'Transferencias BAC', type: 'ACTIVO', subType: 'transferencia', currency: 'NIO', parentCode: '1.01.04' },
    { code: '1.01.04.11', name: 'Transferencias BANPRO', type: 'ACTIVO', subType: 'transferencia', currency: 'NIO', parentCode: '1.01.04' },
    { code: '1.01.04.12', name: 'Transferencias LAFISE', type: 'ACTIVO', subType: 'transferencia', currency: 'NIO', parentCode: '1.01.04' },
    
    // Cuentas por Cobrar
    { code: '1.01.05', name: 'Cuentas por Cobrar', type: 'ACTIVO', subType: 'por_cobrar', isGroup: true, parentCode: '1.01' },
    { code: '1.01.05.01', name: 'Clientes', type: 'ACTIVO', subType: 'por_cobrar', currency: 'NIO', parentCode: '1.01.05' },
    
    // === CRÉDITOS Y ABONOS (NUEVO) ===
    { code: '1.01.07', name: 'Créditos a Clientes', type: 'ACTIVO', subType: 'credito', isGroup: true, parentCode: '1.01' },
    { code: '1.01.07.01', name: 'Facturas de Crédito C$', type: 'ACTIVO', subType: 'credito', currency: 'NIO', parentCode: '1.01.07' },
    { code: '1.01.07.02', name: 'Facturas de Crédito USD', type: 'ACTIVO', subType: 'credito', currency: 'USD', parentCode: '1.01.07' },
    
    { code: '1.01.08', name: 'Abonos de Clientes', type: 'ACTIVO', subType: 'abono', isGroup: true, parentCode: '1.01' },
    { code: '1.01.08.01', name: 'Abonos Recibidos C$', type: 'ACTIVO', subType: 'abono', currency: 'NIO', parentCode: '1.01.08' },
    { code: '1.01.08.02', name: 'Abonos Recibidos USD', type: 'ACTIVO', subType: 'abono', currency: 'USD', parentCode: '1.01.08' },
    
    // Inventarios
    { code: '1.01.06', name: 'Inventarios', type: 'ACTIVO', subType: 'inventario', isGroup: true, parentCode: '1.01' },
    { code: '1.01.06.01', name: 'Inventario de Mercancía', type: 'ACTIVO', subType: 'inventario', currency: 'NIO', parentCode: '1.01.06' },
    
    // === PASIVOS ===
    { code: '2.01', name: 'Pasivos Corrientes', type: 'PASIVO', subType: 'corriente', isGroup: true },
    { code: '2.01.01', name: 'Cuentas por Pagar', type: 'PASIVO', subType: 'por_pagar', isGroup: true, parentCode: '2.01' },
    { code: '2.01.01.01', name: 'Proveedores', type: 'PASIVO', subType: 'por_pagar', currency: 'NIO', parentCode: '2.01.01' },
    { code: '2.01.02', name: 'Obligaciones Laborales', type: 'PASIVO', subType: 'laboral', isGroup: true, parentCode: '2.01' },
    { code: '2.01.02.01', name: 'Sueldos por Pagar', type: 'PASIVO', subType: 'laboral', currency: 'NIO', parentCode: '2.01.02' },
    { code: '2.01.03', name: 'Impuestos por Pagar', type: 'PASIVO', subType: 'impuestos', isGroup: true, parentCode: '2.01' },
    { code: '2.01.03.01', name: 'IR Retenido', type: 'PASIVO', subType: 'impuestos', currency: 'NIO', parentCode: '2.01.03' },
    { code: '2.01.03.02', name: 'Alcaldía Retenida', type: 'PASIVO', subType: 'impuestos', currency: 'NIO', parentCode: '2.01.03' },
    
    // === CAPITAL ===
    { code: '3.01', name: 'Patrimonio', type: 'CAPITAL', subType: 'patrimonio', isGroup: true },
    { code: '3.01.01', name: 'Capital Social', type: 'CAPITAL', subType: 'capital', currency: 'NIO', parentCode: '3.01' },
    { code: '3.01.02', name: 'Utilidades Retenidas', type: 'CAPITAL', subType: 'utilidades', currency: 'NIO', parentCode: '3.01' },
    
    // === INGRESOS ===
    { code: '4.01', name: 'Ingresos Operacionales', type: 'INGRESO', subType: 'operacional', isGroup: true },
    { code: '4.01.01', name: 'Ventas', type: 'INGRESO', subType: 'ventas', currency: 'NIO', parentCode: '4.01' },
    { code: '4.01.02', name: 'Ventas al Crédito', type: 'INGRESO', subType: 'ventas', currency: 'NIO', parentCode: '4.01' },
    
    // === COSTOS ===
    { code: '5.01', name: 'Costos de Ventas', type: 'COSTO', subType: 'costo_venta', isGroup: true },
    { code: '5.01.01', name: 'Costo de Mercancía Vendida', type: 'COSTO', subType: 'costo_venta', currency: 'NIO', parentCode: '5.01' },
    
    // === GASTOS ===
    { code: '6.01', name: 'Gastos Operacionales', type: 'GASTO', subType: 'operacional', isGroup: true },
    { code: '6.01.01', name: 'Gastos de Ventas', type: 'GASTO', subType: 'ventas', isGroup: true, parentCode: '6.01' },
    { code: '6.01.01.01', name: 'Sueldos y Salarios Ventas', type: 'GASTO', subType: 'ventas', currency: 'NIO', parentCode: '6.01.01' },
    { code: '6.01.02', name: 'Gastos Administrativos', type: 'GASTO', subType: 'admin', isGroup: true, parentCode: '6.01' },
    { code: '6.01.02.01', name: 'Alquiler', type: 'GASTO', subType: 'admin', currency: 'NIO', parentCode: '6.01.02' },
    { code: '6.01.02.02', name: 'Servicios Públicos', type: 'GASTO', subType: 'admin', currency: 'NIO', parentCode: '6.01.02' },
    { code: '6.01.02.03', name: 'Sueldos Administrativos', type: 'GASTO', subType: 'admin', currency: 'NIO', parentCode: '6.01.02' },
    { code: '6.01.02.04', name: 'Mantenimiento', type: 'GASTO', subType: 'admin', currency: 'NIO', parentCode: '6.01.02' },
    { code: '6.01.02.05', name: 'Marketing y Publicidad', type: 'GASTO', subType: 'admin', currency: 'NIO', parentCode: '6.01.02' },
    { code: '6.01.02.99', name: 'Otros Gastos Admin', type: 'GASTO', subType: 'admin', currency: 'NIO', parentCode: '6.01.02' },
    
    // Diferencias de caja
    { code: '6.01.03', name: 'Diferencias de Caja', type: 'GASTO', subType: 'diferencia', currency: 'NIO', parentCode: '6.01' },
];

// ============================================
// FUNCIONES DEL SERVICIO
// ============================================

/**
 * Inicializa el plan de cuentas base en Firestore
 * Solo crea cuentas que no existan
 */
export const initializeChartOfAccounts = async () => {
    const accountsRef = collection(db, 'planCuentas');
    const snapshot = await getDocs(accountsRef);
    const existingCodes = new Set(snapshot.docs.map(d => d.data().code));
    
    const batch = [];
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
        if (!existingCodes.has(account.code)) {
            batch.push(addDoc(accountsRef, {
                ...account,
                balance: 0,
                balanceUSD: 0,
                isActive: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            }));
        }
    }
    
    await Promise.all(batch);
    return batch.length;
};

/**
 * Crea una nueva cuenta en el plan de cuentas
 */
export const createAccount = async (accountData) => {
    const accountsRef = collection(db, 'planCuentas');
    
    // Verificar que no exista el código
    const q = query(accountsRef, where('code', '==', accountData.code));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        throw new Error(`Ya existe una cuenta con el código ${accountData.code}`);
    }
    
    const newAccount = {
        ...accountData,
        balance: 0,
        balanceUSD: 0,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(accountsRef, newAccount);
    return { id: docRef.id, ...newAccount };
};

/**
 * Actualiza una cuenta existente
 */
export const updateAccount = async (accountId, updates) => {
    const accountRef = doc(db, 'planCuentas', accountId);
    await updateDoc(accountRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
};

/**
 * Obtiene todas las cuentas activas
 */
export const getAllAccounts = async () => {
    const accountsRef = collection(db, 'planCuentas');
    const q = query(accountsRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Obtiene cuentas por tipo
 */
export const getAccountsByType = async (type) => {
    const accountsRef = collection(db, 'planCuentas');
    const q = query(
        accountsRef, 
        where('type', '==', type),
        where('isActive', '==', true),
        where('isGroup', '!=', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Obtiene cuentas de caja (para cierres y depósitos)
 */
export const getCashAccounts = async () => {
    const accountsRef = collection(db, 'planCuentas');
    const q = query(
        accountsRef,
        where('subType', 'in', ['caja', 'transito', 'banco']),
        where('isActive', '==', true),
        where('isGroup', '!=', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ============================================
// MOVIMIENTOS CONTABLES
// ============================================

/**
 * Registra un movimiento en una cuenta
 * Esta es la función base para todos los movimientos
 */
export const registerMovement = async (movementData) => {
    const {
        accountId,
        accountCode,
        type, // 'debit' o 'credit'
        amount,
        amountUSD = 0,
        description,
        reference,
        referenceId,
        referenceType, // 'cierreCaja', 'depositoTransito', 'depositoBanco', 'gasto', etc.
        date,
        userId,
        userEmail,
        metadata = {}
    } = movementData;
    
    const movementsRef = collection(db, 'movimientosCuentas');
    
    const movement = {
        accountId,
        accountCode,
        type,
        amount: Number(amount),
        amountUSD: Number(amountUSD),
        description,
        reference,
        referenceId,
        referenceType,
        date: date || new Date().toISOString().substring(0, 10),
        timestamp: Timestamp.now(),
        userId,
        userEmail,
        metadata
    };
    
    const docRef = await addDoc(movementsRef, movement);
    
    // Actualizar saldo de la cuenta
    await updateAccountBalance(accountId, type, amount, amountUSD);
    
    return { id: docRef.id, ...movement };
};

/**
 * Actualiza el saldo de una cuenta
 */
// REEMPLAZA la función actualizarSaldoCuenta con esta:

export const actualizarSaldoCuenta = async (cuentaId, tipoMovimiento, monto, montoUSD = 0) => {
  const cuentaRef = doc(db, 'planCuentas', cuentaId);
  const cuentaSnap = await getDoc(cuentaRef);

  if (!cuentaSnap.exists()) return;

  const cuenta = cuentaSnap.data();
  
  // FORZAR TODO A NÚMERO DE FORMA BRUTAL
  let balanceActual = parseFloat(cuenta.balance) || 0;
  let montoNum = parseFloat(monto) || 0;
  
  let nuevoBalance = balanceActual;
  
  if (tipoMovimiento === 'debit') {
    nuevoBalance = balanceActual + montoNum;
  } else if (tipoMovimiento === 'credit') {
    nuevoBalance = balanceActual - montoNum;
  }
  
  // Guardar sin toFixed primero para probar
  await updateDoc(cuentaRef, {
    balance: nuevoBalance,
    updatedAt: Timestamp.now()
  });
};

/**
 * Obtiene movimientos de una cuenta
 */
export const getAccountMovements = async (accountId, limitCount = 100) => {
    const movementsRef = collection(db, 'movimientosCuentas');
    const q = query(
        movementsRef,
        where('accountId', '==', accountId),
        orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Obtiene el historial completo de movimientos con filtros
 */
export const getMovements = async (filters = {}) => {
    const movementsRef = collection(db, 'movimientosCuentas');
    let q = query(movementsRef, orderBy('timestamp', 'desc'));
    
    if (filters.accountId) {
        q = query(q, where('accountId', '==', filters.accountId));
    }
    if (filters.referenceType) {
        q = query(q, where('referenceType', '==', filters.referenceType));
    }
    if (filters.dateFrom && filters.dateTo) {
        q = query(q, where('date', '>=', filters.dateFrom), where('date', '<=', filters.dateTo));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ============================================
// CIERRE DE CAJA
// ============================================

/**
 * Crea un nuevo cierre de caja
 */
export const createCierreCaja = async (cierreData) => {
    const {
        fecha,
        tienda,
        caja,
        cajero,
        horaApertura,
        horaCierre,
        observaciones,
        
        // Datos de SICAR
        totalVentas,
        totalTickets,
        totalFacturas,
        
        // Pagos recibidos
        efectivoCS,
        efectivoUSD,
        tipoCambio,
        posBAC,
        posBANPRO,
        posLAFISE,
        transferenciaBAC,
        transferenciaBANPRO,
        transferenciaLAFISE,
        
        // Facturas membretadas
        cantidadFacturasMembretadas,
        folioInicial,
        folioFinal,
        montoFacturasMembretadas,
        cantidadTickets,
        montoTickets,
        tieneFacturaResumen,
        
        // Retenciones
        retenciones,
        
        // Gastos de caja
        gastosCaja,
        
        // Conteo físico
        conteoFisico,
        
        // Usuario
        userId,
        userEmail
    } = cierreData;
    
    const cierresRef = collection(db, 'cierresCaja');
    
    const cierre = {
        // Identificación
        fecha,
        tienda,
        caja,
        cajero,
        horaApertura,
        horaCierre,
        observaciones: observaciones || '',
        
        // Datos SICAR
        totalVentas: Number(totalVentas) || 0,
        totalTickets: Number(totalTickets) || 0,
        totalFacturas: Number(totalFacturas) || 0,
        
        // Métodos de pago
        efectivoCS: Number(efectivoCS) || 0,
        efectivoUSD: Number(efectivoUSD) || 0,
        tipoCambio: Number(tipoCambio) || 0,
        posBAC: Number(posBAC) || 0,
        posBANPRO: Number(posBANPRO) || 0,
        posLAFISE: Number(posLAFISE) || 0,
        transferenciaBAC: Number(transferenciaBAC) || 0,
        transferenciaBANPRO: Number(transferenciaBANPRO) || 0,
        transferenciaLAFISE: Number(transferenciaLAFISE) || 0,
        
        // Facturas membretadas
        cantidadFacturasMembretadas: Number(cantidadFacturasMembretadas) || 0,
        folioInicial: folioInicial || '',
        folioFinal: folioFinal || '',
        montoFacturasMembretadas: Number(montoFacturasMembretadas) || 0,
        cantidadTickets: Number(cantidadTickets) || 0,
        montoTickets: Number(montoTickets) || 0,
        tieneFacturaResumen: !!tieneFacturaResumen,
        
        // Retenciones
        retenciones: retenciones || [],
        totalRetenciones: (retenciones || []).reduce((sum, r) => sum + (Number(r.monto) || 0), 0),
        
        // Gastos de caja
        gastosCaja: gastosCaja || [],
        totalGastosCaja: (gastosCaja || []).reduce((sum, g) => sum + (Number(g.monto) || 0), 0),
        
        // Conteo físico
        conteoFisico: {
            efectivoEsperadoCS: Number(conteoFisico?.efectivoEsperadoCS) || 0,
            efectivoContadoCS: Number(conteoFisico?.efectivoContadoCS) || 0,
            diferenciaCS: Number(conteoFisico?.diferenciaCS) || 0,
            efectivoEsperadoUSD: Number(conteoFisico?.efectivoEsperadoUSD) || 0,
            efectivoContadoUSD: Number(conteoFisico?.efectivoContadoUSD) || 0,
            diferenciaUSD: Number(conteoFisico?.diferenciaUSD) || 0,
            comentarioDiferencia: conteoFisico?.comentarioDiferencia || ''
        },
        
        // Estado y auditoría
        estado: 'borrador', // borrador, pendiente, revisado, cerrado
        createdAt: Timestamp.now(),
        createdBy: userId,
        createdByEmail: userEmail,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
        
        // Soportes (URLs de archivos adjuntos)
        soportes: []
    };
    
    const docRef = await addDoc(cierresRef, cierre);
    return { id: docRef.id, ...cierre };
};

/**
 * Actualiza el estado de un cierre de caja
 */
export const updateCierreCajaStatus = async (cierreId, newStatus, userId) => {
    const cierreRef = doc(db, 'cierresCaja', cierreId);
    
    const updates = {
        estado: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: userId
    };
    
    if (newStatus === 'revisado') {
        updates.revisadoAt = Timestamp.now();
        updates.revisadoBy = userId;
    }
    if (newStatus === 'cerrado') {
        updates.cerradoAt = Timestamp.now();
        updates.cerradoBy = userId;
    }
    
    await updateDoc(cierreRef, updates);
};

/**
 * Procesa un cierre de caja confirmado - Genera movimientos en cuentas
 */
export const procesarCierreCaja = async (cierreId, userId, userEmail) => {
    const cierreRef = doc(db, 'cierresCaja', cierreId);
    const cierreSnap = await getDoc(cierreRef);
    
    if (!cierreSnap.exists()) {
        throw new Error('Cierre de caja no encontrado');
    }
    
    const cierre = cierreSnap.data();
    
  
    
    if (cierre.procesado) {
        throw new Error('Este cierre ya fue procesado');
    }
    
    // Obtener cuentas necesarias
    const accountsRef = collection(db, 'planCuentas');
    const getAccountByCode = async (code) => {
        const q = query(accountsRef, where('code', '==', code));
        const snap = await getDocs(q);
        return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    };
    
    const movements = [];
    
    // 1. Registrar efectivo en caja C$
    if (cierre.efectivoCS > 0) {
        const cajaAccount = await getAccountByCode(getCajaCode(cierre.caja, 'NIO'));
        if (cajaAccount) {
            movements.push(registerMovement({
                accountId: cajaAccount.id,
                accountCode: cajaAccount.code,
                type: 'debit',
                amount: cierre.efectivoCS,
                description: `Efectivo C$ - Cierre ${cierre.caja} ${cierre.fecha}`,
                reference: `CIERRE-${cierreId}`,
                referenceId: cierreId,
                referenceType: 'cierreCaja',
                date: cierre.fecha,
                userId,
                userEmail,
                metadata: { caja: cierre.caja, tienda: cierre.tienda }
            }));
        }
    }
    
    // 2. Registrar efectivo en caja USD
    if (cierre.efectivoUSD > 0) {
        const cajaAccount = await getAccountByCode(getCajaCode(cierre.caja, 'USD'));
        if (cajaAccount) {
            movements.push(registerMovement({
                accountId: cajaAccount.id,
                accountCode: cajaAccount.code,
                type: 'debit',
                amount: 0,
                amountUSD: cierre.efectivoUSD,
                description: `Efectivo USD - Cierre ${cierre.caja} ${cierre.fecha}`,
                reference: `CIERRE-${cierreId}`,
                referenceId: cierreId,
                referenceType: 'cierreCaja',
                date: cierre.fecha,
                userId,
                userEmail,
                metadata: { caja: cierre.caja, tienda: cierre.tienda, tipoCambio: cierre.tipoCambio }
            }));
        }
    }
    
    // 3. Registrar POS
    const posAccounts = {
        posBAC: '1.01.04.01',
        posBANPRO: '1.01.04.02',
        posLAFISE: '1.01.04.03'
    };
    
    for (const [field, accountCode] of Object.entries(posAccounts)) {
        if (cierre[field] > 0) {
            const posAccount = await getAccountByCode(accountCode);
            if (posAccount) {
                movements.push(registerMovement({
                    accountId: posAccount.id,
                    accountCode: posAccount.code,
                    type: 'debit',
                    amount: cierre[field],
                    description: `POS ${field.replace('pos', '')} - Cierre ${cierre.caja} ${cierre.fecha}`,
                    reference: `CIERRE-${cierreId}`,
                    referenceId: cierreId,
                    referenceType: 'cierreCaja',
                    date: cierre.fecha,
                    userId,
                    userEmail
                }));
            }
        }
    }
    
    // 4. Registrar Transferencias
    const transferAccounts = {
        transferenciaBAC: '1.01.04.10',
        transferenciaBANPRO: '1.01.04.11',
        transferenciaLAFISE: '1.01.04.12'
    };
    
    for (const [field, accountCode] of Object.entries(transferAccounts)) {
        if (cierre[field] > 0) {
            const transAccount = await getAccountByCode(accountCode);
            if (transAccount) {
                movements.push(registerMovement({
                    accountId: transAccount.id,
                    accountCode: transAccount.code,
                    type: 'debit',
                    amount: cierre[field],
                    description: `Transferencia ${field.replace('transferencia', '')} - Cierre ${cierre.caja} ${cierre.fecha}`,
                    reference: `CIERRE-${cierreId}`,
                    referenceId: cierreId,
                    referenceType: 'cierreCaja',
                    date: cierre.fecha,
                    userId,
                    userEmail
                }));
            }
        }
    }
    
// 5. Registrar retenciones (disminuyen efectivo) - CORREGIDO
if (cierre.retenciones && cierre.retenciones.length > 0) {
  for (const ret of cierre.retenciones) {
    if (ret.monto > 0) {
      // A. Registrar en pasivo (obligación fiscal) - YA LO TENÍAS
      if (ret.tipo === 'IR') {
        const irAccount = await getAccountByCode('2.01.03.01');
        if (irAccount) {
          movements.push(registerMovement({
            accountId: irAccount.id,
            accountCode: irAccount.code,
            type: 'credit', // Aumenta pasivo
            amount: ret.monto,
            description: `Retención IR 2% - Factura ${ret.facturaRelacionada || 'N/A'}`,
            reference: `CIERRE-${cierreId}`,
            referenceId: cierreId,
            referenceType: 'retencionIR',
            date: cierre.fecha,
            userId,
            userEmail,
            metadata: { cliente: ret.cliente, factura: ret.facturaRelacionada }
          }));
        }
      }
      if (ret.tipo === 'Alcaldia') {
        const alcAccount = await getAccountByCode('2.01.03.02');
        if (alcAccount) {
          movements.push(registerMovement({
            accountId: alcAccount.id,
            accountCode: alcAccount.code,
            type: 'credit', // Aumenta pasivo
            amount: ret.monto,
            description: `Retención Alcaldía 1% - Factura ${ret.facturaRelacionada || 'N/A'}`,
            reference: `CIERRE-${cierreId}`,
            referenceId: cierreId,
            referenceType: 'retencionAlcaldia',
            date: cierre.fecha,
            userId,
            userEmail,
            metadata: { cliente: ret.cliente, factura: ret.facturaRelacionada }
          }));
        }
      }
      
      // B. 🔥 FALTABA ESTO: Disminuir la caja por la retención
      const cajaAccount = await getAccountByCode(getCajaCode(cierre.caja, 'NIO'));
      if (cajaAccount) {
        movements.push(registerMovement({
          accountId: cajaAccount.id,
          accountCode: cajaAccount.code,
          type: 'credit', // Disminuye activo (caja)
          amount: ret.monto,
          description: `Salida por retención ${ret.tipo} - Factura ${ret.facturaRelacionada || 'N/A'}`,
          reference: `CIERRE-${cierreId}`,
          referenceId: cierreId,
          referenceType: `retencion${ret.tipo}`,
          date: cierre.fecha,
          userId,
          userEmail,
          metadata: { cliente: ret.cliente, factura: ret.facturaRelacionada, tipoRetencion: ret.tipo }
        }));
      }
    }
  }
}
    
// 6. Registrar gastos de caja - MEJORADO CON VALIDACIÓN
if (cierre.gastosCaja && cierre.gastosCaja.length > 0) {
  for (const gasto of cierre.gastosCaja) {
    if (gasto.monto > 0) {
      // Buscar cuenta de gasto específica si existe, o usar la default
      let gastoAccountCode = gasto.cuentaContableCode || '6.01.02.99';
      const gastoAccount = await getAccountByCode(gastoAccountCode);
      
      if (!gastoAccount) {
        console.warn(`Cuenta ${gastoAccountCode} no encontrada, usando 6.01.02.99`);
        // Fallback a otros gastos
        const fallbackAccount = await getAccountByCode('6.01.02.99');
        if (!fallbackAccount) {
          throw new Error(`No se encontró cuenta de gastos para registrar el gasto: ${gasto.concepto}`);
        }
      }
      
      const targetAccount = gastoAccount || fallbackAccount;
      
      // Registrar en cuenta de gastos (DEBITO - aumenta gasto)
      movements.push(registerMovement({
        accountId: targetAccount.id,
        accountCode: targetAccount.code,
        type: 'debit',
        amount: gasto.monto,
        description: `Gasto de caja: ${gasto.concepto}`,
        reference: `CIERRE-${cierreId}`,
        referenceId: cierreId,
        referenceType: 'gastoCaja',
        date: cierre.fecha,
        userId,
        userEmail,
        metadata: { responsable: gasto.responsable, comentario: gasto.comentario, caja: cierre.caja }
      }));

      // Disminuir caja (CREDITO - disminuye activo)
      const cajaAccount = await getAccountByCode(getCajaCode(cierre.caja, 'NIO'));
      if (cajaAccount) {
        movements.push(registerMovement({
          accountId: cajaAccount.id,
          accountCode: cajaAccount.code,
          type: 'credit',
          amount: gasto.monto,
          description: `Salida por gasto: ${gasto.concepto}`,
          reference: `CIERRE-${cierreId}`,
          referenceId: cierreId,
          referenceType: 'gastoCaja',
          date: cierre.fecha,
          userId,
          userEmail,
          metadata: { responsable: gasto.responsable, comentario: gasto.comentario, caja: cierre.caja }
        }));
      }
    }
  }
}
    
    // Ejecutar todos los movimientos
    await Promise.all(movements);
    
    // Marcar cierre como procesado
    await updateDoc(cierreRef, {
        procesado: true,
        procesadoAt: Timestamp.now(),
        procesadoBy: userId,
        movimientosGenerados: movements.length
    });
    
    return { success: true, movementsCount: movements.length };
};

// Helper para obtener código de caja
function getCajaCode(cajaName, currency) {
    const cajaMap = {
        'Caja Granada 1': currency === 'NIO' ? '1.01.01.01' : '1.01.01.10',
        'Caja Granada 2': currency === 'NIO' ? '1.01.01.02' : '1.01.01.11',
        'Caja Ruta': currency === 'NIO' ? '1.01.01.03' : '1.01.01.12',
        'Caja Amparito': currency === 'NIO' ? '1.01.01.04' : '1.01.01.13',
        // Alias comunes
        'Caja Carnes Amparito': currency === 'NIO' ? '1.01.01.04' : '1.01.01.13',
        'Caja CSM Granada': currency === 'NIO' ? '1.01.01.01' : '1.01.01.10',
    };
    return cajaMap[cajaName] || (currency === 'NIO' ? '1.01.01.01' : '1.01.01.10');
}

// ============================================
// DEPÓSITOS EN TRÁNSITO
// ============================================

/**
 * Crea un nuevo depósito en tránsito
 */
export const createDepositoTransito = async (depositoData) => {
    const {
        fecha,
        responsable,
        moneda,
        cuentasOrigen,
        total,
        desgloseBilletes,
        observaciones,
        userId,
        userEmail
    } = depositoData;
    
    const depositosRef = collection(db, 'depositosTransito');
    
    // Generar número de depósito
    const q = query(depositosRef, orderBy('numero', 'desc'));
    const snapshot = await getDocs(q);
    const lastNumber = snapshot.empty ? 0 : (snapshot.docs[0].data().numero || 0);
    
    const deposito = {
        numero: lastNumber + 1,
        fecha: fecha || new Date().toISOString().substring(0, 10),
        responsable,
        moneda,
        cuentasOrigen: cuentasOrigen || [], // [{ accountId, accountCode, accountName, monto }]
        total: Number(total) || 0,
        desgloseBilletes: desgloseBilletes || {},
        observaciones: observaciones || '',
        
        // Estado
        estado: 'pendiente', // pendiente, confirmado, cancelado
        
        // Referencia al depósito bancario (se llena al confirmar)
        depositoBancarioId: null,
        
        // Auditoría
        createdAt: Timestamp.now(),
        createdBy: userId,
        createdByEmail: userEmail,
        updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(depositosRef, deposito);
    
    // Generar movimientos: disminuir cajas, aumentar tránsito
    const movements = [];
    
    for (const cuenta of cuentasOrigen) {
        // Disminuir cuenta de caja
        movements.push(registerMovement({
            accountId: cuenta.accountId,
            accountCode: cuenta.accountCode,
            type: 'credit',
            amount: moneda === 'NIO' ? cuenta.monto : 0,
            amountUSD: moneda === 'USD' ? cuenta.monto : 0,
            description: `Salida a depósito en tránsito #${deposito.numero}`,
            reference: `DEP-TRANSITO-${docRef.id}`,
            referenceId: docRef.id,
            referenceType: 'depositoTransito',
            date: deposito.fecha,
            userId,
            userEmail
        }));
    }
    
    // Aumentar efectivo en tránsito
    const transitoCode = moneda === 'NIO' ? '1.01.01.20' : '1.01.01.21';
    const accountsRef = collection(db, 'planCuentas');
    const qTransito = query(accountsRef, where('code', '==', transitoCode));
    const transitoSnap = await getDocs(qTransito);
    
    if (!transitoSnap.empty) {
        const transitoAccount = { id: transitoSnap.docs[0].id, ...transitoSnap.docs[0].data() };
        movements.push(registerMovement({
            accountId: transitoAccount.id,
            accountCode: transitoAccount.code,
            type: 'debit',
            amount: moneda === 'NIO' ? total : 0,
            amountUSD: moneda === 'USD' ? total : 0,
            description: `Entrada desde cajas - Depósito en tránsito #${deposito.numero}`,
            reference: `DEP-TRANSITO-${docRef.id}`,
            referenceId: docRef.id,
            referenceType: 'depositoTransito',
            date: deposito.fecha,
            userId,
            userEmail
        }));
    }
    
    await Promise.all(movements);
    
    return { id: docRef.id, ...deposito };
};

/**
 * Confirma un depósito en tránsito (cuando se deposita en banco)
 */
export const confirmarDepositoBancario = async (depositoTransitoId, confirmacionData) => {
    const {
        bancoDestinoId,
        bancoDestinoCode,
        bancoDestinoName,
        fechaDeposito,
        horaDeposito,
        referenciaBancaria,
        comprobanteURL,
        comentarios,
        userId,
        userEmail
    } = confirmacionData;
    
    // Obtener depósito en tránsito
    const depositoRef = doc(db, 'depositosTransito', depositoTransitoId);
    const depositoSnap = await getDoc(depositoRef);
    
    if (!depositoSnap.exists()) {
        throw new Error('Depósito en tránsito no encontrado');
    }
    
    const deposito = depositoSnap.data();
    
    if (deposito.estado !== 'pendiente') {
        throw new Error('El depósito ya fue procesado');
    }
    
    // Crear registro de depósito bancario confirmado
    const depositosBancoRef = collection(db, 'depositosBancarios');
    const depositoBancario = {
        depositoTransitoId,
        numero: deposito.numero,
        fecha: fechaDeposito,
        hora: horaDeposito,
        bancoDestinoId,
        bancoDestinoCode,
        bancoDestinoName,
        monto: deposito.total,
        moneda: deposito.moneda,
        referenciaBancaria,
        comprobanteURL,
        comentarios,
        
        // Origen del dinero
        cuentasOrigen: deposito.cuentasOrigen,
        responsable: deposito.responsable,
        
        // Auditoría
        createdAt: Timestamp.now(),
        createdBy: userId,
        createdByEmail: userEmail
    };
    
    const depositoBancarioRef = await addDoc(depositosBancoRef, depositoBancario);
    
    // Actualizar depósito en tránsito
    await updateDoc(depositoRef, {
        estado: 'confirmado',
        depositoBancarioId: depositoBancarioRef.id,
        updatedAt: Timestamp.now()
    });
    
    // Generar movimientos contables
    const movements = [];
    
    // 1. Disminuir efectivo en tránsito
    const transitoCode = deposito.moneda === 'NIO' ? '1.01.01.20' : '1.01.01.21';
    const accountsRef = collection(db, 'planCuentas');
    const qTransito = query(accountsRef, where('code', '==', transitoCode));
    const transitoSnap = await getDocs(qTransito);
    
    if (!transitoSnap.empty) {
        const transitoAccount = { id: transitoSnap.docs[0].id, ...transitoSnap.docs[0].data() };
        movements.push(registerMovement({
            accountId: transitoAccount.id,
            accountCode: transitoAccount.code,
            type: 'credit',
            amount: deposito.moneda === 'NIO' ? deposito.total : 0,
            amountUSD: deposito.moneda === 'USD' ? deposito.total : 0,
            description: `Depósito a ${bancoDestinoName} - Ref: ${referenciaBancaria}`,
            reference: `DEP-BANCO-${depositoBancarioRef.id}`,
            referenceId: depositoBancarioRef.id,
            referenceType: 'depositoBancario',
            date: fechaDeposito,
            userId,
            userEmail
        }));
    }
    
    // 2. Aumentar cuenta bancaria
    movements.push(registerMovement({
        accountId: bancoDestinoId,
        accountCode: bancoDestinoCode,
        type: 'debit',
        amount: deposito.moneda === 'NIO' ? deposito.total : 0,
        amountUSD: deposito.moneda === 'USD' ? deposito.total : 0,
        description: `Depósito desde cajas - Ref: ${referenciaBancaria}`,
        reference: `DEP-BANCO-${depositoBancarioRef.id}`,
        referenceId: depositoBancarioRef.id,
        referenceType: 'depositoBancario',
        date: fechaDeposito,
        userId,
        userEmail
    }));
    
    await Promise.all(movements);
    
    return { 
        success: true, 
        depositoBancarioId: depositoBancarioRef.id,
        movementsCount: movements.length 
    };
};

/**
 * Cancela un depósito en tránsito (reversa los movimientos)
 */
export const cancelarDepositoTransito = async (depositoId, motivo, userId, userEmail) => {
    const depositoRef = doc(db, 'depositosTransito', depositoId);
    const depositoSnap = await getDoc(depositoRef);
    
    if (!depositoSnap.exists()) {
        throw new Error('Depósito no encontrado');
    }
    
    const deposito = depositoSnap.data();
    
    if (deposito.estado !== 'pendiente') {
        throw new Error('Solo se pueden cancelar depósitos pendientes');
    }
    
    // Reversar movimientos
    const movements = [];
    
    // Devolver a cajas
    for (const cuenta of deposito.cuentasOrigen) {
        movements.push(registerMovement({
            accountId: cuenta.accountId,
            accountCode: cuenta.accountCode,
            type: 'debit',
            amount: deposito.moneda === 'NIO' ? cuenta.monto : 0,
            amountUSD: deposito.moneda === 'USD' ? cuenta.monto : 0,
            description: `Reversión depósito cancelado #${deposito.numero} - ${motivo}`,
            reference: `CANCEL-DEP-${depositoId}`,
            referenceId: depositoId,
            referenceType: 'cancelacionDeposito',
            date: new Date().toISOString().substring(0, 10),
            userId,
            userEmail
        }));
    }
    
    // Disminuir tránsito
    const transitoCode = deposito.moneda === 'NIO' ? '1.01.01.20' : '1.01.01.21';
    const accountsRef = collection(db, 'planCuentas');
    const qTransito = query(accountsRef, where('code', '==', transitoCode));
    const transitoSnap = await getDocs(qTransito);
    
    if (!transitoSnap.empty) {
        const transitoAccount = { id: transitoSnap.docs[0].id, ...transitoSnap.docs[0].data() };
        movements.push(registerMovement({
            accountId: transitoAccount.id,
            accountCode: transitoAccount.code,
            type: 'credit',
            amount: deposito.moneda === 'NIO' ? deposito.total : 0,
            amountUSD: deposito.moneda === 'USD' ? deposito.total : 0,
            description: `Reversión depósito cancelado #${deposito.numero} - ${motivo}`,
            reference: `CANCEL-DEP-${depositoId}`,
            referenceId: depositoId,
            referenceType: 'cancelacionDeposito',
            date: new Date().toISOString().substring(0, 10),
            userId,
            userEmail
        }));
    }
    
    await Promise.all(movements);
    
    await updateDoc(depositoRef, {
        estado: 'cancelado',
        motivoCancelacion: motivo,
        canceladoAt: Timestamp.now(),
        canceladoBy: userId,
        updatedAt: Timestamp.now()
    });
    
    return { success: true };
};

// ============================================
// REPORTES Y CONSULTAS
// ============================================

/**
 * Obtiene saldos por tipo de cuenta
 */
export const getBalancesByType = async () => {
    const accounts = await getAllAccounts();
    const balances = {};
    
    for (const type of Object.keys(ACCOUNT_TYPES)) {
        const typeAccounts = accounts.filter(a => a.type === type && !a.isGroup);
        balances[type] = {
            totalNIO: typeAccounts.reduce((sum, a) => sum + (a.balance || 0), 0),
            totalUSD: typeAccounts.reduce((sum, a) => sum + (a.balanceUSD || 0), 0),
            accounts: typeAccounts
        };
    }
    
    return balances;
};

/**
 * Obtiene el estado de cajas actual
 */
export const getCashStatus = async () => {
    const cashAccounts = await getCashAccounts();
    
    const byCurrency = {
        NIO: cashAccounts.filter(a => a.currency === 'NIO' || !a.currency),
        USD: cashAccounts.filter(a => a.currency === 'USD')
    };
    
    return {
        totalNIO: byCurrency.NIO.reduce((sum, a) => sum + (a.balance || 0), 0),
        totalUSD: byCurrency.USD.reduce((sum, a) => sum + (a.balanceUSD || 0), 0),
        accounts: cashAccounts
    };
};

/**
 * Obtiene depósitos en tránsito pendientes
 */
export const getPendingDepositos = async () => {
    const depositosRef = collection(db, 'depositosTransito');
    const q = query(depositosRef, where('estado', '==', 'pendiente'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Obtiene configuración del ERP
 */
export const getConfiguracionERP = async () => {
    const configRef = collection(db, 'configuracion');
    const snap = await getDocs(configRef);
    if (!snap.empty) return snap.docs[0].data();
    return { cuotaFijaMensual: 3400, nombreEmpresa: 'FinanzasApp', monedaPrincipal: 'NIO' };
};

/**
 * Obtiene tasa de cambio activa
 */
export const getTasaCambioActiva = async () => {
    const q = query(collection(db, 'tasasCambio'), where('activa', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data();
    return { usdToNio: 36.50, nioToUsd: 0.0274 };
};

/**
 * Obtiene resumen para KPI fiscal
 */
export const getKPIFiscal = async (month, year) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    // Obtener configuración del ERP
    const config = await getConfiguracionERP();
    const cuotaFija = config.cuotaFijaMensual || 3400;
    
    // Obtener ventas del mes (de cierres de caja)
    const cierresRef = collection(db, 'cierresCaja');
    const qCierres = query(
        cierresRef,
        where('fecha', '>=', startDate),
        where('fecha', '<=', endDate),
        where('estado', '==', 'cerrado')
    );
    const cierresSnap = await getDocs(qCierres);
    const cierres = cierresSnap.docs.map(d => d.data());
    
    const totalVentas = cierres.reduce((sum, c) => sum + (c.totalVentas || 0), 0);
    
    // Obtener retenciones
    const totalRetenciones = cierres.reduce((sum, c) => sum + (c.totalRetenciones || 0), 0);
    
    // Carga fiscal real
    const cargaFiscal = cuotaFija + totalRetenciones;
    const porcentajeCarga = totalVentas > 0 ? (cargaFiscal / totalVentas) * 100 : 0;
    
    return {
        month,
        year,
        totalVentas,
        cuotaFija,
        totalRetenciones,
        cargaFiscal,
        porcentajeCarga: Number(porcentajeCarga.toFixed(2)),
        cierresCount: cierres.length
    };
};

// ============================================
// GESTIÓN DE FOTOS Y ARCHIVOS
// ============================================

/**
 * Sube una foto a Firebase Storage
 * @param {File} file - Archivo a subir
 * @param {string} folder - Carpeta destino (gastos, ingresos, inventario, cierres)
 * @param {string} entityId - ID de la entidad relacionada
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadPhoto = async (file, folder, entityId) => {
    if (!file) throw new Error('No se proporcionó archivo');
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `finanzasapp/${folder}/${entityId}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
        url: downloadURL,
        path: storagePath,
        name: file.name,
        uploadedAt: new Date().toISOString()
    };
};

/**
 * Sube múltiples fotos
 * @param {File[]} files - Array de archivos
 * @param {string} folder - Carpeta destino
 * @param {string} entityId - ID de la entidad
 * @returns {Promise<Array<{url: string, path: string}>>}
 */
export const uploadMultiplePhotos = async (files, folder, entityId) => {
    const uploadPromises = files.map(file => uploadPhoto(file, folder, entityId));
    return Promise.all(uploadPromises);
};

/**
 * Elimina una foto de Firebase Storage
 * @param {string} storagePath - Ruta del archivo en Storage
 */
export const deletePhoto = async (storagePath) => {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
};

/**
 * Actualiza las fotos de un documento
 * @param {string} collectionName - Nombre de la colección
 * @param {string} docId - ID del documento
 * @param {Array} photos - Array de fotos
 */
export const updateDocumentPhotos = async (collectionName, docId, photos) => {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
        fotos: photos,
        updatedAt: Timestamp.now()
    });
};

// ============================================
// FUNCIONES ADICIONALES PARA CUENTAS POR PAGAR
// ============================================

/**
 * Crea un movimiento contable para cuentas por pagar
 * Esta función es un alias de registerMovement para compatibilidad
 */
export const crearMovimientoContable = async (movementData) => {
    return registerMovement(movementData);
};

export default {
    ACCOUNT_TYPES,
    CURRENCIES,
    DEFAULT_CHART_OF_ACCOUNTS,
    initializeChartOfAccounts,
    createAccount,
    updateAccount,
    getAllAccounts,
    getAccountsByType,
    getCashAccounts,
    registerMovement,
    crearMovimientoContable,
    getAccountMovements,
    getMovements,
    createCierreCaja,
    updateCierreCajaStatus,
    procesarCierreCaja,
    createDepositoTransito,
    confirmarDepositoBancario,
    cancelarDepositoTransito,
    getBalancesByType,
    getCashStatus,
    getPendingDepositos,
    getKPIFiscal,
    getConfiguracionERP,
    getTasaCambioActiva,
    uploadPhoto,
    uploadMultiplePhotos,
    deletePhoto,
    updateDocumentPhotos
};
