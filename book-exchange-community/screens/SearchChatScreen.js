import React, { useEffect, useState, useContext } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getCollection } from '../services/ServiceFireStore';
import { findOrCreateChat } from '../services/ServiceChat';
import { AppContext } from '../context/AppContext';

export default function SearchChatScreen({ navigation }) {
  const { user } = useContext(AppContext);
  const [allUsers, setAllUsers] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    getCollection({ collectionName: 'users' })
      .then(us => setAllUsers(us.filter(u => u.uid !== user.uid)))
      .catch(console.error);
  }, [user]);

  const filtered = allUsers.filter(u =>
    (u.displayName || u.email).toLowerCase().includes(q.toLowerCase())
  );

  const open = async other => {
    const chatId = await findOrCreateChat(user.uid, other.uid);
    navigation.navigate('Chat', { chatId, other });
    setQ('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Buscar usuario..."
        value={q}
        onChangeText={setQ}
        autoCapitalize="none"
      />
      <FlatList
        data={filtered}
        keyExtractor={u => u.uid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => open(item)}>
            <Text style={styles.name}>{item.displayName || item.email}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No se encontraron usuarios</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:10 },
  input: { borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginBottom:10 },
  row: { padding:12, borderBottomWidth:1, borderColor:'#eee' },
  name: { fontSize:16 },
  empty: { textAlign:'center', marginTop:20, color:'#999' },
});
