import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

const CRENEAUX = [
  { id: 'matin', label: '🌅 Matin' },
  { id: 'aprem', label: '☀️ Après-midi' },
  { id: 'soir', label: '🌆 Soir' },
  { id: 'weekend', label: '📅 Weekend' },
];

const TOTAL_STEPS = 5;

type Props = {
  onFinish: () => void;
};

export default function OnboardingScreen({ onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [ville, setVille] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sportPrincipal, setSportPrincipal] = useState('route');
  const [niveau, setNiveau] = useState('intermediaire');
  const [creneaux, setCreneaux] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isLastStep = step === TOTAL_STEPS - 1;

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Active l'accès aux photos dans les réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      const formData = new FormData();
      formData.append('file', { uri, name: fileName, type: mimeType } as any);

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('No access token');

      const uploadResponse = await fetch(
        `https://cabsrxleafmowciqttmb.supabase.co/storage/v1/object/avatars/${fileName}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-upsert': 'true',
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(publicUrlData.publicUrl);
    } catch (e) {
      Alert.alert('Erreur', "Impossible de télécharger la photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleCreneau = (id: string) => {
    setCreneaux(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const goNext = () => {
    if (step === 0 && !ville.trim()) {
      Alert.alert('Champ requis', 'Merci de renseigner ta ville.');
      return;
    }
    if (isLastStep) {
      handleFinish();
    } else {
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    // Vérifie si le profil existe déjà ; sinon on doit fournir prenom/nom
    // (colonnes NOT NULL) en les récupérant depuis les métadonnées auth.
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, prenom, nom')
      .eq('id', user.id)
      .maybeSingle();

    const updates: any = {
      id: user.id,
      ville: ville.trim(),
      sport_principal: sportPrincipal,
      niveau,
      creneaux,
      onboarding_completed: true,
    };

    if (avatarUrl) updates.avatar_url = avatarUrl;

    if (existingProfile) {
      // Le profil existe déjà : on doit quand même fournir prenom/nom,
      // sinon l'upsert essaiera d'insérer NULL et violera la contrainte NOT NULL.
      updates.prenom = existingProfile.prenom;
      updates.nom = existingProfile.nom;
    } else {
      // Le profil n'existe pas : on complète avec ce qu'on a (metadata Google,
      // ou des valeurs vides en dernier recours pour ne pas violer NOT NULL)
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const nameParts = fullName.trim().split(' ');
      updates.prenom = nameParts[0] || 'Utilisateur';
      updates.nom = nameParts.slice(1).join(' ') || '';
      if (!updates.avatar_url && user.user_metadata?.avatar_url) {
        updates.avatar_url = user.user_metadata.avatar_url;
      }
    }

    // upsert : met à jour si le profil existe, le crée sinon
    const { data: savedRows, error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'id' })
      .select();

    setSaving(false);

    if (error) {
      console.error('Onboarding save error:', error);
      Alert.alert('Erreur', error.message);
      return;
    }

    if (!savedRows || savedRows.length === 0) {
      console.error('Onboarding save: no rows returned for user', user.id);
      Alert.alert('Erreur', "La sauvegarde n'a pas pu être confirmée. Réessaie.");
      return;
    }

    onFinish();
  };

  const handleSkipAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
    onFinish();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>📍</Text>
            <Text style={styles.stepTitle}>Où es-tu basé ?</Text>
            <Text style={styles.stepSub}>Pour te proposer des sorties près de toi</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Lyon"
              placeholderTextColor="#bbbbdd"
              value={ville}
              onChangeText={setVille}
              autoCapitalize="words"
              autoFocus
            />
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>📸</Text>
            <Text style={styles.stepTitle}>Ajoute une photo</Text>
            <Text style={styles.stepSub}>Les profils avec photo inspirent plus confiance</Text>
            <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} style={styles.avatarPicker}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{uploadingAvatar ? '⏳' : '📷'}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarHint}>
              {uploadingAvatar ? 'Upload en cours...' : 'Appuie pour choisir une photo'}
            </Text>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🏃</Text>
            <Text style={styles.stepTitle}>Ton sport principal</Text>
            <Text style={styles.stepSub}>Celui que tu pratiques le plus souvent</Text>
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
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>📈</Text>
            <Text style={styles.stepTitle}>Ton niveau</Text>
            <Text style={styles.stepSub}>Pour trouver des partenaires à ton rythme</Text>
            <View style={styles.levelCol}>
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
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🗓️</Text>
            <Text style={styles.stepTitle}>Tes créneaux préférés</Text>
            <Text style={styles.stepSub}>Sélectionne tous ceux qui te conviennent</Text>
            <View style={styles.creneauxGrid}>
              {CRENEAUX.map(c => {
                const isActive = creneaux.includes(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.creneauBtn, isActive && styles.creneauBtnActive]}
                    onPress={() => toggleCreneau(c.id)}
                  >
                    <Text style={[styles.creneauText, isActive && styles.creneauTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= step && styles.progressDotActive]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleSkipAll}>
          <Text style={styles.skipAllText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, saving && { opacity: 0.7 }]}
          onPress={goNext}
          disabled={saving}
        >
          <Text style={styles.nextBtnText}>
            {saving ? 'Enregistrement...' : isLastStep ? 'Terminer' : 'Continuer'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD8FF', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#5B52F0' },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 22, height: 5, borderRadius: 3, backgroundColor: '#DDD8FF' },
  progressDotActive: { backgroundColor: '#5B52F0' },
  skipAllText: { fontSize: 13, color: '#8888bb', fontWeight: '600' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  stepContent: { alignItems: 'center', gap: 8 },
  stepEmoji: { fontSize: 44, marginBottom: 8 },
  stepTitle: { fontSize: 21, fontWeight: '800', color: '#1a1a2e', textAlign: 'center' },
  stepSub: { fontSize: 13, color: '#8888bb', textAlign: 'center', marginBottom: 20, paddingHorizontal: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#DDD8FF',
    padding: 14, fontSize: 15, color: '#1a1a2e',
    width: '100%', textAlign: 'center',
  },
  avatarPicker: { marginBottom: 6 },
  avatarImg: { width: 110, height: 110, borderRadius: 28 },
  avatarPlaceholder: {
    width: 110, height: 110, borderRadius: 28,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#DDD8FF', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPlaceholderText: { fontSize: 32 },
  avatarHint: { fontSize: 12, color: '#8888bb' },
  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%' },
  sportBtn: {
    width: '45%', alignItems: 'center', padding: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff',
  },
  sportBtnActive: { borderColor: '#5B52F0', backgroundColor: '#EEEDFE' },
  sportEmoji: { fontSize: 28, marginBottom: 6 },
  sportLabel: { fontSize: 12, fontWeight: '500', color: '#8888bb' },
  sportLabelActive: { color: '#5B52F0', fontWeight: '700' },
  levelCol: { width: '100%', gap: 10 },
  levelBtn: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  levelText: { fontSize: 14, fontWeight: '600', color: '#8888bb', textAlign: 'center' },
  creneauxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  creneauBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  creneauBtnActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  creneauText: { fontSize: 13, fontWeight: '500', color: '#8888bb' },
  creneauTextActive: { color: '#fff', fontWeight: '600' },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { backgroundColor: '#5B52F0', borderRadius: 14, padding: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});