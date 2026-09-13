import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { INDIAN_LANGUAGES, type AppLanguage } from '../i18n/languages';
import { AppBottomSheetModal } from './AppBottomSheetModal';

type Props = {
  value: AppLanguage;
  onChange: (code: AppLanguage) => void;
};

export function LanguagePicker({ value, onChange }: Props) {
  const { colors, type, t, scheme } = useAppTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const selected = INDIAN_LANGUAGES.find((lang) => lang.code === value) ?? INDIAN_LANGUAGES[0];
  const snapPoints = useMemo(() => ['72%', '93%'], []);
  const isDark = scheme === 'dark';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDIAN_LANGUAGES;
    return INDIAN_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.native.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [query]);

  const close = useCallback(() => {
    sheetRef.current?.dismiss();
    setQuery('');
  }, []);

  return (
    <>
      <Pressable
        onPress={() => sheetRef.current?.present()}
        style={[styles.trigger, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
      >
        <View style={styles.triggerCopy}>
          <Text style={type.value}>{selected.native}</Text>
          <Text style={type.meta}>{selected.name}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textFaint} />
      </Pressable>

      <AppBottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        index={1}
        backgroundColor={colors.bg}
        handleColor={isDark ? '#475569' : '#CBD5E1'}
        onDismiss={() => setQuery('')}
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetTop}>
            <Text style={type.pageTitle}>{t('settings.language')}</Text>
            <Pressable onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <BottomSheetTextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('settings.searchLanguage')}
            placeholderTextColor={colors.textFaint}
            style={[
              styles.search,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
          />
          <BottomSheetFlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const active = item.code === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.code);
                    close();
                  }}
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    active && { backgroundColor: colors.accentMuted },
                  ]}
                >
                  <View>
                    <Text style={[type.value, active && { color: colors.accent }]}>{item.native}</Text>
                    <Text style={type.meta}>{item.name}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </AppBottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  triggerCopy: {
    gap: 2,
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: space.lg,
  },
  sheetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  search: {
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
