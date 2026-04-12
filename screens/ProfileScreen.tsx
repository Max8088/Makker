import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

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

const SPORT_COLORS: { [key: string]: string } = {
  route: '#4F46E5', vtt: '#f59f00', trail: '#5B52F0', running: '#A78BFA'
};

const SPORT_EMOJIS: { [key: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃'
};

const TABS = ['Statistiques', 'Sorties', 'Infos'];

type Profile = {
  id: string;
  prenom: string;
  nom: string;
  ville: string;
  sport_principal: string;
  niveau: string;
};

type Sortie = {
  id: string;
  titre: string;
  sport: string;
  distance: string;
  elevation: string;
  date_sortie: string;
};

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Statistiques');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [sportPrincipal, setSportPrincipal] = useState('route');
  const [sportsSecondaires, setSportsSecondaires] = useState<string[]>([]);
  const [creneaux, setCreneaux] = useState<string[]>(['matin', 'weekend']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchSorties();
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
      setProfile(data);
      setSportPrincipal(data.sport_principal || 'route');
    }
    setLoading(false);
  };

  const fetchSorties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('sorties')
      .select('id, titre, sport, distance, elevation, date_sortie')
      .eq('createur_id', user.id)
      .order('created_at', { ascending: false });

    setSorties(data || []);
  };

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ sport_principal: sportPrincipal })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Profil mis à jour ! ✅', '');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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

  const initiales = profile
    ? `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase()
    : '?';

  const nomComplet = profile
    ? `${profile.prenom || ''} ${profile.nom || ''}`.trim()
    : 'Chargement...';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Profil</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
          <Text style={{ fontSize: 16 }}>🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initiales}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{nomComplet}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>📍 {profile?.ville || 'Lyon, France'}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>📈 Niveau {profile?.niveau || 'Intermédiaire'}</Text>
          </View>
          <View style={styles.followRow}>
            <View style={styles.followItem}>
              <Text style={styles.followVal}>{sorties.length}</Text>
              <Text style={styles.followLabel}>Sorties</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followVal}>{SPORT_EMOJIS[sportPrincipal]}</Text>
              <Text style={styles.followLabel}>Sport principal</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followVal}>4.8 ⭐</Text>
              <Text style={styles.followLabel}>Note</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'Statistiques' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mes sorties créées</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{sorties.length}</Text>
                <Text style={styles.statLabel}>Sorties</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statVal}>—</Text>
                <Text style={styles.statLabel}>km total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statVal}>—</Text>
                <Text style={styles.statLabel}>m D+</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'Sorties' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mes sorties créées</Text>
            {sorties.length === 0 ? (
              <Text style={{ color: '#8888bb', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                Tu n'as pas encore créé de sortie 🚴
              </Text>
            ) : (
              sorties.map(ride => (
                <View key={ride.id} style={styles.rideItem}>
                  <View style={[styles.rideIcon, { backgroundColor: SPORT_COLORS[ride.sport] + '20' }]}>
                    <Text style={{ fontSize: 20 }}>{SPORT_EMOJIS[ride.sport]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rideName}>{ride.titre}</Text>
                    <Text style={styles.rideDate}>{ride.date_sortie}</Text>
                    <View style={styles.rideStats}>
                      <Text style={styles.rideStat}>{ride.distance} km</Text>
                      <Text style={styles.rideStat}>↗ {ride.elevation} m</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'Infos' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sport principal</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sportBtn, sportPrincipal === s.id && { borderColor: '#5B52F0', backgroundColor: '#EEEDFE' }]}
                  onPress={() => setSportPrincipal(s.id)}
                >
                  <Text style={styles.sportEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sportLabel, sportPrincipal === s.id && { color: '#5B52F0', fontWeight: '600' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Sports secondaires</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.sportBtn,
                    s.id === sportPrincipal && { opacity: 0.3 },
                    sportsSecondaires.includes(s.id) && { borderColor: '#5B52F0', backgroundColor: '#EEEDFE' }
                  ]}
                  onPress={() => toggleSecondaire(s.id)}
                  disabled={s.id === sportPrincipal}
                >
                  <Text style={styles.sportEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sportLabel, sportsSecondaires.includes(s.id) && { color: '#5B52F0', fontWeight: '600' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Zone géographique</Text>
            <View style={styles.zoneCard}>
              <Text style={styles.zoneEmoji}>📍</Text>
              <View>
                <Text style={styles.zoneName}>{profile?.ville || 'Lyon'} & alentours</Text>
                <Text style={styles.zoneRadius}>Rayon de 50 km</Text>
              </View>
            </View>

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

            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
            </TouchableOpacity>

          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: 1 },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD8FF', alignItems: 'center', justifyContent: 'center' },
  profileCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#DDD8FF', marginBottom: 12 },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#5B52F0', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  locationRow: { marginBottom: 8 },
  locationText: { fontSize: 13, color: '#8888bb' },
  levelBadge: { backgroundColor: '#EEEDFE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#DDD8FF', marginBottom: 12 },
  levelText: { fontSize: 12, fontWeight: '600', color: '#5B52F0' },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  followItem: { alignItems: 'center', gap: 2 },
  followVal: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  followLabel: { fontSize: 11, color: '#8888bb' },
  followDivider: { width: 1, height: 30, backgroundColor: '#DDD8FF' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#DDD8FF', marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#5B52F0' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#8888bb' },
  tabTextActive: { color: '#5B52F0', fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#DDD8FF' },
  statVal: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: 10, color: '#8888bb', marginTop: 2 },
  rideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#DDD8FF' },
  rideIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rideName: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  rideDate: { fontSize: 11, color: '#8888bb', marginTop: 1 },
  rideStats: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rideStat: { fontSize: 12, fontWeight: '600', color: '#5B52F0' },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  sportEmoji: { fontSize: 20, marginBottom: 4 },
  sportLabel: { fontSize: 11, color: '#8888bb' },
  zoneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#DDD8FF' },
  zoneEmoji: { fontSize: 24 },
  zoneName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  zoneRadius: { fontSize: 12, color: '#8888bb', marginTop: 2 },
  creneauxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  creneauBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  creneauBtnActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  creneauText: { fontSize: 13, fontWeight: '500', color: '#8888bb' },
  creneauTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});