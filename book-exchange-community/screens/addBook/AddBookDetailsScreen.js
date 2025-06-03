import React, {useContext, useEffect, useState} from 'react';

import {View, Image, ScrollView, Alert} from "react-native";
import {useRoute} from "@react-navigation/native";
import CompButton from "../../components/CompButton";
import {TextInput, Text, Checkbox} from "react-native-paper";
import {addBook, searchBookById} from "../../services/ServiceBooks";
import {AppContext} from "../../context/AppContext";
import LoadingOverlay from "../../components/LoadingOverlay";


export default function AddBookDetailsScreen({navigation}) {
    const route = useRoute();
    const {idBook} = route.params;
    const [book, setBook] = useState(null);
    const user = useContext(AppContext);
    const [loading, setLoading] = React.useState(false);

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

        // Validación de descripción
        if (description && description.length > 500) {
            setLoading(false);
            Alert.alert('Error', 'La descripción es demasiado larga (máx. 500 caracteres)');
            return;
        }

        // Validación de campos requeridos
        if (!book.volumeInfo?.title || !user?.user?.uid) {
            setLoading(false);
            Alert.alert('Error', 'Faltan datos obligatorios para guardar el libro.');
            return;
        }

        const condition = {
            annotations,
            highlights,
            coverDamage,
            pageDamage,
            bindingDamage,
            description: description || ""
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
            status: 'draft',
            condition,
            photos: [],
        };

        try {
            const success = await addBook(data);
            setLoading(false);
            if (success) {
                Alert.alert('Libro agregado exitosamente');
                navigation.navigate('UploadBookPhotosScreen', {idBook: success});
            } else {
                Alert.alert('Error', 'No se pudo guardar el libro. Intenta de nuevo.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', error.message || 'Ocurrió un error al guardar el libro.');
        }
    }


    return (
        <View style={styles.container}>
            <Text style={{
                color: '#F2A71B',
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                margin: 10
            }}>{book.volumeInfo?.title}</Text>
            <View style={{
                flex: 1,
                flexDirection: 'row',
                backgroundColor: 'rgba(0,0,0,0.07)',
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                alignContent: 'center'
            }}>
                <Image
                    source={{uri: book.volumeInfo?.imageLinks?.thumbnail}}
                    style={{width: 150, height: '90%', margin: 10, borderRadius: 5, mode: 'contain'}}
                />
                <ScrollView style={{flex: 1}}>
                    <Text>Autores: {book.volumeInfo?.authors?.join(', ')}{"\n"}</Text>
                    <Text>Categorías: {book.volumeInfo?.categories}{"\n"}</Text>
                    <Text>Número de páginas: {book.volumeInfo?.pageCount}{"\n"}</Text>
                    <Text>Fecha de publicación: {book.volumeInfo?.publishedDate}{"\n"}</Text>
                    <Text>Editorial: {book.volumeInfo?.publisher}{"\n"}</Text>
                    <Text>Idioma: {book.volumeInfo?.language}{"\n"}</Text>
                    <Text>ISBN: {book.volumeInfo?.industryIdentifiers?.map((item) => item.identifier).join(', ')}{"\n"}</Text>
                </ScrollView>
            </View>
            <Text style={{color: '#F2A71B', fontSize: 24, fontWeight: 'bold', textAlign: 'center', margin: 10}}>Estado
                del Libro</Text>
            <ScrollView style={{flex: 1, padding: 10, margin: 10, overflow: 'scroll', width: '100%'}}>
                <View style={{flex: 1}}>
                    <Checkbox.Item label="Tiene anotaciones o marcas" status={annotations ? "checked" : "unchecked"}
                                   onPress={() => setAnnotations(!annotations)} color={'#F2A71B'}/>
                    <Checkbox.Item label="Tiene texto subrayado o resaltado"
                                   status={highlights ? "checked" : "unchecked"}
                                   onPress={() => setHighlights(!highlights)} color={'#F2A71B'}/>
                    <Checkbox.Item label="Daño en la portada" status={coverDamage ? "checked" : "unchecked"}
                                   onPress={() => setCoverDamage(!coverDamage)} color={'#F2A71B'}/>
                    <Checkbox.Item label="Daño en las páginas" status={pageDamage ? "checked" : "unchecked"}
                                   onPress={() => setPageDamage(!pageDamage)} color={'#F2A71B'}/>
                    <Checkbox.Item label="Daño en el encuadernado" status={bindingDamage ? "checked" : "unchecked"}
                                   onPress={() => setBindingDamage(!bindingDamage)} color={'#F2A71B'}/>
                    <TextInput
                        label="Descripción (opcional)"
                        value={description}
                        onChangeText={setDescription}
                        mode="outlined"
                        multiline
                        cursorColor={'#F2A71B'}
                        activeOutlineColor={'#F2A71B'}
                        style={{marginBottom: 10}}
                    />
                </View>
            </ScrollView>
            <LoadingOverlay visible={loading} text="Guardando Borrador..."/>
            <CompButton text="Continuar..." onPress={handleAddBook}/>
        </View>
    );
}

const styles = {
    container: {
        flex: 1,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
    }
}