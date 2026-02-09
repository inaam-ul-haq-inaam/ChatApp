import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Contacts = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [contacts, setContacts] = useState([]);
  const currentUser = auth().currentUser;

  // Fetch user's contacts on mount
  React.useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('contacts')
      .onSnapshot(snapshot => {
        const contactsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContacts(contactsList);
      });
    return unsubscribe;
  }, []);

  // Add new contact
  const addContact = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Enter an email');

    try {
      // Check if email exists in users collection
      const userQuery = await firestore()
        .collection('users')
        .where('email', '==', email.trim())
        .get();

      if (userQuery.empty) {
        return Alert.alert('Error', 'No user found with this email');
      }

      const contactData = userQuery.docs[0].data();
      if (contactData.uid === currentUser.uid) {
        return Alert.alert('Error', 'You cannot add yourself');
      }

      // Add to contacts
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('contacts')
        .doc(contactData.uid)
        .set({
          email: contactData.email,
          uid: contactData.uid,
        });

      setEmail('');
      Alert.alert('Success', 'Contact added');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Navigate to chat
  const openChat = contact => {
    navigation.navigate('Chat', {
      receiverEmail: contact.email,
      receiverId: contact.uid,
    });
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => openChat(item)}>
      <Text style={styles.contactText}>{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TouchableOpacity style={styles.addButton} onPress={addContact}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={item => item.id}
        ListHeaderComponent={<Text style={styles.header}>Your Contacts</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  addContainer: { flexDirection: 'row', marginBottom: 20 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#2D5F5D',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  contactItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactText: { fontSize: 16 },
});

export default Contacts;
