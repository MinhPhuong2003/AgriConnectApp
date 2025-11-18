import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";

const CancelOrderScreen = ({ navigation, route }) => {
  const { order } = route.params || {};
  const [selectedReason, setSelectedReason] = useState(null);
  const [otherReason, setOtherReason] = useState("");

  const cancelReasons = [
    { id: 1, label: "Cần thay đổi phương thức thanh toán" },
    { id: 2, label: "Không có nhu cầu nữa" },
    { id: 3, label: "Cần thay đổi địa chỉ giao hàng" },
    { id: 4, label: "Chi phí giao hàng cao" },
    { id: 5, label: "Khác" },
  ];

  const handleContinue = async () => {
    if (!selectedReason) {
      Alert.alert("Lỗi", "Vui lòng chọn lý do hủy đơn!");
      return;
    }
    if (selectedReason === 5 && otherReason.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập lý do cụ thể khi chọn 'Khác'!");
      return;
    }

    const reasonLabel =
      selectedReason === 5
        ? `Khác: ${otherReason.trim()}`
        : cancelReasons.find((r) => r.id === selectedReason).label;

    try {
      if (order && order.id) {
        await firestore().collection("orders").doc(order.id).update({
          status: "cancelled",
          cancelReason: reasonLabel,
          cancelDate: firestore.FieldValue.serverTimestamp(),
        });

        navigation.navigate("CancelSuccess", {
          order,
          reason: reasonLabel,
          requestId: `REQ${Date.now()}`,
          cancelDate: new Date().toLocaleString("vi-VN"),
          orderId: order.id,
        });
      } else {
        Alert.alert("Lỗi", "Không thể tìm thấy thông tin đơn hàng.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể hủy đơn hàng.");
      console.error("Lỗi khi hủy đơn:", error);
    }
  };

  const isPending = order?.status === "pending";
  const isConfirmed = order?.status === "confirmed";
  const isShipped = order?.status === "shipping";
  const isCancelled = order?.status === "cancelled";

  const formatDate = (date) => {
    if (!date) return "Chưa xác định";
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hủy đơn hàng</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {order ? (
            <View style={styles.orderCard}>
              {/* Phần thông tin đơn hàng */}
              <View style={styles.shopHeader}>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>Thông tin đơn hàng</Text>
                  <Text style={styles.orderId}>Mã đơn hàng: {order.id}</Text>
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
                <Text style={styles.cancelDate}>
                  Đơn hàng đã hủy vào ngày {formatDate(order.createdAt)}
                </Text>
              )}

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
                {/* Tổng tiền sản phẩm */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng tiền sản phẩm:</Text>
                  <Text style={[styles.totalPrice, isCancelled && styles.totalCancelled]}>
                    {order.items
                      .reduce((sum, product) => sum + product.price * product.quantity, 0)
                      .toLocaleString("vi-VN")}
                    đ
                  </Text>
                </View>

                {/* Phí vận chuyển */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
                  <Text style={[styles.totalPrice, isCancelled && styles.totalCancelled]}>
                    {order.shippingFee
                      ? order.shippingFee.toLocaleString("vi-VN") + "đ"
                      : "0đ"}
                  </Text>
                </View>

                {/* Thành tiền */}
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
                    {order.finalTotal.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng.</Text>
          )}

          {/* Phần lý do hủy đơn hàng */}
          <Text style={styles.question}>Tại sao bạn muốn hủy đơn hàng?</Text>

          {cancelReasons.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonItem,
                selectedReason === reason.id && styles.reasonItemSelected,
              ]}
              onPress={() => {
                setSelectedReason(reason.id);
                if (reason.id !== 5) setOtherReason("");
              }}
            >
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason.id && styles.reasonTextSelected,
                ]}
              >
                {reason.label}
              </Text>
              {selectedReason === reason.id && (
                <Icon name="checkmark-circle" size={20} color="#2e7d32" />
              )}
            </TouchableOpacity>
          ))}

          {selectedReason === 5 && (
            <View style={styles.otherReasonContainer}>
              <TextInput
                style={styles.otherReasonInput}
                placeholder="Vui lòng nhập lý do cụ thể..."
                value={otherReason}
                onChangeText={setOtherReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.charCount}>
                {otherReason.length}/200
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedReason ||
                (selectedReason === 5 && otherReason.trim() === "")) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={
              !selectedReason || (selectedReason === 5 && otherReason.trim() === "")
            }
          >
            <Text style={styles.continueButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CancelOrderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 2,
    elevation: 2,
    marginTop: 16,
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
  cancelDate: { fontSize: 13, color: "#777", marginBottom: 12 },
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
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 12,
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
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 24,
    marginBottom: 12,
  },
  reasonItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonItemSelected: {
    borderColor: "#2e7d32",
    backgroundColor: "#f2f9f2",
  },
  reasonText: { fontSize: 14, color: "#333" },
  reasonTextSelected: { color: "#2e7d32", fontWeight: "500" },
  otherReasonContainer: { marginTop: 12, marginBottom: 16 },
  otherReasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  bottomButtonContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  continueButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonDisabled: { backgroundColor: "#ccc" },
  continueButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 20 },
  errorText: { textAlign: "center", color: "#e74c3c", marginTop: 20 },
});