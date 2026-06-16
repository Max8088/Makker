import React, { useState, useEffect } from 'react';
import PublicProfileScreen from './PublicProfileScreen';
import EditRideScreen from './EditRideScreen';
import SwipeBack from '../components/SwipeBack';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

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
const NIVEAU_CONFIG: { [key: string]: { color: string; bg: string; label: string } } = {
  facile:        { color: '#2D6A4F', bg: '#F0FDF4', label: 'Facile' },
  intermediaire: { color: '#D97706', bg: '#FFFBEB', label: 'Intermédiaire' },
  difficile:     { color: '#610230', bg: '#F9F0F4', label: 'Difficile' },
};

const isVelo = (sport: string) => sport === 'route' || sport === 'vtt';

// ─── Point 3 : capitalize ─────────────────────────────────────────────────────
const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

type Sortie = {
  id: string; titre: string; sport: string; distance: string;
  elevation: string; allure: string; lieu: string; lieu_rencontre: string;
  date_sortie: string; heure: string; participants_max: number;
  niveau: string; description: string; createur_id: string;
  latitude?: number; longitude?: number;
};

type Profile = {
  id: string; prenom: string; nom: string; ville: string;
  niveau: string; sport_principal: string; avatar_url?: string;
};

type Props = { sortie: Sortie; onBack: () => void; };

function Avatar({ profile, size = 44, color = '#5B52F0' }: { profile: Profile; size?: number; color?: string }) {
  const initiales = `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase();
  const radius = size * 0.28;
  if (profile.avatar_url) {
    return <Image source={{ uri: profile.avatar_url }} style={{ width: size, height: size, borderRadius: radius }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: color + '30' }}>
      <Text style={{ fontSize: size * 0.32, fontWeight: '700', color }}>{initiales}</Text>
    </View>
  );
}

export default function RideDetailScreen({ sortie, onBack }: Props) {
  const [createur, setCreateur] = useState<Profile | null>(null);
  const [participantsList, setParticipantsList] = useState<Profile[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPublicProfile, setShowPublicProfile] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false);

  useEffect(() => { fetchCreateur(); fetchParticipants(); checkIfJoined(); }, []);

  const fetchCreateur = async () => {
    const { data } = await supabase.from('profiles').select('id, prenom, nom, ville, niveau, sport_principal, avatar_url').eq('id', sortie.createur_id).single();
    if (data) setCreateur(data);
  };

  const fetchParticipants = async () => {
    const { data: parts, count } = await supabase.from('participations').select('user_id', { count: 'exact' }).eq('sortie_id', sortie.id);
    setParticipantsCount(count || 0);
    if (parts && parts.length > 0) {
      const ids = parts.map(p => p.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, prenom, nom, avatar_url, ville, niveau, sport_principal').in('id', ids);
      setParticipantsList(profiles || []);
    }
  };

  const checkIfJoined = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);
    const { data } = await supabase.from('participations').select('id').eq('sortie_id', sortie.id).eq('user_id', user.id).single();
    if (data) setHasJoined(true);
  };

  const handleRejoindre = async () => {
    if (!currentUserId) return;
    setLoading(true);
    const { error } = await supabase.from('participations').insert({ sortie_id: sortie.id, user_id: currentUserId });
    setLoading(false);
    if (error) { Alert.alert('Erreur', 'Tu as peut-être déjà rejoint cette sortie.'); }
    else { setHasJoined(true); setParticipantsCount(prev => prev + 1); fetchParticipants(); Alert.alert('Super ! 🎉', 'Tu as rejoint la sortie !'); }
  };

  const handleDelete = () => {
    Alert.alert('Supprimer la sortie', 'Cette action est irréversible. Tu es sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await supabase.from('sorties').delete().eq('id', sortie.id);
        Alert.alert('Sortie supprimée ✅', ''); onBack();
      }},
    ]);
  };

  const isCreateur = currentUserId === sortie.createur_id;
  const color = SPORT_COLORS[sortie.sport] || '#5B52F0';
  const bg = SPORT_BG[sortie.sport] || '#EEEDFE';
  const niveau = NIVEAU_CONFIG[sortie.niveau];
  const paceLabel = isVelo(sortie.sport) ? 'Vitesse' : 'Allure';
  const paceUnit = isVelo(sortie.sport) ? 'km/h' : '/km';
  const paceDisplay = sortie.allure ? `${sortie.allure} ${paceUnit}` : '—';

  // ─── Point 5 : stats calculées depuis les sorties ────────────────────────
  // (préparé ici pour usage futur — les vraies stats viennent de ProfileScreen)

  if (showEdit) return <EditRideScreen sortie={sortie} onBack={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onBack(); }} />;
  if (showPublicProfile) return <PublicProfileScreen userId={showPublicProfile} onBack={() => setShowPublicProfile(null)} />;

  return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détail de la sortie</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 110 }} scrollEnabled={!isMapInteracting}>

          <View style={[styles.mainCard, { borderColor: color + '30' }]}>
            <View style={[styles.mainCardAccent, { backgroundColor: color }]} />
            <View style={styles.mainCardInner}>
              <View style={styles.sportRow}>
                <View style={[styles.sportIcon, { backgroundColor: bg }]}>
                  <Text style={{ fontSize: 26 }}>{SPORT_EMOJIS[sortie.sport]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {/* Point 3 : capitalize */}
                  <Text style={styles.titre}>{capitalize(sortie.titre)}</Text>
                  <Text style={[styles.sportLabel, { color }]}>{SPORT_LABELS[sortie.sport]}</Text>
                </View>
                {niveau && (
                  <View style={[styles.niveauBadge, { backgroundColor: niveau.bg, borderColor: niveau.color + '40' }]}>
                    <Text style={[styles.niveauText, { color: niveau.color }]}>{niveau.label}</Text>
                  </View>
                )}
              </View>
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: color + '08', borderColor: color + '25' }]}>
                  <Text style={styles.statIcon}>📏</Text>
                  <Text style={[styles.statVal, { color }]}>{sortie.distance} km</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: color + '08', borderColor: color + '25' }]}>
                  <Text style={styles.statIcon}>⛰️</Text>
                  <Text style={[styles.statVal, { color }]}>{sortie.elevation || '—'} m</Text>
                  <Text style={styles.statLabel}>Dénivelé</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: color + '08', borderColor: color + '25' }]}>
                  <Text style={styles.statIcon}>⚡</Text>
                  <Text style={[styles.statVal, styles.statValSmall, { color }]}>{paceDisplay}</Text>
                  <Text style={styles.statLabel}>{paceLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: color + '15' }]}>
                  <Text style={styles.infoIconEmoji}>📅</Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>Date & Heure</Text>
                  <Text style={styles.infoVal}>{sortie.date_sortie} à {sortie.heure}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: color + '15' }]}>
                  <Text style={styles.infoIconEmoji}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Point de départ</Text>
                  <Text style={styles.infoVal}>{sortie.lieu_rencontre || sortie.lieu}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: color + '15' }]}>
                  <Text style={styles.infoIconEmoji}>👥</Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>Participants</Text>
                  <Text style={styles.infoVal}>{participantsCount}/{sortie.participants_max} inscrits</Text>
                </View>
              </View>
            </View>
          </View>

          {sortie.latitude && sortie.longitude && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Point de rendez-vous</Text>
              <View style={[styles.mapCard, { borderColor: color + '30' }]}>
                <MapView
                  style={styles.miniMap}
                  initialRegion={{ latitude: sortie.latitude, longitude: sortie.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  onTouchStart={() => setIsMapInteracting(true)}
                  onTouchEnd={() => setIsMapInteracting(false)}
                  onTouchCancel={() => setIsMapInteracting(false)}
                >
                  <Marker coordinate={{ latitude: sortie.latitude, longitude: sortie.longitude }} pinColor={color} />
                </MapView>
                <View style={[styles.mapFooter, { backgroundColor: bg }]}>
                  <Text style={styles.mapFooterIcon}>📍</Text>
                  <Text style={[styles.mapFooterText, { color }]} numberOfLines={1}>
                    {sortie.lieu_rencontre || sortie.lieu}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {sortie.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.infoCard}>
                <Text style={styles.descriptionText}>{sortie.description}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parcours</Text>
            <View style={[styles.infoCard, styles.gpxCard]}>
              <Text style={styles.gpxEmoji}>🗺️</Text>
              <Text style={styles.gpxTitle}>Fichier GPX</Text>
              <Text style={styles.gpxSub}>Disponible prochainement</Text>
            </View>
          </View>

          {createur && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organisateur</Text>
              <TouchableOpacity style={styles.infoCard} onPress={() => setShowPublicProfile(sortie.createur_id)} activeOpacity={0.8}>
                <View style={styles.personRow}>
                  <Avatar profile={createur} size={44} color={color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{createur.prenom} {createur.nom}</Text>
                    <Text style={styles.personSub}>📍 {createur.ville}</Text>
                  </View>
                  <Text style={[styles.chevron, { color }]}>›</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participants ({participantsCount}/{sortie.participants_max})</Text>
            <View style={styles.infoCard}>
              {participantsList.length === 0 ? (
                <View style={styles.emptyParticipantsWrap}>
                  <Text style={styles.emptyParticipantsEmoji}>🏃</Text>
                  <Text style={styles.emptyParticipants}>Aucun participant pour l'instant.</Text>
                </View>
              ) : (
                participantsList.map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 && <View style={styles.infoDivider} />}
                    <TouchableOpacity style={styles.personRow} onPress={() => setShowPublicProfile(p.id)} activeOpacity={0.8}>
                      <Avatar profile={p} size={40} color={color} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.personName}>{p.prenom} {p.nom}</Text>
                        <Text style={styles.personSub}>📍 {p.ville}</Text>
                      </View>
                      <Text style={[styles.chevron, { color }]}>›</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))
              )}
            </View>
          </View>

        </ScrollView>

        {!isCreateur && (
          <View style={styles.bottomBar}>
            {hasJoined ? (
              <View style={[styles.joinedBtn, { borderColor: color + '30', backgroundColor: bg }]}>
                <Text style={[styles.joinedText, { color }]}>✅ Tu as rejoint cette sortie</Text>
              </View>
            ) : (
              <TouchableOpacity style={[styles.joinBtn, { backgroundColor: color }, loading && { opacity: 0.7 }]} onPress={handleRejoindre} disabled={loading}>
                <Text style={styles.joinText}>{loading ? 'Inscription...' : 'Rejoindre la sortie'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isCreateur && (
          <View style={styles.bottomBar}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: bg, borderColor: color + '30' }]} onPress={() => setShowEdit(true)}>
                <Image source={require('../assets/icons/modifier_icon.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                <Text style={[styles.editBtnText, { color }]}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Image source={require('../assets/icons/supprimer_icon.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                <Text style={styles.deleteBtnText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  mainCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden', shadowColor: '#5B52F0', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  mainCardAccent: { height: 4, width: '100%' },
  mainCardInner: { padding: 16 },
  sportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sportIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titre: { fontSize: 17, fontWeight: '800', color: '#1a1a2e', letterSpacing: 0.1 },
  sportLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  niveauBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  niveauText: { fontSize: 11, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', gap: 2 },
  statIcon: { fontSize: 14 },
  statVal: { fontSize: 15, fontWeight: '800' },
  statValSmall: { fontSize: 13 },
  statLabel: { fontSize: 10, color: '#8888bb', fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E6FF' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoIconEmoji: { fontSize: 17 },
  infoLabel: { fontSize: 11, color: '#8888bb' },
  infoVal: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginTop: 2 },
  infoDivider: { height: 1, backgroundColor: '#F4F3FF', marginVertical: 12 },
  descriptionText: { fontSize: 14, color: '#1a1a2e', lineHeight: 22 },
  mapCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', shadowColor: '#5B52F0', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3 },
  miniMap: { height: 220, width: '100%' },
  mapFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14 },
  mapFooterIcon: { fontSize: 13 },
  mapFooterText: { fontSize: 12, fontWeight: '600', flex: 1 },
  gpxCard: { alignItems: 'center', gap: 6, paddingVertical: 22 },
  gpxEmoji: { fontSize: 30 },
  gpxTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  gpxSub: { fontSize: 12, color: '#8888bb' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  personSub: { fontSize: 12, color: '#8888bb', marginTop: 2 },
  chevron: { fontSize: 24 },
  emptyParticipantsWrap: { alignItems: 'center', paddingVertical: 12, gap: 6 },
  emptyParticipantsEmoji: { fontSize: 24 },
  emptyParticipants: { fontSize: 13, color: '#8888bb', textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E8E6FF' },
  joinBtn: { borderRadius: 14, padding: 15, alignItems: 'center' },
  joinText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  joinedBtn: { borderRadius: 14, padding: 15, alignItems: 'center', borderWidth: 1 },
  joinedText: { fontSize: 14, fontWeight: '600' },
  editBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1 },
  editBtnText: { fontSize: 14, fontWeight: '700' },
  deleteBtn: { flex: 1, backgroundColor: '#fff0f0', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ffdddd', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  deleteBtnText: { color: '#e05c3a', fontSize: 14, fontWeight: '700' },
});