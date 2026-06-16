import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Image, ActivityIndicator } from 'react-native';
import FeedScreen from './screens/FeedScreen';
import MapScreen from './screens/MapScreen';
import CreateScreen from './screens/CreateScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';
import { supabase } from './lib/supabase';

const Tab = createBottomTabNavigator();

const ICONS = {
  Feed: require('./assets/icons/feed_icon.png'),
  Map: require('./assets/icons/map_icon.png'),
  Messages: require('./assets/icons/message_icon.png'),
  Profile: require('./assets/icons/profil_icon.png'),
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifie la session existante au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    // Écoute les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
              <Image
                source={icon}
                style={{ width: 36, height: 36, opacity: focused ? 1 : 0.5 }}
                resizeMode="contain"
              />
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
        <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: 'Messages' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}