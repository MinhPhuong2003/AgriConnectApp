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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const getImageSource = (item) => {
  const uri =
    item?.photoBase64 ||
    item?.photoURL ||
    item?.imageBase64 ||
    item?.imageUrl ||
    item?.farmerAvatarUrl;

  return uri
    ? { uri }
    : { uri: "https://via.placeholder.com/80/eeeeee/999999?text=Avatar" };
};

const WritingReviewScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = reviews.some(
    (farmer) => farmer.farmerRating > 0 || farmer.products.some((p) => p.rating > 0)
  );

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

        if (!orderDoc.exists) {
          Alert.alert("Lỗi", "Không tìm thấy đơn hàng.");
          navigation.goBack();
          return;
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        setOrder(orderData);

        const groupedByFarmer = {};
        const sellerIds = new Set();

        for (const item of orderData.items) {
          const sellerId = item.sellerId || "unknown";
          sellerIds.add(sellerId);

          if (!groupedByFarmer[sellerId]) {
            groupedByFarmer[sellerId] = {
              sellerId,
              farmerName: item.farmerName || "Đang tải tên...",
              farmerAvatarUrl: item.farmerAvatarUrl || null,
              photoURL: null,
              photoBase64: null,
              farmerRating: 0,
              products: [],
            };
          }

          const reviewSnapshot = await firestore()
            .collection("reviews")
            .where("orderId", "==", orderId)
            .where("productId", "==", item.id)
            .where("sellerId", "==", sellerId)
            .limit(1)
            .get();

          let productReview = {
            productId: item.id,
            name: item.name || "Sản phẩm",
            imageBase64: item.imageBase64 || null,
            imageUrl: item.imageUrl || null,
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
            groupedByFarmer[sellerId].farmerRating = reviewData.farmerRating || 0;
          }

          groupedByFarmer[sellerId].products.push(productReview);
        }

        const sellerPromises = Array.from(sellerIds).map(async (sid) => {
          if (sid === "unknown" || !sid) return;
          try {
            const userDoc = await firestore().collection("users").doc(sid).get();
            if (userDoc.exists) {
              const data = userDoc.data();
              groupedByFarmer[sid].farmerName = data.name || data.displayName || "Nông dân";
              groupedByFarmer[sid].photoURL = data.photoURL || null;
              groupedByFarmer[sid].photoBase64 = data.photoBase64 || null;
              groupedByFarmer[sid].farmerAvatarUrl = data.photoURL || null;
            }
          } catch (e) {
            console.error("Lỗi lấy info nông dân:", e);
            groupedByFarmer[sid].farmerName = "Nông dân";
          }
        });

        await Promise.all(sellerPromises);

        setReviews(Object.values(groupedByFarmer));
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
    setReviews((prev) =>
      prev.map((farmer) =>
        farmer.sellerId === sellerId
          ? {
              ...farmer,
              farmerRating: type === "farmer" ? rating : farmer.farmerRating,
              products: farmer.products.map((p) =>
                p.productId === productId && type === "product"
                  ? { ...p, rating }
                  : p
              ),
            }
          : farmer
      )
    );
  };

  const handleComment = (sellerId, productId, comment) => {
    setReviews((prev) =>
      prev.map((farmer) =>
        farmer.sellerId === sellerId
          ? {
              ...farmer,
              products: farmer.products.map((p) =>
                p.productId === productId ? { ...p, comment } : p
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

        batch.set(
          reviewRef,
          {
            userId: user.uid,
            orderId,
            productId: review.productId,
            sellerId: review.sellerId,
            rating: review.rating,
            farmerRating: review.farmerRating,
            comment: review.comment,
            createdAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        if (review.sellerId && review.sellerId !== "unknown") {
          const farmerRef = firestore().collection("users").doc(review.sellerId);
          const totalPoints = review.rating + review.farmerRating;
          batch.set(farmerRef, { totalPoints: firestore.FieldValue.increment(totalPoints) }, { merge: true });
        }
      });

      const orderRef = firestore().collection("orders").doc(orderId);
      batch.update(orderRef, { reviewed: true });

      await batch.commit();

      Alert.alert("Thành công", "Đánh giá của bạn đã được gửi!", [
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
        : rating === 1
        ? "Rất kém"
        : "";

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
              size={32}
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
          <Icon name="arrow-back" size={26} color="#FF5722" />
        </TouchableOpacity>
        <Text style={styles.title}>Đánh giá sản phẩm</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {reviews.map((farmer, farmerIndex) => (
            <View key={farmer.sellerId} style={styles.farmerGroup}>
              <View style={styles.farmerCard}>
                {/* ĐÃ SỬA – HIỂN THỊ ĐÚNG ẢNH NÔNG DÂN */}
                <Image
                  source={getImageSource(farmer)}
                  style={styles.farmerAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.farmerName}>{farmer.farmerName}</Text>
              </View>

              <View style={styles.ratingSection}>
                <Text style={styles.sectionTitle}>Đánh giá nông dân</Text>
                {renderStarRating(
                  farmer.sellerId,
                  farmer.farmerRating,
                  "farmer",
                  (id, rating) => handleRating(farmer.sellerId, null, rating, "farmer"),
                  farmer.products.some((p) => p.isReviewed)
                )}
              </View>

              {farmer.products.map((product) => (
                <View key={product.productId} style={styles.productItem}>
                  <View style={styles.productCard}>
                    <Image
                      source={getImageSource(product)}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ratingSection}>
                    <Text style={styles.sectionTitle}>Chất lượng sản phẩm</Text>
                    {renderStarRating(
                      product.productId,
                      product.rating,
                      "product",
                      (id, rating) => handleRating(farmer.sellerId, id, rating, "product"),
                      product.isReviewed
                    )}
                  </View>

                  <View style={styles.reviewSection}>
                    <Text style={styles.sectionTitle}>Nhận xét của bạn</Text>
                    <TextInput
                      style={styles.reviewInput}
                      placeholder="Viết nhận xét (tối đa 500 ký tự)..."
                      placeholderTextColor="#aaa"
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
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.fixedBottomButton}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#FF5722" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  farmerGroup: { marginBottom: 28 },
  farmerCard: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  farmerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  farmerName: { fontSize: 17, fontWeight: "600", color: "#212121" },
  productItem: { marginBottom: 24 },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 16,
  },
  productImage: { width: 70, height: 70, borderRadius: 10, marginRight: 14 },
  productInfo: { flex: 1, justifyContent: "center" },
  productName: { fontSize: 15.5, color: "#212121", fontWeight: "500", lineHeight: 22 },
  ratingSection: { marginVertical: 8 },
  sectionTitle: { fontSize: 15.5, color: "#424242", fontWeight: "600", marginBottom: 12 },
  starContainer: { flexDirection: "row", alignItems: "center" },
  ratingText: { marginLeft: 12, fontSize: 16, color: "#FF8F00", fontWeight: "600" },
  reviewSection: { marginTop: 10 },
  reviewInput: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 16,
    minHeight: 110,
    fontSize: 15,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  farmerSeparator: { height: 1.5, backgroundColor: "#e0e0e0", marginVertical: 20 },
  fixedBottomButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  submitButton: {
    backgroundColor: "#FF5722",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: { backgroundColor: "#ccc" },
  submitButtonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});