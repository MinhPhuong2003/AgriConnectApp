import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const TABS = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đang vận chuyển" },
  { key: "shipping", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
];

const MyOrderScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const scrollViewRef = useRef(null);

  const initialTab = route.params?.initialTab;

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setCartCount(0);
      return;
    }

    const cartRef = firestore().collection("carts").doc(user.uid);
    const unsubscribe = cartRef.onSnapshot(
      (doc) => {
        if (doc.exists && doc.data()) {
          const items = doc.data().items || [];
          const uniqueProductCount = items.filter(item => item && item.id).length;
          setCartCount(uniqueProductCount);
        } else {
          setCartCount(0);
        }
      },
      (error) => {
        console.error("Lỗi theo dõi giỏ:", error);
        setCartCount(0);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection("orders")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const ordersList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }));
          setOrders(ordersList);
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi tải đơn hàng:", error);
          Alert.alert("Lỗi", "Không thể tải đơn hàng.");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialTab && TABS.some((tab) => tab.key === initialTab)) {
      setActiveTab(initialTab);
      const tabIndex = TABS.findIndex((tab) => tab.key === initialTab);
      if (scrollViewRef.current && tabIndex > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: tabIndex * 130,
            animated: true,
          });
        }, 300);
      }
    }
  }, [initialTab]);

  const getFilteredOrders = () => {
    return orders.filter((order) => order.status === activeTab);
  };

  const getTabCount = (status) => {
    return orders.filter((o) => o.status === status).length;
  };

  const handleCancelOrder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      navigation.navigate("CancelOrder", { order });
    } else {
      Alert.alert("Lỗi", "Không tìm thấy đơn hàng.");
    }
  };

  const handleBuyAgain = async (order) => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      navigation.navigate("Cart");
      return;
    }

    try {
      const cartRef = firestore().collection("carts").doc(uid);
      const orderItemIds = order.items.map(item => item.id);

      const newItems = order.items.map((item) => ({
        id: item.id,
        name: item.name || "Sản phẩm",
        imageUrl: item.imageUrl || "https://via.placeholder.com/60/f0f0f0/cccccc?text=No+Img",
        price: item.price || 0,
        quantity: item.quantity || 1,
        variant: item.variant || null,
        selected: true,
      })).filter(item => item.id);

      await firestore().runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        let items = [];

        if (cartDoc.exists) {
          const data = cartDoc.data();
          items = (data?.items || []).filter(i => i && i.id);
        }

        newItems.forEach((newItem) => {
          const existing = items.find((i) => i.id === newItem.id);
          if (existing) {
            existing.quantity += newItem.quantity;
            existing.selected = true;
          } else {
            items.push(newItem);
          }
        });

        items = items.map((item) => ({
          ...item,
          selected: orderItemIds.includes(item.id),
        }));

        transaction.set(cartRef, { items }, { merge: true });
      });

      navigation.navigate("Cart");

    } catch (error) {
      console.error("Lỗi mua lại:", error);
      navigation.navigate("Cart");
    }
  };

  const renderOrder = ({ item }) => {
    const isPending = item.status === "pending";
    const isConfirmed = item.status === "confirmed";
    const isShipped = item.status === "shipping";
    const isCancelled = item.status === "cancelled";

    const formatDate = (date) => {
      if (!date) return "Chưa xác định";
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.shopHeader}>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>Thông tin đơn hàng</Text>
            <Text style={styles.orderId}>Mã đơn hàng: {item.id}</Text>
          </View>
          <Text
            style={[
              styles.shopStatus,
              isPending && styles.statusPending,
              isConfirmed && styles.statusConfirmed,
              isShipped && styles.statusShipped,
              isCancelled && styles.statusCancelled,
            ]}
          >
            {isPending
              ? "Đơn hàng đang xử lý"
              : isConfirmed
              ? "Đơn hàng đang giao"
              : isShipped
              ? "Đơn hàng hoàn thành"
              : "Đơn hàng đã hủy"}
          </Text>
        </View>

        {isCancelled && (
          <View style={styles.cancelInfoContainer}>
            <Text style={styles.cancelDate}>
              Đơn hàng đã hủy vào {formatDate(item.createdAt)}
            </Text>
            {item.cancelReason && (
              <Text style={styles.cancelReason}>
                Lý do hủy: {item.cancelReason}
              </Text>
            )}
          </View>
        )}

        {item.items.map((product, index) => (
          <View
            key={product.id + index}
            style={[
              styles.productRow,
              index !== item.items.length - 1 && styles.productRowWithBorder,
            ]}
          >
            <Image
              source={{
                uri:
                  product.imageUrl ||
                  "https://via.placeholder.com/60/f0f0f0/cccccc?text=No+Img",
              }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productPrice}>
                {product.price.toLocaleString("vi-VN")}đ x {product.quantity}
              </Text>
            </View>
            <Text style={styles.productTotal}>
              {(product.price * product.quantity).toLocaleString("vi-VN")}đ
            </Text>
          </View>
        ))}

        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền sản phẩm:</Text>
            <Text style={[styles.totalPrice, isCancelled && styles.totalCancelled]}>
              {item.items
                .reduce((sum, product) => sum + product.price * product.quantity, 0)
                .toLocaleString("vi-VN")}đ
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
            <Text style={[styles.totalPrice, isCancelled && styles.totalCancelled]}>
              {item.shippingFee
                ? item.shippingFee.toLocaleString("vi-VN") + "đ"
                : "0đ"}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Thành tiền:</Text>
            <Text
              style={[
                styles.totalPrice,
                isPending && styles.totalPending,
                isConfirmed && styles.totalConfirmed,
                isCancelled && styles.totalCancelled,
              ]}
            >
              {item.finalTotal.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {isPending && (
            <>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCancelOrder(item.id);
                }}
              >
                <Text style={styles.cancelText}>Hủy đơn hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate("OrderDetail", { orderId: item.id });
                }}
              >
                <Text style={styles.detailText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </>
          )}

          {isConfirmed && (
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate("OrderDetail", { orderId: item.id });
              }}
            >
              <Text style={styles.detailText}>Xem chi tiết</Text>
            </TouchableOpacity>
          )}

          {isShipped && (
            <>
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate("Review", { orderId: item.id });
                }}
              >
                <Text style={styles.reviewText}>Viết đánh giá</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buyAgainBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleBuyAgain(item);
                }}
              >
                <Text style={styles.buyAgainText}>Mua lại</Text>
              </TouchableOpacity>
            </>
          )}

          {isCancelled && (
            <TouchableOpacity
              style={styles.buyAgainBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleBuyAgain(item);
              }}
            >
              <Text style={styles.buyAgainText}>Mua lại</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const currentTabLabel = TABS.find((t) => t.key === activeTab)?.label || "";

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Đơn hàng</Text>

        <TouchableOpacity
          style={styles.cartIconContainer}
          onPress={() => navigation.navigate("Cart")}
        >
          <Icon name="cart-outline" size={26} color="#fff" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
        style={{ flexGrow: 0 }}
      >
        {TABS.map((tab) => {
          const count = getTabCount(tab.key);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab.key);
                const tabIndex = TABS.findIndex((t) => t.key === tab.key);
                if (scrollViewRef.current && tabIndex > 0) {
                  scrollViewRef.current.scrollTo({
                    x: tabIndex * 130,
                    animated: true,
                  });
                }
              }}
            >
              <Text
                style={{
                  ...styles.tabText,
                  ...(activeTab === tab.key && styles.activeTabText),
                }}
              >
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={getFilteredOrders()}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              Chưa có đơn hàng {currentTabLabel.toLowerCase()}.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MyOrderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 14,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cartIconContainer: { position: "relative", padding: 4 },
  cartBadge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: "red",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    flexDirection: "row",
  },
  tab: {
    minWidth: 120,
    height: 36,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: { backgroundColor: "#2e7d32" },
  tabText: { fontSize: 13, color: "#888", fontWeight: "500" },
  activeTabText: { color: "#fff", fontWeight: "600" },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  shopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shopInfo: { flexDirection: "column" },
  shopName: { fontSize: 15, fontWeight: "600", color: "#333" },
  orderId: { fontSize: 13, color: "#666", marginTop: 4 },
  shopStatus: { fontSize: 13 },
  statusPending: { color: "#e67e22" },
  statusConfirmed: { color: "#f39c12" },
  statusShipped: { color: "#27ae60" },
  statusCancelled: { color: "#e74c3c" },
  cancelInfoContainer: {
    backgroundColor: "#fdf2f2",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5c6cb",
    marginBottom: 12,
  },
  cancelDate: {
    fontSize: 13,
    color: "#e74c3c",
    fontWeight: "500",
  },
  cancelReason: {
    fontSize: 13,
    color: "#c0392b",
    marginTop: 4,
    fontStyle: "italic",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  productRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12,
    marginBottom: 12,
  },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, color: "#333", fontWeight: "500" },
  productPrice: { fontSize: 13, color: "#e67e22", marginTop: 2 },
  productTotal: { fontSize: 14, fontWeight: "bold", color: "#e67e22" },
  totalContainer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 12,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 14, color: "#555" },
  totalPrice: { fontSize: 16, fontWeight: "bold" },
  totalPending: { color: "#e67e22" },
  totalConfirmed: { color: "#f39c12" },
  totalCancelled: { color: "#e74c3c" },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#e74c3c",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelText: { color: "#e74c3c", fontSize: 14 },
  detailBtn: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  reviewBtn: {
    borderWidth: 1,
    borderColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewText: { color: "#2e7d32", fontSize: 14 },
  buyAgainBtn: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyAgainText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 16, color: "#999", marginTop: 16 },
});