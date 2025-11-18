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
  const [deliveredOrders, setDeliveredOrders] = useState([]);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const unsubscribeUser = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) setUserData(doc.data());
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi tải dữ liệu user:", error);
          setLoading(false);
        }
      );

    const unsubscribeOrders = firestore()
      .collection("orders")
      .where("userId", "==", uid)
      .onSnapshot(
        (snapshot) => {
          const pending = [];
          const confirmed = [];
          const shipping = [];
          const delivered = [];

          snapshot.forEach((doc) => {
            const order = { id: doc.id, ...doc.data() };
            switch (order.status) {
              case "pending":
                pending.push(order);
                break;
              case "confirmed":
                confirmed.push(order);
                break;
              case "shipping":
                shipping.push(order);
                break;
              case "delivered":
                delivered.push(order);
                break;
              case "cancelled":
                break;
              default:
                pending.push(order);
            }
          });

          setPendingOrders(pending);
          setConfirmedOrders(confirmed);
          setShippingOrders(shipping);
          setDeliveredOrders(delivered);
        },
        (error) => {
          console.error("Lỗi tải đơn hàng:", error);
          Alert.alert("Lỗi", "Không thể tải đơn hàng.");
        }
      );

    return () => {
      unsubscribeUser();
      unsubscribeOrders();
    };
  }, []);

  const handleChangeAvatar = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
    });

    if (result.didCancel) return;
    const imageUri = result.assets?.[0]?.uri;
    if (!imageUri) return;

    try {
      setUpdating(true);
      const uid = auth().currentUser.uid;
      await firestore().collection("users").doc(uid).update({
        photoURL: imageUri,
      });
    } catch (error) {
      console.error("Lỗi cập nhật ảnh:", error);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.replace("AuthFlow");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
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
        <Text style={{ textAlign: "center", marginTop: 30 }}>
          Không tìm thấy dữ liệu người dùng.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>HỒ SƠ NGƯỜI DÙNG</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleChangeAvatar} disabled={updating}>
          <Image
            source={{ uri: userData.photoURL || DEFAULT_AVATAR }}
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

      {/* Info Section */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Icon name="call-outline" size={20} color="#2e7d32" />
          <Text style={styles.infoText}>
            Số điện thoại: {userData.phone || "Chưa có số"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="location-outline" size={20} color="#2e7d32" />
          <Text style={styles.infoText}>
            Địa chỉ: {userData.address || "Chưa có địa chỉ"}
          </Text>
        </View>
      </View>

      {/* Order Status */}
      <View style={styles.orderStatusContainer}>
        <TouchableOpacity
          style={styles.statusItem}
          onPress={() =>
            navigation.navigate("MyOrder", { initialTab: "pending" })
          }
        >
          <Icon name="time-outline" size={24} color="#f39c12" />
          <Text style={styles.statusText}>
            Chờ xác nhận ({pendingOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statusItem}
          onPress={() =>
            navigation.navigate("MyOrder", { initialTab: "confirmed" })
          }
        >
          <Icon name="cube-outline" size={24} color="#3498db" />
          <Text style={styles.statusText}>
            Đang vận chuyển ({confirmedOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statusItem}
          onPress={() =>
            navigation.navigate("MyOrder", { initialTab: "shipping" })
          }
        >
          <Icon name="car-outline" size={24} color="#8e44ad" />
          <Text style={styles.statusText}>
            Đã giao ({shippingOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statusItem}
          onPress={() => navigation.navigate("ListReview")}
        >
          <Icon name="star-outline" size={24} color="#f1c40f" />
          <Text style={styles.statusText}>
            Đánh giá ({deliveredOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("MyOrder")}
        >
          <Icon name="cart-outline" size={22} color="#2e7d32" />
          <Text style={styles.actionText}>Đơn hàng của tôi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("OrderHistory")}
        >
          <Icon name="receipt-outline" size={22} color="#2e7d32" />
          <Text style={styles.actionText}>Lịch sử đơn hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Icon name="create-outline" size={22} color="#2e7d32" />
          <Text style={styles.actionText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default BuyerProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 10 },
  cameraIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#2e7d32",
    borderRadius: 15,
    padding: 6,
  },
  name: { fontSize: 18, fontWeight: "bold" },
  email: { fontSize: 14, color: "#777" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  verifiedText: { color: "#fff", fontSize: 12, marginLeft: 4 },
  infoBox: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: { marginLeft: 10, fontSize: 16, color: "#333" },
  orderStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 2,
  },
  statusItem: { alignItems: "center", width: 70 },
  statusText: {
    fontSize: 12,
    color: "#555",
    marginTop: 6,
    textAlign: "center",
  },
  actions: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#d6e9d8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "500",
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 50,
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#d32f2f",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
});
