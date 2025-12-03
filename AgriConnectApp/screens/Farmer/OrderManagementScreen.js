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
import firestore from "@react-native-firebase/firestore";

const TABS = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đang vận chuyển" },
  { key: "shipping", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
];

const OrderManagementScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);

  const initialTab = route.params?.initialTab;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("orders")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const ordersList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            deliveredAt: doc.data().deliveredAt?.toDate(),
            cancelledAt: doc.data().cancelledAt?.toDate(),
          }));
          setOrders(ordersList);
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi tải đơn hàng:", error);
          Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng.");
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = firestore().collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();
      const orderData = orderSnap.data();

      const updates = {
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (newStatus === "cancelled") {
        updates.cancelledAt = firestore.FieldValue.serverTimestamp();
      }

      if (newStatus === "shipping") {
        updates.deliveredAt = firestore.FieldValue.serverTimestamp();

        await firestore().collection("notifications").add({
          userId: orderData.userId,
          orderId: orderId,
          title: `Đơn hàng #${orderId.slice(-8)} đã được giao`,
          message: "Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!",
          type: "order_delivered",
          createdAt: firestore.FieldValue.serverTimestamp(),
          read: false,
        });
      }

      await orderRef.update(updates);
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái đơn hàng.");
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
      <View style={styles.orderCard}>
        {/* Header */}
        <View style={styles.shopHeader}>
          <View style={styles.shopInfo}>
            {item.items && item.items.length > 0 && (
              <Text style={styles.productInfoHeader}>Thông tin sản phẩm</Text>
            )}
            <Text style={styles.shopName}>Mã đơn: {item.id}</Text>
            {/* 1. Chờ xác nhận → Hiển thị "Đặt lúc" */}
              {isPending && (
                <Text style={styles.orderId}>
                  Đặt lúc: {formatDate(item.createdAt)}
                </Text>
              )}

              {/* 2. Đang vận chuyển → Hiển thị "Đã xác nhận lúc" */}
              {isConfirmed && item.updatedAt && (
                <Text style={styles.orderId}>
                  Đã xác nhận lúc: {formatDate(item.updatedAt)}
                </Text>
              )}

              {/* 3. Đã giao → Hiển thị "Đã giao lúc" */}
              {isShipped && (
                <Text style={styles.orderId}>
                  Đã giao lúc: {formatDate(item.deliveredAt || item.updatedAt)}
                </Text>
              )}
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
              ? "Chờ xác nhận"
              : isConfirmed
              ? "Đang vận chuyển"
              : isShipped
              ? "Đã giao"
              : "Đã hủy"}
          </Text>
        </View>

        {/* Thông tin hủy */}
        {isCancelled && (
          <View style={styles.cancelInfoContainer}>
            <Text style={styles.cancelDate}>
              Đã hủy vào {formatDate(item.cancelledAt || item.createdAt)}
            </Text>
            {item.cancelReason && (
              <Text style={styles.cancelReason}>Lý do: {item.cancelReason}</Text>
            )}
          </View>
        )}

        {/* Sản phẩm */}
        {item.items?.map((product, index) => (
          <View
            key={`${product.id}-${index}`}
            style={[
              styles.productRow,
              index !== (item.items?.length || 0) - 1 && styles.productRowWithBorder,
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

        {/* Tổng tiền */}
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền sản phẩm:</Text>
            <Text style={styles.totalPrice}>
              {item.items
                ?.reduce((sum, p) => sum + p.price * p.quantity, 0)
                .toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
            <Text style={styles.totalPrice}>
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
              {item.finalTotal?.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        </View>

        {/* Nút hành động */}
        <View style={styles.actionButtons}>
          {isPending && (
            <>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  Alert.alert("Hủy đơn", "Xác nhận hủy đơn hàng?", [
                    { text: "Không" },
                    {
                      text: "Hủy",
                      onPress: () => updateOrderStatus(item.id, "cancelled"),
                    },
                  ]);
                }}
              >
                <Text style={styles.cancelText}>Hủy đơn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => updateOrderStatus(item.id, "confirmed")}
              >
                <Text style={styles.confirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </>
          )}

          {isConfirmed && (
            <TouchableOpacity
              style={styles.shippingBtn}
              onPress={() => updateOrderStatus(item.id, "shipping")}
            >
              <Text style={styles.shippingText}>Giao hàng</Text>
            </TouchableOpacity>
          )}

          {(isShipped || isCancelled) && (
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() =>
                navigation.navigate("OrderDetail", { orderId: item.id })
              }
            >
              <Text style={styles.detailText}>Xem chi tiết</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Quản lý đơn hàng</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tabs cố định + số lượng */}
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
                if (scrollViewRef.current) {
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

      {/* Danh sách đơn hàng */}
      <FlatList
        data={getFilteredOrders()}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              Chưa có đơn hàng{" "}
              {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default OrderManagementScreen;

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
  cancelDate: { fontSize: 13, color: "#e74c3c", fontWeight: "500" },
  cancelReason: { fontSize: 13, color: "#c0392b", marginTop: 4, fontStyle: "italic" },

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
  detailBtn: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 16, color: "#999", marginTop: 16 },
});