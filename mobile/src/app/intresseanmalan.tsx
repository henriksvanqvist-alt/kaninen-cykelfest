import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAMES = [
  // Damer
  'Linda Adwall',
  'Linda Ahlgren',
  'Camilla Ahlsson',
  'Ann-Carine Alm',
  'Jenny Andersson Collby',
  'Christina Asciutto',
  'Malin Aspnäs',
  'Caroline Axland',
  'Kajsa Bennbom Lindner',
  'Sofie Bergendahl',
  'Sofia Bergvall',
  'Jenny Bexell',
  'Carolina Björklund',
  'Sara Blomberg',
  'Stina Bohman',
  'Ida Brantefors',
  'Therese Bång',
  'Ywonne Bölja',
  'Katarina Börling',
  'Karin Eckerbom',
  'Marie Eklöf',
  'Jennie Ekstrand',
  'Victoria Enkvist',
  'Ulrika Eriksson',
  'Elsa Erixon',
  'Cecilia Fernholm',
  'Helene Folkunger',
  'Victoria Fröjd',
  'Sara Fäldt',
  'Sabine Gebert Persson',
  'Charlotte Gelin Bornudd',
  'Julia Gomez',
  'Anna Gustafsson',
  'Sara Hansson',
  'Eva Hartman-Juhlin',
  'Jenny Hedberg',
  'Sofia Hedman',
  'Ulrica Hedman',
  'Maria Hellman',
  'Linda Hinners',
  'Anna Hårdstedt',
  'Lisa Illiminsky',
  'Malin Jarvius',
  'Lena Joerö',
  'Lena Jonsson',
  'Emma Julin',
  'Karin Kauppi',
  'Annika Kits',
  'Anette Kravik',
  'Cecilia Krona',
  'Mari Kumilen',
  'Anne Lagerström',
  'Pia Lansåker',
  'Ellen Leijon',
  'Ingela Lennerstrand',
  'Sofia Lernskog',
  'Anna Lidenholm',
  'Lena Liljeström',
  'Kajsa Lindner Bennbom',
  'Marie Linton',
  'Cecilia Lund',
  'Linda Lundberg',
  'Jennifer Lundell',
  'Eva Lundesjö',
  'Regina Löwenhielm',
  'Maria Mani',
  'Nina Martinell',
  'Marie-Louise Mattsson',
  'Deborah McGott',
  'Marie Meurling',
  'Milla Mohr',
  'Helena Nordholm',
  'Sanna Nowinski',
  'Cecilia Olsson',
  'Malin Olsson',
  'Kristina Overend',
  'Eva Penno',
  'Helena Pettersson',
  'Nina Pettersson',
  'Veronica Pettersson',
  'Monika Rahm',
  'Ulrica Riedel',
  'Åsa Rising',
  'Annelie Rydén',
  'Linda Ryttlefors',
  'Marit Schwalbe',
  'Monica Segelsjö',
  'Ellen Stavbom',
  'Christina Stenhammar',
  'Anna Stenkvist',
  'Carina Strandberg',
  'Agneta Stridh Olsson',
  'Yvonne Ström Åkerblom',
  'Camilla Svanqvist',
  'Åsa Svärd',
  'Hanna Söderberg',
  'Fredrik Sörbom',
  'Erika Terao',
  'Mia Thörner Vidinghoff',
  'Anna-Lisa Tiensuu',
  'Camilla Törnberg',
  'Malin Uppströmer Eklöf',
  'Annika Vinnersten',
  'Anna Viring',
  'Johanna Viring Till',
  'Åsa Wallander Wetterqvist',
  'Carolina Wistrand',
  'Lina Åkerblom',
  'Maria Öfverberg Eriksson',
  'Katarina Örnkloo',
  // Herrar
  'Daniel Adwall',
  'Tobias Ahlgren',
  'Fredrik Ahlsson',
  'Sigge Lind',
  'Daniel Andersson Collby',
  'Giuseppe Asciutto',
  'Johan Aspnäs',
  'Oscar Diös',
  'Mathias Lindner',
  'Mattias Hansson',
  'Tomas Bergvall',
  'Marcus Lindholm',
  'Gustaf Björklund',
  'Magnus Blomberg',
  'Peter Bohman',
  'Henrik Åberg',
  'Igor Iszqubel',
  'Daniel Stein',
  'Marcus Börling',
  'Per Eckerbom',
  'Sven-Åke Eklöf',
  'Christofer Ekstrand',
  'Tommy Enkvist',
  'Juppe Carlsson',
  'Per Erixon',
  'LG Lundgren',
  'Johan Folkunger',
  'David Fröjd',
  'Mattias Fäldt',
  'Ronny Persson',
  'Mikael Gelin',
  'Per Johan Blomberg',
  'Anders Gustafsson',
  'Fredrik Hansson',
  'Christopher Juhlin',
  'Andreas Larsson',
  'Anders Hedman',
  'Peter Stenlund',
  'Mats Hellman',
  'Mika Hinners',
  'Markus Haukkala',
  'Michael Illiminsky',
  'Jonas Jarvius',
  'Jörgen Joerö',
  'Jörgen Jonsson',
  'Michell Julin',
  'Arvid Kauppi',
  'Marcus Andersson',
  'Micke Kravik',
  'Niclas Krona',
  'Svante Kumlien',
  'Pär Lansåker',
  'Jörgen Leijon',
  'Johan Lennerstrand',
  'Daniel Årvik',
  'Håkan Lidenholm',
  'Per Liljeström',
  'Mattias Lindner',
  'Hans Linton',
  'Mattias Lund',
  'Johan Lundberg',
  'Thony Lundell',
  'Anders Boström',
  'Fredrik Löwenhielm',
  'Kevin Mani',
  'Magnus Martinell',
  'Per Mattsson',
  'David McGott',
  'Lars Meurling',
  'Matthias Mohr',
  'Paul Nordholm',
  'Daniel Nowinski',
  'Calle Håkansson',
  'Tobias Norström',
  'John Overend',
  'Hendrik Penno',
  'Börje Pettersson',
  'Arne Pettersson',
  'Magnus Rahm',
  'Joakim Riedel',
  'Anna Rising',
  'William Rydén',
  'Mats Ryttlefors',
  'Patrik Schwalbe',
  'Olov Duvernoy',
  'Tomas Stavbom',
  'Johan Stenhammar',
  'Ingemar Eriksson',
  'Ralf Olsson',
  'Jan Åkerblom',
  'Henrik Svanqvist',
  'Björn Hellman',
  'Magnus Söderberg',
  'Camilla Scheinert',
  'Peter Tedeholm',
  'Tomas Vidinghoff',
  'Stefan Tiensuu',
  'Martin Stenport',
  'Mattias Eklöf',
  'Thomas Vinnersten',
  'Anders Viring',
  'Robert Till',
  'Fredrik Wetterqvist',
  'Anders Wistrand',
  'Magnus Åkerblom',
  'PO Eriksson',
  'Niklas Örnkloo',
  'Giorgio Gallettini',
  'Tomas Gustafsson',
  'Jens Pettersson',
];

interface PersonEntry {
  display: string; // "Andersson, Filip"
  lastName: string;
}

function toEntries(names: string[]): PersonEntry[] {
  return names.map((name) => {
    const parts = name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.length >= 2 ? parts.slice(1).join(' ') : parts[0];
    const display = parts.length >= 2 ? `${lastName} ${firstName}` : name;
    return { display, lastName };
  });
}

function buildSections(entries: PersonEntry[]): { letter: string; entries: PersonEntry[] }[] {
  const sorted = [...entries].sort((a, b) =>
    a.lastName.localeCompare(b.lastName, 'sv')
  );
  const map = new Map<string, PersonEntry[]>();
  for (const entry of sorted) {
    const letter = entry.lastName[0].toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(entry);
  }
  return Array.from(map.entries()).map(([letter, sectionEntries]) => ({ letter, entries: sectionEntries }));
}

export default function IntresseanmalanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sections = buildSections(toEntries(NAMES));

  return (
    <View style={styles.root} testID="intresseanmalan-screen">
      {/* HEADER */}
      <LinearGradient
        colors={['#1a4a45', '#0a2220']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Diagonal texture stripes */}
        <View style={styles.headerTexture} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={[styles.textureStripe, { left: i * 28 - 120 }]} />
          ))}
        </View>

        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="back-button"
        >
          <ChevronLeft size={22} color="#A8D4B8" strokeWidth={2} />
        </Pressable>

        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Intresseanmälan</Text>
          <Text style={styles.headerSubtitle}>Kaninens Cykelfest 2026</Text>
        </View>
      </LinearGradient>

      {/* LIST */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        testID="names-scroll"
      >
        {/* Info label */}
        <Text style={styles.introLabel}>
          Dessa personer har anmält intresse för Cykelfest 2026.
        </Text>

        <View style={styles.card}>
          {sections.map((section, si) => (
            <View key={section.letter}>
              {/* Letter section header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLetter}>{section.letter}</Text>
                <View style={styles.sectionLine} />
              </View>

              {/* Names in this section */}
              {section.entries.map((entry: PersonEntry, ni: number) => {
                const isLast = si === sections.length - 1 && ni === section.entries.length - 1;
                return (
                  <View key={entry.display}>
                    <View style={styles.nameRow} testID={`name-row-${entry.display}`}>
                      <Text style={styles.nameText}>{entry.display}</Text>
                    </View>
                    {!isLast ? <View style={styles.divider} /> : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={styles.countNote}>{NAMES.length} personer har anmält intresse</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E5DFD1',
  },

  // HEADER
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTexture: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  textureStripe: {
    position: 'absolute',
    top: -200,
    bottom: -200,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.022)',
    transform: [{ rotate: '-55deg' }],
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
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  headerTextBlock: {
    gap: 4,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#F5EFE0',
    lineHeight: 30,
  },
  headerSubtitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.5,
    color: 'rgba(168,212,184,0.7)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // SCROLL
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  // INTRO
  introLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12.5,
    color: '#7A7060',
    lineHeight: 18,
    marginBottom: 14,
  },

  // CARD
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 10,
    backgroundColor: '#F8F5EE',
  },
  sectionLetter: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: '#1C4F4A',
    letterSpacing: 0.5,
    minWidth: 14,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E0CC',
  },

  // NAME ROW
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: '#1C4F4A',
    letterSpacing: 0.3,
  },
  nameText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#2A2A2A',
    flex: 1,
  },

  // DIVIDER
  divider: {
    height: 1,
    backgroundColor: '#F0EAD8',
    marginLeft: 64,
  },

  // COUNT NOTE
  countNote: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 16,
  },
});
