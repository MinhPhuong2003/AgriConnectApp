import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput 
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
const CartScreen = ({ navigation }) => {
  const [selectedAll, setSelectedAll] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [selectedMap, setSelectedMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [quantityInputs, setQuantityInputs] = useState({});

  const updateQuantityByInput = async (id, value) => {
    const user = auth().currentUser;
    if (!user) return;

    const cartRef = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .doc(id);

    if (!value || value === "") {
      await cartRef.update({ quantity: 1 });

      setQuantityInputs(prev => ({
        ...prev,
        [id]: "1",
      }));

      return;
    }

    const newQty = parseInt(value);

    if (isNaN(newQty) || newQty < 1) {
      await cartRef.update({ quantity: 1 });

      setQuantityInputs(prev => ({
        ...prev,
        [id]: "1",
      }));

      return;
    }

    try {
      const productRef = firestore().collection("products").doc(id);
      const productDoc = await productRef.get();

      const maxStock = parseInt(
        productDoc.data()?.stock?.toString() ||
        productDoc.data()?.quantityAvailable?.toString() ||
        "0"
      );

      if (newQty > maxStock) {
        Alert.alert(
          "Thông báo",
          `Không thể đặt thêm. Chỉ còn ${maxStock} sản phẩm trong kho.`
        );

        await cartRef.update({ quantity: maxStock });

        setQuantityInputs(prev => ({
          ...prev,
          [id]: maxStock.toString(),
        }));

        return;
      }

      await cartRef.update({ quantity: newQty });

      setQuantityInputs(prev => ({
        ...prev,
        [id]: newQty.toString(),
      }));
    } catch (err) {
      console.log("Lỗi nhập số lượng:", err);
    }
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const cartRef = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems");

    const unsubscribe = cartRef.onSnapshot(
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          selected: doc.data().selected || false,
        }));

        setCartItems(items);
        setLoading(false);

        const newMap = new Map();
        items.forEach((item) => newMap.set(item.id, item.selected));
        setSelectedMap(newMap);

        if (items.length > 0 && items.every(i => i.selected)) {
          setSelectedAll(true);
        } else {
          setSelectedAll(false);
        }
      },
      (err) => {
        console.error("Lỗi load giỏ hàng:", err);
        setCartItems([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const totalPrice = cartItems
    .filter((i) => selectedMap.get(i.id))
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const toggleSelectAll = async () => {
    const allSelected = cartItems.length > 0 && cartItems.every((i) => selectedMap.get(i.id));
    const newVal = !allSelected;

    const newMap = new Map();
    cartItems.forEach((item) => {
      newMap.set(item.id, newVal);
    });
    setSelectedMap(newMap);

    const user = auth().currentUser;
    if (user) {
      const cartRef = firestore().collection("carts").doc(user.uid);
      try {
        await firestore().runTransaction(async (transaction) => {
          const doc = await transaction.get(cartRef);
          if (doc.exists && doc.data()) {
            const items = (doc.data().items || []).map((item) => ({
              ...item,
              selected: newVal,
            }));
            transaction.set(cartRef, { items }, { merge: true });
          }
        });
      } catch (error) {
        console.error("Lỗi chọn tất cả:", error);
      }
    }
  };

  const toggleItem = async (id) => {
    const user = auth().currentUser;
    if (!user) return;

    const newSelected = !selectedMap.get(id);
    setSelectedMap(prev => new Map(prev).set(id, newSelected));

    await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .doc(id)
      .update({ selected: newSelected });
  };

  const updateQuantity = async (id, delta) => {
    const user = auth().currentUser;
    if (!user) return;

    const cartRef = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .doc(id);

    try {
      const cartDoc = await cartRef.get();
      if (!cartDoc.exists) return;

      const currentQty = cartDoc.data()?.quantity || 0;
      const newQty = currentQty + delta;

      if (newQty < 1) return;

      const productRef = firestore().collection("products").doc(id);
      const productDoc = await productRef.get();

      const maxStock = parseInt(
        productDoc.data()?.stock?.toString() ||
        productDoc.data()?.quantityAvailable?.toString() ||
        "0"
      );

      if (maxStock <= 0) {
        Alert.alert("Thông báo", "Sản phẩm đã hết hàng!");
        return;
      }

      if (newQty > maxStock) {
        Alert.alert(
          "Thông báo",
          `Chỉ còn ${maxStock} sản phẩm trong kho!`
        );
        return;
      }

      await cartRef.update({
        quantity: newQty
      });

    } catch (error) {
      console.log("Lỗi cập nhật số lượng:", error);
      Alert.alert("Lỗi", "Không thể cập nhật số lượng");
    }
  };


  const removeItemCompletely = async (id) => {
    const user = auth().currentUser;
    if (!user) return;

    await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .doc(id)
      .delete();
  };

  const removeFromCart = (id, name) => {
    Alert.alert(
      "Xóa sản phẩm",
      `Bạn có chắc muốn xóa "${name}" ra khỏi giỏ hàng?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => removeItemCompletely(id) },
      ]
    );
  };

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  const getImageUri = (item) => {
    if (item.imageBase64) {
      return { uri: item.imageBase64 };
    }
    if (item.imageUrl) {
      return { uri: item.imageUrl };
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkbox}>
        <Icon
          name={selectedMap.get(item.id) ? "checkbox" : "square-outline"}
          size={22}
          color={selectedMap.get(item.id) ? "#2e7d32" : "#ccc"}
        />
      </TouchableOpacity>

      <Image
        source={getImageUri(item)}
        style={styles.itemImage}
        
        resizeMode="cover"
      />

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price.toLocaleString("vi-VN")}đ</Text>
      </View>

      <View style={styles.quantityControl}>
        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
          <Icon name="remove" size={16} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.qtyInput}
          keyboardType="number-pad"
          value={
            quantityInputs[item.id] !== undefined
              ? quantityInputs[item.id]
              : item.quantity.toString()
          }
          onChangeText={(text) => {
            setQuantityInputs((prev) => ({
              ...prev,
              [item.id]: text,
            }));
          }}
          onBlur={() => {
            updateQuantityByInput(item.id, quantityInputs[item.id] ?? item.quantity.toString());
          }}
        />

        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
          <Icon name="add" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => removeFromCart(item.id, item.name)}
      >
        <Icon name="trash-outline" size={22} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Giỏ hàng</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 50 }} />
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="cart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          </View>
        ) : (
          <View style={styles.cartList}>
            <FlatList
              data={cartItems}
              keyExtractor={(i) => i.id}
              renderItem={renderCartItem}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.fixedBottomBar}>
          <View style={styles.selectAllRow}>
            <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllCheckbox}>
              <Icon
                name={cartItems.every((i) => selectedMap.get(i.id)) ? "checkbox" : "square-outline"}
                size={22}
                color={cartItems.every((i) => selectedMap.get(i.id)) ? "#2e7d32" : "#ccc"}
              />
            </TouchableOpacity>
            <Text style={styles.selectAllText}>Chọn tất cả</Text>
            <View style={{ flex: 1 }} />

            <View style={styles.totalContainer}>
              <Text style={styles.totalPriceText}>
                Tổng: {totalPrice.toLocaleString("vi-VN")}đ
              </Text>
              <Text style={styles.totalCountText}>
                {(() => {
                  const count = cartItems.filter((i) => selectedMap.get(i.id)).length;
                  return count > 0 ? `${count} sản phẩm` : "0 sản phẩm";
                })()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => {
              const selectedItems = cartItems.filter(i => selectedMap.get(i.id));
              if (selectedItems.length === 0) {
                Alert.alert("Thông báo", "Vui lòng chọn ít nhất 1 sản phẩm!");
                return;
              }
              navigation.navigate('Checkout', { 
                items: selectedItems,
                totalPrice,
              });
            }}
          >
            <Text style={styles.checkoutText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { 
    backgroundColor: "#2e7d32", 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    paddingTop: 40 
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cartList: { paddingHorizontal: 16, marginTop: 12 },
  cartItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 12, 
    elevation: 2,
  },
  checkbox: { marginRight: 12 },
  itemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#f0f0f0" },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, color: "#333", lineHeight: 20 },
  itemPrice: { fontSize: 15, fontWeight: "bold", color: "#e67e22", marginTop: 4 },
  quantityControl: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 8, 
    overflow: "hidden",
    marginRight: 10
  },
  qtyBtn: { width: 28, height: 28, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9" },
  qtyText: { 
  minWidth: 50,          
  paddingHorizontal: 6,  
  textAlign: "center", 
  fontSize: 16, 
  fontWeight: "600",
  color: "#333"
},
  deleteBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: "#999" },
  fixedBottomBar: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: "#fff", 
    borderTopWidth: 1, 
    borderTopColor: "#eee", 
    elevation: 10 
  },
  selectAllRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  selectAllCheckbox: { marginRight: 8 },
  selectAllText: { fontSize: 15, color: "#333" },
  totalContainer: { alignItems: "flex-end" },
  totalPriceText: { fontSize: 16, fontWeight: "bold", color: "#e67e22" },
  totalCountText: { fontSize: 14, color: "#2e7d32", fontWeight: "600", marginTop: 2 },
  checkoutBtn: { 
    marginHorizontal: 16, 
    marginVertical: 18, 
    backgroundColor: "#e74c3c", 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: "center" 
  },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});