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
    if (subtotal <= 0) return Alert.alert("Số lượng", "Giỏ hàng trống hoặc số lượng không hợp lệ!");
    if (!userData.address || userData.address === "Chưa có địa chỉ") {
      Alert.alert("Thiếu địa chỉ", "Vui lòng chọn địa chỉ giao hàng!");
      return;
    }

    setOrderLoading(true);
    try {
      const bookingRef = firestore().collection("preOrderBookings").doc();

      const products = cartItems.map((it) => ({
        preOrderId: it.id,
        cropName: it.cropName || "Không có tên",
        imageUrl: it.image || "",
        quantity: isSingleItem ? qty : (it.quantity || 1),
        pricePerKg: it.price || 0,
        subtotal: (it.price || 0) * (isSingleItem ? qty : (it.quantity || 1)),
        sellerId: it.sellerId || "",
        preOrderRef: firestore().collection("preOrders").doc(it.id),
      }));

      await bookingRef.set({
        buyerId: auth().currentUser.uid,
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
        products,
        subtotal,
        finalTotal,
      });

      const batch = firestore().batch();
      cartItems.forEach((it) => {
        batch.update(firestore().collection("preOrders").doc(it.id), {
          preOrderCurrent: firestore.FieldValue.increment(it.quantity || 1),
        });
      });
      await batch.commit();

      if (!isSingleItem) {
        const cartRef = firestore()
          .collection("users")
          .doc(auth().currentUser.uid)
          .collection("preOrderCart");
        const snapshot = await cartRef.get();
        const deleteBatch = firestore().batch();
        snapshot.docs.forEach((doc) => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
      }

      setLatestBookingId(bookingRef.id);
      setSuccessModalVisible(true);

    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", err.message || "Không thể đặt trước. Vui lòng thử lại!");
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
            <View style={styles.quantityRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, qty - 1).toString())}>
                <Icon name="remove" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.qtyInputWrapper}>
                <Text style={styles.qtyText}>{quantity}</Text>
              </View>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((qty + 1).toString())}>
                <Icon name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
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
  qtyInputWrapper: { width: 100, height: 44, backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#ddd", borderRadius: 12, justifyContent: "center", alignItems: "center", marginHorizontal: 20 },
  qtyText: { fontSize: 18, fontWeight: "bold", color: "#333" },
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
});

export default CheckoutPreOrderScreen;