import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import SettingsScreen from './SettingsScreen';

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
  route: '#4F46E5', vtt: '#F59F00', trail: '#2D6A4F', running: '#610230',
};
const SPORT_BG: { [key: string]: string } = {
  route: '#EEF2FF', vtt: '#FFFBEB', trail: '#F0FDF4', running: '#F9F0F4',
};
const SPORT_EMOJIS: { [key: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃',
};
const NIVEAU_CONFIG: { [key: string]: { color: string; bg: string } } = {
  facile:        { color: '#2D6A4F', bg: '#F0FDF4' },
  intermediaire: { color: '#D97706', bg: '#FFFBEB' },
  difficile:     { color: '#610230', bg: '#F9F0F4' },
};

const TABS = ['Statistiques', 'Sorties', 'Infos'];

// ─── Point 3 : capitalize ─────────────────────────────────────────────────────
const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

type Profile = {
  id: string; prenom: string; nom: string; ville: string;
  sport_principal: string; niveau: string; avatar_url?: string;
};
type Sortie = {
  id: string; titre: string; sport: string; distance: string; elevation: string; date_sortie: string;
};

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Statistiques');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [sportPrincipal, setSportPrincipal] = useState('route');
  const [sportsSecondaires, setSportsSecondaires] = useState<string[]>([]);
  const [creneaux, setCreneaux] = useState<string[]>(['matin', 'weekend']);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { fetchProfile(); fetchSorties(); }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) { setProfile(data); setSportPrincipal(data.sport_principal || 'route'); }
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
    const { error } = await supabase.from('profiles').update({ sport_principal: sportPrincipal }).eq('id', user.id);
    if (error) Alert.alert('Erreur', error.message);
    else Alert.alert('Profil mis à jour ! ✅', '');
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Tu es sûr de vouloir te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const toggleSecondaire = (id: string) => {
    if (id === sportPrincipal) return;
    setSportsSecondaires(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleCreneau = (id: string) => {
    setCreneaux(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  // ─── Point 6 : stats calculées depuis les sorties ────────────────────────
  const kmTotal = sorties.reduce((acc, s) => acc + (parseFloat(s.distance) || 0), 0);
  const deniveleTotal = sorties.reduce((acc, s) => acc + (parseFloat(s.elevation) || 0), 0);
  const kmTotalLabel = kmTotal > 0 ? `${Math.round(kmTotal)} km` : '—';
  const deniveleTotalLabel = deniveleTotal > 0 ? `${Math.round(deniveleTotal)} m` : '—';

  const initiales = profile ? `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase() : '?';
  const nomComplet = profile ? `${profile.prenom || ''} ${profile.nom || ''}`.trim() : 'Chargement...';
  const mainColor = SPORT_COLORS[sportPrincipal] || '#5B52F0';
  const mainBg = SPORT_BG[sportPrincipal] || '#EEEDFE';
  const niveauConf = NIVEAU_CONFIG[profile?.niveau || 'intermediaire'];

  if (showSettings) return (
    <SettingsScreen onBack={() => { setShowSettings(false); fetchProfile(); }} onLogout={handleLogout} />
  );

  return (
    <View style={styles.container}>

      {/* ─── Top bar ──────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Profil</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>↪ Déco</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ─── Profile card ─────────────────────────────────────────── */}
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
            <Text style={styles.profileName}>{nomComplet}</Text>
            <Text style={styles.locationText}>📍 {profile?.ville || 'Lyon, France'}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: mainBg, borderColor: mainColor + '40' }]}>
                <Text style={styles.badgeEmoji}>{SPORT_EMOJIS[sportPrincipal]}</Text>
                <Text style={[styles.badgeText, { color: mainColor }]}>{SPORTS.find(s => s.id === sportPrincipal)?.label}</Text>
              </View>
              {niveauConf && (
                <View style={[styles.badge, { backgroundColor: niveauConf.bg, borderColor: niveauConf.color + '40' }]}>
                  <Text style={[styles.badgeText, { color: niveauConf.color }]}>📈 {profile?.niveau || 'Intermédiaire'}</Text>
                </View>
              )}
            </View>
            {/* Stats rapides — point 6 : km total calculé */}
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
                <Text style={[styles.statVal, { color: mainColor }]}>{deniveleTotalLabel}</Text>
                <Text style={styles.statLabel}>m D+</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Tabs ─────────────────────────────────────────────────── */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && { borderBottomColor: mainColor }]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && { color: mainColor, fontWeight: '700' }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Onglet Statistiques ──────────────────────────────────── */}
        {activeTab === 'Statistiques' && (
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: mainColor + '25', backgroundColor: mainBg }]}>
                <Text style={styles.statCardIcon}>🏅</Text>
                <Text style={[styles.statCardVal, { color: mainColor }]}>{sorties.length}</Text>
                <Text style={styles.statCardLabel}>Sorties créées</Text>
              </View>
              <View style={[styles.statCard, { borderColor: mainColor + '25', backgroundColor: mainBg }]}>
                <Text style={styles.statCardIcon}>📏</Text>
                {/* Point 6 : vrai km total */}
                <Text style={[styles.statCardVal, { color: mainColor }]}>{kmTotalLabel}</Text>
                <Text style={styles.statCardLabel}>km total</Text>
              </View>
              <View style={[styles.statCard, { borderColor: mainColor + '25', backgroundColor: mainBg }]}>
                <Text style={styles.statCardIcon}>⛰️</Text>
                {/* Point 6 : vrai dénivelé total */}
                <Text style={[styles.statCardVal, { color: mainColor }]}>{deniveleTotalLabel}</Text>
                <Text style={styles.statCardLabel}>m D+</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Onglet Sorties ───────────────────────────────────────── */}
        {activeTab === 'Sorties' && (
          <View style={styles.section}>
            {sorties.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🚴</Text>
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
                      {/* Point 3 : capitalize */}
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
        )}

        {/* ─── Onglet Infos ─────────────────────────────────────────── */}
        {activeTab === 'Infos' && (
          <View style={styles.section}>

            <Text style={styles.sectionTitle}>Sport principal</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => {
                const isActive = sportPrincipal === s.id;
                const sc = SPORT_COLORS[s.id];
                const sb = SPORT_BG[s.id];
                return (
                  <TouchableOpacity key={s.id} style={[styles.sportBtn, isActive && { borderColor: sc, backgroundColor: sb }]} onPress={() => setSportPrincipal(s.id)}>
                    <Text style={styles.sportEmoji}>{s.emoji}</Text>
                    <Text style={[styles.sportLabel, isActive && { color: sc, fontWeight: '700' }]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Sports secondaires</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => {
                const isActive = sportsSecondaires.includes(s.id);
                const sc = SPORT_COLORS[s.id];
                const sb = SPORT_BG[s.id];
                return (
                  <TouchableOpacity key={s.id} style={[styles.sportBtn, s.id === sportPrincipal && { opacity: 0.3 }, isActive && { borderColor: sc, backgroundColor: sb }]} onPress={() => toggleSecondaire(s.id)} disabled={s.id === sportPrincipal}>
                    <Text style={styles.sportEmoji}>{s.emoji}</Text>
                    <Text style={[styles.sportLabel, isActive && { color: sc, fontWeight: '700' }]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Zone géographique</Text>
            <View style={[styles.zoneCard, { borderColor: mainColor + '25', backgroundColor: mainBg }]}>
              <Text style={styles.zoneEmoji}>📍</Text>
              <View>
                <Text style={[styles.zoneName, { color: mainColor }]}>{profile?.ville || 'Lyon'} & alentours</Text>
                <Text style={styles.zoneRadius}>Rayon de 50 km</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Créneaux préférés</Text>
            <View style={styles.creneauxGrid}>
              {CRENEAUX.map(c => {
                const isActive = creneaux.includes(c.id);
                return (
                  <TouchableOpacity key={c.id} style={[styles.creneauBtn, isActive && { backgroundColor: mainColor, borderColor: mainColor }]} onPress={() => toggleCreneau(c.id)}>
                    <Text style={[styles.creneauText, isActive && styles.creneauTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: mainColor }]} onPress={saveProfile}>
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: '#1a1a2e', letterSpacing: 0.5 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ffdddd' },
  logoutBtnText: { fontSize: 12, fontWeight: '600', color: '#e05c3a' },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD8FF', alignItems: 'center', justifyContent: 'center' },
  profileCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden', shadowColor: '#5B52F0', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  profileCardAccent: { height: 4, width: '100%' },
  profileCardInner: { padding: 20, alignItems: 'center' },
  avatarWrap: { width: 80, height: 80, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  avatarImg: { width: 80, height: 80, borderRadius: 24 },
  avatarText: { fontSize: 28, fontWeight: '800' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  locationText: { fontSize: 13, color: '#8888bb', marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeEmoji: { fontSize: 13 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%', justifyContent: 'center' },
  statItem: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#8888bb' },
  statDivider: { width: 1, height: 30 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8E6FF', marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#8888bb' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, gap: 4 },
  statCardIcon: { fontSize: 20 },
  statCardVal: { fontSize: 18, fontWeight: '800' },
  statCardLabel: { fontSize: 10, color: '#8888bb', fontWeight: '500', textAlign: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14, color: '#8888bb', fontWeight: '500' },
  rideItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden', shadowColor: '#5B52F0', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  rideAccent: { width: 4, alignSelf: 'stretch' },
  rideIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginVertical: 12 },
  rideName: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 2, paddingLeft: 10, paddingRight: 10, paddingTop: 12 },
  rideDate: { fontSize: 11, color: '#8888bb', paddingLeft: 10 },
  rideStatsRow: { flexDirection: 'row', gap: 10, paddingLeft: 10, paddingBottom: 12, paddingTop: 4 },
  rideStat: { fontSize: 12, fontWeight: '600' },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  sportEmoji: { fontSize: 20, marginBottom: 4 },
  sportLabel: { fontSize: 11, color: '#8888bb' },
  zoneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  zoneEmoji: { fontSize: 24 },
  zoneName: { fontSize: 14, fontWeight: '700' },
  zoneRadius: { fontSize: 12, color: '#8888bb', marginTop: 2 },
  creneauxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  creneauBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  creneauText: { fontSize: 13, fontWeight: '500', color: '#8888bb' },
  creneauTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});