import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const DAILY_TIPS = [
  "Giá cà phê đang tăng mạnh tuần này, hãy cập nhật giá mới nhé!",
  "Khách hàng thích mua số lượng lớn vào cuối tuần, chuẩn bị sẵn hàng nha!",
  "Hình ảnh sản phẩm rõ nét giúp tăng 3 lần lượt đặt hàng đó!",
  "Nhớ che phủ nông sản cẩn thận khi trời chuyển mưa nhé!",
  "Đừng quên trả lời tin nhắn khách trong vòng 1 giờ để tăng uy tín!",
  "Thêm mô tả chi tiết về nguồn gốc giúp khách tin tưởng hơn đấy!",
];

const HomeFarmer = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmerData, setFarmerData] = useState(null);
  const [products, setProducts] = useState([]);
  const [todayOrders, setTodayOrders] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const intervalRef = useRef(null);
  const uid = auth().currentUser?.uid;
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  useEffect(() => {
    if (!uid) return;
    const unsub = firestore()
      .collection("chats")
      .where("participants", "array-contains", uid)
      .onSnapshot((snapshot) => {
        let totalUnread = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          const unreadForMe = data.unreadCount?.[uid] || 0;
          totalUnread += unreadForMe;
        });
        setUnreadMessagesCount(totalUnread);
      });
    return () => unsub();
  }, [uid]);
  
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DAILY_TIPS.length);
    }, 4000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const nextTip = () => {
    clearInterval(intervalRef.current);
    setTipIndex((prev) => (prev + 1) % DAILY_TIPS.length);
    intervalRef.current = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DAILY_TIPS.length);
    }, 4000);
  };

  useEffect(() => {
    if (!uid) navigation.replace("AuthFlow");
  }, [uid, navigation]);

  useEffect(() => {
    if (!uid) return;
    const unsub = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot((doc) => {
        if (doc.exists) setFarmerData(doc.data());
        setLoading(false);
      });
    return () => unsub();
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
          imageBase64: doc.data().imageBase64 || null,
        }));
        setProducts(list);
      });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unsub = firestore()
      .collection("orders")
      .where("sellerId", "==", uid)
      .onSnapshot((snapshot) => {
        let todayCount = 0;
        let soldCount = 0;
        let totalRating = 0;
        let ratingCount = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          const orderDate = data.createdAt?.toDate();
          if (orderDate && orderDate >= today) todayCount++;
          if (data.status === "completed" || data.status === "delivered") {
            data.items?.forEach((item) => {
              soldCount += item.quantity || 0;
            });
            if (data.rating && data.rating > 0) {
              totalRating += data.rating;
              ratingCount++;
            }
          }
        });
        setTodayOrders(todayCount);
        setTotalSold(soldCount);
        setAverageRating(ratingCount > 0 ? totalRating / ratingCount : 0);
      });
    return () => unsub();
  }, [uid]);

  const onRefresh = () => {
    setRefreshing(true);
    setTipIndex(Math.floor(Math.random() * DAILY_TIPS.length));
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString("vi-VN");

  const getStockStatus = (stock) => {
    const qty = Number(stock || 0);
    if (qty === 0) return { text: "Hết hàng", color: "#e74c3c" };
    if (qty <= 10) return { text: "Sắp hết", color: "#f39c12" };
    if (qty <= 50) return { text: "Còn ít", color: "#e67e22" };
    return { text: "Còn hàng", color: "#27ae60" };
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Đang tải trang chủ...</Text>
      </View>
    );
  }

  const fullName = farmerData?.name || "Nông dân";

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#27ae60" />
      }
    >
      <View style={styles.welcomeBanner}>
        <View style={styles.bannerContent}>
          <Image
            source={{ 
              uri: farmerData?.photoBase64 || farmerData?.photoURL || DEFAULT_AVATAR 
            }}
            style={styles.bannerAvatar}
            defaultSource={{ uri: DEFAULT_AVATAR }}
          />
          <View style={styles.bannerInfo}>
            <Text style={styles.greetingText}>Xin chào, {fullName}!</Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Chat")}
            style={{ position: "relative" }}
          >
            <Icon name="chatbubbles" size={30} color="#fff" />
            {unreadMessagesCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subGreeting}>Chúc một ngày thu hoạch thật vui!</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#27ae60" }]}
          onPress={() => navigation.navigate("AddProduct")}
        >
          <Icon name="add-circle" size={32} color="#fff" />
          <Text style={styles.actionText}>Thêm sản phẩm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#3498db" }]}
          onPress={() => navigation.navigate("OrderManagement")}
        >
          <Icon name="basket" size={32} color="#fff" />
          <Text style={styles.actionText}>Đơn hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#9b59b6" }]}
          onPress={() => navigation.navigate("Chat")}
        >
          <Icon name="chatbubbles" size={32} color="#fff" />
          <Text style={styles.actionText}>Tin nhắn</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Icon name="leaf-outline" size={28} color="#27ae60" />
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Sản phẩm</Text>
        </View>

        <View style={styles.statBox}>
          <Icon name="cart-outline" size={28} color="#3498db" />
          <Text style={styles.statNumber}>{todayOrders}</Text>
          <Text style={styles.statLabel}>Đơn hôm nay</Text>
        </View>

        <View style={styles.statBox}>
          <Icon name="bag-check-outline" size={28} color="#2ecc71" />
          <Text style={styles.statNumber}>{totalSold}</Text>
          <Text style={styles.statLabel}>Đã bán</Text>
        </View>

        <View style={styles.statBox}>
          <Icon name="star-outline" size={28} color="#f39c12" />
          <Text style={styles.statNumber}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Đánh giá</Text>
        </View>
      </View>

      <View style={styles.tipCard}>
        <Icon name="bulb" size={28} color="#f39c12" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.tipTitle}>Mẹo hôm nay</Text>
          <Text style={styles.tipText}>{DAILY_TIPS[tipIndex]}</Text>
        </View>
        <TouchableOpacity onPress={nextTip}>
          <Icon name="chevron-forward" size={28} color="#27ae60" />
        </TouchableOpacity>
      </View>

      {/* Sản phẩm đang bán */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sản phẩm đang bán</Text>
        <TouchableOpacity onPress={() => navigation.navigate("MyProducts")}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

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
                style={styles.productCard}
                onPress={() => navigation.navigate("Product", { product: item })}
              >
                <Image
                  source={{ 
                    uri: item.imageBase64 || item.imageUrl || "https://via.placeholder.com/150" 
                  }}
                  style={styles.productImage}
                  resizeMode="cover"
                  defaultSource={{ uri: "https://via.placeholder.com/150" }}
                />
                <View style={[styles.stockBadge, { backgroundColor: stockInfo.color }]}>
                  <Text style={styles.stockBadgeText}>{stockInfo.text}</Text>
                </View>
                <View style={styles.productContent}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>{formatPrice(item.price)}đ</Text>
                    <Text style={styles.unit}>/{item.unit}</Text>
                  </View>
                  <Text style={styles.location}>{item.growingRegion || "Việt Nam"}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default HomeFarmer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fbf8" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fbf8" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 16 },
  welcomeBanner: {
    backgroundColor: "#27ae60",
    marginHorizontal: 20,
    marginTop: 40,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    elevation: 10,
  },
  bannerContent: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  bannerAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#fff" },
  bannerInfo: { flex: 1, marginLeft: 16 },
  greetingText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  subGreeting: { color: "#ecf0f1", fontSize: 16, fontWeight: "500" },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actionBtn: {
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    width: "30%",
    elevation: 6,
  },
  actionText: { color: "#fff", marginTop: 8, fontWeight: "600" },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 20,
    elevation: 6,
  },
  statBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  statNumber: { fontSize: 22, fontWeight: "bold", color: "#2c3e50", marginTop: 8 },
  statLabel: { fontSize: 13, color: "#7f8c8d", marginTop: 4 },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9e6",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
  },
  tipTitle: { fontWeight: "bold", color: "#e67e22", fontSize: 15 },
  tipText: { color: "#2c3e50", marginTop: 4, fontSize: 14.5, lineHeight: 20 },
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
    marginBottom: 20,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    elevation: 6,
    overflow: "hidden",
  },
  productImage: { width: "100%", height: 140 },
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
  emptyProducts: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 17, color: "#95a5a6", marginTop: 16 },
  addFirstBtn: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 16,
  },
  addFirstText: { color: "#fff", fontWeight: "bold" },
  chatBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#e74c3c",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});