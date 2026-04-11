import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

const SPORTS_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'route', label: 'Route' },
  { id: 'vtt', label: 'VTT' },
  { id: 'trail', label: 'Trail' },
  { id: 'running', label: 'Running' },
];

const RIDES = [
  { id: 1, title: 'Sortie Croix-Rousse', sport: 'route', emoji: '🚴', distance: '52km', elevation: '780m', pace: '28km/h', going: 3, max: 8, latitude: 45.7676, longitude: 4.8344 },
  { id: 2, title: 'Trail Monts du Lyonnais', sport: 'trail', emoji: '🏔️', distance: '18km', elevation: '950m', pace: '7:00/km', going: 4, max: 6, latitude: 45.7200, longitude: 4.7500 },
  { id: 3, title: 'VTT Pilat', sport: 'vtt', emoji: '🚵', distance: '35km', elevation: '1100m', pace: '18km/h', going: 2, max: 6, latitude: 45.6900, longitude: 4.8900 },
  { id: 4, title: 'Running Tête d\'Or', sport: 'running', emoji: '🏃', distance: '10km', elevation: '60m', pace: '5:30/km', going: 5, max: 10, latitude: 45.7780, longitude: 4.8550 },
  { id: 5, title: 'Col de la Luère', sport: 'route', emoji: '🚴', distance: '68km', elevation: '1200m', pace: '25km/h', going: 6, max: 12, latitude: 45.7400, longitude: 4.7200 },
];

const SPORT_COLORS: { [key: string]: string } = {
  route: '#2196f3', vtt: '#f59f00', trail: '#1bdf8a', running: '#9c27b0'
};

export default function MapScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState<typeof RIDES[0] | null>(null);

  const filtered = activeFilter === 'all' ? RIDES : RIDES.filter(r => r.sport === activeFilter);

  return (
    <View style={styles.container}>

      {/* CARTE */}
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
              <Text style={styles.markerEmoji}>{ride.emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* FILTRES EN HAUT */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
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

      {/* CARTE SORTIE EN BAS */}
      {selectedRide && (
        <View style={styles.rideCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRide(null)}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: SPORT_COLORS[selectedRide.sport] + '20' }]}>
              <Text style={{ fontSize: 22 }}>{selectedRide.emoji}</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>{selectedRide.title}</Text>
              <Text style={styles.cardSport}>{selectedRide.sport.charAt(0).toUpperCase() + selectedRide.sport.slice(1)}</Text>
            </View>
          </View>
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Distance</Text>
              <Text style={styles.cardStatVal}>{selectedRide.distance}</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Dénivelé</Text>
              <Text style={styles.cardStatVal}>{selectedRide.elevation}</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Allure</Text>
              <Text style={styles.cardStatVal}>{selectedRide.pace}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.going}>{selectedRide.going}/{selectedRide.max} participants</Text>
            <TouchableOpacity style={styles.joinBtn}>
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
    borderRadius: 20, borderWidth: 1.5, borderColor: '#e0e2e8',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  chipActive: { backgroundColor: '#1bdf8a', borderColor: '#1bdf8a' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#555' },
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
    padding: 16, borderWidth: 1, borderColor: '#eaecf0',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12,
    elevation: 6,
  },
  closeBtn: {
    position: 'absolute', top: 10, right: 12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, color: '#888' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0d0d0d' },
  cardSport: { fontSize: 12, color: '#aaa', marginTop: 1 },
  cardStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  cardStat: {},
  cardStatLabel: { fontSize: 11, color: '#aaa' },
  cardStatVal: { fontSize: 13, fontWeight: '600', color: '#0d0d0d' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  going: { fontSize: 12, color: '#888' },
  joinBtn: { backgroundColor: '#1bdf8a', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  joinText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});