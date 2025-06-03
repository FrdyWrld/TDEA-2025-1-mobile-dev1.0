// screens/WebMapScreen.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { SafeAreaView, TextInput, FlatList, TouchableOpacity, Text, Modal, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppContext } from '../context/AppContext';
import { getCollection } from '../services/ServiceFireStore';
import { findOrCreateChat } from '../services/ServiceChat';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { updateRecord } from '../services/ServiceFireStore';

export default function WebMapScreen({ navigation }) {
  const { user } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const webviewRef = useRef(null);

  // Cargar usuarios y libros
  useEffect(() => {
    if (!user) return; // <-- Agrega esto
    (async () => {
      const [allUsers, allBooks] = await Promise.all([
        getCollection({ collectionName: 'users' }),
        getCollection({ collectionName: 'books' })
      ]);
      setUsers(allUsers);
      setBooks(allBooks);

      // Relacionar usuarios con sus libros
      const userMarkers = [];
      allUsers.forEach(u => {
        const userBooks = allBooks.filter(b => b.ownerUserId === u.uid);
        if (userBooks.length && u.location && u.location.latitude && u.location.longitude) {
          userBooks.forEach(book => {
            userMarkers.push({
              uid: u.uid,
              lat: u.location.latitude,
              lng: u.location.longitude,
              userName: u.displayName || u.name || u.email,
              userEmail: u.email,
              bookTitle: book.title,
              bookAuthor: Array.isArray(book.author) ? book.author[0] : book.author,
              bookId: book.id
            });
          });
        }
      });
      setMarkers(userMarkers);
      setFilteredMarkers(userMarkers);
    })();
  }, [user]);

  function normalize(str) {
    return str
      ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : "";
  }

  // Filtrar por nombre de libro
  useEffect(() => {
    if (!search.trim()) {
      setFilteredMarkers(markers);
    } else {
      setFilteredMarkers(
        markers.filter(m =>
          normalize(m.bookTitle).includes(normalize(search.trim()))
        )
      );
    }
  }, [search, markers]);

  // HTML para el mapa con marcadores rojos
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <script src="https://maps.googleapis.com/maps/api/js?key=${Constants.expoConfig.extra.GOOGLE_MAPS_JS_KEY}"></script>
      <style>
        html, body, #map { margin: 0; padding: 0; height: 100%; width: 100% }
        #floating-button {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #4285F4;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          z-index: 999;
        }
      </style>
      <script>
        let map;
        let markers = [];
        function initMap() {
          const center = { lat: 6.2442, lng: -75.5812 };
          map = new google.maps.Map(document.getElementById('map'), {
            center,
            zoom: 12
          });
        }
        function clearMarkers() {
          markers.forEach(m => m.setMap(null));
          markers = [];
        }
        function addMarkers(data) {
          clearMarkers();
          data.forEach(item => {
            const marker = new google.maps.Marker({
              position: { lat: item.lat, lng: item.lng },
              map,
              title: item.bookTitle,
              icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            });
            marker.addListener('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify(item));
            });
            markers.push(marker);
          });
        }
        window.addEventListener('message', e => {
          const message = JSON.parse(e.data);
          if (message.action === 'updateMarkers') {
            addMarkers(message.data);
          }
        });
        window.onload = initMap;
      </script>
    </head>
    <body>
      <button id="floating-button" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'searchBooks' }))">
        Buscar libros por nombre
      </button>
      <div id="map"></div>
    </body>
    </html>
  `;

  // Maneja mensajes desde el WebView
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.action === 'searchBooks') {
        if (filteredMarkers.length > 0) {
          webviewRef.current?.postMessage(JSON.stringify({ action: 'updateMarkers', data: filteredMarkers }));
        }
        setShowModal(true);
      } else if (message.uid) {
        if (message.uid !== user.uid) {
          goToChat(message.uid);
        } else {
          alert('Este libro es tuyo.');
        }
      }
    } catch (err) {
      console.log('Error al procesar el mensaje', err);
    }
  };

  // Ir al chat con el dueño del libro
  const goToChat = async (ownerUid) => {
    try {
      const chatId = await findOrCreateChat(user.uid, ownerUid);
      navigation.navigate('ChatScreen', { chatId });
      setShowModal(false);
    } catch (e) {
      alert('No se pudo abrir el chat');
    }
  };

  // Función para guardar la ubicación del usuario
  async function saveUserLocation(user) {
    if (!user) {
      alert('Debes iniciar sesión para actualizar tu ubicación');
      return;
    }
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permiso de ubicación denegado');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    await updateRecord({
      collectionName: 'users',
      docId: user.uid,
      data: {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      }
    });
    alert('¡Ubicación guardada!');
  }

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar libro por nombre..."
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={{ margin: 12, backgroundColor: '#4285F4', borderRadius: 8, padding: 10 }}
        onPress={async () => {
          await saveUserLocation(user);
          // Recarga los datos
          if (user) {
            const [allUsers, allBooks] = await Promise.all([
              getCollection({ collectionName: 'users' }),
              getCollection({ collectionName: 'books' })
            ]);
            setUsers(allUsers);
            setBooks(allBooks);
            const userMarkers = [];
            allUsers.forEach(u => {
              const userBooks = allBooks.filter(b => b.ownerUserId === u.uid);
              if (userBooks.length && u.location && u.location.latitude && u.location.longitude) {
                userBooks.forEach(book => {
                  userMarkers.push({
                    uid: u.uid,
                    lat: u.location.latitude,
                    lng: u.location.longitude,
                    userName: u.displayName || u.name || u.email,
                    userEmail: u.email,
                    bookTitle: book.title,
                    bookAuthor: Array.isArray(book.author) ? book.author[0] : book.author,
                    bookId: book.id
                  });
                });
              }
            });
            setMarkers(userMarkers);
            setFilteredMarkers(userMarkers);
          }
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Actualizar mi ubicación</Text>
      </TouchableOpacity>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        onMessage={handleMessage}
      />
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Text style={{ fontSize: 18, color: '#007aff', margin: 16 }}>Cerrar</Text>
          </TouchableOpacity>
          <FlatList
            data={filteredMarkers}
            keyExtractor={item => item.bookId + item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (item.uid !== user.uid) {
                    goToChat(item.uid);
                  } else {
                    alert('Este libro es tuyo.');
                  }
                }}
                style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}
              >
                <Text style={{ fontWeight: 'bold' }}>{item.bookTitle}</Text>
                <Text>Autor: {item.bookAuthor || 'Desconocido'}</Text>
                <Text>Propietario: {item.userName}</Text>
                <Text>Email: {item.userEmail}</Text>
                <Text style={{ color: '#007aff', marginTop: 4 }}>Chatear con el propietario</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay libros con ese nombre.</Text>}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1 },
  searchBar: {
    height: 40,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10
  }
});
