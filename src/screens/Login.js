import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
// Modular Imports
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth(); // Initialize Auth Instance

  const handleAuth = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Try Login
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.navigate('ChatList');
    } catch (error) {
      // 2. Agar user nahi mila ya credentials galat hain, to signup try karen
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential'
      ) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password,
          );
          const user = userCredential.user;

          // 3. Firestore mein user data save karen (Search ke liye zaroori hai)
          await firestore().collection('users').doc(user.uid).set({
            email: user.email.toLowerCase(),
            uid: user.uid,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });

          navigation.navigate('ChatList');
        } catch (signUpError) {
          Alert.alert('Auth Error', signUpError.message);
        }
      } else {
        Alert.alert('Login Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={ss.container}
    >
      <View style={ss.card}>
        <Text style={ss.title}>Chat App</Text>
        <Text style={ss.subtitle}>Login or Create Account</Text>

        <View style={ss.inputGroup}>
          <Text style={ss.label}>Email Address</Text>
          <TextInput
            style={ss.input}
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={ss.inputGroup}>
          <Text style={ss.label}>Password</Text>
          <TextInput
            style={ss.input}
            placeholder="Min 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
        </View>

        <TouchableOpacity
          style={ss.button}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ss.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const ss = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C4DFDA',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#2D5F5D',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default Login;
