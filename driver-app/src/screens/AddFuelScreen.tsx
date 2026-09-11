import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton, ButtonRow } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { InfoRow } from '../components/InfoRow';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { ChipSelect } from '../components/ChipSelect';
import { ListRow } from '../components/ListRow';
import { SectionTitle } from '../components/SectionTitle';
import { RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import { inrPlain, km } from '../data/format';
import type { Attachment } from '../media/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddFuel'>;

export function AddFuelScreen({ navigation }: Props) {
  const session = useSession();
  const { colors, type, t } = useAppTheme();

  const [odometer, setOdometer] = useState(
    String(session.vehicle?.odometer || session.odometer || '')
  );
  const [litres, setLitres] = useState('');
  const [cost, setCost] = useState('');
  const [station, setStation] = useState('');
  const [fuelType, setFuelType] = useState(session.vehicle?.fuelType || 'Diesel');
  const [file, setFile] = useState<Attachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS Location states for fuel station
  const [locating, setLocating] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Auto-detect Fuel Station Location via GPS
  const detectLocation = async () => {
    try {
      setLocating(true);
      setLocationError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('GPS permission not granted');
        setLocating(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setCoords(nextCoords);

      try {
        const places = await Location.reverseGeocodeAsync(nextCoords);
        if (places && places.length > 0) {
          const p = places[0];
          const parts = [p.name, p.street, p.subregion || p.city, p.region].filter(Boolean);
          const addr = parts.join(', ');
          setLocationAddress(addr);

          // Auto-fill fuel station name if currently empty
          setStation((prev) => (prev ? prev : (p.name || p.street || addr)));
        } else {
          setLocationAddress(`${nextCoords.latitude.toFixed(5)}, ${nextCoords.longitude.toFixed(5)}`);
        }
      } catch {
        setLocationAddress(`${nextCoords.latitude.toFixed(5)}, ${nextCoords.longitude.toFixed(5)}`);
      }
    } catch (err) {
      console.warn('Location detection failed:', err);
      setLocationError('Could not detect station GPS');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const price = useMemo(() => {
    const l = Number(litres);
    const c = Number(cost);
    if (!l || !c) return 0;
    return Math.round((c / l) * 100) / 100;
  }, [litres, cost]);

  const submit = async () => {
    const odo = Number(odometer.replace(/,/g, ''));
    const l = Number(litres);
    const c = Number(cost);

    if (!odo) {
      Alert.alert(t('nav.addFuel'), 'Please enter the odometer / meter reading.');
      return;
    }

    const minOdo = session.vehicle?.odometer || session.lastValidOdo || 0;
    if (minOdo > 0 && odo < minOdo) {
      Alert.alert(t('nav.addFuel'), `Odometer cannot be less than current vehicle reading (${km(minOdo)}).`);
      return;
    }

    if (!l || l <= 0) {
      Alert.alert(t('nav.addFuel'), 'Please enter fuel litres filled.');
      return;
    }

    if (!c || c <= 0) {
      Alert.alert(t('nav.addFuel'), 'Please enter the total fuel cost in Rupees (₹).');
      return;
    }

    if (!file) {
      Alert.alert(t('nav.addFuel'), 'Please attach a photo of the fuel bill / receipt slip from the petrol pump.');
      return;
    }

    try {
      setIsSubmitting(true);
      await session.addFuel({
        odometer: odo,
        litres: l,
        cost: c,
        station: station || locationAddress || 'Fuel Station',
        fuelType,
        photo: true,
        receiptUri: file.uri,
        location: locationAddress || station || undefined,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });

      Alert.alert(
        t('nav.addFuel'),
        `Fuel entry saved successfully.\n\nLitres: ${l} L\nTotal: ₹${c.toLocaleString('en-IN')}\nStation: ${station || locationAddress || '—'}\nOdometer: ${km(odo)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Error', 'Failed to save fuel log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={[type.body, { color: colors.textFaint, marginBottom: space.lg }]}>
        Record meter reading, litres, total amount, fuel slip photo, and current pump location.
      </Text>

      <Card>
        {/* Assigned Vehicle Info */}
        <InfoRow
          label="Vehicle"
          value={
            session.vehicle?.reg && session.vehicle.reg !== '—'
              ? `${session.vehicle.reg} (${session.vehicle.model || ''} • ${session.vehicle.type || 'Fleet'})`
              : 'Default Fleet Vehicle'
          }
        />

        {/* Date & Time in IST */}
        <InfoRow
          label="Fueling Date & Time"
          value={
            new Intl.DateTimeFormat('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }).format(new Date()) + ' (IST)'
          }
        />

        {/* Meter Reading (Odometer) */}
        <Field
          label="Meter / Odometer Reading (km)"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          hint={`Current recorded: ${km(session.vehicle?.odometer || session.lastValidOdo)}`}
        />

        {/* Litres Filled */}
        <Field
          label={t('fuel.litres')}
          value={litres}
          onChangeText={setLitres}
          keyboardType="decimal-pad"
          placeholder="e.g. 25.5"
        />

        {/* Total Cost in Rupees */}
        <Field
          label={t('fuel.cost')}
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
          placeholder="e.g. 2450"
        />

        {/* Calculated Rate per Litre */}
        <View style={styles.rateRow}>
          <Text style={[type.meta, { color: colors.textFaint }]}>Calculated Rate:</Text>
          <Text style={[type.value, { color: price > 0 ? colors.accent : colors.textFaint, fontSize: 13 }]}>
            {price > 0 ? `₹${price.toFixed(2)} / Litre` : 'Enter litres & cost'}
          </Text>
        </View>

        {/* Fuel Type */}
        <Text style={[type.label, { marginTop: space.sm, marginBottom: space.xs }]}>
          {t('fuel.fuelType')}
        </Text>
        <ChipSelect
          value={fuelType}
          onChange={setFuelType}
          items={[
            { id: 'Diesel', label: 'Diesel' },
            { id: 'Petrol', label: 'Petrol' },
            { id: 'CNG', label: 'CNG' },
          ]}
        />

        {/* Fuel Station GPS Location Detection Box */}
        <View style={[styles.locationBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSoft }]}>
          <View style={styles.locationHeader}>
            <View style={styles.locationTitleRow}>
              <Ionicons name="location" size={16} color={coords ? colors.success : colors.accent} />
              <Text style={[type.label, { color: colors.text, textTransform: 'uppercase', letterSpacing: 0.3 }]}>
                Fuel Station Location (GPS)
              </Text>
            </View>
            <Pressable
              onPress={detectLocation}
              disabled={locating}
              style={styles.refreshBtn}
            >
              <Ionicons name="refresh" size={13} color={colors.accent} />
              <Text style={[type.meta, { color: colors.accent, fontWeight: '600', fontSize: 11 }]}>
                {locating ? 'Detecting...' : 'Refresh GPS'}
              </Text>
            </Pressable>
          </View>

          {locating ? (
            <View style={styles.locatingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[type.meta, { color: colors.textFaint, marginLeft: 6 }]}>
                Detecting current fuel station location...
              </Text>
            </View>
          ) : locationAddress ? (
            <View>
              <Text style={[type.value, { fontSize: 13, color: colors.text }]}>{locationAddress}</Text>
              {coords && (
                <Text style={[type.meta, { color: colors.textFaint, marginTop: 2, fontSize: 11 }]}>
                  GPS: {coords.latitude.toFixed(5)}°, {coords.longitude.toFixed(5)}°
                </Text>
              )}
            </View>
          ) : locationError ? (
            <Text style={[type.meta, { color: colors.danger }]}>{locationError} • Tap Refresh GPS</Text>
          ) : (
            <Text style={[type.meta, { color: colors.textFaint }]}>Locating fuel station...</Text>
          )}
        </View>

        {/* Fuel Station Name */}
        <Field
          label={t('fuel.station')}
          value={station}
          onChangeText={setStation}
          placeholder="e.g. Indian Oil / HPCL / BPCL"
          hint="Detected automatically via GPS or enter custom pump name"
        />

        {/* Fuel Bill / Receipt Slip Photo */}
        <AttachmentPicker
          label="Fuel Bill / Slip Photo (पेट्रोल पर्ची / बिल)"
          value={file}
          onChange={setFile}
          hint="Camera, gallery, or PDF • Printed bill receipt"
        />
      </Card>

      <ButtonRow>
        <PrimaryButton
          title={t('common.cancel')}
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.flex}
        />
        <PrimaryButton
          title={isSubmitting ? 'Saving...' : t('common.submit')}
          onPress={submit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.flex}
        />
      </ButtonRow>

      <SectionTitle title={t('fuel.history')} />
      {session.fuels.map((item) => (
        <ListRow
          key={item.id}
          icon="water-outline"
          title={`${item.litres} L · ${inrPlain(item.cost)}`}
          subtitle={`${item.at} · ${item.station} · ${km(item.odometer)}`}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.xs,
    marginBottom: space.xs,
  },
  locationBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.sm + 2,
    marginVertical: space.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
});

