// src/components/ConfirmacionDeposito.jsx
// Módulo de Confirmación de Depósito Bancario

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanCuentas, useDepositosTransitoERP, useDepositosBancariosERP } from '../hooks/useUnifiedAccounting';
import { confirmarDepositoBancario } from '../services/accountingService';


// Iconos SVG
const Icons = {
    check: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    camera: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
    fileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    alertCircle: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    arrowRight: "M14 5l7 7m0 0l-7 7m7-7H3"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// Componentes UI
const FadeIn = ({ children, delay = 0, className = "" }) => (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
        {children}
    </div>
);


const Card = ({ title, children, className = "", right, icon, gradient = false }) => (
    <div className={`rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden ${className} ${gradient ? 'bg-slate-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b ${gradient ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-2 rounded-lg ${gradient ? 'bg-white/20' : 'bg-blue-100'}`}>
                        <Icon path={Icons[icon]} className={`w-5 h-5 ${gradient ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                )}
                <div>
                    <h3 className={`text-lg font-bold ${gradient ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                </div>
            </div>
            {right}
        </div>
        <div className={`p-6 ${gradient ? 'text-white' : 'text-slate-700'}`}>{children}</div>
    </div>
);
const Button = ({ children, variant = 'primary', className = '', disabled, size = 'md', ...props }) => {
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2', lg: 'px-6 py-3' };
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        danger: 'bg-rose-600 hover:bg-rose-700 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
        purple: 'bg-purple-600 hover:bg-purple-700 text-white',
        sky: 'bg-sky-600 hover:bg-sky-700 text-white',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border border-slate-200',
        dark: 'bg-slate-800 hover:bg-slate-900 text-white'
    };
    
    return (
        <button disabled={disabled} className={`${sizes[size]} rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-100 text-emerald-700',
        danger: 'bg-rose-100 text-rose-700',
        warning: 'bg-amber-100 text-amber-700',
        info: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${variants[variant]}`}>{children}</span>;
};

const Input = ({ label, icon, type = "text", className = '', ...props }) => (
    <div className="space-y-1">
        {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>}
        <div className="relative group">
            {icon && <Icon path={Icons[icon]} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />}
            <input 
                type={type} 
                className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${icon ? 'pl-10' : ''} ${className}`} 
                {...props} 
            />
        </div>
    </div>
);

// Modal para ver imágenes
const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Comprobante de Depósito</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <Icon path={Icons.x} className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <img src={imageUrl} alt="Comprobante" className="w-full h-auto rounded-lg" />
            </div>
        </div>
    );
};
const safeFmt = (value, symbol = 'C$') => {
    const num = Number(value);

    if (!Number.isFinite(num)) {
        return `${symbol} 0.00`;
    }

    try {
        return `${symbol} ${num.toLocaleString('es-NI', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    } catch (error) {
        console.warn('Error formateando valor:', value, error);
        return `${symbol} ${num.toFixed(2)}`;
    }
};
// Componente principal
export default function ConfirmacionDeposito() {
    const { user } = useAuth();
    const { getBancoAccounts } = usePlanCuentas();
    const { depositos: depositosPendientes = [], loading: loadingPendientes, error: errorPendientes } = useDepositosTransitoERP('pendiente');
    const { depositos: depositosConfirmados = [], loading: loadingConfirmados, error: errorConfirmados } = useDepositosBancariosERP();

    const [activeTab, setActiveTab] = useState('pendientes');
    const [loading, setLoading] = useState(false);
    const [selectedDeposito, setSelectedDeposito] = useState(null);
    const [comprobantePreview, setComprobantePreview] = useState(null);
    const [viewingImage, setViewingImage] = useState(null);
    const fileInputRef = useRef();

    const OBSERVACION_DEFAULT = "CUENTAS BANCARIAS A NOMBRE DE LUIS MANUEL SAENZ ROBLERO CUENTA C$ 362705105 CUENTA C$ 362785164";

    const [formData, setFormData] = useState({
        bancoDestinoId: '',
        bancoDestinoCode: '',
        bancoDestinoName: '',
        fechaDeposito: new Date().toISOString().substring(0, 10),
        horaDeposito: new Date().toTimeString().substring(0, 5),
        referenciaBancaria: '',
        comprobanteFile: null,
        comentarios: OBSERVACION_DEFAULT
    });

    const bancosDisponibles = selectedDeposito
        ? getBancoAccounts(selectedDeposito.moneda)
        : [];

const handleSelectDeposito = (deposito) => {
    setSelectedDeposito(deposito);
    setFormData({
        bancoDestinoId: '',
        bancoDestinoCode: '',
        bancoDestinoName: '',
        fechaDeposito: new Date().toISOString().substring(0, 10),
        horaDeposito: new Date().toTimeString().substring(0, 5),
        referenciaBancaria: '',
        comprobanteFile: null,
        comentarios: OBSERVACION_DEFAULT
    });
    setComprobantePreview(null);
};

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo y tamaño
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                alert('Solo se permiten archivos JPG, PNG o PDF');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('El archivo no debe superar los 5MB');
                return;
            }

            setFormData(prev => ({ ...prev, comprobanteFile: file }));
            
            // Crear preview para imágenes
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setComprobantePreview(reader.result);
                reader.readAsDataURL(file);
            } else {
                setComprobantePreview('pdf');
            }
        }
    };

    const handleBancoChange = (bancoId) => {
        const banco = bancosDisponibles.find(b => b.id === bancoId);
        if (banco) {
            setFormData(prev => ({
                ...prev,
                bancoDestinoId: banco.id,
                bancoDestinoCode: banco.code,
                bancoDestinoName: banco.name
            }));
        }
    };

    const handleConfirmar = async () => {
        if (!formData.bancoDestinoId) {
            alert('Debe seleccionar un banco destino');
            return;
        }
        if (!formData.referenciaBancaria.trim()) {
            alert('Debe ingresar la referencia bancaria');
            return;
        }

        setLoading(true);
        try {
            // Aquí deberías subir el archivo a Firebase Storage primero
            // y obtener la URL. Por ahora simulamos esto.
            const comprobanteURL = comprobantePreview && comprobantePreview !== 'pdf' 
                ? comprobantePreview 
                : null;

            const confirmacionData = {
                bancoDestinoId: formData.bancoDestinoId,
                bancoDestinoCode: formData.bancoDestinoCode,
                bancoDestinoName: formData.bancoDestinoName,
                fechaDeposito: formData.fechaDeposito,
                horaDeposito: formData.horaDeposito,
                referenciaBancaria: formData.referenciaBancaria,
                comprobanteURL,
                comentarios: formData.comentarios,
                userId: user?.uid,
                userEmail: user?.email
            };

            const result = await confirmarDepositoBancario(selectedDeposito.id, confirmacionData);
            
            alert('Depósito confirmado exitosamente');
            setSelectedDeposito(null);
            setComprobantePreview(null);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <FadeIn className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 mb-2">
                                Confirmación de <span className="text-blue-600">Depósito</span>
                            </h1>
                            <p className="text-slate-500">Confirmar depósitos bancarios realizados</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant={activeTab === 'pendientes' ? 'primary' : 'ghost'}
                                onClick={() => { setActiveTab('pendientes'); setSelectedDeposito(null); }}
                            >
                                Pendientes
                            </Button>
                            <Button 
                                variant={activeTab === 'confirmados' ? 'primary' : 'ghost'}
                                onClick={() => { setActiveTab('confirmados'); setSelectedDeposito(null); }}
                            >
                                Confirmados
                            </Button>
                        </div>
                    </div>
                </FadeIn>

                {activeTab === 'pendientes' && !selectedDeposito && (
                    <FadeIn delay={100}>
                        <Card title="Depósitos en Tránsito Pendientes" icon="cash">
                            {loadingPendientes ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-2 text-slate-500">Cargando...</p>
                                </div>
                            ) : depositosPendientes.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Icon path={Icons.info} className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-lg font-medium">No hay depósitos pendientes</p>
                                    <p className="text-sm">Todos los depósitos en tránsito han sido confirmados</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {depositosPendientes.map(dep => (
                                        <div 
                                            key={dep.id} 
                                            onClick={() => handleSelectDeposito(dep)}
                                            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-mono font-bold text-slate-800">
                                                        #{dep.numero?.toString().padStart(4, '0')}
                                                    </div>
                                                    <div className="text-sm text-slate-500">{dep.fecha}</div>
                                                </div>
                                                <Badge variant="warning">Pendiente</Badge>
                                            </div>
                                            
                                            <div className="text-2xl font-black text-slate-800 mb-2">
                                                {safeFmt(dep.total, dep.moneda === 'USD' ? '$' : 'C$')}
                                            </div>
                                            
                                            <div className="text-sm text-slate-600 mb-3">
                                                <span className="text-slate-400">Responsable:</span> {dep.responsable}
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-slate-500 uppercase">Cajas incluidas:</div>
                                                {dep.cuentasOrigen?.slice(0, 2).map((c, i) => (
                                                    <div key={i} className="text-sm text-slate-600 flex justify-between">
                                                        <span>{c.accountName}</span>
                                                        <span>{safeFmt(c.monto, dep.moneda === 'USD' ? '$' : 'C$')}</span>
                                                    </div>
                                                ))}
                                                {(dep.cuentasOrigen?.length || 0) > 2 && (
                                                    <div className="text-sm text-slate-400">
                                                        +{(dep.cuentasOrigen.length - 2)} más
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="mt-4 pt-3 border-t border-slate-100">
                                                <Button variant="primary" size="sm" className="w-full">
                                                    <Icon path={Icons.arrowRight} className="w-4 h-4 mr-2" />
                                                    Confirmar Depósito
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </FadeIn>
                )}

                {activeTab === 'pendientes' && selectedDeposito && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Información del depósito */}
                        <FadeIn delay={100}>
                            <Card title="Información del Depósito" icon="cash" gradient>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-300">Número:</span>
                                        <span className="font-mono font-bold text-xl text-white">
                                            #{selectedDeposito.numero?.toString().padStart(4, '0')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-300">Fecha:</span>
                                        <span className="text-white">{selectedDeposito.fecha}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-300">Responsable:</span>
                                        <span className="text-white">{selectedDeposito.responsable}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-300">Moneda:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedDeposito.moneda === 'USD' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                            {selectedDeposito.moneda === 'USD' ? '$ USD' : 'C$ NIO'}
                                        </span>
                                    </div>
                                    <div className="border-t border-slate-600 pt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-300">Monto Total:</span>
                                            <span className="text-3xl font-black text-emerald-400">
                                                {safeFmt(selectedDeposito.total, selectedDeposito.moneda === 'USD' ? '$' : 'C$')}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-slate-600 pt-4">
                                        <div className="text-sm text-slate-400 mb-2">Cajas incluidas:</div>
                                        {selectedDeposito.cuentasOrigen?.map((c, i) => (
                                            <div key={i} className="flex justify-between text-sm py-1">
                                                <span className="text-slate-300">{c.accountName}</span>
                                                <span className="text-white font-semibold">{safeFmt(c.monto, selectedDeposito.moneda === 'USD' ? '$' : 'C$')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </FadeIn>

                        {/* Formulario de confirmación */}
                        <FadeIn delay={150}>
                            <Card title="Confirmar Depósito Bancario" icon="building">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Fecha del Depósito"
                                            type="date"
                                            icon="calendar"
                                            value={formData.fechaDeposito}
                                            onChange={(e) => setFormData({...formData, fechaDeposito: e.target.value})}
                                        />
                                        <Input
                                            label="Hora del Depósito"
                                            type="time"
                                            value={formData.horaDeposito}
                                            onChange={(e) => setFormData({...formData, horaDeposito: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Banco Destino
                                        </label>
                                        <select
                                            value={formData.bancoDestinoId}
                                            onChange={(e) => handleBancoChange(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Seleccionar banco...</option>
                                            {bancosDisponibles.map(banco => (
                                                <option key={banco.id} value={banco.id}>
                                                    {banco.name} (Saldo: {safeFmt(banco.currency === 'USD' ? banco.balanceUSD : banco.balance, banco.currency === 'USD' ? '$' : 'C$')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <Input
                                        label="Referencia Bancaria"
                                        icon="fileText"
                                        value={formData.referenciaBancaria}
                                        onChange={(e) => setFormData({...formData, referenciaBancaria: e.target.value})}
                                        placeholder="Ej: DEP123456, transferencia #789..."
                                        required
                                    />

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Comprobante (Foto/PDF)
                                        </label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                                        >
                                            {comprobantePreview ? (
                                                comprobantePreview === 'pdf' ? (
                                                    <div className="flex items-center justify-center gap-2 text-slate-600">
                                                        <Icon path={Icons.fileText} className="w-8 h-8" />
                                                        <span>Archivo PDF seleccionado</span>
                                                    </div>
                                                ) : (
                                                    <img 
                                                        src={comprobantePreview} 
                                                        alt="Comprobante" 
                                                        className="max-h-48 mx-auto rounded-lg"
                                                    />
                                                )
                                            ) : (
                                                <>
                                                    <Icon path={Icons.camera} className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                                                    <p className="text-sm text-slate-600 font-semibold">
                                                        Haga clic para subir foto del comprobante
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        JPG, PNG o PDF (máx. 5MB)
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg,application/pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Comentarios
                                        </label>
                                        <textarea
                                            value={formData.comentarios}
                                            onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                                            placeholder="Comentarios adicionales..."
                                            className="w-full h-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setSelectedDeposito(null)}
                                            className="flex-1"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button 
                                            variant="success" 
                                            onClick={handleConfirmar}
                                            disabled={loading || !formData.bancoDestinoId || !formData.referenciaBancaria}
                                            className="flex-1 flex items-center justify-center gap-2"
                                        >
                                            <Icon path={Icons.check} className="w-5 h-5" />
                                            {loading ? 'Confirmando...' : 'Confirmar Depósito'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </FadeIn>
                    </div>
                )}

                {activeTab === 'confirmados' && (
                    <FadeIn delay={100}>
                        <Card title="Depósitos Bancarios Confirmados" icon="building">
                            {loadingConfirmados ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-2 text-slate-500">Cargando...</p>
                                </div>
                            ) : depositosConfirmados.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Icon path={Icons.info} className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-lg font-medium">No hay depósitos confirmados</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">#</th>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Fecha Depósito</th>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Banco</th>
                                                <th className="px-4 py-3 text-right font-bold text-slate-600">Monto</th>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Referencia</th>
                                                <th className="px-4 py-3 text-center font-bold text-slate-600">Comprobante</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {depositosConfirmados.map(dep => (
                                                <tr key={dep.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-mono font-bold">
                                                        #{dep.numero?.toString().padStart(4, '0')}
                                                    </td>
                                                    <td className="px-4 py-3">{dep.fecha}</td>
                                                    <td className="px-4 py-3">{dep.bancoDestinoName}</td>
                                                    <td className="px-4 py-3 text-right font-bold">
                                                        {safeFmt(dep.monto, dep.moneda === 'USD' ? '$' : 'C$')}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-600">
                                                        {dep.referenciaBancaria}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {dep.comprobanteURL ? (
                                                            <button 
                                                                onClick={() => setViewingImage(dep.comprobanteURL)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Ver comprobante"
                                                            >
                                                                <Icon path={Icons.eye} className="w-5 h-5" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </FadeIn>
                )}
            </div>

            {/* Modal para ver imágenes */}
            {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
        </div>
    );
}
