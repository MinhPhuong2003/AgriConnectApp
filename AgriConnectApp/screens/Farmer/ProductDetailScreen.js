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
import auth from "@react-native-firebase/auth";

const PLACEHOLDER = "https://cdn-icons-png.flaticon.com/512/4202/4202843.png";

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params || {};
  const discount = product?.discount || 0;
  const originalPrice = product?.price || 0;
  const discountedPrice = originalPrice * (1 - discount / 100);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [finalSearchQuery, setFinalSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const inputRef = useRef(null);
  const [allProducts, setAllProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [avgRating, setAvgRating] = useState(5.0);
  const [totalReviews, setTotalReviews] = useState(0);

  const formatReviewTime = (date) => {
    if (!date || !(date instanceof Date)) return "Vừa xong";
    const day   = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year  = date.getFullYear();
    const hours   = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  };

  const getOrCreateChat = async (buyerId, sellerId, product) => {
    const chatsRef = firestore().collection("chats");
    const query1 = chatsRef.where("participants", "==", [buyerId, sellerId]);
    const query2 = chatsRef.where("participants", "==", [sellerId, buyerId]);
    const [snap1, snap2] = await Promise.all([query1.get(), query2.get()]);
    const existingChat = [...snap1.docs, ...snap2.docs][0];
    if (existingChat) {
      return existingChat.id;
    }
    const newChatRef = chatsRef.doc();
    await newChatRef.set({
      participants: [buyerId, sellerId],
      lastMessage: `Tôi quan tâm sản phẩm: ${product.name}`,
      lastSenderId: buyerId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return newChatRef.id;
  };

  // === GIỎ HÀNG ===
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const cartRef = firestore().collection("carts").doc(user.uid);
    const unsubscribe = cartRef.onSnapshot((doc) => {
      if (doc.exists && doc.data()) {
        const items = doc.data().items || [];
        const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // === TẤT CẢ SẢN PHẨM CHO TÌM KIẾM ===
  useEffect(() => {
    const q = firestore().collection("products").where("available", "==", true);
    const unsub = q.onSnapshot((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllProducts(list);
    });
    return () => unsub();
  }, []);

  // === LẤY ĐÁNH GIÁ THẬT TỪ FIRESTORE ===
  useEffect(() => {
    if (!product?.id) {
      setLoadingReviews(false);
      return;
    }

    setLoadingReviews(true);

    const unsub = firestore()
      .collection("reviews")
      .where("productId", "==", product.id)
      .orderBy("createdAt", "desc")
      .onSnapshot(async (snapshot) => {
        if (snapshot.empty) {
          setReviews([]);
          setAvgRating(5.0);
          setTotalReviews(0);
          setLoadingReviews(false);
          return;
        }

        let totalRating = 0;
        const userIds = new Set();
        const tempReviews = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          totalRating += data.rating || 0;
          if (data.userId) userIds.add(data.userId);
          tempReviews.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        // Lấy thông tin người dùng (tên + avatar)
        let userMap = {};
        if (userIds.size > 0) {
          const userSnap = await firestore()
            .collection("users")
            .where(firestore.FieldPath.documentId(), "in", Array.from(userIds))
            .get();

          userSnap.forEach((u) => {
            const d = u.data();
            userMap[u.id] = {
              name: d.name || d.displayName || "Khách hàng",
              avatar: d.photoURL || d.avatarUrl,
            };
          });
        }

        const finalReviews = tempReviews.map((r) => ({
          ...r,
          userName: userMap[r.userId]?.name || "Khách hàng",
          userAvatar: userMap[r.userId]?.avatar,
        }));

        const avg = totalRating / finalReviews.length;

        setReviews(finalReviews);
        setAvgRating(avg);
        setTotalReviews(finalReviews.length);
        setLoadingReviews(false);
      }, (err) => {
        console.error("Lỗi tải đánh giá:", err);
        setLoadingReviews(false);
      });

    return () => unsub();
  }, [product?.id]);

  // === THÊM VÀO GIỎ ===
  const addToCart = async (product) => {
    const user = auth().currentUser;
    if (!user) {
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    try {
      const cartRef = firestore().collection("carts").doc(user.uid);
      await firestore().runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        let items = cartDoc.exists ? cartDoc.data().items || [] : [];

        const existingIndex = items.findIndex((i) => i.id === product.id);
        if (existingIndex >= 0) {
          items[existingIndex].quantity += 1;
        } else {
          items.push({
            id: product.id,
            name: product.name,
            price: Math.round(product.price * (1 - (product.discount || 0) / 100)),
            originalPrice: product.price,
            discount: product.discount || 0,
            imageUrl: product.imageUrl || PLACEHOLDER,
            quantity: 1,
            sellerId: product.sellerId,
          });
        }
        transaction.set(cartRef, { items }, { merge: true });
      });
    } catch (err) {
      console.error(err);
      alert("Lỗi thêm vào giỏ");
    }
  };

  // === TÌM KIẾM ===
  const enterSearchMode = () => {
    setIsSearchMode(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) setFinalSearchQuery(q);
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

  const filteredProducts = allProducts.filter((p) =>
    finalSearchQuery
      ? (p.name || "").toLowerCase().includes(finalSearchQuery.toLowerCase())
      : true
  );

  // === RENDER ĐÁNH GIÁ ===
  const renderReview = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item.userAvatar || PLACEHOLDER }}
          style={styles.avatar}
          defaultSource={{ uri: PLACEHOLDER }}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name="star"
                size={14}
                color={star <= item.rating ? "#ffc107" : "#ddd"}
              />
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.reviewComment}>{item.comment || "Không có nhận xét"}</Text>

      {item.imageUrls && item.imageUrls.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 8 }}>
          {item.imageUrls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.reviewImage} />
          ))}
        </View>
      )}

      <Text style={styles.reviewDate}>
        {formatReviewTime(item.createdAt)}
      </Text>
    </View>
  );

  const ListHeader = () => (
    <>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product?.imageUrl || PLACEHOLDER }} style={styles.productImage} />
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.discountedPrice}>
          {discountedPrice.toLocaleString("vi-VN")}đ
        </Text>
        {discount > 0 && (
          <>
            <Text style={styles.originalPrice}>{originalPrice.toLocaleString("vi-VN")}đ</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.productName}>{product?.name || "Sản phẩm"}</Text>

      {product?.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>
      )}

      <View style={styles.ratingSection}>
        <View style={styles.ratingRow}>
          <Icon name="star" size={18} color="#ffc107" />
          <Text style={styles.avgRating}>{avgRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({totalReviews} đánh giá)</Text>
        </View>
      </View>

      <View style={styles.reviewsTitleContainer}>
        <Text style={styles.reviewsTitle}>Đánh giá khách hàng ({totalReviews})</Text>
      </View>

      {loadingReviews && (
        <View style={{ padding: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color="#2e7d32" />
        </View>
      )}
    </>
  );

  const renderResultItem = ({ item }) => {
    const disc = item.discount || 0;
    const price = item.price || 0;
    const discPrice = price * (1 - disc / 100);

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          navigation.replace("ProductDetail", { product: item });
          handleBackToDetail();
        }}
      >
        <View style={styles.resultImgWrap}>
          <Image source={{ uri: item.imageUrl || PLACEHOLDER }} style={styles.resultImg} />
        </View>
        <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.resultPriceRow}>
          <Text style={styles.resultDiscPrice}>{discPrice.toFixed(0)}đ</Text>
          {disc > 0 && <Text style={styles.resultOrigPrice}>{price}đ</Text>}
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
            <TouchableOpacity onPress={handleBackToDetail} style={styles.backButtonContainer}>
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.searchBox} activeOpacity={1} onPress={enterSearchMode}>
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
            {searchQuery && (
              <TouchableOpacity onPress={handleClearSearch} style={{ marginLeft: 8 }}>
                <Icon name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cartIconContainer} onPress={() => navigation.navigate("Cart")}>
            <Icon name="cart-outline" size={30} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* NỘI DUNG */}
      {isSearchMode ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
          renderItem={renderResultItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="search-off" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={!loadingReviews && <Text style={{ textAlign: "center", margin: 30, color: "#999" }}>Chưa có đánh giá nào</Text>}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* BOTTOM BAR */}
      {!isSearchMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.shopBtn}>
            <Icon name="storefront-outline" size={22} color="#666" />
            <Text style={styles.shopText}>Cửa hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={async () => {
              const buyerId = auth().currentUser?.uid;
              if (!buyerId) {
                alert("Vui lòng đăng nhập để nhắn tin!");
                return;
              }

              const sellerId = product.sellerId;
              if (!sellerId) {
                alert("Không tìm thấy thông tin người bán");
                return;
              }

              try {
                const chatId = await getOrCreateChat(buyerId, sellerId, product);
                
                navigation.navigate("ChatDetail", {
                  chatId,
                  partnerId: sellerId,
                });
              } catch (err) {
                console.error("Lỗi mở chat:", err);
                alert("Không thể mở tin nhắn. Vui lòng thử lại.");
              }
            }}
          >
            <Icon name="chatbubble-outline" size={22} color="#666" />
            <Text style={styles.chatText}>Nhắn tin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addToCartBtn} onPress={() => addToCart(product)}>
            <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
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

// Styles giữ nguyên 99%, chỉ thêm 1 cái nhỏ
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2ecc71", paddingTop: 40, paddingHorizontal: 16, paddingBottom: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backButtonContainer: { padding: 4 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 40, paddingHorizontal: 16, paddingVertical: 12, elevation: 4 },
  searchInput: { flex: 1, fontSize: 16, color: "#333", marginLeft: 8 },
  cartIconContainer: { padding: 8, position: "relative" },
  cartBadge: { position: "absolute", right: 4, top: 4, backgroundColor: "red", borderRadius: 9, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },

  imageContainer: { height: 300 },
  productImage: { width: "100%", height: "100%" },
  priceSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 12, gap: 10 },
  discountedPrice: { fontSize: 24, fontWeight: "bold", color: "#ee4d2d" },
  originalPrice: { fontSize: 16, color: "#999", textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#ee4d2d", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  productName: { fontSize: 18, color: "#333", paddingHorizontal: 16, marginTop: 8 },
  descriptionContainer: { paddingHorizontal: 16, marginTop: 12, backgroundColor: "#f9f9f9", padding: 12, borderRadius: 12 },
  descriptionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  descriptionText: { fontSize: 14, color: "#444", lineHeight: 22 },

  ratingSection: { paddingHorizontal: 16, marginTop: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avgRating: { fontSize: 16, fontWeight: "600" },
  reviewCount: { fontSize: 14, color: "#777" },
  reviewsTitleContainer: { paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  reviewsTitle: { fontSize: 16, fontWeight: "bold" },

  reviewItem: { backgroundColor: "#f9f9f9", padding: 12, borderRadius: 12, marginBottom: 12, marginHorizontal: 16 },
  reviewHeader: { flexDirection: "row", gap: 10, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ddd" },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "600" },
  reviewComment: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 8 },
  reviewImage: { width: 80, height: 80, borderRadius: 8 },
  reviewDate: { fontSize: 12, color: "#999" },

  resultCard: { backgroundColor: "#fff", borderRadius: 16, padding: 12, elevation: 3, width: "48%", marginBottom: 12 },
  resultImgWrap: { width: "100%", height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: "#f0f0f0" },
  resultImg: { width: "100%", height: "100%" },
  resultName: { fontSize: 15, fontWeight: "600", minHeight: 40 },
  resultPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  resultDiscPrice: { fontSize: 15, fontWeight: "bold", color: "#e67e22" },
  resultOrigPrice: { fontSize: 13, color: "#999", textDecorationLine: "line-through" },

  bottomBar: { marginBottom: 5, position: "absolute", bottom: 0, left: 0, right: 0, height: 70, flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee", paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  shopBtn: { flex: 1, alignItems: "center", gap: 4 },
  shopText: { fontSize: 11, color: "#666" },
  chatBtn: { flex: 1, alignItems: "center", gap: 4 },
  chatText: { fontSize: 11, color: "#666" },
  addToCartBtn: { marginRight: 4, flex: 2.3, height: 48, backgroundColor: "#fff", borderWidth: 2, borderColor: "#2ecc71", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  addToCartText: { color: "#2ecc71", fontWeight: "bold", fontSize: 15 },
  buyNowBtn: { marginLeft: 4, flex: 2.3, height: 48, backgroundColor: "#2ecc71", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  buyNowText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { marginTop: 16, fontSize: 16, color: "#999" },
});