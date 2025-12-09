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
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setUnreadMessagesCount(0);
      return;
    }

    const uid = user.uid;

    const unsubscribe = firestore()
      .collection("chats")
      .where("participants", "array-contains", uid)
      .onSnapshot((snapshot) => {
        let totalUnread = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const unreadForMe = data.unreadCount?.[uid] || 0;
          totalUnread += unreadForMe;
        });

        setUnreadMessagesCount(totalUnread);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const user = auth().currentUser;
  if (!user) {
    setCartCount(0);
    return;
  }

  const cartItemsRef = firestore()
    .collection("users")
    .doc(user.uid)
    .collection("cartItems");

  const unsubscribe = cartItemsRef.onSnapshot(
    (snapshot) => {
      setCartCount(snapshot.size); // Siêu nhanh, siêu chính xác
    },
    (error) => {
      console.error("Lỗi listener giỏ hàng:", error);
      setCartCount(0);
    }
  );

  return () => unsubscribe();
}, []);

  

  const addToCart = async (product, autoSelect = false) => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    const discountedPrice = Math.round(product.price * (1 - (product.discount || 0) / 100));
    const imageToUse = product.imageBase64 || product.imageUrl;

    const cartItemRef = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("cartItems")
      .doc(product.id);

      try {
    const snapshot = await cartItemRef.get();

    const currentQty = snapshot.exists
      ? (snapshot.data()?.quantity || 0)
      : 0;

    const maxStock = parseInt(
      product.stock?.toString() ||
      product.quantityAvailable?.toString() ||
      "0"
    );

    if (maxStock <= 0) {
      Alert.alert("Thông báo", "Sản phẩm đã hết hàng!");
      return;
    }

    if (currentQty + 1 > maxStock) {
      Alert.alert(
        "Thông báo",
        `Chỉ còn ${maxStock} sản phẩm trong kho!`
      );
      return;
    }

    await cartItemRef.set(
      {
        name: product.name || "",
        price: discountedPrice,
        originalPrice: product.price,
        discount: product.discount || 0,
        imageBase64: product.imageBase64 || null,
        imageUrl: product.imageBase64 ? null : imageToUse,
        sellerId: product.sellerId || product.farmerId || "unknown",
        farmerName: product.farmerName || product.sellerName || "Nông dân",
        farmerAvatarUrl: product.farmerAvatarUrl || product.sellerAvatarUrl || null,

        quantity: currentQty + 1,

        addedAt: firestore.FieldValue.serverTimestamp(),
        selected: autoSelect ? true : false
      },
      { merge: true }
    );

    if (autoSelect) {
      navigation.navigate("Cart", {
        highlightProductId: product.id
      });
    }

  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error);
    Alert.alert("Lỗi", "Không thể thêm vào giỏ. Vui lòng thử lại.");
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

  useEffect(() => {
    let isMounted = true;
    const unsubscribeProducts = firestore()
      .collection("products")
      .where("available", "==", true)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          if (!isMounted) return;
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            avgRating: "5.0",
            reviewsCount: 0,
          }));
          setProducts(list);
          setLoading(false);
        },
        (err) => {
          console.error("Lỗi load realtime products:", err);
          if (isMounted) setLoading(false);
        }
    );

    const unsub = firestore()
      .collection("reviews")
      .onSnapshot((snapshot) => {
        if (!isMounted) return;
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified" || change.type === "removed") {
            const review = change.doc.data();
            const productId = review.productId;
            if (productId) {
              updateProductRating(productId);
            }
          }
        });
      });
    const updateProductRating = async (productId) => {
      try {
        const reviewsSnap = await firestore()
          .collection("reviews")
          .where("productId", "==", productId)
          .get();
        let total = 0;
        let count = reviewsSnap.size;
        reviewsSnap.forEach(doc => {
          total += doc.data().rating || 0;
        });
        const avg = count > 0 ? (total / count) : 5.0;
        if (isMounted) {
          setProducts(prev => prev.map(p =>
            p.id === productId
              ? { ...p, avgRating: avg.toFixed(1), reviewsCount: count }
              : p
          ));
        }
      } catch (err) {
        console.error("Lỗi cập nhật rating:", err);
      }
    };

    return () => {
      isMounted = false;
      unsub();
    };
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

  const getSeasonalSuggestion = () => {
    const month = new Date().getMonth() + 1;
    const suggestions = {
      1: "Tháng 1: Bơ Booth Đắk Lắk đang chín mọng, béo ngậy!",
      2: "Tháng 2: Dâu tây Đà Lạt vào chính vụ – đỏ mọng, ngọt lịm!",
      3: "Tháng 3: Rau cải ngọt, cải thìa Đà Lạt tươi xanh mơn mởn!",
      4: "Tháng 4: Thanh long ruột đỏ Bình Thuận ngọt như đường phèn!",
      5: "Tháng 5: Măng cụt Lái Thiêu cùi dày trắng ngần, ăn là ghiền!",
      6: "Tháng 6: Sầu riêng Ri6 cơm vàng hạt lép, thơm nồng nàn!",
      7: "Tháng 7: Bưởi da xanh Bến Tre múi mọng nước, ngọt thanh mát!",
      8: "Tháng 8: Hồng giòn Đà Lạt giòn tan từng miếng!",
      9: "Tháng 9: Na dai Lạng Sơn cùi dày, ngọt mát giải nhiệt!",
      10: "Tháng 10: Cam sành Hàm Yên chín vàng, thơm lừng cả vườn!",
      11: "Tháng 11: Dâu tây Đà Lạt đẹp như tranh, ngọt từng quả!",
      12: "Tháng 12: Hồng xiêm Xuân Đỉnh mềm tan, ngọt như mật!",
    };

    return suggestions[month] || "Hàng ngàn nông sản tươi ngon đang chờ bạn khám phá!";
  };

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
    const productImageUri = item.imageBase64 || item.imageUrl;
    const maxStock = parseInt(
      item.stock?.toString() ||
      item.quantityAvailable?.toString() ||
      "0"
    );

    const isOutOfStock = maxStock <= 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View style={styles.imageWrapper}>
            {isOutOfStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Hết hàng</Text>
              </View>
            )}

            <Image
              source={{ uri: productImageUri }}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.productName} numberOfLines={2}>
            {item.name || "Sản phẩm"}
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceWithIcon}>
              <Icon name="cash-outline" size={16} color="#27ae60" />
              <Text style={styles.discountedPrice}>
                {discount > 0
                  ? `${discountedPrice.toFixed(0)}đ`
                  : formatPrice(originalPrice)}
              </Text>
            </View>
            {discount > 0 && (
              <Text style={styles.originalPrice}>
                {formatPrice(originalPrice)}
              </Text>
            )}
          </View>

          {item.growingRegion ? (
            <View style={styles.growingRegionRow}>
              <Icon name="location-outline" size={14} color="#27ae60" />
              <Text style={styles.growingRegionText} numberOfLines={1}>
                {item.growingRegion}
              </Text>
            </View>
          ) : null}

          {item.season ? (
            <View style={styles.seasonRowInCard}>
              <Icon name="calendar-outline" size={14} color="#27ae60" />
              <Text style={styles.seasonTextInCard}>
                Mùa vụ: {item.season}
              </Text>
            </View>
          ) : null}

          <View style={styles.ratingRow}>
            <Icon name="star" size={14} color="#ffc107" />
            <Text style={styles.ratingText}>
              {item.avgRating || "5.0"}
            </Text>
            <Text style={styles.reviewCount}>
              ({item.reviewsCount || 0} đánh giá)
            </Text>
          </View>

          <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.buyNowButton,
              isOutOfStock && { backgroundColor: "#ccc" }
            ]}
            disabled={isOutOfStock}
            onPress={() => addToCart(item, true)}
          >
            <Text style={styles.buyNowText}>
              {isOutOfStock ? "Hết hàng" : "Mua ngay"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              isOutOfStock && { backgroundColor: "#aaa" }
            ]}
            disabled={isOutOfStock}
            onPress={() => addToCart(item)}
          >
            <Icon name="cart-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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

          {/* Chỉ còn giỏ hàng và chat */}
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

            {/* Badge số tin nhắn chưa đọc */}
            {unreadMessagesCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
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

            <View style={styles.seasonalTipContainer}>
              <Icon name="sparkles" size={22} color="#fff" />
              <Text style={styles.seasonalTipText}>
                {getSeasonalSuggestion()}
              </Text>
              <Icon name="leaf" size={22} color="#fff" />
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
  header: { backgroundColor: "#27ae60", paddingTop: 40, paddingHorizontal: 16, paddingBottom: 12 },
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
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    height: 320,
    flex: 1,
    justifyContent: "space-between",
  },
  productWrapper: { width: "48%", marginBottom: 16, justifyContent: "flex-start" },
  imageWrapper: { width: "100%", height: 100, borderRadius: 12, overflow: "hidden", marginBottom: 10, backgroundColor: "#f0f0f0" },
  productImage: { width: "100%", height: "100%" },
  productName: { fontSize: 15, fontWeight: "600", color: "#333", minHeight: 15, textAlign: "center", height: 44 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  discountedPrice: { fontSize: 16, fontWeight: "bold", color: "#27ae60" },
  originalPrice: { fontSize: 13, color: "#999", textDecorationLine: "line-through" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  singleStar: { marginRight: 2 },
  ratingText: { fontSize: 13, color: "#333", fontWeight: "600" },
  reviewCount: { fontSize: 12, color: "#777" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  addToCartButton: { backgroundColor: "#2e7d32", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  emptyBox: { padding: 20, alignItems: "center" },
  emptyText: { color: "#555" },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  locationButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#e8f5e9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  locationText: { fontSize: 13, color: "#2e7d32", fontWeight: "600" },
  growingRegionRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  growingRegionText: { fontSize: 13, color: "#27ae60", fontWeight: "600", flex: 1 },
  seasonRowInCard: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  seasonTextInCard: { fontSize: 13, color: "#27ae60", fontWeight: "600" },
  priceWithIcon: { flexDirection: "row", alignItems: "center", gap: 4 },
  seasonalTipContainer: {
    backgroundColor: "#27ae60",
    marginHorizontal: 16,
    marginVertical: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  seasonalTipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    letterSpacing: 0.4,
  },
  chatIconContainer: { 
    padding: 8, 
    borderRadius: 30, 
    position: "relative" 
  },
  chatBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#e74c3c",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  buyNowButton: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 90,
    alignItems: "center",
  },
  buyNowText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  outOfStockBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(255,0,0,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  outOfStockText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});