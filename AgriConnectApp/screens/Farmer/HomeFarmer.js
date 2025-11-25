import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const HomeFarmer = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [farmerData, setFarmerData] = useState(null);
  const [products, setProducts] = useState([]);
  const uid = auth().currentUser?.uid;
  useEffect(() => {
    if (!uid) {
      navigation.replace("AuthFlow");
    }
  }, [uid, navigation]);

  useEffect(() => {
    if (!uid) return;

    const unsub = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setFarmerData(doc.data());
          }
          setLoading(false);
        },
        () => setLoading(false)
      );

    return () => unsub && unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = firestore()
      .collection("products")
      .where("sellerId", "==", uid)
      .where("available", "==", true)
      .limit(6)
      .onSnapshot((snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          available: doc.data().available ?? true,
        }));
        setProducts(list);
      }, (error) => {
        console.log("Lỗi nhẹ (không ảnh hưởng):", error.message);
        setProducts([]);
      });

    return () => unsub && unsub();
  }, [uid]);

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN");
  };

  const getStockStatus = (stock) => {
    const qty = Number(stock || 0);
    if (qty === 0) return { text: "Hết hàng", color: "#e74c3c" };
    if (qty <= 10) return { text: "Sắp hết", color: "#f39c12" };
    if (qty <= 50) return { text: "Còn ít", color: "#e67e22" };
    return { text: "Còn nhiều", color: "#27ae60" };
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={{ marginTop: 12, color: "#666" }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trang chủ nông dân</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
          <Icon name="chatbubbles" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={{ uri: farmerData?.photoURL || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.farmerName}>
            {farmerData?.name || "Nông dân thân thiện"}
          </Text>
          <Text style={styles.farmerEmail}>{farmerData?.email}</Text>
          {farmerData?.verified && (
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tiêu đề sản phẩm */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sản phẩm đang bán</Text>
        <TouchableOpacity onPress={() => navigation.navigate("MyProducts")}>
          <Text style={styles.seeAllText}>Xem tất cả →</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách sản phẩm */}
      {products.length === 0 ? (
        <View style={styles.emptyProducts}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/7484/7481385.png" }}
            style={{ width: 100, height: 100, opacity: 0.6 }}
          />
          <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => navigation.navigate("AddProduct")}
          >
            <Text style={styles.addFirstText}>Thêm sản phẩm đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {products.map((item) => {
            const stockInfo = getStockStatus(item.stock || item.quantity || 0);

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.95}
                style={styles.productCard}
                onPress={() => navigation.navigate("ProductDetail", { product: item })}
              >
                <Image
                  source={{
                    uri: item.imageUrl || "https://via.placeholder.com/150",
                  }}
                  style={styles.productImage}
                  resizeMode="cover"
                />

                <View style={[styles.stockBadge, { backgroundColor: stockInfo.color }]}>
                  <Text style={styles.stockBadgeText}>{stockInfo.text}</Text>
                </View>

                <View style={styles.productContent}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      {formatPrice(item.price)}đ
                    </Text>
                    <Text style={styles.unit}>/{item.unit}</Text>
                  </View>

                  <Text style={styles.location}>
                    {item.growingRegion || "Việt Nam"}
                  </Text>

                  <Text style={styles.stockText}>
                    Còn: {item.stock || item.quantity || 0} {item.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

export default HomeFarmer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fbf8" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  profileCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    marginTop: -20,
    padding: 16,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#fff" },
  profileInfo: { marginLeft: 16, justifyContent: "center" },
  farmerName: { fontSize: 20, fontWeight: "bold", color: "#2c3e50" },
  farmerEmail: { color: "#7f8c8d", marginTop: 4 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27ae60",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
  verifiedText: { color: "#fff", fontSize: 12, marginLeft: 4 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#27ae60" },
  statLabel: { fontSize: 13, color: "#7f8c8d", marginTop: 4 },
  statDivider: { width: 1, backgroundColor: "#eee" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 19, fontWeight: "bold", color: "#2c3e50" },
  seeAllText: { color: "#27ae60", fontWeight: "600", fontSize: 15 },
  productsGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#f0f0f0",
  },
  stockBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  stockBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  productContent: { padding: 12 },
  productName: { fontSize: 15, fontWeight: "bold", color: "#2c3e50", height: 40 },
  priceContainer: { flexDirection: "row", alignItems: "baseline", marginTop: 6 },
  price: { fontSize: 18, fontWeight: "bold", color: "#e74c3c" },
  unit: { fontSize: 14, color: "#7f8c8d", marginLeft: 4 },
  location: { fontSize: 12, color: "#27ae60", marginTop: 4 },
  stockText: { fontSize: 13, color: "#34495e", marginTop: 6, fontWeight: "500" },
  emptyProducts: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 17, color: "#95a5a6", marginTop: 16 },
  addFirstBtn: { backgroundColor: "#27ae60", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, marginTop: 16 },
  addFirstText: { color: "#fff", fontWeight: "bold" },
});