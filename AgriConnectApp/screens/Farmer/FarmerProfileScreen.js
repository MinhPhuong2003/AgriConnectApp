import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { launchImageLibrary } from "react-native-image-picker";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const FarmerProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!auth().currentUser) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập!");
      navigation.replace("AuthFlow");
      return;
    }
  }, [navigation]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot((doc) => {
        if (doc.exists) setUserData(doc.data());
        setLoading(false);
      });
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = firestore()
      .collection("products")
      .where("sellerId", "==", uid)
      .where("available", "==", true)
      .onSnapshot((snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(list);
      });
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = firestore()
      .collection("orders")
      .where("sellerId", "==", uid)
      .onSnapshot((snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrders(list);
      });
    return () => unsubscribe();
  }, [uid]);

  const handleChangeAvatar = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
      includeBase64: true,
    });

    if (result.didCancel || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const imageUri = asset.uri;
    const imageBase64 = asset.base64
      ? `data:${asset.type || "image/jpeg"};base64,${asset.base64}`
      : imageUri;

    try {
      setUpdating(true);
      await firestore()
        .collection("users")
        .doc(uid)
        .update({
          photoURL: imageUri,
          photoBase64: imageBase64,
        });

      setUserData((prev) => ({
        ...prev,
        photoURL: imageUri,
        photoBase64: imageBase64,
      }));
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          auth().signOut();
          navigation.replace("AuthFlow");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Không tìm thấy dữ liệu người dùng.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back-outline" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>HỒ SƠ NÔNG DÂN</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <Icon name="settings-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleChangeAvatar} disabled={updating}>
              <Image
                source={{
                  uri: userData.photoBase64 || userData.photoURL || DEFAULT_AVATAR,
                }}
                style={styles.avatar}
              />
              <View style={styles.cameraIcon}>
                <Icon name="camera-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{userData.name || "Người dùng"}</Text>
            <Text style={styles.email}>{userData.email}</Text>
            {userData.verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.verifiedText}>Đã xác minh</Text>
              </View>
            )}
          </View>

          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Icon name="star" size={20} color="#fbc02d" />
              <Text style={styles.infoText}>{userData.rating?.toFixed(1) || 0} đánh giá</Text>
            </View>
            <View style={styles.infoCard}>
              <Icon name="call-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>{userData.phone || "Chưa có số"}</Text>
            </View>
            <View style={styles.infoCard}>
              <Icon name="bag-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Sản phẩm bán: {products.length}</Text>
            </View>
            <View style={styles.infoCard}>
              <Icon name="receipt-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Đơn hàng bán ra: {orders.length}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("MyProducts")}
            >
              <Icon name="leaf-outline" size={22} color="#2e7d32" />
              <Text style={styles.actionText}>Quản lý nông sản</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("OrderManagement")}
            >
              <Icon name="cart-outline" size={22} color="#2e7d32" />
              <Text style={styles.actionText}>Quản lý đơn hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("PreOrderManagement")}
            >
              <Icon name="calendar-outline" size={22} color="#2e7d32" />
              <Text style={styles.actionText}>Quản lý đơn đặt trước</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* MODAL CÀI ĐẶT – GIỐNG HỆT BUYER */}
      <Modal
        transparent
        visible={settingsVisible}
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSettingsVisible(false)}
        >
          <View style={styles.settingsDropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSettingsVisible(false);
                navigation.navigate("ChangePassword");
              }}
            >
              <Icon name="key-outline" size={22} color="#27ae60" />
              <Text style={styles.dropdownText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSettingsVisible(false);
                navigation.navigate("FarmerVerification");
              }}
            >
              <Icon name="shield-checkmark-outline" size={22} color="#27ae60" />
              <Text style={styles.dropdownText}>Xác thực nông dân</Text>
            </TouchableOpacity>

            {/*
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSettingsVisible(false);
                navigation.navigate("AddProfile");
              }}
            >
              <Icon name="document-attach-outline" size={22} color="#27ae60" />
              <Text style={styles.dropdownText}>Bổ sung hồ sơ</Text>
            </TouchableOpacity>*/}

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSettingsVisible(false);
                navigation.navigate("EditProfile");
              }}
            >
              <Icon name="create-outline" size={22} color="#27ae60" />
              <Text style={styles.dropdownText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 16 }]}
              onPress={() => {
                setSettingsVisible(false);
                handleLogout();
              }}
            >
              <Icon name="log-out-outline" size={22} color="#e74c3c" />
              <Text style={[styles.dropdownText, { color: "#e74c3c" }]}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default FarmerProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  avatarContainer: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#2e7d32" },
  cameraIcon: { position: "absolute", bottom: 10, right: 10, backgroundColor: "#2e7d32", borderRadius: 16, padding: 6 },

  name: { fontSize: 21, fontWeight: "bold", marginTop: 8 },
  email: { fontSize: 15, color: "#555" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#2e7d32", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  verifiedText: { color: "#fff", fontSize: 13, marginLeft: 6 },

  infoCards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginHorizontal: 16, marginTop: 20 },
  infoCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    elevation: 3,
  },
  infoText: { marginLeft: 10, fontSize: 14.5, color: "#333" },

  actions: { marginHorizontal: 20, marginTop: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#d6e9d8",
    elevation: 3,
  },
  actionText: { marginLeft: 14, fontSize: 16.5, color: "#2e7d32", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  settingsDropdown: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    minWidth: 220,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  dropdownText: {
    marginLeft: 14,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});