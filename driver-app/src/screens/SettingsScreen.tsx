import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { LanguagePicker } from '../components/LanguagePicker';
import { RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppearanceMode } from '../settings/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen(_props: Props) {
  const { colors, type, settings, updateSettings, scheme, t } = useAppTheme();

  return (
    <Screen>
      <Section title={t('settings.notifications')}>
        <ToggleRow
          label={t('settings.push')}
          hint={t('settings.pushHint')}
          value={settings.pushNotifications}
          onValueChange={(pushNotifications) => updateSettings({ pushNotifications })}
        />
        <ToggleRow
          label={t('settings.dutyReminders')}
          hint={t('settings.dutyRemindersHint')}
          value={settings.dutyReminders}
          onValueChange={(dutyReminders) => updateSettings({ dutyReminders })}
        />
        <ToggleRow
          label={t('settings.approvalAlerts')}
          hint={t('settings.approvalAlertsHint')}
          value={settings.approvalAlerts}
          onValueChange={(approvalAlerts) => updateSettings({ approvalAlerts })}
          last
        />
      </Section>

      <Section title={t('settings.appearance')}>
        <Text style={[type.meta, styles.hint]}>{t('settings.appearanceHint')}</Text>
        <View style={styles.segment}>
          {(['light', 'dark', 'system'] as AppearanceMode[]).map((mode) => {
            const active = settings.appearance === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => updateSettings({ appearance: mode })}
                style={[
                  styles.segmentBtn,
                  { backgroundColor: active ? colors.accent : colors.surfaceMuted },
                ]}
              >
                <Text style={[styles.segmentText, { color: active ? colors.accentText : colors.textDim }]}>
                  {mode === 'light' ? t('settings.light') : mode === 'dark' ? t('settings.dark') : t('settings.system')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={type.meta}>
          {t('settings.usingTheme', { theme: scheme === 'dark' ? t('settings.dark') : t('settings.light') })}
        </Text>
      </Section>

      <Section title={t('settings.dutyData')}>
        <ToggleRow
          label={t('settings.location')}
          hint={t('settings.locationHint')}
          value={settings.locationOnDuty}
          onValueChange={(locationOnDuty) => updateSettings({ locationOnDuty })}
        />
        <ToggleRow
          label={t('settings.autoSync')}
          hint={t('settings.autoSyncHint')}
          value={settings.autoSync}
          onValueChange={(autoSync) => updateSettings({ autoSync })}
        />
        <ToggleRow
          label={t('settings.keepScreen')}
          hint={t('settings.keepScreenHint')}
          value={settings.keepScreenAwake}
          onValueChange={(keepScreenAwake) => updateSettings({ keepScreenAwake })}
          last
        />
      </Section>

      <Section title={t('settings.language')}>
        <Text style={[type.meta, styles.hint]}>{t('settings.languageHint')}</Text>
        <LanguagePicker
          value={settings.language}
          onChange={(language) => updateSettings({ language })}
        />
      </Section>

      <Section title={t('settings.device')}>
        <ToggleRow
          label={t('settings.haptics')}
          hint={t('settings.hapticsHint')}
          value={settings.haptics}
          onValueChange={(haptics) => updateSettings({ haptics })}
        />
        <ToggleRow
          label={t('settings.biometric')}
          hint={t('settings.biometricHint')}
          value={settings.biometricLock}
          onValueChange={(biometricLock) => updateSettings({ biometricLock })}
          last
        />
      </Section>

      <Section title={t('settings.about')}>
        <View style={styles.aboutRow}>
          <Text style={type.label}>{t('settings.app')}</Text>
          <Text style={type.value}>KABPRO Driver 1.0.0</Text>
        </View>
        <View style={[styles.aboutRow, { paddingBottom: 0 }]}>
          <Text style={type.label}>{t('settings.build')}</Text>
          <Text style={type.value}>{t('settings.buildValue')}</Text>
        </View>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { type } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[type.section, styles.sectionTitle]}>{title}</Text>
      <Card>{children}</Card>
    </View>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  last,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  const { colors, type } = useAppTheme();

  return (
    <View
      style={[
        styles.toggleRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.toggleCopy}>
        <Text style={type.value}>{label}</Text>
        {hint ? <Text style={type.meta}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.accentText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: space.xl,
  },
  sectionTitle: {
    marginBottom: space.sm,
  },
  hint: {
    marginBottom: 8,
  },
  segment: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  aboutRow: {
    gap: 2,
    paddingBottom: space.sm,
  },
});
