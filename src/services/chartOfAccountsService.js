// src/services/chartOfAccountsService.js
// Servicio para gestión del Plan Contable NIC

import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    where,
    Timestamp,
    onSnapshot,
    getDoc
} from 'firebase/firestore';

const ACCOUNTS_COLLECTION = 'planCuentas';

// ============================================
// CATÁLOGO NIC COMPLETO (80+ CUENTAS)
// ============================================

export const NIC_CHART_OF_ACCOUNTS = [
    // ============================================
    // CLASE 1: ACTIVOS (1.00.00.00)
    // ============================================
    
    // ACTIVOS CORRIENTES (1.01.00.00)
    { code: '1.01.01.01', name: 'Caja General', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.01.02', name: 'Caja Chica', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.01.03', name: 'Bancos', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: true, nature: 'deudora', nicStandard: true },
    { code: '1.01.02.01', name: 'Banco BAC Córdobas', type: 'ACTIVO', subType: 'banco', level: 4, isGroup: false, nature: 'deudora', parentCode: '1.01.01.03', nicStandard: true },
    { code: '1.01.02.02', name: 'Banco BAC Dólares', type: 'ACTIVO', subType: 'banco', level: 4, isGroup: false, nature: 'deudora', parentCode: '1.01.01.03', nicStandard: true },
    { code: '1.01.02.03', name: 'Banco Banpro Córdobas', type: 'ACTIVO', subType: 'banco', level: 4, isGroup: false, nature: 'deudora', parentCode: '1.01.01.03', nicStandard: true },
    { code: '1.01.02.04', name: 'Banco Banpro Dólares', type: 'ACTIVO', subType: 'banco', level: 4, isGroup: false, nature: 'deudora', parentCode: '1.01.01.03', nicStandard: true },
    { code: '1.01.02.05', name: 'Banco Lafise Córdobas', type: 'ACTIVO', subType: 'banco', level: 4, isGroup: false, nature: 'deudora', parentCode: '1.01.01.03', nicStandard: true },
    { code: '1.01.02.06', name: 'Banco Lafise Dólares', type: 'ACTIVO', subType: 'banco', level: 4, isGroup: false, nature: 'deudora', parentCode: '1.01.01.03', nicStandard: true },
    
    // INVERSIONES TEMPORALES (1.01.03.00)
    { code: '1.01.03.01', name: 'Inversiones Temporales', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.03.02', name: 'Documentos por Cobrar Corto Plazo', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // CUENTAS POR COBRAR (1.01.04.00)
    { code: '1.01.04.01', name: 'Clientes', type: 'ACTIVO', subType: 'cxc', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.04.02', name: 'Documentos por Cobrar', type: 'ACTIVO', subType: 'cxc', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.04.03', name: 'Deudores Varios', type: 'ACTIVO', subType: 'cxc', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.04.04', name: 'Anticipo a Proveedores', type: 'ACTIVO', subType: 'cxc', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.04.05', name: 'Anticipo a Empleados', type: 'ACTIVO', subType: 'cxc', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.04.06', name: 'Estimación de Cuentas Incobrables', type: 'ACTIVO', subType: 'cxc', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // INVENTARIOS (1.01.05.00)
    { code: '1.01.05.01', name: 'Inventario de Mercancías', type: 'ACTIVO', subType: 'inventario', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.05.02', name: 'Inventario de Materia Prima', type: 'ACTIVO', subType: 'inventario', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.05.03', name: 'Inventario de Productos en Proceso', type: 'ACTIVO', subType: 'inventario', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.05.04', name: 'Inventario de Productos Terminados', type: 'ACTIVO', subType: 'inventario', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.05.05', name: 'Estimación de Obsolescencia', type: 'ACTIVO', subType: 'inventario', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // GASTOS PAGADOS POR ANTICIPADO (1.01.06.00)
    { code: '1.01.06.01', name: 'Seguros Pagados por Anticipado', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.06.02', name: 'Alquileres Pagados por Anticipado', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.06.03', name: 'Publicidad Pagada por Anticipado', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.06.04', name: 'Otros Gastos Pagados por Anticipado', type: 'ACTIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // IMPUESTOS (1.01.07.00)
    { code: '1.01.07.01', name: 'IVA Crédito Fiscal', type: 'ACTIVO', subType: 'impuesto', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.07.02', name: 'Impuestos por Recuperar', type: 'ACTIVO', subType: 'impuesto', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.01.07.03', name: 'Retenciones por Recuperar', type: 'ACTIVO', subType: 'impuesto', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // ACTIVOS NO CORRIENTES (1.02.00.00)
    { code: '1.02.01.01', name: 'Inversiones Permanentes', type: 'ACTIVO', subType: 'no_corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.01.02', name: 'Documentos por Cobrar Largo Plazo', type: 'ACTIVO', subType: 'no_corriente', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // PROPIEDAD PLANTA Y EQUIPO (1.02.02.00)
    { code: '1.02.02.01', name: 'Terrenos', type: 'ACTIVO', subType: 'fijo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.02.02', name: 'Edificios', type: 'ACTIVO', subType: 'fijo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.02.03', name: 'Mobiliario y Equipo de Oficina', type: 'ACTIVO', subType: 'fijo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.02.04', name: 'Equipo de Transporte', type: 'ACTIVO', subType: 'fijo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.02.05', name: 'Equipo de Computación', type: 'ACTIVO', subType: 'fijo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.02.06', name: 'Maquinaria y Equipo', type: 'ACTIVO', subType: 'fijo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.02.07', name: 'Depreciación Acumulada', type: 'ACTIVO', subType: 'fijo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // ACTIVOS INTANGIBLES (1.02.03.00)
    { code: '1.02.03.01', name: 'Marcas y Patentes', type: 'ACTIVO', subType: 'intangible', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.03.02', name: 'Derechos de Autor', type: 'ACTIVO', subType: 'intangible', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.03.03', name: 'Software', type: 'ACTIVO', subType: 'intangible', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '1.02.03.04', name: 'Amortización Acumulada', type: 'ACTIVO', subType: 'intangible', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // ============================================
    // CLASE 2: PASIVOS (2.00.00.00)
    // ============================================
    
    // PASIVOS CORRIENTES (2.01.00.00)
    { code: '2.01.01.01', name: 'Proveedores', type: 'PASIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.01.02', name: 'Documentos por Pagar', type: 'PASIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.01.03', name: 'Acreedores Varios', type: 'PASIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.01.04', name: 'Anticipos de Clientes', type: 'PASIVO', subType: 'corriente', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // OBLIGACIONES LABORALES (2.01.02.00)
    { code: '2.01.02.01', name: 'Sueldos por Pagar', type: 'PASIVO', subType: 'laboral', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.02.02', name: 'Vacaciones por Pagar', type: 'PASIVO', subType: 'laboral', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.02.03', name: 'Aguinaldo por Pagar', type: 'PASIVO', subType: 'laboral', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.02.04', name: 'Indemnizaciones por Pagar', type: 'PASIVO', subType: 'laboral', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.02.05', name: 'INSS por Pagar', type: 'PASIVO', subType: 'laboral', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.02.06', name: 'IR por Pagar', type: 'PASIVO', subType: 'laboral', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // IMPUESTOS POR PAGAR (2.01.03.00)
    { code: '2.01.03.01', name: 'IVA Débito Fiscal', type: 'PASIVO', subType: 'impuesto', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.03.02', name: 'IR Corriente por Pagar', type: 'PASIVO', subType: 'impuesto', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.03.03', name: 'IR Diferido por Pagar', type: 'PASIVO', subType: 'impuesto', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.03.04', name: 'Alcaldía por Pagar', type: 'PASIVO', subType: 'impuesto', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.03.05', name: 'DGI por Pagar', type: 'PASIVO', subType: 'impuesto', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // OBLIGACIONES FINANCIERAS (2.01.04.00)
    { code: '2.01.04.01', name: 'Préstamos Bancarios Corto Plazo', type: 'PASIVO', subType: 'financiero', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.04.02', name: 'Intereses por Pagar', type: 'PASIVO', subType: 'financiero', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.04.03', name: 'Dividendos por Pagar', type: 'PASIVO', subType: 'financiero', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // PROVISIONES (2.01.05.00)
    { code: '2.01.05.01', name: 'Provisiones Legales', type: 'PASIVO', subType: 'provision', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.01.05.02', name: 'Provisiones por Garantías', type: 'PASIVO', subType: 'provision', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // PASIVOS NO CORRIENTES (2.02.00.00)
    { code: '2.02.01.01', name: 'Préstamos Bancarios Largo Plazo', type: 'PASIVO', subType: 'no_corriente', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.02.01.02', name: 'Obligaciones Emitidas', type: 'PASIVO', subType: 'no_corriente', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '2.02.01.03', name: 'Documentos por Pagar Largo Plazo', type: 'PASIVO', subType: 'no_corriente', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // ============================================
    // CLASE 3: PATRIMONIO (3.00.00.00)
    // ============================================
    
    { code: '3.01.01.01', name: 'Capital Social', type: 'PATRIMONIO', subType: 'capital', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '3.01.01.02', name: 'Aportes Adicionales', type: 'PATRIMONIO', subType: 'capital', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '3.01.02.01', name: 'Reserva Legal', type: 'PATRIMONIO', subType: 'reserva', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '3.01.02.02', name: 'Reserva Facultativa', type: 'PATRIMONIO', subType: 'reserva', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '3.01.02.03', name: 'Reserva de Revaluación', type: 'PATRIMONIO', subType: 'reserva', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '3.01.03.01', name: 'Resultados del Ejercicio', type: 'PATRIMONIO', subType: 'resultado', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '3.01.03.02', name: 'Resultados Acumulados', type: 'PATRIMONIO', subType: 'resultado', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '3.01.03.03', name: 'Pérdidas del Ejercicio', type: 'PATRIMONIO', subType: 'resultado', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // ============================================
    // CLASE 4: INGRESOS (4.00.00.00)
    // ============================================
    
    { code: '4.01.01.01', name: 'Ventas de Mercancías', type: 'INGRESO', subType: 'operativo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '4.01.01.02', name: 'Ventas de Productos Terminados', type: 'INGRESO', subType: 'operativo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '4.01.01.03', name: 'Ventas de Servicios', type: 'INGRESO', subType: 'operativo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '4.01.01.04', name: 'Descuentos sobre Ventas', type: 'INGRESO', subType: 'operativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '4.01.01.05', name: 'Devoluciones sobre Ventas', type: 'INGRESO', subType: 'operativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    { code: '4.02.01.01', name: 'Ingresos Financieros', type: 'INGRESO', subType: 'no_operativo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '4.02.01.02', name: 'Ingresos por Arrendamiento', type: 'INGRESO', subType: 'no_operativo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '4.02.01.03', name: 'Ingresos por Comisiones', type: 'INGRESO', subType: 'no_operativo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '4.02.01.04', name: 'Dividendos Recibidos', type: 'INGRESO', subType: 'no_operativo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    { code: '4.02.01.05', name: 'Utilidad en Venta de Activos', type: 'INGRESO', subType: 'no_operativo', level: 4, isGroup: false, nature: 'acreedora', nicStandard: true },
    
    // ============================================
    // CLASE 5: GASTOS Y COSTOS (5.00.00.00)
    // ============================================
    
    // COSTOS DE VENTAS (5.01.00.00)
    { code: '5.01.01.01', name: 'Costo de Mercancías Vendidas', type: 'COSTO', subType: 'costo_ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.01.01.02', name: 'Costo de Producción', type: 'COSTO', subType: 'costo_ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.01.01.03', name: 'Mano de Obra Directa', type: 'COSTO', subType: 'costo_ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.01.01.04', name: 'Materia Prima Directa', type: 'COSTO', subType: 'costo_ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.01.01.05', name: 'Costos Indirectos de Fabricación', type: 'COSTO', subType: 'costo_ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // GASTOS OPERATIVOS - ADMINISTRATIVOS (5.02.01.00)
    { code: '5.02.01.01', name: 'Sueldos y Salarios Administrativos', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.02', name: 'Honorarios Profesionales', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.03', name: 'Alquileres', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.04', name: 'Servicios Públicos', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.05', name: 'Teléfono e Internet', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.06', name: 'Papelería y Útiles de Oficina', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.07', name: 'Mantenimiento y Reparaciones', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.08', name: 'Seguros Generales', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.09', name: 'Depreciación', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.01.10', name: 'Amortización', type: 'GASTO', subType: 'administrativo', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // GASTOS OPERATIVOS - VENTAS (5.02.02.00)
    { code: '5.02.02.01', name: 'Sueldos y Salarios de Ventas', type: 'GASTO', subType: 'ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.02.02', name: 'Comisiones sobre Ventas', type: 'GASTO', subType: 'ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.02.03', name: 'Publicidad y Propaganda', type: 'GASTO', subType: 'ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.02.04', name: 'Transporte y Flete', type: 'GASTO', subType: 'ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.02.05', name: 'Combustible', type: 'GASTO', subType: 'ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.02.06', name: 'Viáticos y Gastos de Viaje', type: 'GASTO', subType: 'ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.02.02.07', name: 'Gastos de Representación', type: 'GASTO', subType: 'ventas', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // GASTOS FINANCIEROS (5.03.01.00)
    { code: '5.03.01.01', name: 'Intereses Bancarios', type: 'GASTO', subType: 'financiero', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.03.01.02', name: 'Comisiones Bancarias', type: 'GASTO', subType: 'financiero', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.03.01.03', name: 'Gastos por Diferencia Cambiaria', type: 'GASTO', subType: 'financiero', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.03.01.04', name: 'Descuentos Otorgados', type: 'GASTO', subType: 'financiero', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    
    // OTROS GASTOS (5.04.01.00)
    { code: '5.04.01.01', name: 'Pérdida en Venta de Activos', type: 'GASTO', subType: 'otros', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.04.01.02', name: 'Gastos Extraordinarios', type: 'GASTO', subType: 'otros', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
    { code: '5.04.01.03', name: 'Impuesto sobre la Renta', type: 'GASTO', subType: 'otros', level: 4, isGroup: false, nature: 'deudora', nicStandard: true },
];

// ============================================
// FUNCIONES DEL SERVICIO
// ============================================

/**
 * Inicializa el plan contable NIC si la colección está vacía
 * NO borra datos existentes
 */
export const initializeNICChartOfAccounts = async () => {
    try {
        const q = query(collection(db, ACCOUNTS_COLLECTION));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log('Inicializando plan contable NIC...');
            
            for (const account of NIC_CHART_OF_ACCOUNTS) {
                await addDoc(collection(db, ACCOUNTS_COLLECTION), {
                    ...account,
                    balance: 0,
                    active: true,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
            }
            
            console.log(`Plan contable NIC inicializado: ${NIC_CHART_OF_ACCOUNTS.length} cuentas`);
            return { success: true, count: NIC_CHART_OF_ACCOUNTS.length };
        } else {
            console.log('Plan contable ya existe, no se inicializa NIC');
            return { success: true, count: snapshot.size, existing: true };
        }
    } catch (error) {
        console.error('Error inicializando plan contable NIC:', error);
        throw error;
    }
};

/**
 * Obtiene todas las cuentas activas
 */
export const getAccounts = async () => {
    try {
        const q = query(
            collection(db, ACCOUNTS_COLLECTION),
            orderBy('code', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(account => account.active !== false);
    } catch (error) {
        console.error('Error obteniendo cuentas:', error);
        throw error;
    }
};

/**
 * Crea una nueva cuenta (personalizada)
 */
export const createAccount = async (accountData) => {
    try {
        // Verificar que el código no exista
        const q = query(
            collection(db, ACCOUNTS_COLLECTION),
            where('code', '==', accountData.code)
        );
        const existing = await getDocs(q);
        
        if (!existing.empty) {
            throw new Error(`La cuenta con código ${accountData.code} ya existe`);
        }
        
        const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), {
            ...accountData,
            nicStandard: false, // Las cuentas nuevas son personalizadas
            balance: 0,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        
        return { id: docRef.id, ...accountData };
    } catch (error) {
        console.error('Error creando cuenta:', error);
        throw error;
    }
};

/**
 * Actualiza una cuenta existente
 */
export const updateAccount = async (accountId, accountData) => {
    try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
        const accountSnap = await getDoc(accountRef);
        
        if (!accountSnap.exists()) {
            throw new Error('Cuenta no encontrada');
        }
        
        const currentData = accountSnap.data();
        
        // Si es cuenta NIC, solo permitir ciertos campos editables
        if (currentData.nicStandard) {
            const allowedFields = ['name', 'active', 'description'];
            const filteredData = {};
            allowedFields.forEach(field => {
                if (accountData[field] !== undefined) {
                    filteredData[field] = accountData[field];
                }
            });
            
            await updateDoc(accountRef, {
                ...filteredData,
                updatedAt: Timestamp.now()
            });
        } else {
            // Cuenta personalizada: permitir más campos
            await updateDoc(accountRef, {
                ...accountData,
                updatedAt: Timestamp.now()
            });
        }
        
        return { id: accountId, ...accountData };
    } catch (error) {
        console.error('Error actualizando cuenta:', error);
        throw error;
    }
};

/**
 * Elimina (desactiva) una cuenta
 * Las cuentas NIC no se pueden eliminar, solo desactivar
 */
export const deleteAccount = async (accountId) => {
    try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
        const accountSnap = await getDoc(accountRef);
        
        if (!accountSnap.exists()) {
            throw new Error('Cuenta no encontrada');
        }
        
        const data = accountSnap.data();
        
        // Si es cuenta NIC con saldo, no permitir eliminar
        if (data.nicStandard && (data.balance || 0) !== 0) {
            throw new Error('No se puede eliminar una cuenta NIC con saldo. Solo se puede desactivar.');
        }
        
        // Desactivar en lugar de eliminar
        await updateDoc(accountRef, {
            active: false,
            updatedAt: Timestamp.now()
        });
        
        return true;
    } catch (error) {
        console.error('Error eliminando cuenta:', error);
        throw error;
    }
};

/**
 * Elimina permanentemente una cuenta (solo para cuentas personalizadas sin movimientos)
 */
export const permanentDeleteAccount = async (accountId) => {
    try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
        const accountSnap = await getDoc(accountRef);
        
        if (!accountSnap.exists()) {
            throw new Error('Cuenta no encontrada');
        }
        
        const data = accountSnap.data();
        
        // No permitir eliminar cuentas NIC
        if (data.nicStandard) {
            throw new Error('No se pueden eliminar permanentemente las cuentas NIC');
        }
        
        // Verificar que no tenga saldo
        if ((data.balance || 0) !== 0) {
            throw new Error('No se puede eliminar una cuenta con saldo');
        }
        
        await deleteDoc(accountRef);
        return true;
    } catch (error) {
        console.error('Error eliminando cuenta permanentemente:', error);
        throw error;
    }
};

/**
 * Suscribe a cambios en las cuentas
 */
export const subscribeToAccounts = (callback) => {
    const q = query(
        collection(db, ACCOUNTS_COLLECTION),
        orderBy('code', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const accounts = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(account => account.active !== false);
        callback(accounts);
    });
};

/**
 * Obtiene cuentas por tipo
 */
export const getAccountsByType = async (type) => {
    try {
        const q = query(
            collection(db, ACCOUNTS_COLLECTION),
            where('type', '==', type),
            orderBy('code', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(account => account.active !== false);
    } catch (error) {
        console.error('Error obteniendo cuentas por tipo:', error);
        throw error;
    }
};

/**
 * Obtiene cuentas NIC solamente
 */
export const getNICAccounts = async () => {
    try {
        const q = query(
            collection(db, ACCOUNTS_COLLECTION),
            where('nicStandard', '==', true),
            orderBy('code', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(account => account.active !== false);
    } catch (error) {
        console.error('Error obteniendo cuentas NIC:', error);
        throw error;
    }
};

/**
 * Obtiene cuentas personalizadas
 */
export const getCustomAccounts = async () => {
    try {
        const q = query(
            collection(db, ACCOUNTS_COLLECTION),
            where('nicStandard', '==', false),
            orderBy('code', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(account => account.active !== false);
    } catch (error) {
        console.error('Error obteniendo cuentas personalizadas:', error);
        throw error;
    }
};

/**
 * Genera el siguiente código disponible para una cuenta nueva
 */
export const generateNextCode = (parentCode, existingAccounts) => {
    const siblings = existingAccounts.filter(a => 
        a.parentCode === parentCode || 
        (parentCode && a.code.startsWith(parentCode))
    );
    
    if (siblings.length === 0) {
        return parentCode ? `${parentCode}.01` : '1.01.01.01';
    }
    
    const lastCode = siblings[siblings.length - 1].code;
    const parts = lastCode.split('.');
    const lastPart = parseInt(parts[parts.length - 1]) + 1;
    parts[parts.length - 1] = String(lastPart).padStart(2, '0');
    
    return parts.join('.');
};

/**
 * Obtiene información de una cuenta por código
 */
export const getAccountByCode = async (code) => {
    try {
        const q = query(
            collection(db, ACCOUNTS_COLLECTION),
            where('code', '==', code)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        console.error('Error obteniendo cuenta por código:', error);
        throw error;
    }
};

export default {
    NIC_CHART_OF_ACCOUNTS,
    initializeNICChartOfAccounts,
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    permanentDeleteAccount,
    subscribeToAccounts,
    getAccountsByType,
    getNICAccounts,
    getCustomAccounts,
    generateNextCode,
    getAccountByCode
};
