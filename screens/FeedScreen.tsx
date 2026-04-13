import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
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
  route: '#4F46E5', vtt: '#f59f00', trail: '#5B52F0', running: '#A78BFA'
};

const SPORT_EMOJIS: { [key: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃'
};

const SPORT_LABELS: { [key: string]: string } = {
  route: 'Cyclisme Route', vtt: 'VTT', trail: 'Trail', running: 'Running'
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
  created_at: string;
};

const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const slashParts = dateStr.split('/');
  if (slashParts.length === 3) {
    return new Date(`${slashParts[2]}-${slashParts[1].padStart(2,'0')}-${slashParts[0].padStart(2,'0')}`);
  }
  return new Date(dateStr);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function FeedScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedRide, setSelectedRide] = useState<Sortie | null>(null);

  const fetchSorties = async () => {
    const { data, error } = await supabase
      .from('sorties')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); }
    else { setSorties(data || []); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchSorties(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchSorties(); };

  const handleRejoindre = async (sortieId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('participations').insert({ sortie_id: sortieId, user_id: user.id });
    if (error) { Alert.alert('Erreur', 'Tu as peut-être déjà rejoint cette sortie.'); }
    else { Alert.alert('Super ! 🎉', 'Tu as rejoint la sortie !'); }
  };

  const activeFiltersCount = [
    filters.sport !== 'all', filters.niveau !== 'all',
    filters.date !== 'all', filters.creneau !== 'all',
    filters.distanceMax < 200, filters.deniveleMax < 3000,
    filters.placesDisponibles,
  ].filter(Boolean).length;

  const filtered = sorties.filter(ride => {
    if (activeFilter !== 'all' && ride.sport !== activeFilter) return false;
    if (filters.sport !== 'all' && ride.sport !== filters.sport) return false;
    if (filters.niveau !== 'all' && ride.niveau !== filters.niveau) return false;
    if (filters.distanceMax < 200 && parseFloat(ride.distance) > filters.distanceMax) return false;
    if (filters.deniveleMax < 3000 && parseFloat(ride.elevation) > filters.deniveleMax) return false;

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
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dateRide = parseDate(ride.date_sortie); dateRide.setHours(0, 0, 0, 0);
      const jour = dateRide.getDay();
      if (filters.date === 'today' && !isSameDay(dateRide, today)) return false;
      if (filters.date === 'week') {
        const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + 7); endOfWeek.setHours(23, 59, 59, 999);
        if (dateRide < today || dateRide > endOfWeek) return false;
      }
      if (filters.date === 'weekend') {
        const daysUntilWeekend = new Date(today); daysUntilWeekend.setDate(today.getDate() + 14);
        if (jour !== 0 && jour !== 6) return false;
        if (dateRide < today || dateRide > daysUntilWeekend) return false;
      }
    }
    return true;
  });

  if (selectedRide) return (
    <RideDetailScreen
      sortie={selectedRide}
      onBack={() => setSelectedRide(null)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Makker</Text>
          <Text style={styles.subtitle}>Trouve ta prochaine aventure</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={[styles.filterBtnText, activeFiltersCount > 0 && styles.filterBtnTextActive]}>
            ⚡ Filtres{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
      >
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

      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Chargement des sorties...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Aucune sortie trouvée.</Text>
          <Text style={styles.loadingSub}>Essaie d'ajuster tes filtres 🎯</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.feed}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B52F0" />}
        >
          {filtered.map(ride => (
            <View key={ride.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.sportDot, { backgroundColor: SPORT_COLORS[ride.sport] + '18' }]}>
                  <Text style={{ fontSize: 18 }}>{SPORT_EMOJIS[ride.sport]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{ride.titre}</Text>
                  <Text style={styles.cardSport}>{SPORT_EMOJIS[ride.sport]} {SPORT_LABELS[ride.sport]}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}><Text style={styles.statLabel}>Distance</Text><Text style={styles.statVal}>{ride.distance} km</Text></View>
                <View style={styles.stat}><Text style={styles.statLabel}>Dénivelé</Text><Text style={styles.statVal}>{ride.elevation} m</Text></View>
                <View style={styles.stat}><Text style={styles.statLabel}>Allure</Text><Text style={styles.statVal}>{ride.allure}</Text></View>
              </View>
              <Text style={styles.meta}>📍 {ride.lieu}  ·  📅 {ride.date_sortie} à {ride.heure}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.going}>Max {ride.participants_max} participants</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.detailBtn} onPress={() => setSelectedRide(ride)}>
                    <Text style={styles.detailText}>Détails</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.joinBtn} onPress={() => handleRejoindre(ride.id)}>
                    <Text style={styles.joinText}>Rejoindre</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <FiltersSheet
        visible={showFilters}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilters(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: 1 },
  subtitle: { fontSize: 13, color: '#8888bb', marginTop: 2 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  filterBtnTextActive: { color: '#fff' },
  filtersRow: { maxHeight: 44, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#8888bb' },
  chipTextActive: { color: '#fff' },
  feed: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 15, fontWeight: '600', color: '#8888bb' },
  loadingSub: { fontSize: 13, color: '#bbbbdd' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#DDD8FF', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sportDot: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  cardSport: { fontSize: 12, color: '#8888bb', marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  stat: {},
  statLabel: { fontSize: 11, color: '#8888bb' },
  statVal: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  meta: { fontSize: 12, color: '#8888bb', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  going: { fontSize: 12, color: '#8888bb' },
  detailBtn: { backgroundColor: '#EEEDFE', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  detailText: { color: '#5B52F0', fontWeight: '600', fontSize: 13 },
  joinBtn: { backgroundColor: '#5B52F0', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  joinText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});