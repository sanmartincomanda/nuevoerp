 // src/services/nicCatalogService.js
// Catálogo Contable NIC (Normas Internacionales de Contabilidad) - Estándar Completo
// Compatible con NIIF y PCN (Plan Contable Nicaragüense)

import { db } from '../firebase';
import { 
    collection, 
    getDocs, 
    addDoc, 
    Timestamp, 
    query, 
    where,
    doc,
    getDoc,
    setDoc
} from 'firebase/firestore';

// ==========================================
// CATÁLOGO NIC ESTÁNDAR COMPLETO
// ==========================================

export const NIC_CATALOG = {
    ACTIVOS: {
        code: '1',
        name: 'ACTIVOS',
        nature: 'debit',
        subTypes: [
            { value: 'disponible', label: 'Disponibles (Efectivo y Bancos)', code: '1.1' },
            { value: 'inversiones', label: 'Inversiones Temporales', code: '1.2' },
            { value: 'clientes', label: 'Cuentas por Cobrar', code: '1.3' },
            { value: 'inventarios', label: 'Inventarios', code: '1.4' },
            { value: 'prepago', label: 'Gastos Pagados por Anticipado', code: '1.5' },
            { value: 'propiedad', label: 'Propiedad, Planta y Equipo', code: '1.6' },
            { value: 'intangibles', label: 'Activos Intangibles', code: '1.7' },
            { value: 'diferidos', label: 'Activos Diferidos', code: '1.8' },
            { value: 'otros_activos', label: 'Otros Activos', code: '1.9' }
        ]
    },
    PASIVOS: {
        code: '2',
        name: 'PASIVOS',
        nature: 'credit',
        subTypes: [
            { value: 'obligaciones', label: 'Obligaciones con Bancos', code: '2.1' },
            { value: 'proveedores', label: 'Proveedores y Acreedores', code: '2.2' },
            { value: 'impuestos', label: 'Impuestos por Pagar', code: '2.3' },
            { value: 'laborales', label: 'Obligaciones Laborales', code: '2.4' },
            { value: 'provisiones', label: 'Provisiones', code: '2.5' },
            { value: 'diferidos', label: 'Pasivos Diferidos', code: '2.6' },
            { value: 'largo_plazo', label: 'Pasivos a Largo Plazo', code: '2.7' },
            { value: 'patrimonio_terceros', label: 'Patrimonio de Terceros', code: '2.8' }
        ]
    },
    PATRIMONIO: {
        code: '3',
        name: 'PATRIMONIO/CAPITAL',
        nature: 'credit',
        subTypes: [
            { value: 'capital_social', label: 'Capital Social', code: '3.1' },
            { value: 'reservas', label: 'Reservas y Patrimonio', code: '3.2' },
            { value: 'revaluacion', label: 'Revaluación del Patrimonio', code: '3.3' },
            { value: 'resultados', label: 'Resultados Acumulados', code: '3.4' },
            { value: 'ejercicio', label: 'Resultados del Ejercicio', code: '3.5' }
        ]
    },
    INGRESOS: {
        code: '4',
        name: 'INGRESOS',
        nature: 'credit',
        subTypes: [
            { value: 'ventas', label: 'Ventas e Ingresos Operacionales', code: '4.1' },
            { value: 'ventas_dev', label: 'Devoluciones y Descuentos', code: '4.2' },
            { value: 'otros_ingresos', label: 'Otros Ingresos', code: '4.3' },
            { value: 'ingresos_financieros', label: 'Ingresos Financieros', code: '4.4' },
            { value: 'ingresos_extra', label: 'Ingresos Extraordinarios', code: '4.5' }
        ]
    },
    COSTOS_GASTOS: {
        code: '5',
        name: 'COSTOS Y GASTOS',
        nature: 'debit',
        subTypes: [
            { value: 'costos_ventas', label: 'Costos de Ventas', code: '5.1' },
            { value: 'gastos_admin', label: 'Gastos Administrativos', code: '5.2' },
            { value: 'gastos_ventas', label: 'Gastos de Ventas', code: '5.3' },
            { value: 'gastos_financieros', label: 'Gastos Financieros', code: '5.4' },
            { value: 'gastos_extra', label: 'Gastos Extraordinarios', code: '5.5' }
        ]
    }
};

// ==========================================
// CATÁLOGO DETALLADO DE CUENTAS NIC
// ==========================================

export const NIC_DETAILED_ACCOUNTS = [
    // ==================== ACTIVOS (1) ====================
    
    // 1.1 Disponibles (Efectivo y Equivalentes)
    { code: '1.1.01', name: 'CAJA GENERAL', type: 'ACTIVO', subType: 'disponible', level: 'account', nature: 'debit' },
    { code: '1.1.01.01', name: 'Caja Principal - C$ ', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.01', nature: 'debit', currency: 'NIO' },
    { code: '1.1.01.02', name: 'Caja Principal - USD', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.01', nature: 'debit', currency: 'USD' },
    { code: '1.1.01.03', name: 'Caja Chica / Petty Cash', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.01', nature: 'debit' },
    
    { code: '1.1.02', name: 'BANCOS Y OTRAS ENTIDADES', type: 'ACTIVO', subType: 'disponible', level: 'account', nature: 'debit' },
    { code: '1.1.02.01', name: 'Banco Principal C$ - Cuenta Corriente', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.02', nature: 'debit', currency: 'NIO' },
    { code: '1.1.02.02', name: 'Banco Principal USD - Cuenta Corriente', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.02', nature: 'debit', currency: 'USD' },
    { code: '1.1.02.03', name: 'Banco Secundario C$', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.02', nature: 'debit', currency: 'NIO' },
    { code: '1.1.02.04', name: 'Banco Secundario USD', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.02', nature: 'debit', currency: 'USD' },
    { code: '1.1.02.05', name: 'Depósitos en Transito', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.02', nature: 'debit' },
    
    { code: '1.1.03', name: 'VALORES EN CAJA', type: 'ACTIVO', subType: 'disponible', level: 'account', nature: 'debit' },
    { code: '1.1.03.01', name: 'Cheques en Cartera', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.03', nature: 'debit' },
    { code: '1.1.03.02', name: 'Efectivo en Tránsito', type: 'ACTIVO', subType: 'disponible', level: 'subaccount', parent: '1.1.03', nature: 'debit' },

    // 1.2 Inversiones Temporales
    { code: '1.2.01', name: 'INVERSIONES TEMPORALES', type: 'ACTIVO', subType: 'inversiones', level: 'account', nature: 'debit' },
    { code: '1.2.01.01', name: 'Certificados de Depósito a Plazo', type: 'ACTIVO', subType: 'inversiones', level: 'subaccount', parent: '1.2.01', nature: 'debit' },
    { code: '1.2.01.02', name: 'Bonos y Valores Negociables', type: 'ACTIVO', subType: 'inversiones', level: 'subaccount', parent: '1.2.01', nature: 'debit' },

    // 1.3 Cuentas por Cobrar
    { code: '1.3.01', name: 'CUENTAS POR COBRAR CLIENTES', type: 'ACTIVO', subType: 'clientes', level: 'account', nature: 'debit' },
    { code: '1.3.01.01', name: 'Clientes Nacionales', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.01', nature: 'debit' },
    { code: '1.3.01.02', name: 'Clientes del Exterior', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.01', nature: 'debit' },
    { code: '1.3.01.03', name: 'Documentos por Cobrar', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.01', nature: 'debit' },
    { code: '1.3.01.04', name: 'Letras de Cambio por Cobrar', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.01', nature: 'debit' },
    { code: '1.3.01.05', name: 'Provision por Incobrabilidad', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.01', nature: 'credit', isContraAccount: true },

    { code: '1.3.02', name: 'CUENTAS POR COBRAR EMPLEADOS', type: 'ACTIVO', subType: 'clientes', level: 'account', nature: 'debit' },
    { code: '1.3.02.01', name: 'Préstamos al Personal', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.02', nature: 'debit' },
    { code: '1.3.02.02', name: 'Anticipos de Salarios', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.02', nature: 'debit' },
    { code: '1.3.02.03', name: 'Vales por Rendir', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.02', nature: 'debit' },

    { code: '1.3.03', name: 'CUENTAS POR COBRAR AFILIADAS', type: 'ACTIVO', subType: 'clientes', level: 'account', nature: 'debit' },
    { code: '1.3.03.01', name: 'Cuentas por Cobrar Empresas Relacionadas', type: 'ACTIVO', subType: 'clientes', level: 'subaccount', parent: '1.3.03', nature: 'debit' },

    // 1.4 Inventarios
    { code: '1.4.01', name: 'INVENTARIOS DE MERCADERÍA', type: 'ACTIVO', subType: 'inventarios', level: 'account', nature: 'debit' },
    { code: '1.4.01.01', name: 'Inventario de Productos Terminados', type: 'ACTIVO', subType: 'inventarios', level: 'subaccount', parent: '1.4.01', nature: 'debit' },
    { code: '1.4.01.02', name: 'Inventario de Materias Primas', type: 'ACTIVO', subType: 'inventarios', level: 'subaccount', parent: '1.4.01', nature: 'debit' },
    { code: '1.4.01.03', name: 'Inventario de Productos en Proceso', type: 'ACTIVO', subType: 'inventarios', level: 'subaccount', parent: '1.4.01', nature: 'debit' },
    { code: '1.4.01.04', name: 'Inventario de Suministros y Materiales', type: 'ACTIVO', subType: 'inventarios', level: 'subaccount', parent: '1.4.01', nature: 'debit' },
    { code: '1.4.01.05', name: 'Inventario de Mercancía para la Venta', type: 'ACTIVO', subType: 'inventarios', level: 'subaccount', parent: '1.4.01', nature: 'debit' },

    // 1.5 Gastos Pagados por Anticipado
    { code: '1.5.01', name: 'GASTOS PAGADOS POR ANTICIPADO', type: 'ACTIVO', subType: 'prepago', level: 'account', nature: 'debit' },
    { code: '1.5.01.01', name: 'Alquileres Pagados por Anticipado', type: 'ACTIVO', subType: 'prepago', level: 'subaccount', parent: '1.5.01', nature: 'debit' },
    { code: '1.5.01.02', name: 'Seguros Pagados por Anticipado', type: 'ACTIVO', subType: 'prepago', level: 'subaccount', parent: '1.5.01', nature: 'debit' },
    { code: '1.5.01.03', name: 'Publicidad Pagada por Anticipado', type: 'ACTIVO', subType: 'prepago', level: 'subaccount', parent: '1.5.01', nature: 'debit' },
    { code: '1.5.01.04', name: 'Suscripciones y Afiliaciones', type: 'ACTIVO', subType: 'prepago', level: 'subaccount', parent: '1.5.01', nature: 'debit' },
    { code: '1.5.01.05', name: 'Otros Gastos Prepagados', type: 'ACTIVO', subType: 'prepago', level: 'subaccount', parent: '1.5.01', nature: 'debit' },

    // 1.6 Propiedad, Planta y Equipo
    { code: '1.6.01', name: 'TERRENOS Y EDIFICIOS', type: 'ACTIVO', subType: 'propiedad', level: 'account', nature: 'debit' },
    { code: '1.6.01.01', name: 'Terrenos', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.01', nature: 'debit' },
    { code: '1.6.01.02', name: 'Edificios y Construcciones', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.01', nature: 'debit' },
    { code: '1.6.01.03', name: 'Depreciación Acumulada Edificios', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.01', nature: 'credit', isContraAccount: true },

    { code: '1.6.02', name: 'MOBILIARIO Y EQUIPO DE OFICINA', type: 'ACTIVO', subType: 'propiedad', level: 'account', nature: 'debit' },
    { code: '1.6.02.01', name: 'Muebles y Enseres', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.02', nature: 'debit' },
    { code: '1.6.02.02', name: 'Equipo de Computo', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.02', nature: 'debit' },
    { code: '1.6.02.03', name: 'Equipo de Aire Acondicionado', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.02', nature: 'debit' },
    { code: '1.6.02.04', name: 'Depreciación Acumulada Mobiliario', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.02', nature: 'credit', isContraAccount: true },

    { code: '1.6.03', name: 'EQUIPO DE TRANSPORTE', type: 'ACTIVO', subType: 'propiedad', level: 'account', nature: 'debit' },
    { code: '1.6.03.01', name: 'Vehículos de Carga', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.03', nature: 'debit' },
    { code: '1.6.03.02', name: 'Vehículos de Pasajeros', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.03', nature: 'debit' },
    { code: '1.6.03.03', name: 'Depreciación Acumulada Vehículos', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.03', nature: 'credit', isContraAccount: true },

    { code: '1.6.04', name: 'MAQUINARIA Y EQUIPO', type: 'ACTIVO', subType: 'propiedad', level: 'account', nature: 'debit' },
    { code: '1.6.04.01', name: 'Maquinaria de Producción', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.04', nature: 'debit' },
    { code: '1.6.04.02', name: 'Herramientas y Equipos Menores', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.04', nature: 'debit' },
    { code: '1.6.04.03', name: 'Depreciación Acumulada Maquinaria', type: 'ACTIVO', subType: 'propiedad', level: 'subaccount', parent: '1.6.04', nature: 'credit', isContraAccount: true },

    // 1.7 Activos Intangibles
    { code: '1.7.01', name: 'ACTIVOS INTANGIBLES', type: 'ACTIVO', subType: 'intangibles', level: 'account', nature: 'debit' },
    { code: '1.7.01.01', name: 'Marcas y Patentes', type: 'ACTIVO', subType: 'intangibles', level: 'subaccount', parent: '1.7.01', nature: 'debit' },
    { code: '1.7.01.02', name: 'Software y Licencias', type: 'ACTIVO', subType: 'intangibles', level: 'subaccount', parent: '1.7.01', nature: 'debit' },
    { code: '1.7.01.03', name: 'Franquicias y Concesiones', type: 'ACTIVO', subType: 'intangibles', level: 'subaccount', parent: '1.7.01', nature: 'debit' },
    { code: '1.7.01.04', name: 'Derechos de Autor', type: 'ACTIVO', subType: 'intangibles', level: 'subaccount', parent: '1.7.01', nature: 'debit' },
    { code: '1.7.01.05', name: 'Amortización Acumulada', type: 'ACTIVO', subType: 'intangibles', level: 'subaccount', parent: '1.7.01', nature: 'credit', isContraAccount: true },

    // 1.8 Activos Diferidos
    { code: '1.8.01', name: 'ACTIVOS DIFERIDOS', type: 'ACTIVO', subType: 'diferidos', level: 'account', nature: 'debit' },
    { code: '1.8.01.01', name: 'Gastos de Constitución', type: 'ACTIVO', subType: 'diferidos', level: 'subaccount', parent: '1.8.01', nature: 'debit' },
    { code: '1.8.01.02', name: 'Gastos de Organización', type: 'ACTIVO', subType: 'diferidos', level: 'subaccount', parent: '1.8.01', nature: 'debit' },
    { code: '1.8.01.03', name: 'Mejoras en Locales Alquilados', type: 'ACTIVO', subType: 'diferidos', level: 'subaccount', parent: '1.8.01', nature: 'debit' },

    // ==================== PASIVOS (2) ====================
    
    // 2.1 Obligaciones con Bancos
    { code: '2.1.01', name: 'OBLIGACIONES CON BANCOS', type: 'PASIVO', subType: 'obligaciones', level: 'account', nature: 'credit' },
    { code: '2.1.01.01', name: 'Préstamos Bancarios a Corto Plazo', type: 'PASIVO', subType: 'obligaciones', level: 'subaccount', parent: '2.1.01', nature: 'credit' },
    { code: '2.1.01.02', name: 'Pagarés Bancarios', type: 'PASIVO', subType: 'obligaciones', level: 'subaccount', parent: '2.1.01', nature: 'credit' },
    { code: '2.1.01.03', name: 'Sobregiros Bancarios', type: 'PASIVO', subType: 'obligaciones', level: 'subaccount', parent: '2.1.01', nature: 'credit' },
    { code: '2.1.01.04', name: 'Cartas de Crédito por Pagar', type: 'PASIVO', subType: 'obligaciones', level: 'subaccount', parent: '2.1.01', nature: 'credit' },

    // 2.2 Proveedores y Acreedores
    { code: '2.2.01', name: 'PROVEEDORES NACIONALES', type: 'PASIVO', subType: 'proveedores', level: 'account', nature: 'credit' },
    { code: '2.2.01.01', name: 'Proveedores de Materias Primas', type: 'PASIVO', subType: 'proveedores', level: 'subaccount', parent: '2.2.01', nature: 'credit' },
    { code: '2.2.01.02', name: 'Proveedores de Mercadería', type: 'PASIVO', subType: 'proveedores', level: 'subaccount', parent: '2.2.01', nature: 'credit' },
    { code: '2.2.01.03', name: 'Proveedores de Suministros', type: 'PASIVO', subType: 'proveedores', level: 'subaccount', parent: '2.2.01', nature: 'credit' },

    { code: '2.2.02', name: 'PROVEEDORES EXTRANJEROS', type: 'PASIVO', subType: 'proveedores', level: 'account', nature: 'credit' },
    { code: '2.2.02.01', name: 'Proveedores Importación', type: 'PASIVO', subType: 'proveedores', level: 'subaccount', parent: '2.2.02', nature: 'credit', currency: 'USD' },

    { code: '2.2.03', name: 'ACREEDORES DIVERSOS', type: 'PASIVO', subType: 'proveedores', level: 'account', nature: 'credit' },
    { code: '2.2.03.01', name: 'Acreedores Varios', type: 'PASIVO', subType: 'proveedores', level: 'subaccount', parent: '2.2.03', nature: 'credit' },
    { code: '2.2.03.02', name: 'Documentos por Pagar', type: 'PASIVO', subType: 'proveedores', level: 'subaccount', parent: '2.2.03', nature: 'credit' },
    { code: '2.2.03.03', name: 'Letras de Cambio por Pagar', type: 'PASIVO', subType: 'proveedores', level: 'subaccount', parent: '2.2.03', nature: 'credit' },

    // 2.3 Impuestos por Pagar
    { code: '2.3.01', name: 'IMPUESTOS Y RETENCIONES', type: 'PASIVO', subType: 'impuestos', level: 'account', nature: 'credit' },
    { code: '2.3.01.01', name: 'IVA por Pagar', type: 'PASIVO', subType: 'impuestos', level: 'subaccount', parent: '2.3.01', nature: 'credit' },
    { code: '2.3.01.02', name: 'IVA Retenido a Terceros', type: 'PASIVO', subType: 'impuestos', level: 'subaccount', parent: '2.3.01', nature: 'credit' },
    { code: '2.3.01.03', name: 'IR por Pagar', type: 'PASIVO', subType: 'impuestos', level: 'subaccount', parent: '2.3.01', nature: 'credit' },
    { code: '2.3.01.04', name: 'IR Retenido por Pagos al Exterior', type: 'PASIVO', subType: 'impuestos', level: 'subaccount', parent: '2.3.01', nature: 'credit' },
    { code: '2.3.01.05', name: 'INSS Laboral por Pagar', type: 'PASIVO', subType: 'impuestos', level: 'subaccount', parent: '2.3.01', nature: 'credit' },
    { code: '2.3.01.06', name: 'INSS Patronal por Pagar', type: 'PASIVO', subType: 'impuestos', level: 'subaccount', parent: '2.3.01', nature: 'credit' },
    { code: '2.3.01.07', name: 'Impuestos Municipales', type: 'PASIVO', subType: 'impuestos', level: 'subaccount', parent: '2.3.01', nature: 'credit' },
    { code: '2.3.01.08', name: 'Timbres Fiscales', type: 'PASIVO', subType: 'impuestos', level: 'subaccount', parent: '2.3.01', nature: 'credit' },

    // 2.4 Obligaciones Laborales
    { code: '2.4.01', name: 'OBLIGACIONES CON EL PERSONAL', type: 'PASIVO', subType: 'laborales', level: 'account', nature: 'credit' },
    { code: '2.4.01.01', name: 'Sueldos y Salarios por Pagar', type: 'PASIVO', subType: 'laborales', level: 'subaccount', parent: '2.4.01', nature: 'credit' },
    { code: '2.4.01.02', name: 'Aguinaldos por Pagar', type: 'PASIVO', subType: 'laborales', level: 'subaccount', parent: '2.4.01', nature: 'credit' },
    { code: '2.4.01.03', name: 'Vacaciones por Pagar', type: 'PASIVO', subType: 'laborales', level: 'subaccount', parent: '2.4.01', nature: 'credit' },
    { code: '2.4.01.04', name: 'Indemnizaciones por Pagar', type: 'PASIVO', subType: 'laborales', level: 'subaccount', parent: '2.4.01', nature: 'credit' },
    { code: '2.4.01.05', name: 'Beneficios Sociales por Pagar', type: 'PASIVO', subType: 'laborales', level: 'subaccount', parent: '2.4.01', nature: 'credit' },

    // 2.5 Provisiones
    { code: '2.5.01', name: 'PROVISIONES Y RESERVAS', type: 'PASIVO', subType: 'provisiones', level: 'account', nature: 'credit' },
    { code: '2.5.01.01', name: 'Provision para Pérdidas de Inventario', type: 'PASIVO', subType: 'provisiones', level: 'subaccount', parent: '2.5.01', nature: 'credit' },
    { code: '2.5.01.02', name: 'Provision para Garantías', type: 'PASIVO', subType: 'provisiones', level: 'subaccount', parent: '2.5.01', nature: 'credit' },
    { code: '2.5.01.03', name: 'Provision para Litigios', type: 'PASIVO', subType: 'provisiones', level: 'subaccount', parent: '2.5.01', nature: 'credit' },

    // ==================== PATRIMONIO (3) ====================
    
    { code: '3.1.01', name: 'CAPITAL SOCIAL', type: 'CAPITAL', subType: 'capital_social', level: 'account', nature: 'credit' },
    { code: '3.1.01.01', name: 'Capital Social Autorizado', type: 'CAPITAL', subType: 'capital_social', level: 'subaccount', parent: '3.1.01', nature: 'credit' },
    { code: '3.1.01.02', name: 'Capital Social Suscrito', type: 'CAPITAL', subType: 'capital_social', level: 'subaccount', parent: '3.1.01', nature: 'credit' },
    { code: '3.1.01.03', name: 'Capital Social Pagado', type: 'CAPITAL', subType: 'capital_social', level: 'subaccount', parent: '3.1.01', nature: 'credit' },
    { code: '3.1.01.04', name: 'Acciones en Tesorería', type: 'CAPITAL', subType: 'capital_social', level: 'subaccount', parent: '3.1.01', nature: 'debit', isContraAccount: true },

    { code: '3.2.01', name: 'RESERVAS Y PATRIMONIO', type: 'CAPITAL', subType: 'reservas', level: 'account', nature: 'credit' },
    { code: '3.2.01.01', name: 'Reserva Legal (5%)', type: 'CAPITAL', subType: 'reservas', level: 'subaccount', parent: '3.2.01', nature: 'credit' },
    { code: '3.2.01.02', name: 'Reservas Disponibles', type: 'CAPITAL', subType: 'reservas', level: 'subaccount', parent: '3.2.01', nature: 'credit' },
    { code: '3.2.01.03', name: 'Reserva para Nuevas Inversiones', type: 'CAPITAL', subType: 'reservas', level: 'subaccount', parent: '3.2.01', nature: 'credit' },

    { code: '3.3.01', name: 'REVALUACIÓN DEL PATRIMONIO', type: 'CAPITAL', subType: 'revaluacion', level: 'account', nature: 'credit' },
    { code: '3.3.01.01', name: 'Superávit por Revaluación', type: 'CAPITAL', subType: 'revaluacion', level: 'subaccount', parent: '3.3.01', nature: 'credit' },

    { code: '3.4.01', name: 'RESULTADOS ACUMULADOS', type: 'CAPITAL', subType: 'resultados', level: 'account', nature: 'credit' },
    { code: '3.4.01.01', name: 'Utilidades Retenidas de Años Anteriores', type: 'CAPITAL', subType: 'resultados', level: 'subaccount', parent: '3.4.01', nature: 'credit' },
    { code: '3.4.01.02', name: 'Pérdidas Acumuladas de Años Anteriores', type: 'CAPITAL', subType: 'resultados', level: 'subaccount', parent: '3.4.01', nature: 'debit' },
    { code: '3.4.01.03', name: 'Dividendos Decretados en Acciones', type: 'CAPITAL', subType: 'resultados', level: 'subaccount', parent: '3.4.01', nature: 'debit' },

    { code: '3.5.01', name: 'RESULTADOS DEL EJERCICIO', type: 'CAPITAL', subType: 'ejercicio', level: 'account', nature: 'credit' },
    { code: '3.5.01.01', name: 'Utilidad del Ejercicio', type: 'CAPITAL', subType: 'ejercicio', level: 'subaccount', parent: '3.5.01', nature: 'credit' },
    { code: '3.5.01.02', name: 'Pérdida del Ejercicio', type: 'CAPITAL', subType: 'ejercicio', level: 'subaccount', parent: '3.5.01', nature: 'debit' },

    // ==================== INGRESOS (4) ====================
    
    { code: '4.1.01', name: 'VENTAS E INGRESOS OPERACIONALES', type: 'INGRESO', subType: 'ventas', level: 'account', nature: 'credit' },
    { code: '4.1.01.01', name: 'Ventas de Mercadería', type: 'INGRESO', subType: 'ventas', level: 'subaccount', parent: '4.1.01', nature: 'credit' },
    { code: '4.1.01.02', name: 'Ventas de Productos Terminados', type: 'INGRESO', subType: 'ventas', level: 'subaccount', parent: '4.1.01', nature: 'credit' },
    { code: '4.1.01.03', name: 'Ventas de Materias Primas', type: 'INGRESO', subType: 'ventas', level: 'subaccount', parent: '4.1.01', nature: 'credit' },
    { code: '4.1.01.04', name: 'Ingresos por Servicios', type: 'INGRESO', subType: 'ventas', level: 'subaccount', parent: '4.1.01', nature: 'credit' },
    { code: '4.1.01.05', name: 'Ventas a Crédito', type: 'INGRESO', subType: 'ventas', level: 'subaccount', parent: '4.1.01', nature: 'credit' },
    { code: '4.1.01.06', name: 'Ventas al Contado', type: 'INGRESO', subType: 'ventas', level: 'subaccount', parent: '4.1.01', nature: 'credit' },

    { code: '4.2.01', name: 'DESCUENTOS Y DEVOLUCIONES', type: 'INGRESO', subType: 'ventas_dev', level: 'account', nature: 'debit', isContraAccount: true },
    { code: '4.2.01.01', name: 'Descuentos sobre Ventas', type: 'INGRESO', subType: 'ventas_dev', level: 'subaccount', parent: '4.2.01', nature: 'debit', isContraAccount: true },
    { code: '4.2.01.02', name: 'Devoluciones sobre Ventas', type: 'INGRESO', subType: 'ventas_dev', level: 'subaccount', parent: '4.2.01', nature: 'debit', isContraAccount: true },
    { code: '4.2.01.03', name: 'Bonificaciones sobre Ventas', type: 'INGRESO', subType: 'ventas_dev', level: 'subaccount', parent: '4.2.01', nature: 'debit', isContraAccount: true },

    { code: '4.3.01', name: 'OTROS INGRESOS', type: 'INGRESO', subType: 'otros_ingresos', level: 'account', nature: 'credit' },
    { code: '4.3.01.01', name: 'Ingresos por Arrendamientos', type: 'INGRESO', subType: 'otros_ingresos', level: 'subaccount', parent: '4.3.01', nature: 'credit' },
    { code: '4.3.01.02', name: 'Ingresos por Comisiones', type: 'INGRESO', subType: 'otros_ingresos', level: 'subaccount', parent: '4.3.01', nature: 'credit' },
    { code: '4.3.01.03', name: 'Ingresos por Consultorías', type: 'INGRESO', subType: 'otros_ingresos', level: 'subaccount', parent: '4.3.01', nature: 'credit' },
    { code: '4.3.01.04', name: 'Ingresos Varios', type: 'INGRESO', subType: 'otros_ingresos', level: 'subaccount', parent: '4.3.01', nature: 'credit' },

    { code: '4.4.01', name: 'INGRESOS FINANCIEROS', type: 'INGRESO', subType: 'ingresos_financieros', level: 'account', nature: 'credit' },
    { code: '4.4.01.01', name: 'Intereses Ganados', type: 'INGRESO', subType: 'ingresos_financieros', level: 'subaccount', parent: '4.4.01', nature: 'credit' },
    { code: '4.4.01.02', name: 'Diferencias Cambiarias Ganadas', type: 'INGRESO', subType: 'ingresos_financieros', level: 'subaccount', parent: '4.4.01', nature: 'credit' },
    { code: '4.4.01.03', name: 'Descuentos Obtenidos', type: 'INGRESO', subType: 'ingresos_financieros', level: 'subaccount', parent: '4.4.01', nature: 'credit' },

    // ==================== COSTOS Y GASTOS (5) ====================
    
    // 5.1 Costos de Ventas
    { code: '5.1.01', name: 'COSTOS DE VENTAS', type: 'GASTO', subType: 'costos_ventas', level: 'account', nature: 'debit' },
    { code: '5.1.01.01', name: 'Costo de Mercadería Vendida', type: 'GASTO', subType: 'costos_ventas', level: 'subaccount', parent: '5.1.01', nature: 'debit' },
    { code: '5.1.01.02', name: 'Costo de Materias Primas Utilizadas', type: 'GASTO', subType: 'costos_ventas', level: 'subaccount', parent: '5.1.01', nature: 'debit' },
    { code: '5.1.01.03', name: 'Costo de Mano de Obra Directa', type: 'GASTO', subType: 'costos_ventas', level: 'subaccount', parent: '5.1.01', nature: 'debit' },
    { code: '5.1.01.04', name: 'Costos Indirectos de Fabricación', type: 'GASTO', subType: 'costos_ventas', level: 'subaccount', parent: '5.1.01', nature: 'debit' },

    // 5.2 Gastos Administrativos
    { code: '5.2.01', name: 'GASTOS DE ADMINISTRACIÓN', type: 'GASTO', subType: 'gastos_admin', level: 'account', nature: 'debit' },
    { code: '5.2.01.01', name: 'Sueldos y Salarios - Administración', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.02', name: 'Honorarios Profesionales', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.03', name: 'Gastos de Seguridad Social (INSS)', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.04', name: 'Gastos de Agencia de Publicidad', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.05', name: 'Alquileres de Oficinas', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.06', name: 'Servicios Públicos - Oficina', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.07', name: 'Depreciaciones - Oficina', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.08', name: 'Amortizaciones - Intangibles', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.09', name: 'Gastos de Viaje y Transporte', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.10', name: 'Gastos de Combustible - Admin', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.11', name: 'Gastos de Mantenimiento - Oficina', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.12', name: 'Gastos de Papelería y Útiles', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.13', name: 'Gastos de Teléfono e Internet', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.14', name: 'Gastos de Seguros Generales', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.15', name: 'Gastos de Impuestos y Tasas', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.16', name: 'Gastos de Capacitación', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.17', name: 'Gastos de Auditoría', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },
    { code: '5.2.01.18', name: 'Gastos Legales y Notariales', type: 'GASTO', subType: 'gastos_admin', level: 'subaccount', parent: '5.2.01', nature: 'debit' },

    // 5.3 Gastos de Ventas
    { code: '5.3.01', name: 'GASTOS DE VENTAS', type: 'GASTO', subType: 'gastos_ventas', level: 'account', nature: 'debit' },
    { code: '5.3.01.01', name: 'Sueldos y Comisiones - Ventas', type: 'GASTO', subType: 'gastos_ventas', level: 'subaccount', parent: '5.3.01', nature: 'debit' },
    { code: '5.3.01.02', name: 'Publicidad y Propaganda', type: 'GASTO', subType: 'gastos_ventas', level: 'subaccount', parent: '5.3.01', nature: 'debit' },
    { code: '5.3.01.03', name: 'Gastos de Empaque y Embalaje', type: 'GASTO', subType: 'gastos_ventas', level: 'subaccount', parent: '5.3.01', nature: 'debit' },
    { code: '5.3.01.04', name: 'Gastos de Transporte - Ventas', type: 'GASTO', subType: 'gastos_ventas', level: 'subaccount', parent: '5.3.01', nature: 'debit' },
    { code: '5.3.01.05', name: 'Depreciaciones - Vehículos Ventas', type: 'GASTO', subType: 'gastos_ventas', level: 'subaccount', parent: '5.3.01', nature: 'debit' },
    { code: '5.3.01.06', name: 'Muestras Gratis y Promociones', type: 'GASTO', subType: 'gastos_ventas', level: 'subaccount', parent: '5.3.01', nature: 'debit' },

    // 5.4 Gastos Financieros
    { code: '5.4.01', name: 'GASTOS FINANCIEROS', type: 'GASTO', subType: 'gastos_financieros', level: 'account', nature: 'debit' },
    { code: '5.4.01.01', name: 'Intereses Pagados a Bancos', type: 'GASTO', subType: 'gastos_financieros', level: 'subaccount', parent: '5.4.01', nature: 'debit' },
    { code: '5.4.01.02', name: 'Intereses por Mora', type: 'GASTO', subType: 'gastos_financieros', level: 'subaccount', parent: '5.4.01', nature: 'debit' },
    { code: '5.4.01.03', name: 'Comisiones Bancarias', type: 'GASTO', subType: 'gastos_financieros', level: 'subaccount', parent: '5.4.01', nature: 'debit' },
    { code: '5.4.01.04', name: 'Diferencias Cambiarias Perdidas', type: 'GASTO', subType: 'gastos_financieros', level: 'subaccount', parent: '5.4.01', nature: 'debit' },
    { code: '5.4.01.05', name: 'Descuentos Concedidos', type: 'GASTO', subType: 'gastos_financieros', level: 'subaccount', parent: '5.4.01', nature: 'debit' },
    { code: '5.4.01.06', name: 'Gastos por Cobranza Externa', type: 'GASTO', subType: 'gastos_financieros', level: 'subaccount', parent: '5.4.01', nature: 'debit' }
];

// ==========================================
// FUNCIONES DE INTEGRACIÓN
// ==========================================

/**
 * Verifica qué cuentas NIC faltan en el sistema y devuelve solo las nuevas
 */
export const getMissingNICAccounts = async (existingAccounts) => {
    const existingCodes = new Set(existingAccounts.map(acc => acc.code));
    return NIC_DETAILED_ACCOUNTS.filter(nicAccount => !existingCodes.has(nicAccount.code));
};

/**
 * Cuentas NIC que ya existen (para mostrar estadísticas)
 */
export const getExistingNICAccounts = (existingAccounts) => {
    const existingCodes = new Set(existingAccounts.map(acc => acc.code));
    return {
        total: NIC_DETAILED_ACCOUNTS.length,
        existing: NIC_DETAILED_ACCOUNTS.filter(nic => existingCodes.has(nic.code)).length,
        missing: NIC_DETAILED_ACCOUNTS.filter(nic => !existingCodes.has(nic.code)).length
    };
};

/**
 * Inicializa el catálogo NIC completo, pero SOLO agrega las cuentas que no existen
 * NUNCA sobrescribe ni elimina las cuentas actuales del usuario
 */
export const initializeNICCatalog = async (preserveExisting = true) => {
    try {
        // Obtener cuentas actuales
        const accountsRef = collection(db, 'planCuentas');
        const snapshot = await getDocs(accountsRef);
        const existingAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Crear set de códigos existentes
        const existingCodes = new Set(existingAccounts.map(acc => acc.code));
        
        // Filtrar solo las cuentas NIC que no existen
        const accountsToAdd = NIC_DETAILED_ACCOUNTS.filter(nicAccount => {
            // Si ya existe por código, no la agregamos
            if (existingCodes.has(nicAccount.code)) return false;
            
            // Si existe por nombre similar, opcionalmente podríamos detectarla
            // pero por ahora usamos código como identificador único
            
            return true;
        });

        // Agregar cuentas faltantes
        const addedAccounts = [];
        const timestamp = Timestamp.now();
        
        for (const account of accountsToAdd) {
            const accountData = {
                ...account,
                isActive: true,
                balance: 0,
                currency: account.currency || 'NIO',
                createdAt: timestamp,
                updatedAt: timestamp,
                source: 'NIC_CATALOG', // Marcar origen
                isEditable: true, // Permitir edición
                isNICStandard: true // Marcar como estándar NIC
            };

            const docRef = await addDoc(accountsRef, accountData);
            addedAccounts.push({ id: docRef.id, ...accountData });
        }

        // Guardar metadata del catálogo en config
        const configRef = doc(db, 'config', 'nicCatalog');
        await setDoc(configRef, {
            initialized: true,
            initializedAt: timestamp,
            totalAccounts: NIC_DETAILED_ACCOUNTS.length,
            addedNow: addedAccounts.length,
            existingBefore: existingAccounts.length,
            version: 'NIC_2024',
            lastUpdated: timestamp
        }, { merge: true });

        return {
            success: true,
            added: addedAccounts.length,
            skipped: NIC_DETAILED_ACCOUNTS.length - addedAccounts.length,
            total: NIC_DETAILED_ACCOUNTS.length,
            accounts: addedAccounts
        };

    } catch (error) {
        console.error('Error inicializando catálogo NIC:', error);
        throw error;
    }
};

/**
 * Obtiene el estado actual del catálogo NIC en el sistema
 */
export const getNICCatalogStatus = async () => {
    try {
        const accountsRef = collection(db, 'planCuentas');
        const snapshot = await getDocs(accountsRef);
        const allAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const nicAccounts = allAccounts.filter(acc => acc.isNICStandard || NIC_DETAILED_ACCOUNTS.some(nic => nic.code === acc.code));
        const customAccounts = allAccounts.filter(acc => !nicAccounts.some(nic => nic.id === acc.id));
        
        const stats = getExistingNICAccounts(allAccounts);
        
        return {
            totalInSystem: allAccounts.length,
            nicAccounts: nicAccounts.length,
            customAccounts: customAccounts.length,
            nicCoverage: stats,
            isInitialized: nicAccounts.length > 0
        };
    } catch (error) {
        console.error('Error obteniendo estado:', error);
        return null;
    }
};

/**
 * Busca una cuenta por código en el catálogo NIC (útil para validaciones)
 */
export const findNICAccountByCode = (code) => {
    return NIC_DETAILED_ACCOUNTS.find(acc => acc.code === code);
};

/**
 * Sugiere el próximo código disponible basado en el patrón NIC
 */
export const suggestNextCode = (parentCode, existingAccounts) => {
    const children = existingAccounts.filter(acc => acc.parent === parentCode || acc.code.startsWith(parentCode + '.'));
    const usedNumbers = children.map(acc => {
        const parts = acc.code.split('.');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart);
    }).filter(n => !isNaN(n));
    
    const max = Math.max(0, ...usedNumbers);
    const next = (max + 1).toString().padStart(2, '0');
    return `${parentCode}.${next}`;
};

export default {
    NIC_CATALOG,
    NIC_DETAILED_ACCOUNTS,
    initializeNICCatalog,
    getNICCatalogStatus,
    getMissingNICAccounts,
    getExistingNICAccounts,
    findNICAccountByCode,
    suggestNextCode
};