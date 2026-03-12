// src/services/usersService.js
// Servicio de gestión de usuarios conectado a Firebase Auth y Firestore

import { db } from '../firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    orderBy,
    Timestamp,
    where
} from 'firebase/firestore';

// Roles disponibles en el sistema
export const USER_ROLES = {
    Admin: {
        label: 'Administrador',
        description: 'Acceso total al sistema',
        canApprove: true,
        canManageUsers: true,
        canDelete: true
    },
    Contabilidad: {
        label: 'Contabilidad',
        description: 'Puede aprobar ajustes y ver reportes contables',
        canApprove: true,
        canManageUsers: false,
        canDelete: false
    },
    Gerencia: {
        label: 'Gerencia',
        description: 'Acceso a reportes y aprobaciones',
        canApprove: true,
        canManageUsers: false,
        canDelete: false
    },
    Caja: {
        label: 'Cajero/a',
        description: 'Registro de operaciones de caja',
        canApprove: false,
        canManageUsers: false,
        canDelete: false
    },
    Ventas: {
        label: 'Ventas',
        description: 'Registro de ventas y clientes',
        canApprove: false,
        canManageUsers: false,
        canDelete: false
    },
    user: {
        label: 'Usuario',
        description: 'Acceso básico de consulta',
        canApprove: false,
        canManageUsers: false,
        canDelete: false
    }
};

// Emails de administradores por defecto (fallback)
const ADMIN_EMAILS = [
    'carnessanmartingranada@gmail.com',
    'admin@csm.com',
    'contabilidad@csm.com',
    'gerencia@csm.com'
];

/**
 * Sincroniza un usuario de Firebase Auth con Firestore
 * Se llama automáticamente cuando un usuario inicia sesión
 */
export const syncUserWithFirestore = async (firebaseUser) => {
    if (!firebaseUser) return null;
    
    const userRef = doc(db, 'usuarios', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    // Determinar rol basado en email (si es admin por defecto)
    const isAdminByEmail = ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase());
    const defaultRole = isAdminByEmail ? 'Admin' : 'user';
    
    const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
        photoURL: firebaseUser.photoURL || '',
        role: defaultRole,
        isActive: true,
        lastLogin: Timestamp.now(),
        createdAt: userSnap.exists() ? userSnap.data().createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        phoneNumber: firebaseUser.phoneNumber || '',
        provider: firebaseUser.providerData?.[0]?.providerId || 'password'
    };
    
    if (userSnap.exists()) {
        // Actualizar usuario existente
        await updateDoc(userRef, {
            lastLogin: Timestamp.now(),
            email: firebaseUser.email, // Por si cambió
            displayName: firebaseUser.displayName || userSnap.data().displayName,
            photoURL: firebaseUser.photoURL || userSnap.data().photoURL,
            updatedAt: Timestamp.now()
        });
        return { ...userSnap.data(), ...userData, id: firebaseUser.uid };
    } else {
        // Crear nuevo usuario
        await setDoc(userRef, userData);
        return { ...userData, id: firebaseUser.uid };
    }
};

/**
 * Obtiene todos los usuarios del sistema (desde Firestore)
 */
export const getAllUsers = async () => {
    const usersRef = collection(db, 'usuarios');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Obtiene un usuario específico por UID
 */
export const getUserById = async (uid) => {
    const userRef = doc(db, 'usuarios', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
};

/**
 * Actualiza el rol de un usuario
 */
export const updateUserRole = async (uid, newRole, updatedBy = null) => {
    if (!USER_ROLES[newRole]) {
        throw new Error(`Rol inválido: ${newRole}`);
    }
    
    const userRef = doc(db, 'usuarios', uid);
    await updateDoc(userRef, {
        role: newRole,
        updatedAt: Timestamp.now(),
        updatedBy: updatedBy
    });
    
    return { success: true, message: 'Rol actualizado correctamente' };
};

/**
 * Actualiza datos de un usuario
 */
export const updateUserData = async (uid, data, updatedBy = null) => {
    const allowedFields = ['displayName', 'phoneNumber', 'isActive', 'sucursal', 'notas'];
    const updateData = {};
    
    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    });
    
    updateData.updatedAt = Timestamp.now();
    updateData.updatedBy = updatedBy;
    
    const userRef = doc(db, 'usuarios', uid);
    await updateDoc(userRef, updateData);
    
    return { success: true, message: 'Usuario actualizado correctamente' };
};

/**
 * Desactiva un usuario (no lo elimina de Firebase Auth, solo lo marca inactivo)
 */
export const deactivateUser = async (uid, deactivatedBy = null) => {
    const userRef = doc(db, 'usuarios', uid);
    await updateDoc(userRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
        deactivatedBy: deactivatedBy,
        deactivatedAt: Timestamp.now()
    });
    
    return { success: true, message: 'Usuario desactivado correctamente' };
};

/**
 * Reactiva un usuario
 */
export const reactivateUser = async (uid, reactivatedBy = null) => {
    const userRef = doc(db, 'usuarios', uid);
    await updateDoc(userRef, {
        isActive: true,
        updatedAt: Timestamp.now(),
        reactivatedBy: reactivatedBy,
        reactivatedAt: Timestamp.now()
    });
    
    return { success: true, message: 'Usuario reactivado correctamente' };
};

/**
 * Elimina un usuario de Firestore (nota: no elimina de Firebase Auth)
 * Para eliminar completamente se necesitaría Cloud Function
 */
export const deleteUserFromFirestore = async (uid) => {
    const userRef = doc(db, 'usuarios', uid);
    await deleteDoc(userRef);
    return { success: true, message: 'Usuario eliminado de la base de datos' };
};

/**
 * Crea un nuevo usuario en Firestore (cuando se crea en Firebase Auth)
 */
export const createUserInFirestore = async (userData) => {
    const { uid, email, displayName, role = 'user' } = userData;
    
    const userRef = doc(db, 'usuarios', uid);
    const newUser = {
        uid,
        email,
        displayName: displayName || email?.split('@')[0] || '',
        role,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: null
    };
    
    await setDoc(userRef, newUser);
    return { id: uid, ...newUser };
};

/**
 * Obtiene el rol de un usuario
 */
export const getUserRole = async (uid) => {
    const user = await getUserById(uid);
    return user?.role || 'user';
};

/**
 * Verifica si un usuario tiene permiso para aprobar
 */
export const canUserApprove = async (uid) => {
    const user = await getUserById(uid);
    if (!user) return false;
    const roleData = USER_ROLES[user.role];
    return roleData?.canApprove || false;
};

/**
 * Verifica si un usuario puede gestionar otros usuarios
 */
export const canUserManageUsers = async (uid) => {
    const user = await getUserById(uid);
    if (!user) return false;
    const roleData = USER_ROLES[user.role];
    return roleData?.canManageUsers || false;
};

/**
 * Obtiene estadísticas de usuarios
 */
export const getUsersStats = async () => {
    const users = await getAllUsers();
    
    return {
        total: users.length,
        activos: users.filter(u => u.isActive !== false).length,
        inactivos: users.filter(u => u.isActive === false).length,
        porRol: Object.keys(USER_ROLES).map(role => ({
            rol: role,
            label: USER_ROLES[role].label,
            cantidad: users.filter(u => u.role === role).length
        })),
        ultimos7Dias: users.filter(u => {
            if (!u.lastLogin) return false;
            const lastLogin = u.lastLogin.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin);
            const hace7Dias = new Date();
            hace7Dias.setDate(hace7Dias.getDate() - 7);
            return lastLogin >= hace7Dias;
        }).length
    };
};

export default {
    syncUserWithFirestore,
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserData,
    deactivateUser,
    reactivateUser,
    deleteUserFromFirestore,
    createUserInFirestore,
    getUserRole,
    canUserApprove,
    canUserManageUsers,
    getUsersStats,
    USER_ROLES
};
