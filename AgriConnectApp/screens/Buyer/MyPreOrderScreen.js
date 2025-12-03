import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const TABS = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "waitingDelivery", label: "Chờ giao" },
  { key: "confirmed", label: "Đang vận chuyển" },
  { key: "completed", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
];

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const formatDateVietnamese = (timestamp) => {
  if (!timestamp) return "Chưa xác định";
  const date = timestamp.toDate ? timestamp.toDate() : timestamp;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getStatusTimeLabel = (item) => {
    if (item.status === "pending") {
      return {
        label: "Đặt lúc:",
        time: item.createdAt,
      };
    }
    if (item.status === "waitingDelivery") {
      return {
        label: "Đã xác nhận lúc:",
        time: item.updatedAt || item.createdAt,
      };
    }
    if (item.status === "confirmed") {
      return {
        label: "Bắt đầu giao lúc:",
        time: item.updatedAt || item.createdAt,
      };
    }
    if (item.status === "completed") {
      return {
        label: "Đã giao lúc:",
        time: item.updatedAt || item.createdAt,
      };
    }
    if (item.status === "cancelled") {
      return {
        label: "Đã hủy lúc:",
        time: item.updatedAt || item.createdAt,
      };
    }

    return {
      label: "Cập nhật lúc:",
      time: item.updatedAt || item.createdAt,
    };
  };

const MyPreOrderScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);

  const currentUser = auth().currentUser;

  useEffect(() => {
  if (!currentUser) return;

  const unsubscribe = firestore()
    .collection("preOrderBookings")
    .where("buyerId", "==", currentUser.uid)
    .orderBy("updatedAt", "desc")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            products: data.products || [],
            shippingFee: data.shippingFee || 0,
            status: data.status || "pending",
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            ...data,
          };
        });
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error("Lỗi tải đơn:", err);
        Alert.alert("Lỗi", "Không thể tải đơn đặt trước");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const getFilteredOrders = () => orders.filter((b) => b.status === activeTab);
  const getTabCount = (status) => orders.filter((b) => b.status === status).length;

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await firestore()
        .collection("preOrderBookings")
        .doc(orderId)
        .update({
          status: newStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể hủy đơn");
    }
  };

  const renderOrder = ({ item }) => {
    const isPending = item.status === "pending";
    const isWaitingDelivery = item.status === "waitingDelivery";
    const isConfirmed = item.status === "confirmed";
    const isCompleted = item.status === "completed";
    const isCancelled = item.status === "cancelled";

    const totalProduct = item.products.reduce(
      (sum, prod) => sum + (prod.quantity * prod.pricePerKg || 0),
      0
    );

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.bookingCard}
        onPress={() => navigation.navigate("PreOrderDetail", { orderId: item.id })}
      >
        <View style={styles.shopHeader}>
          <View style={styles.shopInfo}>
            {item.products.length > 0 && (
              <Text style={styles.productInfoHeader}>Thông tin sản phẩm</Text>
            )}
            <Text style={styles.shopName}>Mã đơn: {item.id}</Text>
            {(() => {
              const { label, time } = getStatusTimeLabel(item);
                return (
                  <Text style={styles.orderId}>
                      {label} {formatDateVietnamese(time)}
                  </Text>
                );
              })()}
          </View>
          <Text
            style={[
              styles.shopStatus,
              isPending && styles.statusPending,
              isWaitingDelivery && styles.statusWaitingDelivery,
              isConfirmed && styles.statusConfirmed,
              isCompleted && styles.statusCompleted,
              isCancelled && styles.statusCancelled,
            ]}
          >
            {isPending
              ? "Chờ xác nhận"
              : isWaitingDelivery
              ? "Chờ giao"
              : isConfirmed
              ? "Đang vận chuyển"
              : isCompleted
              ? "Đã giao"
              : "Đã hủy"}
          </Text>
        </View>

        {item.products.map((prod, idx) => (
          <View
            key={`${prod.preOrderId}-${idx}`}
            style={[
              styles.productRow,
              idx !== item.products.length - 1 && styles.productRowWithBorder,
            ]}
          >
            <Image
              source={{ uri: prod.imageUrl || DEFAULT_AVATAR }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{prod.cropName}</Text>
              <Text style={styles.productPrice}>
                {prod.pricePerKg?.toLocaleString()}đ x {prod.quantity}kg
              </Text>
            </View>
            <Text style={styles.productTotal}>
              {(prod.quantity * prod.pricePerKg).toLocaleString()}đ
            </Text>
          </View>
        ))}

        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền sản phẩm:</Text>
            <Text style={styles.totalPrice}>{totalProduct.toLocaleString()}đ</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
            <Text style={styles.totalPrice}>{item.shippingFee?.toLocaleString() || 0}đ</Text>
          </View>

          <View
            style={[
              styles.totalRow,
              { borderTopWidth: 1, borderColor: "#eee", marginTop: 4, paddingTop: 4 },
            ]}
          >
            <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>Thành tiền:</Text>
            <Text style={[styles.totalPrice, { fontWeight: "bold" }]}>
              {(totalProduct + (item.shippingFee || 0)).toLocaleString()}đ
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
        {isPending && (
          <>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.navigate("CancelPreOrder", { order: item })}
            >
              <Text style={styles.cancelText}>Hủy đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => {
                navigation.navigate("PreOrderDetail", { orderId: item.id });
              }}
            >
              <Text style={styles.detailText}>Xem chi tiết</Text>
            </TouchableOpacity>

            
          </>
        )}

        {(isWaitingDelivery || isConfirmed || isCompleted || isCancelled) && (
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => {
              navigation.navigate("PreOrderDetail", { orderId: item.id });
            }}
          >
            <Text style={styles.detailText}>Xem chi tiết</Text>
          </TouchableOpacity>
        )}
      
      </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.title}>ĐƠN HÀNG ĐẶT TRƯỚC</Text>
        <View style={{ width: 26 }} />
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
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
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
            <Text style={styles.emptyText}>Chưa có đơn đặt trước.</Text>
          </View>
        }
      />
    </View>
  );
  
};

export default MyPreOrderScreen;

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
  bookingCard: {
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
  productInfoHeader: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 4,
  },
  shopName: { fontSize: 15, fontWeight: "600", color: "#333" },
  orderId: { fontSize: 13, color: "#666", marginTop: 4 },
  shopStatus: { fontSize: 13 },
  statusPending: { color: "#e67e22" },
  statusWaitingDelivery: { color: "#2980b9" },
  statusConfirmed: { color: "#f39c12" },
  statusCompleted: { color: "#27ae60" },
  statusCancelled: { color: "#e74c3c" },

  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
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
  confirmBtn: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  shippingBtn: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shippingText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  completeBtn: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 16, color: "#999", marginTop: 16 },
  detailBtn: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    minWidth: 110,
  },
  detailText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
