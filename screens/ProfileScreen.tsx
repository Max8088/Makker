import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const SPORTS = [
  { id: 'route', label: 'Route', emoji: '🚴' },
  { id: 'vtt', label: 'VTT', emoji: '🚵' },
  { id: 'trail', label: 'Trail', emoji: '🏔️' },
  { id: 'running', label: 'Running', emoji: '🏃' },
];

const CRENEAUX = [
  { id: 'matin', label: '🌅 Matin' },
  { id: 'midi', label: '☀️ Midi' },
  { id: 'soir', label: '🌆 Soir' },
  { id: 'weekend', label: '📅 Weekend' },
];

const PAST_RIDES = [
  { id: 1, title: 'Sortie Croix-Rousse', sport: 'route', emoji: '🚴', date: '8 Avr', distance: '52km', elevation: '780m' },
  { id: 2, title: 'Trail Monts du Lyonnais', sport: 'trail', emoji: '🏔️', date: '5 Avr', distance: '18km', elevation: '950m' },
  { id: 3, title: 'VTT Pilat', sport: 'vtt', emoji: '🚵', date: '2 Avr', distance: '35km', elevation: '1100m' },
  { id: 4, title: 'Running Tête d\'Or', sport: 'running', emoji: '🏃', date: '30 Mar', distance: '10km', elevation: '60m' },
];

const SPORT_COLORS: { [key: string]: string } = {
  route: '#2196f3', vtt: '#f59f00', trail: '#1bdf8a', running: '#9c27b0'
};

const TABS = ['Statistiques', 'Sorties', 'Infos'];

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Statistiques');
  const [sportPrincipal, setSportPrincipal] = useState('route');
  const [sportsSecondaires, setSportsSecondaires] = useState<string[]>(['trail']);
  const [creneaux, setCreneaux] = useState<string[]>(['matin', 'weekend']);

  const toggleSecondaire = (id: string) => {
    if (id === sportPrincipal) return;
    setSportsSecondaires(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleCreneau = (id: string) => {
    setCreneaux(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Profil</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

        {/* CARTE PROFIL */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AM</Text>
            </View>
          </View>
          <Text style={styles.profileName}>Alex Morgan</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>📍 Lyon, France</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>📈 Niveau Intermédiaire</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>✏️ Modifier le profil</Text>
          </TouchableOpacity>
          <View style={styles.followRow}>
            <View style={styles.followItem}>
              <Text style={styles.followVal}>234</Text>
              <Text style={styles.followLabel}>Abonnés</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followVal}>189</Text>
              <Text style={styles.followLabel}>Abonnements</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followVal}>4.8 ⭐</Text>
              <Text style={styles.followLabel}>Note</Text>
            </View>
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TAB STATISTIQUES */}
        {activeTab === 'Statistiques' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Global</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}><Text style={styles.statVal}>127</Text><Text style={styles.statLabel}>Sorties</Text></View>
              <View style={styles.statCard}><Text style={styles.statVal}>3 450</Text><Text style={styles.statLabel}>km total</Text></View>
              <View style={styles.statCard}><Text style={styles.statVal}>42 500</Text><Text style={styles.statLabel}>m D+</Text></View>
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Ce mois-ci</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: '#1bdf8a' }]}><Text style={[styles.statVal, { color: '#1bdf8a' }]}>8</Text><Text style={styles.statLabel}>Sorties</Text></View>
              <View style={[styles.statCard, { borderColor: '#1bdf8a' }]}><Text style={[styles.statVal, { color: '#1bdf8a' }]}>312</Text><Text style={styles.statLabel}>km</Text></View>
              <View style={[styles.statCard, { borderColor: '#1bdf8a' }]}><Text style={[styles.statVal, { color: '#1bdf8a' }]}>4 200</Text><Text style={styles.statLabel}>m D+</Text></View>
            </View>
          </View>
        )}

        {/* TAB SORTIES */}
        {activeTab === 'Sorties' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dernières sorties</Text>
            {PAST_RIDES.map(ride => (
              <View key={ride.id} style={styles.rideItem}>
                <View style={[styles.rideIcon, { backgroundColor: SPORT_COLORS[ride.sport] + '20' }]}>
                  <Text style={{ fontSize: 20 }}>{ride.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rideName}>{ride.title}</Text>
                  <Text style={styles.rideDate}>{ride.date}</Text>
                  <View style={styles.rideStats}>
                    <Text style={styles.rideStat}>{ride.distance}</Text>
                    <Text style={styles.rideStat}>↗ {ride.elevation}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB INFOS */}
        {activeTab === 'Infos' && (
          <View style={styles.section}>

            {/* Sport principal */}
            <Text style={styles.sectionTitle}>Sport principal</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sportBtn, sportPrincipal === s.id && { borderColor: SPORT_COLORS[s.id], backgroundColor: SPORT_COLORS[s.id] + '15' }]}
                  onPress={() => setSportPrincipal(s.id)}
                >
                  <Text style={styles.sportEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sportLabel, sportPrincipal === s.id && { color: SPORT_COLORS[s.id], fontWeight: '600' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sports secondaires */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Sports secondaires</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.sportBtn,
                    s.id === sportPrincipal && { opacity: 0.3 },
                    sportsSecondaires.includes(s.id) && { borderColor: SPORT_COLORS[s.id], backgroundColor: SPORT_COLORS[s.id] + '15' }
                  ]}
                  onPress={() => toggleSecondaire(s.id)}
                  disabled={s.id === sportPrincipal}
                >
                  <Text style={styles.sportEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sportLabel, sportsSecondaires.includes(s.id) && { color: SPORT_COLORS[s.id], fontWeight: '600' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Zone géographique */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Zone géographique</Text>
            <View style={styles.zoneCard}>
              <Text style={styles.zoneEmoji}>📍</Text>
              <View>
                <Text style={styles.zoneName}>Lyon </Text>
                <Text style={styles.zoneRadius}>Rayon de 50 km</Text>
              </View>
            </View>

            {/* Créneaux préférés */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Créneaux préférés</Text>
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
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa', paddingTop: 56 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#0d0d0d' },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eaecf0', alignItems: 'center', justifyContent: 'center' },
  profileCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#eaecf0', marginBottom: 12 },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#1bdf8a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#0d0d0d', marginBottom: 4 },
  locationRow: { marginBottom: 8 },
  locationText: { fontSize: 13, color: '#888' },
  levelBadge: { backgroundColor: '#f0fdf7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#b6f0d5', marginBottom: 12 },
  levelText: { fontSize: 12, fontWeight: '600', color: '#0a9e60' },
  editBtn: { borderWidth: 1.5, borderColor: '#e0e2e8', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 7, marginBottom: 16 },
  editBtnText: { fontSize: 13, fontWeight: '500', color: '#555' },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  followItem: { alignItems: 'center', gap: 2 },
  followVal: { fontSize: 16, fontWeight: '700', color: '#0d0d0d' },
  followLabel: { fontSize: 11, color: '#aaa' },
  followDivider: { width: 1, height: 30, backgroundColor: '#eaecf0' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1bdf8a' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#bbb' },
  tabTextActive: { color: '#1bdf8a', fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#0d0d0d', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#eaecf0' },
  statVal: { fontSize: 18, fontWeight: '700', color: '#0d0d0d' },
  statLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  rideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eaecf0' },
  rideIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rideName: { fontSize: 13, fontWeight: '600', color: '#0d0d0d' },
  rideDate: { fontSize: 11, color: '#aaa', marginTop: 1 },
  rideStats: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rideStat: { fontSize: 12, fontWeight: '600', color: '#555' },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#e8eaed', backgroundColor: '#fff' },
  sportEmoji: { fontSize: 20, marginBottom: 4 },
  sportLabel: { fontSize: 11, color: '#888' },
  zoneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eaecf0' },
  zoneEmoji: { fontSize: 24 },
  zoneName: { fontSize: 14, fontWeight: '600', color: '#0d0d0d' },
  zoneRadius: { fontSize: 12, color: '#aaa', marginTop: 2 },
  creneauxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  creneauBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#e8eaed', backgroundColor: '#fff' },
  creneauBtnActive: { backgroundColor: '#1bdf8a', borderColor: '#1bdf8a' },
  creneauText: { fontSize: 13, fontWeight: '500', color: '#555' },
  creneauTextActive: { color: '#fff' },
});