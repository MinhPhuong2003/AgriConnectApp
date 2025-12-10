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

const OrderDetailScreen = ({ navigation, route }) => {
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
      .collection("orders")
      .doc(orderId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setOrder({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
            });
          } else {
            Alert.alert("Lỗi", "Đơn hàng không tồn tại.");
          }
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi tải đơn hàng:", error);
          Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng.");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [orderId]);

  const getImageSource = (item) => {
    if (item.imageBase64) {
      return { uri: item.imageBase64 };
    }
    if (item.imageUrl) {
      return { uri: item.imageUrl };
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;
    navigation.navigate("CancelOrder", { order });
  };

  const handleGoHome = () => {
    navigation.navigate("HomeBuyer");
  };

  const addToCart = async (product, autoSelect = false) => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    const discountedPrice = Math.round(product.price * (1 - (product.discount || 0) / 100));
    const imageToUse = product.imageBase64 || product.imageUrl;

    const cartItemRef = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .doc(product.id);

      try {
    const snapshot = await cartItemRef.get();

    const currentQty = snapshot.exists
      ? (snapshot.data()?.quantity || 0)
      : 0;

    const maxStock = parseInt(
      product.stock?.toString() ||
      product.quantityAvailable?.toString() ||
      "0"
    );

    if (maxStock <= 0) {
      Alert.alert("Thông báo", "Sản phẩm đã hết hàng!");
      return;
    }

    if (currentQty + 1 > maxStock) {
      Alert.alert(
        "Thông báo",
        `Chỉ còn ${maxStock} sản phẩm trong kho!`
      );
      return;
    }

    await cartItemRef.set(
      {
        name: product.name || "",
        price: discountedPrice,
        originalPrice: product.price,
        discount: product.discount || 0,
        imageBase64: product.imageBase64 || null,
        imageUrl: product.imageBase64 ? null : imageToUse,
        sellerId: product.sellerId || product.farmerId || "unknown",
        farmerName: product.farmerName || product.sellerName || "Nông dân",
        farmerAvatarUrl: product.farmerAvatarUrl || product.sellerAvatarUrl || null,

        quantity: currentQty + 1,

        addedAt: firestore.FieldValue.serverTimestamp(),
        selected: autoSelect ? true : false
      },
      { merge: true }
    );

    if (autoSelect) {
      navigation.navigate("Cart", {
        highlightProductId: product.id
      });
    }

  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error);
    Alert.alert("Lỗi", "Không thể thêm vào giỏ. Vui lòng thử lại.");
  }

};

  const handleBuyAgain = async (order) => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để mua lại!");
      navigation.navigate("Login");
      return;
    }

    try {
      for (const item of order.items) {
        const product = {
          id: item.id,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice || item.price,
          discount: item.discount || 0,
          imageBase64: item.imageBase64 || null,
          imageUrl: item.imageUrl || null,
          stock: item.stock || 999,
          quantityAvailable: item.stock || 999,
          sellerId: item.sellerId || item.farmerId || "unknown",
          farmerName: item.farmerName || item.sellerName || "Nông dân",
          farmerAvatarUrl: item.farmerAvatarUrl || null,
        };
        await addToCart(product, true);
      }
    } catch (error) {
      console.error("Lỗi khi mua lại:", error);
      Alert.alert("Lỗi", "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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
        <Text style={styles.errorText}>Không tìm thấy đơn hàng.</Text>
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

  const totalAmount = (order.totalPrice || 0) + (order.shippingFee || 0);

  const isPending = order.status === "pending";
  const isConfirmed = order.status === "confirmed";
  const isShipped = order.status === "shipping";
  const isCancelled = order.status === "cancelled";

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={{ width: 26 }} />
        </View>

        {!isCancelled ? (
          <View style={styles.orderStatus}>
            <View style={styles.progressBar}>
              <View style={styles.stepContainer}>
                <Icon
                  name="checkmark-circle"
                  size={22}
                  color={isPending || isConfirmed || isShipped ? "#2e7d32" : "#ccc"}
                />
                <Text
                  style={[
                    styles.progressLabel,
                    (isPending || isConfirmed || isShipped) && styles.progressLabelActive,
                  ]}
                >
                  Chờ xác nhận
                </Text>
              </View>

              <View
                style={[
                  styles.progressLine,
                  (isConfirmed || isShipped) && styles.progressLineActive,
                ]}
              />

              <View style={styles.stepContainer}>
                <Icon
                  name={isConfirmed || isShipped ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={isConfirmed || isShipped ? "#2e7d32" : "#ccc"}
                />
                <Text
                  style={[
                    styles.progressLabel,
                    (isConfirmed || isShipped) && styles.progressLabelActive,
                  ]}
                >
                  Đang vận chuyển
                </Text>
              </View>

              <View
                style={[
                  styles.progressLine,
                  isShipped && styles.progressLineActive,
                ]}
              />

              <View style={styles.stepContainer}>
                <Icon
                  name={isShipped ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={isShipped ? "#2e7d32" : "#ccc"}
                />
                <Text
                  style={[
                    styles.progressLabel,
                    isShipped && styles.progressLabelActive,
                  ]}
                >
                  Đã giao
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cancelledStatusContainer}>
            <Text style={styles.cancelledStatusText}>Đơn hàng đã bị hủy</Text>
            {order.cancelReason && (
              <Text style={styles.cancelReasonText}>Lý do: {order.cancelReason}</Text>
            )}
          </View>
        )}

        <View style={styles.orderInfo}>
          <Text style={styles.infoTitle}>Thông tin người nhận hàng</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Người nhận</Text>
            <Text style={styles.infoValue}>{order.address?.name || "Khách hàng"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>{order.address?.phone || "(+84) 912 345 678"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Địa chỉ</Text>
            <Text style={styles.addressValue}>{order.address?.address || "Chưa có địa chỉ"}</Text>
          </View>
        </View>

        <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
          <FlatList
            data={order.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.productItem}>
                <Image
                  source={getImageSource(item)}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.productQuantity}>Số lượng: {item.quantity}</Text>
                  <Text style={styles.productPrice}>
                    {item.price.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
                <Text style={styles.productTotal}>
                  {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
            style={{ marginBottom: 16 }}
          />
        </View>

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
              {order.totalPrice?.toLocaleString("vi-VN") || "0"}đ
            </Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
            <Text style={styles.paymentValue}>
              {order.shippingFee?.toLocaleString("vi-VN") || "0"}đ
            </Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Tổng thành tiền</Text>
            <Text style={styles.paymentValue}>
              {totalAmount.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {isShipped && (
        <View style={styles.fixedButtonContainer}>
          {!order.reviewed && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => navigation.navigate("Review", { orderId: order.id })}
            >
              <Text style={[styles.buttonText, { color: "#2e7d32" }]}>Viết đánh giá</Text>
            </TouchableOpacity>
          )}

          {order.reviewed && (
            <View style={styles.reviewedFixedButton}>
              <Icon name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.reviewedFixedText}>Đã đánh giá</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.buyAgainButton,
              order.reviewed ? styles.buyAgainButtonReviewed : styles.buyAgainButtonNormal
            ]}
            onPress={() => handleBuyAgain(order)}
          >
            <Text style={styles.buttonText}>Mua lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPending && (
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
            <Text style={styles.buttonText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <Text style={styles.buttonText}>Về trang chủ</Text>
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
  orderStatus: { backgroundColor: "#fff", padding: 16, marginTop: 8 },
  progressBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  progressLine: { width: 40, height: 2, backgroundColor: "#ddd", marginHorizontal: 8 },
  progressLineActive: { backgroundColor: "#2e7d32" },
  progressLabel: { marginTop: 6, fontSize: 11, color: "#999", textAlign: "center" },
  progressLabelActive: { color: "#2e7d32", fontWeight: "600" },
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
  reviewButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  buyAgainButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  reviewedFixedButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#27ae60",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  reviewedFixedText: { color: "#27ae60", fontSize: 14, fontWeight: "bold", marginLeft: 6 },
  buyAgainButtonNormal: { marginLeft: 8, flex: 1 },
  buyAgainButtonReviewed: { marginLeft: 0, flex: 1 },
});

export default OrderDetailScreen;