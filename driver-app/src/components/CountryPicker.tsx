import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { COUNTRIES, INDIA, type Country } from '../constants/countries';

type Props = {
  visible: boolean;
  value: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
};

export function CountryPicker({ visible, value, onSelect, onClose }: Props) {
  const { colors, type, t } = useAppTheme();
  const [query, setQuery] = useState('');

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
        <View style={styles.sheetTop}>
          <Text style={type.pageTitle}>{t('login.selectCountry')}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>
        <TextInput
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
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingTop: 20,
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
