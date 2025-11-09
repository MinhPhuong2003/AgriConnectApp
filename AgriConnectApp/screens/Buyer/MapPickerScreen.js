import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/Ionicons";
import Geolocation from "@react-native-community/geolocation";

const throttle = (func, delay) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), delay);
    }
  };
};

const MapPickerScreen = ({ navigation, route }) => {
  const { initialCoords, initialAddress } = route.params || {};
  const [markerCoords, setMarkerCoords] = useState(initialCoords || null);
  const [address, setAddress] = useState(initialAddress || "Đang xác định vị trí...");
  const [loading, setLoading] = useState(!initialCoords);
  const [searchText, setSearchText] = useState(initialAddress || "");
  const mapRef = useRef(null);
  const watchId = useRef(null);

  const lastValidAddress = useRef(initialAddress || "Đang xác định vị trí...");

  const requestLocationPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const reverseGeocode = async (lat, lng) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "ReactNativeApp/1.0" },
      });
      const data = await res.json();
      if (data?.display_name) {
        const addr = data.display_name;
        lastValidAddress.current = addr;
        setAddress(addr);
      } else {
        setAddress(lastValidAddress.current || "Không xác định được địa chỉ");
      }
    } catch (error) {
      console.error("Lỗi reverse geocoding:", error);
      setAddress(lastValidAddress.current || "Lỗi kết nối mạng");
    }
  };

  const throttledReverseGeocode = useCallback(
    throttle((lat, lng) => reverseGeocode(lat, lng), 1000),
    []
  );

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  };

  const startLocationWatch = () => {
    watchId.current = Geolocation.watchPosition(
      (position) => {
        const coords = position.coords;
        setMarkerCoords(coords);
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            },
            500
          );
        }
        throttledReverseGeocode(coords.latitude, coords.longitude);
      },
      (error) => console.log("Lỗi theo dõi:", error),
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 5000,
        fastestInterval: 2000,
      }
    );
  };

  useEffect(() => {
    let isMounted = true;

    const initLocation = async () => {
      if (initialCoords) {
        setMarkerCoords(initialCoords);
        mapRef.current?.animateToRegion(
          {
            latitude: initialCoords.latitude,
            longitude: initialCoords.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          },
          1000
        );
        setLoading(false);
        return;
      }

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        if (isMounted) {
          Alert.alert("Cảnh báo", "Bạn cần cấp quyền vị trí để dùng tính năng này.");
          setAddress("Chưa cấp quyền vị trí");
          setLoading(false);
        }
        return;
      }

      try {
        setAddress("Đang lấy vị trí GPS...");
        const coords = await getCurrentLocation();

        if (!isMounted) return;

        setMarkerCoords(coords);
        setAddress("Đang lấy địa chỉ...");
        await reverseGeocode(coords.latitude, coords.longitude);

        mapRef.current?.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          },
          1000
        );

        startLocationWatch();
      } catch (error) {
        console.error("Lỗi GPS:", error);
        if (isMounted) {
          Alert.alert(
            "Lỗi GPS",
            "Không thể lấy vị trí. Vui lòng bật GPS và thử lại.",
            [{ text: "Thử lại", onPress: initLocation }]
          );
          setAddress("Không lấy được GPS");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initLocation();

    return () => {
      isMounted = false;
      if (watchId.current) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, [initialCoords, initialAddress]);

  const handleRegionChange = (region) => {
    setMarkerCoords({
      latitude: region.latitude,
      longitude: region.longitude,
    });
    throttledReverseGeocode(region.latitude, region.longitude);
  };

  const goToCurrentLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      setMarkerCoords(coords);
      mapRef.current?.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        800
      );
      await reverseGeocode(coords.latitude, coords.longitude);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại.");
    }
  };

  const searchLocation = async () => {
    if (!searchText.trim()) return;

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchText
      )}&format=json&addressdetails=1&limit=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "ReactNativeApp/1.0" },
      });
      const data = await res.json();

      if (data.length > 0) {
        const loc = data[0];
        const newCoords = {
          latitude: parseFloat(loc.lat),
          longitude: parseFloat(loc.lon),
        };
        setMarkerCoords(newCoords);
        mapRef.current?.animateToRegion(
          {
            ...newCoords,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          },
          800
        );
        const addr = loc.display_name;
        lastValidAddress.current = addr;
        setAddress(addr);
      } else {
        Alert.alert("Không tìm thấy", "Vui lòng thử lại với địa chỉ khác.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tìm kiếm. Kiểm tra kết nối mạng.");
    }
  };

  const handleConfirm = () => {
    if (loading || !markerCoords) return;
    console.log("MapPicker - Sending params:", { coords: markerCoords, address });
    navigation.navigate("PickupLocation", {
      coords: markerCoords,
      address: address,
    });
  };

  const goBackToPickupLocations = () => {
    navigation.navigate("PickupLocation");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBackToPickupLocations} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn vị trí trên bản đồ</Text>
      </View>
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => {
          navigation.navigate("AddressSearch", {
            onSelectAddress: (coords, address) => {
              setMarkerCoords(coords);
              setAddress(address);
              setSearchText(address);
              mapRef.current?.animateToRegion(
                {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.002,
                  longitudeDelta: 0.002,
                },
                800
              );
            },
          });
        }}
      >
        <Icon name="search" size={22} color="#666" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>
          {searchText ? searchText : "Nhập địa chỉ..."}
        </Text>
      </TouchableOpacity>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChange}
        initialRegion={
          markerCoords
            ? {
                latitude: markerCoords.latitude,
                longitude: markerCoords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
            : undefined
        }
      >
        {markerCoords && (
          <Marker coordinate={markerCoords}>
            <View style={styles.markerPin} />
          </Marker>
        )}
      </MapView>
      <TouchableOpacity style={styles.myLocationButton} onPress={goToCurrentLocation}>
        <Icon name="locate" size={26} color="#fff" />
      </TouchableOpacity>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#d32f2f" />
          <Text style={styles.loadingText}>Đang xác định vị trí của bạn...</Text>
        </View>
      )}
      <View style={styles.bottomPanel}>
        <View style={styles.addressBox}>
          <Icon name="location-outline" size={18} color="#d32f2f" />
          <Text style={styles.addressText} numberOfLines={2}>
            {address}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, (loading || !markerCoords) && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={loading || !markerCoords}
        >
          <Text style={styles.confirmText}>Xác nhận vị trí</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "android" ? 50 : 60,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
    zIndex: 10,
  },
  backBtn: { padding: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: "600", color: "#000", marginLeft: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: { marginRight: 12 },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15.5,
    color: "#444",
    fontWeight: "500",
    paddingRight: 8,
  },
  map: { flex: 1 },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  markerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#d32f2f",
    borderWidth: 4,
    borderColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  myLocationButton: {
    position: "absolute",
    right: 16,
    bottom: 140,
    backgroundColor: "#d32f2f",
    padding: 14,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#d32f2f",
    fontWeight: "500",
  },
});

export default MapPickerScreen;