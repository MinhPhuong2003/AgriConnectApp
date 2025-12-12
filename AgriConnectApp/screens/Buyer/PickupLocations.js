import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  PermissionsAndroid,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Geolocation from "@react-native-community/geolocation";
import firestore from "@react-native-firebase/firestore";

// === HÀM LẤY GPS TRỰC TIẾP ===
const requestLocationPermission = async () => {
  if (Platform.OS !== "android") return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Cấp quyền vị trí",
        message: "Ứng dụng cần vị trí để tìm sản phẩm gần bạn",
        buttonPositive: "Cho phép",
        buttonNegative: "Từ chối",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      }
    );
  });
};

const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ReactNativeApp/1.0" },
    });
    const data = await res.json();
    if (data?.display_name) {
      return data.display_name;
    } else {
      throw new Error("Không xác định được địa chỉ");
    }
  } catch (error) {
    console.error("Nominatim error:", error);
    throw error;
  }
};

const formatAddress = (fullAddress) => {
  return fullAddress || "Đang xác định vị trí...";
};

const searchLocation = async (query, setSelectedAddress, setSelectedCoords, setSearchQuery) => {
  if (!query.trim()) return;
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
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
      setSelectedCoords(newCoords);
      setSelectedAddress(formatAddress(loc.display_name));
      setSearchQuery(query);
    } else {
      Alert.alert("Không tìm thấy", "Vui lòng thử lại với địa chỉ khác.");
    }
  } catch (error) {
    Alert.alert("Lỗi", "Không thể tìm kiếm. Kiểm tra kết nối mạng.");
  }
};

// Tính khoảng cách bằng công thức Haversine (đơn vị: km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return isNaN(distance) ? 0 : distance;
};

const toRad = (value) => (value * Math.PI) / 180;

const PickupLocations = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("Đang xác định vị trí...");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const fetchLocation = async () => {
    try {
      setLoading(true);
      setCurrentAddress("Đang lấy GPS...");
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error("Bạn chưa cấp quyền vị trí");
      }
      const coords = await getCurrentLocation();
      setSelectedCoords(coords);
      setCurrentAddress("Đang lấy địa chỉ...");
      const fullAddress = await reverseGeocode(coords.latitude, coords.longitude);
      setCurrentAddress(formatAddress(fullAddress));
      fetchNearbyProducts(coords);
    } catch (error) {
      console.error("Lỗi lấy vị trí:", error.message);
      Alert.alert(
        "Không thể lấy vị trí",
        error.message,
        [
          { text: "Thử lại", onPress: fetchLocation },
          { text: "Hủy", style: "cancel" },
        ]
      );
      setCurrentAddress("Không thể lấy vị trí");
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyProducts = async (currentCoords) => {
    if (!currentCoords) return;
    try {
      const snapshot = await firestore().collection("products").where("available", "==", true).get();
      const productList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const nearbyProducts = productList.filter((product) => {
        const productLat = product.location?.latitude || 0;
        const productLon = product.location?.longitude || 0;
        const distance = calculateDistance(
          currentCoords.latitude,
          currentCoords.longitude,
          productLat,
          productLon
        );
        return distance <= 3 && distance >= 0;
      });

      setProducts(nearbyProducts);
    } catch (error) {
      console.error("❌ Lỗi tải sản phẩm gần đây:", error);
      Alert.alert("Lỗi", "Không thể tải sản phẩm gần đây.");
    }
  };

  const openMapPicker = () => {
    navigation.navigate("MapPicker", {});
  };

  const handleSearchFocus = () => {
    navigation.navigate("SearchResult", { searchQuery, selectedCoords });
  };

  useEffect(() => {
  if (route.params?.coords && route.params?.address) {
    const { coords, address } = route.params;
    setSelectedCoords(coords);
    setSelectedAddress(address);
    setSearchQuery(address);
    fetchNearbyProducts(coords);
  }
}, [route.params]);



  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      const { coords, address, searchQuery: newSearchQuery } = route.params || {};
      if (coords && address) {
        setSelectedCoords(coords);
        setSelectedAddress(formatAddress(address));
        setSearchQuery("");
        fetchNearbyProducts(coords);
        navigation.setParams({ coords: null, address: null });
      }
      if (newSearchQuery) {
        setSearchQuery(newSearchQuery);
        searchLocation(newSearchQuery, setSelectedAddress, setSelectedCoords, setSearchQuery);
        if (selectedCoords) {
          fetchNearbyProducts(selectedCoords);
        }
        navigation.setParams({ searchQuery: null });
      }
    });

    return unsubscribe;
  }, [navigation, route, selectedCoords]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    >
      <View style={styles.row}>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name || "Sản phẩm không tên"}</Text>
          <Text style={styles.address} numberOfLines={2}>
            {item.location?.address || item.region || "Không có địa chỉ"}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.details}>Chi tiết</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Image 
            source={{ 
              uri: item.imageBase64 || item.imageUrl || PLACEHOLDER
            }} 
            style={styles.image} 
          />
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              {`${calculateDistance(
                selectedCoords?.latitude || 0,
                selectedCoords?.longitude || 0,
                item.location.latitude || 0,
                item.location.longitude || 0
              ).toFixed(2)} km`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={() => navigation.navigate("HomeBuyer")}>
            <Icon name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchInputContainer}
            onPress={handleSearchFocus}
          >
            <Icon name="search" size={18} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Sản phẩm gần bạn..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={selectedAddress || searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setSelectedAddress("");
              }}
              onSubmitEditing={() =>
                searchLocation(searchQuery, setSelectedAddress, setSelectedCoords, setSearchQuery)
              }
              returnKeyType="search"
              editable={false}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={openMapPicker}>
            <Icon name="map-outline" size={22} color="#d32f2f" />
          </TouchableOpacity>
        </View>
        <View style={styles.locationRow}>
          <Icon name="location" size={18} color="#d32f2f" />
          <Text style={styles.locationText} numberOfLines={3}>
            {currentAddress}
          </Text>
          <Text style={styles.retry} onPress={fetchLocation}>
            {loading ? "..." : "Thử lại"}
          </Text>
        </View>
        <Text style={styles.sectionTitle}>SẢN PHẨM GẦN ĐÂY</Text>
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>Không có sản phẩm gần đây</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, backgroundColor: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    zIndex: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    minHeight: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    textAlign: "left",
    includeFontPadding: false,
    padding: 0,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  locationText: {
    flex: 1,
    marginLeft: 5,
    fontSize: 13,
    color: "#d32f2f",
    fontWeight: "600",
    lineHeight: 18,
  },
  retry: {
    color: "#d32f2f",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontWeight: "600",
    color: "#d32f2f",
    fontSize: 13,
  },
  list: { padding: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 0.3,
    borderColor: "#eee",
  },
  row: { flexDirection: "row", alignItems: "center" },
  infoContainer: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  address: {
    color: "#555",
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  details: { color: "#007aff", fontSize: 13, fontWeight: "500" },
  right: { marginLeft: 10, alignItems: "center", position: "relative" },
  image: { width: 80, height: 80, borderRadius: 8 },
  distanceBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    elevation: 3,
  },
  distanceText: { fontSize: 11, fontWeight: "600", color: "#d32f2f" },
  emptyText: { textAlign: "center", color: "#777", fontSize: 14, padding: 20 },
});

export default PickupLocations;