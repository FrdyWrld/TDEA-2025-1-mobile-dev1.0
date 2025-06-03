import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AppContext } from "../context/AppContext";
import { useLogout } from "../services/ServiceAuth";
import CompButton from "../components/CompButton";
import { MaterialIcons } from "@expo/vector-icons";
import { getRecord, updateRecord, getCollection } from "../services/ServiceFireStore";
import { useTheme } from "@react-navigation/native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/Firebase";

export default function ProfileScreen() {
  const logout = useLogout();
  const {
    user,
    userDetails,
    setUserDetails,
    theme,
    toggleTheme,
  } = useContext(AppContext);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userBooks, setUserBooks] = useState([]);

  useEffect(() => {
    async function loadUserProfile() {
      if (!user) return;
      setLoading(true);
      const profileData = await getRecord({ collectionName: "users", docId: user.uid });
      if (profileData) {
        setUserDetails(profileData);
      }
      setLoading(false);
    }
    loadUserProfile();
  }, [user]);

  // Cargar libros añadidos por el usuario
  useEffect(() => {
    async function fetchBooks() {
      if (!user) return;
      const allBooks = await getCollection({ collectionName: "books" });
      // Filtra libros donde ownerUserId es el uid del usuario
      const myBooks = allBooks.filter(b => b.ownerUserId === user.uid);
      setUserBooks(myBooks);
    }
    fetchBooks();
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Se requiere permiso para acceder a la galería.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setUserDetails({ ...userDetails, photoUrl: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir la galería de imágenes.");
    }
  };

  const saveProfileChanges = async () => {
    if (!user) return;

    const dataToSave = {
      name: userDetails.name || "",
      phone: userDetails.phone || "",
      address: userDetails.address || "",
      photoUrl: userDetails.photoUrl || "",
    };

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateRecord({ collectionName: "users", docId: user.uid, data: dataToSave });
      } else {
        await setDoc(docRef, dataToSave);
      }

      Alert.alert("Éxito", "Cambios guardados correctamente");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar los cambios");
    }
  };

  const { colors } = useTheme();

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text }}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
        <MaterialIcons
          name={theme === "light" ? "dark-mode" : "light-mode"}
          size={28}
          color={colors.text}
        />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Perfil</Text>

      {userDetails?.photoUrl ? (
        <Image source={{ uri: userDetails.photoUrl }} style={styles.profileImage} />
      ) : (
        <Text style={[styles.noPhotoText, { color: colors.placeholder || "#aaa" }]}>
          No tienes foto de perfil
        </Text>
      )}

      {isEditing && (
        <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
          <Text style={styles.changePhotoText}>Cambiar Foto</Text>
        </TouchableOpacity>
      )}

      <Text style={{ color: colors.text, textAlign: "center", marginBottom: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Correo: </Text>
        {user?.email || "No disponible"}
      </Text>
      <Text style={{ color: colors.text, textAlign: "center", marginBottom: 20 }}>
        <Text style={{ fontWeight: "bold" }}>Nombre: </Text>
        {userDetails?.name || user?.displayName || "No disponible"}
      </Text>

      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Nombre"
        placeholderTextColor={colors.placeholder || "#999"}
        value={userDetails?.name || ""}
        editable={isEditing}
        onChangeText={(text) => setUserDetails({ ...userDetails, name: text })}
      />

      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Teléfono"
        placeholderTextColor={colors.placeholder || "#999"}
        value={userDetails?.phone || ""}
        editable={isEditing}
        keyboardType="phone-pad"
        onChangeText={(text) => setUserDetails({ ...userDetails, phone: text })}
      />

      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Dirección"
        placeholderTextColor={colors.placeholder || "#999"}
        value={userDetails?.address || ""}
        editable={isEditing}
        onChangeText={(text) => setUserDetails({ ...userDetails, address: text })}
      />

      {isEditing ? (
        <View style={styles.buttonRow}>
          <CompButton text="Guardar" onPress={saveProfileChanges} style={styles.saveButton} />
          <CompButton text="Cancelar" onPress={() => setIsEditing(false)} style={styles.cancelButton} />
        </View>
      ) : (
        <CompButton text="Editar Perfil" onPress={() => setIsEditing(true)} style={styles.editButton} />
      )}

      <CompButton
        text="Logout"
        onPress={logout}
        style={styles.logoutButton}
        textStyle={{ color: "#F2A71B" }}
      />

      {/* Mostrar libros añadidos */}
      <Text style={{ color: colors.text, fontWeight: "bold", marginTop: 20, marginBottom: 10 }}>
        Libros añadidos:
      </Text>
      {userBooks.length === 0 ? (
        <Text style={{ color: colors.text, textAlign: "center" }}>No has añadido libros aún.</Text>
      ) : (
        userBooks.map(book => (
          <View key={book.id} style={{ marginBottom: 10, padding: 10, backgroundColor: "#f5f5f5", borderRadius: 8 }}>
            <Text style={{ fontWeight: "bold" }}>{book.title}</Text>
            <Text>Autor: {book.author?.[0] || "Desconocido"}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  themeButton: { position: "absolute", top: 15, right: 15, zIndex: 10 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  profileImage: { width: 100, height: 100, borderRadius: 50, alignSelf: "center", marginBottom: 15 },
  noPhotoText: { textAlign: "center", marginBottom: 15 },
  changePhotoButton: {
    backgroundColor: "#025E73",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginBottom: 20,
  },
  changePhotoText: { color: "#fff", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  saveButton: { flex: 1, marginRight: 10 },
  cancelButton: { flex: 1, marginLeft: 10, backgroundColor: "#BFB78F" },
  editButton: { marginBottom: 20, backgroundColor: "#025E73" },
  logoutButton: { backgroundColor: "#025E73", paddingVertical: 15, borderRadius: 25 },
});
