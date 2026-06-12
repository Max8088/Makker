import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import FiltersSheet, { Filters, defaultFilters } from './FiltersSheet';
import RideDetailScreen from './RideDetailScreen';

const SPORTS_FILTERS = [
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

const isVelo = (sport: string) => sport === 'route' || sport === 'vtt';

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const slashParts = dateStr.split('/');
  if (slashParts.length === 3) {
    return new Date(`${slashParts[2]}-${slashParts[1].padStart(2, '0')}-${slashParts[0].padStart(2, '0')}`);
  }
  return new Date(dateStr);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type Sortie = {
  id: string; titre: string; sport: string; distance: string;
  elevation: string; allure: string; lieu: string; lieu_rencontre: string;
  date_sortie: string; heure: string; participants_max: number;
  latitude: number; longitude: number;
  niveau: string; description: string; createur_id: string;
};

type UserLocation = { latitude: number; longitude: number; };

export default function MapScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [selectedRide, setSelectedRide] = useState<Sortie | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showDetail, setShowDetail] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => { fetchSorties(); }, []);

  useFocusEffect(
    React.useCallback(() => {
      getUserLocation();
      fetchSorties();
    }, [])
  );

  const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Active la localisation pour voir les sorties près de toi.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
    setUserLocation(coords);
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.15, longitudeDelta: 0.15 }, 800);
  };

  const fetchSorties = async () => {
    const { data, error } = await supabase
      .from('sorties').select('*')
      .not('latitude', 'is', null).not('longitude', 'is', null);
    if (!error) setSorties(data || []);
  };

  const handleRejoindre = async (sortieId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('participations').insert({ sortie_id: sortieId, user_id: user.id });
    if (error) { Alert.alert('Erreur', 'Tu as peut-être déjà rejoint cette sortie.'); }
    else { Alert.alert('Super ! 🎉', 'Tu as rejoint la sortie !'); setSelectedRide(null); }
  };

  const centerOnUser = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 }, 600);
    } else { getUserLocation(); }
  };

  const activeFiltersCount = [
    filters.sport !== 'all', filters.niveau !== 'all',
    filters.date !== 'all', filters.creneau !== 'all',
    filters.distanceMax < 200, filters.deniveleMax < 3000,
    filters.placesDisponibles,
  ].filter(Boolean).length;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const filtered = sorties.filter(ride => {
    // Filtre sorties passées
    const dateRide = parseDate(ride.date_sortie); dateRide.setHours(0, 0, 0, 0);
    if (dateRide < today) return false;

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
  });

  if (showDetail && selectedRide) return (
    <RideDetailScreen
      sortie={selectedRide as any}
      onBack={() => { setShowDetail(false); setSelectedRide(null); }}
    />
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{ latitude: 45.7490, longitude: 4.8350, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
        onPress={() => setSelectedRide(null)}
        showsUserLocation={false}
      >
        {userLocation && (
          <>
            <Circle center={userLocation} radius={300} fillColor="rgba(91,82,240,0.15)" strokeColor="rgba(91,82,240,0.3)" strokeWidth={1} />
            <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.userDot}><View style={styles.userDotInner} /></View>
            </Marker>
          </>
        )}

        {filtered.map(ride => (
          <Marker
            key={ride.id}
            coordinate={{ latitude: ride.latitude, longitude: ride.longitude }}
            onPress={(e) => { e.stopPropagation(); setSelectedRide(ride); }}
            tracksViewChanges={false}
            tappable={true}
          >
            <View style={[styles.marker, { backgroundColor: SPORT_COLORS[ride.sport] }]} pointerEvents="none">
              <Text style={styles.markerEmoji}>{SPORT_EMOJIS[ride.sport]}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Chips filtre sport */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {SPORTS_FILTERS.map(s => {
            const isActive = activeFilter === s.id;
            const color = s.id !== 'all' ? SPORT_COLORS[s.id] : '#5B52F0';
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, isActive && { backgroundColor: color, borderColor: color }]}
                onPress={() => setActiveFilter(s.id)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]} onPress={() => setShowFilters(true)}>
        <Text style={[styles.filterBtnText, activeFiltersCount > 0 && styles.filterBtnTextActive]}>
          ⚡{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
        <Text style={styles.locateBtnText}>📍</Text>
      </TouchableOpacity>

      {/* Popup sortie sélectionnée */}
      {selectedRide && (
        <View style={[styles.rideCard, { borderColor: SPORT_COLORS[selectedRide.sport] + '30' }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRide(null)}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Barre colorée top */}
          <View style={[styles.rideCardAccent, { backgroundColor: SPORT_COLORS[selectedRide.sport] }]} />

          <View style={styles.rideCardInner}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: SPORT_BG[selectedRide.sport] }]}>
                <Text style={{ fontSize: 20 }}>{SPORT_EMOJIS[selectedRide.sport]}</Text>
              </View>
              <View style={{ flex: 1, paddingRight: 44 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{capitalize(selectedRide.titre)}</Text>
                <Text style={[styles.cardSport, { color: SPORT_COLORS[selectedRide.sport] }]}>
                  {SPORT_LABELS[selectedRide.sport]}
                </Text>
              </View>
            </View>

            <View style={styles.cardStats}>
              <View style={styles.cardStat}>
                <Text style={styles.cardStatLabel}>Distance</Text>
                <Text style={[styles.cardStatVal, { color: SPORT_COLORS[selectedRide.sport] }]}>{selectedRide.distance} km</Text>
              </View>
              <View style={styles.cardStat}>
                <Text style={styles.cardStatLabel}>Dénivelé</Text>
                <Text style={[styles.cardStatVal, { color: SPORT_COLORS[selectedRide.sport] }]}>{selectedRide.elevation} m</Text>
              </View>
              <View style={styles.cardStat}>
                <Text style={styles.cardStatLabel}>{isVelo(selectedRide.sport) ? 'Vitesse' : 'Allure'}</Text>
                <Text style={[styles.cardStatVal, { color: SPORT_COLORS[selectedRide.sport] }]}>
                  {selectedRide.allure ? `${selectedRide.allure} ${isVelo(selectedRide.sport) ? 'km/h' : '/km'}` : '—'}
                </Text>
              </View>
            </View>

            <Text style={styles.cardMeta}>📍 {selectedRide.lieu}  ·  📅 {selectedRide.date_sortie} à {selectedRide.heure}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.going}>👥 Max {selectedRide.participants_max}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.detailBtn} onPress={() => setShowDetail(true)}>
                  <Text style={styles.detailText}>Détails</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.joinBtn, { backgroundColor: SPORT_COLORS[selectedRide.sport] }]} onPress={() => handleRejoindre(selectedRide.id)}>
                  <Text style={styles.joinText}>Rejoindre</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      <FiltersSheet visible={showFilters} filters={filters} onApply={setFilters} onClose={() => setShowFilters(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  filtersContainer: { position: 'absolute', top: 56, left: 0, right: 0, paddingVertical: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: 'rgba(255,255,255,0.97)' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  userDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(91,82,240,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  userDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B52F0' },
  marker: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  markerEmoji: { fontSize: 20 },
  locateBtn: { position: 'absolute', bottom: 30, right: 16, width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD8FF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  locateBtnText: { fontSize: 20 },
  filterBtn: { position: 'absolute', top: 100, left: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: 'rgba(255,255,255,0.97)' },
  filterBtnActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#8888bb' },
  filterBtnTextActive: { color: '#fff' },
  // ─── Popup carte ───────────────────────────────────────────────────────────
  rideCard: {
    position: 'absolute', bottom: 16, left: 12, right: 12,
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1,
    shadowColor: '#5B52F0', shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
    overflow: 'hidden',
  },
  rideCardAccent: { height: 4, width: '100%' },
  rideCardInner: { padding: 14 },
  closeBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  closeBtnText: { fontSize: 13, color: '#5B52F0', fontWeight: '700' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  cardSport: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  cardStats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  cardStat: {},
  cardStatLabel: { fontSize: 10, color: '#8888bb' },
  cardStatVal: { fontSize: 13, fontWeight: '700', marginTop: 1 },
  cardMeta: { fontSize: 12, color: '#8888bb', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  going: { fontSize: 12, color: '#8888bb' },
  detailBtn: { backgroundColor: '#EEEDFE', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14 },
  detailText: { color: '#5B52F0', fontWeight: '600', fontSize: 12 },
  joinBtn: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 16 },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});