// src/components/Inicio.jsx
// Página de Inicio - Dashboard con accesos rápidos a módulos

import React from 'react';
import { Link } from 'react-router-dom';

const Icons = {
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    plus: "M12 4v16m8-8H4",
    wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    scale: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    calculator: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    truck: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    checkCircle: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    creditCard: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    briefcase: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    trendingUp: "M13 7h8m0 0v8m0-8l-8-8-4 4-6-6",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    cube: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    trendUp: "M13 7h8m0 0v8m0-8l-8-8-4 4-6-6",
    trendDown: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const ModuleCard = ({ to, icon, title, description, color }) => {
    const colors = {
        blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
        emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
        amber: 'bg-amber-50 border-amber-200 hover:border-amber-400',
        rose: 'bg-rose-50 border-rose-200 hover:border-rose-400',
        purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
        sky: 'bg-sky-50 border-sky-200 hover:border-sky-400',
        slate: 'bg-slate-50 border-slate-200 hover:border-slate-400'
    };
    
    const iconColors = {
        blue: 'text-blue-600',
        emerald: 'text-emerald-600',
        amber: 'text-amber-600',
        rose: 'text-rose-600',
        purple: 'text-purple-600',
        sky: 'text-sky-600',
        slate: 'text-slate-600'
    };

    return (
        <Link to={to} className={`block p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${colors[color]}`}>
            <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm`}>
                <Icon path={Icons[icon]} className={`w-6 h-6 ${iconColors[color]}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </Link>
    );
};

export default function Inicio() {
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-4xl font-black text-slate-800 mb-2">
                        Bienvenido a <span className="text-blue-600">Distribuidoras SR</span>
                    </h1>
                    <p className="text-slate-500">Sistema ERP Financiero - Seleccione un módulo para comenzar</p>
                </div>

                {/* Módulos Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    <ModuleCard 
                        to="/dashboard-financiero" 
                        icon="chart" 
                        title="Dashboard Financiero" 
                        description="Saldos, KPIs y métricas clave" 
                        color="blue" 
                    />
                    <ModuleCard 
                        to="/ingresar" 
                        icon="plus" 
                        title="Ingresar Datos" 
                        description="Registro de ingresos y gastos" 
                        color="emerald" 
                    />
                    <ModuleCard 
                        to="/ventas" 
                        icon="trendUp" 
                        title="Ventas" 
                        description="Gestión completa de ventas" 
                        color="purple" 
                    />
                    <ModuleCard 
                        to="/gastos" 
                        icon="trendDown" 
                        title="Gastos" 
                        description="Gestión de gastos y compras" 
                        color="rose" 
                    />
                    <ModuleCard 
                        to="/cierre-caja-erp" 
                        icon="calculator" 
                        title="Cierre de Caja" 
                        description="Cierres y validación ERP" 
                        color="blue" 
                    />
                    <ModuleCard 
                        to="/plan-cuentas" 
                        icon="folder" 
                        title="Plan de Cuentas" 
                        description="Catálogo contable" 
                        color="amber" 
                    />
                    <ModuleCard 
                        to="/movimientos-contables" 
                        icon="fileText" 
                        title="Movimientos" 
                        description="Historial contable" 
                        color="sky" 
                    />
                    <ModuleCard 
                        to="/cuentas-pagar" 
                        icon="briefcase" 
                        title="Cuentas por Pagar" 
                        description="Gestión de proveedores" 
                        color="slate" 
                    />
                </div>

                {/* Sección de Información */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Novedades del Sistema</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon path={Icons.checkCircle} className="w-5 h-5 text-emerald-600" />
                                <span className="font-bold text-emerald-800">Nuevo: Módulo de Ventas</span>
                            </div>
                            <p className="text-sm text-emerald-700">
                                Ahora puede gestionar todas las ventas desde un solo lugar. Acceda desde el menú Financiero → Clientes → Ventas.
                            </p>
                        </div>
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon path={Icons.checkCircle} className="w-5 h-5 text-rose-600" />
                                <span className="font-bold text-rose-800">Nuevo: Módulo de Gastos</span>
                            </div>
                            <p className="text-sm text-rose-700">
                                Gestione todos los gastos y compras del sistema. Acceda desde el menú Financiero → Gastos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
