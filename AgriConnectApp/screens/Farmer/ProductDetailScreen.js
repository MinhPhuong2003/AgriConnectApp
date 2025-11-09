// ProductDetailScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";

const PLACEHOLDER = "https://cdn-icons-png.flaticon.com/512/4202/4202843.png";

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params || {};

  // === CHI TIẾT SẢN PHẨM ===
  const [selectedWeight, setSelectedWeight] = useState("5kg");
  const weights = ["5kg", "7kg", "10kg"];
  const discount = product?.discount || 0;
  const originalPrice = product?.price || 0;
  const discountedPrice = originalPrice * (1 - discount / 100);
  const cartCount = 2;

  // === TÌM KIẾM ===
  const [searchQuery, setSearchQuery] = useState("");
  const [finalSearchQuery, setFinalSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const inputRef = useRef(null);

  // === DỮ LIỆU TỪ FIRESTORE ===
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // === LẤY SẢN PHẨM ===
  useEffect(() => {
    setLoading(true);
    const q = firestore()
      .collection("products")
      .where("available", "==", true);

    const unsub = q.onSnapshot(
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error("Lỗi tải sản phẩm:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // === LỌC SẢN PHẨM ===
  const filteredProducts = allProducts.filter((p) => {
    const name = (p.name || "").toLowerCase().trim();
    const q = finalSearchQuery.toLowerCase().trim();
    return q ? name.includes(q) : true;
  });

  // === XỬ LÝ TÌM KIẾM ===
  const enterSearchMode = () => {
    setIsSearchMode(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setFinalSearchQuery(trimmed);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFinalSearchQuery("");
    setIsSearchMode(false);
  };

  const handleBackToDetail = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    setFinalSearchQuery("");
  };

  // === DỮ LIỆU ĐÁNH GIÁ ===
  const reviews = [
    {
      id: "1",
      userName: "Thuy Linh",
      rating: 5,
      comment:
        "Gạo ST25 đặc sản Sóc Trăng. Sản phẩm này rất tốt, giá rẻ so với thị trường. Lần sau sẽ ủng hộ shop tiếp.",
      date: "20/07/2024",
      image: "https://via.placeholder.com/300x150.png?text=Gạo+ST25",
    },
    {
      id: "2",
      userName: "Tuấn Nguyễn",
      rating: 5,
      comment:
        "Gạo ST25 đặc sản Sóc Trăng. Sản phẩm này rất tốt, giá rẻ so với thị trường. Lần sau sẽ ủng hộ shop tiếp.",
      date: "20/07/2024",
      image: "https://via.placeholder.com/300x150.png?text=Gạo+ST25",
    },
  ];

  // === HEADER CHI TIẾT SẢN PHẨM ===
  const ListHeader = () => (
    <>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product?.imageUrl || PLACEHOLDER }}
          style={styles.productImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.discountedPrice}>
          {discountedPrice.toLocaleString("vi-VN")}đ
        </Text>
        {discount > 0 && (
          <>
            <Text style={styles.originalPrice}>
              {originalPrice.toLocaleString("vi-VN")}đ
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.productName} numberOfLines={2}>
        {product?.name || "Sản phẩm"}
      </Text>

      {/* === MÔ TẢ SẢN PHẨM - HIỂN THỊ ĐẦY ĐỦ === */}
      {product?.description ? (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.descriptionText}>
            {product.description}
          </Text>
        </View>
      ) : null}

      <View style={styles.ratingSection}>
        <View style={styles.ratingRow}>
          <Icon name="star" size={18} color="#ffc107" />
          <Text style={styles.avgRating}>
            {product?.avgRating
              ? parseFloat(product.avgRating).toFixed(1)
              : "4.9"}
          </Text>
          <Text style={styles.reviewCount}>
            ({product?.reviewsCount || 357} đánh giá)
          </Text>
        </View>
      </View>

      <View style={styles.optionSection}>
        <Text style={styles.optionTitle}>Cân nặng</Text>
        <View style={styles.weightOptions}>
          {weights.map((weight) => (
            <TouchableOpacity
              key={weight}
              style={[
                styles.weightButton,
                selectedWeight === weight && styles.weightButtonActive,
              ]}
              onPress={() => setSelectedWeight(weight)}
            >
              <Text
                style={[
                  styles.weightText,
                  selectedWeight === weight && styles.weightTextActive,
                ]}
              >
                {weight}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.reviewsTitleContainer}>
        <Text style={styles.reviewsTitle}>
          Đánh giá khách hàng ({reviews.length})
        </Text>
      </View>
    </>
  );

  const renderReview = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Icon
                key={i}
                name="star"
                size={14}
                color={i < item.rating ? "#ffc107" : "#ddd"}
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.reviewImage} />
      )}
      <Text style={styles.reviewDate}>{item.date}</Text>
    </View>
  );

  // === RENDER KẾT QUẢ TÌM KIẾM ===
  const renderResultItem = ({ item }) => {
    const disc = item.discount || 0;
    const price = item.price || 0;
    const discPrice = price * (1 - disc / 100);

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          navigation.push("ProductDetail", { product: item });
          handleBackToDetail();
        }}
      >
        <View style={styles.resultImgWrap}>
          <Image
            source={{ uri: item.imageUrl || PLACEHOLDER }}
            style={styles.resultImg}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.resultName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.resultPriceRow}>
          {disc > 0 ? (
            <>
              <Text style={styles.resultDiscPrice}>
                {discPrice.toFixed(0)}đ
              </Text>
              <Text style={styles.resultOrigPrice}>{price}đ</Text>
            </>
          ) : (
            <Text style={styles.resultDiscPrice}>{price}đ</Text>
          )}
        </View>
        <View style={styles.resultRatingRow}>
          <Icon name="star" size={13} color="#ffc107" />
          <Text style={styles.resultRating}>
            {item.avgRating ? parseFloat(item.avgRating).toFixed(1) : "0"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          {isSearchMode ? (
            <TouchableOpacity
              onPress={handleBackToDetail}
              style={styles.backButtonContainer}
            >
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonContainer}
            >
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.searchBox}
            activeOpacity={1}
            onPress={enterSearchMode}
          >
            <Icon name="search" size={20} color="#666" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              onFocus={enterSearchMode}
              returnKeyType="search"
            />
            {searchQuery && searchQuery !== finalSearchQuery && (
              <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 8 }}>
                <Icon name="arrow-forward-circle" size={22} color="#2e7d32" />
              </TouchableOpacity>
            )}
            {searchQuery && (
              <TouchableOpacity onPress={handleClearSearch} style={{ marginLeft: 8 }}>
                <Icon name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartIconContainer}
            onPress={() => navigation.navigate("Cart")}
          >
            <Icon name="cart-outline" size={30} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatIconContainer}
            onPress={() => navigation.navigate("Chat")}
          >
            <Icon name="chatbubble-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* NỘI DUNG */}
      {isSearchMode && !finalSearchQuery ? (
        <View style={styles.searchPlaceholder}>
          <Icon name="search" size={60} color="#ccc" />
          <Text style={styles.searchPlaceholderText}>
            Nhập từ khóa để tìm kiếm sản phẩm
          </Text>
        </View>
      ) : isSearchMode && finalSearchQuery ? (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#2e7d32" />
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="search-off" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                Không tìm thấy sản phẩm cho “{finalSearchQuery}”
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(i) => i.id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
              renderItem={renderResultItem}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* BOTTOM BAR - ẨN KHI TÌM KIẾM */}
      {!isSearchMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.shopBtn}>
            <Icon name="storefront-outline" size={22} color="#666" />
            <Text style={styles.shopText}>Cửa hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn}>
            <Icon name="chatbubble-outline" size={22} color="#666" />
            <Text style={styles.chatText}>Nhắn tin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addToCartBtn}>
            <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyNowBtn}>
            <Text style={styles.buyNowText}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProductDetailScreen;

// === STYLES ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2ecc71",
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backButtonContainer: { padding: 4, marginRight: 2, justifyContent: "center", alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
    marginLeft: 8,
    fontWeight: "500",
  },
  cartIconContainer: { padding: 8, position: "relative", borderRadius: 30 },
  cartBadge: {
    position: "absolute",
    right: 4,
    top: 4,
    backgroundColor: "red",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  chatIconContainer: { padding: 8, borderRadius: 30 },
  // CHI TIẾT
  imageContainer: { height: 300 },
  productImage: { width: "100%", height: "100%" },
  priceSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 12, gap: 10 },
  discountedPrice: { fontSize: 24, fontWeight: "bold", color: "#ee4d2d" },
  originalPrice: { fontSize: 16, color: "#999", textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#ee4d2d", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  productName: { fontSize: 18, color: "#333", paddingHorizontal: 16, marginTop: 8, lineHeight: 24 },
  // MÔ TẢ SẢN PHẨM - FULL NỘI DUNG
  descriptionContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    textAlign: "justify",
  },
  ratingSection: { paddingHorizontal: 16, marginTop: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avgRating: { fontSize: 16, fontWeight: "600", color: "#333" },
  reviewCount: { fontSize: 14, color: "#777" },
  optionSection: { paddingHorizontal: 16, marginTop: 20 },
  optionTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 10 },
  weightOptions: { flexDirection: "row", gap: 10 },
  weightButton: { borderWidth: 1, borderColor: "#ddd", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  weightButtonActive: { borderColor: "#ee4d2d", backgroundColor: "#fff5f5" },
  weightText: { fontSize: 14, color: "#555" },
  weightTextActive: { color: "#ee4d2d", fontWeight: "600" },
  reviewsTitleContainer: { paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  reviewsTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  reviewItem: { backgroundColor: "#f9f9f9", padding: 12, borderRadius: 12, marginBottom: 12, marginHorizontal: 16 },
  reviewHeader: { flexDirection: "row", gap: 10, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2e7d32", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "600", color: "#333" },
  reviewComment: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 8 },
  reviewImage: { width: "100%", height: 120, borderRadius: 8, marginBottom: 8 },
  reviewDate: { fontSize: 12, color: "#999" },
  // TÌM KIẾM
  searchPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  searchPlaceholderText: { marginTop: 16, fontSize: 16, color: "#999", textAlign: "center" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  emptyText: { marginTop: 16, fontSize: 16, color: "#999", textAlign: "center" },
  // KẾT QUẢ TÌM KIẾM
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    width: "48%",
    marginBottom: 12,
  },
  resultImgWrap: { width: "100%", height: 100, borderRadius: 12, overflow: "hidden", marginBottom: 8, backgroundColor: "#f0f0f0" },
  resultImg: { width: "100%", height: "100%" },
  resultName: { fontSize: 15, fontWeight: "600", color: "#333", minHeight: 40 },
  resultPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  resultDiscPrice: { fontSize: 15, fontWeight: "bold", color: "#e67e22" },
  resultOrigPrice: { fontSize: 13, color: "#999", textDecorationLine: "line-through" },
  resultRatingRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  resultRating: { fontSize: 13, color: "#333", fontWeight: "600" },
  // BOTTOM BAR
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  shopBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  shopText: { fontSize: 11, color: "#666" },
  chatBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  chatText: { fontSize: 11, color: "#666" },
  addToCartBtn: {
    flex: 2.3,
    height: 48,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#2ecc71",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    elevation: 4,
  },
  addToCartText: { color: "#2ecc71", fontWeight: "bold", fontSize: 15, textAlign: "center", lineHeight: 48, height: 48 },
  buyNowBtn: {
    flex: 2.3,
    height: 48,
    backgroundColor: "#2ecc71",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    elevation: 4,
  },
  buyNowText: { color: "#fff", fontWeight: "bold", fontSize: 15, textAlign: "center", lineHeight: 48, height: 48 },
});