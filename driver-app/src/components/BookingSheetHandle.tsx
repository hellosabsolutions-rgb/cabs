import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCircleButton } from './GlassChrome';
import type { BookingItem } from '../types/booking';

type Props = {
  booking: BookingItem;
  isDark: boolean;
  primaryText: string;
  mutedText: string;
  onToggleSnap: () => void;
  onCall: () => void;
  onSms: () => void;
};

export function BookingSheetHandle({
  booking,
  isDark,
  primaryText,
  mutedText,
  onToggleSnap,
  onCall,
  onSms,
}: Props) {
  return (
    <View style={styles.dragHeaderArea}>
      <Pressable
        onPress={onToggleSnap}
        hitSlop={{ top: 16, bottom: 16, left: 60, right: 60 }}
        style={styles.handleBarWrap}
      >
        <View style={[styles.handleBar, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
      </Pressable>

      <View style={styles.passengerProfileRow}>
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#334155' : '#EEF2F6' }]}>
          <Ionicons name="person" size={24} color={isDark ? '#94A3B8' : '#475569'} />
        </View>

        <View style={styles.passengerTextCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.passengerNameText, { color: primaryText }]} numberOfLines={1}>
              {booking.customerName || 'Guest Passenger'}
            </Text>
            <View style={[styles.ratingTag, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={[styles.ratingTagText, { color: primaryText }]}>4.8</Text>
            </View>
          </View>
          <Text style={[styles.passengerRoleText, { color: mutedText }]}>
            Passenger · {booking.passengersCount} {booking.passengersCount === 1 ? 'Guest' : 'Guests'}
          </Text>
        </View>

        <View style={styles.profileActionsRow}>
          <GlassCircleButton
            onPress={onSms}
            icon="chatbubble-ellipses"
            iconSize={18}
            iconColor={primaryText}
            size={40}
            accessibilityLabel="Message passenger"
          />
          <GlassCircleButton
            onPress={onCall}
            icon="call"
            iconSize={17}
            iconColor={primaryText}
            size={40}
            accessibilityLabel="Call passenger"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dragHeaderArea: {
    paddingHorizontal: 18,
    paddingBottom: 4,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  passengerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passengerNameText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  passengerRoleText: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
