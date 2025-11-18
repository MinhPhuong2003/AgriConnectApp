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
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const CartScreen = ({ navigation }) => {
  const [selectedAll, setSelectedAll] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [selectedMap, setSelectedMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const [suggestions] = useState([
    { id: "s1", name: "Gạo ST25 thương hạng Via gạo", price: 169000, rating: 4.9, reviews: 215, image: "https://via.placeholder.com/100" },
    { id: "s2", name: "Trái cây sấy khô thực dưỡng", price: 35000, rating: 4.8, reviews: 315, image: "https://via.placeholder.com/100" },
  ]);

  // === TẢI GIỎ HÀNG + selected TỪ FIRESTORE ===
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const cartRef = firestore().collection("carts").doc(user.uid);

    const unsubscribe = cartRef.onSnapshot(
      (doc) => {
        if (doc.exists && doc.data()) {
          const data = doc.data();
          const newItems = (data.items || []).map((item) => ({
            ...item,
            selected: !!item.selected,
          }));
          setCartItems(newItems);

          const newMap = new Map();
          newItems.forEach((item) => {
            newMap.set(item.id, item.selected);
          });
          setSelectedMap(newMap);
        } else {
          setCartItems([]);
          setSelectedMap(new Map());
        }
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi tải giỏ:", error);
        setCartItems([]);
        setSelectedMap(new Map());
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

  const toggleItem = (id) => {
    const newSelected = !selectedMap.get(id);
    setSelectedMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, newSelected);
      return newMap;
    });
    updateSelectedInFirestore(id, newSelected);
  };

  const updateSelectedInFirestore = async (id, selected) => {
    const user = auth().currentUser;
    if (!user) return;

    const cartRef = firestore().collection("carts").doc(user.uid);
    try {
      await firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(cartRef);
        if (!doc.exists || !doc.data()) return;

        const items = doc.data().items || [];
        const index = items.findIndex((i) => i.id === id);
        if (index >= 0) {
          items[index].selected = selected;
          transaction.set(cartRef, { items }, { merge: true });
        }
      });
    } catch (error) {
      console.error("Lỗi cập nhật selected:", error);
    }
  };

  const updateQuantity = async (id, delta) => {
    const user = auth().currentUser;
    if (!user) return;

    const cartRef = firestore().collection("carts").doc(user.uid);

    try {
      await firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(cartRef);
        if (!doc.exists || !doc.data()) return;

        let items = doc.data().items || [];
        const index = items.findIndex((i) => i.id === id);

        if (index >= 0) {
          const newQty = items[index].quantity + delta;
          if (newQty <= 0) {
            items[index].selected = false;
            items.splice(index, 1);
          } else {
            items[index].quantity = newQty;
            items[index].selected = selectedMap.get(id) || false;
          }
          transaction.set(cartRef, { items }, { merge: true });
        }
      });
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
    }
  };

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkbox}>
        <Icon
          name={selectedMap.get(item.id) ? "checkbox" : "square-outline"}
          size={22}
          color={selectedMap.get(item.id) ? "#2e7d32" : "#ccc"}
        />
      </TouchableOpacity>

      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price.toLocaleString("vi-VN")}đ</Text>
      </View>

      <View style={styles.quantityControl}>
        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
          <Icon name="remove" size={16} color="#666" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
          <Icon name="add" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity style={styles.suggestionCard}>
      <Image source={{ uri: item.image }} style={styles.suggestionImage} />
      <Text style={styles.suggestionName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.suggestionPriceRow}>
        {item.discount ? (
          <>
            <Text style={styles.suggestionDiscountPrice}>{item.discount.toLocaleString("vi-VN")}đ</Text>
            <Text style={styles.suggestionOriginalPrice}>{item.price.toLocaleString("vi-VN")}đ</Text>
          </>
        ) : (
          <Text style={styles.suggestionPrice}>{item.price.toLocaleString("vi-VN")}đ</Text>
        )}
      </View>
      <View style={styles.suggestionRatingRow}>
        <Icon name="star" size={14} color="#ffc107" />
        <Text style={styles.suggestionRating}>{item.rating} ({item.reviews} đánh giá)</Text>
      </View>
    </TouchableOpacity>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 50 }} />
        ) : cartItems.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 80 }}>
            <Icon name="cart-outline" size={80} color="#ccc" />
            <Text style={{ marginTop: 16, fontSize: 16, color: "#999" }}>Giỏ hàng trống</Text>
          </View>
        ) : (
          <>
            <View style={styles.cartList}>
              <FlatList data={cartItems} keyExtractor={(i) => i.id} renderItem={renderCartItem} scrollEnabled={false} />
            </View>

            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionTitle}>Có thể bạn sẽ thích</Text>
              <FlatList
                data={suggestions}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(i) => i.id}
                renderItem={renderSuggestion}
                contentContainerStyle={{ paddingLeft: 16 }}
              />
            </View>
          </>
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
                alert("Vui lòng chọn ít nhất 1 sản phẩm!");
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
  header: { backgroundColor: "#2e7d32", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: 40 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cartList: { paddingHorizontal: 16, marginTop: 12 },
  cartItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 12, elevation: 2 },
  checkbox: { marginRight: 12 },
  itemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#f0f0f0" },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, color: "#333", lineHeight: 20 },
  itemPrice: { fontSize: 15, fontWeight: "bold", color: "#e67e22", marginTop: 4 },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, overflow: "hidden" },
  qtyBtn: { width: 28, height: 28, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9" },
  qtyText: { width: 32, textAlign: "center", fontSize: 14, fontWeight: "600" },
  fixedBottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee", elevation: 10 },
  selectAllRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  selectAllCheckbox: { marginRight: 8 },
  selectAllText: { fontSize: 15, color: "#333" },
  totalPriceText: { fontSize: 16, fontWeight: "bold", color: "#e67e22" },
  checkoutBtn: { marginBottom: 20, marginHorizontal: 16, marginVertical: 12, backgroundColor: "#e74c3c", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  suggestionSection: { marginTop: 20, paddingBottom: 20 },
  suggestionTitle: { fontSize: 16, fontWeight: "bold", paddingHorizontal: 16, marginBottom: 12 },
  suggestionCard: { width: 140, backgroundColor: "#fff", borderRadius: 12, padding: 10, marginRight: 12, elevation: 2 },
  suggestionImage: { width: "100%", height: 90, borderRadius: 8, backgroundColor: "#f0f0f0", marginBottom: 8 },
  suggestionName: { fontSize: 13, color: "#333", height: 36, marginBottom: 4 },
  suggestionPriceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  suggestionDiscountPrice: { fontSize: 14, fontWeight: "bold", color: "#e67e22" },
  suggestionOriginalPrice: { fontSize: 12, color: "#999", textDecorationLine: "line-through" },
  suggestionPrice: { fontSize: 14, fontWeight: "bold", color: "#e67e22" },
  suggestionRatingRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  suggestionRating: { fontSize: 12, color: "#666" },
  totalContainer: {
    alignItems: "flex-end",
  },
  totalCountText: {
    fontSize: 14,
    color: "#2e7d32",
    fontWeight: "600",
    marginTop: 2,
  },
});