// src/components/DashboardFinanciero.jsx
// Dashboard Financiero - Módulo en Construcción

import React, { useState, useEffect } from 'react';

// Iconos SVG inline - CORREGIDO
const Icons = {
    construction: "M19 9l-7 7-7-7m14 0v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9m18 0L12 2 2 9",
    tools: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z",
    warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    arrowRight: "M17 8l4 4m0 0l-4 4m4-4H3"
};

// CORREGIDO: Error de sintaxis en strokeLinejoin
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// Componente de animación fade-in
const FadeIn = ({ children, delay = 0, className = "" }) => (
    <div 
        className={`animate-fade-in ${className}`} 
        style={{ 
            animationDelay: `${delay}ms`, 
            animationFillMode: 'both',
            opacity: 0
        }}
    >
        {children}
    </div>
);

// Componente Badge
const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        warning: 'bg-amber-100 text-amber-700 border border-amber-200',
        info: 'bg-blue-100 text-blue-700 border border-blue-200',
        construction: 'bg-orange-100 text-orange-700 border border-orange-200'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${variants[variant]}`}>
            {children}
        </span>
    );
};

export default function DashboardFinanciero() {
    const [dots, setDots] = useState('');

    // Animación de puntos suspensivos
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
            <style>{`
                @keyframes fade-in { 
                    from { opacity: 0; transform: translateY(30px) scale(0.95); } 
                    to { opacity: 1; transform: translateY(0) scale(1); } 
                }
                .animate-fade-in { animation: fade-in 0.6s ease-out; }
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 12s linear infinite; }
            `}</style>

            <div className="max-w-4xl mx-auto pt-12 md:pt-20">
                
                {/* Tarjeta Principal */}
                <FadeIn className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
                    
                    {/* Barra de color superior */}
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-amber-500 to-orange-500 w-full"></div>
                    
                    {/* Patrón de fondo decorativo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent opacity-50 rounded-bl-full"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-50 to-transparent opacity-50 rounded-tr-full"></div>

                    <div className="p-8 md:p-16 text-center relative z-10">
                        
                        {/* Icono principal animado */}
                        <FadeIn delay={100} className="mb-8">
                            <div className="relative inline-block">
                                {/* Círculos decorativos detrás */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-amber-100 rounded-full scale-150 animate-pulse-slow opacity-60"></div>
                                <div className="absolute inset-0 border-4 border-dashed border-slate-200 rounded-full animate-spin-slow scale-125"></div>
                                
                                {/* Icono central */}
                                <div className="relative bg-white rounded-full p-6 shadow-xl border border-slate-100 animate-float">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 text-white shadow-lg">
                                        <Icon path={Icons.construction} className="w-12 h-12" />
                                    </div>
                                </div>
                                
                                {/* Badges flotantes */}
                                <div className="absolute -top-2 -right-2">
                                    <Badge variant="construction">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                            EN DESARROLLO
                                        </span>
                                    </Badge>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Título principal */}
                        <FadeIn delay={200}>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-4 tracking-tight">
                                Módulo en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">Construcción</span>
                            </h1>
                        </FadeIn>

                        {/* Subtítulo animado */}
                        <FadeIn delay={300}>
                            <div className="flex items-center justify-center gap-2 mb-8">
                                <span className="text-2xl md:text-3xl font-bold text-slate-400">
                                    Próximamente{dots}
                                </span>
                            </div>
                        </FadeIn>

                        {/* Descripción */}
                        <FadeIn delay={400}>
                            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                                Estamos construyendo un <strong className="text-slate-700">Dashboard Financiero Avanzado</strong> con análisis en tiempo real, métricas clave y reportes ejecutivos para tu empresa.
                            </p>
                        </FadeIn>

                        {/* Features Grid */}
                        <FadeIn delay={500}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
                                    <div className="text-blue-600 mb-2 flex justify-center">
                                        <Icon path={Icons.chart} className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-slate-700 text-sm">Reportes Dinámicos</h3>
                                    <p className="text-xs text-slate-500 mt-1">Visualización de datos en tiempo real</p>
                                </div>
                                
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
                                    <div className="text-amber-600 mb-2 flex justify-center">
                                        <Icon path={Icons.tools} className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-slate-700 text-sm">Herramientas ERP</h3>
                                    <p className="text-xs text-slate-500 mt-1">Integración completa con módulos</p>
                                </div>
                                
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
                                    <div className="text-emerald-600 mb-2 flex justify-center">
                                        <Icon path={Icons.clock} className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-slate-700 text-sm">Análisis 24/7</h3>
                                    <p className="text-xs text-slate-500 mt-1">Monitoreo continuo de métricas</p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Barra de progreso decorativa */}
                        <FadeIn delay={600}>
                            <div className="max-w-md mx-auto mb-8">
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                    <span>Progreso del desarrollo</span>
                                    <span className="text-blue-600">75%</span>
                                </div>
                                <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 via-blue-600 to-amber-500 rounded-full relative">
                                        <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white opacity-50 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Mensaje de contacto o vuelta atrás */}
                        <FadeIn delay={700}>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button 
                                    onClick={() => window.history.back()}
                                    className="group flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all hover:scale-105 active:scale-95 shadow-lg"
                                >
                                    <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={Icons.arrowRight} />
                                    </svg>
                                    Volver al Inicio
                                </button>
                                
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Icon path={Icons.warning} className="w-4 h-4" />
                                    <span>Estimado: Q2 2026</span>
                                </div>
                            </div>
                        </FadeIn>

                    </div>

                    {/* Footer decorativo */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 p-4 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            FinanzasApp ERP • Sistema Integrado de Gestión Financiera
                        </p>
                    </div>
                </FadeIn>

                {/* Elementos flotantes de fondo (decorativos) */}
                <div className="fixed top-20 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float pointer-events-none"></div>
                <div className="fixed bottom-20 right-10 w-32 h-32 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float pointer-events-none" style={{animationDelay: '2s'}}></div>
                <div className="fixed top-1/2 left-1/4 w-16 h-16 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float pointer-events-none" style={{animationDelay: '4s'}}></div>
            </div>
        </div>
    );
}