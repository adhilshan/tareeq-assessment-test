import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import CustomInput from '../components/CustomInput';
import { login } from '../api/authService';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      setError('');
      const res = await login({ email, password });
      const data = res.data?.data ?? res.data;
      if (data.user.role !== 'driver') {
        setError('This app is for drivers. Please use the web app as a customer.');
        return;
      }
      await authLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TowAssist Driver</Text>
      <CustomInput placeholder="Enter your email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <CustomInput placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f3ff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 32, color: '#111827', textAlign: 'center' },

  btn: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 9999, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#8b5cf6', marginTop: 16, textAlign: 'center' },
  errorText: { color: '#ef4444', fontSize: 14, marginBottom: 16, textAlign: 'center' },
});
