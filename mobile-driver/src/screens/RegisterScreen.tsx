import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import CustomInput from '../components/CustomInput';
import { register } from '../api/authService';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', role: 'driver' });
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || form.password !== form.password_confirmation) {
      Alert.alert('Error', 'Please fill all fields and ensure passwords match');
      return;
    }
    setLoading(true);
    try {
      const res = await register(form);
      const data = res.data?.data ?? res.data;
      await authLogin(data.user, data.token);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Registration</Text>
      <CustomInput placeholder="Enter your full name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
      <CustomInput placeholder="Enter your email address" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" autoCapitalize="none" />
      <CustomInput placeholder="Create a password" value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} secureTextEntry />
      <CustomInput placeholder="Confirm your password" value={form.password_confirmation} onChangeText={(t) => setForm({ ...form, password_confirmation: t })} secureTextEntry />
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Creating...' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f3ff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, color: '#111827', textAlign: 'center' },

  btn: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 9999, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#8b5cf6', marginTop: 16, textAlign: 'center' },
});
