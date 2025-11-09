import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
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

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!uid) {
      navigation.replace("AuthFlow");
      return;
    }
  }, [uid, navigation]);

  // Lấy thông tin nông dân
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
        (err) => {
          console.error("Lỗi tải user:", err);
          setLoading(false);
        }
      );

    return () => unsub();
  }, [uid]);

  // LẤY SẢN PHẨM: CHỈ DÙNG 2 WHERE + LIMIT → KHÔNG CẦN INDEX
  useEffect(() => {
    if (!uid) return;

    const unsub = firestore()
      .collection("products")
      .where("sellerId", "==", uid)
      .where("available", "==", true)
      .limit(5) // Chỉ lấy 5 sản phẩm đầu tiên
      .onSnapshot(
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setProducts(list);
        },
        (err) => {
          console.error("Lỗi tải sản phẩm:", err);
        }
      );

    return () => unsub();
  }, [uid]);

  // Dữ liệu mùa vụ
  const seasonInfo = {
    cropName: "Vụ Đông Xuân",
    startMonth: "12/2025",
    endMonth: "03/2026",
    notes: "Thời tiết thuận lợi, có thể trồng dưa hấu và bắp cải.",
  };

  // Loading
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!farmerData) {
    return (
      <View style={styles.loader}>
        <Text>Không tải được dữ liệu người dùng.</Text>
      </View>
    );
  }

  // Render
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trang chủ nông dân</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
          <Icon name="chatbubbles-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Thông tin nông dân */}
      <View style={styles.profileCard}>
        <Image
          source={{ uri: farmerData.photoURL || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.name}>{farmerData.name || "Nông dân"}</Text>
          <Text style={styles.email}>{farmerData.email}</Text>
          {farmerData.verified && (
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark-circle" size={14} color="#fff" />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          )}
        </View>
      </View>

      {/* Thống kê nhanh */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Icon name="leaf-outline" size={24} color="#2e7d32" />
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Sản phẩm</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="star-outline" size={24} color="#2e7d32" />
          <Text style={styles.statNumber}>
            {farmerData.rating ? farmerData.rating.toFixed(1) : "0"}
          </Text>
          <Text style={styles.statLabel}>Đánh giá</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="trophy-outline" size={24} color="#2e7d32" />
          <Text style={styles.statNumber}>{farmerData.points || 0}</Text>
          <Text style={styles.statLabel}>Điểm</Text>
        </View>
      </View>

      {/* Mùa vụ hiện tại */}
      <View style={styles.seasonCard}>
        <Text style={styles.sectionTitle}>Mùa vụ hiện tại</Text>
        <Text style={styles.seasonText}>
          {seasonInfo.cropName} ({seasonInfo.startMonth} – {seasonInfo.endMonth})
        </Text>
        <Text style={styles.seasonNote}>{seasonInfo.notes}</Text>
      </View>

      {/* Sản phẩm gần đây */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sản phẩm gần đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate("MyProducts")}>
            <Text style={styles.linkText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {products.length === 0 ? (
          <Text style={{ marginLeft: 16, color: "#777" }}>
            Chưa có sản phẩm
          </Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: item.id })
                }
              >
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardPrice}>
                  {item.price}đ / {item.unit}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default HomeFarmer;

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  name: { fontSize: 16, fontWeight: "bold" },
  email: { color: "#666", fontSize: 13 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  verifiedText: { color: "#fff", fontSize: 12, marginLeft: 4 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: "#f0f7f1",
    alignItems: "center",
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  statNumber: { fontSize: 16, fontWeight: "bold", color: "#2e7d32", marginTop: 4 },
  statLabel: { fontSize: 12, color: "#555" },
  seasonCard: {
    backgroundColor: "#e8f5e9",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  seasonText: { fontSize: 16, fontWeight: "600", color: "#2e7d32" },
  seasonNote: { color: "#555", fontSize: 14, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#2e7d32" },
  linkText: { color: "#2e7d32", fontWeight: "500" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: 120,
  },
  productImage: { width: "100%", height: 80, borderRadius: 8 },
  cardTitle: { fontWeight: "bold", fontSize: 14, marginTop: 6 },
  cardPrice: { color: "#2e7d32", fontSize: 13 },
});