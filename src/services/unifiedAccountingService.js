// src/services/unifiedAccountingService.js
// Servicio ERP unificado - Toda transacción genera asiento contable
// Principio: "El Plan de Cuentas es el núcleo del sistema"

import { db, storage } from '../firebase';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, 
    query, where, orderBy, getDocs, Timestamp, runTransaction, getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TIPOS DE DOCUMENTOS Y NATURALEZA DE CUENTAS
// ============================================

export const DOCUMENT_TYPES = {
    CIERRE_CAJA: 'cierreCaja',
    DEPOSITO_TRANSITO: 'depositoTransito',
    DEPOSITO_BANCARIO: 'depositoBancario',
    FACTURA_CUENTA_PAGAR: 'facturaCuentaPagar',
    ABONO_CUENTA_PAGAR: 'abonoCuentaPagar',
    GASTO: 'gasto',
    INGRESO: 'ingreso',
    AJUSTE_MANUAL: 'ajusteManual',
    DIFERENCIA_CAJA: 'diferenciaCaja'
};

export const ACCOUNT_NATURE = {
    DEUDORA: 'deudora',      // Aumenta con DEBITO, disminuye con CREDITO
    ACREEDORA: 'acreedora'   // Aumenta con CREDITO, disminuye con DEBITO
};

export const ACCOUNT_TYPES = {
    ACTIVO: { id: 'ACTIVO', name: 'Activos', nature: ACCOUNT_NATURE.DEUDORA },
    PASIVO: { id: 'PASIVO', name: 'Pasivos', nature: ACCOUNT_NATURE.ACREEDORA },
    CAPITAL: { id: 'CAPITAL', name: 'Capital', nature: ACCOUNT_NATURE.ACREEDORA },
    INGRESO: { id: 'INGRESO', name: 'Ingresos', nature: ACCOUNT_NATURE.ACREEDORA },
    COSTO: { id: 'COSTO', name: 'Costos', nature: ACCOUNT_NATURE.DEUDORA },
    GASTO: { id: 'GASTO', name: 'Gastos', nature: ACCOUNT_NATURE.DEUDORA }
};

// ============================================
// FUNCIONES BASE DE MOVIMIENTOS CONTABLES
// ============================================

/**
 * Registra una partida doble completa (DEBITO + CREDITO)
 * Esta es la función FUNDAMENTAL del ERP - Todo pasa por aquí
 * 
 * NOTA: Firestore requiere que TODAS las lecturas se hagan ANTES de cualquier escritura
 */
export const registerAccountingEntry = async (entryData) => {
    const {
        fecha,
        descripcion,
        referencia,
        documentoId,
        documentoTipo,
        moduloOrigen,
        userId,
        userEmail,
        movimientos, // Array de { cuentaId, cuentaCode, cuentaName, tipo, monto, montoUSD }
        metadata = {}
    } = entryData;

    // Validación: La suma de DEBITOS debe igualar la suma de CREDITOS
    const totalDebitos = movimientos.filter(m => m.tipo === 'DEBITO').reduce((sum, m) => sum + Number(m.monto || 0), 0);
    const totalCreditos = movimientos.filter(m => m.tipo === 'CREDITO').reduce((sum, m) => sum + Number(m.monto || 0), 0);
    
    if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
        throw new Error(`Partida descuadrada: Débitos ${totalDebitos} ≠ Créditos ${totalCreditos}`);
    }

    // Validar que todos los movimientos tengan cuentaId
    for (const mov of movimientos) {
        if (!mov.cuentaId) {
            throw new Error(`Movimiento sin cuentaId: ${JSON.stringify(mov)}`);
        }
    }

    const movimientosRef = collection(db, 'movimientosContables');
    const movimientosCreados = [];

    // Crear todos los movimientos dentro de una transacción
    await runTransaction(db, async (transaction) => {
        // FASE 1: OBTENER TODAS LAS CUENTAS PRIMERO (lecturas)
        const cuentasData = {};
        for (const mov of movimientos) {
            const cuentaRef = doc(db, 'planCuentas', mov.cuentaId);
            const cuentaSnap = await transaction.get(cuentaRef);
            
            if (!cuentaSnap.exists()) {
                throw new Error(`Cuenta ${mov.cuentaCode} (${mov.cuentaId}) no encontrada`);
            }
            
            cuentasData[mov.cuentaId] = cuentaSnap.data();
        }

        // FASE 2: CREAR MOVIMIENTOS Y ACTUALIZAR SALDOS (escrituras)
        for (const mov of movimientos) {
            // 1. Crear el movimiento contable
            const movRef = doc(movimientosRef);
            const movData = {
                fecha: fecha || new Date().toISOString().substring(0, 10),
                timestamp: Timestamp.now(),
                
                // Cuenta
                accountId: mov.cuentaId,
                accountCode: mov.cuentaCode,
                accountName: mov.cuentaName,
                
                // Movimiento
                type: mov.tipo, // 'DEBITO' o 'CREDITO'
                monto: Number(Number(mov.monto || 0).toFixed(2)),
                montoUSD: Number(Number(mov.montoUSD || 0).toFixed(2)),
                
                // Contexto
                descripcion: mov.descripcion || descripcion,
                referencia,
                
                // Trazabilidad ERP
                documentoId,
                documentoTipo,
                moduloOrigen,
                
                // Auditoría
                userId,
                userEmail,
                metadata: { ...metadata, ...mov.metadata }
            };
            
            transaction.set(movRef, movData);
            movimientosCreados.push({ id: movRef.id, ...movData });

            // 2. Actualizar saldo de la cuenta (usar datos cacheados de FASE 1)
            const cuenta = cuentasData[mov.cuentaId];
            const cuentaRef = doc(db, 'planCuentas', mov.cuentaId);
            const nature = ACCOUNT_TYPES[cuenta.type]?.nature || ACCOUNT_NATURE.DEUDORA;
            
            let cambioBalance = 0;
            let cambioBalanceUSD = 0;
            
            if (nature === ACCOUNT_NATURE.DEUDORA) {
                // Cuentas deudoras: DEBITO aumenta, CREDITO disminuye
                cambioBalance = mov.tipo === 'DEBITO' ? Number(mov.monto || 0) : -Number(mov.monto || 0);
                cambioBalanceUSD = mov.tipo === 'DEBITO' ? Number(mov.montoUSD || 0) : -Number(mov.montoUSD || 0);
            } else {
                // Cuentas acreedoras: CREDITO aumenta, DEBITO disminuye
                cambioBalance = mov.tipo === 'CREDITO' ? Number(mov.monto || 0) : -Number(mov.monto || 0);
                cambioBalanceUSD = mov.tipo === 'CREDITO' ? Number(mov.montoUSD || 0) : -Number(mov.montoUSD || 0);
            }

            // CORRECCIÓN: Forzar conversión a número antes de operar
            const balanceActual = Number(cuenta.balance) || 0;
            const balanceUSDActual = Number(cuenta.balanceUSD) || 0;
            
            const nuevoBalance = Number((balanceActual + cambioBalance).toFixed(2));
            const nuevoBalanceUSD = Number((balanceUSDActual + cambioBalanceUSD).toFixed(2));

            transaction.update(cuentaRef, {
                balance: nuevoBalance,
                balanceUSD: nuevoBalanceUSD,
                updatedAt: Timestamp.now()
            });
        } // <-- CIERRE DEL FOR LOOP (FALTABA ESTO)
    }); // <-- CIERRE DE runTransaction

    return {
        success: true,
        movimientos: movimientosCreados,
        totalDebitos,
        totalCreditos
    };
};

/**
 * Obtiene movimientos contables con filtros
 */
export const getMovimientosContables = async (filters = {}) => {
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
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Obtiene el historial de movimientos de una cuenta específica
 */
export const getHistorialCuenta = async (accountId, limit = 100) => {
    const movimientosRef = collection(db, 'movimientosContables');
    const q = query(
        movimientosRef,
        where('accountId', '==', accountId),
        orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ============================================
// CIERRE DE CAJA ERP
// ============================================

/**
 * Crea un nuevo cierre de caja ERP con validación de cuadre
 * FÓRMULA DE CUADRE: Ingreso Total = Desglose Métodos de Pago + Retenciones + Gastos
 */
export const createCierreCajaERP = async (cierreData) => {
    const {
        fecha,
        tienda,
        caja,
        cajero,
        horaApertura,
        horaCierre,
        observaciones,
        
        // Datos SICAR
        totalIngreso,
        
        // Créditos y abonos - solo montos totalizados (simplificado)
        totalFacturasCredito,
        totalAbonosRecibidos,
        
        // Métodos de pago
        efectivoCS,
        efectivoUSD,
        tipoCambio,
        posBAC,
        posBANPRO,
        posLAFISE,
        transferenciaBAC,
        transferenciaBANPRO,
        transferenciaLAFISE,
        
        // Facturas membretadas INDIVIDUALES
        facturasMembretadas = [],
        
        // Retenciones y gastos
        retenciones = [],
        gastosCaja = [],
        
        // Arqueo
        arqueo,
        
        // Usuario
        userId,
        userEmail,
        fotos = []
    } = cierreData;

    // Calcular totales de métodos de pago
    const totalEfectivo = Number(efectivoCS || 0) + (Number(efectivoUSD || 0) * Number(tipoCambio || 0));
    const totalPOS = Number(posBAC || 0) + Number(posBANPRO || 0) + Number(posLAFISE || 0);
    const totalTransferencias = Number(transferenciaBAC || 0) + Number(transferenciaBANPRO || 0) + Number(transferenciaLAFISE || 0);
    const totalMediosPago = totalEfectivo + totalPOS + totalTransferencias;
    
    const totalRetencionesCalc = retenciones.reduce((sum, r) => sum + (Number(r.monto) || 0), 0);
    const totalGastosCajaCalc = gastosCaja.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
    
    // FÓRMULA DE CUADRE CORREGIDA:
    // Ingreso Total = Desglose Métodos de Pago + Retenciones + Gastos
    const totalIngresoNum = Number(totalIngreso || 0);
    const totalEsperado = totalMediosPago + totalRetencionesCalc + totalGastosCajaCalc;
    const diferencia = Number((totalIngresoNum - totalEsperado).toFixed(2));
    const estaCuadrado = Math.abs(diferencia) < 0.01;

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
        totalIngreso: totalIngresoNum,
        
        // Créditos y abonos - solo montos totalizados
        totalFacturasCredito: Number(totalFacturasCredito || 0),
        totalAbonosRecibidos: Number(totalAbonosRecibidos || 0),
        
        // Métodos de pago
        efectivoCS: Number(efectivoCS || 0),
        efectivoUSD: Number(efectivoUSD || 0),
        tipoCambio: Number(tipoCambio || 36.50),
        posBAC: Number(posBAC || 0),
        posBANPRO: Number(posBANPRO || 0),
        posLAFISE: Number(posLAFISE || 0),
        transferenciaBAC: Number(transferenciaBAC || 0),
        transferenciaBANPRO: Number(transferenciaBANPRO || 0),
        transferenciaLAFISE: Number(transferenciaLAFISE || 0),
        
        // Facturas membretadas INDIVIDUALES
        facturasMembretadas,
        
        // Retenciones
        retenciones,
        totalRetenciones: totalRetencionesCalc,
        
        // Gastos de caja
        gastosCaja,
        totalGastosCaja: totalGastosCajaCalc,
        
        // Arqueo
        arqueo: arqueo || null,
        
        // Cuadre
        cuadre: {
            totalIngreso: totalIngresoNum,
            totalMediosPago,
            totalRetenciones: totalRetencionesCalc,
            totalGastosCaja: totalGastosCajaCalc,
            totalEsperado,
            diferencia,
            estaCuadrado
        },
        
        // Estado
        estado: 'borrador',
        
        // Fotos
        fotos,
        
        // Referencias a movimientos (se llenan al procesar)
        movimientosContablesIds: [],
        
        // Auditoría
        createdAt: Timestamp.now(),
        createdBy: userId,
        createdByEmail: userEmail,
        updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'cierresCajaERP'), cierre);
    return { id: docRef.id, ...cierre };
};

/**
 * Actualiza el estado de un cierre de caja
 */
export const updateCierreCajaERPStatus = async (cierreId, nuevoEstado, userId) => {
    const cierreRef = doc(db, 'cierresCajaERP', cierreId);
    const cierreSnap = await getDoc(cierreRef);
    
    if (!cierreSnap.exists()) {
        throw new Error('Cierre de caja no encontrado');
    }
    
    const cierre = cierreSnap.data();
    
    // Validación: Solo se puede cerrar si está cuadrado
    if (nuevoEstado === 'cerrado' && !cierre.cuadre.estaCuadrado) {
        throw new Error('No se puede cerrar: El cierre no está cuadrado. Diferencia: ' + 
            cierre.cuadre.diferencia);
    }
    
    const updates = {
        estado: nuevoEstado,
        updatedAt: Timestamp.now(),
        updatedBy: userId
    };
    
    if (nuevoEstado === 'cerrado') {
        updates.cerradoAt = Timestamp.now();
        updates.cerradoBy = userId;
    }
    
    await updateDoc(cierreRef, updates);
    return { success: true };
};

/**
 * Procesa un cierre de caja cerrado - Genera todos los movimientos contables
 * Esta es la función CRÍTICA del ERP
 */
export const procesarCierreCajaERP = async (cierreId, userId, userEmail) => {
    const cierreRef = doc(db, 'cierresCajaERP', cierreId);
    const cierreSnap = await getDoc(cierreRef);
    
    if (!cierreSnap.exists()) {
        throw new Error('Cierre de caja no encontrado');
    }
    
    const cierre = cierreSnap.data();
    
      if (cierre.procesado) {
        throw new Error('Este cierre ya fue procesado anteriormente');
    }

    // Obtener cuentas del plan de cuentas
    const accountsRef = collection(db, 'planCuentas');
    const getCuentaByCode = async (code) => {
        const q = query(accountsRef, where('code', '==', code));
        const snap = await getDocs(q);
        return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    };

    const movimientosGenerados = [];
    const fecha = cierre.fecha;
    const referencia = `CIERRE-${cierreId}`;

    // 1. REGISTRAR EFECTIVO EN CAJA (si hay)
    if (cierre.efectivoCS > 0 || cierre.efectivoUSD > 0) {
        const cajaCode = getCajaCode(cierre.caja, 'NIO');
        const cajaAccount = await getCuentaByCode(cajaCode);
        
        if (cajaAccount && cierre.efectivoCS > 0) {
            const entry = await registerAccountingEntry({
                fecha,
                descripcion: `Efectivo C$ - Cierre ${cierre.caja} ${fecha}`,
                referencia,
                documentoId: cierreId,
                documentoTipo: DOCUMENT_TYPES.CIERRE_CAJA,
                moduloOrigen: 'cierreCaja',
                userId,
                userEmail,
                movimientos: [
                    {
                        cuentaId: cajaAccount.id,
                        cuentaCode: cajaAccount.code,
                        cuentaName: cajaAccount.name,
                        tipo: 'DEBITO',
                        monto: cierre.efectivoCS,
                        montoUSD: 0,
                        descripcion: `Efectivo C$ en ${cierre.caja}`
                    },
                    {
                        cuentaId: (await getCuentaByCode('4.01.01')).id,
                        cuentaCode: '4.01.01',
                        cuentaName: 'Ventas',
                        tipo: 'CREDITO',
                        monto: cierre.efectivoCS,
                        montoUSD: 0,
                        descripcion: `Ventas en efectivo C$`
                    }
                ],
                metadata: { caja: cierre.caja, tienda: cierre.tienda, tipo: 'efectivoCS' }
            });
            movimientosGenerados.push(...entry.movimientos);
        }

        // Efectivo USD
        if (cierre.efectivoUSD > 0) {
            const cajaUSDCode = getCajaCode(cierre.caja, 'USD');
            const cajaUSDAccount = await getCuentaByCode(cajaUSDCode);
            
            if (cajaUSDAccount) {
                const entry = await registerAccountingEntry({
                    fecha,
                    descripcion: `Efectivo USD - Cierre ${cierre.caja} ${fecha}`,
                    referencia,
                    documentoId: cierreId,
                    documentoTipo: DOCUMENT_TYPES.CIERRE_CAJA,
                    moduloOrigen: 'cierreCaja',
                    userId,
                    userEmail,
                    movimientos: [
                        {
                            cuentaId: cajaUSDAccount.id,
                            cuentaCode: cajaUSDAccount.code,
                            cuentaName: cajaUSDAccount.name,
                            tipo: 'DEBITO',
                            monto: 0,
                            montoUSD: cierre.efectivoUSD,
                            descripcion: `Efectivo USD en ${cierre.caja}`
                        },
                        {
                            cuentaId: (await getCuentaByCode('4.01.01')).id,
                            cuentaCode: '4.01.01',
                            cuentaName: 'Ventas',
                            tipo: 'CREDITO',
                            monto: 0,
                            montoUSD: cierre.efectivoUSD,
                            descripcion: `Ventas en efectivo USD`
                        }
                    ],
                    metadata: { caja: cierre.caja, tienda: cierre.tienda, tipo: 'efectivoUSD', tipoCambio: cierre.tipoCambio }
                });
                movimientosGenerados.push(...entry.movimientos);
            }
        }
    }

    // 2. REGISTRAR TOTAL FACTURAS DE CRÉDITO (campo simplificado)
    if (cierre.totalFacturasCredito > 0) {
        const creditoAccount = await getCuentaByCode('1.01.07.01');
        const ventasCreditoAccount = await getCuentaByCode('4.01.02');
        
        if (creditoAccount && ventasCreditoAccount) {
            const entry = await registerAccountingEntry({
                fecha,
                descripcion: `Facturas de crédito del día - Cierre ${cierre.caja}`,
                referencia,
                documentoId: cierreId,
                documentoTipo: DOCUMENT_TYPES.CIERRE_CAJA,
                moduloOrigen: 'cierreCaja',
                userId,
                userEmail,
                movimientos: [
                    {
                        cuentaId: creditoAccount.id,
                        cuentaCode: creditoAccount.code,
                        cuentaName: creditoAccount.name,
                        tipo: 'DEBITO',
                        monto: cierre.totalFacturasCredito,
                        montoUSD: 0,
                        descripcion: `Créditos del día`
                    },
                    {
                        cuentaId: ventasCreditoAccount.id,
                        cuentaCode: ventasCreditoAccount.code,
                        cuentaName: ventasCreditoAccount.name,
                        tipo: 'CREDITO',
                        monto: cierre.totalFacturasCredito,
                        montoUSD: 0,
                        descripcion: `Ventas al crédito del día`
                    }
                ],
                metadata: { tipo: 'credito', montoTotal: cierre.totalFacturasCredito }
            });
            movimientosGenerados.push(...entry.movimientos);
        }
    }

    // 3. REGISTRAR TOTAL ABONOS RECIBIDOS (campo simplificado)
    if (cierre.totalAbonosRecibidos > 0) {
        const cajaAccount = await getCuentaByCode(getCajaCode(cierre.caja, 'NIO'));
        const creditoAccount = await getCuentaByCode('1.01.07.01');
        
        if (cajaAccount && creditoAccount) {
            const entry = await registerAccountingEntry({
                fecha,
                descripcion: `Abonos recibidos del día - Cierre ${cierre.caja}`,
                referencia,
                documentoId: cierreId,
                documentoTipo: DOCUMENT_TYPES.CIERRE_CAJA,
                moduloOrigen: 'cierreCaja',
                userId,
                userEmail,
                movimientos: [
                    {
                        cuentaId: cajaAccount.id,
                        cuentaCode: cajaAccount.code,
                        cuentaName: cajaAccount.name,
                        tipo: 'DEBITO',
                        monto: cierre.totalAbonosRecibidos,
                        montoUSD: 0,
                        descripcion: `Abonos recibidos en caja`
                    },
                    {
                        cuentaId: creditoAccount.id,
                        cuentaCode: creditoAccount.code,
                        cuentaName: creditoAccount.name,
                        tipo: 'CREDITO',
                        monto: cierre.totalAbonosRecibidos,
                        montoUSD: 0,
                        descripcion: `Reducción de créditos por abonos`
                    }
                ],
                metadata: { tipo: 'abono', montoTotal: cierre.totalAbonosRecibidos }
            });
            movimientosGenerados.push(...entry.movimientos);
        }
    }

    // 4. REGISTRAR POS
    const posAccounts = {
        posBAC: '1.01.04.01',
        posBANPRO: '1.01.04.02',
        posLAFISE: '1.01.04.03'
    };
    
    for (const [field, accountCode] of Object.entries(posAccounts)) {
        const monto = cierre[field];
        if (monto > 0) {
            const posAccount = await getCuentaByCode(accountCode);
            const ventasAccount = await getCuentaByCode('4.01.01');
            
            if (posAccount && ventasAccount) {
                const entry = await registerAccountingEntry({
                    fecha,
                    descripcion: `POS ${field.replace('pos', '')} - Cierre ${cierre.caja}`,
                    referencia,
                    documentoId: cierreId,
                    documentoTipo: DOCUMENT_TYPES.CIERRE_CAJA,
                    moduloOrigen: 'cierreCaja',
                    userId,
                    userEmail,
                    movimientos: [
                        {
                            cuentaId: posAccount.id,
                            cuentaCode: posAccount.code,
                            cuentaName: posAccount.name,
                            tipo: 'DEBITO',
                            monto,
                            montoUSD: 0,
                            descripcion: `POS ${field.replace('pos', '')}`
                        },
                        {
                            cuentaId: ventasAccount.id,
                            cuentaCode: ventasAccount.code,
                            cuentaName: ventasAccount.name,
                            tipo: 'CREDITO',
                            monto,
                            montoUSD: 0,
                            descripcion: `Ventas POS ${field.replace('pos', '')}`
                        }
                    ],
                    metadata: { tipo: 'pos', banco: field.replace('pos', '') }
                });
                movimientosGenerados.push(...entry.movimientos);
            }
        }
    }

    // 5. REGISTRAR TRANSFERENCIAS
    const transferAccounts = {
        transferenciaBAC: '1.01.04.10',
        transferenciaBANPRO: '1.01.04.11',
        transferenciaLAFISE: '1.01.04.12'
    };
    
    for (const [field, accountCode] of Object.entries(transferAccounts)) {
        const monto = cierre[field];
        if (monto > 0) {
            const transAccount = await getCuentaByCode(accountCode);
            const ventasAccount = await getCuentaByCode('4.01.01');
            
            if (transAccount && ventasAccount) {
                const entry = await registerAccountingEntry({
                    fecha,
                    descripcion: `Transferencia ${field.replace('transferencia', '')} - Cierre ${cierre.caja}`,
                    referencia,
                    documentoId: cierreId,
                    documentoTipo: DOCUMENT_TYPES.CIERRE_CAJA,
                    moduloOrigen: 'cierreCaja',
                    userId,
                    userEmail,
                    movimientos: [
                        {
                            cuentaId: transAccount.id,
                            cuentaCode: transAccount.code,
                            cuentaName: transAccount.name,
                            tipo: 'DEBITO',
                            monto,
                            montoUSD: 0,
                            descripcion: `Transferencia ${field.replace('transferencia', '')}`
                        },
                        {
                            cuentaId: ventasAccount.id,
                            cuentaCode: ventasAccount.code,
                            cuentaName: ventasAccount.name,
                            tipo: 'CREDITO',
                            monto,
                            montoUSD: 0,
                            descripcion: `Ventas por transferencia ${field.replace('transferencia', '')}`
                        }
                    ],
                    metadata: { tipo: 'transferencia', banco: field.replace('transferencia', '') }
                });
                movimientosGenerados.push(...entry.movimientos);
            }
        }
    }

    // 6. REGISTRAR RETENCIONES
    for (const ret of cierre.retenciones || []) {
        if (ret.monto > 0) {
            const retencionCode = ret.tipo === 'IR' ? '2.01.03.01' : '2.01.03.02';
            const retencionAccount = await getCuentaByCode(retencionCode);
            const ventasAccount = await getCuentaByCode('4.01.01');
            
            if (retencionAccount && ventasAccount) {
                const entry = await registerAccountingEntry({
                    fecha,
                    descripcion: `Retención ${ret.tipo} - Factura ${ret.facturaRelacionada || 'N/A'}`,
                    referencia,
                    documentoId: cierreId,
                    documentoTipo: DOCUMENT_TYPES.CIERRE_CAJA,
                    moduloOrigen: 'cierreCaja',
                    userId,
                    userEmail,
                    movimientos: [
                        {
                            cuentaId: ventasAccount.id,
                            cuentaCode: ventasAccount.code,
                            cuentaName: ventasAccount.name,
                            tipo: 'DEBITO',
                            monto: ret.monto,
                            montoUSD: 0,
                            descripcion: `Retención ${ret.tipo} sobre ventas`
                        },
                        {
                            cuentaId: retencionAccount.id,
                            cuentaCode: retencionAccount.code,
                            cuentaName: retencionAccount.name,
                            tipo: 'CREDITO',
                            monto: ret.monto,
                            montoUSD: 0,
                            descripcion: `Retención ${ret.tipo} por pagar`
                        }
                    ],
                    metadata: { tipo: 'retencion', tipoRetencion: ret.tipo, cliente: ret.cliente, factura: ret.facturaRelacionada }
                });
                movimientosGenerados.push(...entry.movimientos);
            }
        }
    }

    // 7. REGISTRAR GASTOS DE CAJA
    for (const gasto of cierre.gastosCaja || []) {
        if (gasto.monto > 0) {
            // Usar cuenta contable específica del gasto o una genérica
            const gastoAccount = gasto.cuentaContableId ? 
                { id: gasto.cuentaContableId, code: gasto.cuentaContableCode || '6.01.02.99', name: gasto.cuentaContableName || 'Otros Gastos' } :
                await getCuentaByCode('6.01.02.99');
            
            const cajaCode = getCajaCode(cierre.caja, 'NIO');
            const cajaAccount = await getCuentaByCode(cajaCode);
            
            if (gastoAccount && cajaAccount) {
                const entry = await registerAccountingEntry({
                    fecha,
                    descripcion: `Gasto de caja: ${gasto.concepto}`,
                    referencia,
                    documentoId: cierreId,
                    documentoTipo: DOCUMENT_TYPES.CIERRE_CAJA,
                    moduloOrigen: 'cierreCaja',
                    userId,
                    userEmail,
                    movimientos: [
                        {
                            cuentaId: gastoAccount.id,
                            cuentaCode: gastoAccount.code,
                            cuentaName: gastoAccount.name,
                            tipo: 'DEBITO',
                            monto: gasto.monto,
                            montoUSD: 0,
                            descripcion: gasto.concepto
                        },
                        {
                            cuentaId: cajaAccount.id,
                            cuentaCode: cajaAccount.code,
                            cuentaName: cajaAccount.name,
                            tipo: 'CREDITO',
                            monto: gasto.monto,
                            montoUSD: 0,
                            descripcion: `Salida por gasto: ${gasto.concepto}`
                        }
                    ],
                    metadata: { tipo: 'gastoCaja', concepto: gasto.concepto, responsable: gasto.responsable }
                });
                movimientosGenerados.push(...entry.movimientos);
            }
        }
    }

    // 8. REGISTRAR DIFERENCIA DE CAJA (si existe)
    if (cierre.arqueo && Math.abs(cierre.arqueo.diferenciaCS) > 0.01) {
        const diferencia = cierre.arqueo.diferenciaCS;
        const esFaltante = diferencia < 0;
        const montoDiferencia = Math.abs(diferencia);
        
        const diferenciaAccount = await getCuentaByCode('6.01.03'); // Diferencias de Caja
        const cajaCode = getCajaCode(cierre.caja, 'NIO');
        const cajaAccount = await getCuentaByCode(cajaCode);
        
        if (diferenciaAccount && cajaAccount) {
            const movimientosDiferencia = esFaltante ? [
                // Faltante: Gasto (Diferencias) aumenta, Caja disminuye
                {
                    cuentaId: diferenciaAccount.id,
                    cuentaCode: diferenciaAccount.code,
                    cuentaName: diferenciaAccount.name,
                    tipo: 'DEBITO',
                    monto: montoDiferencia,
                    montoUSD: 0,
                    descripcion: `Faltante de caja - ${cierre.cajero}`
                },
                {
                    cuentaId: cajaAccount.id,
                    cuentaCode: cajaAccount.code,
                    cuentaName: cajaAccount.name,
                    tipo: 'CREDITO',
                    monto: montoDiferencia,
                    montoUSD: 0,
                    descripcion: `Ajuste por faltante`
                }
            ] : [
                // Sobrante: Caja aumenta, Ingreso (Diferencias) aumenta
                {
                    cuentaId: cajaAccount.id,
                    cuentaCode: cajaAccount.code,
                    cuentaName: cajaAccount.name,
                    tipo: 'DEBITO',
                    monto: montoDiferencia,
                    montoUSD: 0,
                    descripcion: `Ajuste por sobrante`
                },
                {
                    cuentaId: diferenciaAccount.id,
                    cuentaCode: diferenciaAccount.code,
                    cuentaName: diferenciaAccount.name,
                    tipo: 'CREDITO',
                    monto: montoDiferencia,
                    montoUSD: 0,
                    descripcion: `Sobrante de caja`
                }
            ];
            
            const entry = await registerAccountingEntry({
                fecha,
                descripcion: `${esFaltante ? 'Faltante' : 'Sobrante'} de caja - ${cierre.cajero}`,
                referencia,
                documentoId: cierreId,
                documentoTipo: DOCUMENT_TYPES.DIFERENCIA_CAJA,
                moduloOrigen: 'cierreCaja',
                userId,
                userEmail,
                movimientos: movimientosDiferencia,
                metadata: { 
                    tipo: esFaltante ? 'faltante' : 'sobrante', 
                    monto: montoDiferencia,
                    cajero: cierre.cajero,
                    comentario: cierre.arqueo.comentarioDiferencia
                }
            });
            movimientosGenerados.push(...entry.movimientos);
        }
    }

    // Marcar cierre como procesado
    await updateDoc(cierreRef, {
        procesado: true,
        procesadoAt: Timestamp.now(),
        procesadoBy: userId,
        movimientosContablesIds: movimientosGenerados.map(m => m.id),
        totalMovimientos: movimientosGenerados.length
    });

    return {
        success: true,
        movimientosCount: movimientosGenerados.length,
        movimientos: movimientosGenerados
    };
};

// Helper para obtener código de caja
function getCajaCode(cajaName, currency) {
    const cajaMap = {
        'Caja Granada 1': currency === 'NIO' ? '1.01.01.01' : '1.01.01.10',
        'Caja Granada 2': currency === 'NIO' ? '1.01.01.02' : '1.01.01.11',
        'Caja Ruta': currency === 'NIO' ? '1.01.01.03' : '1.01.01.12',
        'Caja Amparito': currency === 'NIO' ? '1.01.01.04' : '1.01.01.13',
        'Caja Carnes Amparito': currency === 'NIO' ? '1.01.01.04' : '1.01.01.13',
        'Caja CSM Granada': currency === 'NIO' ? '1.01.01.01' : '1.01.01.10',
    };
    return cajaMap[cajaName] || (currency === 'NIO' ? '1.01.01.01' : '1.01.01.10');
}

// ============================================
// DEPÓSITOS EN TRÁNSITO Y BANCARIOS
// ============================================

/**
 * Crea un depósito en tránsito con movimientos contables
 */
export const createDepositoTransitoERP = async (depositoData) => {
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

    // Generar número de depósito
    const depositosRef = collection(db, 'depositosTransito');
    const q = query(depositosRef, orderBy('numero', 'desc'));
    const snapshot = await getDocs(q);
    const lastNumber = snapshot.empty ? 0 : (snapshot.docs[0].data().numero || 0);
    const numero = lastNumber + 1;

    // Crear el depósito
    const deposito = {
        numero,
        fecha: fecha || new Date().toISOString().substring(0, 10),
        responsable,
        moneda,
        cuentasOrigen,
        total: Number(total),
        desgloseBilletes: desgloseBilletes || {},
        observaciones: observaciones || '',
        estado: 'pendiente',
        depositoBancarioId: null,
        movimientosContablesIds: [],
        createdAt: Timestamp.now(),
        createdBy: userId,
        createdByEmail: userEmail,
        updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(depositosRef, deposito);
    const depositoId = docRef.id;

    // Generar movimientos contables
    const accountsRef = collection(db, 'planCuentas');
    const getCuentaByCode = async (code) => {
        const q = query(accountsRef, where('code', '==', code));
        const snap = await getDocs(q);
        return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    };

    const transitoCode = moneda === 'NIO' ? '1.01.01.20' : '1.01.01.21';
    const transitoAccount = await getCuentaByCode(transitoCode);

    if (!transitoAccount) {
        throw new Error('Cuenta de tránsito no encontrada');
    }

    // Movimientos: Salida de cajas, entrada a tránsito
    const movimientos = [];
    
    for (const cuenta of cuentasOrigen) {
        movimientos.push({
            cuentaId: cuenta.accountId,
            cuentaCode: cuenta.accountCode,
            cuentaName: cuenta.accountName,
            tipo: 'CREDITO',
            monto: moneda === 'NIO' ? cuenta.monto : 0,
            montoUSD: moneda === 'USD' ? cuenta.monto : 0,
            descripcion: `Salida a depósito #${numero}`
        });
    }
    
    movimientos.push({
        cuentaId: transitoAccount.id,
        cuentaCode: transitoAccount.code,
        cuentaName: transitoAccount.name,
        tipo: 'DEBITO',
        monto: moneda === 'NIO' ? total : 0,
        montoUSD: moneda === 'USD' ? total : 0,
        descripcion: `Entrada desde cajas - Depósito #${numero}`
    });

    const entry = await registerAccountingEntry({
        fecha: deposito.fecha,
        descripcion: `Depósito en tránsito #${numero}`,
        referencia: `DEP-TRANSITO-${numero}`,
        documentoId: depositoId,
        documentoTipo: DOCUMENT_TYPES.DEPOSITO_TRANSITO,
        moduloOrigen: 'depositosTransito',
        userId,
        userEmail,
        movimientos,
        metadata: { numero, moneda, responsable }
    });

    // Actualizar depósito con referencias
    await updateDoc(doc(db, 'depositosTransito', depositoId), {
        movimientosContablesIds: entry.movimientos.map(m => m.id)
    });

    return { id: depositoId, ...deposito, movimientos: entry.movimientos };
};

/**
 * Confirma un depósito en tránsito (lo deposita en banco)
 */
export const confirmarDepositoBancarioERP = async (depositoTransitoId, confirmacionData) => {
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

    // Crear registro de depósito bancario
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
        cuentasOrigen: deposito.cuentasOrigen,
        responsable: deposito.responsable,
        createdAt: Timestamp.now(),
        createdBy: userId,
        createdByEmail: userEmail
    };

    const depositoBancarioRef = await addDoc(collection(db, 'depositosBancarios'), depositoBancario);
    const depositoBancarioId = depositoBancarioRef.id;

    // Actualizar depósito en tránsito
    await updateDoc(depositoRef, {
        estado: 'confirmado',
        depositoBancarioId,
        updatedAt: Timestamp.now()
    });

    // Generar movimientos contables
    const accountsRef = collection(db, 'planCuentas');
    const getCuentaByCode = async (code) => {
        const q = query(accountsRef, where('code', '==', code));
        const snap = await getDocs(q);
        return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    };

    const transitoCode = deposito.moneda === 'NIO' ? '1.01.01.20' : '1.01.01.21';
    const transitoAccount = await getCuentaByCode(transitoCode);
    const bancoAccount = await getCuentaByCode(bancoDestinoCode);

    if (!transitoAccount || !bancoAccount) {
        throw new Error('Cuentas contables no encontradas');
    }

    const entry = await registerAccountingEntry({
        fecha: fechaDeposito,
        descripcion: `Depósito a ${bancoDestinoName} - Ref: ${referenciaBancaria}`,
        referencia: `DEP-BANCO-${deposito.numero}`,
        documentoId: depositoBancarioId,
        documentoTipo: DOCUMENT_TYPES.DEPOSITO_BANCARIO,
        moduloOrigen: 'depositosBancarios',
        userId,
        userEmail,
        movimientos: [
            {
                cuentaId: transitoAccount.id,
                cuentaCode: transitoAccount.code,
                cuentaName: transitoAccount.name,
                tipo: 'CREDITO',
                monto: deposito.moneda === 'NIO' ? deposito.total : 0,
                montoUSD: deposito.moneda === 'USD' ? deposito.total : 0,
                descripcion: `Salida a ${bancoDestinoName}`
            },
            {
                cuentaId: bancoAccount.id,
                cuentaCode: bancoAccount.code,
                cuentaName: bancoAccount.name,
                tipo: 'DEBITO',
                monto: deposito.moneda === 'NIO' ? deposito.total : 0,
                montoUSD: deposito.moneda === 'USD' ? deposito.total : 0,
                descripcion: `Depósito desde cajas - Ref: ${referenciaBancaria}`
            }
        ],
        metadata: { numero: deposito.numero, banco: bancoDestinoName, referencia: referenciaBancaria }
    });

    // Actualizar depósito bancario con referencias
    await updateDoc(depositoBancarioRef, {
        movimientosContablesIds: entry.movimientos.map(m => m.id)
    });

    return {
        success: true,
        depositoBancarioId,
        movimientos: entry.movimientos
    };
};

// ============================================
// AJUSTES MANUALES
// ============================================

/**
 * Crea un ajuste manual pendiente de aprobación
 */
export const createAjusteManual = async (ajusteData) => {
    const {
        fecha,
        tipo,
        cuentaId,
        cuentaCode,
        cuentaName,
        tipoMovimiento,
        monto,
        montoUSD,
        cuentaContrapartidaId,
        cuentaContrapartidaCode,
        cuentaContrapartidaName,
        descripcion,
        justificacion,
        documentoSoporteURL,
        userId,
        userEmail
    } = ajusteData;

    const ajuste = {
        fecha,
        tipo, // 'saldoInicial', 'correccion', 'depreciacion', 'otro'
        
        cuentaId,
        cuentaCode,
        cuentaName,
        
        tipoMovimiento, // 'DEBITO' o 'CREDITO'
        monto: Number(monto),
        montoUSD: Number(montoUSD || 0),
        
        cuentaContrapartidaId,
        cuentaContrapartidaCode,
        cuentaContrapartidaName,
        
        descripcion,
        justificacion,
        documentoSoporteURL,
        
        estado: 'pendiente', // pendiente, aprobado, rechazado
        
        movimientosContablesIds: [],
        
        createdBy: userId,
        createdByEmail: userEmail,
        createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'ajustesManuales'), ajuste);
    return { id: docRef.id, ...ajuste };
};

/**
 * Aprueba un ajuste manual y genera movimientos contables
 */
export const aprobarAjusteManual = async (ajusteId, aprobadoPor) => {
    const ajusteRef = doc(db, 'ajustesManuales', ajusteId);
    const ajusteSnap = await getDoc(ajusteRef);
    
    if (!ajusteSnap.exists()) {
        throw new Error('Ajuste no encontrado');
    }
    
    const ajuste = ajusteSnap.data();
    
    if (ajuste.estado !== 'pendiente') {
        throw new Error('El ajuste ya fue procesado');
    }

    // Generar movimientos contables
    const entry = await registerAccountingEntry({
        fecha: ajuste.fecha,
        descripcion: ajuste.descripcion,
        referencia: `AJUSTE-${ajusteId}`,
        documentoId: ajusteId,
        documentoTipo: DOCUMENT_TYPES.AJUSTE_MANUAL,
        moduloOrigen: 'ajustesManuales',
        userId: ajuste.createdBy,
        userEmail: ajuste.createdByEmail,
        movimientos: [
            {
                cuentaId: ajuste.cuentaId,
                cuentaCode: ajuste.cuentaCode,
                cuentaName: ajuste.cuentaName,
                tipo: ajuste.tipoMovimiento,
                monto: ajuste.monto,
                montoUSD: ajuste.montoUSD,
                descripcion: ajuste.descripcion
            },
            {
                cuentaId: ajuste.cuentaContrapartidaId,
                cuentaCode: ajuste.cuentaContrapartidaCode,
                cuentaName: ajuste.cuentaContrapartidaName,
                tipo: ajuste.tipoMovimiento === 'DEBITO' ? 'CREDITO' : 'DEBITO',
                monto: ajuste.monto,
                montoUSD: ajuste.montoUSD,
                descripcion: `Contrapartida - ${ajuste.descripcion}`
            }
        ],
        metadata: { tipo: ajuste.tipo, justificacion: ajuste.justificacion }
    });

    // Actualizar ajuste
    await updateDoc(ajusteRef, {
        estado: 'aprobado',
        aprobadoPor,
        aprobadoAt: Timestamp.now(),
        movimientosContablesIds: entry.movimientos.map(m => m.id)
    });

    return { success: true, movimientos: entry.movimientos };
};

/**
 * Rechaza un ajuste manual
 */
export const rechazarAjusteManual = async (ajusteId, motivo, rechazadoPor) => {
    const ajusteRef = doc(db, 'ajustesManuales', ajusteId);
    
    await updateDoc(ajusteRef, {
        estado: 'rechazado',
        motivoRechazo: motivo,
        rechazadoPor,
        rechazadoAt: Timestamp.now()
    });

    return { success: true };
};

// ============================================
// REPORTES CONTABLES
// ============================================

/**
 * Obtiene el Estado de Resultados (Ingresos - Costos - Gastos)
 */
export const getEstadoResultados = async (fechaDesde, fechaHasta) => {
    // Obtener movimientos del período
    const movimientos = await getMovimientosContables({ fechaDesde, fechaHasta });
    
    // Agrupar por tipo de cuenta
    const ingresos = { total: 0, detalle: [] };
    const costos = { total: 0, detalle: [] };
    const gastos = { total: 0, detalle: [] };
    
    for (const mov of movimientos) {
        const accountSnap = await getDoc(doc(db, 'planCuentas', mov.accountId));
        if (!accountSnap.exists()) continue;
        
        const cuenta = accountSnap.data();
        
        if (cuenta.type === 'INGRESO' && mov.type === 'CREDITO') {
            ingresos.total += mov.monto;
            ingresos.detalle.push({ cuenta: cuenta.name, monto: mov.monto });
        } else if (cuenta.type === 'COSTO' && mov.type === 'DEBITO') {
            costos.total += mov.monto;
            costos.detalle.push({ cuenta: cuenta.name, monto: mov.monto });
        } else if (cuenta.type === 'GASTO' && mov.type === 'DEBITO') {
            gastos.total += mov.monto;
            gastos.detalle.push({ cuenta: cuenta.name, monto: mov.monto });
        }
    }
    
    const utilidadBruta = ingresos.total - costos.total;
    const utilidadNeta = utilidadBruta - gastos.total;
    
    return {
        fechaDesde,
        fechaHasta,
        ingresos,
        costos,
        gastos,
        utilidadBruta,
        utilidadNeta
    };
};

/**
 * Obtiene el Balance General (Activos = Pasivos + Capital)
 */
export const getBalanceGeneral = async (fecha) => {
    const accountsRef = collection(db, 'planCuentas');
    const q = query(accountsRef, where('isActive', '==', true), where('isGroup', '==', false));
    const snapshot = await getDocs(q);
    
    const activos = { total: 0, cuentas: [] };
    const pasivos = { total: 0, cuentas: [] };
    const capital = { total: 0, cuentas: [] };
    
    for (const doc of snapshot.docs) {
        const cuenta = { id: doc.id, ...doc.data() };
        
        if (cuenta.type === 'ACTIVO') {
            activos.total += cuenta.balance || 0;
            activos.cuentas.push(cuenta);
        } else if (cuenta.type === 'PASIVO') {
            pasivos.total += cuenta.balance || 0;
            pasivos.cuentas.push(cuenta);
        } else if (cuenta.type === 'CAPITAL') {
            capital.total += cuenta.balance || 0;
            capital.cuentas.push(cuenta);
        }
    }
    
    const patrimonio = activos.total - pasivos.total;
    
    return {
        fecha,
        activos,
        pasivos,
        capital,
        patrimonio,
        cuadra: Math.abs(activos.total - (pasivos.total + capital.total)) < 0.01
    };
};

// ============================================
// EXPORT
// ============================================

export default {
    // Constantes
    DOCUMENT_TYPES,
    ACCOUNT_NATURE,
    ACCOUNT_TYPES,
    
    // Movimientos contables base
    registerAccountingEntry,
    getMovimientosContables,
    getHistorialCuenta,
    
    // Cierre de Caja ERP
    createCierreCajaERP,
    updateCierreCajaERPStatus,
    procesarCierreCajaERP,
    
    // Depósitos
    createDepositoTransitoERP,
    confirmarDepositoBancarioERP,
    
    // Ajustes
    createAjusteManual,
    aprobarAjusteManual,
    rechazarAjusteManual,
    
    // Reportes
    getEstadoResultados,
    getBalanceGeneral
};