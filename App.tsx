import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Image, ActivityIndicator, Text, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import FeedScreen from './screens/FeedScreen';
import MapScreen from './screens/MapScreen';
import CreateScreen from './screens/CreateScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { supabase } from './lib/supabase';

const Tab = createBottomTabNavigator();

const ICONS = {
  Feed: require('./assets/icons/feed_icon.png'),
  Map: require('./assets/icons/map_icon.png'),
  Messages: require('./assets/icons/message_icon.png'),
  Profile: require('./assets/icons/profil_icon.png'),
};

// ─── Config globale des notifications (affichage quand app au premier plan) ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Enregistre le token push et le sauvegarde en base ───────────────────────
async function registerPushToken(userId: string) {
  // Les notifications push ne fonctionnent pas sur simulateur
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission notifications refusée');
    return;
  }

  // Sur Android, il faut configurer un canal de notification
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Makker',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5B52F0',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'abf373d8-d38f-4209-bc76-619462422315',
    });

    const token = tokenData.data;

    await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    console.log('Push token enregistré:', token);
  } catch (e) {
    console.error('Erreur enregistrement push token:', e);
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [unreadConversations, setUnreadConversations] = useState(0);

  const checkOnboarding = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    setNeedsOnboarding(data?.onboarding_completed !== true);
  };

  // ─── Compte le nombre de conversations avec au moins un message non lu ────
  const checkUnreadConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUnreadConversations(0); return; }

    const { data: creees } = await supabase
      .from('sorties')
      .select('id')
      .eq('createur_id', user.id);

    const { data: participations } = await supabase
      .from('participations')
      .select('sortie_id')
      .eq('user_id', user.id);

    const createdIds = (creees || []).map(s => s.id);
    const joinedIds = (participations || []).map(p => p.sortie_id);
    const allIds = [...new Set([...createdIds, ...joinedIds])];

    if (allIds.length === 0) { setUnreadConversations(0); return; }

    const { data: reads } = await supabase
      .from('conversation_reads')
      .select('sortie_id, last_read_at')
      .eq('user_id', user.id)
      .in('sortie_id', allIds);

    const readMap: { [id: string]: string } = {};
    (reads || []).forEach(r => { readMap[r.sortie_id] = r.last_read_at; });

    const { data: messages } = await supabase
      .from('messages')
      .select('sortie_id, created_at, user_id')
      .in('sortie_id', allIds)
      .eq('deleted', false);

    const unreadSortieIds = new Set<string>();
    (messages || []).forEach(m => {
      if (m.user_id === user.id) return;
      const lastRead = readMap[m.sortie_id];
      if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
        unreadSortieIds.add(m.sortie_id);
      }
    });

    setUnreadConversations(unreadSortieIds.size);
  }, []);

  useEffect(() => {
    // Vérifie la session existante au démarrage
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        await checkOnboarding(session.user.id);
        await checkUnreadConversations();
        await registerPushToken(session.user.id);
      }
      setLoading(false);
    });

    // Écoute les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        await checkOnboarding(session.user.id);
        await checkUnreadConversations();
        await registerPushToken(session.user.id);
      }
    });

    // Listener : notification reçue quand l'app est au premier plan
    const foregroundSub = Notifications.addNotificationReceivedListener(() => {
      checkUnreadConversations();
    });

    return () => {
      subscription.unsubscribe();
      foregroundSub.remove();
    };
  }, []);

  // Rafraîchit le badge périodiquement (toutes les 15s) tant que connecté
  useEffect(() => {
    if (!isLoggedIn || needsOnboarding) return;
    const interval = setInterval(checkUnreadConversations, 15000);
    return () => clearInterval(interval);
  }, [isLoggedIn, needsOnboarding, checkUnreadConversations]);

  // Écran de chargement pendant la vérification de session
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F3FF', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('./assets/logo_makker.png')}
          style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 20 }}
          resizeMode="contain"
        />
        <ActivityIndicator color="#5B52F0" size="large" />
      </View>
    );
  }

  if (!isLoggedIn) return <AuthScreen onLogin={() => setIsLoggedIn(true)} />;

  if (needsOnboarding) {
    return <OnboardingScreen onFinish={() => setNeedsOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#DDD8FF',
            height: 80,
            paddingBottom: 16,
            paddingTop: 4,
          },
          tabBarActiveTintColor: '#5B52F0',
          tabBarInactiveTintColor: '#8888bb',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused }) => {
            if (route.name === 'Create') return null;
            const icon = ICONS[route.name as keyof typeof ICONS];
            return (
              <View>
                <Image
                  source={icon}
                  style={{ width: 36, height: 36, opacity: focused ? 1 : 0.5 }}
                  resizeMode="contain"
                />
                {route.name === 'Messages' && unreadConversations > 0 && (
                  <View style={{
                    position: 'absolute', top: -2, right: -4,
                    minWidth: 16, height: 16, borderRadius: 8,
                    backgroundColor: '#e05c3a', alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#fff',
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                      {unreadConversations > 9 ? '9+' : unreadConversations}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: 'Feed' }} />
        <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map' }} />
        <Tab.Screen
          name="Create"
          component={CreateScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: () => (
              <View style={{
                width: 46, height: 46, borderRadius: 13,
                backgroundColor: '#5B52F0',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 5,
                shadowColor: '#5B52F0', shadowOpacity: 0.5,
                shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              }}>
                <Image
                  source={require('./assets/icons/create_icon.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
            ),
          }}
        />
        <Tab.Screen name="Messages" options={{ tabBarLabel: 'Messages' }}>
          {() => <MessagesScreen onConversationsUpdated={checkUnreadConversations} />}
        </Tab.Screen>
        <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profil' }}>
          {() => <ProfileScreen onForceOnboarding={() => setNeedsOnboarding(true)} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}