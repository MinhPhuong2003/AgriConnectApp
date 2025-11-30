import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Alert,
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

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!auth().currentUser) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập!");
      navigation.replace('AuthFlow');
      return;
    }
  }, [navigation]);

  // Lấy dữ liệu người dùng
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setUserData(doc.data());
          } else {
            console.warn("Tài liệu users/{uid} không tồn tại");
          }
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi tải dữ liệu user:", error);
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, [uid]);

  // Lấy danh sách sản phẩm
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = firestore()
      .collection("products")
      .where("sellerId", "==", uid)
      .where("available", "==", true)
      .onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setProducts(list);
        },
        (error) => {
          console.error("Lỗi tải sản phẩm:", error);
        }
      );
    return () => unsubscribe();
  }, [uid]);

  // Lấy danh sách đơn hàng
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = firestore()
      .collection("orders")
      .where("sellerId", "==", uid)
      .onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setOrders(list);
        },
        (error) => {
          console.error("Lỗi tải đơn hàng:", error);
        }
      );
    return () => unsubscribe();
  }, [uid]);

  const handleChangeAvatar = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", quality: 0.8 });
    if (result.didCancel) return;
    const imageUri = result.assets?.[0]?.uri;
    if (!imageUri) return;

    try {
      setUpdating(true);
      await firestore().collection("users").doc(uid).update({ photoURL: imageUri });
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
      console.error("Lỗi đăng xuất:", error);
      Alert.alert("Lỗi", "Không thể đăng xuất.");
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
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HỒ SƠ NÔNG DÂN</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Avatar + Info */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleChangeAvatar} disabled={updating}>
          <Image
            source={{ uri: userData.photoURL || DEFAULT_AVATAR }}
            style={styles.avatar}
            onError={(e) => console.log("Lỗi tải ảnh avatar:", e.nativeEvent.error)}
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

      {/* Info Cards */}
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

      {/* Actions - ĐÃ THÊM NÚT QUẢN LÝ ĐƠN HÀNG */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("MyProducts")}
        >
          <Icon name="leaf-outline" size={22} color="#2e7d32" />
          <Text style={styles.actionText}>Quản lý nông sản</Text>
        </TouchableOpacity>

        {/* NÚT MỚI: QUẢN LÝ ĐƠN HÀNG */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("OrderManagement")}
        >
          <Icon name="cart-outline" size={22} color="#2e7d32" />
          <Text style={styles.actionText}>Quản lý đơn hàng</Text>
        </TouchableOpacity>

        {/* NÚT MỚI: QUẢN LÝ ĐƠN HÀNG */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("PreOrderManagement")}
        >
          <Icon name="cart-outline" size={22} color="#2e7d32" />
          <Text style={styles.actionText}>Quản lý đơn đặt trước</Text>
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
    paddingTop: 40,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  avatarContainer: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 10, borderWidth: 2, borderColor: "#2e7d32" },
  cameraIcon: { position: "absolute", bottom: 10, right: 10, backgroundColor: "#2e7d32", borderRadius: 16, padding: 5 },
  name: { fontSize: 20, fontWeight: "bold", marginTop: 5 },
  email: { fontSize: 14, color: "#555" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#2e7d32", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  verifiedText: { color: "#fff", fontSize: 12, marginLeft: 4 },
  infoCards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginHorizontal: 16, marginTop: 20 },
  infoCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: { marginLeft: 8, fontSize: 14, color: "#333" },
  section: { marginTop: 20, marginHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  emptyText: { fontSize: 14, color: "#777" },
  productCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: { width: "100%", height: 80, borderRadius: 8 },
  productName: { fontSize: 14, marginTop: 5 },
  productPrice: { fontSize: 13, fontWeight: "500", color: "#2e7d32" },
  actions: { marginHorizontal: 20, marginTop: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
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
  actionText: { marginLeft: 12, fontSize: 16, color: "#2e7d32", fontWeight: "500" },
  logoutContainer: { marginHorizontal: 20, marginBottom: 40 },
  logoutBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#d32f2f", paddingVertical: 14, borderRadius: 12 },
  logoutText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 16 },
});