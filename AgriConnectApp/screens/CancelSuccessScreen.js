import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const CancelSuccessScreen = ({ navigation, route }) => {
  const { order, reason, requestId, cancelDate, orderId } = route.params || {};

  const isCancelled = order?.status === "cancelled";

  const formatDate = (date) => {
    if (!date) return "Chưa xác định";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hủy đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {order ? (
          <>
            <View style={styles.orderCard}>
              <View style={styles.shopHeader}>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>Thông tin đơn hàng</Text>
                  <Text style={styles.orderId}>Mã đơn hàng: {orderId}</Text>
                </View>
                <Text style={[styles.shopStatus, styles.statusCancelled]}>
                  Đơn hàng đã hủy
                </Text>
              </View>

              {/* Thông tin hủy */}
              <View style={styles.cancelInfoContainer}>
                <Text style={styles.cancelDate}>
                  Đơn hàng đã hủy vào ngày {cancelDate}
                </Text>
                {reason && (
                  <Text style={styles.cancelReason}>
                    Lý do hủy: {reason}
                  </Text>
                )}
              </View>

              {/* Danh sách sản phẩm */}
              {order.items.map((product, index) => (
                <View
                  key={product.id + index}
                  style={[
                    styles.productRow,
                    index !== order.items.length - 1 && styles.productRowWithBorder,
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
                    {product.variant && product.variant !== "Không có biến thể" && (
                      <Text style={styles.productVariant}>{product.variant}</Text>
                    )}
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
                  <Text style={[styles.totalPrice, styles.totalCancelled]}>
                    {order.items
                      .reduce(
                        (sum, product) => sum + product.price * product.quantity,
                        0
                      )
                      .toLocaleString("vi-VN")}đ
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
                  <Text style={[styles.totalPrice, styles.totalCancelled]}>
                    {order.shippingFee
                      ? order.shippingFee.toLocaleString("vi-VN") + "đ"
                      : "0đ"}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Thành tiền:</Text>
                  <Text style={[styles.totalPrice, styles.totalCancelled]}>
                    {order.finalTotal.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </View>
            </View>        

            {/* Đánh giá trải nghiệm */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>
                Bạn hài lòng với trải nghiệm hủy đơn hàng chứ?
              </Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} style={styles.star}>
                    <Icon name="star-outline" size={36} color="#f1c40f" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng.</Text>
        )}
      </ScrollView>

      {/* Nút hành động */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => navigation.navigate("OrderDetail", { orderId: order?.id })}
        >
          <Text style={styles.detailButtonText}>Chi tiết đơn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate("HomeBuyer")}
        >
          <Text style={styles.homeButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CancelSuccessScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
  productVariant: { fontSize: 12, color: "#666", marginTop: 2 },
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
  totalCancelled: { color: "#e74c3c" },

  detailSection: { marginTop: 24 },
  detailTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 14, color: "#666" },
  detailValueContainer: { flexDirection: "row", alignItems: "center" },
  detailValue: { fontSize: 14, color: "#333" },

  ratingSection: { marginTop: 32, alignItems: "center" },
  ratingTitle: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  stars: { flexDirection: "row", gap: 8 },
  star: { padding: 4 },

  bottomButtons: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  homeButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  detailButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  homeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  errorText: { textAlign: "center", color: "#e74c3c", marginTop: 20 },
});