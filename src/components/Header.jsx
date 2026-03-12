// src/components/Header.jsx
// ERP Distribuidoras SR - Navegación Enterprise

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4m-4 0h4",
    plus: "M12 4v16m8-8H4",
    wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    menu: "M4 6h16M4 12h16M4 18h16",
    x: "M6 18L18 6M6 6l12 12",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    chevronDown: "M19 9l-7 7-7-7",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
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
    // Nuevos iconos para Ventas y Gastos
    trendUp: "M13 7h8m0 0v8m0-8l-8-8-4 4-6-6",
    trendDown: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);

    const isAdmin = user?.email !== "adriandiazc95@gmail.com";
    const isContabilidad = user?.email?.includes('conta') || user?.email?.includes('nicol') || isAdmin;
    const isCajero = user?.email?.includes('caja') || isAdmin;

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error("Error al cerrar sesión", e);
        }
    };

    const isActive = (path) => location.pathname === path;

    const toggleDropdown = (name) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    // Componente para ítems del dropdown
    const DropdownItem = ({ to, icon, title, subtitle, color = "blue", onClick }) => {
        const colors = {
            blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
            emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
            amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
            rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
            purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
            sky: "bg-sky-50 text-sky-600 group-hover:bg-sky-100",
            slate: "bg-slate-50 text-slate-600 group-hover:bg-slate-100"
        };

        const content = (
            <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer">
                <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center flex-shrink-0 transition-colors`}>
                    <Icon path={Icons[icon]} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-700 group-hover:text-slate-900 text-sm">{title}</div>
                    {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
                </div>
            </div>
        );

        if (onClick) {
            return <div onClick={onClick}>{content}</div>;
        }

        return (
            <Link to={to} onClick={() => setOpenDropdown(null)}>
                {content}
            </Link>
        );
    };

    // Botón de navegación principal
    const NavButton = ({ children, active, onClick, icon }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                active 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
        >
            {icon && <Icon path={Icons[icon]} className="w-4 h-4" />}
            {children}
        </button>
    );

    return (
        <>
            <style>{`
                @keyframes fade-in { 
                    from { opacity: 0; transform: translateY(-10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                } 
                .animate-fade-in { 
                    animation: fade-in 0.2s ease-out; 
                }
                .glass-effect {
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
            `}</style>
            
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-slate-800 ${
                isScrolled ? 'glass-effect shadow-2xl shadow-slate-900/50' : 'bg-slate-900'
            }`}>
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to={isAdmin ? "/dashboard-financiero" : "/"} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 transform group-hover:scale-105">
                                <Icon path={Icons.building} className="w-6 h-6 text-white" />
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-lg font-black text-white tracking-tight leading-none">Distribuidoras SR</span>
                                <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase mt-0.5">Sistema ERP</span>
                            </div>
                        </Link>

                        {/* Navegación Desktop */}
                        {user && (
                            <div className="hidden xl:flex items-center gap-1">
                                {/* 1. Dashboard - Solo Admin */}
                                {isAdmin && (
                                    <Link to="/dashboard-financiero">
                                        <NavButton 
                                            active={isActive('/dashboard-financiero')} 
                                            icon="chart"
                                        >
                                            Dashboard
                                        </NavButton>
                                    </Link>
                                )}

                                {/* 2. Ingresar - Solo Admin */}
                                {isAdmin && (
                                    <Link to="/ingresar">
                                        <NavButton 
                                            active={isActive('/ingresar')} 
                                            icon="plus"
                                        >
                                            Ingresar
                                        </NavButton>
                                    </Link>
                                )}

                                {/* 3. Financiero - Mega Dropdown */}
                                <div className="relative dropdown-container">
                                    <NavButton 
                                        active={location.pathname.includes('plan-cuentas') || 
                                               location.pathname.includes('cierre-caja') || 
                                               location.pathname.includes('movimientos') ||
                                               location.pathname.includes('ajustes') ||
                                               location.pathname.includes('deposito') ||
                                               location.pathname.includes('cuentas-pagar') ||
                                               location.pathname.includes('gastos-diarios') ||
                                               location.pathname.includes('ventas') ||
                                               location.pathname.includes('gastos')}
                                        onClick={() => toggleDropdown('financiero')}
                                        icon="scale"
                                    >
                                        <span>Financiero</span>
                                        <Icon path={Icons.chevronDown} className={`w-3 h-3 transition-transform ${openDropdown === 'financiero' ? 'rotate-180' : ''}`} />
                                    </NavButton>

                                    {openDropdown === 'financiero' && (
                                        <div className="absolute top-full left-0 mt-2 w-[900px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                                        <Icon path={Icons.scale} className="w-5 h-5 text-blue-600" />
                                                        Módulo Financiero
                                                    </h3>
                                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">ERP v2.0</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-5 gap-6">
                                                    {/* 3.1 Contabilidad */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                <Icon path={Icons.calculator} className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 text-sm">Contabilidad</h4>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {(isAdmin || isContabilidad) && (
                                                                <DropdownItem to="/plan-cuentas" icon="folder" title="Plan de Cuentas" subtitle="Catálogo contable" color="blue" />
                                                            )}
                                                            {(isAdmin || isCajero) && (
                                                                <DropdownItem to="/cierre-caja-erp" icon="cash" title="Cierre de Caja" subtitle="ERP Validación" color="emerald" />
                                                            )}
                                                            {(isAdmin || isContabilidad) && (
                                                                <>
                                                                    <DropdownItem to="/movimientos-contables" icon="fileText" title="Movimientos" subtitle="Historial unificado" color="purple" />
                                                                    <DropdownItem to="/ajustes-manuales" icon="refresh" title="Ajustes Manuales" subtitle="Con aprobación" color="amber" />
                                                                </>
                                                            )}
                                                            <DropdownItem to="/gastos-diarios" icon="creditCard" title="Gastos Diarios" subtitle="Registro diario" color="rose" />
                                                        </div>
                                                    </div>

                                                    {/* 3.2 Depósitos Bancarios */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                                <Icon path={Icons.wallet} className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 text-sm">Depósitos</h4>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <DropdownItem to="/depositos-transito" icon="truck" title="En Tránsito" subtitle="Recolección efectivo" color="amber" />
                                                            <DropdownItem to="/confirmar-deposito" icon="checkCircle" title="Confirmar" subtitle="Depósitos bancarios" color="emerald" />
                                                        </div>
                                                    </div>

                                                    {/* 3.3 Proveedores */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                                                                <Icon path={Icons.briefcase} className="w-4 h-4 text-rose-600" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 text-sm">Proveedores</h4>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <DropdownItem to="/cuentas-pagar" icon="creditCard" title="Cuentas por Pagar" subtitle="Gestión de pagos" color="rose" />
                                                            <DropdownItem to="/compras-gastos" icon="cube" title="Compras/Gastos" subtitle="Registro y editable" color="slate" />
                                                        </div>
                                                    </div>

                                                    {/* 3.4 Clientes - Ventas */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                                <Icon path={Icons.users} className="w-4 h-4 text-purple-600" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 text-sm">Clientes</h4>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <DropdownItem 
                                                                to="/ventas" 
                                                                icon="trendUp" 
                                                                title="Ventas" 
                                                                subtitle="Gestión completa" 
                                                                color="purple"
                                                            />
                                                            <DropdownItem 
                                                                icon="wallet" 
                                                                title="Cuentas por Cobrar" 
                                                                subtitle="Próximamente" 
                                                                color="sky"
                                                                onClick={() => alert('Módulo en desarrollo')}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* 3.5 Gestión de Gastos */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                                                                <Icon path={Icons.trendDown} className="w-4 h-4 text-rose-600" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 text-sm">Gastos</h4>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <DropdownItem 
                                                                to="/gastos" 
                                                                icon="trendDown" 
                                                                title="Gestión de Gastos" 
                                                                subtitle="Todos los gastos" 
                                                                color="rose"
                                                            />
                                                            <DropdownItem 
                                                                to="/dataentry" 
                                                                icon="dollar" 
                                                                title="Ingreso Rápido" 
                                                                subtitle="Nuevo gasto" 
                                                                color="emerald"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-xs text-slate-500">Última actualización: {new Date().toLocaleDateString()}</span>
                                                <button onClick={() => setOpenDropdown(null)} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                                                    Cerrar menú
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Reportes */}
                                {isAdmin && (
                                    <Link to="/reportes">
                                        <NavButton active={isActive('/reportes')} icon="chart">
                                            Reportes
                                        </NavButton>
                                    </Link>
                                )}

                                {/* 5. Configuración Dropdown */}
                                {isAdmin && (
                                    <div className="relative dropdown-container">
                                        <NavButton 
                                            active={location.pathname.includes('configuracion')}
                                            onClick={() => toggleDropdown('config')}
                                            icon="settings"
                                        >
                                            <span className="hidden lg:inline">Configuración</span>
                                            <Icon path={Icons.chevronDown} className={`w-3 h-3 transition-transform ${openDropdown === 'config' ? 'rotate-180' : ''}`} />
                                        </NavButton>

                                        {openDropdown === 'config' && (
                                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
                                                <div className="p-2">
                                                    <DropdownItem to="/configuracion-usuarios" icon="users" title="Usuarios" subtitle="Gestión de accesos" color="blue" />
                                                    <DropdownItem to="/configuracion-sucursales" icon="building" title="Sucursales" subtitle="Gestión de sucursales" color="emerald" />
                                                    <DropdownItem to="/configuracion" icon="settings" title="Configuraciones" subtitle="Parámetros del sistema" color="slate" />
                                                    <div className="border-t border-slate-100 my-2"></div>
                                                    <DropdownItem to="/perfil" icon="user" title="Mi Perfil" subtitle="Configuración personal" color="emerald" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Usuario y Logout */}
                                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-700">
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-sm font-bold text-white">{user.email.split('@')[0]}</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            {isAdmin ? 'Administrador' : isContabilidad ? 'Contabilidad' : 'Usuario'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={handleLogout} 
                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-semibold text-sm transition-all duration-200 border border-red-500/20 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30"
                                    >
                                        <Icon path={Icons.logout} className="w-4 h-4" />
                                        <span className="hidden sm:inline">Salir</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        {user && (
                            <div className="xl:hidden">
                                <button 
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <Icon path={isMobileMenuOpen ? Icons.x : Icons.menu} className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        {!user && (
                            <Link 
                                to="/login" 
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/30"
                            >
                                <Icon path={Icons.user} className="w-4 h-4" />
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && user && (
                    <div className="xl:hidden glass-effect border-t border-slate-800 animate-fade-in max-h-[85vh] overflow-y-auto">
                        <div className="px-4 py-4 space-y-2">
                            {/* Dashboard */}
                            {isAdmin && (
                                <Link to="/dashboard-financiero" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold ${isActive('/dashboard-financiero') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}>
                                    <Icon path={Icons.chart} className="w-5 h-5" /> Dashboard Financiero
                                </Link>
                            )}

                            {/* Ingresar */}
                            {isAdmin && (
                                <Link to="/ingresar" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold ${isActive('/ingresar') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}>
                                    <Icon path={Icons.plus} className="w-5 h-5" /> Ingresar Datos
                                </Link>
                            )}

                            {/* Financiero Section */}
                            <div className="pt-4 pb-2">
                                <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Módulo Financiero</div>
                                
                                {/* Contabilidad */}
                                <div className="px-4 py-2 text-xs font-medium text-blue-400">Contabilidad</div>
                                {(isAdmin || isContabilidad) && (
                                    <>
                                        <Link to="/plan-cuentas" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                            <Icon path={Icons.folder} className="w-4 h-4" /> Plan de Cuentas
                                        </Link>
                                        <Link to="/movimientos-contables" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                            <Icon path={Icons.fileText} className="w-4 h-4" /> Movimientos
                                        </Link>
                                        <Link to="/ajustes-manuales" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                            <Icon path={Icons.refresh} className="w-4 h-4" /> Ajustes Manuales
                                        </Link>
                                    </>
                                )}
                                {(isAdmin || isCajero) && (
                                    <Link to="/cierre-caja-erp" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                        <Icon path={Icons.calculator} className="w-4 h-4" /> Cierre de Caja
                                    </Link>
                                )}
                                <Link to="/gastos-diarios" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                    <Icon path={Icons.creditCard} className="w-4 h-4" /> Gastos Diarios
                                </Link>

                                {/* Depósitos */}
                                <div className="px-4 py-2 mt-2 text-xs font-medium text-emerald-400">Depósitos Bancarios</div>
                                <Link to="/depositos-transito" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                    <Icon path={Icons.truck} className="w-4 h-4" /> En Tránsito
                                </Link>
                                <Link to="/confirmar-deposito" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                    <Icon path={Icons.checkCircle} className="w-4 h-4" /> Confirmar Depósito
                                </Link>

                                {/* Proveedores */}
                                <div className="px-4 py-2 mt-2 text-xs font-medium text-rose-400">Proveedores</div>
                                <Link to="/cuentas-pagar" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                    <Icon path={Icons.creditCard} className="w-4 h-4" /> Cuentas por Pagar
                                </Link>
                                <Link to="/compras-gastos" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                    <Icon path={Icons.cube} className="w-4 h-4" /> Compras/Gastos
                                </Link>

                                {/* Clientes - Ventas */}
                                <div className="px-4 py-2 mt-2 text-xs font-medium text-purple-400">Clientes</div>
                                <Link to="/ventas" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                    <Icon path={Icons.trendUp} className="w-4 h-4" /> Ventas
                                </Link>
                                <button disabled className="flex items-center gap-3 px-4 py-2 text-slate-600 cursor-not-allowed rounded-lg ml-4 w-full text-left">
                                    <Icon path={Icons.wallet} className="w-4 h-4" /> Cuentas por Cobrar <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded ml-auto">Próx.</span>
                                </button>

                                {/* Gestión de Gastos */}
                                <div className="px-4 py-2 mt-2 text-xs font-medium text-rose-400">Gastos</div>
                                <Link to="/gastos" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                    <Icon path={Icons.trendDown} className="w-4 h-4" /> Gestión de Gastos
                                </Link>
                                <Link to="/dataentry" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ml-4">
                                    <Icon path={Icons.dollar} className="w-4 h-4" /> Ingreso Rápido
                                </Link>
                            </div>

                            {/* Reportes */}
                            {isAdmin && (
                                <Link to="/reportes" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold ${isActive('/reportes') ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}>
                                    <Icon path={Icons.chart} className="w-5 h-5" /> Reportes
                                </Link>
                            )}

                            {/* Configuración */}
                            {isAdmin && (
                                <div className="pt-4 pb-2 border-t border-slate-800">
                                    <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Configuración</div>
                                    <Link to="/configuracion-usuarios" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg">
                                        <Icon path={Icons.users} className="w-4 h-4" /> Usuarios
                                    </Link>
                                    <Link to="/configuracion" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg">
                                        <Icon path={Icons.settings} className="w-4 h-4" /> Otras Configuraciones
                                    </Link>
                                </div>
                            )}

                            {/* User Info Mobile */}
                            <div className="pt-4 border-t border-slate-800 mt-4">
                                <div className="px-4 py-2 mb-2">
                                    <div className="text-sm font-bold text-white">{user.email}</div>
                                    <div className="text-xs text-slate-400 uppercase">{isAdmin ? 'Administrador' : 'Usuario'}</div>
                                </div>
                                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-semibold border border-red-500/20">
                                    <Icon path={Icons.logout} className="w-4 h-4" /> Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
            
            {/* Spacer */}
            <div className="h-16"></div>
        </>
    );
}
