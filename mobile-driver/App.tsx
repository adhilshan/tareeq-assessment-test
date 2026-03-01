import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import RequestListScreen from './src/screens/RequestListScreen';
import RequestDetailScreen from './src/screens/RequestDetailScreen';
import LocationGate from './src/components/LocationGate';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <LocationGate>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Requests" component={RequestListScreen} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      </Stack.Navigator>
    </LocationGate>
  );
}

function CustomerMessageScreen() {
  const { logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f5f3ff' }}>
      <Text style={{ fontSize: 18, textAlign: 'center', color: '#111827' }}>
        This app is for drivers. Please use the web app for customer features.
      </Text>
      <TouchableOpacity onPress={logout} style={{ marginTop: 24, padding: 16, backgroundColor: '#8b5cf6', borderRadius: 9999 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function CustomerMessage() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerMsg" component={CustomerMessageScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      {!user ? <AuthStack /> : user.role === 'driver' ? <MainStack /> : <CustomerMessage />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#8b5cf6" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
