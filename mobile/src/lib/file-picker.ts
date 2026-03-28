import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export type PickedFile = { uri: string; filename: string; mimeType: string };

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function checkSize(fileSize: number | undefined): boolean {
  if (fileSize && fileSize > MAX_BYTES) {
    Alert.alert(
      'Filen är för stor',
      'Max tillåten storlek är 5 MB. Välj en mindre fil.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

export async function pickImage(): Promise<PickedFile | null> {
  // On web, skip permission request — browsers block file pickers
  // that aren't directly tied to the user interaction event
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  if (!checkSize(a.fileSize)) return null;
  return { uri: a.uri, filename: a.fileName ?? `image-${Date.now()}.jpg`, mimeType: a.mimeType ?? 'image/jpeg' };
}

export async function pickVideo(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  if (!checkSize(a.fileSize)) return null;
  return { uri: a.uri, filename: a.fileName ?? `video-${Date.now()}.mp4`, mimeType: a.mimeType ?? 'video/mp4' };
}
