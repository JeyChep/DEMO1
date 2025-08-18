import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import CropsScreen from './src/screens/CropsScreen';
import LivestockScreen from './src/screens/LivestockScreen';
import PastureScreen from './src/screens/PastureScreen';
import MapScreen from './src/screens/MapScreen';
import { LocationProvider } from './src/context/LocationContext';
import { DataProvider } from './src/context/DataContext';
import { theme } from './src/theme/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

export default function App() {
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
      } else {
        Alert.alert(
          'Location Permission Required',
          'KALRO Selector needs location access to provide accurate agricultural recommendations for your area.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <DataProvider>
        <LocationProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#16a34a" />
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: string;

                  switch (route.name) {
                    case 'Home':
                      iconName = 'home';
                      break;
                    case 'Crops':
                      iconName = 'eco';
                      break;
                    case 'Livestock':
                      iconName = 'pets';
                      break;
                    case 'Pasture':
                      iconName = 'grass';
                      break;
                    case 'Map':
                      iconName = 'map';
                      break;
                    default:
                      iconName = 'help';
                  }

                  return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#16a34a',
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                  backgroundColor: '#ffffff',
                  borderTopColor: '#e5e7eb',
                  height: 60,
                  paddingBottom: 8,
                  paddingTop: 8,
                },
                headerStyle: {
                  backgroundColor: '#16a34a',
                },
                headerTintColor: '#ffffff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              })}
            >
              <Tab.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ title: 'KALRO Selector' }}
              />
              <Tab.Screen 
                name="Crops" 
                component={CropsScreen}
                options={{ title: 'Crop Recommendations' }}
              />
              <Tab.Screen 
                name="Livestock" 
                component={LivestockScreen}
                options={{ title: 'Livestock Recommendations' }}
              />
              <Tab.Screen 
                name="Pasture" 
                component={PastureScreen}
                options={{ title: 'Pasture Recommendations' }}
              />
              <Tab.Screen 
                name="Map" 
                component={MapScreen}
                options={{ title: 'Suitability Map' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </LocationProvider>
      </DataProvider>
    </PaperProvider>
  );
}