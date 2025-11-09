import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";

// Hàm tính khoảng cách (m) giữa 2 tọa độ (Haversine)
const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // m
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Theo dõi nếu người dùng đang kéo map
  const userPanning = useRef(false);
  const lastPanTime = useRef(0);

  const requestLocationPermission = async () => {
    if (Platform.OS === "ios") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Yêu cầu quyền truy cập vị trí",
          message: "Ứng dụng cần quyền vị trí để hoạt động chính xác.",
          buttonNeutral: "Hỏi lại sau",
          buttonNegative: "Từ chối",
          buttonPositive: "Đồng ý",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  useEffect(() => {
    let watcher;

    const startLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert("Cảnh báo", "Ứng dụng cần quyền vị trí để hoạt động.");
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          if (!region) {
            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
          setLoading(false);

          watcher = Geolocation.watchPosition(
            (pos) => {
              setLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            },
            (err) => console.log("Watch error:", err),
            { enableHighAccuracy: true, distanceFilter: 5 }
          );
        },
        (error) => {
          Alert.alert(
            "Lỗi GPS",
            `Mã lỗi: ${error.code}\n${error.message}\n\nHãy ra ngoài trời và bật Wi-Fi/4G.`
          );
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 60000,
          maximumAge: 120000,
        }
      );
    };

    startLocation();

    return () => {
      if (watcher) Geolocation.clearWatch(watcher);
    };
  }, [region]);

  // Khi user kéo map -> đánh dấu user đang panning
  const handlePanDrag = () => {
    userPanning.current = true;
    lastPanTime.current = Date.now();
  };

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);

    if (!location) return;

    // khoảng cách giữa center mới và vị trí user hiện tại (m)
    const distToUser = haversineDistanceMeters(
      newRegion.latitude,
      newRegion.longitude,
      location.latitude,
      location.longitude
    );

    const timeSincePan = Date.now() - lastPanTime.current;

    if (distToUser < 40) {
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        800
      );
      // Reset flag panning sau khi animate (đã xử lý nút)
      userPanning.current = false;
      lastPanTime.current = 0;
    }
  };

  // Không dùng onUserLocationChange để animate nữa (tránh zoom khi GPS cập nhật)
  const handleUserLocationChange = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang xác định vị trí...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không thể lấy vị trí của bạn.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onUserLocationChange={handleUserLocationChange}
        onPanDrag={handlePanDrag}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#333" },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
