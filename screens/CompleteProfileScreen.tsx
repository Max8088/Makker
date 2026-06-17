import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Alert
} from 'react-native';
import { supabase } from '../lib/supabase';

const SPORTS = [
  { id: 'route', label: 'Route', emoji: '🚴' },
  { id: 'vtt', label: 'VTT', emoji: '🚵' },
  { id: 'trail', label: 'Trail', emoji: '🏔️' },
  { id: 'running', label: 'Running', emoji: '🏃' },
];

const NIVEAUX = [
  { id: 'facile', label: 'Facile', color: '#22c55e' },
  { id: 'intermediaire', label: 'Intermédiaire', color: '#f59f00' },
  { id: 'difficile', label: 'Difficile', color: '#e05c3a' },
];

type Props = {
  onComplete: () => void;
  onSkip: () => void;
};

export default function CompleteProfileScreen({ onComplete, onSkip }: Props) {
  const [ville, setVille] = useState('');
  const [sportPrincipal, setSportPrincipal] = useState('route');
  const [niveau, setNiveau] = useState('intermediaire');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!ville.trim()) {
      Alert.alert('Champ requis', 'Merci de renseigner ta ville.');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await supabase
      .from('profiles')
      .update({
        ville: ville.trim(),
        sport_principal: sportPrincipal,
        niveau,
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      onComplete();
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
          <Text style={styles.title}>Encore un petit effort !</Text>
          <Text style={styles.subtitle}>Complète ton profil pour trouver des partenaires près de toi</Text>
        </View>

        <View style={styles.form}>

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

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sport principal</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sportBtn, sportPrincipal === s.id && styles.sportBtnActive]}
                  onPress={() => setSportPrincipal(s.id)}
                >
                  <Text style={styles.sportEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sportLabel, sportPrincipal === s.id && styles.sportLabelActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Niveau</Text>
            <View style={styles.levelRow}>
              {NIVEAUX.map(n => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.levelBtn, niveau === n.id && { borderColor: n.color, backgroundColor: n.color + '15' }]}
                  onPress={() => setNiveau(n.id)}
                >
                  <Text style={[styles.levelText, niveau === n.id && { color: n.color }]}>{n.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? 'Enregistrement...' : 'Valider mon profil'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>Plus tard</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoImage: { width: 70, height: 70, borderRadius: 18, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#8888bb', marginTop: 8, textAlign: 'center', paddingHorizontal: 12 },
  form: { gap: 18 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  input: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#DDD8FF',
    padding: 13, fontSize: 14, color: '#1a1a2e',
  },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  sportBtnActive: { borderColor: '#5B52F0', backgroundColor: '#EEEDFE' },
  sportEmoji: { fontSize: 22, marginBottom: 4 },
  sportLabel: { fontSize: 11, fontWeight: '500', color: '#8888bb' },
  sportLabelActive: { color: '#5B52F0', fontWeight: '700' },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, padding: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff', alignItems: 'center' },
  levelText: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  submitBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', padding: 8 },
  skipText: { fontSize: 13, color: '#8888bb', fontWeight: '600' },
});