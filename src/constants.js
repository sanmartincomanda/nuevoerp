// src/constants.js
// Constantes globales del ERP Distribuidoras SR

// ============================================
// SUCURSALES - Se cargan dinámicamente desde Firebase
// Usar el hook useBranches() o el servicio branchesService
// ============================================

// Sucursales por defecto (se usan solo para inicialización)
export const DEFAULT_BRANCHES = [
    { id: 'carnes_amparito', name: 'Carnes Amparito', code: 'AMP' },
    { id: 'csm_granada', name: 'CSM Granada', code: 'CSM-GRA' },
    { id: 'csm_masaya', name: 'CSM Masaya', code: 'CSM-MAS' },
    { id: 'csm_nindiri', name: 'CSM Nindirí', code: 'CSM-NIN' },
    { id: 'cedi', name: 'CEDI', code: 'CEDI' },
    { id: 'csm_granada_inmaculada', name: 'CSM Granada Inmaculada', code: 'CSM-GRA-INM' },
];

// Función para obtener el nombre de una sucursal por su ID
// @param branches - Array de sucursales del hook useBranches()
// @param branchId - ID o código de la sucursal
export const getBranchName = (branches, branchId) => {
    if (!branches || !branchId) return 'Sucursal no especificada';
    const branch = branches.find(b => b.id === branchId || b.code === branchId);
    return branch ? branch.name : branchId;
};

// Función para obtener el código de una sucursal por su ID
export const getBranchCode = (branches, branchId) => {
    if (!branches || !branchId) return '';
    const branch = branches.find(b => b.id === branchId || b.code === branchId);
    return branch ? branch.code : branchId;
};

// ============================================
// FORMATO DE NÚMEROS
// ============================================

// Formatear número con separadores de miles y decimales
export const fmt = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('es-NI', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

// Formatear moneda (Córdobas)
export const fmtMoney = (value) => {
    return `C$ ${fmt(value)}`;
};

// Formatear porcentaje
export const fmtPercent = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return `${value.toFixed(decimals)}%`;
};

// ============================================
// FECHAS
// ============================================

// Obtener mes actual en formato YYYY-MM
export const getCurrentMonth = () => {
    return new Date().toISOString().substring(0, 7);
};

// Formatear fecha para mostrar
export const fmtDate = (date) => {
    if (!date) return '';
    if (date.toDate) {
        // Firebase Timestamp
        return date.toDate().toLocaleDateString('es-ES');
    }
    if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('es-ES');
    }
    return date.toLocaleDateString('es-ES');
};

// ============================================
// COLORES Y ESTILOS
// ============================================

export const COLORS = {
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    success: '#10b981',
    successLight: '#34d399',
    danger: '#ef4444',
    dangerLight: '#f87171',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    info: '#06b6d4',
    purple: '#8b5cf6',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
    slate: '#64748b',
    slateDark: '#334155',
    slateLight: '#94a3b8'
};

// ============================================
// CATEGORÍAS DE GASTOS
// ============================================

export const EXPENSE_CATEGORIES = [
    'Nómina',
    'Alquiler',
    'Servicios Públicos',
    'Marketing',
    'Mantenimiento',
    'Transporte',
    'Suministros',
    'Otros'
];

// ============================================
// MÉTODOS DE PAGO
// ============================================

export const PAYMENT_METHODS = [
    { value: 'efectivo', label: 'Efectivo', icon: 'cash' },
    { value: 'tarjeta', label: 'Tarjeta', icon: 'creditCard' },
    { value: 'transferencia', label: 'Transferencia', icon: 'transfer' },
    { value: 'cheque', label: 'Cheque', icon: 'fileText' },
    { value: 'deposito', label: 'Depósito', icon: 'bank' }
];

// ============================================
// MONEDAS
// ============================================

export const CURRENCIES = [
    { code: 'NIO', name: 'Córdobas (C$)', symbol: 'C$' },
    { code: 'USD', name: 'Dólares ($)', symbol: '$' }
];

// ============================================
// ESTADOS DE FACTURAS
// ============================================

export const INVOICE_STATUS = {
    PENDIENTE: 'pendiente',
    PARCIAL: 'parcial',
    PAGADA: 'pagada',
    VENCIDA: 'vencida'
};

export const INVOICE_STATUS_LABELS = {
    [INVOICE_STATUS.PENDIENTE]: 'Pendiente',
    [INVOICE_STATUS.PARCIAL]: 'Abono Parcial',
    [INVOICE_STATUS.PAGADA]: 'Pagada',
    [INVOICE_STATUS.VENCIDA]: 'Vencida'
};

// ============================================
// CONFIGURACIÓN DE PAGINACIÓN
// ============================================

export const PAGINATION = {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100]
};

// ============================================
// ROLES DE USUARIO
// ============================================

export const USER_ROLES = {
    ADMIN: 'admin',
    CONTABILIDAD: 'contabilidad',
    CAJERO: 'cajero',
    VENDEDOR: 'vendedor',
    CONSULTA: 'consulta'
};

// ============================================
// TIPOS DE MOVIMIENTOS CONTABLES
// ============================================

export const MOVEMENT_TYPES = {
    VENTA: 'venta',
    GASTO: 'gasto',
    INGRESO: 'ingreso',
    INVENTARIO_INICIAL: 'inventario_inicial',
    INVENTARIO_FINAL: 'inventario_final',
    PRESUPUESTO: 'presupuesto',
    CIERRE_CAJA: 'cierre_caja',
    FACTURA_PROVEEDOR: 'factura_proveedor',
    ABONO_PROVEEDOR: 'abono_proveedor',
    VENTA_MANUAL: 'venta_manual',
    AJUSTE: 'ajuste'
};

// ============================================
// CAMPOS REQUERIDOS POR TIPO DE MOVIMIENTO
// ============================================

export const REQUIRED_FIELDS = {
    [MOVEMENT_TYPES.VENTA]: ['sucursal', 'monto', 'fecha', 'cuentaContableId'],
    [MOVEMENT_TYPES.GASTO]: ['sucursal', 'monto', 'fecha', 'cuentaContableId'],
    [MOVEMENT_TYPES.INGRESO]: ['sucursal', 'monto', 'fecha', 'cuentaContableId'],
    [MOVEMENT_TYPES.INVENTARIO_INICIAL]: ['sucursal', 'month', 'amount'],
    [MOVEMENT_TYPES.INVENTARIO_FINAL]: ['sucursal', 'month', 'amount'],
    [MOVEMENT_TYPES.PRESUPUESTO]: ['month', 'category', 'amount'],
    [MOVEMENT_TYPES.CIERRE_CAJA]: ['sucursal', 'fecha', 'monto'],
    [MOVEMENT_TYPES.FACTURA_PROVEEDOR]: ['sucursal', 'proveedor', 'monto', 'fecha'],
    [MOVEMENT_TYPES.ABONO_PROVEEDOR]: ['sucursal', 'proveedor', 'monto'],
    [MOVEMENT_TYPES.VENTA_MANUAL]: ['sucursal', 'monto', 'fecha', 'cuentaContableId'],
};

export default {
    DEFAULT_BRANCHES,
    getBranchName,
    getBranchCode,
    fmt,
    fmtMoney,
    fmtPercent,
    getCurrentMonth,
    fmtDate,
    COLORS,
    EXPENSE_CATEGORIES,
    PAYMENT_METHODS,
    CURRENCIES,
    INVOICE_STATUS,
    INVOICE_STATUS_LABELS,
    PAGINATION,
    USER_ROLES,
    MOVEMENT_TYPES,
    REQUIRED_FIELDS
};
