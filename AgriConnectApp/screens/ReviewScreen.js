import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
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

  useEffect(() => {
    if (!uid) return;
    const fetchUserInfo = async () => {
      try {
        const userDoc = await firestore().collection("users").doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          setUserName(data.displayName || data.name || "Bạn");
          setUserAvatar(data.photoURL || data.avatar || null);
        }
      } catch (error) {
        console.log("Lỗi lấy thông tin người dùng:", error);
      }
    };
    fetchUserInfo();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const ordersSnapshot = await firestore()
          .collection("orders")
          .where("userId", "==", uid)
          .where("status", "in", ["shipping", "completed"])
          .get();

        const pending = [];
        const reviewed = [];

        for (const orderDoc of ordersSnapshot.docs) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() };
          if (!orderData.items || orderData.items.length === 0) continue;

          const groupedByFarmer = {};
          for (const item of orderData.items) {
            const sellerId = item.sellerId || "unknown";
            if (!groupedByFarmer[sellerId]) {
              groupedByFarmer[sellerId] = {
                sellerId,
                farmerName: item.farmerName || "Nông dân không xác định",
                farmerAvatarUrl: item.farmerAvatarUrl || null,
                products: [],
              };
            }
            groupedByFarmer[sellerId].products.push({
              productId: item.id,
              name: item.name,
              imageUrl: item.imageUrl,
              season: item.season,
            });
          }

          const reviewSnapshot = await firestore()
            .collection("reviews")
            .where("orderId", "==", orderData.id)
            .where("userId", "==", uid)
            .get();

          const reviewsByProduct = {};
          reviewSnapshot.forEach((doc) => {
            const review = doc.data();
            reviewsByProduct[review.productId] = review;
          });

          const hasAnyReview = !reviewSnapshot.empty;

          const order = {
            id: orderData.id,
            shopName: orderData.shopName || "Cửa hàng",
            farmers: Object.values(groupedByFarmer).map((farmer) => ({
              ...farmer,
              products: farmer.products.map((product) => ({
                ...product,
                review: reviewsByProduct[product.productId] || null,
              })),
            })),
          };

          if (!hasAnyReview && orderData.status === "shipping") {
            pending.push(order);
          } else if (hasAnyReview) {
            reviewed.push(order);
          }
        }

        setPendingReviews(pending);
        setReviewedOrders(reviewed);
      } catch (error) {
        console.error("Lỗi tải đánh giá:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu đánh giá.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [uid]);

  const handleReview = (orderId) => {
    navigation.navigate("Review", { orderId });
  };

  const formatReviewTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "Chưa có thời gian";
    const date = timestamp.toDate();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const time = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${day} Tháng ${month}, ${year} lúc ${time}`;
  };

  const renderPendingItem = ({ item }) => (
    <View style={styles.orderItem}>
      {item.farmers.map((farmer, index) => (
        <View key={farmer.sellerId} style={styles.farmerGroup}>
          {farmer.products.map((product) => (
            <View key={product.productId} style={styles.productItem}>
              <Image
                source={{
                  uri: product.imageUrl || "https://via.placeholder.com/60",
                }}
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
          {index < item.farmers.length - 1 && (
            <View style={styles.farmerSeparator} />
          )}
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
      {item.farmers.map((farmer, index) => (
        <View key={farmer.sellerId} style={styles.farmerGroup}>
          {farmer.products.map((product) => (
            <View key={product.productId} style={styles.productItem}>
              <Image
                source={{
                  uri: product.imageUrl || "https://via.placeholder.com/60",
                }}
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
                          uri:
                            userAvatar ||
                            "https://via.placeholder.com/80/666/fff?text=U",
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
                          name={
                            i < product.review.farmerRating ? "star" : "star-outline"
                          }
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
                  <Text style={styles.noComment}>
                    Chưa đánh giá sản phẩm này
                  </Text>
                )}
              </View>
            </View>
          ))}

          {index < item.farmers.length - 1 && (
            <View style={styles.farmerSeparator} />
          )}
        </View>
      ))}

      <TouchableOpacity
        style={styles.reviewBtn}
        onPress={() => handleReview(item.id)}
      >
        <Text style={styles.reviewBtnText}>Chỉnh sửa đánh giá</Text>
      </TouchableOpacity>
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
      renderItem={
        activeTab === "pending" ? renderPendingItem : renderReviewedItem
      }
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
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderColor: "#d32f2f",
  },
  tabText: {
    fontSize: 15,
    color: "#777",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#d32f2f",
    fontWeight: "700",
  },

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
  farmerGroup: { marginBottom: 16 },
  farmerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  farmerName: { fontSize: 16, color: "#333", fontWeight: "600" },
  productItem: { flexDirection: "row", marginBottom: 20 },
  productImage: { width: 80, height: 80, borderRadius: 12, marginRight: 16 },
  productInfo: { flex: 1, justifyContent: "center" },
  productTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    lineHeight: 22,
  },
  seasonText: { fontSize: 13, color: "#777", marginTop: 6 },
  reviewContainer: { marginTop: 16 },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerName: { fontSize: 15, fontWeight: "600", color: "#333" },
  reviewTime: { fontSize: 12.5, color: "#999", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  reviewLabel: { fontSize: 14, color: "#555", marginRight: 8 },
  reviewComment: {
    fontSize: 14.5,
    color: "#333",
    marginTop: 10,
    lineHeight: 22,
  },
  noComment: {
    fontSize: 13.5,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
  },
  reviewBtn: {
    backgroundColor: "#d32f2f",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 12,
    alignSelf: "flex-end",
    minWidth: 160,
    alignItems: "center",
    marginTop: 8,
  },
  reviewBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#333",
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  farmerSeparator: { height: 1, backgroundColor: "#eee", marginVertical: 16 },
});
