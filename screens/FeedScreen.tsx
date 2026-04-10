import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const SPORTS = [
    { id: 'all', label: 'Tous' },
    { id: 'route', label: 'Route' },
    { id: 'vtt', label: 'VTT' },
    { id: 'trail', label: 'Trail' },
    { id: 'running', label: 'Running' },
  ];

const RIDES = [
  { id: 1, title: 'Sortie Croix-Rousse', sport: 'route', sportLabel: '🚴 Cyclisme Route', distance: '52km', elevation: '780m', pace: '28km/h', location: 'Lyon 4e', date: '12 Avr à 07h00', going: 3, max: 8 },
  { id: 2, title: 'Trail Monts du Lyonnais', sport: 'trail', sportLabel: '🏔️ Trail', distance: '18km', elevation: '950m', pace: '7:00/km', location: 'Saint-Martin', date: '13 Avr à 08h00', going: 4, max: 6 },
  { id: 3, title: 'VTT Pilat', sport: 'vtt', sportLabel: '🚵 VTT', distance: '35km', elevation: '1100m', pace: '18km/h', location: 'Crêt de la Perdrix', date: '13 Avr à 09h00', going: 2, max: 6 },
  { id: 4, title: 'Running Parc de la Tête d\'Or', sport: 'running', sportLabel: '🏃 Running', distance: '10km', elevation: '60m', pace: '5:30/km', location: 'Lyon 6e', date: '14 Avr à 06h30', going: 5, max: 10 },
  { id: 5, title: 'Col de la Luère', sport: 'route', sportLabel: '🚴 Cyclisme Route', distance: '68km', elevation: '1200m', pace: '25km/h', location: 'Craponne', date: '15 Avr à 07h00', going: 6, max: 12 },
];

const SPORT_COLORS: { [key: string]: string } = {
  route: '#2196f3', vtt: '#f59f00', trail: '#1bdf8a', running: '#9c27b0'
};

export default function FeedScreen() {
  const [activeFilter, setActiveFilter] = React.useState('all');
  const filtered = activeFilter === 'all' ? RIDES : RIDES.filter(r => r.sport === activeFilter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Makker</Text>
        <Text style={styles.subtitle}>Trouve ta prochaine aventure</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>         
        {SPORTS.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, activeFilter === s.id && styles.chipActive]}
            onPress={() => setActiveFilter(s.id)}
          >
            <Text style={[styles.chipText, activeFilter === s.id && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.feed} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {filtered.map(ride => (
          <View key={ride.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.sportDot, { backgroundColor: SPORT_COLORS[ride.sport] + '20' }]}>
                <Text style={{ fontSize: 18 }}>{ride.sportLabel.split(' ')[0]}</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>{ride.title}</Text>
                <Text style={styles.cardSport}>{ride.sportLabel}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statLabel}>Distance</Text><Text style={styles.statVal}>{ride.distance}</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>Dénivelé</Text><Text style={styles.statVal}>{ride.elevation}</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>Allure</Text><Text style={styles.statVal}>{ride.pace}</Text></View>
            </View>
            <Text style={styles.meta}>📍 {ride.location}  ·  📅 {ride.date}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.going}>{ride.going}/{ride.max} participants</Text>
              <TouchableOpacity style={styles.joinBtn}>
                <Text style={styles.joinText}>Rejoindre</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

import React from 'react';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa', paddingTop: 56 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#0d0d0d' },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 2 },
  filtersRow: { maxHeight: 44, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#e0e2e8', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#1bdf8a', borderColor: '#1bdf8a' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#555' },
  chipTextActive: { color: '#fff' },
  feed: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eaecf0', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sportDot: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#0d0d0d' },
  cardSport: { fontSize: 12, color: '#aaa', marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  stat: {},
  statLabel: { fontSize: 11, color: '#aaa' },
  statVal: { fontSize: 13, fontWeight: '600', color: '#0d0d0d' },
  meta: { fontSize: 12, color: '#888', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  going: { fontSize: 12, color: '#888' },
  joinBtn: { backgroundColor: '#1bdf8a', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  joinText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});