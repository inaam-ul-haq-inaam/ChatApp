import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';

import Login from './src/screens/Login';
import ChatList from './src/screens/ChatList';
import Contacts from './src/screens/Contact';
import Chat from './src/screens/Chat';

const Stack = createStackNavigator();

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  const LogoutButton = () => (
    <TouchableOpacity onPress={() => auth().signOut()} style={styles.logoutBtn}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="ChatList">
          <Stack.Screen
            name="ChatList"
            component={ChatList}
            options={{
              title: 'Chats',
              headerRight: () => <LogoutButton />, // Header mein button
            }}
          />
          <Stack.Screen
            name="Contacts"
            component={Contacts}
            options={{ title: 'New Contact' }}
          />
          <Stack.Screen
            name="Chat"
            component={Chat}
            options={({ route }) => ({
              title: route.params?.receiverEmail || 'Chat',
              headerRight: () => <LogoutButton />, // Chat screen par bhi logout
            })}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  logoutBtn: {
    marginRight: 15,
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default App;
