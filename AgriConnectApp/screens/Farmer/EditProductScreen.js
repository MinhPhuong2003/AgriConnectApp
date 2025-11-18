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
  const [unit, setUnit] = useState(product.unit || "");
  const [season, setSeason] = useState(product.season || "");
  const [region, setRegion] = useState(product.region || "");
  const [category, setCategory] = useState(product.category || "");
  const [growingRegion, setGrowingRegion] = useState(product.growingRegion || ""); // THÊM MỚI
  const [image, setImage] = useState(product.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [isSeasonModalVisible, setSeasonModalVisible] = useState(false);
  const [isUnitModalVisible, setUnitModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);

  // === CHỈ LẤY VỊ TRÍ HIỆN TẠI NẾU CHƯA CÓ ===
  useEffect(() => {
    const initLocation = async () => {
      // ƯU TIÊN: DÙNG VỊ TRÍ CŨ NẾU CÓ
      if (product?.location?.latitude && product?.location?.longitude) {
        setLocation({
          latitude: product.location.latitude,
          longitude: product.location.longitude,
        });
        setRegion(product.location.address || product.region || "Vị trí đã lưu");
        return;
      }

      // MỚI LẤY VỊ TRÍ HIỆN TẠI
      try {
        setLoading(true);
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          Alert.alert("Lỗi", "Bạn chưa cấp quyền vị trí");
          return;
        }
        const coords = await getCurrentLocation();
        setLocation(coords);
        const addr = await reverseGeocode(coords.latitude, coords.longitude);
        setRegion(addr);

        mapRef.current?.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000
        );
      } catch (error) {
        console.error("Lỗi lấy vị trí:", error.message);
      } finally {
        setLoading(false);
      }
    };

    initLocation();
  }, [product]);

  const requestLocationPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Cấp quyền vị trí",
          message: "Ứng dụng cần vị trí để lưu thông tin sản phẩm",
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
      return data?.display_name || "Không xác định địa chỉ";
    } catch (error) {
      console.error("Nominatim error:", error);
      return "Lỗi lấy địa chỉ";
    }
  };

  const handleRegionChange = async (region) => {
    const newCoords = { latitude: region.latitude, longitude: region.longitude };
    setLocation(newCoords);
    try {
      const fullAddress = await reverseGeocode(newCoords.latitude, newCoords.longitude);
      setRegion(fullAddress);
    } catch (error) {
      setRegion("Không thể lấy địa chỉ");
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      includeBase64: false,
    });
    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpdateProduct = async () => {
    // THÊM KIỂM TRA growingRegion
    if (!name || !price || !season || !region || !unit || !image || !category || !location || !growingRegion.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin, bao gồm cả khu vực địa lý (nơi trồng)!");
      return;
    }

    try {
      setLoading(true);
      await firestore().collection("products").doc(product.id).update({
        name,
        description,
        price: parseFloat(price),
        unit,
        imageUrl: image,
        season,
        region,
        category,
        growingRegion: growingRegion.trim(), // THÊM MỚI: Cập nhật khu vực địa lý
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: region,
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert(
        "Thành công",
        "Cập nhật sản phẩm thành công!",
        [{ text: "OK", onPress: () => navigation.goBack() }],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Lỗi cập nhật sản phẩm:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const seasons = ["Xuân", "Hạ", "Thu", "Đông"];
  const units = ["kg", "bó", "thùng"];
  const categories = ["Rau củ", "Trái cây", "Hạt giống", "Nông sản khô"];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Ảnh */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <TouchableOpacity onPress={pickImage} style={styles.imageBox}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <Icon name="image-outline" size={28} color="#ccc" />
          )}
        </TouchableOpacity>
        <Text style={{ fontSize: 14, color: "#666", marginTop: 6 }}>
          Chỉnh sửa ảnh sản phẩm
        </Text>
      </View>

      <Text style={styles.label}>Tên sản phẩm</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Giá (VNĐ)</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Đơn vị</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectBox]}
        onPress={() => setUnitModalVisible(true)}
      >
        <Text style={{ color: unit ? "#000" : "#999" }}>
          {unit || "Chọn đơn vị"}
        </Text>
        <Icon name="chevron-down-outline" size={18} color="#666" />
      </TouchableOpacity>

      <Modal transparent visible={isUnitModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setUnitModalVisible(false)}
          />
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
                <Text
                  style={[
                    styles.modalText,
                    unit === item && { fontWeight: "bold", color: "#2e7d32" },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>Danh mục</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectBox]}
        onPress={() => setCategoryModalVisible(true)}
      >
        <Text style={{ color: category ? "#000" : "#999" }}>
          {category || "Chọn danh mục"}
        </Text>
        <Icon name="chevron-down-outline" size={18} color="#666" />
      </TouchableOpacity>

      <Modal transparent visible={isCategoryModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCategoryModalVisible(false)}
          />
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
                <Text
                  style={[
                    styles.modalText,
                    category === item && { fontWeight: "bold", color: "#2e7d32" },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>Mùa vụ</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectBox]}
        onPress={() => setSeasonModalVisible(true)}
      >
        <Text style={{ color: season ? "#000" : "#999" }}>
          {season || "Chọn mùa vụ"}
        </Text>
        <Icon name="chevron-down-outline" size={18} color="#666" />
      </TouchableOpacity>

      <Modal transparent visible={isSeasonModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSeasonModalVisible(false)}
          />
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
                <Text
                  style={[
                    styles.modalText,
                    season === item && { fontWeight: "bold", color: "#2e7d32" },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* THÊM MỚI: Khu vực địa lý (nơi trồng) */}
      <Text style={styles.label}>
        Khu vực địa lý{' '}
      </Text>
      <TextInput
        style={styles.input}
        value={growingRegion}
        onChangeText={setGrowingRegion}
        placeholder="Nhập khu vực trồng..."
        placeholderTextColor="#aaa"
      />

      {/* Vị trí */}
      <Text style={styles.label}>Vị trí</Text>
      <TextInput
        style={[styles.input, { textAlign: "left" }]}
        value={region}
        onChangeText={setRegion}
        placeholder="Đang lấy vị trí..."
        editable={true}
        multiline={true}
        scrollEnabled={false}
      />

      {/* Mini Map */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            onRegionChangeComplete={handleRegionChange}
          >
            <Marker
              coordinate={location}
              draggable
              onDragEnd={(e) => {
                const newCoords = e.nativeEvent.coordinate;
                setLocation(newCoords);
                reverseGeocode(newCoords.latitude, newCoords.longitude).then(setRegion);
              }}
            >
              <View style={styles.markerPin} />
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Đang tải bản đồ...</Text>
          </View>
        )}
      </View>

      {/* Nút lưu */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleUpdateProduct}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 14,
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
  selectBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: "cover",
  },
  button: {
    backgroundColor: "#2D6B60",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalItem: {
    paddingVertical: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  mapPlaceholderText: {
    color: "#999",
    fontSize: 14,
  },
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
});

export default EditProductScreen;