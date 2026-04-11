import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';

type Mode = 'login' | 'register';

export default function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [ville, setVille] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* LOGO */}
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>≫</Text>
          </View>
          <Text style={styles.logoText}>Makker</Text>
          <Text style={styles.logoSub}>Trouve ta prochaine aventure</Text>
        </View>

        {/* TOGGLE LOGIN / REGISTER */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {/* FORMULAIRE */}
        <View style={styles.form}>

          {mode === 'register' && (
            <>
              <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ex: Maxime"
                    placeholderTextColor="#bbb"
                    value={prenom}
                    onChangeText={setPrenom}
                    autoCapitalize="words"
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ex: Dupont"
                    placeholderTextColor="#bbb"
                    value={nom}
                    onChangeText={setNom}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Ville</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ex: Lyon"
                  placeholderTextColor="#bbb"
                  value={ville}
                  onChangeText={setVille}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="ton@email.com"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {mode === 'login' && (
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={onLogin}>
            <Text style={styles.submitText}>
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={onLogin}>
            <Text style={styles.googleEmoji}>🔵</Text>
            <Text style={styles.googleText}>Continuer avec Google</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.footer}>
          {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
          <Text style={styles.footerLink} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
          </Text>
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoIcon: {
    width: 70, height: 70, borderRadius: 20,
    backgroundColor: '#1bdf8a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1bdf8a', shadowOpacity: 0.35,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoEmoji: { fontSize: 32, color: '#fff', fontWeight: '900' },
  logoText: { fontSize: 32, fontWeight: '800', color: '#0d0d0d', letterSpacing: -1 },
  logoSub: { fontSize: 14, color: '#aaa', marginTop: 4 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#eaecf0',
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#1bdf8a' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#aaa' },
  toggleTextActive: { color: '#fff' },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#555' },
  input: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e8eaed',
    padding: 12, fontSize: 14, color: '#0d0d0d',
  },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 12, color: '#1bdf8a', fontWeight: '500' },
  submitBtn: {
    backgroundColor: '#1bdf8a', borderRadius: 12,
    padding: 15, alignItems: 'center',
    shadowColor: '#1bdf8a', shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eaecf0' },
  dividerText: { fontSize: 12, color: '#bbb' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e8eaed', padding: 13,
  },
  googleEmoji: { fontSize: 18 },
  googleText: { fontSize: 14, fontWeight: '600', color: '#0d0d0d' },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 13, color: '#aaa' },
  footerLink: { color: '#1bdf8a', fontWeight: '600' },
});