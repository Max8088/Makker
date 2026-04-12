import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

const SPORTS = [
  { id: 'route', label: 'Route', emoji: '🚴' },
  { id: 'vtt', label: 'VTT', emoji: '🚵' },
  { id: 'trail', label: 'Trail', emoji: '🏔️' },
  { id: 'running', label: 'Running', emoji: '🏃' },
];

const LEVELS = [
  { id: 'facile', label: 'Facile', color: '#22c55e' },
  { id: 'intermediaire', label: 'Intermédiaire', color: '#f59f00' },
  { id: 'difficile', label: 'Difficile', color: '#e05c3a' },
];

export default function CreateScreen() {
  const [selectedSport, setSelectedSport] = useState('route');
  const [selectedLevel, setSelectedLevel] = useState('intermediaire');
  const [participants, setParticipants] = useState(8);
  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [pace, setPace] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const geocodeLocation = async (address: string): Promise<{ latitude: number; longitude: number }> => {
    try {
      const query = encodeURIComponent(`${address}, Lyon, France`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'User-Agent': 'MakkerApp/1.0' } }
      );
      const results = await response.json();
      if (results && results.length > 0) {
        return {
          latitude: parseFloat(results[0].lat),
          longitude: parseFloat(results[0].lon),
        };
      }
    } catch (e) {
      console.log('Géocodage échoué:', e);
    }
    return { latitude: 45.7490, longitude: 4.8350 };
  };

  const resetForm = () => {
    setTitle('');
    setDistance('');
    setElevation('');
    setPace('');
    setDate('');
    setTime('');
    setLocation('');
    setDescription('');
    setSelectedSport('route');
    setSelectedLevel('intermediaire');
    setParticipants(8);
  };

  const handlePublish = async () => {
    if (!title || !date || !time || !distance || !location) {
      Alert.alert('Champs manquants', 'Merci de remplir au minimum le titre, la date, l\'heure, la distance et le point de rendez-vous.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Erreur', 'Tu dois être connecté pour publier une sortie.');
      setLoading(false);
      return;
    }

    const { latitude, longitude } = await geocodeLocation(location);

    const { error } = await supabase.from('sorties').insert({
      titre: title,
      sport: selectedSport,
      distance,
      elevation,
      allure: pace,
      niveau: selectedLevel,
      lieu: location,
      lieu_rencontre: location,
      date_sortie: date,
      heure: time,
      participants_max: participants,
      description,
      createur_id: user.id,
      latitude,
      longitude,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Sortie publiée ! 🎉', 'Ta sortie apparaît maintenant sur la carte.', [
        { text: 'OK', onPress: resetForm }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Créer une sortie</Text>
        <Text style={styles.subtitle}>Partage ta prochaine aventure</Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ padding: 16, gap: 16 }}>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Titre de la sortie</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Sortie Croix-Rousse matinale"
            placeholderTextColor="#bbbbdd"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Sport</Text>
          <View style={styles.sportGrid}>
            {SPORTS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sportBtn, selectedSport === s.id && styles.sportBtnActive]}
                onPress={() => setSelectedSport(s.id)}
              >
                <Text style={styles.sportEmoji}>{s.emoji}</Text>
                <Text style={[styles.sportLabel, selectedSport === s.id && styles.sportLabelActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Date</Text>
            <TextInput style={styles.input} placeholder="12/04/2026" placeholderTextColor="#bbbbdd" value={date} onChangeText={setDate} />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Heure</Text>
            <TextInput style={styles.input} placeholder="07:00" placeholderTextColor="#bbbbdd" value={time} onChangeText={setTime} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Distance (km)</Text>
            <TextInput style={styles.input} placeholder="45" placeholderTextColor="#bbbbdd" keyboardType="numeric" value={distance} onChangeText={setDistance} />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Dénivelé (m)</Text>
            <TextInput style={styles.input} placeholder="680" placeholderTextColor="#bbbbdd" keyboardType="numeric" value={elevation} onChangeText={setElevation} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Allure / Vitesse</Text>
          <TextInput style={styles.input} placeholder="ex: 28 km/h ou 6:30 /km" placeholderTextColor="#bbbbdd" value={pace} onChangeText={setPace} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Niveau</Text>
          <View style={styles.levelRow}>
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[styles.levelBtn, selectedLevel === l.id && { borderColor: l.color, backgroundColor: l.color + '15' }]}
                onPress={() => setSelectedLevel(l.id)}
              >
                <Text style={[styles.levelText, selectedLevel === l.id && { color: l.color }]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Participants max</Text>
          <View style={styles.participantsRow}>
            <TouchableOpacity style={styles.pBtn} onPress={() => setParticipants(Math.max(2, participants - 1))}>
              <Text style={styles.pBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.pVal}>{participants}</Text>
            <TouchableOpacity style={styles.pBtn} onPress={() => setParticipants(Math.min(20, participants + 1))}>
              <Text style={styles.pBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Point de rendez-vous</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Parking Croix-Rousse, Lyon"
            placeholderTextColor="#bbbbdd"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description <Text style={styles.optional}>(optionnel)</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Décris la sortie, conseils, matériel..."
            placeholderTextColor="#bbbbdd"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          style={[styles.publishBtn, loading && { opacity: 0.7 }]}
          onPress={handlePublish}
          disabled={loading}
        >
          <Text style={styles.publishText}>
            {loading ? 'Géolocalisation & publication...' : 'Publier la sortie'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: 1 },
  subtitle: { fontSize: 13, color: '#8888bb', marginTop: 2 },
  form: { flex: 1 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  optional: { fontSize: 12, fontWeight: '400', color: '#bbbbdd' },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 11, fontSize: 13, color: '#1a1a2e' },
  textarea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  sportBtnActive: { borderColor: '#5B52F0', backgroundColor: '#EEEDFE' },
  sportEmoji: { fontSize: 20, marginBottom: 4 },
  sportLabel: { fontSize: 11, fontWeight: '500', color: '#8888bb' },
  sportLabelActive: { color: '#5B52F0' },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, padding: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff', alignItems: 'center' },
  levelText: { fontSize: 11, fontWeight: '600', color: '#8888bb' },
  participantsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 10 },
  pBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEEDFE', borderWidth: 1, borderColor: '#DDD8FF', alignItems: 'center', justifyContent: 'center' },
  pBtnText: { fontSize: 18, color: '#5B52F0', lineHeight: 22 },
  pVal: { fontSize: 18, fontWeight: '600', color: '#1a1a2e' },
  publishBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  publishText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});