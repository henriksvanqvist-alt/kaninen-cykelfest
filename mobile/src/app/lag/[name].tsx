import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/api';

const TEAM_INFO: Record<string, { emoji: string; colors: [string, string]; description: string }> = {
  'Charter':            { emoji: '✈️',  colors: ['#2563A8', '#1A4A7A'], description: 'Solstolen är bokad, drinken är beställd och check-in är redan ett minne blott. Charterresenären vet vad hen vill ha — sol, hav och all-inclusive utan krångel. Skål!' },
  'Safari':             { emoji: '🦁',  colors: ['#8B5E1A', '#6B4510'], description: 'Uppe innan gryningen, kikaren runt halsen och en termoskanna kaffe i handen. Safarilaget jagar äventyr i vildmarken — lejonet kan vänta, men soluppgången inte.' },
  'Fjällvandring':      { emoji: '⛰️',  colors: ['#3A5A4A', '#2A4A3A'], description: 'Kartan är inlamnad, ryggsäcken är packad och blåsorna är redan välkomna. Fjällvandrarna klättrar uppåt med bestämt steg och väldigt obekväma skor.' },
  'Tågluff':            { emoji: '🚂',  colors: ['#5A3A2A', '#3A2A1A'], description: 'Interrail-kortet i fickan och hela Europa som lekplats. Tågluffarna vet att det bästa med resan är allt som händer mellan a och b — och kanske lite av b också.' },
  'Camping':            { emoji: '⛺',  colors: ['#2A5A3A', '#1A4A2A'], description: 'Tältet är uppslaget på skeva pinnar, maten smakar bättre utomhus och myggorna är ovälkomna gäster. Campinglaget lever nära naturen — på gott och ont.' },
  'Träningsresa':       { emoji: '🏋️',  colors: ['#4A2A5A', '#3A1A4A'], description: 'Semestern är inte ett skäl att vila — den är ett skäl att träna på en ny plats. Träningsreselaget hittar gymmet innan de hittar stranden, och det är de stolta över.' },
  'Backpacking':        { emoji: '🎒',  colors: ['#7A4A1A', '#5A3A0A'], description: 'Ryggsäcken väger 14 kilo och innehåller allt man behöver för tre månader. Backpackinglaget sover på vandrarhem, äter på gatukök och har fler stämplar i passet än de kan räkna.' },
  'Kryssning':          { emoji: '🚢',  colors: ['#1A4A6A', '#0A3A5A'], description: 'Buffén är öppen dygnet runt, underhållningen börjar om en timme och däcket erbjuder den vackraste solnedgången på Östersjön. Kryssningslaget vet hur man lever.' },
  'Alpresa':            { emoji: '🎿',  colors: ['#3A4A6A', '#2A3A5A'], description: 'Pistkortet hänger runt halsen, après-skiden väntar i dalen och snön är perfekt packad. Alpreselaget åker utför med stil — och reser sig lika stiligt om det går snett.' },
  'Club 33':            { emoji: '🍹',  colors: ['#6A2A3A', '#5A1A2A'], description: 'Det räcker med 33 grader, en pool och ett bra sällskap. Club 33 vet att den bästa semestern inte kräver ett program — bara rätt människor på rätt plats.' },
};

type BackendTeam = {
  id: string;
  name: string;
  participants?: { id: string; name: string }[];
};

export default function LagDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name, highlight } = useLocalSearchParams<{ name: string; highlight?: string }>();
  const decodedName = decodeURIComponent(name ?? '');
  const highlightName = highlight ? decodeURIComponent(highlight).toLowerCase().trim() : null;
  const info = TEAM_INFO[decodedName];

  const { data: teams, isLoading } = useQuery<BackendTeam[]>({
    queryKey: ['cykelfest-teams-members'],
    queryFn: () => api.get<BackendTeam[]>('/api/cykelfest/teams'),
    staleTime: 5 * 60 * 1000,
  });

  const team = teams?.find(
    (t) => t.name.toLowerCase() === decodedName.toLowerCase()
  );
  const members = team?.participants ?? [];

  if (!info) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={info.colors} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#A8D4B8" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
        <Text style={styles.headerTitle}>{decodedName}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {/* Beskrivning */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.descCard}>
          <Text style={styles.descText}>{info.description}</Text>
        </Animated.View>

        {/* Medlemmar */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text style={styles.sectionLabel}>RESENÄRER</Text>
          {isLoading ? (
            <ActivityIndicator color="#9A8E78" style={{ marginTop: 20 }} />
          ) : members.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Inga resenärer tilldelade ännu.</Text>
            </View>
          ) : (
            <View style={styles.membersCard}>
              {members.map((m, i) => {
                const isHighlighted = highlightName !== null && m.name.toLowerCase().includes(highlightName);
                return (
                  <View key={m.id} style={[styles.memberRow, i < members.length - 1 && styles.memberBorder]}>
                    <Text style={[styles.memberName, isHighlighted && styles.memberNameHighlighted]}>{m.name}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    paddingBottom: 10,
    paddingHorizontal: 22,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,212,184,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(168,212,184,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  headerEyebrow: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#FFFFFF',
    lineHeight: 30,
  },
  headerSub: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  descCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  descText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#4A4035',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: '#9A8E78',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  membersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  memberRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  memberBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDE7D8',
  },
  memberName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#3A3228',
  },
  memberNameHighlighted: {
    color: '#C0392B',
    fontFamily: 'DMSans_600SemiBold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#BDB19E',
    fontStyle: 'italic',
  },
});
