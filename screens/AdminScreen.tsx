import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import SwipeBack from '../components/SwipeBack';
import AdminUsersScreen from './AdminUsersScreen';
import AdminSortiesScreen from './AdminSortiesScreen';

type Stats = {
  totalUsers: number;
  totalSorties: number;
  totalConversations: number;
  totalParticipations: number;
  sortiesParSport: { sport: string; count: number }[];
  nouveauxUsers7j: number;
  nouvellesSorties7j: number;
};

type MessageRow = {
  sortie_id: string | null;
};

type Props = {
  onBack: () => void;
};

export default function AdminScreen({ onBack }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'users' | 'sorties'>('dashboard');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    try {
      const [
        { count: totalUsers, error: usersError },
        { count: totalSorties, error: sortiesError },
        { count: totalParticipations, error: participationsError },
        { data: sortiesData, error: sortiesSportError },
        { data: messagesData, error: messagesError },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sorties').select('*', { count: 'exact', head: true }),
        supabase.from('participations').select('*', { count: 'exact', head: true }),
        supabase.from('sorties').select('sport'),
        supabase.from('messages').select('sortie_id'),
      ]);

      if (usersError || sortiesError || participationsError || sortiesSportError || messagesError) {
        console.error('Admin stats error:', {
          usersError,
          sortiesError,
          participationsError,
          sortiesSportError,
          messagesError,
        });

        Alert.alert('Erreur', 'Impossible de charger toutes les statistiques.');
      }

      const sportCounts: { [k: string]: number } = {};

      (sortiesData || []).forEach(s => {
        sportCounts[s.sport] = (sportCounts[s.sport] || 0) + 1;
      });

      const sortiesParSport = Object.entries(sportCounts)
        .map(([sport, count]) => ({ sport, count }))
        .sort((a, b) => b.count - a.count);

      const conversationIds = new Set(
        ((messagesData || []) as MessageRow[])
          .map(message => message.sortie_id)
          .filter(Boolean)
      );

      const il7jours = new Date();
      il7jours.setDate(il7jours.getDate() - 7);

      const { count: nouveauxUsers7j, error: nouveauxUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', il7jours.toISOString());

      const { count: nouvellesSorties7j, error: nouvellesSortiesError } = await supabase
        .from('sorties')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', il7jours.toISOString());

      if (nouveauxUsersError || nouvellesSortiesError) {
        console.error('Admin 7 days stats error:', {
          nouveauxUsersError,
          nouvellesSortiesError,
        });
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalSorties: totalSorties || 0,
        totalConversations: conversationIds.size,
        totalParticipations: totalParticipations || 0,
        sortiesParSport,
        nouveauxUsers7j: nouveauxUsers7j || 0,
        nouvellesSorties7j: nouvellesSorties7j || 0,
      });
    } catch (error) {
      console.error('Fetch admin stats error:', error);
      Alert.alert('Erreur', 'Impossible de charger les statistiques admin.');
    } finally {
      setLoading(false);
    }
  };

  if (activeSection === 'users') {
    return <AdminUsersScreen onBack={() => setActiveSection('dashboard')} />;
  }

  if (activeSection === 'sorties') {
    return <AdminSortiesScreen onBack={() => setActiveSection('dashboard')} />;
  }

  const SPORT_COLORS: { [k: string]: string } = {
    route: '#4F46E5',
    vtt: '#F59F00',
    trail: '#2D6A4F',
    running: '#610230',
  };

  const SPORT_EMOJIS: { [k: string]: string } = {
    route: '🚴',
    vtt: '🚵',
    trail: '🏔️',
    running: '🏃',
  };

  return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Dashboard Admin</Text>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchStats}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <View style={styles.adminBanner}>
            <Text style={styles.adminBannerEmoji}>🛡️</Text>

            <View>
              <Text style={styles.adminBannerTitle}>Espace Administrateur</Text>
              <Text style={styles.adminBannerSub}>Makker — Vue d'ensemble</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>Chargement des stats...</Text>
            </View>
          ) : stats ? (
            <>
              <Text style={styles.sectionTitle}>Stats globales</Text>

              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderColor: '#4F46E5' + '30', backgroundColor: '#EEF2FF' }]}>
                  <Text style={styles.statCardIcon}>👥</Text>
                  <Text style={[styles.statCardVal, { color: '#4F46E5' }]}>{stats.totalUsers}</Text>
                  <Text style={styles.statCardLabel}>Utilisateurs</Text>
                </View>

                <View style={[styles.statCard, { borderColor: '#2D6A4F' + '30', backgroundColor: '#F0FDF4' }]}>
                  <Text style={styles.statCardIcon}>🚴</Text>
                  <Text style={[styles.statCardVal, { color: '#2D6A4F' }]}>{stats.totalSorties}</Text>
                  <Text style={styles.statCardLabel}>Sorties</Text>
                </View>

                <View style={[styles.statCard, { borderColor: '#D97706' + '30', backgroundColor: '#FFFBEB' }]}>
                  <Text style={styles.statCardIcon}>💬</Text>
                  <Text style={[styles.statCardVal, { color: '#D97706' }]}>{stats.totalConversations}</Text>
                  <Text style={styles.statCardLabel}>Conversations</Text>
                </View>

                <View style={[styles.statCard, { borderColor: '#610230' + '30', backgroundColor: '#F9F0F4' }]}>
                  <Text style={styles.statCardIcon}>✅</Text>
                  <Text style={[styles.statCardVal, { color: '#610230' }]}>{stats.totalParticipations}</Text>
                  <Text style={styles.statCardLabel}>Participations</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>7 derniers jours</Text>

              <View style={styles.row}>
                <View style={[styles.trendCard, { flex: 1 }]}>
                  <Text style={styles.trendEmoji}>🆕</Text>
                  <Text style={styles.trendVal}>{stats.nouveauxUsers7j}</Text>
                  <Text style={styles.trendLabel}>Nouveaux utilisateurs</Text>
                </View>

                <View style={[styles.trendCard, { flex: 1 }]}>
                  <Text style={styles.trendEmoji}>📅</Text>
                  <Text style={styles.trendVal}>{stats.nouvellesSorties7j}</Text>
                  <Text style={styles.trendLabel}>Nouvelles sorties</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Répartition par sport</Text>

              <View style={styles.infoCard}>
                {stats.sortiesParSport.length === 0 ? (
                  <Text style={styles.emptyText}>Aucune sortie</Text>
                ) : (
                  stats.sortiesParSport.map((item, i) => {
                    const color = SPORT_COLORS[item.sport] || '#5B52F0';
                    const total = stats.totalSorties || 1;
                    const pct = Math.round((item.count / total) * 100);

                    return (
                      <View key={item.sport}>
                        {i > 0 && <View style={styles.divider} />}

                        <View style={styles.sportStatRow}>
                          <Text style={styles.sportStatEmoji}>{SPORT_EMOJIS[item.sport] || '🏃'}</Text>

                          <View style={{ flex: 1 }}>
                            <View style={styles.sportStatLabelRow}>
                              <Text style={[styles.sportStatName, { color }]}>{item.sport}</Text>
                              <Text style={[styles.sportStatPct, { color }]}>{pct}%</Text>
                            </View>

                            <View style={styles.barBg}>
                              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                            </View>
                          </View>

                          <Text style={[styles.sportStatCount, { color }]}>{item.count}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <Text style={styles.sectionTitle}>Gestion</Text>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => setActiveSection('users')}
                activeOpacity={0.85}
              >
                <View style={[styles.navIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={styles.navIconText}>👥</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.navCardTitle}>Utilisateurs</Text>
                  <Text style={styles.navCardSub}>Voir, gérer et supprimer des comptes</Text>
                </View>

                <Text style={styles.navChevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => setActiveSection('sorties')}
                activeOpacity={0.85}
              >
                <View style={[styles.navIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={styles.navIconText}>🗓️</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.navCardTitle}>Sorties</Text>
                  <Text style={styles.navCardSub}>Voir et supprimer toutes les sorties</Text>
                </View>

                <Text style={styles.navChevron}>›</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </View>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEEDFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: { fontSize: 18, color: '#5B52F0' },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEEDFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshText: { fontSize: 18, color: '#5B52F0' },

  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },

  adminBannerEmoji: { fontSize: 28 },

  adminBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },

  adminBannerSub: {
    fontSize: 12,
    color: '#8888bb',
    marginTop: 2,
  },

  loadingWrap: {
    alignItems: 'center',
    paddingTop: 40,
  },

  loadingText: {
    fontSize: 14,
    color: '#8888bb',
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  statCard: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },

  statCardIcon: { fontSize: 22 },

  statCardVal: {
    fontSize: 22,
    fontWeight: '900',
  },

  statCardLabel: {
    fontSize: 11,
    color: '#8888bb',
    fontWeight: '500',
  },

  row: {
    flexDirection: 'row',
    gap: 8,
  },

  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E6FF',
    gap: 4,
  },

  trendEmoji: { fontSize: 20 },

  trendVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a2e',
  },

  trendLabel: {
    fontSize: 10,
    color: '#8888bb',
    textAlign: 'center',
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E6FF',
  },

  divider: {
    height: 1,
    backgroundColor: '#F4F3FF',
    marginVertical: 10,
  },

  sportStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  sportStatEmoji: {
    fontSize: 18,
    width: 24,
  },

  sportStatLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  sportStatName: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  sportStatPct: {
    fontSize: 12,
    fontWeight: '600',
  },

  barBg: {
    height: 6,
    backgroundColor: '#F4F3FF',
    borderRadius: 3,
    overflow: 'hidden',
  },

  barFill: {
    height: 6,
    borderRadius: 3,
  },

  sportStatCount: {
    fontSize: 13,
    fontWeight: '800',
    width: 24,
    textAlign: 'right',
  },

  emptyText: {
    fontSize: 13,
    color: '#8888bb',
    textAlign: 'center',
  },

  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E6FF',
    shadowColor: '#5B52F0',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },

  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIconText: {
    fontSize: 20,
  },

  navCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  navCardSub: {
    fontSize: 12,
    color: '#8888bb',
    marginTop: 2,
  },

  navChevron: {
    fontSize: 24,
    color: '#8888bb',
  },
});