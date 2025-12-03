import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { launchImageLibrary } from "react-native-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const AddPreOrderScreen = ({ navigation }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [form, setForm] = useState({
    cropName: "",
    region: "",
    description: "",
    notes: "",
    price: "",
    preOrderLimit: "",
  });

  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preOrderStartDate, setPreOrderStartDate] = useState(today);
  const [preOrderEndDate, setPreOrderEndDate] = useState(today);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState(today);
  const [seasonStartDate, setSeasonStartDate] = useState(today);
  const [seasonEndDate, setSeasonEndDate] = useState(today);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showHarvest, setShowHarvest] = useState(false);
  const [showSeasonStart, setShowSeasonStart] = useState(false);
  const [showSeasonEnd, setShowSeasonEnd] = useState(false);
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

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để thêm sản phẩm!");
      navigation.replace("Login");
    }
  }, [navigation]);

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

  const formatDate = (date) =>
    date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const handleSave = async () => {
    if (!form.cropName.trim()) return Alert.alert("Lỗi", "Vui lòng nhập tên cây trồng!");
    if (!form.region.trim()) return Alert.alert("Lỗi", "Vui lòng chọn tỉnh/thành phố!");
    if (!form.price.trim()) return Alert.alert("Lỗi", "Vui lòng nhập giá đặt trước!");
    if (!imageUri) return Alert.alert("Lỗi", "Vui lòng chọn ảnh sản phẩm!");

    if (seasonStartDate > seasonEndDate)
      return Alert.alert("Lỗi", "Tháng bắt đầu mùa vụ phải trước tháng kết thúc!");
    if (expectedHarvestDate < seasonStartDate || expectedHarvestDate > seasonEndDate)
      return Alert.alert("Lỗi", "Dự kiến thu hoạch phải nằm trong mùa vụ!");
    if (preOrderStartDate > preOrderEndDate)
      return Alert.alert("Lỗi", "Ngày bắt đầu nhận đặt phải trước ngày kết thúc!");
    if (preOrderEndDate > seasonEndDate || preOrderStartDate > seasonEndDate)
      return Alert.alert("Lỗi", "Ngày nhận đặt không được muộn hơn tháng kết thúc mùa vụ!");

    setUploading(true);
    try {
      const uid = auth().currentUser.uid;
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 7);
      const preOrderId = `PO${timestamp}${random}`.toUpperCase();
      await firestore().collection("preOrders").doc(preOrderId).set({
        preOrderId,
        sellerId: uid,
        cropName: form.cropName.trim(),
        region: form.region.trim(),
        price: Number(form.price),
        preOrderLimit: form.preOrderLimit ? Number(form.preOrderLimit) : null,
        description: form.description.trim() || "",
        notes: form.notes.trim(),
        unit: "kg",
        imageBase64: imageBase64 || "",
        startMonth: firestore.Timestamp.fromDate(seasonStartDate),
        endMonth: firestore.Timestamp.fromDate(seasonEndDate),
        preOrderStartDate: firestore.Timestamp.fromDate(preOrderStartDate),
        preOrderEndDate: firestore.Timestamp.fromDate(preOrderEndDate),
        expectedHarvestDate: firestore.Timestamp.fromDate(expectedHarvestDate),
        preOrderCurrent: 0,
        productId: null,
        isPreOrderEnabled: true,
        status: "active",
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert("Thành công", "Tạo sản phẩm đặt trước thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Lỗi lưu:", error);
      Alert.alert("Lỗi", "Không thể tạo sản phẩm. Vui lòng thử lại!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>THÊM ĐẶT TRƯỚC MÙA VỤ</Text>
          <View style={{ width: 28 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

            <Text style={styles.sectionTitle}>Ảnh sản phẩm *</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="camera-outline" size={50} color="#aaa" />
                  <Text style={styles.placeholderText}>Chọn ảnh cây trồng / trái</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.form}>
              <Text style={styles.label}>Tên cây trồng *</Text>
              <TextInput
                style={styles.input}
                placeholder="Xoài Cát Hòa Lộc 2026"
                value={form.cropName}
                onChangeText={(t) => setForm({ ...form, cropName: t })}
              />

              {/* CHỌN TỈNH/THÀNH PHỐ */}
              <Text style={styles.label}>Tỉnh / Thành phố *</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setProvinceModal(true)}>
                <Text style={styles.dateText}>
                  {form.region || "Chọn tỉnh/thành phố"}
                </Text>
                <Icon name="chevron-down" size={22} color="#27ae60" />
              </TouchableOpacity>

              <Text style={styles.label}>Giá đặt trước (đ/kg) *</Text>
              <TextInput
                style={styles.input}
                placeholder="35000"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(t) => setForm({ ...form, price: t.replace(/[^0-9]/g, "") })}
              />

              <Text style={styles.label}>Giới hạn đặt trước (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="1000 (trống = không giới hạn)"
                keyboardType="numeric"
                value={form.preOrderLimit}
                onChangeText={(t) => setForm({ ...form, preOrderLimit: t.replace(/[^0-9]/g, "") })}
              />

              <Text style={styles.label}>Mô tả sản phẩm *</Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Nhập mô tả..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />

              {/* TẤT CẢ CÁC NGÀY THÁNG - ĐẦY ĐỦ */}
              <Text style={styles.label}>Tháng bắt đầu mùa vụ *</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowSeasonStart(true)}>
                <Text style={styles.dateText}>{formatDate(seasonStartDate)}</Text>
                <Icon name="calendar-outline" size={22} color="#27ae60" />
              </TouchableOpacity>
              {showSeasonStart && (
                <DateTimePicker
                  value={seasonStartDate}
                  mode="date"
                  minimumDate={today}
                  onChange={(e, date) => {
                    setShowSeasonStart(false);
                    if (date) {
                      setSeasonStartDate(date);
                      if (seasonEndDate < date) setSeasonEndDate(date);
                      if (expectedHarvestDate < date) setExpectedHarvestDate(date);
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Tháng kết thúc mùa vụ *</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowSeasonEnd(true)}>
                <Text style={styles.dateText}>{formatDate(seasonEndDate)}</Text>
                <Icon name="calendar-outline" size={22} color="#27ae60" />
              </TouchableOpacity>
              {showSeasonEnd && (
                <DateTimePicker
                  value={seasonEndDate}
                  mode="date"
                  minimumDate={seasonStartDate}
                  onChange={(e, date) => {
                    setShowSeasonEnd(false);
                    if (date) {
                      setSeasonEndDate(date);
                      if (expectedHarvestDate > date) setExpectedHarvestDate(date);
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Dự kiến thu hoạch *</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowHarvest(true)}>
                <Text style={styles.dateText}>{formatDate(expectedHarvestDate)}</Text>
                <Icon name="calendar-outline" size={22} color="#27ae60" />
              </TouchableOpacity>
              {showHarvest && (
                <DateTimePicker
                  value={expectedHarvestDate}
                  mode="date"
                  minimumDate={seasonStartDate}
                  maximumDate={seasonEndDate}
                  onChange={(e, date) => {
                    setShowHarvest(false);
                    if (date) setExpectedHarvestDate(date);
                  }}
                />
              )}

              <Text style={styles.label}>Ngày bắt đầu nhận đặt *</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDate(true)}>
                <Text style={styles.dateText}>{formatDate(preOrderStartDate)}</Text>
                <Icon name="calendar-outline" size={22} color="#27ae60" />
              </TouchableOpacity>
              {showStartDate && (
                <DateTimePicker
                  value={preOrderStartDate}
                  mode="date"
                  minimumDate={today}
                  maximumDate={seasonEndDate}
                  onChange={(e, date) => {
                    setShowStartDate(false);
                    if (date) {
                      setPreOrderStartDate(date);
                      if (preOrderEndDate < date) setPreOrderEndDate(date);
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Ngày kết thúc nhận đặt *</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndDate(true)}>
                <Text style={styles.dateText}>{formatDate(preOrderEndDate)}</Text>
                <Icon name="calendar-outline" size={22} color="#27ae60" />
              </TouchableOpacity>
              {showEndDate && (
                <DateTimePicker
                  value={preOrderEndDate}
                  mode="date"
                  minimumDate={preOrderStartDate}
                  maximumDate={seasonEndDate}
                  onChange={(e, date) => {
                    setShowEndDate(false);
                    if (date) {
                      if (date > seasonEndDate) {
                        Alert.alert(
                          "Thông báo",
                          `Ngày kết thúc nhận đặt không được muộn hơn tháng kết thúc mùa vụ (${formatDate(seasonEndDate)}). Đã tự động điều chỉnh!`
                        );
                        setPreOrderEndDate(seasonEndDate);
                      } else {
                        setPreOrderEndDate(date);
                      }
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 14 }]}
                placeholder="Giống sạch, không thuốc trừ sâu..."
                multiline
                value={form.notes}
                onChangeText={(t) => setForm({ ...form, notes: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, uploading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>TẠO SẢN PHẨM ĐẶT TRƯỚC</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* MODAL CHỌN TỈNH */}
        <Modal visible={provinceModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
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
                      form.region === item.value && { backgroundColor: "#e8f5e9" },
                    ]}
                    onPress={() => {
                      setForm({ ...form, region: item.value });
                      setProvinceModal(false);
                    }}
                  >
                    <Text style={styles.provinceText}>{item.label}</Text>
                    {form.region === item.value && (
                      <Icon name="checkmark" size={24} color="#27ae60" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 18,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  imagePicker: { alignSelf: "stretch", marginBottom: 24 },
  productImage: { width: "100%", height: 220, borderRadius: 16 },
  placeholderImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  placeholderText: { marginTop: 12, fontSize: 16, color: "#999" },
  form: { backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 4 },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  dateBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fafafa",
    marginBottom: 4,
  },
  dateText: { fontSize: 16, color: "#333" },
  saveButton: {
    marginTop: 32,
    backgroundColor: "#27ae60",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 6,
  },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  provinceModalContainer: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  provinceItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  provinceText: { fontSize: 17, color: "#333" },
  descriptionInput: {
  height: 140,
  paddingTop: 16,
  paddingHorizontal: 16,
  backgroundColor: "#fafafa",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 12,
  fontSize: 16,
  lineHeight: 24, // đọc dễ hơn
},
});

export default AddPreOrderScreen;