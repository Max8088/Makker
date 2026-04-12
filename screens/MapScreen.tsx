import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

const SPORTS_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'route', label: 'Route' },
  { id: 'vtt', label: 'VTT' },
  { id: 'trail', label: 'Trail' },
  { id: 'running', label: 'Running' },
];

const SPORT_COLORS: { [key: string]: string } = {
  route: '#4F46E5', vtt: '#f59f00', trail: '#5B52F0', running: '#A78BFA'
};

const SPORT_EMOJIS: { [key: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃'
};

type Sortie = {
  id: string;
  titre: string;
  sport: string;
  distance: string;
  elevation: string;
  allure: string;
  lieu: string;
  date_sortie: string;
  heure: string;
  participants_max: number;
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [selectedRide, setSelectedRide] = useState<Sortie | null>(null);

  useEffect(() => {
    fetchSorties();
  }, []);

  const fetchSorties = async () => {
    const { data, error } = await supabase
      .from('sorties')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (!error) setSorties(data || []);
  };

  const handleRejoindre = async (sortieId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('participations').insert({
      sortie_id: sortieId,
      user_id: user.id,
    });

    if (error) {
      Alert.alert('Erreur', 'Tu as peut-être déjà rejoint cette sortie.');
    } else {
      Alert.alert('Super ! 🎉', 'Tu as rejoint la sortie !');
      setSelectedRide(null);
    }
  };

  const filtered = activeFilter === 'all'
    ? sorties
    : sorties.filter(s => s.sport === activeFilter);

  return (
    <View style={styles.container}>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 45.7490,
          longitude: 4.8350,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        onPress={() => setSelectedRide(null)}
      >
        {filtered.map(ride => (
          <Marker
            key={ride.id}
            coordinate={{ latitude: ride.latitude, longitude: ride.longitude }}
            onPress={() => setSelectedRide(ride)}
          >
            <View style={[styles.marker, { backgroundColor: SPORT_COLORS[ride.sport] }]}>
              <Text style={styles.markerEmoji}>{SPORT_EMOJIS[ride.sport]}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {SPORTS_FILTERS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, activeFilter === s.id && styles.chipActive]}
              onPress={() => setActiveFilter(s.id)}
            >
              <Text style={[styles.chipText, activeFilter === s.id && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedRide && (
        <View style={styles.rideCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRide(null)}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: SPORT_COLORS[selectedRide.sport] + '20' }]}>
              <Text style={{ fontSize: 22 }}>{SPORT_EMOJIS[selectedRide.sport]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{selectedRide.titre}</Text>
              <Text style={styles.cardSport}>{selectedRide.sport.charAt(0).toUpperCase() + selectedRide.sport.slice(1)}</Text>
            </View>
          </View>
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Distance</Text>
              <Text style={styles.cardStatVal}>{selectedRide.distance} km</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Dénivelé</Text>
              <Text style={styles.cardStatVal}>{selectedRide.elevation} m</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Allure</Text>
              <Text style={styles.cardStatVal}>{selectedRide.allure}</Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>📍 {selectedRide.lieu}  ·  📅 {selectedRide.date_sortie} à {selectedRide.heure}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.going}>Max {selectedRide.participants_max} participants</Text>
            <TouchableOpacity style={styles.joinBtn} onPress={() => handleRejoindre(selectedRide.id)}>
              <Text style={styles.joinText}>Rejoindre</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  filtersContainer: {
    position: 'absolute', top: 56, left: 0, right: 0,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF',
    backgroundColor: 'rgba(255,255,255,0.97)',
  },
  chipActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#8888bb' },
  chipTextActive: { color: '#fff' },
  marker: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: { fontSize: 20 },
  rideCard: {
    position: 'absolute', bottom: 16, left: 12, right: 12,
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#DDD8FF',
    shadowColor: '#5B52F0', shadowOpacity: 0.1, shadowRadius: 12,
    elevation: 6,
  },
  closeBtn: {
    position: 'absolute', top: 10, right: 12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, color: '#5B52F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  cardSport: { fontSize: 12, color: '#8888bb', marginTop: 1 },
  cardStats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  cardStat: {},
  cardStatLabel: { fontSize: 11, color: '#8888bb' },
  cardStatVal: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  cardMeta: { fontSize: 12, color: '#8888bb', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  going: { fontSize: 12, color: '#8888bb' },
  joinBtn: { backgroundColor: '#5B52F0', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  joinText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});