import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { CountryPicker } from '../components/CountryPicker';
import { INDIA, matchCountryByDialPrefix } from '../constants/countries';
import { RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { driverAuthApi } from '../services/api';
import { getLastIdentifier, getRememberMe } from '../services/authStorage';
import {
  googleErrorMessage,
  isGoogleSignInAvailable,
  signInWithGoogleNative,
} from '../services/googleAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type LoginKind = 'mobile' | 'email' | 'userId';

function detectLoginKind(value: string): LoginKind {
  const trimmed = value.trim();
  if (!trimmed) return 'userId';

  if (trimmed.includes('@')) return 'email';

  const phoneLike = trimmed.replace(/[\s\-()]/g, '');
  if (/^\+?\d+$/.test(phoneLike)) return 'mobile';

  return 'userId';
}

const KIND_ICON: Record<LoginKind, keyof typeof Ionicons.glyphMap> = {
  mobile: 'call-outline',
  email: 'mail-outline',
  userId: 'person-outline',
};

export function LoginScreen({ navigation: _navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [country, setCountry] = useState(INDIA);
  const [countryOpen, setCountryOpen] = useState(false);
  const [busy, setBusy] = useState<'password' | 'google' | null>(null);
  const { colors, t } = useAppTheme();
  const session = useSession();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [savedRemember, savedId] = await Promise.all([getRememberMe(), getLastIdentifier()]);
      if (cancelled) return;
      setRememberMe(savedRemember);
      if (!savedId) return;

      const matched = matchCountryByDialPrefix(savedId);
      if (matched && detectLoginKind(savedId) === 'mobile') {
        const compact = savedId.replace(/[\s\-()]/g, '');
        setCountry(matched);
        setIdentifier(compact.slice(1 + matched.dialCode.length));
      } else {
        setIdentifier(savedId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kind = useMemo(() => detectLoginKind(identifier), [identifier]);
  const isMobile = kind === 'mobile';

  const onIdentifierChange = (text: string) => {
    if (detectLoginKind(text) !== 'mobile') {
      setIdentifier(text);
      return;
    }

    const matched = matchCountryByDialPrefix(text);
    if (matched) {
      const compact = text.replace(/[\s\-()]/g, '');
      setCountry(matched);
      setIdentifier(compact.slice(1 + matched.dialCode.length));
      return;
    }

    setIdentifier(text.replace(/[^\d]/g, ''));
  };

  const signIn = async () => {
    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      Alert.alert(t('login.signIn'), t('login.required'));
      return;
    }

    const loginId = isMobile ? `+${country.dialCode}${trimmed.replace(/\D/g, '')}` : trimmed;
    setBusy('password');
    try {
      const payload = await driverAuthApi.login(loginId, password, rememberMe);
      await session.applyAuth(payload, { rememberMe, identifier: loginId });
    } catch (error) {
      Alert.alert(t('login.signIn'), error instanceof Error ? error.message : t('login.failed'));
    } finally {
      setBusy(null);
    }
  };

  const googleSignIn = async () => {
    if (!isGoogleSignInAvailable()) {
      Alert.alert(
        t('login.google'),
        'Google Sign-In needs the native KABPRO Driver build. Stop Expo Go and run: npx expo run:ios'
      );
      return;
    }

    setBusy('google');
    try {
      const tokens = await signInWithGoogleNative();
      const payload = await driverAuthApi.google(tokens, rememberMe);
      await session.applyAuth(payload, {
        rememberMe,
        identifier: payload.driver?.email || payload.driver?.mobile || '',
      });
    } catch (error) {
      const message = googleErrorMessage(error, t('login.googleFailed'));
      if (message) Alert.alert(t('login.google'), message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('login.hey')}
              {'\n'}
              {t('login.welcomeBack')}
            </Text>

            <View style={styles.fields}>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSoft },
                ]}
              >
                {isMobile ? (
                  <Pressable onPress={() => setCountryOpen(true)} style={styles.countryBtn}>
                    <Text style={styles.flag}>{country.flag}</Text>
                    <Text style={[styles.dial, { color: colors.text }]}>+{country.dialCode}</Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textFaint} />
                    <View style={[styles.countrySplit, { backgroundColor: colors.border }]} />
                  </Pressable>
                ) : (
                  <Ionicons name={KIND_ICON[kind]} size={18} color={colors.textFaint} />
                )}
                <TextInput
                  value={identifier}
                  onChangeText={onIdentifierChange}
                  placeholder={isMobile ? t('login.placeholderMobile') : t('login.placeholderId')}
                  placeholderTextColor={colors.textFaint}
                  keyboardType={isMobile ? 'phone-pad' : 'email-address'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>

              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSoft },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.textFaint} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('login.password')}
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <View style={styles.rowBetween}>
              <Pressable
                onPress={() => setRememberMe((prev) => !prev)}
                style={styles.rememberRow}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: rememberMe ? colors.accent : colors.border,
                      backgroundColor: rememberMe ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  {rememberMe ? (
                    <Ionicons name="checkmark" size={14} color={colors.accentText} />
                  ) : null}
                </View>
                <Text style={[styles.rememberText, { color: colors.textDim }]}>
                  {t('login.remember')}
                </Text>
              </Pressable>

              <Pressable onPress={() => Alert.alert(t('login.forgot'), t('login.forgotHint'))}>
                <Text style={[styles.forgot, { color: colors.textFaint }]}>{t('login.forgot')}</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={signIn}
              disabled={Boolean(busy)}
              style={({ pressed }) => [
                styles.signIn,
                { backgroundColor: colors.accent },
                (pressed || busy) && styles.pressed,
              ]}
            >
              {busy === 'password' ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={[styles.signInText, { color: colors.accentText }]}>
                  {t('login.signIn')}
                </Text>
              )}
            </Pressable>

            <Text style={[styles.or, { color: colors.textFaint }]}>{t('login.or')}</Text>

            <Pressable
              onPress={googleSignIn}
              disabled={Boolean(busy)}
              style={({ pressed }) => [
                styles.google,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                (pressed || busy) && styles.pressed,
              ]}
            >
              {busy === 'google' ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color={colors.text} />
                  <Text style={[styles.googleText, { color: colors.text }]}>{t('login.google')}</Text>
                </>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() => Alert.alert(t('login.signUp'), t('login.signUpHint'))}
            style={styles.footer}
          >
            <Text style={[styles.footerText, { color: colors.textFaint }]}>
              {t('login.noAccount')}{' '}
              <Text style={{ color: colors.textDim, fontWeight: '600' }}>{t('login.signUp')}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPicker
        visible={countryOpen}
        value={country.code}
        onSelect={(next) => {
          setCountry(next);
          setCountryOpen(false);
        }}
        onClose={() => setCountryOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  top: {
    paddingTop: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 42,
    marginBottom: 28,
  },
  fields: {
    gap: 12,
  },
  inputWrap: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  flag: {
    fontSize: 18,
  },
  dial: {
    fontSize: 15,
    fontWeight: '600',
  },
  countrySplit: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  rowBetween: {
    marginTop: 16,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '500',
  },
  forgot: {
    fontSize: 13,
  },
  signIn: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
  },
  or: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 22,
  },
  google: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.86,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: space.xl,
  },
  footerText: {
    fontSize: 13,
  },
});
