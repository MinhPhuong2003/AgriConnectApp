import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/Ionicons";

const PLACEHOLDER = "https://cdn-icons-png.flaticon.com/512/4202/4202843.png";

const CategoryProductsScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = firestore()
      .collection("products")
      .where("category", "==", category)
      .where("available", "==", true);

    const unsubscribe = q.onSnapshot(
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(list);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi khi tải sản phẩm:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [category]);

  const filteredProducts = products.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }) => {
    const discount = item.discount || 0;
    const originalPrice = item.price || 0;
    const discountedPrice = originalPrice * (1 - discount / 100);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <Image
          source={{ uri: item.imageUrl || PLACEHOLDER }}
          style={styles.productImage}
          resizeMode="cover"
        />

        <Text style={styles.productName} numberOfLines={2}>
          {item.name || "Sản phẩm"}
        </Text>

        <View style={styles.priceRow}>
          {discount > 0 ? (
            <>
              <Text style={styles.discountedPrice}>
                {discountedPrice.toFixed(0)}đ
              </Text>
              <Text style={styles.originalPrice}>{originalPrice}đ</Text>
            </>
          ) : (
            <Text style={styles.discountedPrice}>{originalPrice}đ</Text>
          )}
        </View>

        <View style={styles.ratingRow}>
          <Icon name="star" size={14} color="#ffc107" />
          <Text style={styles.ratingText}>
            {item.rating ? parseFloat(item.rating).toFixed(1) : "4.9"}
          </Text>
          <Text style={styles.reviewCount}>
            ({item.reviews || 1315} lượt bán)
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.preorderButton}
            onPress={() => alert(`Đặt trước ${item.name}`)}
          >
            <Icon name="time-outline" size={16} color="#ff9800" />
            <Text style={styles.preorderText}>Đặt trước</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => alert(`Thêm ${item.name} vào giỏ`)}
          >
            <Icon name="cart-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
  <View style={styles.container}>
    {loading ? (
      <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 40 }} />
    ) : filteredProducts.length === 0 ? (
      <>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category}</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Tìm trong ${category}...`}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate("Cart")}
          >
            <Icon name="cart-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.emptyText}>
          Không có sản phẩm nào trong danh mục này.
        </Text>
      </>
    ) : (
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 10 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{category}</Text>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Icon name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Tìm trong ${category}...`}
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => navigation.navigate("Cart")}
              >
                <Icon name="cart-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        }
      />
    )}
  </View>
);
};

export default CategoryProductsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2ecc71",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#2ecc71",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#333", marginLeft: 8 },
  cartButton: {
    marginLeft: 10,
    padding: 8,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    elevation: 3,
    marginBottom: 14,
  },
  productImage: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    minHeight: 38,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  discountedPrice: { color: "#e67e22", fontWeight: "bold", fontSize: 15 },
  originalPrice: {
    fontSize: 13,
    color: "#888",
    textDecorationLine: "line-through",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: { fontSize: 13, color: "#333", fontWeight: "600" },
  reviewCount: { fontSize: 12, color: "#777" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  preorderButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ffcc80",
    borderWidth: 1,
    backgroundColor: "#fff8e1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  preorderText: { color: "#ff9800", fontSize: 12, fontWeight: "600" },
  addToCartButton: {
    backgroundColor: "#2e7d32",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
    fontStyle: "italic",
  },
});
