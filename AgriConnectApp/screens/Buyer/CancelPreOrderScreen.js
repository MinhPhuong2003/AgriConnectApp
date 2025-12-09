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
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const CancelPreOrderScreen = ({ navigation, route }) => {
  const { order } = route.params || {};
  const [selectedReason, setSelectedReason] = useState(null);
  const [otherReason, setOtherReason] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cancelReasonFinal, setCancelReasonFinal] = useState("");

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
      // DÙNG TRANSACTION ĐỂ ĐẢM BẢO AN TOÀN DỮ LIỆU
      await firestore().runTransaction(async (transaction) => {
        const bookingRef = firestore().collection("preOrderBookings").doc(order.id);

        // 1. Cập nhật trạng thái đơn đặt trước thành cancelled
        transaction.update(bookingRef, {
          status: "cancelled",
          cancelReason: reasonLabel,
          cancelDate: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // 2. Hoàn lại số lượng đã đặt cho từng sản phẩm trong đơn
        if (order.products && order.products.length > 0) {
          for (const prod of order.products) {
            const preOrderRef = firestore().collection("preOrders").doc(prod.preOrderId);

            const preOrderDoc = await transaction.get(preOrderRef);
            if (preOrderDoc.exists) {
              const data = preOrderDoc.data();
              const currentBooked = data.preOrderCurrent || 0;
              const limit = data.preOrderLimit || 0;

              // Chỉ hoàn lại nếu có giới hạn (limit > 0)
              if (limit > 0) {
                const newCurrent = Math.max(0, currentBooked - prod.quantity);
                transaction.update(preOrderRef, {
                  preOrderCurrent: newCurrent,
                });
              }
            }
          }
        }
      });

      // Thành công → hiện modal
      setCancelReasonFinal(reasonLabel);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Lỗi hủy đơn đặt trước:", error);
      Alert.alert("Lỗi", "Không thể hủy đơn. Vui lòng thử lại sau.");
    }
  };

  const totalProduct = order?.products
    ? order.products.reduce((sum, p) => sum + (p.quantity * (p.pricePerKg || 0)), 0)
    : 0;
  const finalTotal = totalProduct + (order?.shippingFee || 0);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hủy đơn đặt trước</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Thông tin đơn hàng */}
        {order ? (
          <View style={styles.orderCard}>
            <View style={styles.shopHeader}>
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>Thông tin đơn đặt trước</Text>
                <Text style={styles.orderId}>Mã đơn: {order.id}</Text>
              </View>
              <Text style={[styles.shopStatus, styles.statusPending]}>
                Chờ xác nhận
              </Text>
            </View>

            {order.products?.map((prod, index) => (
              <View
                key={`${prod.preOrderId || index}-${index}`}
                style={[
                  styles.productRow,
                  index !== order.products.length - 1 && styles.productRowWithBorder,
                ]}
              >
                <Image source={{ uri: prod.imageUrl || DEFAULT_AVATAR }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {prod.cropName || "Sản phẩm"}
                  </Text>
                  <Text style={styles.productPrice}>
                    {prod.pricePerKg?.toLocaleString() || 0}đ × {prod.quantity}kg
                  </Text>
                </View>
                <Text style={styles.productTotal}>
                  {((prod.quantity || 0) * (prod.pricePerKg || 0)).toLocaleString()}đ
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
                <Text style={styles.totalPrice}>
                  {(order.shippingFee || 0).toLocaleString()}đ
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>Thành tiền:</Text>
                <Text style={[styles.totalPrice, { fontWeight: "bold" }]}>
                  {finalTotal.toLocaleString()}đ
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng.</Text>
        )}

        {/* Lý do hủy */}
        <Text style={styles.question}>Tại sao bạn muốn hủy đơn đặt trước?</Text>

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
            <Text style={styles.charCount}>{otherReason.length}/200</Text>
          </View>
        )}
      </ScrollView>

      {/* Nút Hủy đơn */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedReason || (selectedReason === 5 && !otherReason.trim())) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedReason || (selectedReason === 5 && !otherReason.trim())}
        >
          <Text style={styles.continueButtonText}>Hủy đơn</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL THÀNH CÔNG */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Icon name="checkmark-circle" size={60} color="#2e7d32" />
            </View>
            <Text style={styles.modalTitle}>Hủy đơn thành công!</Text>
            <Text style={styles.modalSubtitle}>
              Đơn đặt trước của bạn đã được hủy thành công.
            </Text>

            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>Mã đơn: {order.id}</Text>
              <View style={styles.reasonRow}>
                <Text style={styles.modalInfoLabel}>Lý do hủy:</Text>
                <Text style={styles.modalReasonInline}>{cancelReasonFinal}</Text>
                </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.popToTop();
                  navigation.navigate("MyPreOrder");
                }}
              >
                <Text style={styles.modalBtnTextSecondary}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => {
                  setShowSuccessModal(false);
                  // navigation.popToTop();
                  navigation.replace("PreOrderDetail", { orderId: order.id });
                }}
              >
                <Text style={styles.modalBtnTextPrimary}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CancelPreOrderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  orderCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  shopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  shopInfo: {},
  shopName: { fontSize: 15, fontWeight: "600", color: "#333" },
  orderId: { fontSize: 13, color: "#666", marginTop: 4 },
  shopStatus: { fontSize: 13, fontWeight: "600" },
  statusPending: { color: "#e67e22" },

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
    borderTopColor: "#eee",
    paddingTop: 12,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 14, color: "#555" },
  totalPrice: { fontSize: 16, fontWeight: "bold" },

  question: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  reasonItem: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  reasonItemSelected: { borderColor: "#2e7d32", backgroundColor: "#f2f9f2" },
  reasonText: { fontSize: 14, color: "#333" },
  reasonTextSelected: { color: "#2e7d32", fontWeight: "500" },

  otherReasonContainer: { marginHorizontal: 16, marginTop: 12 },
  otherReasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    minHeight: 80,
  },
  charCount: { fontSize: 12, color: "#666", textAlign: "right", marginTop: 4 },

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
  errorText: { textAlign: "center", color: "#e74c3c", marginTop: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 10,
  },
  successIcon: { marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#2e7d32", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  modalInfo: { width: "100%", marginBottom: 24 },
  modalInfoText: { fontSize: 14, color: "#444", marginBottom: 4 },
  modalReason: { fontSize: 14, color: "#333", fontStyle: "italic", marginTop: 4 },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2e7d32",
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnTextSecondary: { color: "#2e7d32", fontWeight: "600" },
  modalBtnTextPrimary: { color: "#fff", fontWeight: "600" },
  reasonRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "flex-start",
  width: "100%",
  marginTop: 8,
},
modalInfoLabel: {
  fontSize: 14,
  color: "#555",
  fontWeight: "500",
  marginRight: 8,
},
modalReasonInline: {
  fontSize: 14,
  color: "#333",
  flex: 1,
  lineHeight: 20,
  fontStyle: "italic",
},
});