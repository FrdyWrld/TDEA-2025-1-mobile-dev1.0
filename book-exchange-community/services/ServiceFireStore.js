import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/Firebase';

export async function createRecord({ collectionName, data }) {
  try {
    const ref = await addDoc(collection(db, collectionName), data);
    return ref.id;
  } catch (error) {
    console.error(`Error creando registro en ${collectionName}:`, error);
    throw error;
  }
}

export async function updateRecord({ collectionName, docId, data }) {
  try {
    const ref = doc(db, collectionName, docId);
    await setDoc(ref, data, { merge: true }); // crea o actualiza sin borrar campos
    return true;
  } catch (error) {
    console.error(`Error actualizando registro ${docId} en ${collectionName}:`, error);
    throw error;
  }
}

export async function getRecord({ collectionName, docId }) {
  try {
    const ref = doc(db, collectionName, docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    } else {
      console.warn(`Documento no encontrado: ${collectionName}/${docId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error leyendo documento ${docId} en ${collectionName}:`, error);
    return null;
  }
}

export async function deleteRecord({ collectionName, docId }) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return true;
  } catch (error) {
    console.error(`Error borrando registro ${docId} en ${collectionName}:`, error);
    throw error;
  }
}
