import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { api } from '@/lib/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HostGuest = { id?: string; participantName: string; dietary: string | null };
type HostAssignment = {
  id: string; type: string; pin: string; hostNames: string;
  address: string | null; meal: string | null; arrivalTime: string | null;
  hostNotes: string | null; guestInfo: string | null; updatedAt: string;
  guests: HostGuest[];
};
type GuestLookupResult = {
  assignments: HostAssignment[];
  participantInfo: { phone: string | null; dietary: string | null } | null;
};

const LAST_SELECTED_GUEST_KEY = 'gast_lookup_last_name';

export default function GastLookupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [guestList, setGuestList] = useState<string[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<HostAssignment[]>([]);
  const [participantInfo, setParticipantInfo] = useState<{ phone: string | null; dietary: string | null } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    async function loadList() {
      try {
        const list = await api.get<string[]>('/api/cykelfest/host-assignments/guests-list');
        setGuestList(list ?? []);
      } catch {
        setGuestList([]);
      } finally {
        setListLoading(false);
      }
    }
    loadList();
  }, []);

  async function handleSelectName(name: string) {
    setSelectedName(name);
    setShowDetail(false);
    setDetailLoading(true);
    try {
      const result = await api.get<GuestLookupResult>(
        `/api/cykelfest/host-assignments/by-guest/${encodeURIComponent(name)}`
      );
      setAssignments(result?.assignments ?? []);
      setParticipantInfo(result?.participantInfo ?? null);
      setShowDetail(true);
      await AsyncStorage.setItem(LAST_SELECTED_GUEST_KEY, name);
    } catch {
      setAssignments([]);
      setParticipantInfo(null);
      setShowDetail(true);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleBackToList() {
    setShowDetail(false);
    setSelectedName(null);
    setAssignments([]);
    setParticipantInfo(null);
  }

  const filteredList = searchQuery.trim().length > 0
    ? guestList.filter(name =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : guestList;

  return (
    <View style={styles.container} testID="gast-lookup-screen">
      <LinearGradient colors={['#1A3A6B', '#0F2347']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <ChevronLeft size={22} color="#A8D4B8" />
        </TouchableOpacity>
        <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
        <Text style={styles.headerTitle}>Mitt nästa stopp</Text>
      </LinearGradient>

      {showDetail && selectedName ? (
        <DetailView
          name={selectedName}
          assignments={assignments}
          participantInfo={participantInfo}
          onBack={handleBackToList}
        />
      ) : (
        <View style={styles.listContainer}>
          {/* Search input */}
          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Sök ditt namn..."
              placeholderTextColor="#B0A890"
              autoCorrect={false}
              autoCapitalize="words"
              testID="guest-search-input"
            />
          </View>

          {listLoading ? (
            <View style={styles.loadingContainer} testID="list-loading">
              <ActivityIndicator size="small" color="#1A3A6B" />
              <Text style={styles.loadingText}>Laddar gästlista...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollList}
              contentContainerStyle={[styles.scrollListContent, { paddingBottom: insets.bottom + 32 }]}
              keyboardShouldPersistTaps="handled"
              testID="guest-list"
            >
              {filteredList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim().length > 0
                      ? 'Inga träffar för din sökning.'
                      : 'Gästlistan är tom.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.listCard}>
                  {filteredList.map((name, i) => {
                    const isSelected = name === selectedName;
                    return (
                      <View key={name}>
                        <Pressable
                          style={[styles.nameRow, isSelected && styles.nameRowSelected]}
                          onPress={() => handleSelectName(name)}
                          testID={`guest-row-${i}`}
                        >
                          {detailLoading && isSelected ? (
                            <ActivityIndicator size="small" color="#1C4F4A" style={styles.rowSpinner} testID="row-loading" />
                          ) : null}
                          <Text style={[styles.nameText, isSelected && styles.nameTextSelected]}>
                            {name}
                          </Text>
                        </Pressable>
                        {i < filteredList.length - 1 ? (
                          <View style={styles.nameDivider} />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
              <View style={{ height: 80 }} />
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

function DetailView({
  name,
  assignments,
  participantInfo,
  onBack,
}: {
  name: string;
  assignments: HostAssignment[];
  participantInfo: { phone: string | null; dietary: string | null } | null;
  onBack: () => void;
}) {
  return (
    <ScrollView
      style={styles.detailScroll}
      contentContainerStyle={styles.detailContent}
      testID="detail-view"
    >
      <TouchableOpacity style={styles.backToListBtn} onPress={onBack} testID="back-to-list-btn">
        <ChevronLeft size={14} color="#1A3A6B" />
        <Text style={styles.backToListText}>Avbryt</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DIN PLATS</Text>
        <Text style={styles.detailName}>{name}</Text>
      </View>

      {/* Guest's own contact info from participant record */}
      {(participantInfo?.phone || participantInfo?.dietary) ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DIN INFORMATION</Text>
          <View style={styles.card}>
            {participantInfo?.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>TELEFON</Text>
                <Text style={styles.infoValue}>{participantInfo.phone}</Text>
              </View>
            ) : null}
            {participantInfo?.phone && participantInfo?.dietary ? (
              <View style={styles.infoDivider} />
            ) : null}
            {participantInfo?.dietary ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ALLERGIER / KOST</Text>
                <Text style={[styles.infoValue, { color: '#C4814A' }]}>{participantInfo.dietary}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {assignments.length === 0 ? (
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.emptyDetailText}>
              Ingen placering hittades. Kontakta kaninen.
            </Text>
          </View>
        </View>
      ) : (
        assignments.map((assignment) => {
          const companions = assignment.guests.filter(
            (g) => g.participantName !== name
          );
          return (
            <View key={assignment.id}>
              {/* Main info card */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>INFORMATION</Text>
                <View style={styles.card}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>VÄRD</Text>
                    <Text style={styles.infoValue}>{assignment.hostNames}</Text>
                  </View>

                  {assignment.address ? (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>ADRESS</Text>
                        <Text style={styles.infoValue}>{assignment.address}</Text>
                      </View>
                    </>
                  ) : null}

                  {assignment.meal ? (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>MÅLTID</Text>
                        <Text style={styles.infoValue}>{assignment.meal}</Text>
                      </View>
                    </>
                  ) : null}

                  {assignment.arrivalTime ? (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>ANKOMSTTID</Text>
                        <Text style={styles.infoValue}>{assignment.arrivalTime}</Text>
                      </View>
                    </>
                  ) : null}
                </View>
              </View>

              {/* Fellow guests */}
              {companions.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    MINA RESESÄLLSKAP ({companions.length})
                  </Text>
                  <View style={styles.card}>
                    {companions.map((guest, i) => (
                      <View key={guest.participantName}>
                        <View style={styles.companionRow}>
                          <Text style={styles.companionName}>{guest.participantName}</Text>
                          {guest.dietary ? (
                            <Text style={styles.companionDietary}>{guest.dietary}</Text>
                          ) : null}
                        </View>
                        {i < companions.length - 1 ? (
                          <View style={styles.infoDivider} />
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Host info to guests */}
              {assignment.guestInfo ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>INFO FRÅN VÄRDEN</Text>
                  <View style={styles.card}>
                    <Text style={styles.guestInfoText}>{assignment.guestInfo}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {/* GDPR disclaimer */}
      <View style={styles.gdprSection}>
        <Text style={styles.gdprText}>
          🐰 Kaninen lovar att radera all gästinformation inom 30 dagar efter festen, i enlighet med GDPR. Din data används enbart för att koordinera Kaninens Cykelfest.
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD1' },

  header: {
    paddingTop: 8,
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
    color: '#F5EFE0',
  },

  listContainer: { flex: 1 },

  searchWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F5EFE0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#2A2A2A',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 40,
  },
  loadingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#9A8E78',
  },

  scrollList: { flex: 1 },
  scrollListContent: { paddingHorizontal: 16, paddingBottom: 20 },

  emptyContainer: {
    paddingTop: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#9A8E78',
    textAlign: 'center',
  },

  listCard: {
    backgroundColor: '#F5EFE0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
    marginTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  nameRowSelected: {
    backgroundColor: '#EAF4ED',
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
    marginHorizontal: 0,
  },
  rowSpinner: {
    marginRight: 8,
  },

  // Detail view
  detailScroll: { flex: 1 },
  detailContent: { paddingBottom: 20 },

  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(26,58,107,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(26,58,107,0.15)',
    alignSelf: 'flex-start',
    gap: 4,
  },
  backToListText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#1A3A6B',
  },

  section: { marginHorizontal: 16, marginTop: 16 },
  sectionLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: '#1A2A4A',
    letterSpacing: -0.2,
  },

  card: {
    backgroundColor: '#F5EFE0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
    paddingHorizontal: 14,
  },

  infoRow: {
    paddingVertical: 11,
    gap: 3,
  },
  infoLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#2A2A2A',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E8E0CC',
  },

  companionRow: {
    paddingVertical: 11,
    gap: 3,
  },
  companionName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#2A2A2A',
  },
  companionDietary: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#C4814A',
    marginTop: 1,
  },

  guestInfoText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#2A2A2A',
    lineHeight: 21,
    paddingVertical: 12,
  },

  emptyDetailText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#9A8E78',
    paddingVertical: 14,
    textAlign: 'center',
  },

  gdprSection: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(168,212,184,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(168,212,184,0.3)',
  },
  gdprText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#6B7E6B',
    lineHeight: 17,
    textAlign: 'center',
  },
});
