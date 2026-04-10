import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

const SPORTS = [
  { id: 'route', label: 'Route', emoji: '🚴' },
  { id: 'vtt', label: 'VTT', emoji: '🚵' },
  { id: 'trail', label: 'Trail', emoji: '🏔️' },
  { id: 'running', label: 'Running', emoji: '🏃' },
];

const LEVELS = [
  { id: 'facile', label: 'Facile', color: '#1bdf8a' },
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Créer une sortie</Text>
        <Text style={styles.subtitle}>Partage ta prochaine aventure</Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Titre */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Titre de la sortie</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Sortie Croix-Rousse matinale"
            placeholderTextColor="#bbb"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Sport */}
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

        {/* Date et heure */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Date</Text>
            <TextInput style={styles.input} placeholder="12/04/2026" placeholderTextColor="#bbb" value={date} onChangeText={setDate} />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Heure</Text>
            <TextInput style={styles.input} placeholder="07:00" placeholderTextColor="#bbb" value={time} onChangeText={setTime} />
          </View>
        </View>

        {/* Distance et dénivelé */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Distance (km)</Text>
            <TextInput style={styles.input} placeholder="45" placeholderTextColor="#bbb" keyboardType="numeric" value={distance} onChangeText={setDistance} />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Dénivelé (m)</Text>
            <TextInput style={styles.input} placeholder="680" placeholderTextColor="#bbb" keyboardType="numeric" value={elevation} onChangeText={setElevation} />
          </View>
        </View>

        {/* Allure */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Allure / Vitesse</Text>
          <TextInput style={styles.input} placeholder="ex: 28 km/h ou 6:30 /km" placeholderTextColor="#bbb" value={pace} onChangeText={setPace} />
        </View>

        {/* Niveau */}
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

        {/* Participants */}
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

        {/* Point de rendez-vous */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Point de rendez-vous</Text>
          <TextInput style={styles.input} placeholder="ex: Parking Croix-Rousse" placeholderTextColor="#bbb" value={location} onChangeText={setLocation} />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description <Text style={styles.optional}>(optionnel)</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Décris la sortie, conseils, matériel..."
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Bouton publier */}
        <TouchableOpacity style={styles.publishBtn}>
          <Text style={styles.publishText}>Publier la sortie</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa', paddingTop: 56 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#0d0d0d' },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 2 },
  form: { flex: 1 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#555' },
  optional: { fontSize: 12, fontWeight: '400', color: '#bbb' },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#e8eaed', padding: 11, fontSize: 13, color: '#0d0d0d' },
  textarea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#e8eaed', backgroundColor: '#fff' },
  sportBtnActive: { borderColor: '#1bdf8a', backgroundColor: '#f0fdf7' },
  sportEmoji: { fontSize: 20, marginBottom: 4 },
  sportLabel: { fontSize: 11, fontWeight: '500', color: '#888' },
  sportLabelActive: { color: '#0a9e60' },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, padding: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#e8eaed', backgroundColor: '#fff', alignItems: 'center' },
  levelText: { fontSize: 11, fontWeight: '600', color: '#888' },
  participantsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#e8eaed', padding: 10 },
  pBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f5f6f8', borderWidth: 1, borderColor: '#e8eaed', alignItems: 'center', justifyContent: 'center' },
  pBtnText: { fontSize: 18, color: '#555', lineHeight: 22 },
  pVal: { fontSize: 18, fontWeight: '600', color: '#0d0d0d' },
  publishBtn: { backgroundColor: '#1bdf8a', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  publishText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});