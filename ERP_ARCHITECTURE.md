# Arquitectura ERP FinanzasApp - Documento de Diseño

## 1. VISIÓN GENERAL

FinanzasApp se transforma en un ERP financiero real con el **Plan de Cuentas como núcleo central**. Todos los módulos se conectan directamente al plan contable, eliminando catálogos aislados.

## 2. PRINCIPIOS ARQUITECTÓNICOS

### 2.1 Principio Fundamental
> **"Toda transacción financiera debe tener su correspondiente asiento contable"**

### 2.2 Estructura de Cuentas (Plan de Cuentas)
```
1. ACTIVOS (naturaleza: deudora)
   1.01 Activos Corrientes
       1.01.01 Efectivo y Equivalentes
           1.01.01.01 Caja Granada 1 C$
           1.01.01.02 Caja Granada 2 C$
           1.01.01.20 Efectivo en Tránsito C$
       1.01.02 Bancos C$
           1.01.02.01 BANPRO C$
       1.01.04 POS y Transferencias Pendientes
       1.01.05 Cuentas por Cobrar
       1.01.07 Créditos a Clientes
       1.01.08 Abonos de Clientes

2. PASIVOS (naturaleza: acreedora)
   2.01 Pasivos Corrientes
       2.01.01 Cuentas por Pagar
       2.01.03 Impuestos por Pagar

3. CAPITAL (naturaleza: acreedora)
4. INGRESOS (naturaleza: acreedora)
5. COSTOS (naturaleza: deudora)
6. GASTOS (naturaleza: deudora)
```

### 2.3 Reglas de Negocio

#### Cierre de Caja
- **VALIDACIÓN OBLIGATORIA**: Total Ingreso = Efectivo + POS + Transferencias + Retenciones + Gastos
- Faltante → Registrado como gasto "Diferencias de Caja" con trazabilidad al cajero
- Sobrante → Registrado como ingreso "Diferencias de Caja"
- Facturas membretadas: CADA UNA registrada individualmente (folio, cliente, monto, moneda)

#### Depósitos en Tránsito
- Creación: Disminuye caja → Aumenta tránsito
- Confirmación: Disminuye tránsito → Aumenta banco
- Cancelación: Reversión completa con auditoría

#### Cuentas por Pagar
- Creación de factura: Aumenta proveedores (Pasivo)
- Abono: Disminuye banco/caja → Disminuye proveedores
- Cada abono registra: cuenta origen, cuenta destino, monto, referencia

## 3. MODELO DE DATOS UNIFICADO

### 3.1 Colección: planCuentas
```javascript
{
  id: string,
  code: string,           // 1.01.01.01
  name: string,
  type: 'ACTIVO' | 'PASIVO' | 'CAPITAL' | 'INGRESO' | 'COSTO' | 'GASTO',
  nature: 'deudora' | 'acreedora',
  subType: 'caja' | 'banco' | 'transito' | 'por_pagar' | 'ventas' | etc,
  parentCode: string,     // Para jerarquía
  isGroup: boolean,       // true = cuenta madre (no tiene saldo propio)
  currency: 'NIO' | 'USD',
  balance: number,        // Saldo en moneda principal
  balanceUSD: number,     // Saldo en USD
  isActive: boolean,
  // Campos de auditoría
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3.2 Colección: movimientosContables (ÚNICA FUENTE DE VERDAD)
```javascript
{
  id: string,
  // Identificación
  fecha: string,          // YYYY-MM-DD
  timestamp: Timestamp,   // Para ordenamiento exacto
  
  // Cuenta afectada
  accountId: string,
  accountCode: string,
  accountName: string,
  
  // Movimiento
  type: 'DEBITO' | 'CREDITO',
  monto: number,
  montoUSD: number,
  
  // Contexto
  descripcion: string,
  referencia: string,     // CIERRE-123, DEP-456, ABO-789
  
  // Trazabilidad ERP
  documentoId: string,    // ID del documento origen
  documentoTipo: 'cierreCaja' | 'depositoTransito' | 'depositoBancario' | 
                 'abonoCuentaPorPagar' | 'facturaCuentaPorPagar' | 
                 'ajusteManual' | 'gasto' | 'ingreso',
  
  // Cuentas relacionadas (para partida doble)
  cuentaContrapartidaId: string,
  cuentaContrapartidaCode: string,
  
  // Origen del movimiento
  moduloOrigen: string,   // 'cierreCaja', 'cuentasPagar', 'ajustes'
  
  // Auditoría
  userId: string,
  userEmail: string,
  
  // Metadatos específicos por tipo
  metadata: {
    // Para cierres
    caja?: string,
    tienda?: string,
    // Para abonos
    proveedor?: string,
    // Para diferencias
    tipoDiferencia?: 'faltante' | 'sobrante',
    cajeroResponsable?: string
  }
}
```

### 3.3 Colección: cierresCajaERP
```javascript
{
  id: string,
  // Información general
  fecha: string,
  tienda: string,
  caja: string,
  cajero: string,
  
  // Datos SICAR (simplificados)
  totalIngreso: number,           // ← CAMBIO: antes totalVentas
  
  // Créditos y abonos del día
  facturasCredito: [{
    folio: string,
    cliente: string,
    monto: number,
    moneda: 'NIO' | 'USD',
    observacion: string
  }],
  totalFacturasCredito: number,
  
  abonosRecibidos: [{
    cliente: string,
    monto: number,
    moneda: 'NIO' | 'USD',
    facturaAplicada: string
  }],
  totalAbonos: number,
  
  // Métodos de pago
  efectivoCS: number,
  efectivoUSD: number,
  tipoCambio: number,
  posBAC: number,
  posBANPRO: number,
  posLAFISE: number,
  transferenciaBAC: number,
  transferenciaBANPRO: number,
  transferenciaLAFISE: number,
  
  // Facturas membretadas INDIVIDUALES
  facturasMembretadas: [{
    folio: string,          // 001-001-000001
    cliente: string,
    monto: number,
    moneda: 'NIO' | 'USD',
    observacion: string
  }],
  
  // Tickets (solo monto total, no cantidad)
  montoTickets: number,
  
  // Retenciones
  retenciones: [{
    tipo: 'IR' | 'Alcaldia',
    monto: number,
    cliente: string,
    facturaRelacionada: string,
    cuentaContableId: string    // ← Vinculado a plan de cuentas
  }],
  totalRetenciones: number,
  
  // Gastos de caja
  gastosCaja: [{
    cuentaContableId: string,   // ← Vinculado a plan de cuentas
    cuentaContableName: string,
    concepto: string,
    monto: number,
    responsable: string,
    fotos: []
  }],
  totalGastosCaja: number,
  
  // Arqueo (opcional pero recomendado)
  arqueo: {
    efectivoContadoCS: number,
    efectivoContadoUSD: number,
    diferenciaCS: number,
    diferenciaUSD: number,
    comentarioDiferencia: string
  },
  
  // Validación del cierre
  cuadre: {
    totalIngreso: number,
    totalMediosPago: number,
    totalRetenciones: number,
    totalGastos: number,
    diferencia: number,         // Debe ser 0 para cerrar
    estaCuadrado: boolean
  },
  
  // Estado
  estado: 'borrador' | 'pendiente' | 'cerrado',
  
  // Fotos
  fotos: [],
  
  // Referencias a movimientos contables generados
  movimientosContablesIds: [string],
  
  // Auditoría
  createdAt: Timestamp,
  createdBy: string,
  cerradoAt: Timestamp,
  cerradoBy: string
}
```

### 3.4 Colección: depositosTransito
```javascript
{
  id: string,
  numero: number,
  fecha: string,
  responsable: string,
  moneda: 'NIO' | 'USD',
  
  // Cajas de origen (vinculadas a plan de cuentas)
  cuentasOrigen: [{
    accountId: string,
    accountCode: string,
    accountName: string,
    monto: number
  }],
  
  total: number,
  desgloseBilletes: {},
  
  // Observación por defecto configurable
  observaciones: string,  // "CUENTAS BANCARIAS A NOMBRE DE LUIS MANUEL SAENZ ROBLERO..."
  
  estado: 'pendiente' | 'confirmado' | 'cancelado',
  
  // Referencia al depósito bancario
  depositoBancarioId: string,
  
  // Referencias a movimientos contables
  movimientosContablesIds: [string]
}
```

### 3.5 Colección: depositosBancarios
```javascript
{
  id: string,
  depositoTransitoId: string,
  numero: number,
  fecha: string,
  hora: string,
  
  // Banco destino (vinculado a plan de cuentas)
  bancoDestinoId: string,
  bancoDestinoCode: string,
  bancoDestinoName: string,
  
  monto: number,
  moneda: 'NIO' | 'USD',
  referenciaBancaria: string,
  comprobanteURL: string,
  comentarios: string,
  
  // Origen
  cuentasOrigen: [],
  responsable: string,
  
  // Referencias a movimientos contables
  movimientosContablesIds: [string]
}
```

### 3.6 Colección: ajustesManuales
```javascript
{
  id: string,
  fecha: string,
  tipo: 'saldoInicial' | 'correccion' | 'depreciacion' | 'otro',
  
  // Cuenta afectada
  cuentaId: string,
  cuentaCode: string,
  cuentaName: string,
  
  // Movimiento
  tipoMovimiento: 'DEBITO' | 'CREDITO',
  monto: number,
  montoUSD: number,
  
  // Contrapartida
  cuentaContrapartidaId: string,
  cuentaContrapartidaCode: string,
  
  descripcion: string,
  justificacion: string,  // Por qué se hace el ajuste
  
  // Documento soporte
  documentoSoporteURL: string,
  
  // Estado de aprobación
  estado: 'pendiente' | 'aprobado' | 'rechazado',
  aprobadoPor: string,
  aprobadoAt: Timestamp,
  
  // Referencias a movimientos contables
  movimientosContablesIds: [string],
  
  // Auditoría
  createdBy: string,
  createdAt: Timestamp
}
```

## 4. FLUJOS DE MOVIMIENTOS CONTABLES

### 4.1 Cierre de Caja (Cuadrado)
```
1. Registrar efectivo en caja:
   DEBITO: 1.01.01.XX (Caja)        monto
   CREDITO: 4.01.01 (Ventas)        monto

2. Registrar facturas de crédito:
   DEBITO: 1.01.07.01 (Créditos)    monto
   CREDITO: 4.01.02 (Ventas Crédito) monto

3. Registrar abonos recibidos:
   DEBITO: 1.01.01.XX (Caja)        monto
   CREDITO: 1.01.07.01 (Créditos)   monto  (disminuye deuda)

4. Registrar POS:
   DEBITO: 1.01.04.XX (POS)         monto
   CREDITO: 4.01.01 (Ventas)        monto

5. Registrar retenciones:
   DEBITO: 4.01.01 (Ventas)         monto  (disminuye ingreso)
   CREDITO: 2.01.03.XX (Impuestos)  monto

6. Registrar gastos de caja:
   DEBITO: 6.01.02.XX (Gasto)       monto
   CREDITO: 1.01.01.XX (Caja)       monto
```

### 4.2 Cierre de Caja con Faltante
```
(Flujo normal más:)

7. Registrar faltante:
   DEBITO: 6.01.03 (Diferencias Caja)  monto
   CREDITO: 1.01.01.XX (Caja)          monto

8. Registrar gasto por responsabilidad (opcional):
   DEBITO: 1.01.05.01 (Cuentas por Cobrar - Cajero)  monto
   CREDITO: 6.01.03 (Diferencias Caja)               monto
```

### 4.3 Depósito en Tránsito
```
1. Crear depósito:
   CREDITO: 1.01.01.XX (Caja)       monto  (sale de caja)
   DEBITO: 1.01.01.20 (Tránsito)    monto  (entra a tránsito)
```

### 4.4 Confirmación de Depósito Bancario
```
1. Confirmar:
   CREDITO: 1.01.01.20 (Tránsito)   monto  (sale de tránsito)
   DEBITO: 1.01.02.XX (Banco)       monto  (entra a banco)
```

### 4.5 Cuenta por Pagar - Nueva Factura
```
1. Registrar factura:
   DEBITO: 5.01.01 (Costo) o 6.01.02.XX (Gasto)  monto
   CREDITO: 2.01.01.01 (Proveedores)             monto
```

### 4.6 Cuenta por Pagar - Abono
```
1. Registrar abono:
   DEBITO: 2.01.01.01 (Proveedores)   monto
   CREDITO: 1.01.02.XX (Banco)        monto
```

## 5. API DE SERVICIOS ERP

### 5.1 Core Service: unifiedAccountingService.js
```javascript
// Inicialización
initializeERP()

// Movimientos
registerAccountingEntry(partidaDoble)  // Registra DEBITO y CREDITO juntos
getMovements(filters)
getAccountMovements(accountId)

// Cierre de Caja ERP
createCierreCajaERP(data)
validateCierreCuadre(cierreId)
processCierreCajaERP(cierreId)

// Depósitos
createDepositoTransito(data)
confirmarDepositoBancario(depositoId, data)
cancelarDepositoTransito(depositoId, motivo)

// Ajustes Manuales
createAjusteManual(data)
aprobarAjusteManual(ajusteId)
rechazarAjusteManual(ajusteId, motivo)

// Reportes
getEstadoResultados(fechaDesde, fechaHasta)
getBalanceGeneral(fecha)
getLibroMayor(accountId, fechaDesde, fechaHasta)
getMovimientosPorModulo(modulo, fechaDesde, fechaHasta)
```

## 6. COMPONENTES REACT ERP

### 6.1 Nuevos Componentes
```
src/
├── components/
│   ├── ERP/
│   │   ├── CierreCajaERP.jsx          # Cierre con validación cuadre
│   │   ├── FacturasMembretadasList.jsx # Lista editable de facturas
│   │   ├── CuadreValidator.jsx        # Validación de cuadre en tiempo real
│   │   ├── MovimientosContables.jsx   # Historial unificado
│   │   ├── AjustesManuales.jsx        # Ajustes con aprobación
│   │   └── EstadoResultadosERP.jsx    # Reporte contable real
│   ├── Depositos/
│   │   ├── DepositosTransito.jsx      # (existente - mejorado)
│   │   └── ConfirmacionDeposito.jsx   # (fix texto + observación default)
│   └── CuentasPagar/
│       └── AccountsPayableERP.jsx     # Integración contable completa
├── hooks/
│   └── useUnifiedAccounting.js        # Hook principal ERP
└── services/
    └── unifiedAccountingService.js    # Servicio unificado
```

## 7. VALIDACIONES Y REGLAS

### 7.1 Cierre de Caja
- [ ] Total Ingreso > 0
- [ ] Cajero no vacío
- [ ] Cuadre: diferencia === 0 (para cerrar)
- [ ] Si hay diferencia → solo guardar como borrador/pendiente
- [ ] Fotos obligatorias si hay diferencia

### 7.2 Depósitos
- [ ] Al menos una cuenta origen seleccionada
- [ ] Monto total > 0
- [ ] Desglose billetes opcional pero recomendado

### 7.3 Ajustes Manuales
- [ ] Solo usuarios con rol "Contabilidad" o "Admin"
- [ ] Requiere aprobación para afectar el plan de cuentas
- [ ] Documento soporte obligatorio

## 8. SEGURIDAD Y PERMISOS

```javascript
const ROLES = {
  ADMIN: {
    canCreateAjustes: true,
    canApproveAjustes: true,
    canDeleteMovimientos: true,
    canCloseCaja: true,
    canViewAll: true
  },
  CONTABILIDAD: {
    canCreateAjustes: true,
    canApproveAjustes: true,
    canDeleteMovimientos: false,
    canCloseCaja: true,
    canViewAll: true
  },
  CAJERO: {
    canCreateAjustes: false,
    canApproveAjustes: false,
    canDeleteMovimientos: false,
    canCloseCaja: true,  // Solo sus cierres
    canViewAll: false    // Solo sus registros
  },
  LIMITADO: {
    canCreateAjustes: false,
    canApproveAjustes: false,
    canDeleteMovimientos: false,
    canCloseCaja: false,
    canViewAll: false
  }
}
```

## 9. MIGRACIÓN DE DATOS

### Estrategia
1. Mantener colecciones existentes (ingresos, gastos, etc.)
2. Crear nuevas colecciones ERP (cierresCajaERP, movimientosContables)
3. Script de migración para crear movimientos contables históricos
4. Plan de cuentas: inicializar con cuentas base

## 10. IMPLEMENTACIÓN POR FASES

### Fase 1: Core (Semana 1)
- [ ] unifiedAccountingService.js
- [ ] useUnifiedAccounting.js
- [ ] MovimientosContables.jsx

### Fase 2: Cierre de Caja ERP (Semana 1-2)
- [ ] CierreCajaERP.jsx con facturas individuales
- [ ] CuadreValidator
- [ ] Integración con movimientos contables

### Fase 3: Depósitos y Ajustes (Semana 2)
- [ ] Fix ConfirmacionDeposito
- [ ] AjustesManuales.jsx
- [ ] Flujo de aprobación

### Fase 4: Reportes (Semana 3)
- [ ] EstadoResultadosERP
- [ ] BalanceGeneralERP
- [ ] LibroMayor

### Fase 5: Integración y Pruebas (Semana 3-4)
- [ ] Integración completa
- [ ] Pruebas end-to-end
- [ ] Documentación usuario final
