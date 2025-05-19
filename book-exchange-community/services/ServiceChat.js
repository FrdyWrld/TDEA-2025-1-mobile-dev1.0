import { 
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './ServiceFireStore'; 

/**
 * @param {string} userId
 * @returns {Promise<Array<{id:string, participants:string[], lastUpdated:Timestamp}>>}
 */
export async function getUserChats(userId) {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastUpdated', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * @param {string} userId
 * @param {(chats:Array)=>void} callback
 * @param {(error:Error)=>void} errorCallback
 */
export function subscribeToUserChats(userId, callback, errorCallback) {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastUpdated', 'desc')
  );
  return onSnapshot(q, snap => {
    const chats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(chats);
  }, errorCallback);
}

/**
 * @param {string[]} participants 
 * @returns {Promise<string>} 
 */
export async function createChat(participants) {
  const chatsRef = collection(db, 'chats');
  const chatData = {
    participants,
    lastUpdated: serverTimestamp()
  };
  const { id } = await addDoc(chatsRef, chatData);
  return id;
}

/**
 * @param {string} chatId
 * @param {(messages:Array)=>void} callback
 * @param {(error:Error)=>void} errorCallback
 */
export function subscribeToChatMessages(chatId, callback, errorCallback) {
  const msgsRef = collection(db, 'chats', chatId, 'messages');
  const q = query(msgsRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(messages);
  }, errorCallback);
}

/**
 * @param {string} chatId
 * @param {{ text:string, senderId:string, createdAt?:Date }} msg
 */
export async function sendMessage(chatId, { text, senderId, createdAt = new Date() }) {
  const msgsRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(msgsRef, { text, senderId, createdAt });
  const chatDoc = doc(db, 'chats', chatId);
  await setDoc(chatDoc, { lastUpdated: createdAt }, { merge: true });
}
