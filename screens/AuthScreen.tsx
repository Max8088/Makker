import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Alert
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Mode = 'login' | 'register';

const CGU_URL = 'https://max8088.github.io/Makker/cgu.html';
const PRIVACY_URL = 'https://max8088.github.io/Makker/';

export default function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Erreur de connexion', error.message);
    } else {
      onLogin();
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !prenom || !nom) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert("Erreur d'inscription", error.message);
      return;
    }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        prenom,
        nom,
        ville: '',
        sport_principal: 'route',
        niveau: 'intermediaire',
        onboarding_completed: false,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setLoading(false);
        Alert.alert(
          'Erreur',
          "Le compte a été créé mais le profil n'a pas pu être initialisé. Contacte le support."
        );
        return;
      }
    }
    setLoading(false);
    Alert.alert('Compte créé !', 'Tu peux maintenant te connecter.', [
      { text: 'OK', onPress: () => setMode('login') }
    ]);
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error('Aucun token renvoyé par Apple');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Apple ne transmet le nom qu'à la toute première connexion
          await supabase.from('profiles').insert({
            id: data.user.id,
            prenom: credential.fullName?.givenName || '',
            nom: credential.fullName?.familyName || '',
            ville: '',
            sport_principal: 'route',
            niveau: 'intermediaire',
            onboarding_completed: false,
          });
        }

        onLogin();
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') return;
      console.error('Apple login error:', e);
      Alert.alert('Erreur', 'Impossible de se connecter avec Apple.');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = 'makker://';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const url = result.url;
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          // Créer le profil si c'est un nouvel utilisateur Google
          if (sessionData.user) {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', sessionData.user.id)
              .single();

            if (!existingProfile) {
              const fullName = sessionData.user.user_metadata?.full_name || '';
              const nameParts = fullName.split(' ');
              const prenom = nameParts[0] || '';
              const nom = nameParts.slice(1).join(' ') || '';

              await supabase.from('profiles').insert({
                id: sessionData.user.id,
                prenom,
                nom,
                ville: '',
                sport_principal: 'route',
                niveau: 'intermediaire',
                avatar_url: sessionData.user.user_metadata?.avatar_url || null,
                onboarding_completed: false,
              });
            }

            onLogin();
          }
        }
      }
    } catch (e: any) {
      console.error('Google login error:', e);
      Alert.alert('Erreur', 'Impossible de se connecter avec Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/logo_makker.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>MAKKER</Text>
          <Text style={styles.logoSub}>ENSEMBLE, PLUS LOIN</Text>
        </View>

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

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleBtn}
              onPress={handleAppleLogin}
            />
          )}

          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && { opacity: 0.7 }]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <Text style={styles.googleText}>Connexion en cours...</Text>
            ) : (
              <>
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleText}>Continuer avec Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.legalText}>
            En continuant, tu acceptes les{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL(CGU_URL)}>
              Conditions d'utilisation
            </Text>
            {' '}et la{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
              Politique de confidentialité
            </Text>
            .{'\n'}Makker applique une tolérance zéro envers les contenus offensants et les comportements abusifs.
          </Text>

        </View>

        <Text style={styles.footer}>
          {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
          <Text style={styles.footerLink} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </Text>
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  logoImage: { width: 72, height: 72, borderRadius: 18, marginBottom: 10 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', letterSpacing: 2 },
  logoSub: { fontSize: 11, color: '#7B7BAA', marginTop: 6, letterSpacing: 2 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#DDD8FF',
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#5B52F0' },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#999' },
  toggleTextActive: { color: '#fff' },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#7B7BAA' },
  input: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#DDD8FF',
    padding: 12, fontSize: 14, color: '#1a1a2e',
  },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 12, color: '#7B7BAA', fontWeight: '500' },
  submitBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0dcff' },
  dividerText: { fontSize: 12, color: '#aaa' },
  appleBtn: { width: '100%', height: 48 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#DDD8FF', padding: 13,
  },
  googleIcon: { width: 20, height: 20 },
  googleText: { fontSize: 14, fontWeight: '500', color: '#1a1a2e' },
  legalText: { fontSize: 11, color: '#8888bb', textAlign: 'center', lineHeight: 16, paddingHorizontal: 4, marginTop: 4 },
  legalLink: { color: '#5B52F0', fontWeight: '600', textDecorationLine: 'underline' },
  footer: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#aaa' },
  footerLink: { color: '#7B7BAA', fontWeight: '600' },
});