import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import PublicProfileScreen from './PublicProfileScreen';
import RideDetailScreen from './RideDetailScreen';

const SPORT_COLORS: { [key: string]: string } = {
  route: '#4F46E5', vtt: '#f59f00', trail: '#5B52F0', running: '#A78BFA'
};
const SPORT_EMOJIS: { [key: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃'
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

type SortieLight = {
  id: string;
  titre: string;
  sport: string;
};

type Message = {
  id: string;
  sortie_id: string;
  user_id: string;
  contenu: string;
  created_at: string;
};

type Profile = {
  id: string;
  prenom: string;
  nom: string;
  avatar_url?: string;
};

export default function MessagesScreen() {
  const [sorties, setSorties] = useState<SortieLight[]>([]);
  const [openChat, setOpenChat] = useState<SortieLight | null>(null);
  const [fullSortie, setFullSortie] = useState<Sortie | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<{ [userId: string]: Profile }>({});
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState<string | null>(null); // userId à afficher
  const [showRideDetail, setShowRideDetail] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchSorties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: creees } = await supabase
      .from('sorties').select('id, titre, sport').eq('createur_id', user.id);

    const { data: participations } = await supabase
      .from('participations').select('sortie_id').eq('user_id', user.id);

    const sortieIds = (participations || []).map(p => p.sortie_id);
    const filteredIds = sortieIds.filter(id => !(creees || []).find(s => s.id === id));

    let rejointes: SortieLight[] = [];
    if (filteredIds.length > 0) {
      const { data } = await supabase.from('sorties').select('id, titre, sport').in('id', filteredIds);
      rejointes = data || [];
    }
    setSorties([...(creees || []), ...rejointes]);
  };

  // Charge la sortie complète pour RideDetailScreen
  const fetchFullSortie = async (sortieId: string) => {
    const { data } = await supabase.from('sorties').select('*').eq('id', sortieId).single();
    if (data) setFullSortie(data);
  };

  useEffect(() => { fetchUser(); }, []);
  useFocusEffect(useCallback(() => { fetchSorties(); }, []));

  // Charge les profils des auteurs de messages inconnus
  const loadProfiles = async (msgs: Message[]) => {
    const unknownIds = [...new Set(msgs.map(m => m.user_id))].filter(id => !profiles[id]);
    if (unknownIds.length === 0) return;
    const { data } = await supabase
      .from('profiles').select('id, prenom, nom, avatar_url').in('id', unknownIds);
    if (data) {
      const map: { [id: string]: Profile } = {};
      data.forEach(p => { map[p.id] = p; });
      setProfiles(prev => ({ ...prev, ...map }));
    }
  };

  const fetchMessages = async (sortieId: string) => {
    const { data, error } = await supabase
      .from('messages').select('*').eq('sortie_id', sortieId).order('created_at', { ascending: true });
    if (!error && data) {
      setMessages(data);
      loadProfiles(data);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    }
  };

  const closeChat = () => {
    setOpenChat(null);
    setFullSortie(null);
    setMessages([]);
    setShowRideDetail(false);
    supabase.getChannels().forEach(c => supabase.removeChannel(c));
  };

  const openChatWith = (sortie: SortieLight) => {
    setOpenChat(sortie);
    setMessages([]);
    fetchMessages(sortie.id);
    fetchFullSortie(sortie.id);

    const channelName = `room-${sortie.id}`;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sortie_id=eq.${sortie.id}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            const updated = [...prev, newMsg];
            loadProfiles(updated);
            return updated;
          });
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
      ).subscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !openChat || !userId) return;
    const contenu = newMessage.trim();
    setNewMessage('');
    await supabase.from('messages').insert({ sortie_id: openChat.id, user_id: userId, contenu });
  };

  // ── Écran profil public ──────────────────────────────────────────────────
  if (showProfile) return (
    <PublicProfileScreen userId={showProfile} onBack={() => setShowProfile(null)} />
  );

  // ── Écran détail sortie ──────────────────────────────────────────────────
  if (showRideDetail && fullSortie) return (
    <RideDetailScreen sortie={fullSortie} onBack={() => setShowRideDetail(false)} />
  );

  // ── Chat ouvert ──────────────────────────────────────────────────────────
  if (openChat) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={10}
      >
        {/* Header cliquable → RideDetailScreen */}
        <TouchableOpacity style={styles.chatHeader} onPress={() => setShowRideDetail(true)} activeOpacity={0.8}>
          <TouchableOpacity style={styles.backBtn} onPress={closeChat}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={[styles.convIcon, { backgroundColor: SPORT_COLORS[openChat.sport] + '20' }]}>
            <Text style={{ fontSize: 18 }}>{SPORT_EMOJIS[openChat.sport]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatTitle}>{openChat.titre}</Text>
            <Text style={styles.chatSub}>Appuie pour voir la sortie →</Text>
          </View>
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ padding: 14, gap: 10 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <Text style={styles.emptyChat}>Sois le premier à écrire un message ! 👋</Text>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === userId;
            const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const author = profiles[msg.user_id];
            const initiales = author
              ? `${author.prenom?.[0] || ''}${author.nom?.[0] || ''}`.toUpperCase()
              : '?';

            return (
              <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {/* Avatar cliquable (uniquement pour les autres) */}
                {!isMe && (
                  <TouchableOpacity
                    style={styles.msgAvatarWrap}
                    onPress={() => setShowProfile(msg.user_id)}
                    activeOpacity={0.7}
                  >
                    {author?.avatar_url ? (
                      <Image source={{ uri: author.avatar_url }} style={styles.msgAvatarImg} />
                    ) : (
                      <View style={styles.msgAvatar}>
                        <Text style={styles.msgAvatarText}>{initiales}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                <View style={styles.msgCol}>
                  {/* Prénom affiché au-dessus (uniquement pour les autres) */}
                  {!isMe && author && (
                    <Text style={styles.msgAuthor}>{author.prenom}</Text>
                  )}
                  <View style={[styles.bubble, isMe && styles.bubbleMe]}>
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.contenu}</Text>
                  </View>
                  <Text style={[styles.msgTime, isMe && { textAlign: 'right' }]}>{time}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.msgInput}
            placeholder="Message..."
            placeholderTextColor="#bbbbdd"
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Liste des conversations ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Tes groupes de sortie</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingVertical: 8 }}>
        {sorties.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Aucune conversation pour l'instant.</Text>
            <Text style={styles.emptySub}>Rejoins ou crée une sortie pour discuter ! 🚴</Text>
          </View>
        ) : (
          sorties.map(sortie => (
            <TouchableOpacity key={sortie.id} style={styles.convItem} onPress={() => openChatWith(sortie)}>
              <View style={[styles.convIcon, { backgroundColor: SPORT_COLORS[sortie.sport] + '20' }]}>
                <Text style={{ fontSize: 22 }}>{SPORT_EMOJIS[sortie.sport]}</Text>
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convTop}>
                  <Text style={styles.convName}>{sortie.titre}</Text>
                </View>
                <Text style={styles.convPreview}>Appuie pour voir les messages</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: 1 },
  subtitle: { fontSize: 13, color: '#8888bb', marginTop: 2 },
  list: { flex: 1 },
  emptyWrap: { padding: 32, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#8888bb', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#bbbbdd', textAlign: 'center' },
  emptyChat: { textAlign: 'center', color: '#8888bb', fontSize: 13, marginTop: 20 },
  convItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEDFE' },
  convIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  convPreview: { fontSize: 12, color: '#8888bb' },
  // Header chat
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEDFE' },
  backBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#5B52F0' },
  chatTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  chatSub: { fontSize: 11, color: '#5B52F0' },
  // Messages
  messages: { flex: 1 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  // Avatar
  msgAvatarWrap: { flexShrink: 0 },
  msgAvatarImg: { width: 32, height: 32, borderRadius: 10 },
  msgAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  msgAvatarText: { fontSize: 11, fontWeight: '700', color: '#5B52F0' },
  msgCol: { maxWidth: '75%' },
  msgAuthor: { fontSize: 11, fontWeight: '600', color: '#8888bb', marginBottom: 3, marginLeft: 2 },
  bubble: { backgroundColor: '#fff', borderRadius: 14, borderBottomLeftRadius: 4, padding: 10, borderWidth: 1, borderColor: '#DDD8FF' },
  bubbleMe: { backgroundColor: '#5B52F0', borderColor: '#5B52F0', borderBottomLeftRadius: 14, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 13, color: '#1a1a2e', lineHeight: 18 },
  bubbleTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#8888bb', marginTop: 3 },
  // Input
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#DDD8FF' },
  msgInput: { flex: 1, backgroundColor: '#F4F3FF', borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 10, fontSize: 13, color: '#1a1a2e' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#5B52F0', alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 18, color: '#fff', fontWeight: '700' },
});