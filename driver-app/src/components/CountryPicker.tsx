import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { COUNTRIES, INDIA, type Country } from '../constants/countries';
import { AppBottomSheetModal } from './AppBottomSheetModal';

type Props = {
  visible: boolean;
  value: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
};

export function CountryPicker({ visible, value, onSelect, onClose }: Props) {
  const { colors, type, t, scheme } = useAppTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const snapPoints = useMemo(() => ['72%', '93%'], []);
  const isDark = scheme === 'dark';

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [
      INDIA,
      ...COUNTRIES.filter((item) => item.code !== INDIA.code).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    ];
    if (!q) return list;

    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.dialCode.includes(q.replace('+', '')) ||
        item.code.toLowerCase().includes(q)
    );
  }, [query]);

  const close = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  return (
    <AppBottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={1}
      backgroundColor={colors.bg}
      handleColor={isDark ? '#475569' : '#CBD5E1'}
      onDismiss={() => {
        setQuery('');
        onClose();
      }}
    >
      <View style={styles.sheetInner}>
        <View style={styles.sheetTop}>
          <Text style={type.pageTitle}>{t('login.selectCountry')}</Text>
          <Pressable onPress={close} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>
        <BottomSheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('login.searchCountry')}
          placeholderTextColor={colors.textFaint}
          autoCorrect={false}
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
                  onSelect(item);
                  setQuery('');
                }}
                style={[
                  styles.option,
                  { borderBottomColor: colors.border },
                  active && { backgroundColor: colors.accentMuted },
                ]}
              >
                <View style={styles.optionCopy}>
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View>
                    <Text style={[type.value, active && { color: colors.accent }]}>{item.name}</Text>
                    <Text style={type.meta}>+{item.dialCode}</Text>
                  </View>
                </View>
                {active ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
              </Pressable>
            );
          }}
        />
      </View>
    </AppBottomSheetModal>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 22,
  },
});
