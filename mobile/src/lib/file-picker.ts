import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export type PickedFile = { uri: string; filename: string; mimeType: string; webFile?: File };

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

function pickFileWeb(accept: string): Promise<PickedFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      document.body.removeChild(input);
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      if (!checkSize(file.size)) { resolve(null); return; }
      resolve({
        uri: URL.createObjectURL(file),
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        webFile: file,
      });
    });

    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(null);
    });

    input.click();
  });
}

export async function pickImage(): Promise<PickedFile | null> {
  if (Platform.OS === 'web') return pickFileWeb('image/*');
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
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
  if (Platform.OS === 'web') return pickFileWeb('video/*');
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

export async function pickAudio(): Promise<PickedFile | null> {
  if (Platform.OS === 'web') return pickFileWeb('audio/*');
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  if (!checkSize(a.size)) return null;
  return { uri: a.uri, filename: a.name ?? `audio-${Date.now()}.mp3`, mimeType: a.mimeType ?? 'audio/mpeg' };
}
