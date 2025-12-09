import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const CheckoutPreOrderScreen = ({ navigation, route }) => {
  const preOrderData = route.params?.preOrderData;
  const cartItems = route.params?.cartItems || (preOrderData ? [preOrderData] : []);
  const isSingleItem = !!preOrderData && !route.params?.cartItems;
  const item = isSingleItem ? preOrderData : null;

  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const [shippingMethod, setShippingMethod] = useState(
    route.params?.shippingMethod || { id: "1", name: "Tiết kiệm", fee: 10000 }
  );
  const [paymentMethod, setPaymentMethod] = useState(
    route.params?.paymentMethod || { id: "1", name: "Thanh toán khi nhận hàng" }
  );

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [latestBookingId, setLatestBookingId] = useState(null);

  useEffect(() => {
    if (route.params?.selectedAddress) {
      setUserData((prev) => ({
        ...prev,
        name: route.params.selectedAddress.name || prev?.name,
        phone: route.params.selectedAddress.phone || prev?.phone,
        address: route.params.selectedAddress.address || prev?.address,
      }));
    }
    if (route.params?.shippingMethod) setShippingMethod(route.params.shippingMethod);
    if (route.params?.paymentMethod) setPaymentMethod(route.params.paymentMethod);
  }, [route.params]);

  const qty = isSingleItem ? parseFloat(quantity) || 0 : 0;
  const singleSubtotal = isSingleItem ? qty * (item?.price || 0) : 0;
  const multiSubtotal = cartItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
  const subtotal = isSingleItem ? singleSubtotal : multiSubtotal;
  const shippingFee = shippingMethod.fee || 0;
  const finalTotal = subtotal + shippingFee;

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price) + "đ";
  
  const [availableQuantity, setAvailableQuantity] = useState(Infinity);
  useEffect(() => {
    if (!isSingleItem || !item?.id) return;

    const fetchAvailableQuantity = async () => {
      try {
        const preOrderDoc = await firestore()
          .collection("preOrders")
          .doc(item.id)
          .get();

        if (preOrderDoc.exists) {
          const data = preOrderDoc.data();
          const limit = data.preOrderLimit || 0;
          const current = data.preOrderCurrent || 0;
          const remaining = limit > 0 ? Math.max(0, limit - current) : Infinity;
          setAvailableQuantity(remaining);
        }
      } catch (err) {
        console.error("Lỗi lấy tồn kho pre-order:", err);
        setAvailableQuantity(Infinity);
      }
    };

    fetchAvailableQuantity();
  }, [isSingleItem, item?.id]);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      navigation.replace("Login");
      return;
    }

    const unsub = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot((doc) => {
        if (doc.exists) setUserData(doc.data());
        setLoading(false);
      });

    return () => unsub();
  }, []);

  const handleAddressPress = () => {
    navigation.navigate("Address", {
      onSelectAddress: (addr) => {
        if (addr) {
          setUserData(prev => ({
            ...prev,
            name: addr.name,
            phone: addr.phone,
            address: addr.address,
          }));
        }
      },
    });
  };

  const handleShippingMethodPress = () => {
    navigation.navigate("ShippingMethod", {
      shippingMethod,
      onSelectShipping: (method) => setShippingMethod(method),
    });
  };

  const handlePaymentMethodPress = () => {
    navigation.navigate("PaymentMethod", {
      selectedPayment: paymentMethod,
      onSelectPayment: (method) => setPaymentMethod(method),
    });
  };

  const handlePlaceOrder = async () => {
    if (!auth().currentUser) return Alert.alert("Lỗi", "Vui lòng đăng nhập!");
    if (subtotal <= 0) return Alert.alert("Số lượng", "Vui lòng chọn số lượng!");
    if (!userData.address || userData.address === "Chưa có địa chỉ") {
      Alert.alert("Thiếu địa chỉ", "Vui lòng chọn địa chỉ giao hàng!");
      return;
    }

    setOrderLoading(true);

    try {
      const uid = auth().currentUser.uid;

      const result = await firestore().runTransaction(async (transaction) => {
        const productsToBook = [];
        let totalIncrement = 0;
        for (const it of cartItems) {
          const preOrderId = it.id || it.preOrderId;
          const qtyToAdd = isSingleItem ? qty : (it.quantity || 1);

          const preOrderRef = firestore().collection("preOrders").doc(preOrderId);
          const preOrderDoc = await transaction.get(preOrderRef);

          if (!preOrderDoc.exists) {
            throw new Error(`Sản phẩm ${it.cropName} không tồn tại!`);
          }

          const data = preOrderDoc.data();
          const limit = data.preOrderLimit || 0;
          const current = data.preOrderCurrent || 0;
          const remaining = limit > 0 ? limit - current : Infinity;

          if (remaining !== Infinity && qtyToAdd > remaining) {
            throw new Error(
              `Chỉ còn ${remaining}kg "${it.cropName}" có thể đặt trước. Vui lòng giảm số lượng.`
            );
          }

          productsToBook.push({
            preOrderId,
            cropName: it.cropName || "Không tên",
            imageUrl: it.image || "",
            quantity: qtyToAdd,
            pricePerKg: it.price || 0,
            subtotal: (it.price || 0) * qtyToAdd,
            sellerId: it.sellerId || "",
            preOrderRef,
          });

          totalIncrement += qtyToAdd;

          if (limit > 0) {
            transaction.update(preOrderRef, {
              preOrderCurrent: current + qtyToAdd,
            });
          }
        }

        const bookingRef = firestore().collection("preOrderBookings").doc();
        transaction.set(bookingRef, {
          buyerId: uid,
          buyerName: userData.name || "Khách hàng",
          buyerPhone: userData.phone || "",
          buyerAddress: userData.address || "Không có",
          shippingFee,
          shippingMethod: shippingMethod?.name || "Không chọn",
          paymentMethod: paymentMethod?.name || "Không chọn",
          note: note?.trim?.() || "",
          status: "pending",
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          products: productsToBook,
          subtotal,
          finalTotal,
        });

        if (!isSingleItem) {
          const cartRef = firestore()
            .collection("users")
            .doc(uid)
            .collection("preOrderCart");

          const cartSnapshot = await cartRef.get();
          cartSnapshot.docs.forEach((doc) => {
            transaction.delete(doc.ref);
          });
        }

        return { bookingId: bookingRef.id };
      });

      setLatestBookingId(result.bookingId);
      setSuccessModalVisible(true);

    } catch (err) {
      console.error("Lỗi đặt trước:", err);
      Alert.alert("Không thể đặt hàng", err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setOrderLoading(false);
    }
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
          <Icon name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>XÁC NHẬN THANH TOÁN</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Danh sách sản phẩm */}
        {cartItems.map((it, index) => (
          <View key={it.id} style={[styles.productSection, index > 0 && { marginTop: 8 }]}>
            <View style={styles.productItem}>
              <Image source={{ uri: it.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{it.cropName}</Text>
                <Text style={styles.harvestText}>
                  Thu hoạch: {it.expectedHarvestDate ? (() => {
                    const d = it.expectedHarvestDate.toDate();
                    const day = String(d.getDate()).padStart(2, "0");
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const year = d.getFullYear();
                    return `${day}/${month}/${year}`;
                  })() : "Chưa xác định"}
                </Text>
                <Text style={styles.productPrice}>
                  {formatPrice(it.price)}/kg × {isSingleItem ? quantity : (it.quantity || 1)}kg
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Số lượng (chỉ khi đặt 1 sản phẩm) */}
        {isSingleItem && (
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Số lượng đặt trước (kg)</Text>
            
            {/* Hiển thị còn lại bao nhiêu kg */}
            {availableQuantity !== Infinity && (
              <Text style={styles.remainingText}>
                Còn lại: {availableQuantity > 0 ? `${availableQuantity}kg` : "Hết hàng"}
              </Text>
            )}

            <View style={styles.quantityRow}>
              {/* Nút giảm */}
              <TouchableOpacity
                style={[
                  styles.qtyBtn,
                  parseInt(quantity) <= 1 && styles.qtyBtnDisabled
                ]}
                onPress={() => {
                  const cur = parseInt(quantity) || 1;
                  if (cur > 1) setQuantity((cur - 1).toString());
                }}
                disabled={parseInt(quantity) <= 1}
              >
                <Icon name="remove" size={22} color="#fff" />
              </TouchableOpacity>

              {/* Ô NHẬP SỐ - CÓ THỂ CLICK VÀ GÕ TAY */}
              <TextInput
                style={styles.qtyInput}
                value={quantity}
                onChangeText={(text) => {
                  // Chỉ cho phép số nguyên dương
                  const num = text.replace(/[^0-9]/g, "");
                  if (num === "" || parseInt(num) === 0) {
                    setQuantity("1");
                  } else if (availableQuantity !== Infinity && parseInt(num) > availableQuantity) {
                    // Nếu nhập quá giới hạn → tự động về max
                    setQuantity(availableQuantity.toString());
                    Alert.alert("Giới hạn", `Chỉ còn ${availableQuantity}kg có thể đặt trước`);
                  } else {
                    setQuantity(num);
                  }
                }}
                keyboardType="numeric"
                textAlign="center"
                selectTextOnFocus={true}
                maxLength={4}
              />

              {/* Nút tăng */}
              <TouchableOpacity
                style={[
                  styles.qtyBtn,
                  availableQuantity !== Infinity && parseInt(quantity) >= availableQuantity && styles.qtyBtnDisabled
                ]}
                onPress={() => {
                  const cur = parseInt(quantity) || 1;
                  const next = cur + 1;
                  if (availableQuantity !== Infinity && next > availableQuantity) {
                    Alert.alert("Không thể tăng", `Chỉ còn ${availableQuantity}kg`);
                    return;
                  }
                  setQuantity(next.toString());
                }}
                disabled={availableQuantity !== Infinity && parseInt(quantity) >= availableQuantity}
              >
                <Icon
                  name="add"
                  size={22}
                  color={
                    availableQuantity !== Infinity && parseInt(quantity) >= availableQuantity
                      ? "#ccc"
                      : "#fff"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Cảnh báo nếu đã đạt giới hạn */}
            {availableQuantity !== Infinity && parseInt(quantity) >= availableQuantity && availableQuantity > 0 && (
              <Text style={styles.warningText}>Đã đạt số lượng tối đa còn lại</Text>
            )}
          </View>
        )}

        {/* Ghi chú */}
        <View style={styles.noteSection}>
          <Text style={styles.sectionTitle}>Ghi chú cho người bán</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Nhập ghi chú..."
            placeholderTextColor="#aaa"
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Địa chỉ, vận chuyển, thanh toán */}
        <TouchableOpacity style={styles.section} onPress={handleAddressPress}>
          <Icon name="location-outline" size={20} color="#2e7d32" />
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>{userData?.name || "Khách hàng"}</Text>
            <Text style={styles.addressPhone}>{userData?.phone || "(+84) 912 345 678"}</Text>
            <Text style={styles.addressDetail}>{userData?.address || "Chưa có địa chỉ"}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.section} onPress={handleShippingMethodPress}>
          <Icon name="car-outline" size={20} color="#2e7d32" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
            <Text style={styles.sectionSubtitle}>{shippingMethod.name}</Text>
          </View>
          <Text style={styles.shippingFee}>{shippingFee.toLocaleString("vi-VN")}đ</Text>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.section} onPress={handlePaymentMethodPress}>
          <Icon name="card-outline" size={20} color="#2e7d32" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <Text style={styles.sectionSubtitle}>{paymentMethod.name}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </ScrollView>

      {/* Tổng tiền & nút thanh toán */}
      <View style={styles.fixedPaymentSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tạm tính ({cartItems.length} sản phẩm)</Text>
          <Text style={styles.detailValue}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phí vận chuyển</Text>
          <Text style={styles.detailValue}>{formatPrice(shippingFee)}</Text>
        </View>
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtnInline, orderLoading && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={orderLoading}
        >
          {orderLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeOrderText}>THANH TOÁN</Text>}
        </TouchableOpacity>
      </View>

      {/* Modal thành công */}
      <Modal transparent visible={successModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.checkmarkCircle}>
              <Icon name="checkmark" size={56} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Đặt trước thành công!</Text>
            <Text style={styles.successMessage}>
              Đơn hàng đã được gửi đến nông dân. Chúng tôi sẽ thông báo khi sản phẩm sẵn sàng thu hoạch.
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.popToTop();
                  navigation.navigate("CartPreOrder");
                }}
              >
                <Text style={styles.modalBtnTextSecondary}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.replace("MyPreOrder");
                }}
              >
                <Text style={styles.modalBtnTextPrimary}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  title: { fontSize: 18, fontWeight: "bold", color: "#000" },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingHorizontal: 16, paddingBottom: 200 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    elevation: 15,
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  modalButtonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnTextPrimary: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  modalBtnTextSecondary: { color: "#27ae60", fontWeight: "bold", fontSize: 15 },
  productSection: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, marginTop: 8 },
  productItem: { flexDirection: "row", alignItems: "center" },
  productImage: { width: 70, height: 70, borderRadius: 10 },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 15, fontWeight: "600", color: "#333" },
  harvestText: { fontSize: 13, color: "#27ae60", marginTop: 4 },
  productPrice: { fontSize: 14, color: "#e67e22", fontWeight: "600", marginTop: 4 },
  quantitySection: { backgroundColor: "#fff", padding: 16, marginTop: 8 },
  quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
  qtyBtn: { backgroundColor: "#27ae60", width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  
  noteSection: { backgroundColor: "#fff", padding: 16, marginTop: 8 },
  noteInput: { marginTop: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, paddingHorizontal: 14, paddingTop: 14, minHeight: 100, backgroundColor: "#fafafa", textAlignVertical: "top", fontSize: 14, color: "#333" },
  section: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, marginTop: 8 },
  addressInfo: { flex: 1, marginLeft: 12 },
  addressName: { fontSize: 15, fontWeight: "600" },
  addressPhone: { fontSize: 13, color: "#666", marginTop: 2 },
  addressDetail: { fontSize: 13, color: "#666", marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  sectionSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  shippingFee: { fontSize: 14, color: "#e67e22", marginRight: 8, fontWeight: "600" },
  fixedPaymentSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 10,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  detailLabel: { fontSize: 14, color: "#666" },
  detailValue: { fontSize: 14, color: "#333" },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#e67e22" },
  placeOrderBtnInline: {
    marginTop: 16,
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  placeOrderText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  remainingText: {
    fontSize: 13,
    color: "#e67e22",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  qtyBtnDisabled: {
    backgroundColor: "#ddd",
  },
  qtyInput: {
    width: 100,
    height: 44,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginHorizontal: 20,
  },
});

export default CheckoutPreOrderScreen;