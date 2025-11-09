import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const CartScreen = ({ navigation }) => {
  const [selectedAll, setSelectedAll] = useState(false);
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "Gạo ST25 Ông Cua - Điêu vọc thiên tài hi...",
      price: 150000,
      quantity: 1,
      selected: false,
      image: "https://via.placeholder.com/80",
    },
    {
      id: "2",
      name: "Sầu riêng",
      price: 155000,
      quantity: 1,
      selected: false,
      image: "https://via.placeholder.com/80",
    },
  ]);

  const [suggestions] = useState([
    {
      id: "s1",
      name: "Gạo ST25 thương hạng Via gạo",
      price: 169000,
      discount: 154000,
      rating: 4.9,
      reviews: 215,
      image: "https://via.placeholder.com/100",
    },
    {
      id: "s2",
      name: "Trái cây sấy khô thực dưỡng",
      price: 35000,
      rating: 4.8,
      reviews: 315,
      image: "https://via.placeholder.com/100",
    },
  ]);

  const totalItems = cartItems.filter((i) => i.selected).length;
  const totalPrice = cartItems
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const toggleSelectAll = () => {
    const newVal = !selectedAll;
    setSelectedAll(newVal);
    setCartItems(cartItems.map((i) => ({ ...i, selected: newVal })));
  };

  const toggleItem = (id) => {
    const newItems = cartItems.map((item) =>
      item.id === id ? { ...item, selected: !item.selected } : item
    );
    setCartItems(newItems);
    const allSelected = newItems.every((i) => i.selected);
    setSelectedAll(allSelected);
  };

  const updateQuantity = (id, delta) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  // ẨN TAB KHI VÀO GIỎ HÀNG
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: "none" },
    });
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity
        onPress={() => toggleItem(item.id)}
        style={styles.checkbox}
      >
        <Icon
          name={item.selected ? "checkbox" : "square-outline"}
          size={22}
          color={item.selected ? "#2e7d32" : "#ccc"}
        />
      </TouchableOpacity>

      <Image source={{ uri: item.image }} style={styles.itemImage} />

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemPrice}>
          {item.price.toLocaleString("vi-VN")}đ
        </Text>
      </View>

      <View style={styles.quantityControl}>
        <TouchableOpacity
          onPress={() => updateQuantity(item.id, -1)}
          style={styles.qtyBtn}
        >
          <Icon name="remove" size={16} color="#666" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          onPress={() => updateQuantity(item.id, 1)}
          style={styles.qtyBtn}
        >
          <Icon name="add" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity style={styles.suggestionCard}>
      <Image source={{ uri: item.image }} style={styles.suggestionImage} />
      <Text style={styles.suggestionName} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.suggestionPriceRow}>
        {item.discount ? (
          <>
            <Text style={styles.suggestionDiscountPrice}>
              {item.discount.toLocaleString("vi-VN")}đ
            </Text>
            <Text style={styles.suggestionOriginalPrice}>
              {item.price.toLocaleString("vi-VN")}đ
            </Text>
          </>
        ) : (
          <Text style={styles.suggestionPrice}>
            {item.price.toLocaleString("vi-VN")}đ
          </Text>
        )}
      </View>
      <View style={styles.suggestionRatingRow}>
        <Icon name="star" size={14} color="#ffc107" />
        <Text style={styles.suggestionRating}>
          {item.rating} ({item.reviews} đánh giá)
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Giỏ hàng ({totalItems})</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* NỘI DUNG CUỘN */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} // Đệm cho bottom bar
      >
        {/* DANH SÁCH SẢN PHẨM */}
        <View style={styles.cartList}>
          <FlatList
            data={cartItems}
            keyExtractor={(i) => i.id}
            renderItem={renderCartItem}
            scrollEnabled={false}
          />
        </View>

        {/* GỢI Ý */}
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
      </ScrollView>

      {/* FIXED BOTTOM BAR */}
      <View style={styles.fixedBottomBar}>
        <View style={styles.selectAllRow}>
          <TouchableOpacity
            onPress={toggleSelectAll}
            style={styles.selectAllCheckbox}
          >
            <Icon
              name={selectedAll ? "checkbox" : "square-outline"}
              size={22}
              color={selectedAll ? "#2e7d32" : "#ccc"}
            />
          </TouchableOpacity>
          <Text style={styles.selectAllText}>Chọn tất cả</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.totalPriceText}>
            Tổng: {totalPrice.toLocaleString("vi-VN")}đ
          </Text>
        </View>

        <TouchableOpacity style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;

// === STYLES ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 40,
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  checkbox: { marginRight: 12 },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
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
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  qtyText: {
    width: 32,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },

  // FIXED BOTTOM BAR
  fixedBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 10,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectAllCheckbox: { marginRight: 8 },
  selectAllText: { fontSize: 15, color: "#333" },
  totalPriceText: { fontSize: 16, fontWeight: "bold", color: "#e67e22" },

  checkoutBtn: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  suggestionSection: { marginTop: 20, paddingBottom: 20 },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  suggestionCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  suggestionImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 13,
    color: "#333",
    height: 36,
    marginBottom: 4,
  },
  suggestionPriceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  suggestionDiscountPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e67e22",
  },
  suggestionOriginalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e67e22",
  },
  suggestionRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  suggestionRating: { fontSize: 12, color: "#666" },
});