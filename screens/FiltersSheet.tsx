import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Animated, PanResponder
} from 'react-native';

const SPORTS = [
  { id: 'all', label: 'Tous' },
  { id: 'route', label: '🚴 Route' },
  { id: 'vtt', label: '🚵 VTT' },
  { id: 'trail', label: '🏔️ Trail' },
  { id: 'running', label: '🏃 Running' },
];

const NIVEAUX = [
  { id: 'all', label: 'Tous' },
  { id: 'facile', label: 'Facile', color: '#22c55e' },
  { id: 'intermediaire', label: 'Intermédiaire', color: '#f59f00' },
  { id: 'difficile', label: 'Difficile', color: '#e05c3a' },
];

const DATES = [
  { id: 'all', label: 'Toutes' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette semaine' },
  { id: 'weekend', label: 'Ce weekend' },
];

const CRENEAUX = [
  { id: 'all', label: 'Tous' },
  { id: 'matin', label: '🌅 Matin' },
  { id: 'aprem', label: '☀️ Après-midi' },
  { id: 'soir', label: '🌆 Soir' },
  { id: 'weekend', label: '📅 Weekend' },
];

export type Filters = {
  sport: string;
  niveau: string;
  date: string;
  creneau: string;
  distanceMax: number;
  deniveleMax: number;
  placesDisponibles: boolean;
};

export const defaultFilters: Filters = {
  sport: 'all',
  niveau: 'all',
  date: 'all',
  creneau: 'all',
  distanceMax: 200,
  deniveleMax: 3000,
  placesDisponibles: false,
};

type Props = {
  visible: boolean;
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
};

export default function FiltersSheet({ visible, filters, onApply, onClose }: Props) {
  const [local, setLocal] = useState<Filters>(filters);
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10 && Math.abs(g.dx) < 30,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const update = (key: keyof Filters, value: any) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(defaultFilters);
  };

  const activeCount = [
    local.sport !== 'all',
    local.niveau !== 'all',
    local.date !== 'all',
    local.creneau !== 'all',
    local.distanceMax < 200,
    local.deniveleMax < 3000,
    local.placesDisponibles,
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}
  {...panResponder.panHandlers}
>
  {/* Handle */}
  <View style={styles.handle} />

  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.title}>Filtres</Text>
    <TouchableOpacity onPress={handleReset}>
      <Text style={styles.resetText}>Réinitialiser</Text>
    </TouchableOpacity>
  </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 24, paddingBottom: 20 }}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sport</Text>
            <View style={styles.chipsWrap}>
              {SPORTS.map(s => (
                <TouchableOpacity key={s.id} style={[styles.chip, local.sport === s.id && styles.chipActive]} onPress={() => update('sport', s.id)}>
                  <Text style={[styles.chipText, local.sport === s.id && styles.chipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Niveau</Text>
            <View style={styles.chipsWrap}>
              {NIVEAUX.map(n => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.chip, local.niveau === n.id && styles.chipActive, local.niveau === n.id && n.color ? { backgroundColor: n.color, borderColor: n.color } : {}]}
                  onPress={() => update('niveau', n.id)}
                >
                  <Text style={[styles.chipText, local.niveau === n.id && styles.chipTextActive]}>{n.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sectionTitle}>Distance max</Text>
              <Text style={styles.sliderVal}>{local.distanceMax >= 200 ? '200+ km' : `${local.distanceMax} km`}</Text>
            </View>
            <View style={styles.sliderTrack}>
              {[10, 20, 30, 50, 75, 100, 150, 200].map(val => (
                <TouchableOpacity key={val} style={[styles.sliderStep, local.distanceMax >= val && styles.sliderStepActive]} onPress={() => update('distanceMax', val)} />
              ))}
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>10 km</Text>
              <Text style={styles.sliderLabel}>200+ km</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sectionTitle}>Dénivelé max</Text>
              <Text style={styles.sliderVal}>{local.deniveleMax >= 3000 ? '3000+ m' : `${local.deniveleMax} m`}</Text>
            </View>
            <View style={styles.sliderTrack}>
              {[100, 300, 500, 800, 1200, 1800, 2500, 3000].map(val => (
                <TouchableOpacity key={val} style={[styles.sliderStep, local.deniveleMax >= val && styles.sliderStepActive]} onPress={() => update('deniveleMax', val)} />
              ))}
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>100 m</Text>
              <Text style={styles.sliderLabel}>3000+ m</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <View style={styles.chipsWrap}>
              {DATES.map(d => (
                <TouchableOpacity key={d.id} style={[styles.chip, local.date === d.id && styles.chipActive]} onPress={() => update('date', d.id)}>
                  <Text style={[styles.chipText, local.date === d.id && styles.chipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Créneau</Text>
            <View style={styles.chipsWrap}>
              {CRENEAUX.map(c => (
                <TouchableOpacity key={c.id} style={[styles.chip, local.creneau === c.id && styles.chipActive]} onPress={() => update('creneau', c.id)}>
                  <Text style={[styles.chipText, local.creneau === c.id && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Autres</Text>
            <TouchableOpacity style={styles.toggleRow} onPress={() => update('placesDisponibles', !local.placesDisponibles)}>
              <View>
                <Text style={styles.toggleLabel}>Places disponibles uniquement</Text>
                <Text style={styles.toggleSub}>Masquer les sorties complètes</Text>
              </View>
              <View style={[styles.toggle, local.placesDisponibles && styles.toggleActive]}>
                <View style={[styles.toggleThumb, local.placesDisponibles && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>

        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyText}>
            Appliquer{activeCount > 0 ? ` (${activeCount} filtre${activeCount > 1 ? 's' : ''})` : ''}
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, maxHeight: '85%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD8FF', alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  resetText: { fontSize: 13, color: '#8888bb', fontWeight: '500' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#F4F3FF' },
  chipActive: { backgroundColor: '#5B52F0', borderColor: '#5B52F0' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#8888bb' },
  chipTextActive: { color: '#fff' },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderVal: { fontSize: 13, fontWeight: '700', color: '#5B52F0' },
  sliderTrack: { flexDirection: 'row', gap: 4 },
  sliderStep: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#EEEDFE' },
  sliderStepActive: { backgroundColor: '#5B52F0' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 10, color: '#8888bb' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4F3FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#DDD8FF' },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  toggleSub: { fontSize: 11, color: '#8888bb', marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#DDD8FF', justifyContent: 'center', padding: 2 },
  toggleActive: { backgroundColor: '#5B52F0' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  applyBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 },
  applyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});