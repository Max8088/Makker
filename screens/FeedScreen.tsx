import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Image
} from 'react-native';
import { supabase } from '../lib/supabase';
import FiltersSheet, { Filters, defaultFilters } from './FiltersSheet';
import RideDetailScreen from './RideDetailScreen';

const SPORTS = [
  { id: 'all', label: 'Tous' },
  { id: 'route', label: 'Route' },
  { id: 'vtt', label: 'VTT' },
  { id: 'trail', label: 'Trail' },
  { id: 'running', label: 'Running' },
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
const SPORT_LABELS: { [key: string]: string } = {
  route: 'Cyclisme Route', vtt: 'VTT', trail: 'Trail', running: 'Running',
};
const NIVEAU_CONFIG: { [key: string]: { color: string; bg: string; label: string } } = {
  facile:        { color: '#2D6A4F', bg: '#F0FDF4', label: 'Facile' },
  intermediaire: { color: '#D97706', bg: '#FFFBEB', label: 'Intermédiaire' },
  difficile:     { color: '#610230', bg: '#FFF1F2', label: 'Difficile' },
};

const GENRE_LABELS: { [key: string]: string } = {
  mixte: '🤝 Mixte',
  femmes: '👩 Femmes',
  hommes: '👨 Hommes',
};

const isVelo = (sport: string) => sport === 'route' || sport === 'vtt';

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

type Sortie = {
  id: string; titre: string; sport: string; distance: string;
  elevation: string; allure: string; lieu: string; lieu_rencontre: string;
  date_sortie: string; heure: string; participants_max: number;
  niveau: string; description: string; createur_id: string; created_at: string;
  genre_requis?: string;
};

const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const p = dateStr.split('/');
  if (p.length === 3) return new Date(`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`);
  return new Date(dateStr);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function RideCard({
  ride, onDetail, onJoin, hasJoined,
}: {
  ride: Sortie; onDetail: () => void; onJoin: () => void; hasJoined: boolean;
}) {
  const color = SPORT_COLORS[ride.sport] || '#5B52F0';
  const bg = SPORT_BG[ride.sport] || '#EEEDFE';
  const niveau = NIVEAU_CONFIG[ride.niveau];
  const paceUnit = isVelo(ride.sport) ? 'km/h' : '/km';
  const paceDisplay = ride.allure ? `${ride.allure} ${paceUnit}` : '—';
  const dateObj = parseDate(ride.date_sortie);
  const dateLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const genreLabel = ride.genre_requis && ride.genre_requis !== 'mixte'
    ? GENRE_LABELS[ride.genre_requis]
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onDetail} activeOpacity={0.92}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={[styles.sportIcon, { backgroundColor: bg }]}>
            <Text style={styles.sportEmoji}>{SPORT_EMOJIS[ride.sport]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{capitalize(ride.titre)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.cardSportLabel, { color }]}>{SPORT_LABELS[ride.sport]}</Text>
              {genreLabel && (
                <Text style={styles.genreTag}>{genreLabel}</Text>
              )}
            </View>
          </View>
          {niveau && (
            <View style={[styles.niveauBadge, { backgroundColor: niveau.bg, borderColor: niveau.color + '40' }]}>
              <Text style={[styles.niveauText, { color: niveau.color }]}>{niveau.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderColor: color + '25', backgroundColor: color + '08' }]}>
            <Text style={styles.statIcon}>📏</Text>
            <Text style={[styles.statVal, { color }]}>{ride.distance} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={[styles.statBox, { borderColor: color + '25', backgroundColor: color + '08' }]}>
            <Text style={styles.statIcon}>⛰️</Text>
            <Text style={[styles.statVal, { color }]}>{ride.elevation || '—'} m</Text>
            <Text style={styles.statLabel}>Dénivelé</Text>
          </View>
          <View style={[styles.statBox, { borderColor: color + '25', backgroundColor: color + '08' }]}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={[styles.statVal, { color }]}>{paceDisplay}</Text>
            <Text style={styles.statLabel}>{isVelo(ride.sport) ? 'Vitesse' : 'Allure'}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{dateLabel} · {ride.heure}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText} numberOfLines={1}>{ride.lieu}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.participantsInfo}>
            <Text style={styles.participantsIcon}>👥</Text>
            <Text style={styles.participantsText}>Max {ride.participants_max}</Text>
          </View>
          {hasJoined ? (
            <View style={[styles.joinedBadge, { backgroundColor: bg, borderColor: color + '40' }]}>
              <Text style={[styles.joinedBadgeText, { color }]}>✓ Inscrit</Text>
            </View>
          ) : (
            <TouchableOpacity style={[styles.joinBtn, { backgroundColor: color }]} onPress={onJoin} activeOpacity={0.85}>
              <Text style={styles.joinText}>Rejoindre</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedRide, setSelectedRide] = useState<Sortie | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [userGenre, setUserGenre] = useState<string>('non_precise');

  const fetchSorties = async () => {
    const { data, error } = await supabase.from('sorties').select('*').order('created_at', { ascending: false });
    if (!error) setSorties(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchJoined = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('participations').select('sortie_id').eq('user_id', user.id);
    if (data) setJoinedIds(new Set(data.map(p => p.sortie_id)));
  };

  // Récupère le genre de l'utilisateur pour filtrer les sorties incompatibles
  const fetchUserGenre = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('genre').eq('id', user.id).single();
    if (data?.genre) setUserGenre(data.genre);
  };

  useEffect(() => { fetchSorties(); fetchJoined(); fetchUserGenre(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchSorties(); fetchJoined(); };

  const handleRejoindre = async (sortieId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('participations').insert({ sortie_id: sortieId, user_id: user.id });
    if (error) {
      Alert.alert('Erreur', 'Tu as peut-être déjà rejoint cette sortie.');
    } else {
      setJoinedIds(prev => new Set([...prev, sortieId]));
      Alert.alert('Super ! 🎉', 'Tu as rejoint la sortie !');
    }
  };

  const activeFiltersCount = [
    filters.sport !== 'all', filters.niveau !== 'all',
    filters.date !== 'all', filters.creneau !== 'all',
    filters.distanceMax < 200, filters.deniveleMax < 3000,
    filters.placesDisponibles, filters.genre !== 'all',
  ].filter(Boolean).length;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const filtered = sorties.filter(ride => {
    const dateRide = parseDate(ride.date_sortie); dateRide.setHours(0, 0, 0, 0);
    if (dateRide < today) return false;

    if (activeFilter !== 'all' && ride.sport !== activeFilter) return false;
    if (filters.sport !== 'all' && ride.sport !== filters.sport) return false;
    if (filters.niveau !== 'all' && ride.niveau !== filters.niveau) return false;
    if (filters.distanceMax < 200 && parseFloat(ride.distance) > filters.distanceMax) return false;
    if (filters.deniveleMax < 3000 && parseFloat(ride.elevation) > filters.deniveleMax) return false;

    // Filtre genre : masque les sorties incompatibles avec le genre de l'utilisateur
    // Ex: une utilisatrice (femme) ne voit pas les sorties "hommes uniquement"
    if (ride.genre_requis && ride.genre_requis !== 'mixte') {
      if (userGenre !== 'non_precise' && ride.genre_requis !== userGenre + 's' && ride.genre_requis !== userGenre) {
        // Remap: genre profil "homme" → genre_requis "hommes", "femme" → "femmes"
        const genreRequisNormalized = ride.genre_requis === 'hommes' ? 'homme' : 'femme';
        if (userGenre !== 'non_precise' && userGenre !== genreRequisNormalized) return false;
      }
    }

    // Filtre genre depuis le FiltersSheet (choix explicite de l'utilisateur)
    if (filters.genre !== 'all' && ride.genre_requis !== filters.genre) return false;

    if (filters.creneau !== 'all') {
      const heure = parseInt(ride.heure?.split(':')[0] || '0');
      const dateRideCreneau = parseDate(ride.date_sortie);
      const jour = dateRideCreneau.getDay();
      const estWeekend = jour === 0 || jour === 6;
      if (filters.creneau === 'matin' && (heure < 6 || heure >= 12)) return false;
      if (filters.creneau === 'aprem' && (heure < 12 || heure >= 18)) return false;
      if (filters.creneau === 'soir' && (heure < 18 || heure >= 23)) return false;
      if (filters.creneau === 'weekend' && !estWeekend) return false;
    }
    if (filters.date !== 'all') {
      const dr = parseDate(ride.date_sortie); dr.setHours(0, 0, 0, 0);
      const jour = dr.getDay();
      if (filters.date === 'today' && !isSameDay(dr, today)) return false;
      if (filters.date === 'week') {
        const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + 7); endOfWeek.setHours(23, 59, 59, 999);
        if (dr < today || dr > endOfWeek) return false;
      }
      if (filters.date === 'weekend') {
        const daysUntilWeekend = new Date(today); daysUntilWeekend.setDate(today.getDate() + 14);
        if (jour !== 0 && jour !== 6) return false;
        if (dr < today || dr > daysUntilWeekend) return false;
      }
    }
    return true;
  }).sort((a, b) => {
    // Tri chronologique : la sortie la plus proche en premier
    const da = parseDate(a.date_sortie).getTime();
    const db = parseDate(b.date_sortie).getTime();
    return da - db;
  });

  if (selectedRide) return (
    <RideDetailScreen sortie={selectedRide} onBack={() => { setSelectedRide(null); fetchJoined(); }} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titleMain}>Makker</Text>
          <Text style={styles.subtitle}>Trouve ta prochaine aventure</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Image source={require('../assets/icons/filtre_icon.png')} style={{ width: 42, height: 42 }} resizeMode="contain" />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
      >
        {SPORTS.map(s => {
          const isActive = activeFilter === s.id;
          const color = s.id !== 'all' ? SPORT_COLORS[s.id] : '#5B52F0';
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, isActive && { backgroundColor: color, borderColor: color }]}
              onPress={() => setActiveFilter(s.id)}
            >
              {s.id !== 'all' && <Text style={styles.chipEmoji}>{SPORT_EMOJIS[s.id]}</Text>}
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!loading && (
        <Text style={styles.sortiesCount}>
          {filtered.length > 0
            ? `${filtered.length} sortie${filtered.length > 1 ? 's' : ''} à venir`
            : 'Aucune sortie trouvée'}
        </Text>
      )}

      {loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Chargement...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>Aucune sortie à venir</Text>
          <Text style={styles.emptySub}>Essaie d'ajuster tes filtres ou crée la tienne !</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.feed}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B52F0" />}
        >
          {filtered.map(ride => (
            <RideCard
              key={ride.id}
              ride={ride}
              hasJoined={joinedIds.has(ride.id)}
              onDetail={() => setSelectedRide(ride)}
              onJoin={() => handleRejoindre(ride.id)}
            />
          ))}
        </ScrollView>
      )}

      <FiltersSheet visible={showFilters} filters={filters} onApply={setFilters} onClose={() => setShowFilters(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  titleMain: { fontSize: 30, fontWeight: '900', color: '#1a1a2e', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#8888bb', marginTop: 1 },
  filterBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  filterBtnActive: { backgroundColor: '#EEEDFE' },
  filterBadge: { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#610230', alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  filtersRow: { maxHeight: 44, marginBottom: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  sortiesCount: { fontSize: 12, fontWeight: '600', color: '#8888bb', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  feed: { flex: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#8888bb' },
  emptySub: { fontSize: 13, color: '#bbbbdd', textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E8E6FF',
    marginBottom: 4, flexDirection: 'row', alignSelf: 'stretch', overflow: 'hidden',
    shadowColor: '#5B52F0', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
  },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 12, paddingTop: 11, paddingBottom: 11 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sportIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sportEmoji: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', letterSpacing: 0.1 },
  cardSportLabel: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  genreTag: { fontSize: 10, fontWeight: '600', color: '#8888bb', backgroundColor: '#F4F3FF', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  niveauBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  niveauText: { fontSize: 10, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  statBox: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 4, alignItems: 'center', gap: 1 },
  statIcon: { fontSize: 11 },
  statVal: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  statLabel: { fontSize: 10, color: '#8888bb', fontWeight: '500', marginTop: 0 },
  metaRow: { gap: 2, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 12, color: '#8888bb', flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  participantsInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  participantsIcon: { fontSize: 14 },
  participantsText: { fontSize: 12, color: '#8888bb', fontWeight: '500' },
  joinBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  joinedBadge: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1 },
  joinedBadgeText: { fontWeight: '700', fontSize: 12 },
});