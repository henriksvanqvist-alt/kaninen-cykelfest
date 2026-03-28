import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

if (Platform.OS !== 'web') SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutNav() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="host" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="nyheter" options={{ headerShown: false }} />
        <Stack.Screen name="kalendarium" options={{ headerShown: false }} />
        <Stack.Screen name="intresseanmalan" options={{ headerShown: false }} />
        <Stack.Screen name="bekraftad-anmalan" options={{ headerShown: false }} />
        <Stack.Screen name="faq" options={{ headerShown: false }} />
        <Stack.Screen name="ledtrad-detail" options={{ headerShown: false }} />
        <Stack.Screen name="destination-quiz" options={{ headerShown: false }} />
        <Stack.Screen name="aterkoppling" options={{ headerShown: false }} />
        <Stack.Screen name="program/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="mitt-lag" options={{ headerShown: false }} />
        <Stack.Screen name="lag/[name]" options={{ headerShown: false }} />
        <Stack.Screen name="nyhet/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="gast-lookup" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded && Platform.OS !== 'web') return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#1C4F4A' }}>
        <KeyboardProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
          <PwaInstallPrompt />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
