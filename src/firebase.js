// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// TUS CREDENCIALES DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBwXChy-AGjQq0EhusiE3QNkvjRr5Vv16I",
  authDomain: "estado-resultados-a0a81.firebaseapp.com",
  projectId: "estado-resultados-a0a81",
  storageBucket: "estado-resultados-a0a81.firebasestorage.app",
  messagingSenderId: "484581453319",
  appId: "1:484581453319:web:8cc73a891206c0d96cc4a2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar los servicios y EXPORTARLOS
export const db = getFirestore(app);       // Firestore (Base de datos)
export const auth = getAuth(app);          // Autenticación
export const storage = getStorage(app);    // Storage (Archivos y fotos)
