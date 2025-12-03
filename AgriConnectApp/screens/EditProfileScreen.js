import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { launchImageLibrary } from "react-native-image-picker";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const EditProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    address: "",
    photoURL: "",
    location: null,
  });
  const [loading, setLoading] = useState(false);
  const uid = auth().currentUser?.uid;
  const mapRef = useRef(null);

  useEffect(() => {
    if (!uid) return;

    const fetchUser = async () => {
      try {
        const doc = await firestore().collection("users").doc(uid).get();
        if (doc.exists) {
          const data = doc.data();
          setUserData({
            name: data.name || "",
            phone: data.phone || "",
            address: data.address || "",
            photoURL: data.photoURL || "",
            photoBase64: data.photoBase64 || null,
            location: data.location || null,
          });
        }
      } catch (error) {
        console.error("❌ Lỗi khi tải thông tin user:", error);
      }
    };

    const initLocation = async () => {
      const doc = await firestore().collection("users").doc(uid).get();
      if (doc.exists && doc.data()?.location?.latitude && doc.data()?.location?.longitude) {
        setUserData((prev) => ({
          ...prev,
          location: {
            latitude: doc.data().location.latitude,
            longitude: doc.data().location.longitude,
          },
          address: doc.data().location.address || doc.data().address || "Vị trí đã lưu",
        }));
        return;
      }

      try {
        setLoading(true);
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          Alert.alert("Lỗi", "Bạn chưa cấp quyền vị trí");
          return;
        }
        const coords = await getCurrentLocation();
        setUserData((prev) => ({ ...prev, location: coords }));
        const addr = await reverseGeocode(coords.latitude, coords.longitude);
        setUserData((prev) => ({ ...prev, address: addr }));

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

    fetchUser();
    initLocation();
  }, [uid]);

  const requestLocationPermission = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Cấp quyền vị trí",
          message: "Ứng dụng cần vị trí để lưu thông tin hồ sơ",
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
    setUserData((prev) => ({ ...prev, location: newCoords }));
    try {
      const fullAddress = await reverseGeocode(newCoords.latitude, newCoords.longitude);
      setUserData((prev) => ({ ...prev, address: fullAddress }));
    } catch (error) {
      setUserData((prev) => ({ ...prev, address: "Không thể lấy địa chỉ" }));
    }
  };

  const handleChoosePhoto = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
        includeBase64: true,        // BẬT DÒNG NÀY
      },
      (response) => {
        if (response.didCancel || !response.assets?.[0]) return;

        const asset = response.assets[0];
        const uri = asset.uri;
        const base64 = asset.base64
          ? `data:${asset.type || "image/jpeg"};base64,${asset.base64}`
          : uri;

        setUserData((prev) => ({
          ...prev,
          photoURL: uri,         // giữ URI để hiển thị tạm
          photoBase64: base64,   // lưu base64 thật
        }));
      }
    );
  };

  const handleSave = async () => {
    if (!userData.name.trim() || !userData.address || !userData.location) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin và đảm bảo đã lấy được vị trí!");
      return;
    }

    setLoading(true);
    try {
      const safeData = {
        name: userData.name || "",
        phone: userData.phone || "",
        address: userData.address || "",
        photoURL: userData.photoURL || "",
        photoBase64: userData.photoBase64 || null,
        location: userData.location
          ? {
              latitude: userData.location.latitude,
              longitude: userData.location.longitude,
              address: userData.address,
            }
          : null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      await firestore().collection("users").doc(uid).set(safeData, { merge: true });
      const updatedDoc = await firestore().collection("users").doc(uid).get();
      if (updatedDoc.exists) {
        setUserData(updatedDoc.data());
      }
      Alert.alert(
        "✅ Thành công",
        "Cập nhật hồ sơ thành công!",
        [{ text: "OK" }],
        { cancelable: false }
      );
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật hồ sơ:", error);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>CHỈNH SỬA HỒ SƠ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleChoosePhoto}>
              <Image
                source={{
                  uri: userData.photoBase64 || userData.photoURL || DEFAULT_AVATAR
                }}
                style={styles.avatar}
                onError={() => console.log("Lỗi load avatar edit profile")}
              />
              <View style={styles.editIcon}>
                <Icon name="camera-outline" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Họ và tên:</Text>
            <TextInput
              style={styles.input}
              value={userData.name}
              onChangeText={(text) => setUserData({ ...userData, name: text })}
              placeholder="Nhập họ và tên"
            />

            <Text style={styles.label}>Số điện thoại:</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={userData.phone}
              onChangeText={(text) => setUserData({ ...userData, phone: text })}
              placeholder="Nhập số điện thoại"
            />

            <Text style={styles.label}>Địa chỉ:</Text>
            <TextInput
              style={[styles.input, { textAlign: "left" }]}
              value={userData.address}
              onChangeText={(text) => setUserData({ ...userData, address: text })}
              placeholder="Đang lấy vị trí..."
              editable={true}
              multiline={true}
              scrollEnabled={false}
            />

            {/* Mini Map */}
            <View style={styles.mapContainer}>
              {userData.location ? (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: userData.location.latitude,
                    longitude: userData.location.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  onRegionChangeComplete={handleRegionChange}
                >
                  <Marker
                    coordinate={userData.location}
                    draggable
                    onDragEnd={(e) => {
                      const newCoords = e.nativeEvent.coordinate;
                      setUserData((prev) => ({ ...prev, location: newCoords }));
                      reverseGeocode(newCoords.latitude, newCoords.longitude).then((addr) =>
                        setUserData((prev) => ({ ...prev, address: addr }))
                      );
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
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 40,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  avatarContainer: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2e7d32",
    padding: 6,
    borderRadius: 20,
  },
  form: { paddingHorizontal: 20 },
  label: { marginBottom: 6, color: "#555", fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fafafa",
  },
  saveBtn: {
    backgroundColor: "#2e7d32",
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 25,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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