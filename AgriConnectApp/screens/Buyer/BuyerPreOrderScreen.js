import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const BuyerPreOrderScreen = ({ navigation }) => {
  const [preOrders, setPreOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const user = auth().currentUser;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("preOrderCart")
      .onSnapshot((snapshot) => {
        setCartCount(snapshot.size);
      });

    return () => unsubscribe();
  }, [user]);

  const fetchPreOrders = async () => {
    try {
      const now = new Date();

      const snapshot = await firestore()
        .collection("preOrders")
        .where("preOrderEndDate", ">=", now)
        .orderBy("preOrderEndDate", "asc")
        .get();

      const list = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        const endDate = data.preOrderEndDate?.toDate();
        if (!endDate || endDate < now) return;
        const startMonth = data.startMonth?.toDate();
        const endMonth = data.endMonth?.toDate();
        const harvestDate = data.expectedHarvestDate?.toDate();
        const booked = data.preOrderCurrent || 0;
        const limit = data.preOrderLimit || 0;
        const percent = limit > 0 ? Math.min((booked / limit) * 100, 100) : 0;
        const isSoldOut = limit > 0 && booked >= limit;

        list.push({
          id: doc.id,
          ...data,
          image: data.imageBase64 || "https://via.placeholder.com/300x200/eee/aaa?text=Không+ảnh",
          seasonRange: startMonth && endMonth
            ? `${formatDate(startMonth)} - ${formatDate(endMonth)}`
            : "Chưa xác định mùa vụ",
          harvestDateFull: harvestDate ? formatFullDate(harvestDate) : "Chưa xác định",
          preOrderEndDate: endDate,
          percent,
          isSoldOut,
          remaining: limit > 0 ? limit - booked : null,
        });
      });

      setPreOrders(list);
    } catch (error) {
      console.error("Lỗi tải danh sách đặt trước:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPreOrders();

    const unsubscribe = firestore()
      .collection("preOrders")
      .where("preOrderEndDate", ">=", new Date())
      .orderBy("preOrderEndDate", "asc")
      .onSnapshot(() => {
        fetchPreOrders();
      });

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPreOrders();
  };

  const addToCart = async (item) => {
    if (!user) {
      Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để thêm vào giỏ hàng", [
        { text: "Hủy" },
        { text: "Đăng nhập", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    try {
      // 1. Lấy dữ liệu tồn kho thực tế
      const preOrderDoc = await firestore()
        .collection("preOrders")
        .doc(item.id)
        .get();

      if (!preOrderDoc.exists) {
        Alert.alert("Lỗi", "Sản phẩm không tồn tại");
        return;
      }

      const data = preOrderDoc.data();
      const limit = data.preOrderLimit || 0;
      const currentBooked = data.preOrderCurrent || 0;
      const remaining = limit > 0 ? limit - currentBooked : Infinity;

      // 2. Kiểm tra số lượng hiện có trong giỏ của user
      const cartDocRef = firestore()
        .collection("users")
        .doc(user.uid)
        .collection("preOrderCart")
        .doc(item.id);

      const cartDoc = await cartDocRef.get();

      // Dòng này là key: PHẢI kiểm tra cả exists và data() không undefined
      const cartData = cartDoc.exists ? cartDoc.data() : null;
      const currentInCart = cartData ? (cartData.quantity || 0) : 0;

      // 3. Kiểm tra vượt giới hạn chưa
      if (remaining !== Infinity && currentInCart + 1 > remaining) {
        Alert.alert(
          "Không thể đặt thêm",
          `Chỉ còn ${remaining}kg có thể đặt trước. Bạn đã đặt ${currentInCart}kg trong giỏ.`
        );
        return;
      }

      // 4. Thêm vào giỏ (dùng increment)
      await cartDocRef.set(
        {
          cropName: item.cropName,
          price: item.price,
          image: item.image,
          region: item.region || "Chưa xác định",
          expectedHarvestDate: item.expectedHarvestDate,
          preOrderEndDate: item.preOrderEndDate,
          preOrderId: item.id,
          quantity: firestore.FieldValue.increment(1),
        },
        { merge: true }
      );

      // Alert.success("Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("Lỗi thêm vào giỏ:", error);
      Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };
  
  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("vi-VN", { month: "short", year: "numeric" });
  };

  const formatFullDate = (date) => {
    if (!date) return "Chưa xác định";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ/kg";

  const getTimeLeft = (endDate) => {
    const now = new Date();
    const diff = endDate - now;
    if (diff < 0) return "Đã kết thúc";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Còn ${days} ngày`;
    if (hours > 0) return `Còn ${hours} giờ`;
    return "Sắp kết thúc";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.isSoldOut && styles.cardSoldOut]}
      onPress={() =>
        navigation.navigate("BuyerPreOrderDetail", { preOrderId: item.id, preOrderData: item })
      }
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.cropName}>{item.cropName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="location-outline" size={16} color="#27ae60" />
          <Text style={styles.label}>Khu vực:</Text>
          <Text style={styles.value}>{item.region || "Chưa xác định"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="leaf-outline" size={16} color="#27ae60" />
          <Text style={styles.label}>Thu hoạch dự kiến:</Text>
          <Text style={styles.value}>{formatFullDate(item.expectedHarvestDate?.toDate())}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="pricetag-outline" size={18} color="#e67e22" />
          <Text style={styles.label}>Giá đặt trước:</Text>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>

        {item.preOrderLimit ? (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.percent}%` },
                    item.isSoldOut && styles.progressFillSoldOut,
                  ]}
                />
              </View>
              <View style={styles.progressInfoRow}>
                <Text style={styles.progressTextLeft}>
                  {item.preOrderCurrent || 0}kg/{item.preOrderLimit}kg
                </Text>
                {item.remaining !== null && (
                  <Text style={styles.progressTextRight}>
                    Còn lại: {item.remaining > 0 ? `${item.remaining}kg` : "Hết"}
                  </Text>
                )}
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noLimit}>Không giới hạn số lượng</Text>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.addToCartButton, item.isSoldOut && styles.buttonDisabled]}
            disabled={item.isSoldOut}
            onPress={() => addToCart(item)}
          >
            <Icon name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Thêm vào giỏ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.orderButtonRight,
              item.isSoldOut && styles.orderButtonDisabled,
            ]}
            disabled={item.isSoldOut}
            onPress={() =>
              navigation.navigate("CheckoutPreOrder", { preOrderId: item.id, preOrderData: item })
            }
          >
            <Icon name="cart-outline" size={20} color="#fff" />
            <Text style={styles.orderButtonText}>
              {item.isSoldOut ? "Hết" : "Đặt ngay"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#27ae60" />
          <Text style={{ marginTop: 16, color: "#666" }}>Đang tải sản phẩm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.leftPlaceholder} />
            <Text style={styles.headerTitle}>SẢN PHẨM ĐẶT TRƯỚC</Text>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => navigation.navigate("CartPreOrder")}
            >
              <Icon name="cart-outline" size={26} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {preOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/7484/7483997.png" }}
              style={{ width: 130, height: 130, opacity: 0.6 }}
            />
            <Text style={styles.emptyText}>Hiện chưa có sản phẩm nào</Text>
            <Text style={styles.emptySubText}>Hãy quay lại sau nhé!</Text>
          </View>
        ) : (
          <FlatList
            data={preOrders}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addToCartButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    minWidth: 140,
    elevation: 6,
  },
  orderButtonRight: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    minWidth: 140,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#95a5a6",
  },
  orderButtonDisabled: {
    backgroundColor: "#95a5a6",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  orderButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cartButton: {
    position: "relative",
    width: 46,
    height: 46,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerContainer: { backgroundColor: "#2e7d32", paddingTop: 40, paddingBottom: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15 },
  leftPlaceholder: { width: 48 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", letterSpacing: 0.5 },
  card: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden", elevation: 6, borderWidth: 1, borderColor: "#f0f0f0" },
  cardSoldOut: { opacity: 0.75 },
  image: { width: "100%", height: 160 },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cropName: { fontSize: 18, fontWeight: "bold", color: "#2d3436", flex: 1 },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 6, gap: 8 },
  label: { fontSize: 14, color: "#636e72", minWidth: 100 },
  value: { fontSize: 14, color: "#2d3436", fontWeight: "600", flex: 1, textAlign: "right" },
  price: { fontSize: 18, fontWeight: "bold", color: "#e74c3c", flex: 1, textAlign: "right" },
  progressContainer: { marginTop: 12 },
  progressBar: { height: 8, backgroundColor: "#dfe6e9", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#27ae60" },
  progressFillSoldOut: { backgroundColor: "#e74c3c" },
  progressInfoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  progressTextLeft: { fontSize: 13, color: "#636e72" },
  progressTextRight: { fontSize: 13, color: "#e67e22", fontWeight: "600" },
  noLimit: { fontSize: 14, color: "#27ae60", fontStyle: "italic", textAlign: "center", marginTop: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#95a5a6", marginTop: 20, fontWeight: "600" },
  emptySubText: { fontSize: 14, color: "#b2bec3", marginTop: 8 },
});

export default BuyerPreOrderScreen;