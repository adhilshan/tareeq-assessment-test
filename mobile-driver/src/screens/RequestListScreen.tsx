import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, ActivityIndicator, Linking, Platform, PermissionsAndroid } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getRequests, acceptRequest, rejectRequest, completeRequest } from '../api/requestService';
import Geolocation from 'react-native-geolocation-service';
import { useAuth } from '../context/AuthContext';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Persistent state outside the component to survive navigation/unmounting
let globalLastMaxId = 0;

async function notifyNewRequest() {
  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'towing_requests',
    name: 'Towing Requests',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  // Display a notification
  await notifee.displayNotification({
    title: 'New Tow Available',
    body: 'A new towing request has been posted!',
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
    },
  });
}

export default function RequestListScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const isFocused = useIsFocused();

  const fetchRequests = useCallback(async () => {
    try {
      let lat, lng;
      try {
        const pos: any = await new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e: any) {
        console.log('Location error', e);
        // If location fails (e.g. GPS off), we don't reject the whole fetch, 
        // we just continue without lat/lng so the API can return results without sorting by distance.
      }

      const res = await getRequests(lat, lng);
      const data = res.data?.data ?? res.data;
      const arr = Array.isArray(data) ? data : (data?.data ?? []);

      // Check for new requests to notify
      if (arr.length > 0) {
        const currentMaxId = Math.max(...arr.map((r: any) => r.id));
        // Only notify if we already have a baseline and the new one is higher
        if (globalLastMaxId > 0 && currentMaxId > globalLastMaxId) {
          notifyNewRequest();
        }
        globalLastMaxId = currentMaxId;
      }

      setRequests(arr);
    } catch (err: any) {
      console.log('Fetch error', err);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    fetchRequests();

    // Efficient Polling: Every 10 seconds if screen is focused
    const timer = setInterval(() => {
      if (isFocused) {
        fetchRequests();
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [fetchRequests, isFocused]);

  // WebSocket-based real-time updates removed; driver can pull to refresh instead.

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleAccept = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [`accept-${id}`]: true }));
    try {
      await acceptRequest(id);
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept');
    } finally {
      setActionLoading(prev => ({ ...prev, [`accept-${id}`]: false }));
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [`reject-${id}`]: true }));
    try {
      await rejectRequest(id);
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject-${id}`]: false }));
    }
  };

  const handleComplete = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [`complete-${id}`]: true }));
    try {
      await completeRequest(id);
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to complete');
    } finally {
      setActionLoading(prev => ({ ...prev, [`complete-${id}`]: false }));
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = Platform.select({
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url!).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`));
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TowAssist Driver</Text>
        <TouchableOpacity onPress={() => logout()} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: '#ef4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(r) => String(r.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>#{item.id} - {item.customer_name}</Text>
              <View style={[styles.badge, { backgroundColor: item.status === 'pending' ? '#6b7280' : item.status === 'assigned' ? '#2563eb' : '#16a34a' }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{item.pickup_address || `${item.pickup_lat}, ${item.pickup_lng}`}</Text>
            {item.distance !== undefined && (
              <Text style={styles.distanceText}>{item.distance.toFixed(1)} km away</Text>
            )}

            <View style={styles.actionRow}>
              {item.status === 'pending' ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnAccept, actionLoading[`accept-${item.id}`] && styles.btnDisabled]}
                    onPress={() => handleAccept(item.id)}
                    disabled={actionLoading[`accept-${item.id}`]}
                  >
                    {actionLoading[`accept-${item.id}`] ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Accept</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnReject, actionLoading[`reject-${item.id}`] && styles.btnDisabled]}
                    onPress={() => handleReject(item.id)}
                    disabled={actionLoading[`reject-${item.id}`]}
                  >
                    {actionLoading[`reject-${item.id}`] ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Reject</Text>}
                  </TouchableOpacity>
                </>
              ) : item.status === 'assigned' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnComplete, actionLoading[`complete-${item.id}`] && styles.btnDisabled]}
                  onPress={() => handleComplete(item.id)}
                  disabled={actionLoading[`complete-${item.id}`]}
                >
                  {actionLoading[`complete-${item.id}`] ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Complete Tow</Text>}
                </TouchableOpacity>
              ) : null}
              {item.status !== 'completed' && (
                <TouchableOpacity style={[styles.actionBtn, styles.btnMap]} onPress={() => openInMaps(item.pickup_lat, item.pickup_lng)}>
                  <Text style={styles.btnText}>Direction</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.detailLink} onPress={() => navigation.navigate('RequestDetail', { id: item.id })}>
              <Text style={styles.detailText}>View Details -{">"}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10, gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', flex: 1 },
  headerBtn: { padding: 8 },
  headerBtnText: { color: '#8b5cf6', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', flex: 1, marginRight: 8 },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 6 },
  distanceText: { fontSize: 13, color: '#8b5cf6', fontWeight: '600', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { backgroundColor: '#8b5cf6' },
  btnReject: { backgroundColor: '#ef4444' },
  btnComplete: { backgroundColor: '#16a34a' },
  btnMap: { backgroundColor: '#334155' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  detailLink: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, alignItems: 'center' },
  detailText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
});
