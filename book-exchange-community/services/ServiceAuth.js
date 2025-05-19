import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification,
    signOut
} from 'firebase/auth';

import {auth} from '../lib/Firebase';
import {AppContext} from "../context/AppContext";
import {Alert} from "react-native";
import {useContext} from "react";
import {createRecord} from "./ServiceFireStore";

export function useLogin() {
    const {setIsAuthenticated, setUser} = useContext(AppContext);

    return async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            setUser(user);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            setIsAuthenticated(false);
            Alert.alert('Error', error.message);
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
    const {setIsAuthenticated, setUser} = useContext(AppContext);

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
    return async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = {
                "userId": userCredential.user.uid,
                "userInfo": userCredential.user.providerData,
                "location": {"lat": null, "lng": null},
                "booksListed": [null],
                "booksRequested": [null],
                "chats": [null],
                "notifications": [null]
            };
            try {
                await createRecord({collectionName: 'users', data: {user}});
                await sendEmailVerification(userCredential.user);
                Alert.alert('Registro exitoso', 'Usuario creado correctamente');
                return true;
            } catch (e) {
                if (e.code === 'auth/email-already-in-use') {
                    Alert.alert('Error', 'El correo electrónico ya está en uso');
                } else {
                    Alert.alert('Error', 'No se pudo crear el usuario');
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message);
            return null;
        }
    }
}

export function useRecoverPassword() {
    return async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert('Correo enviado', 'Se ha enviado un correo de recuperación');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    }
}
