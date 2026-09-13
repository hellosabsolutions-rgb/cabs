import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, StyleProp, ViewStyle, Pressable, Platform } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';
import { Ionicons } from '@expo/vector-icons';

interface GoogleMapViewProps {
  pickupLocation?: string;
  dropLocation: string;
  style?: StyleProp<ViewStyle>;
  routeDistanceKm?: number;
  estimatedDurationMins?: number;
  topOffset?: number;
}

// Access Expo's compiled WKWebView native module
const NativeWebView: any = requireNativeViewManager('ExpoDomWebViewModule');

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  pickupLocation,
  dropLocation,
  style,
  routeDistanceKm,
  estimatedDurationMins,
  topOffset = 110,
}) => {
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' = roadmap, 'k' = satellite
  const [isLoading, setIsLoading] = useState(true);

  // Google Maps embed URL wrapped in iframe HTML document
  const mapUri = useMemo(() => {
    const destination = encodeURIComponent(dropLocation || 'Delhi, India');
    const embedSrc = pickupLocation
      ? `https://maps.google.com/maps?saddr=${encodeURIComponent(pickupLocation)}&daddr=${destination}&t=${mapType}&z=13&ie=UTF8&iwloc=&output=embed`
      : `https://maps.google.com/maps?q=${destination}&t=${mapType}&z=14&ie=UTF8&iwloc=&output=embed`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #e5e3df;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
  </style>
</head>
<body>
  <iframe
    src="${embedSrc}"
    allowfullscreen
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
  ></iframe>
</body>
</html>`;

    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }, [pickupLocation, dropLocation, mapType]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [mapUri]);

  return (
    <View style={[styles.container, style]}>
      <NativeWebView
        source={{ uri: mapUri }}
        style={StyleSheet.absoluteFill}
        injectedJavaScriptObject="{}"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />

      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Loading Google Map...</Text>
        </View>
      )}

      {/* Map Style Switcher (Roadmap / Satellite) - Liquid Glass on iOS, Normal Button on Android */}
      <View style={[styles.controlsBar, { top: topOffset }]}>
        <Pressable
          onPress={() => setMapType(mapType === 'm' ? 'k' : 'm')}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
          style={({ pressed }) => [
            styles.controlBtn,
            Platform.OS === 'ios' ? styles.controlBtnIos : styles.controlBtnAndroid,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {Platform.OS === 'ios' && <View style={styles.liquidGlossHighlight} />}
          <Ionicons
            name={mapType === 'm' ? 'earth' : 'map'}
            size={13}
            color="#0F172A"
          />
          <Text style={styles.controlBtnText}>
            {mapType === 'm' ? 'Satellite' : 'Roadmap'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    zIndex: 2,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  controlsBar: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    overflow: 'hidden',
  },
  controlBtnIos: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  controlBtnAndroid: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 3,
  },
  liquidGlossHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  controlBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
});
