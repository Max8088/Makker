import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

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
};

type Message = {
  id: string;
  sortie_id: string;
  user_id: string;
  contenu: string;
  created_at: string;
};

export default function MessagesScreen() {
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [openChat, setOpenChat] = useState<Sortie | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchUser();
    fetchSorties();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchSorties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: participations } = await supabase
      .from('participations')
      .select('sortie_id')
      .eq('user_id', user.id);

    const { data: creees } = await supabase
      .from('sorties')
      .select('id, titre, sport')
      .eq('createur_id', user.id);

    if (!participations || participations.length === 0) {
      setSorties(creees || []);
      return;
    }

    const sortieIds = participations.map(p => p.sortie_id);
    const { data: rejointes } = await supabase
      .from('sorties')
      .select('id, titre, sport')
      .in('id', sortieIds);

    const toutes = [...(creees || []), ...(rejointes || [])];
    const uniques = toutes.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
    setSorties(uniques);
  };

  const fetchMessages = async (sortieId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sortie_id', sortieId)
      .order('created_at', { ascending: true });
    if (!error) {
      setMessages(data || []);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    }
  };

  const openChatWith = (sortie: Sortie) => {
    setOpenChat(sortie);
    setMessages([]);
    fetchMessages(sortie.id);

    const subscription = supabase
      .channel(`room-${sortie.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sortie_id=eq.${sortie.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !openChat || !userId) return;
    const contenu = newMessage.trim();
    setNewMessage('');
    await supabase.from('messages').insert({
      sortie_id: openChat.id,
      user_id: userId,
      contenu,
    });
    await fetchMessages(openChat.id);
  };

  if (openChat) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setOpenChat(null); setMessages([]); }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={[styles.convIcon, { backgroundColor: SPORT_COLORS[openChat.sport] + '20' }]}>
            <Text style={{ fontSize: 18 }}>{SPORT_EMOJIS[openChat.sport]}</Text>
          </View>
          <View>
            <Text style={styles.chatTitle}>{openChat.titre}</Text>
            <Text style={styles.chatSub}>Groupe de sortie</Text>
          </View>
        </View>

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
            return (
              <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && (
                  <View style={styles.msgAvatar}>
                    <Text style={styles.msgAvatarText}>?</Text>
                  </View>
                )}
                <View style={styles.msgCol}>
                  <View style={[styles.bubble, isMe && styles.bubbleMe]}>
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.contenu}</Text>
                  </View>
                  <Text style={styles.msgTime}>{time}</Text>
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
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEDFE' },
  backBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#5B52F0' },
  chatTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  chatSub: { fontSize: 11, color: '#8888bb' },
  messages: { flex: 1 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { fontSize: 12, fontWeight: '600', color: '#5B52F0' },
  msgCol: { maxWidth: '75%' },
  bubble: { backgroundColor: '#fff', borderRadius: 14, borderBottomLeftRadius: 4, padding: 10, borderWidth: 1, borderColor: '#DDD8FF' },
  bubbleMe: { backgroundColor: '#5B52F0', borderColor: '#5B52F0', borderBottomLeftRadius: 14, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 13, color: '#1a1a2e', lineHeight: 18 },
  bubbleTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#8888bb', marginTop: 3, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#DDD8FF' },
  msgInput: { flex: 1, backgroundColor: '#F4F3FF', borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 10, fontSize: 13, color: '#1a1a2e' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#5B52F0', alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 18, color: '#fff', fontWeight: '700' },
});