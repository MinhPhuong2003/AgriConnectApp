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

  const [preorderSuccessModal, setPreorderSuccessModal] = useState(false);
  const [currentPreorderProduct, setCurrentPreorderProduct] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const getEstimatedHarvest = (season) => {
    const now = new Date();
    const year = now.getFullYear();

    const harvestMap = {
      "Xuân": `Tháng 2 - 4/${year}`,
      "Hạ": `Tháng 5 - 7/${year}`,
      "Thu": `Tháng 8 - 10/${year}`,
      "Đông": `Tháng 11/${year} - 1/${year + 1}`,
    };

    return harvestMap[season] || "Sắp có hàng";
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

  const addToPreorder = async (product) => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để đặt trước sản phẩm!");
      return;
    }
    const cartRef = firestore().collection("carts").doc(user.uid);
    try {
      let finalQuantity = 1;
      await firestore().runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        let preorders = [];
        if (cartDoc.exists && cartDoc.data()?.preorders) {
          preorders = cartDoc.data().preorders || [];
          const existingIndex = preorders.findIndex(item => item.id === product.id);
          if (existingIndex !== -1) {
            preorders[existingIndex].quantity += 1;
            finalQuantity = preorders[existingIndex].quantity;
            transaction.update(cartRef, { preorders });
            return;
          }
        }
        const preorderItem = {
          id: product.id,
          name: product.name,
          price: Math.round(product.price * (1 - (product.discount || 0) / 100)),
          originalPrice: product.price,
          discount: product.discount || 0,
          imageUrl: product.imageUrl || PLACEHOLDER,
          season: product.season || "Chưa xác định",
          quantity: 1,
          addedAt: new Date().toISOString(),
          estimatedHarvest: getEstimatedHarvest(product.season),
        };

        preorders.push(preorderItem);
        transaction.set(cartRef, { preorders }, { merge: true });
        finalQuantity = 1;
      });

      setCurrentPreorderProduct({
        ...product,
        quantity: finalQuantity,
      });
      setPreorderSuccessModal(true);

    } catch (error) {
      console.error("Lỗi đặt trước:", error);
      Alert.alert("Lỗi", "Không thể đặt trước. Vui lòng thử lại!");
    }
  };

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

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <View style={{ flex: 1, justifyContent: "space-between" }}>
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
              onPress={() => addToPreorder(item)}
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER – ĐÃ BỎ ICON ĐẶT TRƯỚC */}
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
          </TouchableOpacity>
        </View>
      </View>

      {/* PHẦN CÒN LẠI GIỮ NGUYÊN */}
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* ... toàn bộ phần dưới giữ nguyên như cũ ... */}
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
      {/* Modal Đặt trước thành công - XỊN SÒ */}
      <Modal
        transparent
        visible={preorderSuccessModal}
        animationType="none"
        onRequestClose={() => setPreorderSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.successModalContainer,
            {
              transform: [
                {
                  scale: preorderSuccessModal ? 1 : 0.8,
                },
              ],
              opacity: preorderSuccessModal ? 1 : 0,
            }
          ]}>
            {/* Icon tick xanh */}
            <View style={styles.successIcon}>
              <Icon name="checkmark-circle" size={60} color="#27ae60" />
            </View>

            <Text style={styles.successTitle}>
              Đặt trước thành công!
            </Text>

            {currentPreorderProduct && (
              <View style={styles.successProductInfo}>
                <Image
                  source={{ uri: currentPreorderProduct.imageUrl || PLACEHOLDER }}
                  style={styles.successProductImage}
                />
                <View style={styles.successProductDetails}>
                  <Text style={styles.successProductName} numberOfLines={2}>
                    {currentPreorderProduct.name}
                  </Text>
                  {currentPreorderProduct.season && (
                    <Text style={styles.successSeasonText}>
                      Mùa: {currentPreorderProduct.season}
                    </Text>
                  )}
                  <Text style={styles.successHarvestText}>
                    Dự kiến thu hoạch: {currentPreorderProduct.estimatedHarvest || getEstimatedHarvest(currentPreorderProduct.season)}
                  </Text>
                  <Text style={styles.successQuantityText}>
                    Số lượng: {currentPreorderProduct.quantity} kg
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.successButtons}>
              <TouchableOpacity
                style={styles.successCloseButton}
                onPress={() => setPreorderSuccessModal(false)}
              >
                <Text style={styles.successCloseText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successViewButton}
                onPress={() => {
                  setPreorderSuccessModal(false);
                  navigation.navigate("Preorder");
                }}
              >
                <Text style={styles.successViewText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // ... toàn bộ styles còn lại giữ nguyên như trước ...
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
  preorderButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff8e1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ffcc80", gap: 6 },
  preorderText: { fontSize: 13, color: "#ff9800", fontWeight: "600" },
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
  // Modal đặt trước thành công - đẹp lung linh
successModalContainer: {
  backgroundColor: "#fff",
  marginHorizontal: 30,
  borderRadius: 20,
  padding: 20,
  alignItems: "center",
  elevation: 10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.3,
  shadowRadius: 10,
},
successIcon: {
  marginBottom: 10,
},
successTitle: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#27ae60",
  marginBottom: 16,
},
successProductInfo: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 20,
  width: "100%",
},
successProductImage: {
  width: 80,
  height: 80,
  borderRadius: 12,
  marginRight: 12,
},
successProductDetails: {
  flex: 1,
},
successProductName: {
  fontSize: 16,
  fontWeight: "600",
  color: "#333",
},
successSeasonText: {
  fontSize: 14,
  color: "#27ae60",
  marginTop: 4,
},
successHarvestText: {
  fontSize: 13,
  color: "#666",
  marginTop: 4,
  fontStyle: "italic",
},
successQuantityText: {
  fontSize: 14,
  color: "#e67e22",
  fontWeight: "bold",
  marginTop: 6,
},
successButtons: {
  flexDirection: "row",
  gap: 12,
  marginTop: 10,
},
successCloseButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 12,
  backgroundColor: "#f0f0f0",
  alignItems: "center",
},
successCloseText: {
  fontSize: 16,
  color: "#666",
  fontWeight: "600",
},
successViewButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 12,
  backgroundColor: "#27ae60",
  alignItems: "center",
},
successViewText: {
  fontSize: 16,
  color: "#fff",
  fontWeight: "bold",
},
});