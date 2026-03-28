import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Pressable,
} from 'react-native';
import { useAsyncButton } from '@/lib/hooks/useAsyncButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { api } from '@/lib/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HOST_PIN_KEY = 'last_host_pin';
export function hostViewedKey(pin: string) { return `host_viewed_${pin}`; }

type HostGuest = { id?: string; participantName: string; dietary: string | null };
type HostAssignment = {
  id: string; type: string; pin: string; hostNames: string;
  address: string | null; meal: string | null; arrivalTime: string | null;
  hostNotes: string | null; guestInfo: string | null;
  updatedAt: string;
  guests: HostGuest[];
};

const PIN_LENGTH = 4;

export default function HostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Host mode state
  const [pinCode, setPinCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hostData, setHostData] = useState<HostAssignment | null>(null);
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const hiddenInputRef = useRef<TextInput>(null);
  const [guestInfoEdit, setGuestInfoEdit] = useState('');
  const [guestInfoSaved, setGuestInfoSaved] = useState(false);
  const saveBtn = useAsyncButton();

  async function handlePinLogin() {
    if (pinCode.length < PIN_LENGTH || pinLoading) return;
    setPinLoading(true);
    try {
      const result = await api.get<HostAssignment>(
        `/api/cykelfest/host-assignments/by-pin/${pinCode}`,
      );
      setHostData(result);
      setGuestInfoEdit(result.guestInfo ?? '');
      setPinError(false);
      setIsLoggedIn(true);
      await AsyncStorage.setItem(HOST_PIN_KEY, pinCode);
      await AsyncStorage.setItem(hostViewedKey(pinCode), new Date().toISOString());
    } catch {
      setPinError(true);
      setPinCode('');
      setTimeout(() => setPinError(false), 1500);
    } finally {
      setPinLoading(false);
    }
  }

  function handlePinChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
    setPinCode(digits);
    setPinError(false);
  }

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (pinCode.length === PIN_LENGTH) {
      handlePinLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinCode]);

  function focusHiddenInput() {
    hiddenInputRef.current?.focus();
  }

  // ─── Login screen ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <View style={styles.container} testID="host-login-screen">
        <LinearGradient colors={['#1A3A6B', '#0F2347']} style={[styles.loginHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
            <ChevronLeft size={22} color="#A8D4B8" />
          </TouchableOpacity>
          <Text style={styles.loginEyebrow}>KANINENS CYKELFEST 2026</Text>
          <Text style={styles.loginTitle}>Mitt värdskap</Text>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
          <View style={styles.loginCard}>

            {/* ── Host PIN section ── */}
            <Text style={styles.loginLabel}>Ange din fyrsiffriga kod som skickas ut via ett SMS. En notifiering om detta utskick kommer att ske under Meddelanden på startsidan.</Text>

            <TextInput
              ref={hiddenInputRef}
              style={styles.hiddenInput}
              value={pinCode}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              maxLength={PIN_LENGTH}
              autoFocus
              caretHidden
              testID="host-code-input"
            />

            <Pressable style={styles.pinRow} onPress={focusHiddenInput} testID="pin-boxes">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                const filled = i < pinCode.length;
                const active = i === pinCode.length && !pinError;
                return (
                  <View
                    key={i}
                    style={[
                      styles.pinBox,
                      filled && styles.pinBoxFilled,
                      active && styles.pinBoxActive,
                      pinError && styles.pinBoxError,
                    ]}
                  >
                    <Text style={[styles.pinDigit, pinError && styles.pinDigitError]}>
                      {filled ? pinCode[i] : ''}
                    </Text>
                  </View>
                );
              })}
            </Pressable>

            {pinError ? (
              <Text style={styles.errorText}>Fel PIN-kod. Försök igen.</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, (pinCode.length < PIN_LENGTH || pinLoading) && styles.loginBtnDisabled]}
              onPress={handlePinLogin}
              disabled={pinCode.length < PIN_LENGTH || pinLoading}
              testID="host-login-btn"
            >
              <LinearGradient
                colors={(pinCode.length < PIN_LENGTH || pinLoading) ? ['#8A9AB5', '#6A7A95'] : ['#1A3A6B', '#0F2347']}
                style={styles.loginBtnGrad}
              >
                <Text style={styles.loginBtnText}>Info om mitt värdskap</Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Host view ───────────────────────────────────────────────────────────────
  const guests = hostData?.guests ?? [];
  const isTask = hostData?.type === 'task';

  async function saveGuestInfo() {
    if (!hostData) return;
    await saveBtn.press(async () => {
      try {
        await api.put(`/api/cykelfest/host-assignments/${hostData.id}`, {
          guestInfo: guestInfoEdit,
          type: hostData.type,
          pin: hostData.pin,
          hostNames: hostData.hostNames,
          address: hostData.address,
          meal: hostData.meal,
          arrivalTime: hostData.arrivalTime,
          hostNotes: hostData.hostNotes,
        });
        setHostData({ ...hostData, guestInfo: guestInfoEdit });
        setGuestInfoSaved(true);
        setTimeout(() => setGuestInfoSaved(false), 2500);
      } catch {
        Alert.alert('Fel', 'Kunde inte spara. Försök igen.');
      }
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="host-panel-screen">
      <LinearGradient
        colors={isTask ? ['#7A3E1A', '#4A2210'] : ['#1A3A6B', '#0F2347']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <ChevronLeft size={22} color="#A8D4B8" />
        </TouchableOpacity>
        <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
        <Text style={styles.headerTitle}>{isTask ? 'Mitt uppdrag' : 'Mitt värdskap'}</Text>
      </LinearGradient>

      {/* Info card */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, isTask && styles.sectionLabelTask]}>INFORMATION</Text>
        <View style={[styles.card, isTask && styles.cardTask]}>
          {isTask ? (
            // ── Task info layout ──
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, styles.infoLabelTask]}>Ansvarig</Text>
                <Text style={styles.infoValue}>{hostData?.hostNames ?? ''}</Text>
              </View>
              {hostData?.meal ? (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, styles.infoLabelTask]}>Uppdrag</Text>
                    <Text style={styles.infoValue}>{hostData.meal}</Text>
                  </View>
                </>
              ) : null}
              {hostData?.arrivalTime ? (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, styles.infoLabelTask]}>Starttid</Text>
                    <Text style={styles.infoValue}>{hostData.arrivalTime}</Text>
                  </View>
                </>
              ) : null}
              {hostData?.hostNotes ? (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, styles.infoLabelTask]}>Info från kaninen</Text>
                    <Text style={[styles.infoValue, styles.infoValueMultiline]}>{hostData.hostNotes}</Text>
                  </View>
                </>
              ) : null}
            </>
          ) : (
            // ── Meal info layout ──
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Värd</Text>
                <Text style={styles.infoValue}>{hostData?.hostNames ?? ''}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Adress</Text>
                <Text style={styles.infoValue}>{hostData?.address ?? ''}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Måltid</Text>
                <Text style={styles.infoValue}>{hostData?.meal ?? ''}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Beräknad ankomst</Text>
                <Text style={styles.infoValue}>{hostData?.arrivalTime ?? ''}</Text>
              </View>
              {hostData?.hostNotes ? (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Info från kaninen</Text>
                    <Text style={[styles.infoValue, styles.infoValueMultiline]}>{hostData.hostNotes}</Text>
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>
      </View>

      {/* Gästlista — hidden for task type when no guests */}
      {!(isTask && guests.length === 0) ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isTask ? 'DELTAGARE' : 'GÄSTLISTA'} ({guests.length} {isTask ? 'deltagare' : 'gäster'})
          </Text>
          <View style={styles.card}>
            {guests.map((guest, i) => (
              <View key={guest.id ?? guest.participantName}>
                <View style={styles.guestRow}>
                  <View style={styles.guestInfo}>
                    <Text style={styles.guestName}>{guest.participantName}</Text>
                    {guest.dietary ? (
                      <Text style={styles.guestDietary}>{guest.dietary}</Text>
                    ) : null}
                  </View>
                </View>
                {i < guests.length - 1 ? <View style={styles.guestDivider} /> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Notes / message section */}
      {isTask ? (
        <View style={styles.section}>
          <View style={[styles.card, styles.cardTask]}>
            <Text style={styles.taskContactNote}>Frågor kring uppdraget tas direkt med kaninen.</Text>
            <Text style={styles.taskContactEmail}>kaninencykelfest@gmail.com</Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INFORMATION FRÅN VÄRDEN TILL GÄSTERNA</Text>
          <View style={styles.card}>
            <Text style={styles.guestInfoHint}>
              Denna text visas för dina gäster på festdagen när de ser var de ska ha sin måltid.
            </Text>
            <TextInput
              style={styles.guestInfoInput}
              value={guestInfoEdit}
              onChangeText={setGuestInfoEdit}
              placeholder="Skriv något till dina gäster — t.ex. parkering, portkod, klädsel..."
              placeholderTextColor="#B0A890"
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.saveBtn, saveBtn.loading && { opacity: 0.6 }]}
              onPress={saveGuestInfo}
              disabled={saveBtn.loading}
            >
              <Text style={styles.saveBtnText}>{guestInfoSaved ? '✓ Sparat' : 'Spara'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD1' },
  content: { paddingBottom: 20 },
  loginHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 22,
  },
  loginEyebrow: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
    marginTop: 4,
  },
  loginTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#F5EFE0',
  },
  loginSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  loginContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    gap: 12,
  },
  loginLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#4A4035',
    lineHeight: 21,
    marginBottom: 4,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  pinBox: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E0CC',
    backgroundColor: '#F5EFE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxFilled: {
    backgroundColor: '#EAE4F5',
    borderColor: '#1A3A6B',
  },
  pinBoxActive: {
    borderColor: '#1A3A6B',
    backgroundColor: '#fff',
    shadowColor: '#1A3A6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  pinBoxError: {
    borderColor: '#E05555',
    backgroundColor: '#FFF0F0',
  },
  pinDigit: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#1A3A6B',
  },
  pinDigitError: {
    color: '#E05555',
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#E05555',
    textAlign: 'center',
    marginTop: -4,
  },
  loginBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnGrad: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  loginBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
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
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.3,
    color: '#9A8E78',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionLabelTask: {
    color: '#8B5E3C',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
    padding: 14,
  },
  cardTask: {
    borderLeftWidth: 3,
    borderLeftColor: '#C4814A',
  },
  // Host view rows
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  guestInfo: { flex: 1 },
  guestName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13.5,
    color: '#2A2A2A',
    flexShrink: 1,
  },
  guestDietary: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#C4814A',
    marginTop: 2,
  },
  guestDivider: {
    height: 1,
    backgroundColor: '#F0EAD8',
  },
  infoRow: {
    paddingVertical: 10,
    gap: 3,
  },
  infoLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.5,
    color: '#9A8E78',
    letterSpacing: 0.5,
    paddingTop: 2,
  },
  infoLabelTask: {
    color: '#8B5E3C',
  },
  infoValue: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#2A2A2A',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F0EAD8',
  },
  infoValueMultiline: {
    lineHeight: 20,
  },
  guestInfoText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13.5,
    color: '#2A2A2A',
    lineHeight: 20,
    padding: 14,
  },
  guestInfoHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#9A8E78',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 17,
  },
  guestInfoInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13.5,
    color: '#2A2A2A',
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    backgroundColor: '#FAFAF7',
    lineHeight: 20,
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: '#1A3A6B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnTask: {
    backgroundColor: '#8B5E3C',
  },
  saveBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  taskContactNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13.5,
    color: '#7A5C3A',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  taskContactEmail: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#8B5E3C',
    marginTop: 6,
  },
});
