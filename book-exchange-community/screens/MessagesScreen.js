import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import {
  getUserChats,
  findOrCreateChat
} from '../services/ServiceChat';
import { getCollection } from '../services/ServiceFireStore';

export default function MessagesScreen({ navigation }) {
  const { user } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);


  useEffect(() => {
    if (!user) return;
    getUserChats(user.uid)
      .then(setChats)
      .catch(console.error);
  }, [user]);


  useEffect(() => {
    if (!user) return;
    getCollection({ collectionName: 'users' })
      .then(all => {
        const list = Array.isArray(all) ? all : [];
        setUsers(list.filter(u => u.uid !== user.uid));
      })
      .catch(console.error);
  }, [user]);


  const filteredUsers = users.filter(u => {
    const name  = (u.displayName  || '').toLowerCase();
    const email = (u.email        || '').toLowerCase();
    const q     = query.toLowerCase();
    return name.includes(q) || email.includes(q);
  });


  const openChat = useCallback(
    async otherUid => {
      const chatId = await findOrCreateChat(user.uid, otherUid);
      navigation.navigate('Chat', { chatId, otherUid });
      setQuery('');
    },
    [navigation, user.uid]
  );


  const renderItem = ({ item }) => {
    if (query.trim() === '') {

      const otherUid = item.participants.find(id => id !== user.uid);
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => openChat(otherUid)}
        >
          <Text style={styles.name}>
            Chat con {otherUid}
          </Text>
        </TouchableOpacity>
      );
    } else {
  
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => openChat(item.uid)}
        >
          <Text style={styles.name}>
            {item.displayName || item.email}
          </Text>
        </TouchableOpacity>
      );
    }
  };


  const dataSource = query.trim() === '' ? chats : filteredUsers;

  return (
    <SafeAreaView style={styles.container}>
      {}
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar usuario o conversaciones..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      <FlatList
        data={dataSource}
        keyExtractor={item =>
          query.trim() === '' ? item.id : item.uid
        }
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>
            {query.trim() === ''
              ? 'Aún no tienes chats'
              : 'No se encontró ningún usuario'}
          </Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 10
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  name: { fontSize: 16 },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999'
  }
});