# FinanzasApp - Sistema Administrativo Completo

Aplicación de gestión financiera con módulo contable integrado.

## 📦 Contenido

Este paquete incluye:

### Módulos Originales
- **DataEntry** - Registro de ingresos, gastos, inventario, compras, presupuestos
- **GastosDiarios** - Módulo de caja diaria standalone
- **BankReconciliation** - Conciliación bancaria
- **AccountsPayable** - Cuentas por pagar
- **Reports** - Reportes financieros
- **CategoryManager** - Gestión de categorías

### Nuevos Módulos Financieros
- **DashboardFinanciero** - Dashboard con saldos y KPIs
- **ChartOfAccounts** - Plan de cuentas contable
- **CierreCaja** - Cierre de caja manual basado en SICAR
- **DepositosTransito** - Depósitos en tránsito con ticket 80mm
- **ConfirmacionDeposito** - Confirmación de depósitos bancarios

## 🚀 Instalación

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar Firebase
Edita `src/firebase.js` con tus credenciales:
```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "XXXXX",
  appId: "TU_APP_ID"
};
```

### Paso 3: Iniciar el servidor de desarrollo
```bash
npm run dev
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── ChartOfAccounts.jsx      # Plan de cuentas
│   ├── CierreCaja.jsx           # Cierre de caja
│   ├── ConfirmacionDeposito.jsx # Confirmación de depósitos
│   ├── DashboardFinanciero.jsx  # Dashboard financiero
│   ├── DepositosTransito.jsx    # Depósitos en tránsito
│   ├── DataEntry.jsx            # Registro de datos
│   ├── GastosDiarios.jsx        # Gastos diarios
│   ├── BankReconciliation.jsx   # Conciliación bancaria
│   ├── AccountsPayable.jsx      # Cuentas por pagar
│   ├── Reports.jsx              # Reportes
│   ├── CategoryManager.jsx      # Categorías
│   ├── Header.jsx               # Navegación
│   ├── Login.jsx                # Login
│   └── PrivateRoute.jsx         # Protección de rutas
├── context/
│   └── AuthContext.jsx          # Autenticación
├── hooks/
│   └── useAccounting.js         # Hooks contables
├── services/
│   └── accountingService.js     # Lógica de negocio
├── firebase.js                  # Configuración Firebase
├── constants.js                 # Constantes
├── App.jsx                      # Rutas principales
└── main.jsx                     # Punto de entrada
```

## 🔐 Roles de Usuario

| Módulo | Admin | Contabilidad | Cajero |
|--------|-------|--------------|--------|
| Dashboard Financiero | ✅ | ✅ | ✅ |
| Plan de Cuentas | ✅ | ✅ | ❌ |
| Cierre de Caja | ✅ | ❌ | ✅ |
| Depósitos en Tránsito | ✅ | ✅ | ❌ |
| Confirmar Depósito | ✅ | ✅ | ❌ |
| Data Entry | ✅ | ❌ | ❌ |
| Gastos Diarios | ✅ | ❌ | ✅ |
| Cuentas por Pagar | ✅ | ✅ | ✅ |

## 📊 Colecciones Firestore Necesarias

- `ingresos`
- `gastos`
- `categorias`
- `branches`
- `inventarios`
- `compras`
- `presupuestos`
- `cuentas_por_pagar`
- `accountspayable`
- `abonos_pagar`
- `proveedores`
- `cuentasPorCobrar`
- `patrimonio`
- `gastosDiarios`
- `bank_statements`
- **Nuevas:**
  - `planCuentas`
  - `movimientosCuentas`
  - `cierresCaja`
  - `depositosTransito`
  - `depositosBancarios`

## 📝 Notas

- El sistema está preparado para crecer hacia contabilidad formal
- Soporta múltiples monedas (C$ y USD)
- Tickets de 80mm optimizados para impresoras térmicas
- Trazabilidad completa de movimientos

## ⚠️ Configuración Inicial

Después de la primera instalación, ejecuta en la consola del navegador:

```javascript
import { initializeChartOfAccounts } from './src/services/accountingService';
await initializeChartOfAccounts();
```

Esto creará el plan de cuentas base.

---

**Desarrollado para FinanzasApp - 2024**
