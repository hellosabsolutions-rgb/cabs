import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { Attachment } from './types';

function imageName(uri: string) {
  const last = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  return last.split('?')[0];
}

export async function pickFromCamera(): Promise<Attachment | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera', 'Camera access is needed to take a photo.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: false,
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? imageName(asset.uri),
    mime: asset.mimeType ?? 'image/jpeg',
    kind: 'image',
    base64: asset.base64 || undefined,
  };
}

export async function pickFromGallery(): Promise<Attachment | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photos', 'Photo library access is needed to attach an image.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? imageName(asset.uri),
    mime: asset.mimeType ?? 'image/jpeg',
    kind: 'image',
  };
}

export async function pickPdf(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name || `document-${Date.now()}.pdf`,
    mime: asset.mimeType ?? 'application/pdf',
    kind: 'pdf',
  };
}
