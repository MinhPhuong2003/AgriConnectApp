import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedMap, setSelectedMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const user = auth().currentUser;

  useEffect(() => {
    if (!user) {
      navigation.replace("Login");
      return;
    }

    const unsubscribe = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .onSnapshot(async (snapshot) => {
        const items = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();
          let availableStock = 99999; // mặc định không giới hạn

          try {
            const productId = data.productId || doc.id;
            const productDoc = await firestore()
              .collection("products")
              .doc(productId)
              .get();

            if (productDoc.exists) {
              const p = productDoc.data();
              availableStock = parseInt(p.stock || p.quantityAvailable || 0) || 0;
            }
          } catch (e) {
            console.log("Lỗi lấy tồn kho sản phẩm:", e);
          }

          items.push({
            id: doc.id,
            ...data,
            availableStock: Math.max(0, availableStock),
            selected: data.selected ?? false,
          });
        }

        setCartItems(items);
        setLoading(false);

        // Cập nhật selectedMap
        const newMap = new Map();
        items.forEach((item) => newMap.set(item.id, item.selected));
        setSelectedMap(newMap);

        // Cập nhật trạng thái "Chọn tất cả"
        if (items.length > 0 && items.every((i) => i.selected)) {
          setSelectedAll(true);
        } else {
          setSelectedAll(false);
        }
      });

    return () => unsubscribe();
  }, [user, navigation]);

  // Tính tổng tiền các sản phẩm được chọn
  const totalPrice = cartItems
    .filter((i) => selectedMap.get(i.id))
    .reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  const [selectedAll, setSelectedAll] = useState(false);

  const toggleSelectAll = async () => {
    const newVal = !selectedAll;
    setSelectedAll(newVal);

    const newMap = new Map();
    cartItems.forEach((item) => newMap.set(item.id, newVal));
    setSelectedMap(newMap);

    // Cập nhật Firestore (tùy chọn, nếu bạn lưu selected ở backend)
    const batch = firestore().batch();
    cartItems.forEach((item) => {
      const ref = firestore()
        .collection("users")
        .doc(user.uid)
        .collection("cartItems")
        .doc(item.id);
      batch.update(ref, { selected: newVal });
    });
    await batch.commit();
  };

  const toggleItem = async (id) => {
    const newSelected = !selectedMap.get(id);
    setSelectedMap((prev) => new Map(prev).set(id, newSelected));

    await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .doc(id)
      .update({ selected: newSelected });
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const maxStock = item.availableStock || 99999;

    if (maxStock > 0 && newQuantity > maxStock) {
      if (!item._justLimited) {
        item._justLimited = true;
        Alert.alert(
          "Không thể đặt thêm",
          `Chỉ còn ${maxStock} sản phẩm trong kho.`,
          [{ text: "OK", onPress: () => (item._justLimited = false) }]
        );
      }
      newQuantity = maxStock;
    }

    await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .doc(itemId)
      .update({ quantity: newQuantity });
  };

  const increaseQty = (item) => {
    const nextQty = (item.quantity || 1) + 1;
    if (item.availableStock > 0 && nextQty > item.availableStock) {
      Alert.alert("Hết hàng", `Chỉ còn ${item.availableStock} sản phẩm trong kho`);
      return;
    }
    updateQuantity(item.id, nextQty);
  };

  const decreaseQty = (item) => {
    const nextQty = Math.max(1, (item.quantity || 1) - 1);
    updateQuantity(item.id, nextQty);
  };

  const removeFromCart = (id, name) => {
    Alert.alert(
      "Xóa sản phẩm",
      `Bạn có chắc muốn xóa "${name}" khỏi giỏ hàng?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () =>
            firestore()
              .collection("users")
              .doc(user.uid)
              .collection("cartItems")
              .doc(id)
              .delete(),
        },
      ]
    );
  };

  const getImageUri = (item) => {
    if (item.imageBase64) return { uri: item.imageBase64 };
    if (item.imageUrl) return { uri: item.imageUrl };
  };

  const renderCartItem = ({ item }) => (
  <View style={styles.cartItem}>
    {/* Checkbox chọn */}
    <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkbox}>
      <Icon
        name={selectedMap.get(item.id) ? "checkbox" : "square-outline"}
        size={26}
        color={selectedMap.get(item.id) ? "#27ae60" : "#ccc"}
      />
    </TouchableOpacity>

    {/* Ảnh sản phẩm */}
    <Image source={getImageUri(item)} style={styles.itemImage} resizeMode="cover" />

    {/* Thông tin: Tên, Giá, và Dòng dưới cùng */}
    <View style={styles.itemInfoContainer}>
      {/* Dòng 1: Tên sản phẩm */}
      <Text style={styles.itemName} numberOfLines={2}>
        {item.name || item.productName || "Sản phẩm"}
      </Text>

      {/* Dòng 2: Giá */}
      <Text style={styles.itemPrice}>
        {(item.price || 0).toLocaleString("vi-VN")}đ
      </Text>

      {/* Dòng 3: Số lượng + Xóa */}
      <View style={styles.bottomRow}>
        {/* Điều khiển số lượng */}
        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={() => decreaseQty(item)} style={styles.qtyBtn}>
            <Icon name="remove" size={20} color="#666" />
          </TouchableOpacity>

          <TextInput
            style={styles.qtyInput}
            keyboardType="number-pad"
            value={String(item.quantity || 1)}
            selectTextOnFocus={true}
            onChangeText={(text) => {
              let num = parseInt(text) || 1;
              if (num < 1) num = 1;
              updateQuantity(item.id, num);
            }}
          />

          <TouchableOpacity
            onPress={() => increaseQty(item)}
            style={[
              styles.qtyBtn,
              item.availableStock > 0 && (item.quantity || 1) >= item.availableStock && styles.qtyBtnDisabled,
            ]}
            disabled={item.availableStock > 0 && (item.quantity || 1) >= item.availableStock}
          >
            <Icon
              name="add"
              size={20}
              color={
                item.availableStock > 0 && (item.quantity || 1) >= item.availableStock
                  ? "#ccc"
                  : "#27ae60"
              }
            />
          </TouchableOpacity>
        </View>

        {/* Nút Xóa */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeFromCart(item.id, item.name || item.productName || "sản phẩm này")}
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
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={{ marginTop: 12, color: "#666" }}>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#27ae60" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Giỏ hàng</Text>
          <View style={{ width: 28 }} />
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="cart-outline" size={90} color="#ddd" />
            <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.selectAllRow}>
                <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllTouch}>
                  <Icon
                    name={selectedAll ? "checkbox" : "square-outline"}
                    size={24}
                    color={selectedAll ? "#27ae60" : "#ccc"}
                  />
                  <Text style={styles.selectAllText}>Chọn tất cả</Text>
                </TouchableOpacity>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                  <Text style={styles.totalPrice}>
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </Text>
                  <Text style={styles.totalCount}>
                    {cartItems.filter((i) => selectedMap.get(i.id)).length} sản phẩm
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkoutBtn,
                  cartItems.filter((i) => selectedMap.get(i.id)).length === 0 && styles.checkoutBtnDisabled,
                ]}
                disabled={cartItems.filter((i) => selectedMap.get(i.id)).length === 0}
                onPress={() => {
                  const selectedItems = cartItems.filter((i) => selectedMap.get(i.id));
                  if (selectedItems.length === 0) {
                    Alert.alert("Thông báo", "Vui lòng chọn ít nhất 1 sản phẩm!");
                    return;
                  }
                  navigation.navigate("Checkout", {
                    items: selectedItems,
                    totalPrice,
                  });
                }}
              >
                <Text style={styles.checkoutText}>Thanh toán ngay</Text>
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
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 4,
    alignItems: "center",
  },
  checkbox: { marginRight: 12 },
  itemImage: { width: 70, height: 70, borderRadius: 12 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: "600", color: "#2d3436" },
  itemPrice: { fontSize: 16, color: "#e67e22", fontWeight: "bold", marginTop: 4 },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  qtyBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  qtyBtnDisabled: {
    backgroundColor: "#f0f0f0",
    opacity: 0.6,
  },
  qtyInput: {
    width: 56,
    height: 36,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deleteBtn: { marginLeft: 12, padding: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { marginTop: 16, fontSize: 18, color: "#999" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
    elevation: 10,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  selectAllTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllText: { marginLeft: 8, fontSize: 15, color: "#333" },
  totalContainer: { flex: 1, alignItems: "flex-end" },
  totalLabel: { fontSize: 14, color: "#666" },
  totalPrice: { fontSize: 20, fontWeight: "bold", color: "#e74c3c" },
  totalCount: { fontSize: 13, color: "#27ae60", marginTop: 2 },
  checkoutBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutBtnDisabled: {
    backgroundColor: "#ccc",
  },
  checkoutText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  cartItem: {
  flexDirection: "row",
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  elevation: 4,
  alignItems: "flex-start", // Quan trọng: để nội dung căn đầu
},

itemInfoContainer: {
  flex: 1,
  marginLeft: 12,
  justifyContent: "space-between",
},

itemName: {
  fontSize: 16,
  fontWeight: "600",
  color: "#2d3436",
  lineHeight: 22,
},

itemPrice: {
  fontSize: 17,
  color: "#e67e22",
  fontWeight: "bold",
  marginTop: 4,
},

bottomRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 12,
},

quantityControl: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: "#fff",
},

qtyBtn: {
  width: 36,
  height: 36,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f8f8f8",
},

qtyBtnDisabled: {
  backgroundColor: "#f0f0f0",
  opacity: 0.6,
},

qtyInput: {
  width: 56,
  height: 36,
  textAlign: "center",
  fontSize: 16,
  fontWeight: "bold",
  color: "#333",
  backgroundColor: "#fff",
},

deleteButton: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  paddingVertical: 6,
},

deleteText: {
  color: "#e74c3c",
  fontWeight: "600",
  fontSize: 14,
  marginLeft: 4,
},
});

export default CartScreen;