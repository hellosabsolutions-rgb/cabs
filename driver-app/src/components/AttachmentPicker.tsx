import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { pickFromCamera, pickFromGallery, pickPdf } from '../media/pick';
import type { Attachment } from '../media/types';

type Props = {
  label: string;
  value: Attachment | null;
  onChange: (file: Attachment | null) => void;
  cameraOnly?: boolean;
  hint?: string;
};

export function AttachmentPicker({ label, value, onChange, cameraOnly = false, hint }: Props) {
  const { colors, t } = useAppTheme();

  const apply = async (picker: () => Promise<Attachment | null>) => {
    const file = await picker();
    if (file) onChange(file);
  };

  const handlePress = () => {
    if (cameraOnly) {
      if (!value) {
        // Direct camera launch for tamper-proof live capture
        void apply(pickFromCamera);
        return;
      }

      // If photo already exists, allow retake or remove
      const retake = 'Retake live photo';
      const remove = t('media.remove');
      const cancel = t('common.cancel');

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [retake, remove, cancel],
            cancelButtonIndex: 2,
            destructiveButtonIndex: 1,
            title: 'Live Odometer Photo'
          },
          (index) => {
            if (index === 0) void apply(pickFromCamera);
            if (index === 1) onChange(null);
          }
        );
        return;
      }

      Alert.alert('Live Odometer Photo', undefined, [
        { text: retake, onPress: () => void apply(pickFromCamera) },
        { text: remove, style: 'destructive', onPress: () => onChange(null) },
        { text: cancel, style: 'cancel' },
      ]);
      return;
    }

    const choose = t('media.choose');
    const camera = t('media.camera');
    const gallery = t('media.gallery');
    const pdf = t('media.pdf');
    const cancel = t('common.cancel');
    const remove = t('media.remove');

    if (Platform.OS === 'ios') {
      const options = value ? [camera, gallery, pdf, remove, cancel] : [camera, gallery, pdf, cancel];
      const cancelIndex = options.length - 1;
      const destructiveIndex = value ? 3 : undefined;
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
        (index) => {
          if (index === 0) void apply(pickFromCamera);
          if (index === 1) void apply(pickFromGallery);
          if (index === 2) void apply(pickPdf);
          if (value && index === 3) onChange(null);
        }
      );
      return;
    }

    Alert.alert(choose, undefined, [
      { text: camera, onPress: () => void apply(pickFromCamera) },
      { text: gallery, onPress: () => void apply(pickFromGallery) },
      { text: pdf, onPress: () => void apply(pickPdf) },
      ...(value ? [{ text: remove, style: 'destructive' as const, onPress: () => onChange(null) }] : []),
      { text: cancel, style: 'cancel' },
    ]);
  };

  const defaultHint = cameraOnly
    ? 'Live camera only • No gallery/PDF'
    : t('media.hint');

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.box,
        {
          borderColor: value ? colors.success : colors.accent,
          backgroundColor: value ? colors.accentMuted : colors.bg,
        },
      ]}
    >
      {value?.kind === 'image' ? (
        <Image source={{ uri: value.uri }} style={styles.preview} />
      ) : (
        <View style={[styles.icon, { backgroundColor: value ? colors.success : colors.accentMuted }]}>
          <Ionicons
            name={value ? 'checkmark' : (cameraOnly ? 'camera' : 'attach-outline')}
            size={16}
            color={value ? colors.accentText : colors.accent}
          />
        </View>
      )}
      <Text style={[styles.label, { color: value ? colors.success : colors.accent }]}>
        {label} {cameraOnly && !value ? '(Live Camera)' : ''}
      </Text>
      <Text style={[styles.hint, { color: colors.textFaint }]} numberOfLines={1}>
        {value ? value.name : (hint || defaultHint)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    maxWidth: '90%',
  },
});
