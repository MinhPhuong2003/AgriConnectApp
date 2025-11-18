import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const PLACEHOLDER = "https://cdn-icons-png.flaticon.com/512/4202/4202843.png";

const HomeBuyer = ({ route, navigation }) => {
  const { searchQuery: initialSearchQuery } = route.params || {};
  const [products, setProducts] = useState([]);
  const [inputQuery, setInputQuery] = useState(initialSearchQuery || "");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "");
  const [selectedSeason, setSelectedSeason] = useState("Tất cả mùa");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState("Buyer");
  const [isCategoryFilterMode, setIsCategoryFilterMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(!!initialSearchQuery);
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setCartCount(0);
      return;
    }

    const cartRef = firestore().collection("carts").doc(user.uid);

    const unsubscribe = cartRef.onSnapshot(
      (doc) => {
        if (doc.exists && doc.data()) {
          const items = doc.data().items || [];
          const uniqueProductCount = items.filter(item => item && item.id).length;
          setCartCount(uniqueProductCount);
        } else {
          setCartCount(0);
        }
      },
      (error) => {
        console.error("Lỗi theo dõi giỏ:", error);
        setCartCount(0);
      }
    );

    return () => unsubscribe();
  }, []);

  // === THÊM VÀO GIỎ HÀNG (AN TOÀN) ===
  const addToCart = async (product) => {
    const user = auth().currentUser;
    if (!user) {
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    const cartRef = firestore().collection("carts").doc(user.uid);

    try {
      await firestore().runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        let cartItems = [];

        if (cartDoc.exists && cartDoc.data()) {
          cartItems = cartDoc.data().items || [];
        }

        const existingIndex = cartItems.findIndex((item) => item.id === product.id);

        if (existingIndex >= 0) {
          cartItems[existingIndex].quantity += 1;
        } else {
          cartItems.push({
            id: product.id,
            name: product.name,
            price: Math.round(product.price * (1 - (product.discount || 0) / 100)),
            originalPrice: product.price,
            discount: product.discount || 0,
            imageUrl: product.imageUrl || PLACEHOLDER,
            quantity: 1,
          });
        }

        transaction.set(cartRef, { items: cartItems }, { merge: true });
      });
    } catch (error) {
      console.error("Lỗi thêm vào giỏ:", error);
      alert("Không thể thêm vào giỏ. Vui lòng thử lại.");
    }
  };

  // === VÀO CHẾ ĐỘ TÌM KIẾM ===
  const enterSearchMode = () => {
    setIsSearchMode(true);
    setIsCategoryFilterMode(false);
    setSelectedCategory("");
    setSelectedSeason("Tất cả mùa");
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // === LẤY TÊN USER ===
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      const uid = currentUser.uid;
      firestore()
        .collection("users")
        .doc(uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            setUserName(doc.data().name || "Buyer");
          }
        })
        .catch((err) => console.log("Lỗi lấy tên:", err));
    }
  }, []);

  // === LẤY SẢN PHẨM ===
  useEffect(() => {
    const q = firestore().collection("products").where("available", "==", true);
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
        console.error("Lỗi tải sản phẩm:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // === XỬ LÝ TÌM KIẾM ===
  const handleSearch = () => {
    const trimmed = inputQuery.trim();
    setSearchQuery(trimmed);
    setIsSearchMode(!!trimmed);
    if (trimmed) {
      setIsCategoryFilterMode(false);
      setSelectedCategory("");
      setSelectedSeason("Tất cả mùa");
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSearchClear = () => {
    setInputQuery("");
    setSearchQuery("");
    setIsSearchMode(false);
  };

  const handleBackToHome = () => {
    setIsCategoryFilterMode(false);
    setIsSearchMode(false);
    setSelectedCategory("");
    setSearchQuery("");
    setInputQuery("");
    setSelectedSeason("Tất cả mùa");
  };

  // === DANH MỤC & MÙA ===
  const categories = [
    { id: "1", name: "Rau củ", icon: "leaf-outline", key: "Rau củ" },
    { id: "2", name: "Trái cây", icon: "nutrition-outline", key: "Trái cây" },
    { id: "3", name: "Hạt giống", icon: "rose-outline", key: "Hạt giống" },
    { id: "4", name: "Nông sản khô", icon: "cube-outline", key: "Nông sản khô" },
  ];

  const seasons = ["Tất cả mùa", "Xuân", "Hạ", "Thu", "Đông"];

  const handleCategoryPress = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setInputQuery("");
    setSearchQuery("");
    setSelectedSeason("Tất cả mùa");
    setIsCategoryFilterMode(true);
    setIsSearchMode(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // === LỌC SẢN PHẨM ===
  const filteredProducts = products.filter((item) => {
    const name = (item.name || "").toLowerCase().trim();
    const itemCategory = (item.category || "").toLowerCase().trim();
    const query = searchQuery.toLowerCase().trim();
    const selectedCat = selectedCategory.toLowerCase().trim();
    const matchesQuery = query ? name.includes(query) : true;
    const matchesCategory = selectedCat ? itemCategory === selectedCat : true;
    const matchesSeason = selectedSeason === "Tất cả mùa" ? true : item.season === selectedSeason;
    return matchesQuery && matchesCategory && matchesSeason;
  });

  const renderProduct = ({ item }) => {
    const discount = item.discount || 0;
    const originalPrice = item.price || 0;
    const discountedPrice = originalPrice * (1 - discount / 100);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.imageUrl || PLACEHOLDER }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {item.name || "Sản phẩm"}
        </Text>

        <View style={styles.priceRow}>
          {discount > 0 ? (
            <>
              <Text style={styles.discountedPrice}>
                {discountedPrice.toFixed(0)}đ
              </Text>
              <Text style={styles.originalPrice}>{formatPrice(originalPrice)}</Text>
            </>
          ) : (
            <Text style={styles.discountedPrice}>{formatPrice(originalPrice)}</Text>
          )}
        </View>

        <View style={styles.ratingRow}>
          <Icon name="star" size={14} color="#ffc107" style={styles.singleStar} />
          <Text style={styles.ratingText}>
            {item.avgRating ? parseFloat(item.avgRating).toFixed(1) : ""}
          </Text>
          <Text style={styles.reviewCount}>
            ({item.reviewsCount || 0} đánh giá)
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
            onPress={() => addToCart(item)}
          >
            <Icon name="cart-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          {(isCategoryFilterMode || isSearchMode) && (
            <TouchableOpacity
              onPress={handleBackToHome}
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
              value={inputQuery}
              onChangeText={setInputQuery}
              onSubmitEditing={handleSearch}
              onFocus={() => !isSearchMode && enterSearchMode()}
              returnKeyType="search"
            />
            {inputQuery && inputQuery !== searchQuery && (
              <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 8 }}>
                <Icon name="arrow-forward-circle" size={22} color="#2e7d32" />
              </TouchableOpacity>
            )}
            {searchQuery && (
              <TouchableOpacity onPress={handleSearchClear} style={{ marginLeft: 8 }}>
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

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* === TRANG CHỦ === */}
        {!(isSearchMode || isCategoryFilterMode) && (
          <>
            <View style={styles.bannerWrapper}>
              <TouchableOpacity
                style={styles.bannerContainer}
                activeOpacity={0.9}
                onPress={() => navigation.navigate("Promotions")}
              >
                <Image
                  source={{
                    uri: "https://img.freepik.com/free-vector/organic-farming-banner-template_23-2149372809.jpg?w=2000",
                  }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>Ưu đãi mùa thu!</Text>
                  <Text style={styles.bannerSubtitle}>Giảm tới 30% rau củ tươi</Text>
                  <View style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>Mua ngay</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => navigation.navigate("PickupLocation")}
                >
                  <Icon name="location-outline" size={16} color="#2e7d32" />
                  <Text style={styles.locationText}>TP. HCM và lân cận</Text>
                  <Icon name="chevron-forward" size={16} color="#2e7d32" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      selectedCategory === item.key && styles.categoryItemActive,
                    ]}
                    onPress={() => handleCategoryPress(item.key)}
                  >
                    <View style={styles.categoryIconCircle}>
                      <Icon name={item.icon} size={24} color="#2e7d32" />
                    </View>
                    <Text style={styles.categoryText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              />
            </View>

            <View style={styles.seasonRow}>
              <Text style={styles.sectionTitle}>Sản phẩm theo mùa</Text>
              <TouchableOpacity
                style={styles.seasonButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.seasonText}>{selectedSeason}</Text>
                <Icon name="chevron-down" size={16} color="#2e7d32" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            <Modal transparent visible={isModalVisible} animationType="fade">
              <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                <View style={styles.modalBox}>
                  {seasons.map((season) => (
                    <TouchableOpacity
                      key={season}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedSeason(season);
                        setModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalText,
                          selectedSeason === season && { fontWeight: "bold", color: "#2e7d32" },
                        ]}
                      >
                        {season}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </>
        )}

        {/* === TAB DANH MỤC KHI LỌC === */}
        {isCategoryFilterMode && !isSearchMode && (
          <View style={styles.categorySection}>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory === item.key && styles.categoryItemActive,
                  ]}
                  onPress={() => handleCategoryPress(item.key)}
                >
                  <View style={styles.categoryIconCircle}>
                    <Icon name={item.icon} size={24} color="#2e7d32" />
                  </View>
                  <Text style={styles.categoryText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            />
          </View>
        )}

        {/* === DANH SÁCH SẢN PHẨM === */}
        {!isSearchMode || searchQuery ? (
          loading ? (
            <View style={{ marginTop: 30, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#2e7d32" />
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {isSearchMode
                  ? `Không tìm thấy sản phẩm cho "${searchQuery}"`
                  : "Không có sản phẩm phù hợp."}
              </Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {filteredProducts.map((item) => (
                <View key={item.id} style={styles.productWrapper}>
                  {renderProduct({ item })}
                </View>
              ))}
            </View>
          )
        ) : (
          <View style={{ height: 300, justifyContent: "center", alignItems: "center" }}>
            <Icon name="search" size={60} color="#ccc" />
            <Text style={{ marginTop: 16, fontSize: 16, color: "#999" }}>
              Nhập từ khóa để tìm kiếm sản phẩm
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeBuyer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2ecc71", paddingTop: 40, paddingHorizontal: 16, paddingBottom: 12 },
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
  searchInput: { flex: 1, fontSize: 16, color: "#333", paddingVertical: 0, marginLeft: 8, fontWeight: "500" },
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
  bannerWrapper: { marginTop: 0, marginBottom: 16, marginHorizontal: -16, paddingHorizontal: 0 },
  bannerContainer: { height: 160, borderRadius: 0, overflow: "hidden", elevation: 6 },
  bannerImage: { width: "100%", height: "100%" },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", paddingHorizontal: 20 },
  bannerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  bannerSubtitle: { color: "#fff", fontSize: 15, marginTop: 6, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  bannerButton: { marginTop: 12, backgroundColor: "#e67e22", alignSelf: "flex-start", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 25, elevation: 3 },
  bannerButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  categorySection: { marginBottom: 8, paddingHorizontal: 16 },
  categoryItem: { width: 70, alignItems: "center", justifyContent: "center", marginHorizontal: 2, paddingHorizontal: 4 },
  categoryItemActive: { backgroundColor: "#e8f5e9", borderRadius: 12, paddingHorizontal: 8 },
  categoryIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#e8f5e9", justifyContent: "center", alignItems: "center", marginBottom: 6, marginTop: 6 },
  categoryText: { fontSize: 12, color: "#333", fontWeight: "600", textAlign: "center", height: 32, lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  seasonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 16 },
  seasonButton: { backgroundColor: "#e8f5e9", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, flexDirection: "row", alignItems: "center" },
  seasonText: { color: "#2e7d32", fontWeight: "600", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "80%" },
  modalItem: { paddingVertical: 10 },
  modalText: { fontSize: 16, textAlign: "center" },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 16 },
  productWrapper: { width: "48%", marginBottom: 12 },
  productCard: { backgroundColor: "#fff", borderRadius: 16, padding: 12, elevation: 3 },
  imageWrapper: { width: "100%", height: 100, borderRadius: 12, overflow: "hidden", marginBottom: 10, backgroundColor: "#f0f0f0" },
  productImage: { width: "100%", height: "100%" },
  productName: { fontSize: 15, fontWeight: "600", color: "#333", minHeight: 40, textAlign: "left" },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  discountedPrice: { fontSize: 16, fontWeight: "bold", color: "#e67e22" },
  originalPrice: { fontSize: 13, color: "#999", textDecorationLine: "line-through" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  singleStar: { marginRight: 2 },
  ratingText: { fontSize: 13, color: "#333", fontWeight: "600" },
  reviewCount: { fontSize: 12, color: "#777" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  preorderButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff8e1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ffcc80", gap: 6 },
  preorderText: { fontSize: 13, color: "#ff9800", fontWeight: "600" },
  addToCartButton: { backgroundColor: "#2e7d32", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  emptyBox: { padding: 20, alignItems: "center" },
  emptyText: { color: "#555" },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  locationButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#e8f5e9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  locationText: { fontSize: 13, color: "#2e7d32", fontWeight: "600" },
});