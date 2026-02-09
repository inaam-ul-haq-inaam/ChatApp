import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ChatList = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const myId = auth().currentUser?.uid;

  useEffect(() => {
    if (!myId) return;

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', myId)
      .onSnapshot(
        async snapshot => {
          if (!snapshot) {
            setLoading(false);
            return;
          }

          const chatPromises = snapshot.docs.map(async doc => {
            const data = doc.data();
            const otherUserId = data.participants.find(id => id !== myId);
            if (!otherUserId) return null;

            const userDoc = await firestore()
              .collection('users')
              .doc(otherUserId)
              .get();

            return {
              id: doc.id,
              otherUserId,
              otherUserEmail: userDoc.data()?.email || 'Unknown User',
              lastMessage: data.lastMessage || 'No messages yet',
            };
          });

          const results = await Promise.all(chatPromises);
          setChats(results.filter(c => c !== null));
          setLoading(false);
        },
        error => {
          console.log('ChatList Error:', error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, [myId]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() =>
        navigation.navigate('Chat', {
          receiverEmail: item.otherUserEmail,
          receiverId: item.otherUserId,
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.otherUserEmail[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.emailText}>{item.otherUserEmail}</Text>
        <Text style={styles.lastMsgText} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={<Text style={styles.header}>Recent Chats</Text>}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No chats found. Go to Contacts to start chatting!
          </Text>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Contacts')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      {loading && (
        <ActivityIndicator size="large" color="#2D5F5D" style={styles.loader} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', padding: 20, color: '#333' },
  chatCard: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2D5F5D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  chatInfo: { marginLeft: 15, flex: 1 },
  emailText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  lastMsgText: { fontSize: 14, color: '#777', marginTop: 3 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2D5F5D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 30 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  loader: { position: 'absolute', top: '50%', left: '45%' },
});

export default ChatList;
