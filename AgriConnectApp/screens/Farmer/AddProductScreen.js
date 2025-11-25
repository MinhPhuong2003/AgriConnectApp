import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
  Platform,
  PermissionsAndroid,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { launchImageLibrary } from "react-native-image-picker";
import Icon from "react-native-vector-icons/Ionicons";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const AddProductScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [season, setSeason] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [growingRegion, setGrowingRegion] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  // Modal
  const [isSeasonModalVisible, setSeasonModalVisible] = useState(false);
  const [isUnitModalVisible, setUnitModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  // Vị trí
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);
  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!auth().currentUser) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập trước khi thêm sản phẩm!");
      navigation.navigate("Login");
    }
  }, [navigation]);
  // === QUYỀN VÀ LẤY VỊ TRÍ ===
  const requestLocationPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Cấp quyền vị trí",
          message: "Ứng dụng cần truy cập vị trí để lưu thông tin sản phẩm",
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
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
    });
  };

  const reverseGeocode = async (lat, lng) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "NongSanApp/1.0" },
      });
      const data = await res.json();
      return data?.display_name || "Không xác định được địa chỉ";
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "Không thể lấy địa chỉ";
    }
  };

  // Lấy vị trí khi mở màn hình
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          Alert.alert("Lỗi", "Bạn chưa cấp quyền vị trí");
          return;
        }
        const coords = await getCurrentLocation();
        setLocation(coords);
        const address = await reverseGeocode(coords.latitude, coords.longitude);
        setRegion(address);

        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } catch (error) {
        console.error("Lỗi lấy vị trí:", error);
        Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại");
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, []);

  const handleRegionChange = async (region) => {
    const newCoords = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
    setLocation(newCoords);
    const address = await reverseGeocode(newCoords.latitude, newCoords.longitude);
    setRegion(address);
  };

  // === CHỌN ẢNH ===
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
    });
    if (!result.didCancel && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  };

  // === THÊM SẢN PHẨM ===
  const handleAddProduct = async () => {
    if (!auth().currentUser) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập!");
      return;
    }

    // Kiểm tra đầy đủ thông tin
    if (!name.trim() || !price || !quantity || !unit || !season || !category || !image || !location || !growingRegion.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ tất cả các trường bắt buộc!");
      return;
    }

    const priceNum = parseFloat(price);
    const qtyNum = parseFloat(quantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Lỗi", "Giá phải là số lớn hơn 0!");
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert("Lỗi", "Số lượng tồn kho phải là số lớn hơn 0!");
      return;
    }

    const user = auth().currentUser;

    try {
      setLoading(true);

      await firestore().collection("products").add({
        name: name.trim(),
        description: description.trim() || "",
        price: priceNum,
        quantity: qtyNum,
        stock: qtyNum,
        unit,
        imageUrl: image,
        season,
        region,
        category,
        growingRegion: growingRegion.trim(),

        farmerId: user.uid,
        farmerName: user.displayName || "Nông dân",
        farmerAvatarUrl: user.photoURL || null,

        sellerId: user.uid,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: region,
        },
        createdAt: firestore.FieldValue.serverTimestamp(),
        available: true,
        avgRating: 0,
        reviewsCount: 0,
      });

      Alert.alert("Thành công", "Sản phẩm đã được thêm!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      Alert.alert("Lỗi", "Không thể thêm sản phẩm: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dữ liệu chọn
  const seasons = ["Xuân", "Hạ", "Thu", "Đông"];
  const units = ["kg", "bó", "thùng", "tạ", "tấn", "quả", "chục"];
  const categories = ["Rau củ", "Trái cây", "Hạt giống", "Nông sản khô"];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Ảnh sản phẩm */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage} style={styles.imageBox}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Icon name="image-outline" size={40} color="#aaa" />
              <Text style={{ marginTop: 8, color: "#888", fontSize: 12 }}>Thêm ảnh</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.imageHint}>Bắt buộc - Chọn ảnh sản phẩm</Text>
      </View>

      <Text style={styles.label}>Tên sản phẩm *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Cà chua sạch Đà Lạt" />

      <Text style={styles.label}>Mô tả (không bắt buộc)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder="Nói về chất lượng, nguồn gốc, cách trồng..."
      />

      <Text style={styles.label}>Giá bán (VNĐ / {unit || "đơn vị"}) *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="25000"
      />

      {/* Số lượng tồn kho */}
      <Text style={styles.label}>Số lượng tồn *</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="VD: 50 (kg, bó, thùng...)"
      />

      <Text style={styles.label}>Đơn vị *</Text>
      <TouchableOpacity style={[styles.input, styles.selectBox]} onPress={() => setUnitModalVisible(true)}>
        <Text style={{ color: unit ? "#000" : "#999" }}>{unit || "Chọn đơn vị"}</Text>
        <Icon name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Text style={styles.label}>Danh mục *</Text>
      <TouchableOpacity style={[styles.input, styles.selectBox]} onPress={() => setCategoryModalVisible(true)}>
        <Text style={{ color: category ? "#000" : "#999" }}>{category || "Chọn danh mục"}</Text>
        <Icon name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Text style={styles.label}>Mùa vụ *</Text>
      <TouchableOpacity style={[styles.input, styles.selectBox]} onPress={() => setSeasonModalVisible(true)}>
        <Text style={{ color: season ? "#000" : "#999" }}>{season || "Chọn mùa vụ"}</Text>
        <Icon name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Text style={styles.label}>Khu vực trồng *</Text>
      <TextInput
        style={styles.input}
        value={growingRegion}
        onChangeText={setGrowingRegion}
        placeholder="VD: Đà Lạt, Lâm Đồng, Di Linh..."
      />

      <Text style={styles.label}>Vị trí bán hàng</Text>
      <TextInput
        style={[styles.input, { color: "#555" }]}
        value={region}
        editable={false}
        multiline
      />

      {/* Bản đồ nhỏ */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onRegionChangeComplete={handleRegionChange}
          >
            <Marker
              coordinate={location}
              draggable
              onDragEnd={(e) => {
                const coord = e.nativeEvent.coordinate;
                setLocation(coord);
                reverseGeocode(coord.latitude, coord.longitude).then(setRegion);
              }}
            />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text>Đang tải bản đồ...</Text>
          </View>
        )}
      </View>

      {/* Nút thêm */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleAddProduct}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Đang lưu sản phẩm..." : "Thêm sản phẩm"}
        </Text>
      </TouchableOpacity>

      {/* Modal chọn Đơn vị */}
      <Modal transparent visible={isUnitModalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setUnitModalVisible(false)}>
          <View style={styles.modalBox}>
            {units.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setUnit(item);
                  setUnitModalVisible(false);
                }}
              >
                <Text style={[styles.modalText, unit === item && styles.selectedText]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal chọn Danh mục */}
      <Modal transparent visible={isCategoryModalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalBox}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setCategory(item);
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={[styles.modalText, category === item && styles.selectedText]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal chọn Mùa vụ */}
      <Modal transparent visible={isSeasonModalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSeasonModalVisible(false)}>
          <View style={styles.modalBox}>
            {seasons.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setSeason(item);
                  setSeasonModalVisible(false);
                }}
              >
                <Text style={[styles.modalText, season === item && styles.selectedText]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  textarea: { height: 100, textAlignVertical: "top" },
  selectBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  imageSection: { alignItems: "center", marginBottom: 24 },
  imageBox: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: 120, height: 120, borderRadius: 16 },
  imageHint: { marginTop: 8, fontSize: 13, color: "#d32f2f" },
  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: "80%", borderRadius: 12, padding: 10 },
  modalItem: { paddingVertical: 14, paddingHorizontal: 10 },
  modalText: { fontSize: 16, textAlign: "center" },
  selectedText: { fontWeight: "bold", color: "#2e7d32" },
});

export default AddProductScreen;