// src/services/branchesService.js
// Servicio para gestión de sucursales en Firebase

import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';

const BRANCHES_COLLECTION = 'sucursales';

// Sucursales iniciales (se cargarán si la colección está vacía)
export const DEFAULT_BRANCHES = [
    { id: 'carnes_amparito', name: 'Carnes Amparito', code: 'AMP', active: true, order: 1 },
    { id: 'csm_granada', name: 'CSM Granada', code: 'CSM-GRA', active: true, order: 2 },
    { id: 'csm_masaya', name: 'CSM Masaya', code: 'CSM-MAS', active: true, order: 3 },
    { id: 'csm_nindiri', name: 'CSM Nindirí', code: 'CSM-NIN', active: true, order: 4 },
    { id: 'cedi', name: 'CEDI', code: 'CEDI', active: true, order: 5 },
    { id: 'csm_granada_inmaculada', name: 'CSM Granada Inmaculada', code: 'CSM-GRA-INM', active: true, order: 6 },
];

/**
 * Inicializa las sucursales por defecto si la colección está vacía
 */
export const initializeBranches = async () => {
    try {
        const q = query(collection(db, BRANCHES_COLLECTION));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log('Inicializando sucursales por defecto...');
            for (const branch of DEFAULT_BRANCHES) {
                await addDoc(collection(db, BRANCHES_COLLECTION), {
                    ...branch,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
            }
            console.log('Sucursales inicializadas correctamente');
        }
    } catch (error) {
        console.error('Error inicializando sucursales:', error);
        throw error;
    }
};

/**
 * Obtiene todas las sucursales activas
 */
export const getBranches = async () => {
    try {
        const q = query(
            collection(db, BRANCHES_COLLECTION),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(branch => branch.active !== false);
    } catch (error) {
        console.error('Error obteniendo sucursales:', error);
        throw error;
    }
};

/**
 * Crea una nueva sucursal
 */
export const createBranch = async (branchData) => {
    try {
        const docRef = await addDoc(collection(db, BRANCHES_COLLECTION), {
            ...branchData,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return { id: docRef.id, ...branchData };
    } catch (error) {
        console.error('Error creando sucursal:', error);
        throw error;
    }
};

/**
 * Actualiza una sucursal existente
 */
export const updateBranch = async (branchId, branchData) => {
    try {
        const branchRef = doc(db, BRANCHES_COLLECTION, branchId);
        await updateDoc(branchRef, {
            ...branchData,
            updatedAt: Timestamp.now()
        });
        return { id: branchId, ...branchData };
    } catch (error) {
        console.error('Error actualizando sucursal:', error);
        throw error;
    }
};

/**
 * Elimina (desactiva) una sucursal
 */
export const deleteBranch = async (branchId) => {
    try {
        const branchRef = doc(db, BRANCHES_COLLECTION, branchId);
        await updateDoc(branchRef, {
            active: false,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('Error eliminando sucursal:', error);
        throw error;
    }
};

/**
 * Elimina permanentemente una sucursal (solo admin)
 */
export const permanentDeleteBranch = async (branchId) => {
    try {
        await deleteDoc(doc(db, BRANCHES_COLLECTION, branchId));
        return true;
    } catch (error) {
        console.error('Error eliminando sucursal permanentemente:', error);
        throw error;
    }
};

/**
 * Suscribe a cambios en las sucursales
 */
export const subscribeToBranches = (callback) => {
    const q = query(
        collection(db, BRANCHES_COLLECTION),
        orderBy('order', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const branches = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(branch => branch.active !== false);
        callback(branches);
    });
};

/**
 * Obtiene el nombre de una sucursal por su ID
 */
export const getBranchName = (branches, branchId) => {
    if (!branches || !branchId) return 'Sucursal no especificada';
    const branch = branches.find(b => b.id === branchId || b.code === branchId);
    return branch ? branch.name : branchId;
};

/**
 * Obtiene el código de una sucursal por su ID
 */
export const getBranchCode = (branches, branchId) => {
    if (!branches || !branchId) return '';
    const branch = branches.find(b => b.id === branchId || b.code === branchId);
    return branch ? branch.code : branchId;
};

export default {
    initializeBranches,
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    permanentDeleteBranch,
    subscribeToBranches,
    getBranchName,
    getBranchCode,
    DEFAULT_BRANCHES
};
