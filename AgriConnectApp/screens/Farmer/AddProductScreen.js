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
  FlatList,
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
  const [provinceModal, setProvinceModal] = useState(false);
  const provinces = [
    { label: "Hà Nội", value: "Hà Nội" },
    { label: "TP. Hồ Chí Minh", value: "TP. Hồ Chí Minh" },
    { label: "An Giang", value: "An Giang" },
    { label: "Bà Rịa - Vũng Tàu", value: "Bà Rịa - Vũng Tàu" },
    { label: "Bắc Giang", value: "Bắc Giang" },
    { label: "Bắc Kạn", value: "Bắc Kạn" },
    { label: "Bạc Liêu", value: "Bạc Liêu" },
    { label: "Bắc Ninh", value: "Bắc Ninh" },
    { label: "Bến Tre", value: "Bến Tre" },
    { label: "Bình Định", value: "Bình Định" },
    { label: "Bình Dương", value: "Bình Dương" },
    { label: "Bình Phước", value: "Bình Phước" },
    { label: "Bình Thuận", value: "Bình Thuận" },
    { label: "Cà Mau", value: "Cà Mau" },
    { label: "Cần Thơ", value: "Cần Thơ" },
    { label: "Cao Bằng", value: "Cao Bằng" },
    { label: "Đà Nẵng", value: "Đà Nẵng" },
    { label: "Đắk Lắk", value: "Đắk Lắk" },
    { label: "Đắk Nông", value: "Đắk Nông" },
    { label: "Điện Biên", value: "Điện Biên" },
    { label: "Đồng Nai", value: "Đồng Nai" },
    { label: "Đồng Tháp", value: "Đồng Tháp" },
    { label: "Gia Lai", value: "Gia Lai" },
    { label: "Hà Giang", value: "Hà Giang" },
    { label: "Hà Nam", value: "Hà Nam" },
    { label: "Hà Tĩnh", value: "Hà Tĩnh" },
    { label: "Hải Dương", value: "Hải Dương" },
    { label: "Hải Phòng", value: "Hải Phòng" },
    { label: "Hậu Giang", value: "Hậu Giang" },
    { label: "Hòa Bình", value: "Hòa Bình" },
    { label: "Hưng Yên", value: "Hưng Yên" },
    { label: "Khánh Hòa", value: "Khánh Hòa" },
    { label: "Kiên Giang", value: "Kiên Giang" },
    { label: "Kon Tum", value: "Kon Tum" },
    { label: "Lai Châu", value: "Lai Châu" },
    { label: "Lâm Đồng", value: "Lâm Đồng" },
    { label: "Lạng Sơn", value: "Lạng Sơn" },
    { label: "Lào Cai", value: "Lào Cai" },
    { label: "Long An", value: "Long An" },
    { label: "Nam Định", value: "Nam Định" },
    { label: "Nghệ An", value: "Nghệ An" },
    { label: "Ninh Bình", value: "Ninh Bình" },
    { label: "Ninh Thuận", value: "Ninh Thuận" },
    { label: "Phú Thọ", value: "Phú Thọ" },
    { label: "Phú Yên", value: "Phú Yên" },
    { label: "Quảng Bình", value: "Quảng Bình" },
    { label: "Quảng Nam", value: "Quảng Nam" },
    { label: "Quảng Ngãi", value: "Quảng Ngãi" },
    { label: "Quảng Ninh", value: "Quảng Ninh" },
    { label: "Quảng Trị", value: "Quảng Trị" },
    { label: "Sóc Trăng", value: "Sóc Trăng" },
    { label: "Sơn La", value: "Sơn La" },
    { label: "Tây Ninh", value: "Tây Ninh" },
    { label: "Thái Bình", value: "Thái Bình" },
    { label: "Thái Nguyên", value: "Thái Nguyên" },
    { label: "Thanh Hóa", value: "Thanh Hóa" },
    { label: "Thừa Thiên Huế", value: "Thừa Thiên Huế" },
    { label: "Tiền Giang", value: "Tiền Giang" },
    { label: "Trà Vinh", value: "Trà Vinh" },
    { label: "Tuyên Quang", value: "Tuyên Quang" },
    { label: "Vĩnh Long", value: "Vĩnh Long" },
    { label: "Vĩnh Phúc", value: "Vĩnh Phúc" },
    { label: "Yên Bái", value: "Yên Bái" },
  ];
  // THAY ĐỔI CHỈ Ở ĐÂY – giống hệt AddPreOrderScreen
  const [imageUri, setImageUri] = useState(null);        // để hiển thị
  const [imageBase64, setImageBase64] = useState(null); // để lưu Firestore (nếu cần)

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

  const pickImage = () => {
    launchImageLibrary(
      { mediaType: "photo", quality: 0.7, includeBase64: true },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        if (response.assets?.[0]) {
          const asset = response.assets[0];
          setImageUri(asset.uri);
          if (asset.base64) {
            setImageBase64(`data:${asset.type || "image/jpeg"};base64,${asset.base64}`);
          }
        }
      }
    );
  };

  const handleAddProduct = async () => {
    if (!auth().currentUser) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập!");
      return;
    }

    if (!name.trim() || !price || !quantity || !unit || !season || !category || !imageUri || !location || !growingRegion.trim()) {
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
        imageBase64: imageBase64 || "",
        season,
        region: growingRegion,
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

  // Dữ liệu chọn (giữ nguyên)
  const seasons = ["Xuân", "Hạ", "Thu", "Đông"];
  const units = ["kg"];
  const categories = ["Rau củ", "Trái cây", "Hạt giống", "Nông sản khô"];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* THAY ĐỔI CHỈ Ở ĐÂY – phần chọn ảnh giống AddPreOrderScreen */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickImage} style={styles.imageBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderContainer}>
              <Icon name="camera-outline" size={50} color="#aaa" />
              <Text style={styles.placeholderText}>Chọn ảnh sản phẩm</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.imageHint}>Bắt buộc - Chọn ảnh sản phẩm</Text>
      </View>

      {/* TẤT CẢ PHẦN CÒN LẠI GIỮ NGUYÊN HOÀN TOÀN */}
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

      <Text style={styles.label}>Số lượng tồn kho *</Text>
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
      <TouchableOpacity style={styles.dateBtn} onPress={() => setProvinceModal(true)}>
        <Text style={styles.dateText}>
          {growingRegion || "Chọn tỉnh/thành phố"}
        </Text>
        <Icon name="chevron-down" size={22} color="#27ae60" />
      </TouchableOpacity>

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
        onPress={handleAddProduct}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Đang lưu sản phẩm..." : "Thêm sản phẩm"}
        </Text>
      </TouchableOpacity>
      
      {/* MODAL CHỌN TỈNH/THÀNH PHỐ - ĐẸP NHƯ ADD PREORDER */}
      <Modal visible={provinceModal} transparent animationType="slide">
        <View style={styles.modalOverlayProvince}>
          <View style={styles.provinceModalContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setProvinceModal(false)}>
                <Text style={{ fontSize: 17, color: "#007AFF" }}>Hủy</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>Chọn tỉnh/thành</Text>
              <TouchableOpacity onPress={() => setProvinceModal(false)}>
                <Text style={{ fontSize: 17, color: "#007AFF" }}>Xong</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={provinces}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.provinceItem,
                    growingRegion === item.value && { backgroundColor: "#e8f5e9" }
                  ]}
                  onPress={() => {
                    setGrowingRegion(item.value);
                    setProvinceModal(false);
                  }}
                >
                  <Text style={styles.provinceText}>{item.label}</Text>
                  {growingRegion === item.value && (
                    <Icon name="checkmark" size={24} color="#27ae60" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* 3 Modal giữ nguyên 100% */}
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
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%", borderRadius: 16 },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { marginTop: 12, fontSize: 16, color: "#999" },
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
  
  dateBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  dateTextSelected: {
    color: "#27ae60",
    fontWeight: "600",
  },
  modalOverlayProvince: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  provinceModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  provinceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  provinceText: {
    fontSize: 17,
    color: "#333",
  },
});

export default AddProductScreen;