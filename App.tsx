import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import FeedScreen from './screens/FeedScreen';
import MapScreen from './screens/MapScreen';
import CreateScreen from './screens/CreateScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';
import { supabase } from './lib/supabase';

const Tab = createBottomTabNavigator();

function TabIcon({ color, sport }: { color: string, sport: string }) {
  const icons: { [key: string]: string } = {
    Feed: '⊞', Map: '◉', Create: '+', Messages: '💬', Profile: '👤'
  };
  return <Text style={{ fontSize: sport === 'Create' ? 24 : 18, color }}>{icons[sport]}</Text>;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Vérifie la session existante au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Écoute les changements de session (connexion / déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          tabBarInactiveTintColor: '#bbb',
          tabBarIcon: ({ color }) => <TabIcon color={color} sport={route.name} />,
        })}
      >
        <Tab.Screen name="Feed" component={FeedScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen
          name="Create"
          component={CreateScreen}
          options={{
            tabBarIcon: () => (
              <View style={{
                width: 50, height: 50, borderRadius: 14,
                backgroundColor: '#5B52F0',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 30,
                shadowColor: '#5B52F0', shadowOpacity: 0.4,
                shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}>
                <Text style={{ fontSize: 26, color: '#fff', lineHeight: 30 }}>+</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}