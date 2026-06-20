import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import AppButton from '../components/AppButton'
import AppTextInput from '../components/AppTextInput'
import Card from '../components/Card'
import { COLORS, SPACING } from '../theme'

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>Login</Text>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <Text style={styles.label}>Email</Text>
          <AppTextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.mb}
          />
          <Text style={styles.label}>Password</Text>
          <AppTextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.mb}
          />
          <AppButton
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>
              No account? <Text style={{ color: COLORS.primary }}>Register</Text>
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.gray50 },
  container: { flexGrow: 1, justifyContent: 'center', padding: SPACING.md },
  card: { maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: SPACING.md, color: COLORS.gray700 },
  errorBox: { backgroundColor: COLORS.red100, borderRadius: 6, padding: SPACING.sm, marginBottom: SPACING.sm },
  errorText: { color: COLORS.red700, fontSize: 13 },
  label: { fontSize: 13, color: COLORS.gray600, marginBottom: 4 },
  mb: { marginBottom: SPACING.sm },
  link: { marginTop: SPACING.md, alignItems: 'center' },
  linkText: { fontSize: 13, color: COLORS.gray600 }
})
