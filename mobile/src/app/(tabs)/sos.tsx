import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, AlertTriangle } from 'lucide-react-native';
import { useAppStore } from '@/lib/state/store';
import PressableScale from '@/components/PressableScale';

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const settings = useAppStore((s) => s.settings);

  const contact1Name = settings['sos_contact1_name'] ?? 'Nödnummer';
  const contact1Number = settings['sos_contact1_number'] ?? '112';
  const contact2Name = settings['sos_contact2_name'] ?? 'Kaninen';
  const contact2Number = settings['sos_contact2_number'] ?? '+46700000000';
  const contact3Name = settings['sos_contact3_name'] ?? 'Taxi Uppsala';
  const contact3Number = settings['sos_contact3_number'] ?? '08157000';

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} testID="sos-screen">
      {/* Header */}
      <LinearGradient colors={['#8B1A1A', '#C0392B']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
        <Text style={styles.headerTitle}>Hjälp</Text>
      </LinearGradient>



      {/* Kontakter */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NÖDKONTAKTER</Text>
        <View style={styles.card}>


          <PressableScale
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${contact2Number}`)}
            testID="call-organizer"
          >
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact2Name}</Text>
              <Text style={styles.contactNum}>När du är lost</Text>
            </View>
            <View style={[styles.contactIconSmall, { backgroundColor: '#E5F0FF' }]}>
              <Phone size={16} color="#2A5FA8" />
            </View>
          </PressableScale>

          <View style={styles.contactDivider} />

          <PressableScale
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${contact3Number}`)}
            testID="call-taxi"
          >
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact3Name}</Text>
              <Text style={styles.contactNum}>När du är på andra sidan stan</Text>
            </View>
            <View style={[styles.contactIconSmall, { backgroundColor: '#FFF8E5' }]}>
              <Phone size={16} color="#C4814A" />
            </View>
          </PressableScale>
        </View>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <View style={[styles.card, styles.infoCard]}>
          <AlertTriangle size={20} color="#C4814A" />
          <Text style={styles.infoText}>
            Denna skärm är alltid tillgänglig oavsett om appen är låst eller inte. Ring alltid 112 vid fara för liv.
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD1' },
  content: { paddingBottom: 0 },
  header: {
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 22,
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
    color: '#fff',
    lineHeight: 30,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.3,
    color: '#9A8E78',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainCallBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1C4F4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  mainCallGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
  },
  mainCallTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#F5EFE0',
  },
  mainCallSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(168,212,184,0.8)',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 18,
    gap: 12,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  contactIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 17,
    color: '#2A2A2A',
  },
  contactNum: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#5A5040',
    marginTop: 2,
  },
  contactArrow: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: '#9A8E78',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F0EAD8',
    marginHorizontal: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
    backgroundColor: '#FFF8F0',
    borderColor: '#F0D4B0',
  },
  infoText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#5A5040',
    flex: 1,
    lineHeight: 18,
  },
});
