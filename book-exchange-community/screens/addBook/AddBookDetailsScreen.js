import React, { useContext, useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import {
  View,
  Image,
  Alert,
  ScrollView,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import CompButton from "../../components/CompButton";
import { addBook, searchBookById } from "../../services/ServiceBooks";
import { AppContext } from "../../context/AppContext";
import LoadingOverlay from "../../components/LoadingOverlay";

function SimpleCheckbox({ label, value, onToggle }) {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={() => onToggle(!value)}>
      <View style={[styles.checkboxBox, value && styles.checkboxChecked]} />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AddBookDetailsScreen({ navigation }) {
  const route = useRoute();
  const { idBook } = route.params;
  const [book, setBook] = useState(null);
  const user = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const [description, setDescription] = useState("");
  const [annotations, setAnnotations] = useState(false);
  const [highlights, setHighlights] = useState(false);
  const [coverDamage, setCoverDamage] = useState(false);
  const [pageDamage, setPageDamage] = useState(false);
  const [bindingDamage, setBindingDamage] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      const bookData = await searchBookById(idBook);
      setBook(bookData);
    };
    fetchBook();
  }, [idBook]);

  if (!book) {
    return <Text>Error al cargar el libro</Text>;
  }

  const handleAddBook = async () => {
    setLoading(true);
    const condition = {
      annotations,
      highlights,
      coverDamage,
      pageDamage,
      bindingDamage,
      description,
    };
    const data = {
      title: book.volumeInfo?.title,
      author: book.volumeInfo?.authors,
      thumbnail: book.volumeInfo?.imageLinks?.thumbnail,
      categories: book.volumeInfo?.categories,
      selfLink: book.selfLink,
      ISBN: book.volumeInfo?.industryIdentifiers,
      ownerUserId: user.user.uid,
      available: false,
      createdAt: new Date().toISOString(),
      requestedBy: [],
      status: "draft",
      condition,
      photos: [],
    };
    const success = await addBook(data);
    setLoading(false);
    if (success) {
      Alert.alert("Libro agregado exitosamente");
      navigation.navigate("UploadBookPhotosScreen", { idBook: success });
    } else {
      Alert.alert("Error", "Error al agregar el libro");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{book.volumeInfo?.title}</Text>
      <View style={styles.infoContainer}>
        <Image
          source={{ uri: book.volumeInfo?.imageLinks?.thumbnail }}
          style={styles.bookImage}
        />
        <ScrollView style={{ flex: 1 }}>
          <Text>Autores: {book.volumeInfo?.authors?.join(", ") || "N/A"}{"\n"}</Text>
          <Text>Categorías: {book.volumeInfo?.categories || "N/A"}{"\n"}</Text>
          <Text>Número de páginas: {book.volumeInfo?.pageCount || "N/A"}{"\n"}</Text>
          <Text>Fecha de publicación: {book.volumeInfo?.publishedDate || "N/A"}{"\n"}</Text>
          <Text>Editorial: {book.volumeInfo?.publisher || "N/A"}{"\n"}</Text>
          <Text>Idioma: {book.volumeInfo?.language || "N/A"}{"\n"}</Text>
          <Text>
            ISBN:{" "}
            {book.volumeInfo?.industryIdentifiers
              ?.map((item) => item.identifier)
              .join(", ") || "N/A"}
            {"\n"}
          </Text>
        </ScrollView>
      </View>

      <Text style={styles.subtitle}>Estado del Libro</Text>
      <ScrollView style={styles.conditionsContainer}>
        <SimpleCheckbox label="Tiene anotaciones o marcas" value={annotations} onToggle={setAnnotations} />
        <SimpleCheckbox label="Tiene texto subrayado o resaltado" value={highlights} onToggle={setHighlights} />
        <SimpleCheckbox label="Daño en la portada" value={coverDamage} onToggle={setCoverDamage} />
        <SimpleCheckbox label="Daño en las páginas" value={pageDamage} onToggle={setPageDamage} />
        <SimpleCheckbox label="Daño en el encuadernado" value={bindingDamage} onToggle={setBindingDamage} />

        <RNTextInput
          placeholder="Descripción (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.textInput}
          placeholderTextColor="#999"
        />
      </ScrollView>

      <LoadingOverlay visible={loading} text="Guardando Borrador..." />
      <CompButton text="Continuar..." onPress={handleAddBook} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#F2A71B",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    margin: 10,
  },
  infoContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.07)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
  },
  bookImage: {
    width: 150,
    height: "90%",
    margin: 10,
    borderRadius: 5,
    resizeMode: "contain",
  },
  subtitle: {
    color: "#F2A71B",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    margin: 10,
  },
  conditionsContainer: {
    flex: 1,
    padding: 10,
    margin: 10,
    width: "100%",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#025E73",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#025E73",
  },
  checkboxLabel: {
    fontSize: 16,
  },
  textInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    padding: 8,
    height: 100,
    textAlignVertical: "top",
    color: "#000",
  },
});
