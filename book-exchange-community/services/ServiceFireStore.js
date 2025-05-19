import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc
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
    await updateDoc(ref, data);
    return true;
  } catch (error) {
    console.error(`Error actualizando registro ${docId} en ${collectionName}:`, error);
    throw error;
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


export async function getCollection({ collectionName }) {
  try {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error(`Error leyendo colección ${collectionName}:`, error);
    return [];
  }
}


export async function getCollectionByUser({ userId }) {
  try {
    const q = query(
      collection(db, 'users'),
      where('uid', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error(`Error leyendo usuarios para userId=${userId}:`, error);
    return [];
  }
}
