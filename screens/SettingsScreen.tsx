import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert
} from 'react-native';
import { supabase } from '../lib/supabase';

const SPORTS = [
  { id: 'route', label: 'Route', emoji: '🚴' },
  { id: 'vtt', label: 'VTT', emoji: '🚵' },
  { id: 'trail', label: 'Trail', emoji: '🏔️' },
  { id: 'running', label: 'Running', emoji: '🏃' },
];

const NIVEAUX = [
  { id: 'debutant', label: 'Débutant', color: '#22c55e' },
  { id: 'intermediaire', label: 'Intermédiaire', color: '#f59f00' },
  { id: 'avance', label: 'Avancé', color: '#e05c3a' },
];

const CRENEAUX = [
  { id: 'matin', label: '🌅 Matin' },
  { id: 'midi', label: '☀️ Midi' },
  { id: 'soir', label: '🌆 Soir' },
  { id: 'weekend', label: '📅 Weekend' },
];

export default function SettingsScreen({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [sportPrincipal, setSportPrincipal] = useState('route');
  const [niveau, setNiveau] = useState('intermediaire');
  const [creneaux, setCreneaux] = useState<string[]>(['matin']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setPrenom(data.prenom || '');
      setNom(data.nom || '');
      setVille(data.ville || '');
      setSportPrincipal(data.sport_principal || 'route');
      setNiveau(data.niveau || 'intermediaire');
      setCreneaux(data.creneaux || ['matin']);
    }
  };

  const toggleCreneau = (id: string) => {
    setCreneaux(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        prenom,
        nom,
        ville,
        sport_principal: sportPrincipal,
        niveau,
        creneaux,
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Profil mis à jour ! ✅', '', [
        { text: 'OK', onPress: onBack }
      ]);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Tu es sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>

        {/* Infos personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={prenom}
                onChangeText={setPrenom}
                placeholder="ex: Maxime"
                placeholderTextColor="#bbbbdd"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder="ex: Dupont"
                placeholderTextColor="#bbbbdd"
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              value={ville}
              onChangeText={setVille}
              placeholder="ex: Lyon"
              placeholderTextColor="#bbbbdd"
            />
          </View>
        </View>

        {/* Sport principal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sport principal</Text>
          <View style={styles.sportGrid}>
            {SPORTS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sportBtn, sportPrincipal === s.id && styles.sportBtnActive]}
                onPress={() => setSportPrincipal(s.id)}
              >
                <Text style={styles.sportEmoji}>{s.emoji}</Text>
                <Text style={[styles.sportLabel, sportPrincipal === s.id && styles.sportLabelActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Niveau */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Niveau</Text>
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

        {/* Créneaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Créneaux préférés</Text>
          <View style={styles.creneauxGrid}>
            {CRENEAUX.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.creneauBtn, creneaux.includes(c.id) && styles.creneauBtnActive]}
                onPress={() => toggleCreneau(c.id)}
              >
                <Text style={[styles.creneauText, creneaux.includes(c.id) && styles.creneauTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bouton sauvegarder */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</Text>
        </TouchableOpacity>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#5B52F0' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#DDD8FF', gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  row: { flexDirection: 'row', gap: 10 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  input: { backgroundColor: '#F4F3FF', borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 11, fontSize: 13, color: '#1a1a2e' },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#F4F3FF' },
  sportBtnActive: { borderColor: '#5B52F0', backgroundColor: '#EEEDFE' },
  sportEmoji: { fontSize: 20, marginBottom: 4 },
  sportLabel: { fontSize: 11, fontWeight: '500', color: '#8888bb' },
  sportLabelActive: { color: '#5B52F0', fontWeight: '600' },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, padding: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#F4F3FF', alignItems: 'center' },
  levelText: { fontSize: 11, fontWeight: '600', color: '#8888bb' },
  creneauxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  creneauBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#F4F3FF' },
  creneauBtnActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  creneauText: { fontSize: 13, fontWeight: '500', color: '#8888bb' },
  creneauTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1.5, borderColor: '#ffdddd' },
  logoutText: { color: '#e05c3a', fontSize: 15, fontWeight: '600' },
});