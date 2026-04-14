import React, { useState, useEffect } from 'react';
import PublicProfileScreen from './PublicProfileScreen';
import EditRideScreen from './EditRideScreen';
import SwipeBack from '../components/SwipeBack';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image
} from 'react-native';
import { supabase } from '../lib/supabase';

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
  facile: '#22c55e', intermediaire: '#f59f00', difficile: '#e05c3a'
};

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
};

type Profile = {
  prenom: string;
  nom: string;
  ville: string;
  niveau: string;
  sport_principal: string;
  avatar_url?: string;
};

type Props = {
  sortie: Sortie;
  onBack: () => void;
};

export default function RideDetailScreen({ sortie, onBack }: Props) {
  const [createur, setCreateur] = useState<Profile | null>(null);
  const [participants, setParticipants] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetchCreateur();
    fetchParticipants();
    checkIfJoined();
  }, []);

  const fetchCreateur = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('prenom, nom, ville, niveau, sport_principal, avatar_url')
      .eq('id', sortie.createur_id)
      .single();
    if (data) setCreateur(data);
  };

  const fetchParticipants = async () => {
    const { count } = await supabase
      .from('participations')
      .select('*', { count: 'exact', head: true })
      .eq('sortie_id', sortie.id);
    setParticipants(count || 0);
  };

  const checkIfJoined = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);
    const { data } = await supabase
      .from('participations')
      .select('id')
      .eq('sortie_id', sortie.id)
      .eq('user_id', user.id)
      .single();
    if (data) setHasJoined(true);
  };

  const handleRejoindre = async () => {
    if (!currentUserId) return;
    setLoading(true);
    const { error } = await supabase.from('participations').insert({
      sortie_id: sortie.id,
      user_id: currentUserId,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', 'Tu as peut-être déjà rejoint cette sortie.');
    } else {
      setHasJoined(true);
      setParticipants(prev => prev + 1);
      Alert.alert('Super ! 🎉', 'Tu as rejoint la sortie !');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la sortie',
      'Cette action est irréversible. Tu es sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            await supabase.from('sorties').delete().eq('id', sortie.id);
            Alert.alert('Sortie supprimée ✅', '');
            onBack();
          }
        }
      ]
    );
  };

  const isCreateur = currentUserId === sortie.createur_id;
  const niveauColor = NIVEAU_COLORS[sortie.niveau] || '#8888bb';

  if (showEdit) return (
    <EditRideScreen
      sortie={sortie}
      onBack={() => setShowEdit(false)}
      onSaved={() => { setShowEdit(false); onBack(); }}
    />
  );

  if (showPublicProfile) return (
    <PublicProfileScreen
      userId={sortie.createur_id}
      onBack={() => setShowPublicProfile(false)}
    />
  );

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

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

          <View style={styles.mainCard}>
            <View style={styles.sportRow}>
              <View style={[styles.sportIcon, { backgroundColor: SPORT_COLORS[sortie.sport] + '20' }]}>
                <Text style={{ fontSize: 28 }}>{SPORT_EMOJIS[sortie.sport]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.titre}>{sortie.titre}</Text>
                <Text style={styles.sportLabel}>{SPORT_LABELS[sortie.sport]}</Text>
              </View>
              <View style={[styles.niveauBadge, { backgroundColor: niveauColor + '20', borderColor: niveauColor }]}>
                <Text style={[styles.niveauText, { color: niveauColor }]}>{sortie.niveau}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{sortie.distance} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{sortie.elevation} m</Text>
                <Text style={styles.statLabel}>Dénivelé</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{sortie.allure}</Text>
                <Text style={styles.statLabel}>Allure</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📅</Text>
                <View>
                  <Text style={styles.infoLabel}>Date & Heure</Text>
                  <Text style={styles.infoVal}>{sortie.date_sortie} à {sortie.heure}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <View>
                  <Text style={styles.infoLabel}>Point de départ</Text>
                  <Text style={styles.infoVal}>{sortie.lieu_rencontre || sortie.lieu}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>👥</Text>
                <View>
                  <Text style={styles.infoLabel}>Participants</Text>
                  <Text style={styles.infoVal}>{participants}/{sortie.participants_max} inscrits</Text>
                </View>
              </View>
            </View>
          </View>

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
              <TouchableOpacity style={styles.infoCard} onPress={() => setShowPublicProfile(true)}>
                <View style={styles.createurRow}>
                  {createur.avatar_url ? (
                    <Image source={{ uri: createur.avatar_url }} style={styles.createurAvatar} />
                  ) : (
                    <View style={styles.createurAvatar}>
                      <Text style={styles.createurInitials}>
                        {createur.prenom?.[0]}{createur.nom?.[0]}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.createurName}>{createur.prenom} {createur.nom}</Text>
                    <Text style={styles.createurVille}>📍 {createur.ville}</Text>
                  </View>
                  <Text style={{ fontSize: 20, color: '#8888bb' }}>›</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {!isCreateur && (
          <View style={styles.bottomBar}>
            {hasJoined ? (
              <View style={styles.joinedBtn}>
                <Text style={styles.joinedText}>✅ Tu as rejoint cette sortie</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.joinBtn, loading && { opacity: 0.7 }]}
                onPress={handleRejoindre}
                disabled={loading}
              >
                <Text style={styles.joinText}>
                  {loading ? 'Inscription...' : 'Rejoindre la sortie'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isCreateur && (
          <View style={styles.bottomBar}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
                <Text style={styles.editBtnText}>✏️ Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>🗑️ Supprimer</Text>
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
  mainCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#DDD8FF', marginBottom: 12 },
  sportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sportIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titre: { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  sportLabel: { fontSize: 13, color: '#8888bb', marginTop: 2 },
  niveauBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  niveauText: { fontSize: 11, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F3FF', borderRadius: 12, padding: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: 11, color: '#8888bb', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#DDD8FF' },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#DDD8FF' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: 11, color: '#8888bb' },
  infoVal: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginTop: 2 },
  infoDivider: { height: 1, backgroundColor: '#F4F3FF', marginVertical: 12 },
  descriptionText: { fontSize: 14, color: '#1a1a2e', lineHeight: 22 },
  gpxCard: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  gpxEmoji: { fontSize: 32 },
  gpxTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  gpxSub: { fontSize: 12, color: '#8888bb' },
  createurRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  createurAvatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#5B52F0', alignItems: 'center', justifyContent: 'center' },
  createurInitials: { fontSize: 16, fontWeight: '700', color: '#fff' },
  createurName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  createurVille: { fontSize: 12, color: '#8888bb', marginTop: 2 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#DDD8FF' },
  joinBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 15, alignItems: 'center' },
  joinText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  joinedBtn: { backgroundColor: '#F4F3FF', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#DDD8FF' },
  joinedText: { fontSize: 14, fontWeight: '600', color: '#8888bb' },
  editBtn: { flex: 1, backgroundColor: '#EEEDFE', borderRadius: 12, padding: 14, alignItems: 'center' },
  editBtnText: { color: '#5B52F0', fontSize: 14, fontWeight: '700' },
  deleteBtn: { flex: 1, backgroundColor: '#fff0f0', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ffdddd' },
  deleteBtnText: { color: '#e05c3a', fontSize: 14, fontWeight: '700' },
});