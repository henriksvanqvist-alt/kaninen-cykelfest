# upload-assets skill

Store and serve images, audio, and videos using the project's own `/api/upload` endpoint.

## How it works
Files are stored locally in `backend/uploads/` and served at `GET /uploads/:filename`.
The upload endpoint returns a URL pointing to `$BACKEND_URL/uploads/{uuid}.ext`.

## Backend endpoint (already implemented in backend/src/index.ts)
```
POST /api/upload   — multipart/form-data with field "file"
GET  /uploads/:filename — serves the file
```

Response shape:
```json
{
  "data": {
    "id": "uuid",
    "url": "https://your-backend.com/uploads/uuid.jpg",
    "filename": "original-name.jpg",
    "contentType": "image/jpeg",
    "sizeBytes": 12345
  }
}
```

## Mobile helper (mobile/src/lib/upload.ts — already exists)
```typescript
import { uploadFile } from '@/lib/upload';

// Pick and upload an image
const result = await uploadFile(file.uri, file.filename, file.mimeType);
console.log(result.url); // Use this URL to display or save
```

## Pick image on mobile
```typescript
import * as ImagePicker from 'expo-image-picker';

async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, filename: asset.fileName ?? 'image.jpg', mimeType: asset.mimeType ?? 'image/jpeg' };
}
```

## Pick video on mobile
```typescript
async function pickVideo() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, filename: asset.fileName ?? 'video.mp4', mimeType: asset.mimeType ?? 'video/mp4' };
}
```

## Display uploaded image
```typescript
<Image source={{ uri: uploadedUrl }} style={{ width: 200, height: 200 }} resizeMode="cover" />
```

## Notes
- Supported types: jpg, jpeg, png, gif, webp, mp4, mov, pdf
- Files are served with `Cache-Control: public, max-age=31536000`
- BACKEND_URL must be correct in `.env` / `EXPO_PUBLIC_BACKEND_URL` for URLs to work
- Files persist as long as the backend server's filesystem persists
