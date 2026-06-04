import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import PublicProfileScreen from './PublicProfileScreen';
import RideDetailScreen from './RideDetailScreen';
import SwipeBack from '../components/SwipeBack';

const SPORT_COLORS: { [key: string]: string } = {
  route: '#4F46E5', vtt: '#F59F00', trail: '#2D6A4F', running: '#610230',
};
const SPORT_BG: { [key: string]: string } = {
  route: '#EEF2FF', vtt: '#FFFBEB', trail: '#F0FDF4', running: '#F9F0F4',
};
const SPORT_EMOJIS: { [key: string]: string } = {
  route: '🚴', vtt: '🚵', trail: '🏔️', running: '🏃',
};

type Sortie = {
  id: string; titre: string; sport: string; distance: string;
  elevation: string; allure: string; lieu: string; lieu_rencontre: string;
  date_sortie: string; heure: string; participants_max: number;
  niveau: string; description: string; createur_id: string;
};
type SortieLight = { id: string; titre: string; sport: string; };
type Message = { id: string; sortie_id: string; user_id: string; contenu: string; created_at: string; };
type Profile = { id: string; prenom: string; nom: string; avatar_url?: string; };

export default function MessagesScreen() {
  const [sorties, setSorties] = useState<SortieLight[]>([]);
  const [openChat, setOpenChat] = useState<SortieLight | null>(null);
  const [fullSortie, setFullSortie] = useState<Sortie | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<{ [userId: string]: Profile }>({});
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const [showRideDetail, setShowRideDetail] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchSorties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: creees } = await supabase.from('sorties').select('id, titre, sport').eq('createur_id', user.id);
    const { data: participations } = await supabase.from('participations').select('sortie_id').eq('user_id', user.id);
    const sortieIds = (participations || []).map(p => p.sortie_id);
    const filteredIds = sortieIds.filter(id => !(creees || []).find(s => s.id === id));
    let rejointes: SortieLight[] = [];
    if (filteredIds.length > 0) {
      const { data } = await supabase.from('sorties').select('id, titre, sport').in('id', filteredIds);
      rejointes = data || [];
    }
    setSorties([...(creees || []), ...rejointes]);
  };

  const fetchFullSortie = async (sortieId: string) => {
    const { data } = await supabase.from('sorties').select('*').eq('id', sortieId).single();
    if (data) setFullSortie(data);
  };

  useEffect(() => { fetchUser(); }, []);
  useFocusEffect(useCallback(() => { fetchSorties(); }, []));

  const loadProfiles = async (msgs: Message[]) => {
    const unknownIds = [...new Set(msgs.map(m => m.user_id))].filter(id => !profiles[id]);
    if (unknownIds.length === 0) return;
    const { data } = await supabase.from('profiles').select('id, prenom, nom, avatar_url').in('id', unknownIds);
    if (data) {
      const map: { [id: string]: Profile } = {};
      data.forEach(p => { map[p.id] = p; });
      setProfiles(prev => ({ ...prev, ...map }));
    }
  };

  const fetchMessages = async (sortieId: string) => {
    const { data, error } = await supabase.from('messages').select('*').eq('sortie_id', sortieId).order('created_at', { ascending: true });
    if (!error && data) {
      setMessages(data);
      loadProfiles(data);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    }
  };

  const closeChat = () => {
    setOpenChat(null); setFullSortie(null); setMessages([]); setShowRideDetail(false);
    supabase.getChannels().forEach(c => supabase.removeChannel(c));
  };

  const openChatWith = (sortie: SortieLight) => {
    setOpenChat(sortie); setMessages([]);
    fetchMessages(sortie.id);
    fetchFullSortie(sortie.id);
    const channelName = `room-${sortie.id}`;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);
    supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sortie_id=eq.${sortie.id}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => { const updated = [...prev, newMsg]; loadProfiles(updated); return updated; });
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

  if (showProfile) return <PublicProfileScreen userId={showProfile} onBack={() => setShowProfile(null)} />;
  if (showRideDetail && fullSortie) return <RideDetailScreen sortie={fullSortie} onBack={() => setShowRideDetail(false)} />;

  // ── Chat ouvert ────────────────────────────────────────────────────────────
  if (openChat) {
    const chatColor = SPORT_COLORS[openChat.sport] || '#5B52F0';
    const chatBg = SPORT_BG[openChat.sport] || '#EEEDFE';

    return (
      <SwipeBack onSwipeBack={closeChat}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>

          {/* Header chat */}
          <TouchableOpacity style={styles.chatHeader} onPress={() => setShowRideDetail(true)} activeOpacity={0.8}>
            <TouchableOpacity style={styles.backBtn} onPress={closeChat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={[styles.chatIconWrap, { backgroundColor: chatBg }]}>
              <View style={[styles.chatAccent, { backgroundColor: chatColor }]} />
              <Text style={styles.chatIconEmoji}>{SPORT_EMOJIS[openChat.sport]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatTitle} numberOfLines={1}>{openChat.titre}</Text>
              <Text style={[styles.chatSub, { color: chatColor }]}>Voir la sortie →</Text>
            </View>
          </TouchableOpacity>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={{ padding: 14, gap: 10 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <View style={styles.emptyChatWrap}>
                <Text style={styles.emptyChatEmoji}>👋</Text>
                <Text style={styles.emptyChat}>Sois le premier à écrire !</Text>
              </View>
            )}
            {messages.map((msg) => {
              const isMe = msg.user_id === userId;
              const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const author = profiles[msg.user_id];
              const initiales = author ? `${author.prenom?.[0] || ''}${author.nom?.[0] || ''}`.toUpperCase() : '?';

              return (
                <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                  {!isMe && (
                    <TouchableOpacity style={styles.msgAvatarWrap} onPress={() => setShowProfile(msg.user_id)} activeOpacity={0.7}>
                      {author?.avatar_url ? (
                        <Image source={{ uri: author.avatar_url }} style={styles.msgAvatarImg} />
                      ) : (
                        <View style={[styles.msgAvatar, { backgroundColor: chatBg }]}>
                          <Text style={[styles.msgAvatarText, { color: chatColor }]}>{initiales}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  <View style={styles.msgCol}>
                    {!isMe && author && (
                      <Text style={styles.msgAuthor}>{author.prenom}</Text>
                    )}
                    <View style={[styles.bubble, isMe && { backgroundColor: chatColor, borderColor: chatColor, borderBottomLeftRadius: 14, borderBottomRightRadius: 4 }]}>
                      <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.contenu}</Text>
                    </View>
                    <Text style={[styles.msgTime, isMe && { textAlign: 'right' }]}>{time}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.msgInput}
              placeholder="Message..."
              placeholderTextColor="#bbbbdd"
              value={newMessage}
              onChangeText={setNewMessage}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: chatColor }]} onPress={sendMessage}>
              <Text style={styles.sendText}>↑</Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SwipeBack>
    );
  }

  // ── Liste des conversations ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Tes groupes de sortie</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, gap: 10 }}>
        {sorties.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Aucune conversation</Text>
            <Text style={styles.emptySub}>Rejoins ou crée une sortie pour discuter !</Text>
          </View>
        ) : (
          sorties.map(sortie => {
            const color = SPORT_COLORS[sortie.sport] || '#5B52F0';
            const bg = SPORT_BG[sortie.sport] || '#EEEDFE';
            return (
              <TouchableOpacity key={sortie.id} style={styles.convItem} onPress={() => openChatWith(sortie)} activeOpacity={0.88}>
                <View style={[styles.convAccent, { backgroundColor: color }]} />
                <View style={[styles.convIconWrap, { backgroundColor: bg }]}>
                  <Text style={styles.convEmoji}>{SPORT_EMOJIS[sortie.sport]}</Text>
                </View>
                <View style={styles.convInfo}>
                  <Text style={styles.convName} numberOfLines={1}>{sortie.titre}</Text>
                  <Text style={[styles.convSport, { color }]}>{sortie.sport.charAt(0).toUpperCase() + sortie.sport.slice(1)}</Text>
                </View>
                <View style={styles.convChevronWrap}>
                  <Text style={[styles.convChevron, { color }]}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '900', color: '#1a1a2e', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#8888bb', marginTop: 2 },
  list: { flex: 1 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#8888bb' },
  emptySub: { fontSize: 13, color: '#bbbbdd', textAlign: 'center', paddingHorizontal: 32 },
  convItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1, borderColor: '#E8E6FF', overflow: 'hidden',
    shadowColor: '#5B52F0', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3,
  },
  convAccent: { width: 4, alignSelf: 'stretch' },
  convIconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12, marginVertical: 14 },
  convEmoji: { fontSize: 22 },
  convInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  convName: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 3 },
  convSport: { fontSize: 11, fontWeight: '600' },
  convChevronWrap: { paddingRight: 14 },
  convChevron: { fontSize: 24, fontWeight: '300' },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEDFE',
    shadowColor: '#5B52F0', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#5B52F0' },
  chatIconWrap: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexDirection: 'row' },
  chatAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  chatIconEmoji: { fontSize: 18 },
  chatTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  chatSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  messages: { flex: 1 },
  emptyChatWrap: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyChatEmoji: { fontSize: 32 },
  emptyChat: { textAlign: 'center', color: '#8888bb', fontSize: 13, fontWeight: '500' },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 6 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatarWrap: { flexShrink: 0 },
  msgAvatarImg: { width: 32, height: 32, borderRadius: 10 },
  msgAvatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  msgAvatarText: { fontSize: 11, fontWeight: '700' },
  msgCol: { maxWidth: '75%' },
  msgAuthor: { fontSize: 11, fontWeight: '600', color: '#8888bb', marginBottom: 3, marginLeft: 2 },
  bubble: { backgroundColor: '#fff', borderRadius: 14, borderBottomLeftRadius: 4, padding: 10, borderWidth: 1, borderColor: '#DDD8FF' },
  bubbleText: { fontSize: 13, color: '#1a1a2e', lineHeight: 18 },
  bubbleTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#bbbbdd', marginTop: 3 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, paddingBottom: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#EEEDFE',
  },
  msgInput: {
    flex: 1, backgroundColor: '#F4F3FF', borderRadius: 22,
    borderWidth: 1.5, borderColor: '#DDD8FF',
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 13, color: '#1a1a2e',
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 18, color: '#fff', fontWeight: '700' },
});