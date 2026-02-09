import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Chat = ({ route, navigation }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { receiverEmail, receiverId } = route.params;
  const myId = auth().currentUser?.uid;

  // Consistent Chat ID
  const chatId =
    myId > receiverId ? `${myId}_${receiverId}` : `${receiverId}_${myId}`;

  useEffect(() => {
    navigation.setOptions({ title: receiverEmail });

    const subscriber = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(qs => {
        if (qs) {
          setMessages(qs.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        }
      });
    return () => subscriber();
  }, [chatId]);

  const sendMessage = async () => {
    if (message.trim().length === 0) return;
    const currentMsg = message;
    setMessage('');

    try {
      const chatRef = firestore().collection('chats').doc(chatId);

      // 1. Update Main Chat Doc (Important for ChatList)
      await chatRef.set(
        {
          participants: [myId, receiverId],
          lastMessage: currentMsg,
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // 2. Add Message to sub-collection
      await chatRef.collection('messages').add({
        text: currentMsg,
        senderId: myId,
        receiverId: receiverId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.log('Send Error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        inverted
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msgBubble,
              item.senderId === myId ? styles.myMsg : styles.otherMsg,
            ]}
          >
            <Text style={{ color: item.senderId === myId ? '#fff' : '#000' }}>
              {item.text}
            </Text>
          </View>
        )}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  msgBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
  },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#2D5F5D' },
  otherMsg: { alignSelf: 'flex-start', backgroundColor: '#E0E0E0' },
  inputArea: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: '#2D5F5D',
    padding: 10,
    borderRadius: 20,
  },
});

export default Chat;
