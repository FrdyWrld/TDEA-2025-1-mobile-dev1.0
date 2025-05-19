import React, { useContext, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { View, Image, Alert, ScrollView, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "../../services/ServiceStorage";
import usePermissions from "../../hooks/Permissions";
import { AppContext } from "../../context/AppContext";
import { updateBook } from "../../services/ServiceBooks";

export default function UploadPhotoScreen({ navigation }) {
  const route = useRoute();
  const { idBook } = route.params;
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { cameraPermission, galleryPermission } = usePermissions();
  const user = useContext(AppContext);

  const pickImage = async (fromCamera) => {
    if (fromCamera && !cameraPermission) {
      Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para tomar fotos.");
      return;
    }
    if (!fromCamera && !galleryPermission) {
      Alert.alert("Permiso denegado", "Se necesita acceso a la galería para seleccionar fotos.");
      return;
    }

    let result;

    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [3, 4],
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        aspect: [3, 4],
        quality: 1,
      });
    }

    if (!result.canceled) {
      setImages((prevImages) => [...prevImages, result.assets[0].uri].slice(0, 3));
    }
  };

  const handleUpload = async () => {
    if (images.length < 3) {
      Alert.alert("Error", "Debes subir al menos 3 fotos antes de continuar.");
      return;
    }

    setUploading(true);
    const uploadedImages = [];
    for (const image of images) {
      const downloadURL = await uploadImage(image, (user.user.uid + '/' + 'idBook'));
      if (downloadURL) {
        uploadedImages.push(downloadURL);
      }
    }
    setUploading(false);

    if (uploadedImages.length === images.length) {
      Alert.alert("Éxito", "Todas las imágenes han sido subidas correctamente.");
      setImages([]);
    }

    const updateBookData = {
      photos: uploadedImages,
      status: 'completed',
      available: true,
    };
    const success = await updateBook(idBook, updateBookData);
    if (success) {
      Alert.alert("Éxito", "Libro subido correctamente");
      navigation.navigate('AddBookScreen');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView vertical>
        {images.map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.image} />
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, images.length >= 3 && styles.buttonDisabled]}
          onPress={() => pickImage(true)}
          disabled={images.length >= 3}
        >
          <Text style={styles.buttonText}>Tomar Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, images.length >= 3 && styles.buttonDisabled]}
          onPress={() => pickImage(false)}
          disabled={images.length >= 3}
        >
          <Text style={styles.buttonText}>Galería</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.uploadButton, (uploading || images.length < 3) && styles.buttonDisabled]}
        onPress={handleUpload}
        disabled={uploading || images.length < 3}
      >
        {uploading ? (
          <ActivityIndicator color="#F2A71B" />
        ) : (
          <Text style={styles.uploadButtonText}>Subir Imágenes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 250,
    margin: 5,
  },
  buttonRow: {
    width: '100%',
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  button: {
    flex: 1,
    margin: 10,
    backgroundColor: '#025E73',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#F2A71B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  uploadButton: {
    width: '100%',
    backgroundColor: '#025E73',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#F2A71B',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
