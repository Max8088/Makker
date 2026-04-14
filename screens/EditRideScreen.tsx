import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import SwipeBack from '../components/SwipeBack';

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

type Sortie = {
  id: string;
  titre: string;
  sport: string;
  distance: string;
  elevation: string;
  allure: string;
  lieu: string;
  lieu_rencontre: string;
  date_sortie: string;
  heure: string;
  participants_max: number;
  niveau: string;
  description: string;
  createur_id: string;
  latitude?: number;
  longitude?: number;
};

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
  };
};

type Props = {
  sortie: Sortie;
  onBack: () => void;
  onSaved: () => void;
};

export default function EditRideScreen({ sortie, onBack, onSaved }: Props) {
  const [titre, setTitre] = useState(sortie.titre);
  const [sport, setSport] = useState(sortie.sport);
  const [distance, setDistance] = useState(sortie.distance);
  const [elevation, setElevation] = useState(sortie.elevation);
  const [allure, setAllure] = useState(sortie.allure);
  const [lieu, setLieu] = useState(sortie.lieu);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(
    sortie.latitude ? { latitude: sortie.latitude, longitude: sortie.longitude! } : null
  );
  const [lieuRencontre, setLieuRencontre] = useState(sortie.lieu_rencontre || '');
  const [date, setDate] = useState(sortie.date_sortie);
  const [heure, setHeure] = useState(sortie.heure);
  const [participantsMax, setParticipantsMax] = useState(String(sortie.participants_max));
  const [niveau, setNiveau] = useState(sortie.niveau);
  const [description, setDescription] = useState(sortie.description || '');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchLocation = async (text: string) => {
    setLieu(text);
    setLocationCoords(null);

    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const query = encodeURIComponent(text);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&addressdetails=1&countrycodes=fr`,
          { headers: { 'User-Agent': 'MakkerApp/1.0' } }
        );
        const results: Suggestion[] = await response.json();
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (e) {
        console.log('Erreur recherche:', e);
      }
    }, 400);
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    const addr = suggestion.address;
    const ville = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    const label = ville
      ? `${ville}${addr.state ? ', ' + addr.state : ''}`
      : suggestion.display_name.split(',').slice(0, 2).join(',').trim();

    setLieu(label);
    setLocationCoords({
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!titre || !lieu || !date || !heure) {
      Alert.alert('Erreur', 'Remplis au moins le titre, le lieu, la date et l\'heure.');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('sorties')
      .update({
        titre, sport, distance, elevation, allure,
        lieu, lieu_rencontre: lieuRencontre,
        date_sortie: date, heure,
        participants_max: parseInt(participantsMax) || 5,
        niveau, description,
        ...(locationCoords && {
          latitude: locationCoords.latitude,
          longitude: locationCoords.longitude,
        }),
      })
      .eq('id', sortie.id);
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Sortie mise à jour ! ✅', '', [{ text: 'OK', onPress: onSaved }]);
    }
  };

  return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier la sortie</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Titre de la sortie *</Text>
            <TextInput style={styles.input} value={titre} onChangeText={setTitre} placeholder="ex: Sortie matinale Croix-Rousse" placeholderTextColor="#bbbbdd" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sport</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => (
                <TouchableOpacity key={s.id} style={[styles.sportBtn, sport === s.id && styles.sportBtnActive]} onPress={() => setSport(s.id)}>
                  <Text style={styles.sportEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sportLabel, sport === s.id && styles.sportLabelActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Distance (km)</Text>
              <TextInput style={styles.input} value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="ex: 45" placeholderTextColor="#bbbbdd" />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Dénivelé (m)</Text>
              <TextInput style={styles.input} value={elevation} onChangeText={setElevation} keyboardType="numeric" placeholder="ex: 600" placeholderTextColor="#bbbbdd" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Allure</Text>
              <TextInput style={styles.input} value={allure} onChangeText={setAllure} placeholder="ex: 28km/h" placeholderTextColor="#bbbbdd" />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Participants max</Text>
              <TextInput style={styles.input} value={participantsMax} onChangeText={setParticipantsMax} keyboardType="numeric" placeholder="ex: 8" placeholderTextColor="#bbbbdd" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Date *</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" placeholderTextColor="#bbbbdd" />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Heure *</Text>
              <TextInput style={styles.input} value={heure} onChangeText={setHeure} placeholder="ex: 07:00" placeholderTextColor="#bbbbdd" />
            </View>
          </View>

          {/* Lieu avec suggestions */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Lieu *{' '}
              {locationCoords && <Text style={styles.confirmed}>✓ Confirmé</Text>}
            </Text>
            <TextInput
              style={[styles.input, locationCoords && styles.inputConfirmed]}
              value={lieu}
              onChangeText={searchLocation}
              placeholder="ex: Lyon, Col de l'Oeillon..."
              placeholderTextColor="#bbbbdd"
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((s, i) => {
                  const addr = s.address;
                  const ville = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
                  const label = ville
                    ? `${ville}${addr.state ? ', ' + addr.state : ''}`
                    : s.display_name.split(',').slice(0, 2).join(',').trim();
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionBorder]}
                      onPress={() => selectSuggestion(s)}
                    >
                      <Text style={styles.suggestionIcon}>📍</Text>
                      <Text style={styles.suggestionText}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Point de rencontre</Text>
            <TextInput style={styles.input} value={lieuRencontre} onChangeText={setLieuRencontre} placeholder="ex: Place de la Croix-Rousse" placeholderTextColor="#bbbbdd" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Niveau</Text>
            <View style={styles.niveauxRow}>
              {NIVEAUX.map(n => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.niveauBtn, niveau === n.id && { borderColor: n.color, backgroundColor: n.color + '15' }]}
                  onPress={() => setNiveau(n.id)}
                >
                  <Text style={[styles.niveauText, niveau === n.id && { color: n.color }]}>{n.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décris ta sortie..."
              placeholderTextColor="#bbbbdd"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#5B52F0' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  confirmed: { fontSize: 12, fontWeight: '600', color: '#22c55e' },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 11, fontSize: 13, color: '#1a1a2e' },
  inputConfirmed: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  sportBtnActive: { borderColor: '#5B52F0', backgroundColor: '#EEEDFE' },
  sportEmoji: { fontSize: 20, marginBottom: 4 },
  sportLabel: { fontSize: 11, fontWeight: '500', color: '#8888bb' },
  sportLabelActive: { color: '#5B52F0', fontWeight: '600' },
  niveauxRow: { flexDirection: 'row', gap: 8 },
  niveauBtn: { flex: 1, padding: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff', alignItems: 'center' },
  niveauText: { fontSize: 11, fontWeight: '600', color: '#8888bb' },
  suggestionsBox: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#DDD8FF',
    marginTop: 4, overflow: 'hidden',
    shadowColor: '#5B52F0', shadowOpacity: 0.08,
    shadowRadius: 8, elevation: 4,
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F4F3FF' },
  suggestionIcon: { fontSize: 14 },
  suggestionText: { fontSize: 13, color: '#1a1a2e', flex: 1 },
  saveBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});