import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const CartPreOrderScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);

  const user = auth().currentUser;

  useEffect(() => {
    if (!user) {
      navigation.replace("Login");
      return;
    }

    const unsubscribe = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("preOrderCart")
      .onSnapshot(async (snapshot) => {
        const items = [];
        let total = 0;
        for (const doc of snapshot.docs) {
          const data = doc.data();
          let availableQuantity = 99999;
          if (data.preOrderId) {
            try {
              const preOrderDoc = await firestore()
                .collection("preOrders")
                .doc(data.preOrderId)
                .get();

              if (preOrderDoc.exists) {
                const p = preOrderDoc.data();
                const limit = p.preOrderLimit || 0;
                const current = p.preOrderCurrent || 0;
                availableQuantity = Math.max(0, limit - current);
              }
            } catch (e) {
              console.log("Lỗi lấy tồn kho pre-order:", e);
            }
          }

          const quantity = data.quantity || 1;
          const itemTotal = (data.price || 0) * quantity;
          total += itemTotal;

          items.push({
            id: doc.id,
            ...data,
            availableQuantity,
            region: data.region || "Chưa xác định",
            expectedHarvestDate: data.expectedHarvestDate,
            preOrderEndDate: data.preOrderEndDate,
          });
        }

        setCartItems(items);
        setTotalPrice(total);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user, navigation]);

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("preOrderCart")
      .doc(itemId)
      .update({ quantity: newQuantity });
  };

  const removeItem = (itemId) => {
    Alert.alert("Xóa sản phẩm", "Bạn có chắc muốn xóa khỏi giỏ hàng?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () =>
          firestore()
            .collection("users")
            .doc(user.uid)
            .collection("preOrderCart")
            .doc(itemId)
            .delete(),
      },
    ]);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const formatDate = (timestamp) => {
    if (!timestamp) return "Chưa xác định";
    return timestamp.toDate().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />

      <View style={styles.itemDetails}>
        <Text style={styles.cropName} numberOfLines={2}>
          {item.cropName}
        </Text>

        <View style={styles.infoRow}>
          <Icon name="location-outline" size={14} color="#27ae60" />
          <Text style={styles.infoText}>{item.region}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="leaf-outline" size={14} color="#27ae60" />
          <Text style={styles.infoText}>
            Thu hoạch: {formatDate(item.expectedHarvestDate)}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(item.price)}/kg</Text>
          <Text style={styles.totalItemPrice}>
            Tổng: {formatPrice(item.price * (item.quantity || 1))}
          </Text>
        </View>

      <View style={styles.quantityRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
        >
          <Icon name="remove" size={18} color="#666" />
        </TouchableOpacity>

        <TextInput
          key={item.id + "-qty"}
          style={styles.quantityInput}
          defaultValue={String(item.quantity || 1)}
          keyboardType="number-pad"
          selectTextOnFocus={true}
          onChangeText={(text) => {
            let num = parseInt(text) || 1;
            if (num < 1) num = 1;
            if (item.availableQuantity > 0 && num > item.availableQuantity) {
              num = item.availableQuantity;
              if (!item._justLimited) {
                item._justLimited = true;
                setTimeout(() => {
                  Alert.alert(
                    "Không thể đặt thêm",
                    `Chỉ còn ${item.availableQuantity}kg có thể đặt trước.`,
                    [{ text: "OK", onPress: () => delete item._justLimited }]
                  );
                }, 300);
              }
            } else {
              item._justLimited = false;
            }

            updateQuantity(item.id, num);
          }}
          onEndEditing={(e) => {
            let num = parseInt(e.nativeEvent.text) || 1;
            if (num < 1) num = 1;

            if (item.availableQuantity > 0 && num > item.availableQuantity) {
              num = item.availableQuantity;
              if (!item._justLimited) {
                Alert.alert(
                  "Không thể đặt thêm",
                  `Chỉ còn ${item.availableQuantity}kg có thể đặt trước.`,
                  [{ text: "OK" }]
                );
              }
            }

            updateQuantity(item.id, num);
            delete item._justLimited;
          }}
        />

  <TouchableOpacity
    style={[
      styles.qtyBtn,
      item.availableQuantity > 0 && (item.quantity || 1) >= item.availableQuantity && styles.qtyBtnDisabled
    ]}
    onPress={() => {
      const next = (item.quantity || 1) + 1;
      if (item.availableQuantity > 0 && next > item.availableQuantity) {
        Alert.alert("Hết lượt đặt", `Chỉ còn ${item.availableQuantity}kg có thể đặt trước`);
        return;
      }
      updateQuantity(item.id, next);
    }}
    disabled={item.availableQuantity > 0 && (item.quantity || 1) >= item.availableQuantity}
  >
    <Icon
      name="add"
      size={18}
      color={
        item.availableQuantity > 0 && (item.quantity || 1) >= item.availableQuantity
          ? "#aaa"
          : "#27ae60"
      }
    />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.deleteBtn}
    onPress={() => removeItem(item.id)}
  >
    <Icon name="trash-outline" size={22} color="#e74c3c" />
  </TouchableOpacity>
</View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GIỎ HÀNG ĐẶT TRƯỚC</Text>
          <View style={{ width: 28 }} />
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Icon name="cart-outline" size={90} color="#ccc" />
            <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            />

            {/* Footer tổng tiền */}
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng cộng ({cartItems.length} sản phẩm):</Text>
                <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={() =>
                  navigation.navigate("CheckoutPreOrder", {
                    cartItems,
                    totalPrice,
                  })
                }
              >
                <Text style={styles.checkoutText}>ĐẶT TRƯỚC NGAY</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#2e7d32",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 5,
    overflow: "hidden",
    minHeight: 140,
    alignItems: "center",
  },
  itemImage: { marginLeft: 8, width: 110, height: 110, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderTopRightRadius: 16 },
  itemDetails: { flex: 1, padding: 14,paddingBottom: 10, justifyContent: "space-between" },
  cropName: { fontSize: 17, fontWeight: "bold", color: "#2d3436" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  infoText: { fontSize: 13.5, color: "#555" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  price: { fontSize: 16, color: "#e67e22", fontWeight: "600" },
  totalItemPrice: { fontSize: 15, color: "#e74c3c", fontWeight: "bold" },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  quantity: { fontSize: 17, fontWeight: "bold", minWidth: 40, textAlign: "center" },
  deleteBtn: { marginLeft: "auto" },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalLabel: { fontSize: 18, fontWeight: "600", color: "#333" },
  totalPrice: { fontSize: 22, fontWeight: "bold", color: "#e74c3c" },
  checkoutBtn: {
    backgroundColor: "#27ae60",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  emptyCart: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#999", marginTop: 16 },
  qtyBtnDisabled: { backgroundColor: "#f0f0f0", opacity: 0.6, },
  quantityInput: {
    minWidth: 60,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginHorizontal: 10,
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "#fff",
  },
});

export default CartPreOrderScreen;