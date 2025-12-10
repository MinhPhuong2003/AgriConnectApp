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

const DEFAULT_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const BuyerProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [shippingOrders, setShippingOrders] = useState([]);
  const [unreviewedOrdersCount, setUnreviewedOrdersCount] = useState(0);

  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubUser = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot((doc) => {
        if (doc.exists) setUserData(doc.data());
        setLoading(false);
      });

    const unsubOrders = firestore()
      .collection("orders")
      .where("userId", "==", uid)
      .onSnapshot((snapshot) => {
        const pending = [];
        const confirmed = [];
        const shipping = [];
        let unreviewed = 0;

        snapshot.forEach((doc) => {
          const order = { id: doc.id, ...doc.data() };
          if (order.status === "pending") pending.push(order);
          else if (order.status === "confirmed") confirmed.push(order);
          else if (order.status === "shipping" || order.status === "delivered") {
            shipping.push(order);
            if (!order.reviewed) unreviewed++;
          }
        });

        setPendingOrders(pending);
        setConfirmedOrders(confirmed);
        setShippingOrders(shipping);
        setUnreviewedOrdersCount(unreviewed);
      });

    return () => {
      unsubUser();
      unsubOrders();
    };
  }, []);

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
      const uid = auth().currentUser.uid;
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
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện");
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
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Không tải được thông tin người dùng
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 30 }} />
            <Text style={styles.title}>HỒ SƠ CỦA TÔI</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <Icon name="settings-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
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

          {/* Thông tin */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Icon name="call-outline" size={20} color="#27ae60" />
              <Text style={styles.infoText}>
                Số điện thoại: {userData.phone || "Chưa cập nhật"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="location-outline" size={20} color="#27ae60" />
              <Text style={styles.infoText}>
                Địa chỉ: {userData.address || "Chưa cập nhật"}
              </Text>
            </View>
          </View>

          {/* Trạng thái đơn hàng */}
          <View style={styles.orderStatusContainer}>
            <TouchableOpacity
              style={styles.statusItem}
              onPress={() => navigation.navigate("MyOrder", { initialTab: "pending" })}
            >
              <Icon name="time-outline" size={24} color="#3498db" />
              <Text style={styles.statusText}>Chờ xác nhận ({pendingOrders.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusItem}
              onPress={() => navigation.navigate("MyOrder", { initialTab: "confirmed" })}
            >
              <Icon name="sync-outline" size={24} color="#3498db" />
              <Text style={styles.statusText}>Đang xử lý ({confirmedOrders.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusItem}
              onPress={() => navigation.navigate("MyOrder", { initialTab: "shipping" })}
            >
              <Icon name="bag-check" size={24} color="#3498db" />
              <Text style={styles.statusText}>Đã giao ({shippingOrders.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusItem}
              onPress={() => navigation.navigate("ListReview")}
            >
              <Icon name="star-outline" size={24} color="#3498db" />
              <Text style={styles.statusText}>Đánh giá ({unreviewedOrdersCount})</Text>
            </TouchableOpacity>
          </View>

          {/* Các hành động */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("MyOrder")}
            >
              <Icon name="cart-outline" size={22} color="#27ae60" />
              <Text style={styles.actionText}>Đơn hàng của tôi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("MyPreOrder")}
            >
              <Icon name="calendar-outline" size={22} color="#27ae60" />
              <Text style={styles.actionText}>Đơn đặt trước</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>

      {/* MODAL CÀI ĐẶT – HIỆN RA TẠI CHỖ, CÓ 3 MỤC */}
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
            {/* Đổi mật khẩu */}
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

            {/* Chỉnh sửa hồ sơ */}
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

            {/* Đăng xuất */}
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

export default BuyerProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 5,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  avatarContainer: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  cameraIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#27ae60",
    borderRadius: 20,
    padding: 8,
  },
  name: { fontSize: 20, fontWeight: "bold", marginTop: 10 },
  email: { fontSize: 15, color: "#666" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27ae60",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  verifiedText: { color: "#fff", fontSize: 13, marginLeft: 6 },

  infoBox: {
    marginHorizontal: 16,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  infoText: { marginLeft: 12, fontSize: 16, color: "#333" },

  orderStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  statusItem: { alignItems: "center", width: 80 },
  statusText: { fontSize: 12, color: "#555", marginTop: 6, textAlign: "center" },

  actions: { marginHorizontal: 20, marginTop: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
  },
  actionText: { marginLeft: 14, fontSize: 16, color: "#27ae60", fontWeight: "500" },

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