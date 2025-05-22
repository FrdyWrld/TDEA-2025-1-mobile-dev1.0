import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/Firebase';
import { Alert } from 'react-native';


export const createRecord = async ({ collectionName, data }) => {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  } catch (e) {
    Alert.alert('Error', e.message);
  }
};

export const getCollection = async ({ collectionName }) => {
  console.log('ingresó a getCollection');
  try {
    const colRef = collection(db, collectionName);
    const querySnapshot = await getDocs(colRef);
    const result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(result);
    return result;
  } catch (e) {
    Alert.alert('Error', e.message);
  }
};


export const getCollectionByUser = async ({ userId }) => {
  try {
    const colRef = collection(db, 'books');
    const q = query(colRef, where('ownerUserId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    Alert.alert('Error', e.message);
  }
};

export const getRecord = async ({ collectionName, docId }) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (e) {
    Alert.alert('Error', e.message);
  }
};

export const updateRecord = async ({ collectionName, docId, data }) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    return true;
  } catch (e) {
    Alert.alert('Error', e.message);
  }
};

export const deleteRecord = async ({ collectionName, docId }) => {
  try {
    const colRef = collection(db, collectionName);
    await deleteDoc(doc(colRef, docId));
    return true;
  } catch (e) {
    Alert.alert('Error', e.message);
  }
};

