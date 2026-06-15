import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';

import { supabase } from '../lib/supabase';
import SwipeBack from '../components/SwipeBack';

const SPORT_COLORS: { [k: string]: string } = {
  route: '#4F46E5',
  vtt: '#F59F00',
  trail: '#2D6A4F',
  running: '#610230',
};

const SPORT_BG: { [k: string]: string } = {
  route: '#EEF2FF',
  vtt: '#FFFBEB',
  trail: '#F0FDF4',
  running: '#F9F0F4',
};

const SPORT_EMOJIS: { [k: string]: string } = {
  route: '🚴',
  vtt: '🚵',
  trail: '🏔️',
  running: '🏃',
};

const NIVEAU_CONFIG: { [k: string]: { color: string; bg: string } } = {
  facile: { color: '#2D6A4F', bg: '#F0FDF4' },
  intermediaire: { color: '#D97706', bg: '#FFFBEB' },
  difficile: { color: '#610230', bg: '#F9F0F4' },
};

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

type Sortie = {
  id: string;
  titre: string;
  sport: string;
  distance: string;
  elevation: string;
  date_sortie: string;
  lieu: string;
  participants_max: number;
  niveau: string;
  createur_id: string;
  created_at: string;
};

type Props = {
  onBack: () => void;
};

export default function AdminSortiesScreen({ onBack }: Props) {
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [filtered, setFiltered] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState('all');

  const SPORTS = ['all', 'route', 'vtt', 'trail', 'running'];

  useEffect(() => {
    fetchSorties();
  }, []);

  useEffect(() => {
    let result = sorties;

    if (filterSport !== 'all') {
      result = result.filter(s => s.sport === filterSport);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter(
        s =>
          s.titre?.toLowerCase().includes(q) ||
          s.lieu?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [search, filterSport, sorties]);

  const fetchSorties = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('sorties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch sorties error:', error);
      Alert.alert('Erreur', 'Impossible de charger les sorties.');
    }

    setSorties(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  const handleDelete = (sortie: Sortie) => {
    Alert.alert(
      'Supprimer la sortie',
      `Supprimer "${sortie.titre}" ? Cette action supprimera aussi les messages et participations liés à cette sortie.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Supprimer les messages de la conversation
              const { error: messagesError } = await supabase
                .from('messages')
                .delete()
                .eq('sortie_id', sortie.id);
  
              if (messagesError) throw messagesError;
  
              // 2. Supprimer les participations liées à cette sortie
              const { error: participationsError } = await supabase
                .from('participations')
                .delete()
                .eq('sortie_id', sortie.id);
  
              if (participationsError) throw participationsError;
  
              // 3. Supprimer la sortie
              const { error: sortieError } = await supabase
                .from('sorties')
                .delete()
                .eq('id', sortie.id);
  
              if (sortieError) throw sortieError;
  
              setSorties(prev => prev.filter(s => s.id !== sortie.id));
              setFiltered(prev => prev.filter(s => s.id !== sortie.id));
  
              Alert.alert('Sortie supprimée', 'La sortie a bien été supprimée.');
            } catch (error) {
              console.error('Delete sortie admin error:', error);
              Alert.alert(
                'Erreur',
                "Impossible de supprimer complètement cette sortie."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sorties ({sorties.length})</Text>

          <View style={{ width: 36 }} />
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une sortie..."
            placeholderTextColor="#bbbbdd"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filtersWrap}>
          <View style={styles.chipsRow}>
            {SPORTS.map(s => {
              const isActive = filterSport === s;
              const color = s !== 'all' ? SPORT_COLORS[s] : '#5B52F0';

              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    isActive && {
                      backgroundColor: color,
                      borderColor: color,
                    },
                  ]}
                  onPress={() => setFilterSport(s)}
                  activeOpacity={0.85}
                >
                  {s !== 'all' && (
                    <Text style={styles.chipEmoji}>
                      {SPORT_EMOJIS[s]}
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.chipText,
                      isActive && styles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {s === 'all' ? 'Tous' : capitalize(s)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.countLabel}>
          {filtered.length} sortie{filtered.length !== 1 ? 's' : ''}
        </Text>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={styles.emptyText}>Chargement...</Text>
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>Aucune sortie</Text>
          ) : (
            filtered.map(sortie => {
              const color = SPORT_COLORS[sortie.sport] || '#5B52F0';
              const bg = SPORT_BG[sortie.sport] || '#EEEDFE';
              const niveau = NIVEAU_CONFIG[sortie.niveau];

              return (
                <View
                  key={sortie.id}
                  style={[
                    styles.sortieItem,
                    { borderColor: color + '25' },
                  ]}
                >
                  <View
                    style={[
                      styles.sortieAccent,
                      { backgroundColor: color },
                    ]}
                  />

                  <View
                    style={[
                      styles.sortieIcon,
                      { backgroundColor: bg },
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {SPORT_EMOJIS[sortie.sport] || '🏃'}
                    </Text>
                  </View>

                  <View style={styles.sortieContent}>
                    <View style={styles.sortieHeaderRow}>
                      <Text style={styles.sortieName} numberOfLines={1}>
                        {capitalize(sortie.titre)}
                      </Text>

                      {niveau && (
                        <View
                          style={[
                            styles.niveauBadge,
                            {
                              backgroundColor: niveau.bg,
                              borderColor: niveau.color + '40',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.niveauText,
                              { color: niveau.color },
                            ]}
                            numberOfLines={1}
                          >
                            {sortie.niveau}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.sortieMeta} numberOfLines={1}>
                      📍 {sortie.lieu}
                    </Text>

                    <Text style={styles.sortieMeta} numberOfLines={1}>
                      📅 {sortie.date_sortie} · {sortie.distance} km ·{' '}
                      {sortie.elevation} m D+
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(sortie)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F3FF',
    paddingTop: 56,
  },

  header: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEEDFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 18,
    color: '#5B52F0',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },

  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  searchInput: {
    height: 46,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD8FF',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#1a1a2e',
  },

  filtersWrap: {
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  chipsRow: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  chip: {
    height: 36,
    minWidth: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 11,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DDD8FF',
    backgroundColor: '#fff',
  },

  chipEmoji: {
    fontSize: 12,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8888bb',
  },

  chipTextActive: {
    color: '#fff',
    fontWeight: '800',
  },

  countLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8888bb',
    paddingHorizontal: 20,
    marginBottom: 4,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 8,
  },

  emptyText: {
    fontSize: 13,
    color: '#8888bb',
    textAlign: 'center',
    paddingTop: 20,
  },

  sortieItem: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#5B52F0',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },

  sortieAccent: {
    width: 4,
    alignSelf: 'stretch',
  },

  sortieIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginVertical: 10,
  },

  sortieContent: {
    flex: 1,
    paddingLeft: 10,
    paddingVertical: 8,
  },

  sortieHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },

  sortieName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1a2e',
    flex: 1,
  },

  niveauBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 105,
  },

  niveauText: {
    fontSize: 10,
    fontWeight: '800',
  },

  sortieMeta: {
    fontSize: 11,
    color: '#8888bb',
    marginTop: 1,
  },

  deleteBtn: {
    width: 42,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteBtnText: {
    fontSize: 16,
  },
});