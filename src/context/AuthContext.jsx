// src/context/AuthContext.jsx
// Contexto de autenticación con Firebase Auth - CON SINCRONIZACIÓN A FIRESTORE

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { syncUserWithFirestore, USER_ROLES } from '../services/usersService';

// Crear el contexto
const AuthContext = createContext();

// Lista de emails de administradores (fallback si no hay colección de usuarios)
const ADMIN_EMAILS = [
    'carnessanmartingranada@gmail.com',
    'admin@csm.com',
    'contabilidad@csm.com',
    'gerencia@csm.com'
];

// Hook personalizado para usar el contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Escuchar cambios en el estado de autenticación
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            
            if (currentUser) {
                // Sincronizar usuario con Firestore
                try {
                    const syncedUser = await syncUserWithFirestore(currentUser);
                    if (syncedUser) {
                        setUserRole(syncedUser.role || 'user');
                        setUserData(syncedUser);
                    } else {
                        // Fallback: determinar rol por email
                        const isAdmin = ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());
                        setUserRole(isAdmin ? 'Admin' : 'user');
                    }
                } catch (error) {
                    console.error('Error sincronizando usuario:', error);
                    // Fallback: determinar rol por email
                    const isAdmin = ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());
                    setUserRole(isAdmin ? 'Admin' : 'user');
                }
            } else {
                setUserRole(null);
                setUserData(null);
            }
            
            setLoading(false);
        });

        // Limpiar suscripción al desmontar
        return () => unsubscribe();
    }, []);

    // Función de login
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // La sincronización con Firestore se hace automáticamente en onAuthStateChanged
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Error de login:', error);
            return { success: false, error: error.message };
        }
    };

    // Función de logout
    const logout = async () => {
        try {
            await signOut(auth);
            setUserRole(null);
            setUserData(null);
            return { success: true };
        } catch (error) {
            console.error('Error de logout:', error);
            return { success: false, error: error.message };
        }
    };

    // Crear nuevo usuario (solo para administradores)
    const createUser = async (email, password, displayName, role = 'user') => {
        try {
            // Crear usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Actualizar perfil
            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }
            
            // Crear documento en Firestore
            const userRef = doc(db, 'usuarios', userCredential.user.uid);
            await setDoc(userRef, {
                uid: userCredential.user.uid,
                email: email,
                displayName: displayName || email.split('@')[0],
                role: role,
                isActive: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                createdBy: user?.uid || null
            });
            
            return { 
                success: true, 
                user: userCredential.user,
                message: 'Usuario creado exitosamente'
            };
        } catch (error) {
            console.error('Error creando usuario:', error);
            return { success: false, error: error.message };
        }
    };

    // Actualizar rol de usuario (solo para administradores)
    const updateUserRole = async (targetUserId, newRole) => {
        try {
            if (!USER_ROLES[newRole]) {
                throw new Error('Rol inválido');
            }
            
            const userRef = doc(db, 'usuarios', targetUserId);
            await updateDoc(userRef, {
                role: newRole,
                updatedAt: Timestamp.now(),
                updatedBy: user?.uid
            });
            
            return { success: true, message: 'Rol actualizado correctamente' };
        } catch (error) {
            console.error('Error actualizando rol:', error);
            return { success: false, error: error.message };
        }
    };

    // Determinar si el usuario puede aprobar ajustes
    const canApprove = useMemo(() => {
        if (!userRole) return false;
        return userRole === 'Admin' || userRole === 'Contabilidad' || userRole === 'Gerencia';
    }, [userRole]);

    // Determinar si el usuario puede gestionar otros usuarios
    const canManageUsers = useMemo(() => {
        if (!userRole) return false;
        return userRole === 'Admin';
    }, [userRole]);

    // Valor del contexto
    const value = {
        user,
        userRole,
        userData,
        loading,
        login,
        logout,
        createUser,
        updateUserRole,
        isAuthenticated: !!user,
        canApprove,
        canManageUsers,
        isAdmin: userRole === 'Admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
