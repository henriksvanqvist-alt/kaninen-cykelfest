import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { STOPS } from '@/data/programStops';
import { useAppStore } from '@/lib/state/store';
import { api } from '@/lib/api/api';
import { formatLastFirst, getLastName } from '@/lib/nameFormatting';

type HostGuest = { id?: string; participantName: string; dietary: string | null };
type HostAssignment = {
  id: string; type: string; pin: string; hostNames: string;
  address: string | null; meal: string | null; arrivalTime: string | null;
  hostNotes: string | null; guestInfo: string | null; updatedAt: string;
  guests: HostGuest[];
};

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const todayStr = new Date().toISOString().split('T')[0];

  // Ladda settings om de saknas (t.ex. om användaren navigerar hit direkt)
  useEffect(() => {
    if (Object.keys(settings).length === 0) {
      api.get<Record<string, string>>('/api/cykelfest/settings')
        .then(data => { if (data) setSettings(data); })
        .catch(() => {});
    }
  }, []);
  const isForrat = id === 'forrat';
  const isMiddag = id === 'middag';
  const isEfterratt = id === 'efterratt';

  const unlockKey = isForrat ? 'unlock_steg5' : isMiddag ? 'unlock_steg7' : isEfterratt ? 'unlock_steg8' : 'unlock_steg5';
  const unlockDateStr = settings[unlockKey]?.split('T')[0] ?? null;
  const adressUnlocked = unlockDateStr ? todayStr >= unlockDateStr : false;
  const adressDateLabel = (() => {
    const val = settings[unlockKey];
    if (!val) return 'festdagen';
    const d = new Date(val.includes('T') ? val : val.replace(/-/g, '/'));
    if (isNaN(d.getTime())) return 'festdagen';
    const datePart = d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
    const hasTime = val.includes('T');
    if (hasTime) {
      const timePart = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      return `${datePart} kl. ${timePart}`;
    }
    return datePart;
  })();

  // Gästuppslagning — för middagskortet
  const [guestList, setGuestList] = useState<string[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<HostAssignment[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const cachedProgramStops = useAppStore((s) => s.programStops);
  const setProgramStops = useAppStore((s) => s.setProgramStops);

  // Använd cachad data — hämta bara om cachen är tom
  useEffect(() => {
    if (Object.keys(cachedProgramStops).length > 0) return;
    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (!baseUrl) return;
    fetch(`${baseUrl}/api/cykelfest/program-stops`)
      .then((res) => res.json())
      .then((json) => {
        const arr: { id: string; description?: string; rules?: string; scoring?: string }[] = json?.data ?? json ?? [];
        const record: Record<string, { id: string; description?: string; rules?: string; scoring?: string }> = {};
        for (const item of arr) {
          record[item.id] = { id: item.id, description: item.description || undefined, rules: item.rules || undefined, scoring: item.scoring || undefined };
        }
        setProgramStops(record);
      })
      .catch(() => {});
  }, []);

  // Ladda gästlista när förrätt/middag/efterrätt-sidan öppnas
  useEffect(() => {
    if (!isForrat && !isMiddag && !isEfterratt) return;
    const meal = isForrat ? 'Förrätt' : isMiddag ? 'Varmrätt' : 'Efterrätt';
    setListLoading(true);
    api.get<string[]>(`/api/cykelfest/host-assignments/guests-list?meal=${encodeURIComponent(meal)}`)
      .then(list => setGuestList(list ?? []))
      .catch(() => setGuestList([]))
      .finally(() => setListLoading(false));
  }, [id]);

  async function handleSelectName(name: string) {
    const meal = isForrat ? 'Förrätt' : isMiddag ? 'Varmrätt' : 'Efterrätt';
    setSelectedName(name);
    setShowDetail(false);
    setDetailLoading(true);
    try {
      const result = await api.get<{ assignments: HostAssignment[]; participantInfo: unknown }>(
        `/api/cykelfest/host-assignments/by-guest/${encodeURIComponent(name)}?meal=${encodeURIComponent(meal)}`
      );
      setAssignments(result?.assignments ?? []);
      setShowDetail(true);
    } catch {
      setAssignments([]);
      setShowDetail(true);
    } finally {
      setDetailLoading(false);
    }
  }

  const filteredList = searchQuery.trim().length > 0
    ? guestList.filter(n => n.toLowerCase().includes(searchQuery.toLowerCase()) || formatLastFirst(n).toLowerCase().includes(searchQuery.toLowerCase()))
    : guestList;

  // Sort by last name (slice(1)) and memoize to avoid recomputing on every render
  const sortedList = useMemo(() => [...filteredList].sort((a, b) => {
    return getLastName(a).localeCompare(getLastName(b), 'sv');
  }), [filteredList]);

  const stop = STOPS.find((s) => s.id === id);

  if (!stop) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.notFound}>Hittades inte</Text>
      </View>
    );
  }

  const merged = { ...stop, ...cachedProgramStops[stop.id] };

  const cardBg =
    stop.cardType === 'activity'
      ? '#F0FAF5'
      : stop.cardType === 'party'
      ? '#E8F0EF'
      : '#FFFFFF';

  return (
    <View style={styles.container} testID={`program-detail-${stop.id}`}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#1C4F4A', '#2A6B64']}
        style={[styles.header, { paddingTop: insets.top + 6 }]}
      >
        {/* Back button */}
        <TouchableOpacity
          testID="back-button"
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color="#A8D4B8" strokeWidth={2} />
        </TouchableOpacity>

        {/* Icon + title */}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{stop.label}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: stop.accentColor }]} />

        {/* Description/tävling — alltid överst */}
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>{stop.cardType === 'activity' ? 'TÄVLING' : 'BESKRIVNING'}</Text>
          <Text style={styles.descHeading}>{merged.description}</Text>
        </View>

        {/* Tid — visas bara för aktiviteter och avslutningsfest */}
        {!isMiddag && !isForrat && !isEfterratt && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>TID</Text>
              <Text style={styles.descText}>{stop.startTime} – {stop.endTime}</Text>
            </View>
          </>
        )}

        {/* Gästuppslagning — under beskrivning för förrätt, middag och efterrätt */}
        {!!(isForrat || isMiddag || isEfterratt) && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>{isForrat ? 'VAR ÄTER JAG FÖRRÄTT?' : isMiddag ? 'VAR ÄTER JAG MIDDAG?' : 'VAR ÄTER JAG EFTERRÄTT?'}</Text>
              {!adressUnlocked ? (
                <Text style={styles.descText}>Tillgänglig från {adressDateLabel}</Text>
              ) : showDetail && selectedName ? (
                <View>
                  <TouchableOpacity
                    style={styles.backToListBtn}
                    onPress={() => { setShowDetail(false); setSelectedName(null); }}
                  >
                    <ChevronLeft size={16} color="#F5EFE0" strokeWidth={2} />
                    <Text style={styles.backToListText}>Tillbaka till listan</Text>
                  </TouchableOpacity>
                  <Text style={styles.detailName}>{selectedName}</Text>
                  {assignments.length === 0 ? (
                    <Text style={[styles.descText, { marginTop: 8 }]}>Ingen placering hittades. Kontakta kaninen.</Text>
                  ) : assignments.map((a) => {
                    return (
                      <View key={a.id} style={{ marginTop: 12, gap: 8 }}>
                        <View style={styles.infoCard}>
                          <View style={styles.infoRow}><Text style={styles.infoRowLabel}>VÄRD</Text><Text style={styles.infoRowValue}>{a.hostNames}</Text></View>
                          {a.address ? <><View style={styles.infoDivider} /><View style={styles.infoRow}><Text style={styles.infoRowLabel}>ADRESS</Text><Text style={styles.infoRowValue} numberOfLines={2}>{a.address}</Text></View></> : null}
                          {a.arrivalTime ? <><View style={styles.infoDivider} /><View style={styles.infoRow}><Text style={styles.infoRowLabel}>ANKOMSTTID</Text><Text style={styles.infoRowValue}>{a.arrivalTime}</Text></View></> : null}
                        </View>
                        {a.guests.length > 0 ? (
                          <View style={styles.infoCard}>
                            <View style={styles.infoRow}><Text style={styles.infoRowLabel}>GÄSTER</Text></View>
                            <View style={styles.infoDivider} />
                            {a.guests.map((g, i) => (
                              <View key={g.id ?? g.participantName}>
                                <View style={styles.infoRow}>
                                  <Text style={[styles.infoRowValue, g.participantName === selectedName && { color: '#C0392B', fontFamily: 'DMSans_600SemiBold' }]}>{g.participantName}</Text>
                                  {g.dietary ? <Text style={styles.dietaryTag}>{g.dietary}</Text> : null}
                                </View>
                                {i < a.guests.length - 1 ? <View style={styles.infoDivider} /> : null}
                              </View>
                            ))}
                          </View>
                        ) : null}
                        {a.guestInfo ? (
                          <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoRowLabel}>INFO FRÅN VÄRDEN</Text>
                              <Text style={styles.infoRowValue}>{a.guestInfo}</Text>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View>
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Sök ditt namn..."
                    placeholderTextColor="#B0A890"
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                  {listLoading ? (
                    <ActivityIndicator size="small" color="#1C4F4A" style={{ marginTop: 12 }} />
                  ) : (
                    <View style={styles.listCard}>
                      {sortedList.map((name, i) => (
                        <View key={name}>
                          <Pressable
                            style={[styles.nameRow, selectedName === name && styles.nameRowSelected]}
                            onPress={() => handleSelectName(name)}
                          >
                            {detailLoading && selectedName === name ? (
                              <ActivityIndicator size="small" color="#1C4F4A" style={{ marginRight: 8 }} />
                            ) : null}
                            <Text style={[styles.nameText, selectedName === name && styles.nameTextSelected]}>{formatLastFirst(name)}</Text>
                          </Pressable>
                          {i < sortedList.length - 1 ? <View style={styles.nameDivider} /> : null}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        {merged.rules ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>{stop.id === 'avslutningsfesten' ? 'PRAKTISK INFORMATION' : 'REGLER'}</Text>
              <Text style={styles.descText}>{merged.rules}</Text>
            </View>
          </>
        ) : null}

        {merged.scoring ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>{stop.id === 'avslutningsfesten' ? 'ÖVRIG INFORMATION' : 'POÄNGRÄKNING'}</Text>
              <Text style={styles.descText}>{merged.scoring}</Text>
            </View>
          </>
        ) : null}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5DFD1',
  },
  notFound: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: '#7A7060',
  },

  // Header
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
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  headerContent: {
    gap: 4,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  headerIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#F5EFE0',
    lineHeight: 30,
  },
  headerEyebrow: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 22,
  },

  // Accent bar
  accentBar: {
    height: 3,
    borderRadius: 2,
    marginBottom: 28,
    width: 40,
  },

  // Time block
  timeBlock: {
    marginBottom: 24,
  },
  timeLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    letterSpacing: 2,
    color: '#9A8E78',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeValue: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 32,
    color: '#2A2A2A',
    lineHeight: 36,
  },
  descHeading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 32,
    color: '#2A2A2A',
    lineHeight: 36,
  },
  timeDash: {
    height: 1.5,
    width: 20,
    backgroundColor: '#C8BFA8',
  },

  divider: {
    height: 1,
    backgroundColor: '#DDD5C0',
    marginBottom: 24,
  },

  // Info blocks
  infoBlock: {
    marginBottom: 24,
  },
  infoLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    letterSpacing: 2,
    color: '#9A8E78',
    marginBottom: 8,
  },
  descText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: '#4A4030',
    lineHeight: 24,
  },

  // Accent card
  accentCard: {
    borderRadius: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2A2A2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accentCardIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  accentCardLabel: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    marginBottom: 4,
  },
  accentCardTime: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: '#9A8E78',
    letterSpacing: 1,
  },
  gastLookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  gastLookupIcon: {
    fontSize: 22,
  },
  gastLookupLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#2A2A2A',
    marginBottom: 2,
  },
  gastLookupSub: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    letterSpacing: 1,
  },
  gastLookupChevron: {
    fontSize: 22,
    color: '#9A8E78',
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#1C4F4A',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  backToListText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#F5EFE0',
  },
  detailName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#C0392B',
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: '#F5EFE0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  infoRow: {
    paddingVertical: 10,
    gap: 2,
  },
  infoRowLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    letterSpacing: 0.8,
  },
  infoRowValue: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#2A2A2A',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E8E0CC',
  },
  searchInput: {
    backgroundColor: '#F5EFE0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#2A2A2A',
    marginBottom: 8,
  },
  listCard: {
    backgroundColor: '#F5EFE0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  nameRowSelected: {
    backgroundColor: '#EAF4ED',
  },
  dietaryTag: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#C0392B',
    marginTop: 2,
  },
  nameText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#2A2A2A',
  },
  nameTextSelected: {
    fontFamily: 'DMSans_700Bold',
    color: '#1C4F4A',
  },
  nameDivider: {
    height: 1,
    backgroundColor: '#E8E0CC',
  },
});
