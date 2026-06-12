import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import SwipeBack from '../components/SwipeBack';

const SPORT_COLORS: { [key: string]: string } = {
  route: '#4F46E5', vtt: '#F59F00', trail: '#2D6A4F', running: '#610230',
};
const SPORT_BG: { [key: string]: string } = {
  route: '#EEF2FF', vtt: '#FFFBEB', trail: '#F0FDF4', running: '#F9F0F4',
};
const SPORT_EMOJIS: { [key: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃',
};
const SPORT_LABELS: { [key: string]: string } = {
  route: 'Cyclisme Route', vtt: 'VTT', trail: 'Trail', running: 'Running',
};
const NIVEAU_CONFIG: { [key: string]: { color: string; bg: string } } = {
  facile:        { color: '#2D6A4F', bg: '#F0FDF4' },
  intermediaire: { color: '#D97706', bg: '#FFFBEB' },
  difficile:     { color: '#610230', bg: '#F9F0F4' },
};

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

type Profile = {
  id: string; prenom: string; nom: string; ville: string;
  sport_principal: string; niveau: string; avatar_url?: string;
};
type Sortie = {
  id: string; titre: string; sport: string; distance: string; elevation: string; date_sortie: string;
};
type Props = { userId: string; onBack: () => void; };

export default function PublicProfileScreen({ userId, onBack }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); fetchSorties(); }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
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

  const sportKey = profile?.sport_principal || 'route';
  const mainColor = SPORT_COLORS[sportKey] || '#5B52F0';
  const mainBg = SPORT_BG[sportKey] || '#EEEDFE';
  const niveauConf = NIVEAU_CONFIG[profile?.niveau || 'intermediaire'];

  // Stats calculées
  const kmTotal = sorties.reduce((acc, s) => acc + (parseFloat(s.distance) || 0), 0);
  const kmTotalLabel = kmTotal > 0 ? `${Math.round(kmTotal)} km` : '—';

  if (loading) return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingWrap}><Text style={styles.loadingText}>Chargement...</Text></View>
      </View>
    </SwipeBack>
  );

  return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

          {/* ─── Carte profil ──────────────────────────────────────────── */}
          <View style={[styles.profileCard, { borderColor: mainColor + '25' }]}>
            <View style={[styles.profileCardAccent, { backgroundColor: mainColor }]} />
            <View style={styles.profileCardInner}>
              <View style={[styles.avatarWrap, { borderColor: mainColor + '40', backgroundColor: mainBg }]}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarText, { color: mainColor }]}>{initiales}</Text>
                )}
              </View>
              <Text style={styles.profileName}>{profile?.prenom} {profile?.nom}</Text>
              <Text style={styles.locationText}>📍 {profile?.ville}</Text>

              <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: mainBg, borderColor: mainColor + '40' }]}>
                  <Text style={styles.badgeEmoji}>{SPORT_EMOJIS[sportKey]}</Text>
                  <Text style={[styles.badgeText, { color: mainColor }]}>{SPORT_LABELS[sportKey]}</Text>
                </View>
                {niveauConf && (
                  <View style={[styles.badge, { backgroundColor: niveauConf.bg, borderColor: niveauConf.color + '40' }]}>
                    <Text style={[styles.badgeText, { color: niveauConf.color }]}>📈 {profile?.niveau}</Text>
                  </View>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: mainColor }]}>{sorties.length}</Text>
                  <Text style={styles.statLabel}>Sorties</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: mainColor + '20' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: mainColor }]}>{kmTotalLabel}</Text>
                  <Text style={styles.statLabel}>km total</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: mainColor + '20' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: mainColor }]}>4.8 ⭐</Text>
                  <Text style={styles.statLabel}>Note</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ─── Zone géographique ────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zone géographique</Text>
            <View style={[styles.infoCard, { borderColor: mainColor + '20' }]}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: mainColor + '15' }]}>
                  <Text style={{ fontSize: 17 }}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoMain, { color: mainColor }]}>{profile?.ville || '—'} & alentours</Text>
                  <Text style={styles.infoSub}>Rayon de 50 km</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ─── Sorties organisées ───────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sorties organisées</Text>
            {sorties.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.emptyText}>Aucune sortie créée pour l'instant</Text>
              </View>
            ) : (
              sorties.map(ride => {
                const rColor = SPORT_COLORS[ride.sport] || '#5B52F0';
                const rBg = SPORT_BG[ride.sport] || '#EEEDFE';
                return (
                  <View key={ride.id} style={[styles.rideItem, { borderColor: rColor + '25' }]}>
                    <View style={[styles.rideAccent, { backgroundColor: rColor }]} />
                    <View style={[styles.rideIcon, { backgroundColor: rBg }]}>
                      <Text style={{ fontSize: 18 }}>{SPORT_EMOJIS[ride.sport]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rideName} numberOfLines={1}>{capitalize(ride.titre)}</Text>
                      <Text style={styles.rideDate}>{ride.date_sortie}</Text>
                      <View style={styles.rideStatsRow}>
                        <Text style={[styles.rideStat, { color: rColor }]}>📏 {ride.distance} km</Text>
                        <Text style={[styles.rideStat, { color: rColor }]}>⛰️ {ride.elevation} m</Text>
                      </View>
                    </View>
                  </View>
                );
              })
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

  // ─── Carte profil ──────────────────────────────────────────────────────────
  profileCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 18,
    borderWidth: 1, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#5B52F0', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
  },
  profileCardAccent: { height: 4, width: '100%' },
  profileCardInner: { padding: 20, alignItems: 'center' },
  avatarWrap: { width: 80, height: 80, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  avatarImg: { width: 80, height: 80, borderRadius: 24 },
  avatarText: { fontSize: 28, fontWeight: '800' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  locationText: { fontSize: 13, color: '#8888bb', marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeEmoji: { fontSize: 13 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 20 },
  statItem: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#8888bb' },
  statDivider: { width: 1, height: 30 },

  // ─── Sections ──────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E6FF' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoMain: { fontSize: 14, fontWeight: '700' },
  infoSub: { fontSize: 12, color: '#8888bb', marginTop: 2 },
  emptyText: { fontSize: 13, color: '#8888bb', textAlign: 'center' },

  // ─── Ride items ────────────────────────────────────────────────────────────
  rideItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1,
    marginBottom: 8, overflow: 'hidden',
    shadowColor: '#5B52F0', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  rideAccent: { width: 4, alignSelf: 'stretch' },
  rideIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginVertical: 12 },
  rideName: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', paddingLeft: 10, paddingRight: 10, paddingTop: 12, marginBottom: 2 },
  rideDate: { fontSize: 11, color: '#8888bb', paddingLeft: 10 },
  rideStatsRow: { flexDirection: 'row', gap: 10, paddingLeft: 10, paddingBottom: 12, paddingTop: 4 },
  rideStat: { fontSize: 12, fontWeight: '600' },
});