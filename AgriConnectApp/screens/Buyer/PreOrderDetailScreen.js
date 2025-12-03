import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const DEFAULT_AVATAR = "https://via.placeholder.com/60/f0f0f0/cccccc?text=No+Img";

const PreOrderDetailScreen = ({ navigation, route }) => {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      Alert.alert("Lỗi", "Không tìm thấy mã đơn hàng.");
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection("preOrderBookings")
      .doc(orderId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setOrder({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            });
          } else {
            Alert.alert("Lỗi", "Đơn đặt trước không tồn tại.");
          }
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi tải đơn đặt trước:", error);
          Alert.alert("Lỗi", "Không thể tải thông tin đơn đặt trước.");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [orderId]);

  const handleCancelOrder = () => {
    Alert.alert(
      "Hủy đơn đặt trước",
      "Bạn có chắc chắn muốn hủy đơn này không?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore()
                .collection("preOrderBookings")
                .doc(orderId)
                .update({
                  status: "cancelled",
                  cancelReason: "Khách hàng hủy đơn",
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                });
              Alert.alert("Thành công", "Đơn đặt trước đã được hủy.");
            } catch (err) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể hủy đơn đặt trước.");
            }
          },
        },
      ]
    );
  };

  const handleGoHome = () => {
    navigation.popToTop();
    navigation.navigate("HomeBuyer");
  };

  const handleBuyAgain = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để mua lại.");
      return;
    }

    try {
      const cartRef = firestore().collection("carts").doc(uid);
      const newItems = order.products.map((prod) => ({
        id: prod.preOrderId || prod.id || prod.cropId || `pre_${order.id}_${prod.cropName}`,
        name: prod.cropName || "Sản phẩm đặt trước",
        imageUrl: prod.imageUrl || DEFAULT_AVATAR,
        price: prod.pricePerKg || 0,
        quantity: prod.quantity || 1,
        selected: true,
      }));

      await firestore().runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        let items = [];

        if (cartDoc.exists) {
          items = (cartDoc.data()?.items || []).filter((i) => i && i.id);
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

        transaction.set(cartRef, { items }, { merge: true });
      });

      navigation.navigate("Cart");
    } catch (error) {
      console.error("Lỗi mua lại:", error);
      navigation.navigate("Cart");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy đơn đặt trước.</Text>
      </View>
    );
  }

  const formatDate = (date) => {
    if (!date) return "Chưa xác định";
    return date
      .toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour12: false,
      })
      .replace(/,/, " ")
      .replace(/\//g, "/");
  };

  const totalProduct = order.products.reduce(
    (sum, prod) => sum + (prod.quantity * (prod.pricePerKg || 0)),
    0
  );
  const totalAmount = totalProduct + (order.shippingFee || 0);
  const isPending = order.status === "pending";
  const isWaitingDelivery = order.status === "waitingDelivery";
  const isConfirmed = order.status === "confirmed";
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CHI TIẾT ĐƠN ĐẶT TRƯỚC</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Trạng thái đơn hàng */}
        {!isCancelled ? (
        <View style={styles.orderStatus}>
            <View style={styles.progressContainer}>
            {[
                { label: "Chờ xác nhận", active: isPending || isWaitingDelivery || isConfirmed || isCompleted },
                { label: "Chờ giao",       active: isWaitingDelivery || isConfirmed || isCompleted },
                { label: "Đang vận chuyển", active: isConfirmed || isCompleted },
                { label: "Đã giao",        active: isCompleted },
            ].map((step, index) => (
                <View key={index} style={styles.stepWrapper}>
                <View style={styles.stepCircle}>
                    <Icon
                    name={step.active ? "checkmark-circle" : "ellipse-outline"}
                    size={28}
                    color={step.active ? "#2e7d32" : "#ccc"}
                    />
                </View>
                <Text
                    style={[
                    styles.stepLabel,
                    step.active && styles.stepLabelActive,
                    ]}
                >
                    {step.label}
                </Text>

                {index < 3 && (
                    <View
                    style={[
                        styles.connectorLine,
                        (index === 0 && (isWaitingDelivery || isConfirmed || isCompleted)) ||
                        (index === 1 && (isConfirmed || isCompleted)) ||
                        (index === 2 && isCompleted)
                        ? styles.connectorLineActive
                        : null,
                    ]}
                    />
                )}
                </View>
            ))}
            </View>
        </View>
        ) : (
          <View style={styles.cancelledStatusContainer}>
            <Text style={styles.cancelledStatusText}>Đơn đặt trước đã bị hủy</Text>
            {order.cancelReason && (
              <Text style={styles.cancelReasonText}>Lý do: {order.cancelReason}</Text>
            )}
          </View>
        )}

        {/* Thông tin người nhận hàng */}
        <View style={styles.orderInfo}>
          <Text style={styles.infoTitle}>Thông tin người nhận hàng</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Người nhận</Text>
            <Text style={styles.infoValue}>{order.buyerName || "Khách lẻ"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>{order.buyerPhone || "(+84) ..."}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Địa chỉ</Text>
            <Text style={styles.addressValue}>{order.buyerAddress || "Chưa có địa chỉ"}</Text>
          </View>
        </View>

        {/* Sản phẩm */}
        <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
          <FlatList
            data={order.products}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={({ item }) => (
              <View style={styles.productItem}>
                <Image
                  source={{ uri: item.imageUrl || DEFAULT_AVATAR }}
                  style={styles.productImage}
                />
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.cropName}
                  </Text>
                  <Text style={styles.productQuantity}>Số lượng: {item.quantity}kg</Text>
                  <Text style={styles.productPrice}>
                    {item.pricePerKg?.toLocaleString("vi-VN")}đ/kg
                  </Text>
                </View>
                <Text style={styles.productTotal}>
                  {(item.quantity * item.pricePerKg).toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
            style={{ marginBottom: 16 }}
          />
        </View>

        {/* Chi tiết thanh toán */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Mã đơn hàng</Text>
            <Text style={styles.paymentValue}>{order.id}</Text>
          </View>
            <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Phương thức thanh toán</Text>
                <Text style={styles.paymentValue}>{order.paymentMethod || "Chưa xác định"}</Text>
            </View>
            <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Thời gian đặt hàng</Text>
            <Text style={styles.paymentValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Tổng tiền sản phẩm</Text>
            <Text style={styles.paymentValue}>
              {totalProduct.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
            <Text style={styles.paymentValue}>
              {(order.shippingFee || 0).toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Tổng thành tiền</Text>
            <Text style={styles.paymentValue}>
              {totalAmount.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          {order.note && order.note.trim() !== "" && (
            <View style={styles.noteContainer}>
                <Text style={styles.paymentLabel}>Ghi chú</Text>
                <View style={styles.noteBox}>
                <Text style={styles.noteText}>{order.note.trim()}</Text>
                </View>
            </View>
            )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {isPending && (
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate("CancelPreOrder", { order })}>
            <Text style={styles.buttonText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <Text style={styles.buttonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && (
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity style={styles.buyAgainButton} onPress={handleBuyAgain}>
            <Text style={styles.buttonText}>Mua lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#e74c3c", textAlign: "center", marginTop: 20 },
  scrollContainer: { flex: 1 },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  orderStatus: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
    },
    progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    },
    stepWrapper: {
    flex: 1,
    alignItems: "center",
    position: "relative",
    },
    stepCircle: {
    zIndex: 1,
    backgroundColor: "#fff",
    },
    stepLabel: {
    marginTop: 8,
    fontSize: 11.5,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
    },
    stepLabelActive: {
    color: "#2e7d32",
    fontWeight: "600",
    },
    connectorLine: {
    position: "absolute",
    top: 14,
    left: "50%",
    right: "-50%",
    height: 3,
    backgroundColor: "#ddd",
    zIndex: 0,
    },
    connectorLineActive: {
    backgroundColor: "#2e7d32",
    },
  cancelledStatusContainer: {
    backgroundColor: "#fdf2f2",
    padding: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5c6cb",
    marginHorizontal: 16,
  },
  cancelledStatusText: { fontSize: 15, color: "#e74c3c", fontWeight: "600", textAlign: "center" },
  cancelReasonText: { fontSize: 13, color: "#c0392b", marginTop: 6, fontStyle: "italic", textAlign: "center" },
  orderInfo: { backgroundColor: "#fff", padding: 16, marginTop: 8 },
  infoTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  infoItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  infoLabel: { fontSize: 14, color: "#666" },
  infoValue: { fontSize: 14, color: "#333", textAlign: "right" },
  addressValue: { flexShrink: 1, flexWrap: "wrap", maxWidth: "70%", textAlign: "right" },
  productSection: { backgroundColor: "#fff", padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  productItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  productImage: { width: 60, height: 60, borderRadius: 8 },
  productDetails: { marginLeft: 10, flex: 1 },
  productName: { fontSize: 14, color: "#333", fontWeight: "500" },
  productQuantity: { fontSize: 12, color: "#666", marginTop: 2 },
  productPrice: { fontSize: 14, color: "#e67e22", fontWeight: "bold", marginTop: 2 },
  productTotal: { fontSize: 14, color: "#e67e22", fontWeight: "bold", marginLeft: 10, minWidth: 80, textAlign: "right" },
  separator: { height: 1, backgroundColor: "#eee" },
  paymentSection: { backgroundColor: "#fff", padding: 16, marginTop: 8 },
  paymentItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  paymentLabel: { fontSize: 14, color: "#666" },
  paymentValue: { fontSize: 14, color: "#333" },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  homeButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  buyAgainButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  noteContainer: {
  marginBottom: 12,
},
noteBox: {
  marginTop: 8,
  padding: 12,
  backgroundColor: "#f8f9fa",
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#e0e0e0",
},
noteText: {
  fontSize: 14,
  color: "#333",
  lineHeight: 20,
},
});

export default PreOrderDetailScreen;