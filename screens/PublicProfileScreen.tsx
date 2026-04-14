import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import SwipeBack from '../components/SwipeBack';

const SPORT_COLORS: { [key: string]: string } = {
  route: '#4F46E5', vtt: '#f59f00', trail: '#5B52F0', running: '#A78BFA'
};

const SPORT_EMOJIS: { [key: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃'
};

const SPORT_LABELS: { [key: string]: string } = {
  route: 'Cyclisme Route', vtt: 'VTT', trail: 'Trail', running: 'Running'
};

const NIVEAU_COLORS: { [key: string]: string } = {
  debutant: '#22c55e', intermediaire: '#f59f00', avance: '#e05c3a'
};

type Profile = {
  id: string;
  prenom: string;
  nom: string;
  ville: string;
  sport_principal: string;
  niveau: string;
  creneaux: string[];
  avatar_url?: string;
};

type Sortie = {
  id: string;
  titre: string;
  sport: string;
  distance: string;
  elevation: string;
  date_sortie: string;
};

type Props = {
  userId: string;
  onBack: () => void;
};

export default function PublicProfileScreen({ userId, onBack }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchSorties();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const fetchSorties = async () => {
    const { data } = await supabase
      .from('sorties')
      .select('id, titre, sport, distance, elevation, date_sortie')
      .eq('createur_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    setSorties(data || []);
  };

  const initiales = profile
    ? `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase()
    : '?';

  const niveauColor = NIVEAU_COLORS[profile?.niveau || ''] || '#8888bb';

  if (loading) return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    </SwipeBack>
  );

  return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

          <View style={styles.profileCard}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initiales}</Text>
              </View>
            )}
            <Text style={styles.profileName}>{profile?.prenom} {profile?.nom}</Text>
            <Text style={styles.profileVille}>📍 {profile?.ville}</Text>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: SPORT_COLORS[profile?.sport_principal || 'route'] + '20', borderColor: SPORT_COLORS[profile?.sport_principal || 'route'] }]}>
                <Text style={[styles.badgeText, { color: SPORT_COLORS[profile?.sport_principal || 'route'] }]}>
                  {SPORT_EMOJIS[profile?.sport_principal || 'route']} {SPORT_LABELS[profile?.sport_principal || 'route']}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: niveauColor + '20', borderColor: niveauColor }]}>
                <Text style={[styles.badgeText, { color: niveauColor }]}>
                  📈 {profile?.niveau || 'Intermédiaire'}
                </Text>
              </View>
            </View>
          </View>

          {profile?.creneaux && Array.isArray(profile.creneaux) && profile.creneaux.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Créneaux préférés</Text>
              <View style={styles.infoCard}>
                <View style={styles.creneauxWrap}>
                  {profile.creneaux.map(c => (
                    <View key={c} style={styles.creneauChip}>
                      <Text style={styles.creneauText}>
                        {c === 'matin' ? '🌅 Matin' :
                         c === 'aprem' ? '☀️ Après-midi' :
                         c === 'soir' ? '🌆 Soir' :
                         c === 'weekend' ? '📅 Weekend' : c}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sorties organisées</Text>
            {sorties.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.emptyText}>Aucune sortie créée pour l'instant</Text>
              </View>
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 15, color: '#8888bb' },
  profileCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#DDD8FF', marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#5B52F0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  profileVille: { fontSize: 13, color: '#8888bb', marginBottom: 14 },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#DDD8FF' },
  creneauxWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  creneauChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#EEEDFE', borderWidth: 1, borderColor: '#DDD8FF' },
  creneauText: { fontSize: 12, fontWeight: '500', color: '#5B52F0' },
  emptyText: { fontSize: 13, color: '#8888bb', textAlign: 'center' },
  rideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#DDD8FF' },
  rideIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rideName: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  rideDate: { fontSize: 11, color: '#8888bb', marginTop: 1 },
  rideStats: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rideStat: { fontSize: 12, fontWeight: '600', color: '#5B52F0' },
});