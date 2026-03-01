import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Platform, ActivityIndicator, Animated, PanResponder, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import { getRequest, acceptRequest, rejectRequest, completeRequest } from '../api/requestService';
import config from '../config/env';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const BOTTOM_SHEET_MIN_HEIGHT = 180;

export default function RequestDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [request, setRequest] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeData, setRouteData] = useState<any>(null);

  // Bottom Sheet Animation
  const animatedHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleBottomSheet = () => {
    const toValue = isExpanded ? BOTTOM_SHEET_MIN_HEIGHT : BOTTOM_SHEET_MAX_HEIGHT;
    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      friction: 8,
    }).start();
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    getRequest(id)
      .then((res) => {
        const wrappedData = res.data?.data;
        const data = (wrappedData && wrappedData.id) ? wrappedData : (wrappedData?.data ?? res.data);
        setRequest(data);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load request details');
        navigation.goBack();
      })
      .finally(() => setLoading(false));

    // Fetch user location once on mount for routing
    Geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => console.log('Location error', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [id]);

  useEffect(() => {
    if (currentPos && request?.pickup_lat && request?.pickup_lng) {
      const url = `${config.OSRM_ENDPOINT || 'https://router.project-osrm.org'}/route/v1/driving/${currentPos.longitude},${currentPos.latitude};${request.pickup_lng},${request.pickup_lat}?overview=full&geometries=geojson`;
      fetch(url)
        .then(r => r.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            setRouteData(data.routes[0].geometry);
          }
        })
        .catch(e => console.log('OSRM error', e));
    }
  }, [currentPos, request]);

  const handleAccept = async () => {
    if (!request || request.status !== 'pending') return;
    setAccepting(true);
    try {
      const res = await acceptRequest(request.id);
      const data = res.data?.data ?? res.data;
      setRequest(data);
      Alert.alert('Success', 'Request accepted!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept');
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!request || request.status !== 'pending') return;
    setRejecting(true);
    try {
      const res = await rejectRequest(request.id);
      const data = res.data?.data ?? res.data;
      setRequest(data);
      Alert.alert('Success', 'Request rejected');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  const handleComplete = async () => {
    if (!request || request.status !== 'assigned') return;
    setCompleting(true);
    try {
      const res = await completeRequest(request.id);
      const data = res.data?.data ?? res.data;
      setRequest(data);
      Alert.alert('Success', 'Tow completed successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to complete');
    } finally {
      setCompleting(false);
    }
  };

  const openInMaps = () => {
    if (!request) return;
    const { pickup_lat, pickup_lng } = request;
    const url = Platform.select({
      android: `google.navigation:q=${pickup_lat},${pickup_lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${pickup_lat},${pickup_lng}`,
    });
    Linking.openURL(url!).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${pickup_lat},${pickup_lng}`));
  };

  if (loading || !request) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  );

  const region = {
    latitude: parseFloat(request.pickup_lat) || 0,
    longitude: parseFloat(request.pickup_lng) || 0,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; background: #f1f5f9; }
            #map { width: 100vw; height: 100vh; }
            .marker-label { background: white; padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc; font-weight: bold; font-size: 10px; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            const map = L.map('map', { zoomControl: false });
            L.tileLayer('${config.MAPTILER_STYLE_URL.replace('style.json', '{z}/{x}/{y}.png')}?key=${config.MAPTILER_API_KEY}', {
                attribution: '&copy; MapTiler'
            }).addTo(map);

            const userLat = ${currentPos?.latitude || 0};
            const userLng = ${currentPos?.longitude || 0};
            const pickupLat = ${parseFloat(request.pickup_lat) || 0};
            const pickupLng = ${parseFloat(request.pickup_lng) || 0};

            const userMarker = L.circleMarker([userLat, userLng], { color: 'white', fillColor: '#3b82f6', fillOpacity: 1, radius: 8, weight: 3 }).addTo(map);
            const pickupMarker = L.marker([pickupLat, pickupLng]).addTo(map);

            if (${JSON.stringify(routeData)}) {
                const routeLine = L.geoJSON(${JSON.stringify(routeData)}, {
                    style: { color: '#8b5cf6', weight: 6, opacity: 0.8 }
                }).addTo(map);
                map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
            } else if (pickupLat !== 0) {
                const group = new L.featureGroup([userMarker, pickupMarker]);
                map.fitBounds(group.getBounds(), { padding: [60, 60] });
            }
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: mapHtml }}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>{"<"}</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.bottomSheet, { height: animatedHeight }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={toggleBottomSheet} style={styles.handleContainer}>
          <View style={styles.handle} />
        </TouchableOpacity>

        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.requestNum}>Request #{request.id}</Text>
              <Text style={styles.customerName} numberOfLines={1}>{request.customer_name || 'N/A'}</Text>
              {!isExpanded && (
                <Text style={styles.noteCollapsed} numberOfLines={1}>
                  {request.note || 'No notes provided'}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: request.status === 'pending' ? '#6b7280' : request.status === 'assigned' ? '#2563eb' : '#16a34a' }]}>
              <Text style={styles.statusText}>{request.status}</Text>
            </View>
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { flex: 1 }]} onPress={openInMaps}>
              <Text style={styles.btnTextSecondary} numberOfLines={1}>Maps</Text>
            </TouchableOpacity>

            {request.status === 'pending' && (
              <View style={{ flex: 2.5, flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, { flex: 1 }, accepting && styles.btnDisabled]}
                  onPress={handleAccept}
                  disabled={accepting}
                >
                  {accepting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText} numberOfLines={1}>Accept</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnRejectDetail, { flex: 1, marginTop: 0 }, rejecting && styles.btnDisabled]}
                  onPress={handleReject}
                  disabled={rejecting}
                >
                  {rejecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText} numberOfLines={1}>Reject</Text>}
                </TouchableOpacity>
              </View>
            )}

            {request.status === 'assigned' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnComplete, { flex: 2.5 }, completing && styles.btnDisabled]}
                onPress={handleComplete}
                disabled={completing}
              >
                {completing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Complete Tow</Text>}
              </TouchableOpacity>
            )}
          </View>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, { fontWeight: '700', color: request.status === 'completed' ? '#16a34a' : '#2563eb' }]}>{request.status.toUpperCase()}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Note:</Text>
                <Text style={styles.infoValue}>{request.note || 'No notes provided'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pickup Address:</Text>
                <Text style={styles.infoValue}>{request.pickup_address || `${request.pickup_lat}, ${request.pickup_lng}`}</Text>
              </View>

              {request.status === 'completed' && (
                <View style={styles.completedBanner}>
                  <Text style={styles.completedText}>This request is completed.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 10,
  },
  backButtonText: { fontSize: 24, color: '#111827', fontWeight: 'bold' },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 20,
  },
  handleContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestNum: { fontSize: 13, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  customerName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  addressText: { fontSize: 13, color: '#4b5563', marginTop: 4 },
  noteCollapsed: { fontSize: 14, color: '#6b7280', marginTop: 2, fontStyle: 'italic' },
  expandedContent: { marginTop: 0 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 15 },
  infoRow: { marginBottom: 12 },
  infoLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#111827' },
  completedBanner: { backgroundColor: '#dcfce7', padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  completedText: { color: '#166534', fontWeight: '700', fontSize: 14 },
  sheetActions: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  btn: { padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#8b5cf6' },
  btnComplete: { backgroundColor: '#16a34a' },
  btnSecondary: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  btnRejectDetail: { backgroundColor: '#ef4444', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnTextSecondary: { color: '#475569', fontWeight: '700', fontSize: 16 },
});
