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
import { launchImageLibrary } from "react-native-image-picker";
import Icon from "react-native-vector-icons/Ionicons";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const EditProductScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [name, setName] = useState(product.name || "");
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price?.toString() || "");
  const [quantity, setQuantity] = useState(product.quantity?.toString() || product.stock?.toString() || "");
  const [unit, setUnit] = useState(product.unit || "");
  const [season, setSeason] = useState(product.season || "");
  const [region, setRegion] = useState(product.region || product.location?.address || "");
  const [category, setCategory] = useState(product.category || "");
  const [growingRegion, setGrowingRegion] = useState(product.growingRegion || "");
  const [image, setImage] = useState(product.imageUrl || null);
  const [loading, setLoading] = useState(false);
  // Modal
  const [isSeasonModalVisible, setSeasonModalVisible] = useState(false);
  const [isUnitModalVisible, setUnitModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  // Vị trí
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);
  // Khởi tạo vị trí (ưu tiên vị trí cũ)
  useEffect(() => {
    if (product?.location?.latitude && product?.location?.longitude) {
      setLocation({
        latitude: product.location.latitude,
        longitude: product.location.longitude,
      });
      setRegion(product.location.address || product.region || "Vị trí đã lưu");
    } else {
      fetchCurrentLocation();
    }
  }, [product]);

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
      const res = await fetch(url, { headers: { "User-Agent": "NongSanApp/1.0" } });
      const data = await res.json();
      return data?.display_name || "Không xác định địa chỉ";
    } catch (error) {
      return "Lỗi lấy địa chỉ";
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setLoading(true);
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const coords = await getCurrentLocation();
      setLocation(coords);
      const addr = await reverseGeocode(coords.latitude, coords.longitude);
      setRegion(addr);

      mapRef.current?.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } catch (error) {
      console.error("Lỗi lấy vị trí:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = async (region) => {
    const newCoords = { latitude: region.latitude, longitude: region.longitude };
    setLocation(newCoords);
    const addr = await reverseGeocode(newCoords.latitude, newCoords.longitude);
    setRegion(addr);
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", quality: 0.8 });
    if (!result.didCancel && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpdateProduct = async () => {
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
    if (isNaN(qtyNum) || qtyNum < 0) {
      Alert.alert("Lỗi", "Số lượng tồn kho phải là số hợp lệ (≥ 0)!");
      return;
    }

    try {
      setLoading(true);

      await firestore().collection("products").doc(product.id).update({
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
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: region,
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert("Thành công", "Cập nhật sản phẩm thành công!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      Alert.alert("Lỗi", "Không thể cập nhật sản phẩm: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const seasons = ["Xuân", "Hạ", "Thu", "Đông"];
  const units = ["kg", "bó", "thùng", "tạ", "tấn", "quả", "chục"];
  const categories = ["Rau củ", "Trái cây", "Hạt giống", "Nông sản khô", "Gia vị", "Hoa", "Cây giống"];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Ảnh */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage} style={styles.imageBox}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Icon name="image-outline" size={40} color="#aaa" />
              <Text style={{ marginTop: 8, color: "#888", fontSize: 12 }}>Chỉnh sửa ảnh</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Tên sản phẩm *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Tên sản phẩm" />

      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder="Mô tả sản phẩm..."
      />

      <Text style={styles.label}>Giá bán (VNĐ / {unit || "đơn vị"}) *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="25000"
      />

      <Text style={styles.label}>Số lượng tồn *</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="VD: 50 (có thể để 0 nếu hết hàng)"
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
        placeholder="VD: Đà Lạt, Lâm Đồng..."
      />

      <Text style={styles.label}>Vị trí bán hàng</Text>
      <TextInput
        style={[styles.input, { color: "#555" }]}
        value={region}
        editable={false}
        multiline
      />

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

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleUpdateProduct}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </Text>
      </TouchableOpacity>

      {/* Modal Đơn vị */}
      <Modal transparent visible={isUnitModalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setUnitModalVisible(false)}>
          <View style={styles.modalBox}>
            {units.map((item) => (
              <TouchableOpacity key={item} style={styles.modalItem} onPress={() => { setUnit(item); setUnitModalVisible(false); }}>
                <Text style={[styles.modalText, unit === item && styles.selectedText]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Danh mục */}
      <Modal transparent visible={isCategoryModalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalBox}>
            {categories.map((item) => (
              <TouchableOpacity key={item} style={styles.modalItem} onPress={() => { setCategory(item); setCategoryModalVisible(false); }}>
                <Text style={[styles.modalText, category === item && styles.selectedText]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Mùa vụ */}
      <Modal transparent visible={isSeasonModalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSeasonModalVisible(false)}>
          <View style={styles.modalBox}>
            {seasons.map((item) => (
              <TouchableOpacity key={item} style={styles.modalItem} onPress={() => { setSeason(item); setSeasonModalVisible(false); }}>
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
  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
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

export default EditProductScreen;