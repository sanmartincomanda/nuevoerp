// src/components/ConfiguracionUsuarios.jsx
// Gestión de Usuarios - Asignación de Roles Pre-configurados

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
    collection, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    Timestamp,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
} from 'firebase/auth';

const Icons = {
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    plus: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    save: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    key: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    check: "M5 13l4 4L19 7",
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    unlock: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
};

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', ...props }) => {
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200',
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
        ghost: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
    };
    
    return (
        <button className={`${sizes[size]} rounded-xl font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 ${variants[variant]} ${className}`} {...props}>
            {icon && <Icon path={Icons[icon]} className="w-4 h-4" />}
            {children}
        </button>
    );
};

const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-600 border-slate-200',
        success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        danger: 'bg-rose-100 text-rose-700 border-rose-200',
        warning: 'bg-amber-100 text-amber-700 border-amber-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${variants[variant]}`}>{children}</span>;
};

const ADMIN_EMAIL = 'carnessanmartingranada@gmail.com';

export default function ConfiguracionUsuarios() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    const [newUser, setNewUser] = useState({
        email: '',
        displayName: '',
        roleId: '',
        password: '',
        confirmPassword: ''
    });
    
    const [editUser, setEditUser] = useState({
        displayName: '',
        roleId: '',
        isActive: true
    });
    
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Verificar admin
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUser(user);
                setIsAdmin(user.email === ADMIN_EMAIL);
            }
        });
        return () => unsubscribe();
    }, []);

    // Cargar usuarios y roles
    useEffect(() => {
        setLoading(true);
        
        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                lastLogin: doc.data().lastLogin?.toDate?.() || doc.data().lastLogin
            }));
            usersData.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0);
                return dateB - dateA;
            });
            setUsers(usersData);
            setLoading(false);
        });

        const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
            setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubUsers();
            unsubRoles();
        };
    }, []);

    const filteredUsers = users.filter(user => {
        const term = searchTerm.toLowerCase();
        const roleName = roles.find(r => r.id === user.roleId)?.name?.toLowerCase() || '';
        return (
            user.email?.toLowerCase().includes(term) ||
            user.displayName?.toLowerCase().includes(term) ||
            roleName.includes(term)
        );
    });

    const getRoleById = (roleId) => roles.find(r => r.id === roleId);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        
        if (newUser.password !== newUser.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        if (!newUser.roleId) {
            alert('Debes seleccionar un rol');
            return;
        }
        
        setSaving(true);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                newUser.email,
                newUser.password
            );
            
            const firebaseUser = userCredential.user;
            const selectedRole = getRoleById(newUser.roleId);
            
            await addDoc(collection(db, 'users'), {
                uid: firebaseUser.uid,
                email: newUser.email,
                displayName: newUser.displayName,
                roleId: newUser.roleId,
                roleName: selectedRole?.name || 'Sin Rol',
                isActive: true,
                createdAt: Timestamp.now(),
                createdBy: currentUser?.email || 'system'
            });
            
            setShowNewUserModal(false);
            setNewUser({
                email: '',
                displayName: '',
                roleId: '',
                password: '',
                confirmPassword: ''
            });
            
        } catch (error) {
            alert('Error al crear usuario: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        
        setSaving(true);
        
        try {
            const selectedRole = getRoleById(editUser.roleId);
            const userRef = doc(db, 'users', selectedUser.id);
            
            await updateDoc(userRef, {
                displayName: editUser.displayName,
                roleId: editUser.roleId,
                roleName: selectedRole?.name || 'Sin Rol',
                isActive: editUser.isActive,
                updatedAt: Timestamp.now(),
                updatedBy: currentUser?.email || 'system'
            });
            
            setShowEditUserModal(false);
            setSelectedUser(null);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!isAdmin || !selectedUser) return;
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        setSaving(true);
        
        try {
            await sendPasswordResetEmail(auth, selectedUser.email);
            
            const userRef = doc(db, 'users', selectedUser.id);
            await updateDoc(userRef, {
                passwordResetAt: Timestamp.now(),
                passwordResetBy: currentUser?.email || 'system'
            });
            
            alert(`Correo enviado a ${selectedUser.email}`);
            setShowPasswordModal(false);
            setPasswordData({ newPassword: '', confirmPassword: '' });
            setSelectedUser(null);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!isAdmin || user.email === ADMIN_EMAIL) return;
        if (!window.confirm(`¿Eliminar a "${user.displayName || user.email}"?`)) return;
        
        try {
            await deleteDoc(doc(db, 'users', user.id));
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditUser({
            displayName: user.displayName || '',
            roleId: user.roleId || '',
            isActive: user.isActive !== false
        });
        setShowEditUserModal(true);
    };

    // Renderizar permisos del rol como chips
    const renderRolePermissions = (roleId) => {
        const role = getRoleById(roleId);
        if (!role) return <span className="text-xs text-slate-400">Sin rol asignado</span>;
        
        const perms = Object.entries(role.permissions || {})
            .filter(([_, level]) => level !== 'none')
            .slice(0, 3);
        
        if (perms.length === 0) return <span className="text-xs text-slate-400">Sin permisos</span>;
        
        return (
            <div className="flex flex-wrap gap-1">
                {perms.map(([modId, level]) => (
                    <span key={modId} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        level === 'write' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {level === 'write' ? '✓' : '👁'} {modId.slice(0, 8)}...
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-8 font-sans">
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
            `}</style>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-200">
                            <Icon path={Icons.users} className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">Usuarios</span>
                            </h1>
                            <p className="text-slate-500 mt-1">Asignación de roles y credenciales</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <Button variant="primary" size="lg" onClick={() => setShowNewUserModal(true)} icon="plus">
                            Nuevo Usuario
                        </Button>
                    )}
                </div>

                {/* Buscador */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-2 mb-6 animate-fade-in">
                    <div className="flex-1 relative">
                        <Icon path={Icons.search} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar usuarios por nombre, email o rol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-transparent border-0 text-slate-700 placeholder-slate-400 font-medium focus:outline-none focus:ring-0"
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/80 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase">Usuario</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase">Rol Asignado</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase">Permisos del Rol</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase">Estado</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => {
                                    const role = getRoleById(user.roleId);
                                    return (
                                        <tr key={user.id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
                                                        {(user.displayName || user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-base">{user.displayName || 'Sin nombre'}</p>
                                                        <div className="flex items-center gap-1 text-sm text-slate-500">
                                                            <Icon path={Icons.mail} className="w-3 h-3" />
                                                            {user.email}
                                                        </div>
                                                        {user.email === ADMIN_EMAIL && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold mt-1">
                                                                <Icon path={Icons.shield} className="w-3 h-3" />
                                                                Super Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {role ? (
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-${role.color || 'blue'}-100 text-${role.color || 'blue'}-700 border border-${role.color || 'blue'}-200`}>
                                                        <Icon path={Icons.shield} className="w-4 h-4" />
                                                        <span className="font-bold text-sm">{role.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400 italic">Sin rol asignado</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    {renderRolePermissions(user.roleId)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {user.isActive !== false ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        <span className="text-xs font-bold">Activo</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="danger">Inactivo</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    {isAdmin && user.email !== ADMIN_EMAIL ? (
                                                        <>
                                                            <button onClick={() => openEditModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar">
                                                                <Icon path={Icons.edit} className="w-5 h-5" />
                                                            </button>
                                                            <button onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Cambiar Contraseña">
                                                                <Icon path={Icons.key} className="w-5 h-5" />
                                                            </button>
                                                            <button onClick={() => handleDeleteUser(user)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Eliminar">
                                                                <Icon path={Icons.trash} className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Protegido</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Nuevo Usuario */}
            {showNewUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <h3 className="text-2xl font-black text-slate-800">Nuevo Usuario</h3>
                            <p className="text-sm text-slate-500 mt-1">Crear acceso al sistema</p>
                        </div>
                        
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Correo Electrónico *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={newUser.displayName}
                                    onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Rol del Sistema *</label>
                                <select
                                    value={newUser.roleId}
                                    onChange={(e) => setNewUser({...newUser, roleId: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                                    required
                                >
                                    <option value="">Seleccionar rol...</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name} ({Object.values(role.permissions || {}).filter(p => p !== 'none').length} módulos)
                                        </option>
                                    ))}
                                </select>
                                {newUser.roleId && (
                                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-xs text-blue-800 font-bold mb-1">Permisos incluidos:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(getRoleById(newUser.roleId)?.permissions || {})
                                                .filter(([_, level]) => level !== 'none')
                                                .map(([mod, level]) => (
                                                    <span key={mod} className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                        level === 'write' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                                                    }`}>
                                                        {mod}: {level === 'write' ? 'Escritura' : 'Lectura'}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Contraseña *</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Confirmar *</label>
                                    <input
                                        type="password"
                                        value={newUser.confirmPassword}
                                        onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowNewUserModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="success" disabled={saving} className="flex-1" icon="save">
                                    {saving ? 'Creando...' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar */}
            {showEditUserModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-2xl font-black text-slate-800">Editar Usuario</h3>
                            <p className="text-sm text-slate-500">{selectedUser.email}</p>
                        </div>
                        
                        <form onSubmit={handleEditUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={editUser.displayName}
                                    onChange={(e) => setEditUser({...editUser, displayName: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Rol del Sistema</label>
                                <select
                                    value={editUser.roleId}
                                    onChange={(e) => setEditUser({...editUser, roleId: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                                >
                                    <option value="">Sin rol</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editUser.isActive}
                                    onChange={(e) => setEditUser({...editUser, isActive: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="isActive" className="font-bold text-slate-700">
                                    Usuario activo
                                </label>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowEditUserModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="success" disabled={saving} className="flex-1" icon="save">
                                    Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Cambiar Contraseña */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <Icon path={Icons.lock} className="w-6 h-6 text-amber-600" />
                                Restablecer Contraseña
                            </h3>
                        </div>
                        
                        <div className="p-6 bg-amber-50/50 border-b border-amber-100">
                            <p className="text-sm text-amber-800">
                                Se enviará correo a <strong>{selectedUser.email}</strong> con instrucciones.
                            </p>
                        </div>

                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                                required
                                minLength={6}
                            />
                            <input
                                type="password"
                                placeholder="Confirmar contraseña"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                                required
                            />
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowPasswordModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="warning" disabled={saving} className="flex-1" icon="mail">
                                    Enviar Correo
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}