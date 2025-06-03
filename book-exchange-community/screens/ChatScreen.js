import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { getChatMessagesRef, addChatMessage } from '../services/ServiceChat';

export default function ChatScreen({ route }) {
  const { chatId } = route.params;
  const { user } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    const q = query(getChatMessagesRef(chatId), orderBy('createdAt'));
    const unsubscribe = onSnapshot(
      q,
      snap => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
        // Scroll al final al recibir mensajes nuevos
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      error => {
        Alert.alert('Error', 'No se pudieron cargar los mensajes.');
        console.error(error);
      }
    );
    return unsubscribe;
  }, [chatId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!user || !user.uid) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }
    try {
      await addChatMessage(chatId, {
        text: trimmed,
        senderId: user.uid,
        createdAt: new Date()
      });
      setText('');
      // Scroll al enviar mensaje
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje.');
      console.error(error);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        <Text style={[styles.msgText, isMe && { color: '#fff' }]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { flexGrow: 1, justifyContent: 'flex-end', padding: 10 },
  bubble: { maxWidth: '70%', padding: 10, borderRadius: 8, marginVertical: 4 },
  bubbleLeft: { backgroundColor: '#eee', alignSelf: 'flex-start' },
  bubbleRight: { backgroundColor: '#0084ff', alignSelf: 'flex-end' },
  msgText: { color: '#000' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 5
  },
  input: { flex: 1, padding: 10 },
  sendBtn: { padding: 10 },
  sendText: { color: '#007aff', fontWeight: 'bold' }
});
