import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, PermissionsAndroid, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

interface LocationGateProps {
    children: React.ReactNode;
}

type Status = 'checking' | 'permission_denied' | 'gps_off' | 'granted';

export default function LocationGate({ children }: LocationGateProps) {
    const [status, setStatus] = useState<Status>('checking');
    const [error, setError] = useState<string | null>(null);

    const checkLocation = useCallback(async () => {
        setStatus('checking');
        setError(null);

        if (Platform.OS === 'android') {
            const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

            if (!hasPermission) {
                const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
                    title: "Location Permission Required",
                    message: "TowAssist needs access to your location to find nearby towing requests.",
                    buttonPositive: "OK"
                });

                if (result !== PermissionsAndroid.RESULTS.GRANTED) {
                    setStatus('permission_denied');
                    return;
                }
            }

            if (Platform.Version >= 33) {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            }
        }

        Geolocation.getCurrentPosition(
            (pos) => {
                setStatus('granted');
            },
            (err) => {
                console.log('Location error:', err);
                if (err.code === 1) {
                    setStatus('permission_denied');
                } else if (err.code === 2 || err.code === 3) {
                    setStatus('gps_off');
                } else {
                    setError(err.message);
                    setStatus('gps_off');
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
        );
    }, []);

    useEffect(() => {
        checkLocation();
    }, [checkLocation]);

    if (status === 'granted') {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.pulse} />
                    <Text style={styles.icon}>📍</Text>
                </View>

                <Text style={styles.title}>
                    {status === 'permission_denied' ? 'Location Required' :
                        status === 'gps_off' ? 'Enable GPS' : 'Checking Location...'}
                </Text>

                <Text style={styles.description}>
                    {status === 'permission_denied' ?
                        "We need your location to find nearby towing requests. Please grant permission to continue." :
                        status === 'gps_off' ?
                            "High accuracy GPS must be enabled to receive work. Please turn on your location services." :
                            "Ensuring your device is ready for work..."}
                </Text>

                {status !== 'checking' ? (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={status === 'permission_denied' ? () => Linking.openSettings() : checkLocation}
                    >
                        <Text style={styles.buttonText}>
                            {status === 'permission_denied' ? 'Open Settings' : 'Try Again'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <ActivityIndicator color="#8b5cf6" size="large" style={{ marginTop: 24 }} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    iconContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    icon: {
        fontSize: 56,
    },
    pulse: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#8b5cf615',
        borderWidth: 2,
        borderColor: '#8b5cf633',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 12,
    },
    button: {
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
