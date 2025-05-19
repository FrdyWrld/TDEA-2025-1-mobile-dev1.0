import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './context/AppContext';
import AppNavigation from './navigation/AppNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

export default function App() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <NavigationContainer>
            <AppNavigation/>
          </NavigationContainer>
        </ActionSheetProvider>
      </SafeAreaProvider>
    </AppProvider>
  );
}
