import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const CheckoutScreen = ({ navigation, route }) => {
  const { items = [], totalPrice = 0 } = route.params || {};
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState(
    route.params?.shippingMethod || { id: "1", name: "Tiết kiệm", fee: 10000 }
  );
  const [paymentMethod, setPaymentMethod] = useState(
    route.params?.paymentMethod || { id: "1", name: "Thanh toán khi nhận hàng" }
  );

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      navigation.replace("AuthFlow");
      return;
    }

    const unsubscribe = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setUserData(doc.data());
          } else {
            setUserData({});
          }
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi tải dữ liệu người dùng:", error);
          Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (route.params?.selectedAddress) {
      setUserData((prev) => ({
        ...prev,
        name: route.params.selectedAddress.name || prev?.name || "Khách hàng",
        phone: route.params.selectedAddress.phone || prev?.phone || "(+84) 912 345 678",
        address: route.params.selectedAddress.address || prev?.address || "Chưa có địa chỉ",
      }));
    }
    if (route.params?.shippingMethod) setShippingMethod(route.params.shippingMethod);
    if (route.params?.paymentMethod) setPaymentMethod(route.params.paymentMethod);
  }, [route.params]);

  const handleAddressPress = () => {
    navigation.navigate("Address", {
      onSelectAddress: (selectedAddress) => {
        if (selectedAddress) {
          setUserData((prev) => ({
            ...prev,
            name: selectedAddress.name || prev?.name,
            phone: selectedAddress.phone || prev?.phone,
            address: selectedAddress.address || prev?.address,
          }));
        }
      },
    });
  };

  // === XỬ LÝ PHƯƠNG THỨC VẬN CHUYỂN ===
  const handleShippingMethodPress = () => {
    navigation.navigate("ShippingMethod", {
      shippingMethod,
      items,
      totalPrice,
      onSelectShipping: (method) => setShippingMethod(method),
    });
  };

  // === XỬ LÝ PHƯƠNG THỨC THANH TOÁN ===
  const handlePaymentMethodPress = () => {
    navigation.navigate("PaymentMethod", {
      paymentMethod,
      onSelectPayment: (method) => setPaymentMethod(method),
    });
  };

  // === TÍNH PHÍ VÀ TỔNG CUỐI ===
  const shippingFee = shippingMethod.fee || 0;
  const finalTotal = totalPrice + shippingFee;

  // === XỬ LÝ ĐẶT HÀNG ===
  const handlePlaceOrder = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để đặt hàng!");
      navigation.replace("AuthFlow");
      return;
    }

    const address = userData?.address?.trim();
    if (!address || address === "Chưa có địa chỉ") {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn địa chỉ giao hàng!");
      navigation.navigate("Address");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Giỏ hàng trống", "Không có sản phẩm nào để đặt hàng.");
      return;
    }

    setOrderLoading(true);

    try {
      const orderData = {
        userId: uid,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice,
        shippingFee,
        finalTotal,
        shippingMethod: shippingMethod.name,
        paymentMethod: paymentMethod.name,
        address: {
          name: userData.name || "Khách hàng",
          phone: userData.phone || "(+84) 912 345 678",
          address: userData.address,
        },
        status: "pending",
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      // 1. Tạo đơn hàng
      const orderRef = await firestore().collection("orders").add(orderData);

      // 2. Xóa sản phẩm đã chọn khỏi giỏ hàng
      const cartRef = firestore().collection("carts").doc(uid);
      await firestore().runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        if (cartDoc.exists && cartDoc.data().items) {
          const remainingItems = cartDoc
            .data()
            .items.filter((cartItem) => !items.some((selected) => selected.id === cartItem.id));
          transaction.set(cartRef, { items: remainingItems }, { merge: true });
        }
      });

      // 3. Chuyển sang màn thành công
      navigation.replace("OrderSuccess", {
        orderId: orderRef.id,
        finalTotal,
        items,
        shippingMethod: shippingMethod.name,
        paymentMethod: paymentMethod.name,
      });
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      Alert.alert("Thất bại", "Đặt hàng không thành công. Vui lòng thử lại!");
    } finally {
      setOrderLoading(false);
    }
  };

  // === HIỂN THỊ LOADING ===
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>THANH TOÁN</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ĐỊA CHỈ */}
        <TouchableOpacity style={styles.section} onPress={handleAddressPress}>
          <Icon name="location-outline" size={20} color="#2e7d32" />
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>{userData?.name || "Khách hàng"}</Text>
            <Text style={styles.addressPhone}>{userData?.phone || "(+84) 912 345 678"}</Text>
            <Text style={styles.addressDetail}>{userData?.address || "Chưa có địa chỉ"}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* DANH SÁCH SẢN PHẨM */}
        <View style={styles.productSection}>
          {items.map((item) => (
            <View key={item.id} style={styles.productItem}>
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>
                  {item.price.toLocaleString("vi-VN")}đ x {item.quantity}
                </Text>
              </View>
              <Text style={styles.productTotal}>
                {(item.price * item.quantity).toLocaleString("vi-VN")}đ
              </Text>
            </View>
          ))}
        </View>

        {/* VẬN CHUYỂN */}
        <TouchableOpacity style={styles.section} onPress={handleShippingMethodPress}>
          <Icon name="car-outline" size={20} color="#2e7d32" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
            <Text style={styles.sectionSubtitle}>{shippingMethod.name}</Text>
          </View>
          <Text style={styles.shippingFee}>{shippingFee.toLocaleString("vi-VN")}đ</Text>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* THANH TOÁN */}
        <TouchableOpacity style={styles.section} onPress={handlePaymentMethodPress}>
          <Icon name="card-outline" size={20} color="#2e7d32" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <Text style={styles.sectionSubtitle}>{paymentMethod.name}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </ScrollView>

      {/* THANH TOÁN CỐ ĐỊNH DƯỚI MÀN HÌNH */}
      <View style={styles.fixedPaymentSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tạm tính</Text>
          <Text style={styles.detailValue}>{totalPrice.toLocaleString("vi-VN")}đ</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phí vận chuyển</Text>
          <Text style={styles.detailValue}>{shippingFee.toLocaleString("vi-VN")}đ</Text>
        </View>
        <View style={[styles.detailRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#eee" }]}>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalValue}>{finalTotal.toLocaleString("vi-VN")}đ</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtnInline, orderLoading && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={orderLoading}
        >
          {orderLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.placeOrderText}>Đặt hàng</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckoutScreen;

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
  scrollViewContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 200,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 8,
  },
  addressInfo: { flex: 1, marginLeft: 12 },
  addressName: { fontSize: 15, fontWeight: "600" },
  addressPhone: { fontSize: 13, color: "#666", marginTop: 2 },
  addressDetail: { fontSize: 13, color: "#666", marginTop: 4 },
  productSection: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, marginTop: 8 },
  productItem: { flexDirection: "row", marginBottom: 12 },
  productImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#f0f0f0" },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 14, color: "#333" },
  productPrice: { fontSize: 13, color: "#e67e22", marginTop: 4 },
  productTotal: { fontSize: 14, fontWeight: "bold", color: "#e67e22" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: { fontSize: 14, color: "#666" },
  detailValue: { fontSize: 14, color: "#333" },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#e67e22" },
  placeOrderBtnInline: {
    marginTop: 16,
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  sectionSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  shippingFee: { fontSize: 14, color: "#e67e22", marginRight: 8 },
});