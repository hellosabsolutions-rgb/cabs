import React from 'react';
import {
  Image,
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
import { appDialog } from '../dialog';

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
        void apply(pickFromCamera);
        return;
      }

      void appDialog.alert('Live Odometer Photo', undefined, [
        { text: 'Retake live photo', onPress: () => void apply(pickFromCamera) },
        { text: t('media.remove'), style: 'destructive', onPress: () => onChange(null) },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
      return;
    }

    const choose = t('media.choose');
    const camera = t('media.camera');
    const gallery = t('media.gallery');
    const pdf = t('media.pdf');
    const cancel = t('common.cancel');
    const remove = t('media.remove');

    void appDialog.alert(choose, undefined, [
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
