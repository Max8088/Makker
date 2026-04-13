import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import FiltersSheet, { Filters, defaultFilters } from './FiltersSheet';

const SPORTS_FILTERS = [
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
  id: string;
  titre: string;
  sport: string;
  distance: string;
  elevation: string;
  allure: string;
  lieu: string;
  date_sortie: string;
  heure: string;
  participants_max: number;
  latitude: number;
  longitude: number;
  niveau: string;
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [selectedRide, setSelectedRide] = useState<Sortie | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchSorties();
  }, []);

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
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setUserLocation(coords);
    mapRef.current?.animateToRegion({
      ...coords,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    }, 800);
  };

  const fetchSorties = async () => {
    const { data, error } = await supabase
      .from('sorties')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    if (!error) setSorties(data || []);
  };

  const handleRejoindre = async (sortieId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('participations').insert({
      sortie_id: sortieId,
      user_id: user.id,
    });
    if (error) {
      Alert.alert('Erreur', 'Tu as peut-être déjà rejoint cette sortie.');
    } else {
      Alert.alert('Super ! 🎉', 'Tu as rejoint la sortie !');
      setSelectedRide(null);
    }
  };

  const centerOnUser = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 600);
    } else {
      getUserLocation();
    }
  };

  const activeFiltersCount = [
    filters.sport !== 'all',
    filters.niveau !== 'all',
    filters.date !== 'all',
    filters.creneau !== 'all',
    filters.distanceMax < 200,
    filters.deniveleMax < 3000,
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateRide = parseDate(ride.date_sortie);
      dateRide.setHours(0, 0, 0, 0);
      const jour = dateRide.getDay();

      if (filters.date === 'today') {
        if (!isSameDay(dateRide, today)) return false;
      }
      if (filters.date === 'week') {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);
        if (dateRide < today || dateRide > endOfWeek) return false;
      }
      if (filters.date === 'weekend') {
        const daysUntilWeekend = new Date(today);
        daysUntilWeekend.setDate(today.getDate() + 14);
        if (jour !== 0 && jour !== 6) return false;
        if (dateRide < today || dateRide > daysUntilWeekend) return false;
      }
    }

    return true;
  });

  return (
    <View style={styles.container}>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 45.7490,
          longitude: 4.8350,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        onPress={() => setSelectedRide(null)}
        showsUserLocation={false}
      >
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={300}
              fillColor="rgba(91,82,240,0.15)"
              strokeColor="rgba(91,82,240,0.3)"
              strokeWidth={1}
            />
            <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.userDot}>
                <View style={styles.userDotInner} />
              </View>
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

      {/* Filtres sports */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {SPORTS_FILTERS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, activeFilter === s.id && styles.chipActive]}
              onPress={() => setActiveFilter(s.id)}
            >
              <Text style={[styles.chipText, activeFilter === s.id && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bouton filtres avancés */}
      <TouchableOpacity
        style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
        onPress={() => setShowFilters(true)}
      >
        <Text style={[styles.filterBtnText, activeFiltersCount > 0 && styles.filterBtnTextActive]}>
          ⚡{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
        </Text>
      </TouchableOpacity>

      {/* Bouton centrer */}
      <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
        <Text style={styles.locateBtnText}>📍</Text>
      </TouchableOpacity>

      {selectedRide && (
        <View style={styles.rideCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRide(null)}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: SPORT_COLORS[selectedRide.sport] + '20' }]}>
              <Text style={{ fontSize: 22 }}>{SPORT_EMOJIS[selectedRide.sport]}</Text>
            </View>
            <View style={{ flex: 1, paddingRight: 50 }}>
              <Text style={styles.cardTitle}>{selectedRide.titre}</Text>
              <Text style={styles.cardSport}>{selectedRide.sport.charAt(0).toUpperCase() + selectedRide.sport.slice(1)}</Text>
            </View>
          </View>
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Distance</Text>
              <Text style={styles.cardStatVal}>{selectedRide.distance} km</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Dénivelé</Text>
              <Text style={styles.cardStatVal}>{selectedRide.elevation} m</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>Allure</Text>
              <Text style={styles.cardStatVal}>{selectedRide.allure}</Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>📍 {selectedRide.lieu}  ·  📅 {selectedRide.date_sortie} à {selectedRide.heure}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.going}>Max {selectedRide.participants_max} participants</Text>
            <TouchableOpacity style={styles.joinBtn} onPress={() => handleRejoindre(selectedRide.id)}>
              <Text style={styles.joinText}>Rejoindre</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  container: { flex: 1 },
  map: { flex: 1 },
  filtersContainer: {
    position: 'absolute', top: 56, left: 0, right: 0,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF',
    backgroundColor: 'rgba(255,255,255,0.97)',
  },
  chipActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#8888bb' },
  chipTextActive: { color: '#fff' },
  userDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(91,82,240,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  userDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B52F0' },
  marker: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  markerEmoji: { fontSize: 20 },
  locateBtn: {
    position: 'absolute', bottom: 30, right: 16,
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#DDD8FF',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  locateBtnText: { fontSize: 20 },
  filterBtn: {
    position: 'absolute', top: 100, left: 16,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: '#DDD8FF',
    backgroundColor: 'rgba(255,255,255,0.97)',
  },
  filterBtnActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#8888bb' },
  filterBtnTextActive: { color: '#fff' },
  rideCard: {
    position: 'absolute', bottom: 16, left: 12, right: 12,
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#DDD8FF',
    shadowColor: '#5B52F0', shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  closeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 54, height: 54, borderRadius: 32,
    backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: '#5B52F0', fontWeight: '600' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  cardSport: { fontSize: 12, color: '#8888bb', marginTop: 1 },
  cardStats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  cardStat: {},
  cardStatLabel: { fontSize: 11, color: '#8888bb' },
  cardStatVal: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  cardMeta: { fontSize: 12, color: '#8888bb', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  going: { fontSize: 12, color: '#8888bb' },
  joinBtn: { backgroundColor: '#5B52F0', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  joinText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});