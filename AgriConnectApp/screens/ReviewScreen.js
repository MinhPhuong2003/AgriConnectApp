import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const ReviewScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingReviews, setPendingReviews] = useState([]);
  const [reviewedOrders, setReviewedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Bạn");
  const [userAvatar, setUserAvatar] = useState(null);

  const uid = auth().currentUser?.uid;

  // Lấy thông tin user (tên + avatar)
  useEffect(() => {
    if (!uid) return;

    const fetchUserInfo = async () => {
      try {
        const doc = await firestore().collection("users").doc(uid).get();
        if (doc.exists) {
          const data = doc.data();
          setUserName(data.displayName || data.name || "Bạn");
          setUserAvatar(data.photoURL || data.avatar || null);
        }
      } catch (error) {
        console.log("Lỗi lấy thông tin người dùng:", error);
      }
    };

    fetchUserInfo();
  }, [uid]);

  // MAIN EFFECT – Realtime orders + realtime reviews
  useEffect(() => {
    if (!uid) return;

    let ordersUnsubscribe = () => {};
    let reviewsUnsubscribe = () => {};

    const setupListeners = () => {
      // 1. Lắng nghe realtime các đơn hàng
      ordersUnsubscribe = firestore()
        .collection("orders")
        .where("userId", "==", uid)
        .where("status", "in", ["shipping", "completed"])
        .orderBy("updatedAt", "desc")
        .onSnapshot((ordersSnapshot) => {
          if (ordersSnapshot.empty) {
            setPendingReviews([]);
            setReviewedOrders([]);
            setLoading(false);
            return;
          }

          setLoading(true);

          // 2. Lắng nghe realtime tất cả review của user này
          reviewsUnsubscribe = firestore()
            .collection("reviews")
            .where("userId", "==", uid)
            .onSnapshot(
              (reviewsSnapshot) => {
                // Tạo map review: key = orderId_productId
                const reviewsMap = {};
                reviewsSnapshot.forEach((doc) => {
                  const data = doc.data();
                  const key = `${data.orderId}_${data.productId}`;
                  reviewsMap[key] = { id: doc.id, ...data };
                });

                processOrdersWithReviews(ordersSnapshot, reviewsMap);
              },
              (error) => {
                console.log("Lỗi realtime reviews:", error);
                // Fallback nếu lỗi realtime
                fallbackLoadReviews(ordersSnapshot);
              }
            );
        }, (error) => {
          console.log("Lỗi realtime orders:", error);
          setLoading(false);
        });
    };

    // Hàm xử lý chính – tách ra để dễ đọc
    const processOrdersWithReviews = (ordersSnapshot, reviewsMap) => {
      const pending = [];
      const reviewed = [];

      ordersSnapshot.forEach((orderDoc) => {
        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        if (!orderData.items || orderData.items.length === 0) return;

        // Format thời gian đặt hàng
        let orderDateTime = "Chưa xác định";
        if (orderData.createdAt?.toDate) {
          const date = orderData.createdAt.toDate();
          orderDateTime = date
            .toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
            .replace(",", " lúc");
        }

        // Group theo nông dân
        const groupedByFarmer = {};
        let hasAnyReview = false;
        let latestReviewTime = 0;

        orderData.items.forEach((item) => {
          const sellerId = item.sellerId || "unknown";
          if (!groupedByFarmer[sellerId]) {
            groupedByFarmer[sellerId] = {
              sellerId,
              farmerName: item.farmerName || "Nông dân",
              farmerAvatarUrl: item.farmerAvatarUrl || null,
              products: [],
            };
          }

          const key = `${orderData.id}_${item.id}`;
          const review = reviewsMap[key] || null;

          if (review) {
            hasAnyReview = true;
            if (review.createdAt?.toDate) {
              const time = review.createdAt.toDate().getTime();
              if (time > latestReviewTime) latestReviewTime = time;
            }
          }

          groupedByFarmer[sellerId].products.push({
            productId: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            season: item.season,
            review,
          });
        });

        const order = {
          id: orderData.id,
          orderCode: orderData.id,
          orderDateTime,
          farmers: Object.values(groupedByFarmer),
          latestReviewTime,
        };

        // Logic phân loại tab
        if (!hasAnyReview && orderData.status === "shipping") {
          pending.push(order);
        } else if (hasAnyReview) {
          reviewed.push(order);
        }
      });

      reviewed.sort((a, b) => b.latestReviewTime - a.latestReviewTime);

      setPendingReviews(pending);
      setReviewedOrders(reviewed);
      setLoading(false);
    };

    // Fallback nếu realtime reviews lỗi
    const fallbackLoadReviews = async (ordersSnapshot) => {
      try {
        const snap = await firestore()
          .collection("reviews")
          .where("userId", "==", uid)
          .get();

        const reviewsMap = {};
        snap.forEach((doc) => {
          const data = doc.data();
          reviewsMap[`${data.orderId}_${data.productId}`] = { id: doc.id, ...data };
        });

        processOrdersWithReviews(ordersSnapshot, reviewsMap);
      } catch (err) {
        console.log("Fallback cũng lỗi:", err);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      ordersUnsubscribe();
      reviewsUnsubscribe();
    };
  }, [uid]);

  const handleReview = (orderId) => {
    navigation.navigate("Review", { orderId });
  };

  const formatReviewTime = (timestamp) => {
    if (!timestamp?.toDate) return "Vừa xong";
    const date = timestamp.toDate();
    return date
      .toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", " lúc");
  };

  const OrderHeader = ({ order }) => (
    <View style={styles.orderHeader}>
      <View style={styles.orderInfoRow}>
        <Text style={styles.orderLabel}>Mã đơn hàng:</Text>
        <Text style={styles.orderCode}>{order.orderCode}</Text>
      </View>
      <View style={styles.orderInfoRow}>
        <Text style={styles.orderLabel}>Ngày đặt:</Text>
        <Text style={styles.orderDateText}>{order.orderDateTime}</Text>
      </View>
    </View>
  );

  const renderPendingItem = ({ item }) => (
    <View style={styles.orderItem}>
      <OrderHeader order={item} />

      {item.farmers.map((farmer, idx) => (
        <View key={farmer.sellerId} style={styles.farmerGroup}>
          {farmer.products.map((product) => (
            <View key={product.productId} style={styles.productItem}>
              <Image
                source={{ uri: product.imageUrl || "https://via.placeholder.com/80" }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.name}
                </Text>
                {product.season && (
                  <Text style={styles.seasonText}>Mùa vụ: {product.season}</Text>
                )}
              </View>
            </View>
          ))}
          {idx < item.farmers.length - 1 && <View style={styles.farmerSeparator} />}
        </View>
      ))}

      <TouchableOpacity
        style={styles.reviewBtn}
        onPress={() => handleReview(item.id)}
      >
        <Text style={styles.reviewBtnText}>Đánh giá ngay</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewedItem = ({ item }) => (
    <View style={styles.orderItem}>
      <OrderHeader order={item} />

      {item.farmers.map((farmer, idx) => (
        <View key={farmer.sellerId} style={styles.farmerGroup}>
          {farmer.products.map((product) => (
            <View key={product.productId} style={styles.productItem}>
              <Image
                source={{ uri: product.imageUrl || "https://via.placeholder.com/80" }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.name}
                </Text>

                {product.review ? (
                  <View style={styles.reviewContainer}>
                    <View style={styles.reviewerInfo}>
                      <Image
                        source={{
                          uri: userAvatar || "https://via.placeholder.com/80/666/fff?text=U",
                        }}
                        style={styles.reviewerAvatar}
                      />
                      <View>
                        <Text style={styles.reviewerName}>{userName}</Text>
                        <Text style={styles.reviewTime}>
                          {formatReviewTime(product.review.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ratingRow}>
                      <Text style={styles.reviewLabel}>Sản phẩm:</Text>
                      {[...Array(5)].map((_, i) => (
                        <Icon
                          key={i}
                          name={i < product.review.rating ? "star" : "star-outline"}
                          size={16}
                          color="#f1c40f"
                        />
                      ))}
                    </View>

                    <View style={styles.ratingRow}>
                      <Text style={styles.reviewLabel}>Nông dân:</Text>
                      {[...Array(5)].map((_, i) => (
                        <Icon
                          key={`f-${i}`}
                          name={i < product.review.farmerRating ? "star" : "star-outline"}
                          size={16}
                          color="#f1c40f"
                        />
                      ))}
                    </View>

                    {product.review.comment ? (
                      <Text style={styles.reviewComment}>
                        {product.review.comment}
                      </Text>
                    ) : (
                      <Text style={styles.noComment}>Không có nhận xét</Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noComment}>Chưa đánh giá sản phẩm này</Text>
                )}
              </View>
            </View>
          ))}
          {idx < item.farmers.length - 1 && <View style={styles.farmerSeparator} />}
        </View>
      ))}
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="star-outline" size={80} color="#ddd" />
      <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "pending"
          ? "Bạn chưa có đơn hàng nào cần đánh giá."
          : "Bạn chưa đánh giá sản phẩm nào cả."}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#d32f2f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.activeTabText,
            ]}
          >
            Chưa đánh giá ({pendingReviews.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "reviewed" && styles.activeTab]}
          onPress={() => setActiveTab("reviewed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "reviewed" && styles.activeTabText,
            ]}
          >
            Đã đánh giá ({reviewedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <FlatList
      data={activeTab === "pending" ? pendingReviews : reviewedOrders}
      keyExtractor={(item) => item.id}
      renderItem={activeTab === "pending" ? renderPendingItem : renderReviewedItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={EmptyState}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
    />
  );
};

export default ReviewScreen;

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: { borderBottomWidth: 3, borderColor: "#d32f2f" },
  tabText: { fontSize: 15, color: "#777", fontWeight: "600" },
  activeTabText: { color: "#d32f2f", fontWeight: "700" },
  orderItem: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  orderHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderLabel: { fontSize: 14, color: "#666" },
  orderCode: { fontSize: 14, fontWeight: "bold", color: "#d32f2f" },
  orderDateText: { fontSize: 14, color: "#333", fontWeight: "500" },
  farmerGroup: { marginBottom: 16 },
  productItem: { flexDirection: "row", marginBottom: 20 },
  productImage: { width: 80, height: 80, borderRadius: 12, marginRight: 16 },
  productInfo: { flex: 1, justifyContent: "center" },
  productTitle: { fontSize: 16, color: "#333", fontWeight: "600", lineHeight: 22 },
  seasonText: { fontSize: 13, color: "#777", marginTop: 6 },
  reviewContainer: { marginTop: 16 },
  reviewerInfo: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewerName: { fontSize: 15, fontWeight: "600", color: "#333" },
  reviewTime: { fontSize: 12.5, color: "#999", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  reviewLabel: { fontSize: 14, color: "#555", marginRight: 8 },
  reviewComment: { fontSize: 14.5, color: "#333", marginTop: 10, lineHeight: 22 },
  noComment: { fontSize: 13.5, color: "#999", fontStyle: "italic", marginTop: 8 },
  reviewBtn: {
    backgroundColor: "#d32f2f",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 12,
    alignSelf: "flex-end",
    minWidth: 160,
    alignItems: "center",
    marginTop: 12,
  },
  reviewBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  emptyContainer: { alignItems: "center", paddingVertical: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 19, fontWeight: "600", color: "#333", marginTop: 24 },
  emptySubtitle: { fontSize: 15, color: "#777", textAlign: "center", marginTop: 12, lineHeight: 22 },
  farmerSeparator: { height: 1, backgroundColor: "#eee", marginVertical: 16 },
});