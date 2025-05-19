import React, { useContext } from 'react';
import { Alert } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../lib/Firebase';
import { createRecord } from './ServiceFireStore';
import { AppContext } from '../context/AppContext';


export function useLogin() {
  const { setIsAuthenticated, setUser } = useContext(AppContext);

  return async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      setUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      switch (error.code) {
        case 'auth/user-not-found':
          Alert.alert('Error', 'Usuario no encontrado');
          break;
        case 'auth/wrong-password':
          Alert.alert('Error', 'Contraseña incorrecta');
          break;
        case 'auth/invalid-email':
          Alert.alert('Error', 'Correo electrónico inválido');
          break;
          case 'auth/invalid-credential':
         Alert.alert('Error', 'Contraseña inválida');
        break;
        default:
        Alert.alert('Error', 'No se pudo iniciar sesión');
        }
      return false;
    }
  };
}


export function useLogout() {
  const { setIsAuthenticated, setUser } = useContext(AppContext);

  return async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
}


export function useRegister() {
  const { setIsAuthenticated, setUser } = useContext(AppContext);

  return async (email, password) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = credential;
      const displayName = email.split('@')[0];

  
      await createRecord({
        collectionName: 'users',
        data: {
          uid: user.uid,
          email: user.email,
          displayName,
          location: null,
          booksListed: [],
          booksRequested: [],
          chats: [],
          notifications: []
        }
      });

   
      await sendEmailVerification(user);

      setUser(user);
      setIsAuthenticated(true);
      Alert.alert('Registro exitoso', 'Revisa tu correo para verificar la cuenta');
      return true;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'El correo electrónico ya está en uso');
      } else {
        Alert.alert('Error', error.message);
      }
      return false;
    }
  };
}


export function useRecoverPassword() {
  return async email => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Correo enviado', 'Revisa tu email para restablecer la contraseña');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
}
