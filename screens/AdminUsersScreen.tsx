import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import SwipeBack from '../components/SwipeBack';

const SPORT_COLORS: { [k: string]: string } = {
  route: '#4F46E5', vtt: '#F59F00', trail: '#2D6A4F', running: '#610230',
};
const SPORT_BG: { [k: string]: string } = {
  route: '#EEF2FF', vtt: '#FFFBEB', trail: '#F0FDF4', running: '#F9F0F4',
};
const SPORT_EMOJIS: { [k: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃',
};
const NIVEAU_CONFIG: { [k: string]: { color: string; bg: string } } = {
  facile: { color: '#2D6A4F', bg: '#F0FDF4' },
  intermediaire: { color: '#D97706', bg: '#FFFBEB' },
  difficile: { color: '#610230', bg: '#F9F0F4' },
};

type Profile = {
  id: string; prenom: string; nom: string; ville: string;
  sport_principal: string; niveau: string; avatar_url?: string;
  created_at?: string; is_admin?: boolean;
};

type Props = { onBack: () => void };

export default function AdminUsersScreen({ onBack }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userSorties, setUserSorties] = useState<any[]>([]);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.prenom?.toLowerCase().includes(q) ||
      u.nom?.toLowerCase().includes(q) ||
      u.ville?.toLowerCase().includes(q)
    ));
  }, [search, users]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  const fetchUserSorties = async (userId: string) => {
    const { data } = await supabase.from('sorties').select('id, titre, sport, date_sortie, distance').eq('createur_id', userId).order('created_at', { ascending: false });
    setUserSorties(data || []);
  };

  const handleSelectUser = (user: Profile) => {
    setSelectedUser(user);
    fetchUserSorties(user.id);
  };

  const handleDeleteUser = (user: Profile) => {
    Alert.alert(
      'Supprimer ce compte',
      `Supprimer le compte de ${user.prenom} ${user.nom} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            await supabase.from('profiles').delete().eq('id', user.id);
            setSelectedUser(null);
            fetchUsers();
            Alert.alert('Compte supprimé ✅', '');
          },
        },
      ]
    );
  };

  const handleDeleteSortie = async (sortieId: string) => {
    Alert.alert('Supprimer cette sortie ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await supabase.from('sorties').delete().eq('id', sortieId);
          if (selectedUser) fetchUserSorties(selectedUser.id);
        },
      },
    ]);
  };

  // ─── Vue détail utilisateur ─────────────────────────────────────────────
  if (selectedUser) {
    const color = SPORT_COLORS[selectedUser.sport_principal] || '#5B52F0';
    const bg = SPORT_BG[selectedUser.sport_principal] || '#EEEDFE';
    const niveauConf = NIVEAU_CONFIG[selectedUser.niveau];
    const initiales = `${selectedUser.prenom?.[0] || ''}${selectedUser.nom?.[0] || ''}`.toUpperCase();

    return (
      <SwipeBack onSwipeBack={() => setSelectedUser(null)}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedUser(null)}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profil utilisateur</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
            {/* Carte profil */}
            <View style={[styles.profileCard, { borderColor: color + '30' }]}>
              <View style={[styles.profileCardAccent, { backgroundColor: color }]} />
              <View style={styles.profileCardInner}>
                <View style={[styles.avatarWrap, { borderColor: color + '40', backgroundColor: bg }]}>
                  {selectedUser.avatar_url ? (
                    <Image source={{ uri: selectedUser.avatar_url }} style={styles.avatarImg} />
                  ) : (
                    <Text style={[styles.avatarText, { color }]}>{initiales}</Text>
                  )}
                </View>
                <Text style={styles.profileName}>{selectedUser.prenom} {selectedUser.nom}</Text>
                <Text style={styles.profileSub}>📍 {selectedUser.ville}</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '40' }]}>
                    <Text style={styles.badgeEmoji}>{SPORT_EMOJIS[selectedUser.sport_principal] || '🏃'}</Text>
                    <Text style={[styles.badgeText, { color }]}>{selectedUser.sport_principal}</Text>
                  </View>
                  {niveauConf && (
                    <View style={[styles.badge, { backgroundColor: niveauConf.bg, borderColor: niveauConf.color + '40' }]}>
                      <Text style={[styles.badgeText, { color: niveauConf.color }]}>{selectedUser.niveau}</Text>
                    </View>
                  )}
                  {selectedUser.is_admin && (
                    <View style={[styles.badge, { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' }]}>
                      <Text style={[styles.badgeText, { color: '#fff' }]}>🛡️ Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.profileId}>ID: {selectedUser.id.slice(0, 16)}...</Text>
              </View>
            </View>

            {/* Sorties créées */}
            <Text style={styles.sectionTitle}>Sorties créées ({userSorties.length})</Text>
            {userSorties.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.emptyText}>Aucune sortie créée</Text>
              </View>
            ) : (
              userSorties.map(ride => {
                const rc = SPORT_COLORS[ride.sport] || '#5B52F0';
                const rb = SPORT_BG[ride.sport] || '#EEEDFE';
                return (
                  <View key={ride.id} style={[styles.rideItem, { borderColor: rc + '25' }]}>
                    <View style={[styles.rideAccent, { backgroundColor: rc }]} />
                    <View style={[styles.rideIcon, { backgroundColor: rb }]}>
                      <Text>{SPORT_EMOJIS[ride.sport] || '🏃'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rideName} numberOfLines={1}>{ride.titre}</Text>
                      <Text style={styles.rideMeta}>{ride.date_sortie} · {ride.distance} km</Text>
                    </View>
                    <TouchableOpacity style={styles.deleteSmallBtn} onPress={() => handleDeleteSortie(ride.id)}>
                      <Text style={styles.deleteSmallText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            {/* Bouton supprimer compte */}
            {!selectedUser.is_admin && (
              <TouchableOpacity style={styles.deleteUserBtn} onPress={() => handleDeleteUser(selectedUser)}>
                <Text style={styles.deleteUserBtnText}>🗑 Supprimer ce compte</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </SwipeBack>
    );
  }

  // ─── Liste utilisateurs ─────────────────────────────────────────────────
  return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Utilisateurs ({users.length})</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor="#bbbbdd"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
          {loading ? (
            <Text style={styles.emptyText}>Chargement...</Text>
          ) : filtered.map(user => {
            const color = SPORT_COLORS[user.sport_principal] || '#5B52F0';
            const bg = SPORT_BG[user.sport_principal] || '#EEEDFE';
            const initiales = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
            return (
              <TouchableOpacity key={user.id} style={styles.userItem} onPress={() => handleSelectUser(user)} activeOpacity={0.85}>
                <View style={[styles.userAvatar, { backgroundColor: bg, borderColor: color + '40' }]}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.userAvatarImg} />
                  ) : (
                    <Text style={[styles.userAvatarText, { color }]}>{initiales}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{user.prenom} {user.nom}</Text>
                    {user.is_admin && <Text style={styles.adminBadge}>🛡️ Admin</Text>}
                  </View>
                  <Text style={styles.userMeta}>📍 {user.ville} · {SPORT_EMOJIS[user.sport_principal] || '🏃'} {user.sport_principal}</Text>
                </View>
                <Text style={[styles.chevron, { color }]}>›</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
  searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 11, fontSize: 13, color: '#1a1a2e' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  emptyText: { fontSize: 13, color: '#8888bb', textAlign: 'center' },
  userItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#E8E6FF',
    shadowColor: '#5B52F0', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  userAvatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  userAvatarImg: { width: 42, height: 42, borderRadius: 12 },
  userAvatarText: { fontSize: 14, fontWeight: '700' },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  adminBadge: { fontSize: 11, color: '#5B52F0', fontWeight: '600' },
  userMeta: { fontSize: 12, color: '#8888bb', marginTop: 2 },
  chevron: { fontSize: 22 },
  // Détail
  profileCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, overflow: 'hidden', shadowColor: '#5B52F0', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  profileCardAccent: { height: 4, width: '100%' },
  profileCardInner: { padding: 20, alignItems: 'center', gap: 6 },
  avatarWrap: { width: 72, height: 72, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4, overflow: 'hidden' },
  avatarImg: { width: 72, height: 72, borderRadius: 20 },
  avatarText: { fontSize: 24, fontWeight: '800' },
  profileName: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  profileSub: { fontSize: 12, color: '#8888bb' },
  profileId: { fontSize: 10, color: '#bbbbdd', marginTop: 4 },
  badgesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeEmoji: { fontSize: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E6FF', alignItems: 'center' },
  rideItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, overflow: 'hidden', shadowColor: '#5B52F0', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1 },
  rideAccent: { width: 4, alignSelf: 'stretch' },
  rideIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginVertical: 10 },
  rideName: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', paddingLeft: 10, paddingTop: 10 },
  rideMeta: { fontSize: 11, color: '#8888bb', paddingLeft: 10, paddingBottom: 10 },
  deleteSmallBtn: { padding: 14 },
  deleteSmallText: { fontSize: 16 },
  deleteUserBtn: { backgroundColor: '#FFF0F0', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#FFDDDD', marginTop: 8 },
  deleteUserBtnText: { color: '#e05c3a', fontSize: 14, fontWeight: '700' },
});