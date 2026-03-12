// src/components/ComprasGastos.jsx
// Módulo de Compras y Gastos - Placeholder

import React from 'react';

const Icons = {
    cube: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

export default function ComprasGastos() {
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon path={Icons.cube} className="w-10 h-10 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-4">
                        Compras y Gastos
                    </h1>
                    <p className="text-slate-500 mb-6 max-w-lg mx-auto">
                        Este módulo está en desarrollo. Por favor, utilice el módulo 
                        <strong> "Gestión de Gastos"</strong> o <strong>"Gastos Diarios"</strong> para registrar compras y gastos.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                        <a 
                            href="/gastos" 
                            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors"
                        >
                            Ir a Gestión de Gastos
                        </a>
                        <a 
                            href="/gastos-diarios" 
                            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
                        >
                            Ir a Gastos Diarios
                        </a>
                    </div>

                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-2 text-amber-800">
                            <Icon path={Icons.info} className="w-5 h-5" />
                            <span className="font-semibold">Nota:</span>
                        </div>
                        <p className="text-amber-700 text-sm mt-2">
                            Los nuevos módulos de <strong>Ventas</strong> y <strong>Gastos</strong> ya están disponibles en el menú Financiero.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
