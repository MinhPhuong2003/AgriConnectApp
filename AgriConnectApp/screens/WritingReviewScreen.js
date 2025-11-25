import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const WritingReviewScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId) {
          Alert.alert("Lỗi", "Vui lòng đăng nhập để tiếp tục.");
          navigation.goBack();
          return;
        }

        const orderDoc = await firestore()
          .collection("orders")
          .doc(orderId)
          .get();

        if (orderDoc.exists) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() };
          setOrder(orderData);

          // Nhóm sản phẩm theo sellerId
          const groupedByFarmer = {};
          for (const item of orderData.items) {
            const sellerId = item.sellerId || "unknown";
            if (!groupedByFarmer[sellerId]) {
              groupedByFarmer[sellerId] = {
                sellerId,
                farmerName: item.farmerName || "Nông dân không xác định",
                farmerAvatarUrl: item.farmerAvatarUrl || null,
                farmerRating: 0,
                products: [],
              };
            }

            // Kiểm tra đánh giá đã tồn tại chưa
            const reviewSnapshot = await firestore()
              .collection("reviews")
              .where("orderId", "==", orderId)
              .where("productId", "==", item.id)
              .where("userId", "==", userId)
              .get();

            let productReview = {
              productId: item.id,
              name: item.name,
              imageUrl: item.imageUrl,
              rating: 0,
              comment: "",
              isReviewed: false,
            };

            if (!reviewSnapshot.empty) {
              const reviewData = reviewSnapshot.docs[0].data();
              productReview = {
                ...productReview,
                rating: reviewData.rating || 0,
                farmerRating: reviewData.farmerRating || 0,
                comment: reviewData.comment || "",
                isReviewed: true,
              };
              groupedByFarmer[sellerId].farmerRating =
                reviewData.farmerRating || 0;
            }

            groupedByFarmer[sellerId].products.push(productReview);
          }

          const initialReviews = Object.values(groupedByFarmer);
          setReviews(initialReviews);
        } else {
          Alert.alert("Lỗi", "Không tìm thấy đơn hàng.");
          navigation.goBack();
        }
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng.");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigation]);

  const handleRating = (sellerId, productId, rating, type) => {
    setReviews((prevReviews) =>
      prevReviews.map((farmer) =>
        farmer.sellerId === sellerId
          ? {
              ...farmer,
              farmerRating: type === "farmer" ? rating : farmer.farmerRating,
              products: farmer.products.map((product) =>
                product.productId === productId && type === "product"
                  ? { ...product, rating }
                  : product
              ),
            }
          : farmer
      )
    );
  };

  const handleComment = (sellerId, productId, comment) => {
    setReviews((prevReviews) =>
      prevReviews.map((farmer) =>
        farmer.sellerId === sellerId
          ? {
              ...farmer,
              products: farmer.products.map((product) =>
                product.productId === productId
                  ? { ...product, comment }
                  : product
              ),
            }
          : farmer
      )
    );
  };

  const handleSubmit = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để gửi đánh giá.");
      return;
    }

    const validReviews = [];
    reviews.forEach((farmer) => {
      farmer.products.forEach((product) => {
        if (product.rating > 0 || farmer.farmerRating > 0) {
          validReviews.push({
            productId: product.productId,
            rating: product.rating,
            farmerRating: farmer.farmerRating,
            comment: product.comment,
            isReviewed: product.isReviewed,
            sellerId: farmer.sellerId,
          });
        }
      });
    });

    if (validReviews.length === 0) {
      Alert.alert("Lỗi", "Vui lòng đánh giá ít nhất một sản phẩm hoặc nông dân.");
      return;
    }

    setSubmitting(true);
    try {
      const batch = firestore().batch();

      validReviews.forEach((review) => {
        const reviewRef = firestore()
          .collection("reviews")
          .doc(review.isReviewed ? `${orderId}_${review.productId}_${user.uid}` : undefined);
        batch.set(reviewRef, {
          userId: user.uid,
          orderId: orderId,
          productId: review.productId,
          rating: review.rating,
          farmerRating: review.farmerRating,
          comment: review.comment,
          createdAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // Tích điểm cho nông dân
        if (review.sellerId && review.sellerId !== "unknown") {
          const farmerRef = firestore().collection("users").doc(review.sellerId);
          const totalPoints = review.rating + review.farmerRating;
          batch.set(
            farmerRef,
            { totalPoints: firestore.FieldValue.increment(totalPoints) },
            { merge: true }
          );
        }
      });

      const orderRef = firestore().collection("orders").doc(orderId);
      batch.update(orderRef, { reviewed: true });
      await batch.commit();

      Alert.alert("Thành công", "Đánh giá của bạn đã được gửi.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      Alert.alert("Lỗi", "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (id, rating, type, onPress, disabled = false) => {
    const stars = [1, 2, 3, 4, 5];
    const ratingText =
      rating === 5
        ? "Tuyệt vời"
        : rating === 4
        ? "Tốt"
        : rating === 3
        ? "Bình thường"
        : rating === 2
        ? "Kém"
        : "Rất kém";

    return (
      <View style={styles.starContainer}>
        {stars.map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(id, star, type)}
            disabled={disabled}
          >
            <Icon
              name={star <= rating ? "star" : "star-outline"}
              size={24}
              color={star <= rating ? "#FFCA28" : "#B0BEC5"}
            />
          </TouchableOpacity>
        ))}
        {rating > 0 && <Text style={styles.ratingText}>{ratingText}</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (!order || reviews.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FF5722" />
        </TouchableOpacity>
        <Text style={styles.title}>Đánh giá sản phẩm</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
          <Text style={[styles.submitText, submitting && styles.submitTextDisabled]}>
            Gửi
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {reviews.map((farmer, farmerIndex) => (
          <View key={farmer.sellerId} style={styles.farmerGroup}>
            <View style={styles.farmerCard}>
              <Image
                source={{
                  uri:
                    farmer.farmerAvatarUrl ||
                    "https://via.placeholder.com/40/f0f0f0/cccccc?text=Avatar",
                }}
                style={styles.farmerAvatar}
                resizeMode="cover"
              />
              <Text style={styles.farmerName}>{farmer.farmerName}</Text>
            </View>

            {/* Đánh giá nông dân */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>Đánh giá nông dân</Text>
              {renderStarRating(
                farmer.sellerId,
                farmer.farmerRating,
                "farmer",
                (id, rating, type) => handleRating(farmer.sellerId, null, rating, type),
                farmer.products.some((p) => p.isReviewed)
              )}
            </View>

            {farmer.products.map((product) => (
              <View key={product.productId} style={styles.productItem}>
                {/* Thông tin sản phẩm */}
                <View style={styles.productCard}>
                  <Image
                    source={{
                      uri:
                        product.imageUrl ||
                        "https://via.placeholder.com/60/f0f0f0/cccccc?text=No+Img",
                    }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                  </View>
                </View>

                {/* Đánh giá chất lượng sản phẩm */}
                <View style={styles.ratingSection}>
                  <Text style={styles.sectionTitle}>Chất lượng sản phẩm</Text>
                  {renderStarRating(
                    product.productId,
                    product.rating,
                    "product",
                    (id, rating, type) => handleRating(farmer.sellerId, id, rating, type),
                    product.isReviewed
                  )}
                </View>

                {/* Nhận xét */}
                <View style={styles.reviewSection}>
                  <Text style={styles.sectionTitle}>
                    Hãy chia sẻ nhận xét cho sản phẩm này
                  </Text>
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Hãy chia sẻ nhận xét của bạn..."
                    placeholderTextColor="#B0BEC5"
                    multiline
                    value={product.comment}
                    onChangeText={(text) =>
                      handleComment(farmer.sellerId, product.productId, text)
                    }
                    maxLength={500}
                    editable={!product.isReviewed}
                  />
                </View>
              </View>
            ))}

            {farmerIndex < reviews.length - 1 && <View style={styles.farmerSeparator} />}
          </View>
        ))}

        {/* Nút thêm hình/video (bạn có thể bỏ nếu không dùng) */}
        <View style={styles.mediaButtons}>
          <TouchableOpacity style={styles.mediaButton}>
            <Icon name="camera" size={20} color="#fff" />
            <Text style={styles.mediaButtonText}>Thêm Hình ảnh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton}>
            <Icon name="videocam" size={20} color="#fff" />
            <Text style={styles.mediaButtonText}>Thêm Video</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.viewReviewsButton}
          onPress={() => navigation.navigate("ReviewList", { orderId })}
        >
          <Text style={styles.viewReviewsText}>Xem tất cả đánh giá</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default WritingReviewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: { color: "#FF5722", fontSize: 18, fontWeight: "bold" },
  submitText: { color: "#FF5722", fontSize: 16, fontWeight: "600" },
  submitTextDisabled: { color: "#B0BEC5" },
  scrollContent: { padding: 16 },
  farmerGroup: { marginBottom: 16 },
  farmerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  farmerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  farmerName: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  productItem: { marginBottom: 16 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  productImage: { width: 50, height: 50, borderRadius: 4, marginRight: 10 },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, color: "#212121", fontWeight: "500" },
  ratingSection: { marginTop: 12, marginBottom: 16 },
  sectionTitle: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "600",
    marginBottom: 8,
  },
  starContainer: { flexDirection: "row", alignItems: "center" },
  ratingText: { fontSize: 14, color: "#FFCA28", marginLeft: 8 },
  reviewSection: { marginBottom: 16 },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: "#212121",
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: "#FF5722",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  mediaButtonText: { color: "#fff", fontSize: 14, marginLeft: 8 },
  viewReviewsButton: {
    backgroundColor: "#FF5722",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  viewReviewsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  farmerSeparator: {
    height: 2,
    backgroundColor: "#ddd",
    marginVertical: 16,
  },
});