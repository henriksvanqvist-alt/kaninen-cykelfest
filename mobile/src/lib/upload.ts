import { Platform } from 'react-native';
import type { PickedFile } from './file-picker';

type UploadResult = { id: string; url: string; filename: string; contentType: string; sizeBytes: number };

export async function uploadFile(uri: string, filename: string, mimeType: string, webFile?: File): Promise<UploadResult> {
  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

  const formData = new FormData();

  if (Platform.OS === 'web') {
    if (webFile) {
      // Use the File object directly — most reliable on web
      formData.append('file', webFile, filename);
    } else {
      // Fallback: fetch blob URL
      const fetched = await fetch(uri);
      const blob = await fetched.blob();
      formData.append('file', blob, filename);
    }
  } else {
    formData.append('file', { uri, type: mimeType, name: filename } as any);
  }

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Upload failed');
  return data.data;
}

export async function uploadPickedFile(picked: PickedFile): Promise<UploadResult> {
  return uploadFile(picked.uri, picked.filename, picked.mimeType, picked.webFile);
}
