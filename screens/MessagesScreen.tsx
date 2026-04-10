import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

const CONVERSATIONS = [
  { id: 1, title: 'Sortie Croix-Rousse', sport: 'route', lastMessage: 'On se retrouve au parking à 7h !', time: '2h', unread: 2, emoji: '🚴' },
  { id: 2, title: 'Trail Monts du Lyonnais', sport: 'trail', lastMessage: 'Quelqu\'un a une carte du secteur ?', time: '5h', unread: 0, emoji: '🏔️' },
  { id: 3, title: 'VTT Pilat', sport: 'vtt', lastMessage: 'Super session hier !', time: '1j', unread: 1, emoji: '🚵' },
  { id: 4, title: 'Running Tête d\'Or', sport: 'running', lastMessage: 'On remet ça vendredi ?', time: '2j', unread: 0, emoji: '🏃' },
];

const SPORT_COLORS: { [key: string]: string } = {
  route: '#2196f3', vtt: '#f59f00', trail: '#1bdf8a', running: '#9c27b0'
};

const MESSAGES: { [key: number]: { from: string; text: string; time: string; me: boolean }[] } = {
  1: [
    { from: 'Lucas', text: 'Salut tout le monde ! Prêts pour demain ?', time: '10:12', me: false },
    { from: 'moi', text: 'Yes ! Je serai là à 6h50', time: '10:24', me: true },
    { from: 'Pierre', text: 'Pareil, j\'amène des barres énergétiques 💪', time: '10:31', me: false },
    { from: 'moi', text: 'On se retrouve au parking à 7h !', time: '10:45', me: true },
  ],
  2: [
    { from: 'Sophie', text: 'Hâte d\'être à dimanche !', time: '14:20', me: false },
    { from: 'moi', text: 'Moi aussi ! Tu connais le parcours ?', time: '14:35', me: true },
    { from: 'Sophie', text: 'Quelqu\'un a une carte du secteur ?', time: '14:40', me: false },
  ],
  3: [
    { from: 'Marc', text: 'Belle session aujourd\'hui les gars', time: '09:10', me: false },
    { from: 'moi', text: 'Super session hier !', time: '09:25', me: true },
  ],
  4: [
    { from: 'Julie', text: 'Belle course ce matin !', time: '08:00', me: false },
    { from: 'moi', text: 'On remet ça vendredi ?', time: '09:40', me: true },
  ],
};

export default function MessagesScreen() {
  const [openChat, setOpenChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(MESSAGES);

  const sendMessage = () => {
    if (!newMessage.trim() || !openChat) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages(prev => ({
      ...prev,
      [openChat]: [...(prev[openChat] || []), { from: 'moi', text: newMessage, time, me: true }]
    }));
    setNewMessage('');
  };

  if (openChat) {
    const conv = CONVERSATIONS.find(c => c.id === openChat)!;
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setOpenChat(null)}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={[styles.convIcon, { backgroundColor: SPORT_COLORS[conv.sport] + '20' }]}>
            <Text style={{ fontSize: 18 }}>{conv.emoji}</Text>
          </View>
          <View>
            <Text style={styles.chatTitle}>{conv.title}</Text>
            <Text style={styles.chatSub}>Groupe de sortie</Text>
          </View>
        </View>

        <ScrollView style={styles.messages} contentContainerStyle={{ padding: 14, gap: 10 }}>
          {(messages[openChat] || []).map((msg, i) => (
            <View key={i} style={[styles.msgRow, msg.me && styles.msgRowMe]}>
              {!msg.me && (
                <View style={styles.msgAvatar}>
                  <Text style={styles.msgAvatarText}>{msg.from[0]}</Text>
                </View>
              )}
              <View style={styles.msgCol}>
                {!msg.me && <Text style={styles.msgSender}>{msg.from}</Text>}
                <View style={[styles.bubble, msg.me && styles.bubbleMe]}>
                  <Text style={[styles.bubbleText, msg.me && styles.bubbleTextMe]}>{msg.text}</Text>
                </View>
                <Text style={styles.msgTime}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.msgInput}
            placeholder="Message..."
            placeholderTextColor="#bbb"
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
        {CONVERSATIONS.map(conv => (
          <TouchableOpacity key={conv.id} style={styles.convItem} onPress={() => setOpenChat(conv.id)}>
            <View style={[styles.convIcon, { backgroundColor: SPORT_COLORS[conv.sport] + '20' }]}>
              <Text style={{ fontSize: 22 }}>{conv.emoji}</Text>
            </View>
            <View style={styles.convInfo}>
              <View style={styles.convTop}>
                <Text style={styles.convName}>{conv.title}</Text>
                <Text style={styles.convTime}>{conv.time}</Text>
              </View>
              <Text style={[styles.convPreview, conv.unread > 0 && styles.convPreviewUnread]} numberOfLines={1}>
                {conv.lastMessage}
              </Text>
            </View>
            {conv.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{conv.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa', paddingTop: 56 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#0d0d0d' },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 2 },
  list: { flex: 1 },
  convItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  convIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 14, fontWeight: '600', color: '#0d0d0d' },
  convTime: { fontSize: 11, color: '#bbb' },
  convPreview: { fontSize: 12, color: '#aaa' },
  convPreviewUnread: { color: '#555', fontWeight: '500' },
  badge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#1bdf8a', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#555' },
  chatTitle: { fontSize: 14, fontWeight: '600', color: '#0d0d0d' },
  chatSub: { fontSize: 11, color: '#aaa' },
  messages: { flex: 1 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#e0e2e8', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { fontSize: 12, fontWeight: '600', color: '#555' },
  msgCol: { maxWidth: '75%' },
  msgSender: { fontSize: 10, color: '#aaa', marginBottom: 3, marginLeft: 2 },
  bubble: { backgroundColor: '#fff', borderRadius: 14, borderBottomLeftRadius: 4, padding: 10, borderWidth: 1, borderColor: '#eaecf0' },
  bubbleMe: { backgroundColor: '#1bdf8a', borderColor: '#1bdf8a', borderBottomLeftRadius: 14, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 13, color: '#0d0d0d', lineHeight: 18 },
  bubbleTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#bbb', marginTop: 3, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  msgInput: { flex: 1, backgroundColor: '#f5f6f8', borderRadius: 20, borderWidth: 1.5, borderColor: '#eaecf0', padding: 10, fontSize: 13, color: '#0d0d0d' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1bdf8a', alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 18, color: '#fff', fontWeight: '700' },
});