import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image
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
          <Image
            source={require('../assets/logo_makker.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>MAKKER</Text>
          <Text style={styles.logoSub}>ENSEMBLE, PLUS LOIN</Text>
        </View>

        {/* TOGGLE */}
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
                    placeholderTextColor="#bbbbdd"
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
                    placeholderTextColor="#bbbbdd"
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
                  placeholderTextColor="#bbbbdd"
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
              placeholderTextColor="#bbbbdd"
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
              placeholderTextColor="#bbbbdd"
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
  container: { flex: 1, backgroundColor: '#F4F3FF' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoImage: { width: 90, height: 90, borderRadius: 22, marginBottom: 16 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', letterSpacing: 2 },
  logoSub: { fontSize: 11, color: '#8888bb', marginTop: 6, letterSpacing: 2 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#DDD8FF',
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#5B52F0' },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#999' },
  toggleTextActive: { color: '#fff' },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  input: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#DDD8FF',
    padding: 12, fontSize: 14, color: '#1a1a2e',
  },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 12, color: '#8888bb', fontWeight: '500' },
  submitBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0dcff' },
  dividerText: { fontSize: 12, color: '#aaa' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#DDD8FF', padding: 13,
  },
  googleEmoji: { fontSize: 18 },
  googleText: { fontSize: 14, fontWeight: '500', color: '#1a1a2e' },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 13, color: '#aaa' },
  footerLink: { color: '#8888bb', fontWeight: '600' },
});