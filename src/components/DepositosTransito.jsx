// src/components/DepositosTransito.jsx
// Módulo de Depósitos en Tránsito

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDepositosTransito } from '../hooks/useAccounting.jsx';
import { usePlanCuentas } from '../hooks/useUnifiedAccounting';
import { createDepositoTransito, cancelarDepositoTransito } from '../services/accountingService';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fmt } from '../constants';

// Iconos SVG
const Icons = {
    plus: "M12 4v16m8-8H4",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    check: "M5 13l4 4L19 7",
    printer: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    alertCircle: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    arrowRight: "M14 5l7 7m0 0l-7 7m7-7H3",
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    unlock: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    chevronRight: "M9 5l7 7-7 7",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    camera: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"
};

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
    <div className={`rounded-2xl shadow-lg border border-slate-200/60 bg-white overflow-hidden ${className}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b border-slate-100 ${gradient ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-2 rounded-lg ${gradient ? 'bg-white/10' : 'bg-blue-100'}`}>
                        <Icon path={Icons[icon]} className={`w-5 h-5 ${gradient ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                )}
                <div>
                    <h3 className={`text-lg font-bold ${gradient ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                </div>
            </div>
            {right}
        </div>
        <div className="p-6">{children}</div>
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

// Componente de ticket imprimible 80mm
const Ticket80mm = React.forwardRef(({ deposito, cuentas }, ref) => {
    const fecha = new Date().toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div ref={ref} className="ticket-80mm" style={{ 
            width: '80mm', 
            padding: '5mm',
            fontFamily: 'monospace',
            fontSize: '10pt',
            lineHeight: '1.3',
            background: 'white',
            color: 'black'
        }}>
            <style>{`
                @media print {
                    @page { size: 80mm auto; margin: 0; }
                    body { margin: 0; padding: 0; }
                    .ticket-80mm { width: 80mm !important; }
                }
            `}</style>
            
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '3mm', marginBottom: '3mm' }}>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>DEPÓSITO EN TRÁNSITO</div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold', marginTop: '2mm' }}>
                    #{deposito.numero?.toString().padStart(4, '0')}
                </div>
            </div>

            <div style={{ marginBottom: '3mm' }}>
                <div><strong>Fecha:</strong> {fecha}</div>
                <div><strong>Responsable:</strong> {deposito.responsable}</div>
                <div><strong>Moneda:</strong> {deposito.moneda === 'NIO' ? 'C$ (Córdobas)' : '$ (Dólares)'}</div>
            </div>

            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '3mm 0', marginBottom: '3mm' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>CAJAS INCLUIDAS:</div>
                {cuentas.map((cuenta, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{cuenta.accountName}</span>
                        <span>{deposito.moneda === 'NIO' ? 'C$' : '$'} {Number(cuenta.monto).toFixed(2)}</span>
                    </div>
                ))}
                <div style={{ borderTop: '1px solid #000', marginTop: '2mm', paddingTop: '2mm', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt' }}>
                    <span>TOTAL:</span>
                    <span>{deposito.moneda === 'NIO' ? 'C$' : '$'} {Number(deposito.total).toFixed(2)}</span>
                </div>
            </div>

            {deposito.desgloseBilletes && Object.keys(deposito.desgloseBilletes).length > 0 && (
                <div style={{ marginBottom: '3mm' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>DESGLOSE:</div>
                    {Object.entries(deposito.desgloseBilletes).map(([denominacion, cantidad]) => (
                        cantidad > 0 && (
                            <div key={denominacion} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{denominacion} x {cantidad}</span>
                                <span>{deposito.moneda === 'NIO' ? 'C$' : '$'} {(Number(denominacion) * cantidad).toFixed(2)}</span>
                            </div>
                        )
                    ))}
                </div>
            )}

            {deposito.observaciones && (
                <div style={{ marginBottom: '5mm', padding: '3mm', backgroundColor: '#f0f0f0', border: '1px dashed #999' }}>
                    <div style={{ fontSize: '8pt', fontWeight: 'bold', marginBottom: '1mm', color: '#666' }}>OBSERVACIÓN:</div>
                    <div style={{ fontSize: '11pt', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.4' }}>
                        {deposito.observaciones}
                    </div>
                </div>
            )}

            <div style={{ borderTop: '2px dashed #000', paddingTop: '5mm', marginTop: '5mm', textAlign: 'center' }}>
                <div style={{ fontSize: '9pt', marginBottom: '10mm' }}>_____________________________</div>
                <div style={{ fontSize: '9pt' }}>Firma de quien recibe</div>
            </div>

            <div style={{ marginTop: '5mm', textAlign: 'center', fontSize: '8pt' }}>
                FinanzasApp - Sistema Administrativo
            </div>
        </div>
    );
});

Ticket80mm.displayName = 'Ticket80mm';

// Componente principal
export default function DepositosTransito() {
    const { user } = useAuth();
    const { getCajaAccounts } = useChartOfAccounts();
    const { depositos, loading: depositosLoading } = useDepositosTransito();
    const [activeTab, setActiveTab] = useState('nuevo');
    const [loading, setLoading] = useState(false);
    const [showTicket, setShowTicket] = useState(false);
    const [lastDeposito, setLastDeposito] = useState(null);
    const [viewingImage, setViewingImage] = useState(null);
    const ticketRef = useRef();
    const fileInputRef = useRef();
    const [cajasDisponibles, setCajasDisponibles] = useState([]);
    const [loadingCajas, setLoadingCajas] = useState(false);

    // Texto de observación por defecto para depósitos
    const OBSERVACION_DEFAULT = "CUENTAS BANCARIAS A NOMBRE DE LUIS MANUEL SAENZ ROBLERO CUENTA C$ 362705105 CUENTA C$ 362705105";

    // Formulario
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().substring(0, 10),
        responsable: user?.email?.split('@')[0] || '',
        moneda: 'NIO',
        cuentasSeleccionadas: [], // [{ accountId, accountCode, accountName, monto, saldoDisponible }]
        observaciones: OBSERVACION_DEFAULT
    });

    // Foto del depósito
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);

    // Desglose de billetes
    const [desglose, setDesglose] = useState({
        1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.5: 0
    });

    // Obtener cuentas de caja según moneda
   useEffect(() => {
    const cargarCajas = async () => {
        setLoadingCajas(true);
        try {
            const cajas = await getCajaAccounts(formData.moneda);
            setCajasDisponibles(cajas || []); // Asegurar que sea array
        } catch (error) {
            console.error('Error cargando cajas:', error);
            setCajasDisponibles([]);
        } finally {
            setLoadingCajas(false);
        }
    };
    cargarCajas();
}, [formData.moneda, getCajaAccounts]);

    // Calcular totales
    const totalSeleccionado = formData.cuentasSeleccionadas.reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
    const totalDesglose = Object.entries(desglose).reduce((sum, [denom, cantidad]) => {
        return sum + (Number(denom) * Number(cantidad));
    }, 0);
    const diferencia = totalDesglose - totalSeleccionado;

    const handleAddCuenta = (account) => {
        if (formData.cuentasSeleccionadas.find(c => c.accountId === account.id)) return;
        
        setFormData(prev => ({
            ...prev,
            cuentasSeleccionadas: [...prev.cuentasSeleccionadas, {
                accountId: account.id,
                accountCode: account.code,
                accountName: account.name,
                monto: '',
                saldoDisponible: account.currency === 'USD' ? (account.balanceUSD || 0) : (account.balance || 0)
            }]
        }));
    };

    const updateCuentaMonto = (accountId, monto) => {
        setFormData(prev => ({
            ...prev,
            cuentasSeleccionadas: prev.cuentasSeleccionadas.map(c => 
                c.accountId === accountId ? { ...c, monto } : c
            )
        }));
    };

    const removeCuenta = (accountId) => {
        setFormData(prev => ({
            ...prev,
            cuentasSeleccionadas: prev.cuentasSeleccionadas.filter(c => c.accountId !== accountId)
        }));
    };

    const updateDesglose = (denominacion, cantidad) => {
        setDesglose(prev => ({ ...prev, [denominacion]: Number(cantidad) || 0 }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Solo se permiten archivos de imagen');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('El archivo no debe superar los 5MB');
                return;
            }
            setFotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setFotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (formData.cuentasSeleccionadas.length === 0) {
            alert('Debe seleccionar al menos una cuenta');
            return;
        }
        if (totalSeleccionado <= 0) {
            alert('El monto total debe ser mayor a cero');
            return;
        }
        if (diferencia !== 0) {
            if (!window.confirm(`Hay una diferencia de ${fmt(diferencia)} entre el total seleccionado y el desglose. ¿Desea continuar?`)) {
                return;
            }
        }

        setLoading(true);
        try {
            // Subir foto si existe
            let fotoURL = null;
            if (fotoFile) {
                const storageRef = ref(storage, `depositos/${Date.now()}_${fotoFile.name}`);
                await uploadBytes(storageRef, fotoFile);
                fotoURL = await getDownloadURL(storageRef);
            }

            const depositoData = {
                fecha: formData.fecha,
                responsable: formData.responsable,
                moneda: formData.moneda,
                cuentasOrigen: formData.cuentasSeleccionadas.map(c => ({
                    accountId: c.accountId,
                    accountCode: c.accountCode,
                    accountName: c.accountName,
                    monto: Number(c.monto)
                })),
                total: totalSeleccionado,
                desgloseBilletes: desglose,
                observaciones: formData.observaciones,
                fotoURL,
                userId: user?.uid,
                userEmail: user?.email
            };

            const result = await createDepositoTransito(depositoData);
            setLastDeposito({ ...depositoData, numero: result.numero });
            setShowTicket(true);
            
            // Resetear formulario
            setFormData({
                fecha: new Date().toISOString().substring(0, 10),
                responsable: user?.email?.split('@')[0] || '',
                moneda: 'NIO',
                cuentasSeleccionadas: [],
                observaciones: OBSERVACION_DEFAULT
            });
            setDesglose({ 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.5: 0 });
            setFotoFile(null);
            setFotoPreview(null);
            
            alert('Depósito en tránsito creado exitosamente');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const ticketContent = ticketRef.current.innerHTML;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Depósito #${lastDeposito?.numero}</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body { margin: 0; padding: 0; font-family: monospace; }
                    </style>
                </head>
                <body>${ticketContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleCancelar = async (depositoId) => {
        const motivo = prompt('Ingrese el motivo de la cancelación:');
        if (!motivo) return;
        
        setLoading(true);
        try {
            await cancelarDepositoTransito(depositoId, motivo, user?.uid, user?.email);
            alert('Depósito cancelado exitosamente');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            pendiente: <Badge variant="warning">Pendiente</Badge>,
            confirmado: <Badge variant="success">Confirmado</Badge>,
            cancelado: <Badge variant="danger">Cancelado</Badge>
        };
        return badges[estado] || <Badge>{estado}</Badge>;
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
                                Depósitos en <span className="text-blue-600">Tránsito</span>
                            </h1>
                            <p className="text-slate-500">Recolección de efectivo para depósito bancario</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant={activeTab === 'nuevo' ? 'primary' : 'ghost'}
                                onClick={() => setActiveTab('nuevo')}
                            >
                                Nuevo Depósito
                            </Button>
                            <Button 
                                variant={activeTab === 'pendientes' ? 'primary' : 'ghost'}
                                onClick={() => setActiveTab('pendientes')}
                            >
                                Pendientes
                            </Button>
                            <Button 
                                variant={activeTab === 'historial' ? 'primary' : 'ghost'}
                                onClick={() => setActiveTab('historial')}
                            >
                                Historial
                            </Button>
                        </div>
                    </div>
                </FadeIn>

                {activeTab === 'nuevo' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulario principal */}
                        <div className="lg:col-span-2 space-y-6">
                            <FadeIn delay={100}>
                                <Card title="Información General" icon="calendar">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input
                                            label="Fecha"
                                            type="date"
                                            value={formData.fecha}
                                            onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                                        />
                                        <Input
                                            label="Responsable"
                                            value={formData.responsable}
                                            onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                                        />
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Moneda</label>
                                            <select
                                                value={formData.moneda}
                                                onChange={(e) => {
                                                    setFormData({...formData, moneda: e.target.value, cuentasSeleccionadas: []});
                                                    setDesglose(e.target.value === 'USD' 
                                                        ? { 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.5: 0, 0.25: 0 }
                                                        : { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.5: 0 }
                                                    );
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                            >
                                                <option value="NIO">C$ (Córdobas)</option>
                                                <option value="USD">$ (Dólares)</option>
                                            </select>
                                        </div>
                                    </div>
                                </Card>
                            </FadeIn>

                           <FadeIn delay={150}>
    <Card title="Seleccionar Cajas" icon="wallet">
        <div className="space-y-4">
            {/* Cajas disponibles */}
            {loadingCajas ? (
                <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-500 mt-1">Cargando cajas...</p>
                </div>
            ) : !Array.isArray(cajasDisponibles) || cajasDisponibles.length === 0 ? (
                <div className="text-center py-4 text-amber-600 text-sm font-semibold bg-amber-50 rounded-lg">
                    No hay cajas disponibles para {formData.moneda}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {cajasDisponibles.map(caja => (
                        <button
                            key={caja.id}
                            onClick={() => handleAddCuenta(caja)}
                            disabled={formData.cuentasSeleccionadas.find(c => c.accountId === caja.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                formData.cuentasSeleccionadas.find(c => c.accountId === caja.id)
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                        >
                            {caja.name} ({fmt(caja.currency === 'USD' ? caja.balanceUSD : caja.balance, caja.currency === 'USD' ? '$' : 'C$')})
                        </button>
                    ))}
                </div>
            )}

            {/* Cajas seleccionadas */}
            {formData.cuentasSeleccionadas.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-700">Cajas seleccionadas:</h4>
                    {formData.cuentasSeleccionadas.map(cuenta => (
                        <div key={cuenta.accountId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="flex-1">
                                <div className="font-semibold text-slate-800">{cuenta.accountName}</div>
                                <div className="text-xs text-slate-500">
                                    Saldo disponible: {fmt(cuenta.saldoDisponible, formData.moneda === 'USD' ? '$' : 'C$')}
                                </div>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                value={cuenta.monto}
                                onChange={(e) => updateCuentaMonto(cuenta.accountId, e.target.value)}
                                placeholder="Monto"
                                className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-blue-500 outline-none"
                            />
                            <button
                                onClick={() => removeCuenta(cuenta.accountId)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                            >
                                <Icon path={Icons.trash} className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                        <span className="text-slate-400 font-bold">Total seleccionado:</span>
                        <span className="text-xl font-black text-white">
                            {fmt(totalSeleccionado, formData.moneda === 'USD' ? '$' : 'C$')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    </Card>
</FadeIn>
                            <FadeIn delay={200}>
                                <Card title="Desglose de Billetes" icon="cash">
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                        {Object.keys(desglose).map(denominacion => (
                                            <div key={denominacion} className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500">
                                                    {formData.moneda === 'USD' ? '$' : 'C$'}{denominacion}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={desglose[denominacion] || ''}
                                                    onChange={(e) => updateDesglose(denominacion, e.target.value)}
                                                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center focus:border-blue-500 outline-none"
                                                />
                                                <div className="text-xs text-slate-400 text-center">
                                                    = {fmt(Number(denominacion) * (desglose[denominacion] || 0), formData.moneda === 'USD' ? '$' : 'C$')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700">Total contado:</span>
                                            <span className="text-xl font-black text-slate-800">
                                                {fmt(totalDesglose, formData.moneda === 'USD' ? '$' : 'C$')}
                                            </span>
                                        </div>
                                        {diferencia !== 0 && (
                                            <div className={`mt-2 text-sm font-bold ${diferencia > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                Diferencia: {fmt(diferencia, formData.moneda === 'USD' ? '$' : 'C$')}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </FadeIn>

                            <FadeIn delay={225}>
                                <Card title="Foto del Depósito" icon="camera">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                                    >
                                        {fotoPreview ? (
                                            <img src={fotoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                        ) : (
                                            <>
                                                <Icon path={Icons.camera} className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                                                <p className="text-sm text-slate-600 font-semibold">Haga clic para subir foto del depósito</p>
                                                <p className="text-xs text-slate-400 mt-1">JPG, PNG (máx. 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </Card>
                            </FadeIn>

                            <FadeIn delay={250}>
                                <Card title="Observaciones" icon="info" collapsible defaultOpen={false}>
                                    <textarea
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                                        placeholder="Observaciones adicionales..."
                                        className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 resize-none"
                                    />
                                </Card>
                            </FadeIn>

                            <FadeIn delay={300}>
                                <div className="flex gap-4">
                                    <Button 
                                        variant="success" 
                                        onClick={handleSubmit}
                                        disabled={loading || formData.cuentasSeleccionadas.length === 0}
                                        className="flex-1 py-4 text-lg"
                                    >
                                        <Icon path={Icons.save} className="w-5 h-5 mr-2" />
                                        {loading ? 'Creando...' : 'Crear Depósito en Tránsito'}
                                    </Button>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Panel lateral con instrucciones */}
                        <div className="space-y-6">
                            <FadeIn delay={150}>
                                <Card title="Instrucciones" icon="info">
                                    <div className="space-y-3 text-sm text-slate-600">
                                        <div className="flex items-start gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                                            <p>Seleccione la moneda del depósito (C$ o USD)</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                                            <p>Haga clic en las cajas que desea incluir en el depósito</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                                            <p>Ingrese el monto a tomar de cada caja</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                                            <p>Realice el conteo físico y registre el desglose de billetes</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                                            <p>Verifique que el total coincida o justifique la diferencia</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">6</span>
                                            <p>Cree el depósito e imprima el ticket para el sobre</p>
                                        </div>
                                    </div>
                                </Card>
                            </FadeIn>

                            <FadeIn delay={200}>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon path={Icons.alertCircle} className="w-5 h-5 text-amber-600" />
                                        <span className="font-bold text-amber-800">Importante</span>
                                    </div>
                                    <p className="text-sm text-amber-700">
                                        Al crear el depósito, el sistema automáticamente:
                                    </p>
                                    <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                                        <li>Disminuirá el saldo de las cajas seleccionadas</li>
                                        <li>Aumentará el saldo de "Efectivo en Tránsito"</li>
                                        <li>Generará un ticket imprimible para el sobre</li>
                                    </ul>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                )}

                {(activeTab === 'pendientes' || activeTab === 'historial') && (
                    <FadeIn>
                        <Card title={activeTab === 'pendientes' ? 'Depósitos Pendientes' : 'Historial de Depósitos'} icon="building">
                            {depositosLoading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-2 text-slate-500">Cargando...</p>
                                </div>
                            ) : depositos.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Icon path={Icons.info} className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p>No hay depósitos {activeTab === 'pendientes' ? 'pendientes' : 'en el historial'}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">#</th>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Fecha</th>
                                                <th className="px-4 py-3 text-left font-bold text-slate-600">Responsable</th>
                                                <th className="px-4 py-3 text-center font-bold text-slate-600">Moneda</th>
                                                <th className="px-4 py-3 text-right font-bold text-slate-600">Monto</th>
                                                <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                                                <th className="px-4 py-3 text-center font-bold text-slate-600">Foto</th>
                                                <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {depositos.map(dep => (
                                                <tr key={dep.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-mono font-bold">#{dep.numero?.toString().padStart(4, '0')}</td>
                                                    <td className="px-4 py-3">{dep.fecha}</td>
                                                    <td className="px-4 py-3">{dep.responsable}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant={dep.moneda === 'USD' ? 'info' : 'default'}>
                                                            {dep.moneda === 'USD' ? '$' : 'C$'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold">
                                                        {fmt(dep.total, dep.moneda === 'USD' ? '$' : 'C$')}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {getEstadoBadge(dep.estado)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {dep.fotoURL ? (
                                                            <button 
                                                                onClick={() => setViewingImage(dep.fotoURL)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Ver foto"
                                                            >
                                                                <Icon path={Icons.eye} className="w-5 h-5" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {dep.estado === 'pendiente' && (
                                                            <div className="flex justify-center gap-2">
                                                                <Button 
                                                                    variant="success" 
                                                                    size="sm"
                                                                    onClick={() => {/* Ir a confirmación */}}
                                                                >
                                                                    <Icon path={Icons.arrowRight} className="w-4 h-4" />
                                                                </Button>
                                                                <Button 
                                                                    variant="danger" 
                                                                    size="sm"
                                                                    onClick={() => handleCancelar(dep.id)}
                                                                >
                                                                    <Icon path={Icons.trash} className="w-4 h-4" />
                                                                </Button>
                                                            </div>
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

                {/* Modal de Ticket */}
                {showTicket && lastDeposito && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-slate-800">Ticket de Depósito</h3>
                                <button 
                                    onClick={() => setShowTicket(false)} 
                                    className="p-2 hover:bg-slate-100 rounded-full"
                                >
                                    <Icon path={Icons.x} className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="bg-slate-100 p-4 rounded-lg mb-4 overflow-auto" style={{ maxHeight: '400px' }}>
                                <div className="hidden">
                                    <Ticket80mm 
                                        ref={ticketRef} 
                                        deposito={lastDeposito} 
                                        cuentas={lastDeposito.cuentasOrigen} 
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <Ticket80mm 
                                        deposito={lastDeposito} 
                                        cuentas={lastDeposito.cuentasOrigen} 
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setShowTicket(false)}
                                    className="flex-1"
                                >
                                    Cerrar
                                </Button>
                                <Button 
                                    variant="dark" 
                                    onClick={handlePrint}
                                    className="flex-1 flex items-center justify-center gap-2"
                                >
                                    <Icon path={Icons.printer} className="w-4 h-4" />
                                    Imprimir Ticket
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal para ver imágenes */}
                {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
            </div>
        </div>
    );
}
