import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';
import FeedScreen from './screens/FeedScreen';
import MapScreen from './screens/MapScreen';
import CreateScreen from './screens/CreateScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ color, sport }: { color: string, sport: string }) {
  const icons: { [key: string]: string } = {
    Feed: '⊞', Map: '◉', Create: '+', Messages: '💬', Profile: '👤'
  };
  return <Text style={{ fontSize: sport === 'Create' ? 24 : 18, color }}>{icons[sport]}</Text>;
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#eaecf0',
            height: 70,
            paddingBottom: 12,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#1bdf8a',
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
                backgroundColor: '#1bdf8a',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#1bdf8a', shadowOpacity: 0.4,
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