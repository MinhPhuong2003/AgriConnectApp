import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const BuyerPreOrderDetailScreen = ({ route, navigation }) => {
  const { preOrderData } = route.params;
  const item = preOrderData;
  const [cartCount, setCartCount] = useState(0);
  const user = auth().currentUser;
  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    const unsubscribe = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("preOrderCart")
      .onSnapshot((snapshot) => {
        setCartCount(snapshot.size);
      });

    return () => unsubscribe && unsubscribe();
  }, [user]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const formatFullDate = (date) => {
    if (!date) return "Chưa xác định";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getTimeLeft = (endDate) => {
    const now = new Date();
    const diff = endDate - now;
    if (diff < 0) return "Đã kết thúc";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Còn ${days} ngày`;
    if (hours > 0) return `Còn ${hours} giờ`;
    return "Sắp kết thúc";
  };

  const isSoldOut = item.preOrderLimit && (item.preOrderCurrent || 0) >= item.preOrderLimit;

  return (
    <>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CHI TIẾT ĐẶT TRƯỚC</Text>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => navigation.navigate("CartPreOrder")}
            >
              <Icon name="cart-outline" size={26} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Image source={{ uri: item.image }} style={styles.mainImage} />

            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.cropName}>{item.cropName}</Text>
                <View style={styles.timeBadge}>
                  <Icon name="time-outline" size={16} color="#e67e22" />
                  <Text style={styles.timeText}>
                    {getTimeLeft(item.preOrderEndDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="calendar-outline" size={20} color="#27ae60" />
                  <Text style={styles.infoLabel}>Mùa vụ:</Text>
                  <Text style={styles.infoValue}>
                    {item.startMonth && item.endMonth
                      ? `Từ ${formatFullDate(item.startMonth.toDate())} đến ${formatFullDate(item.endMonth.toDate())}`
                      : "Chưa xác định mùa vụ"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="leaf-outline" size={20} color="#27ae60" />
                  <Text style={styles.infoLabel}>Thu hoạch dự kiến:</Text>
                  <Text style={styles.infoValue}>{item.harvestDateFull}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="location-outline" size={20} color="#27ae60" />
                  <Text style={styles.infoLabel}>Khu vực:</Text>
                  <Text style={styles.infoValue}>{item.region}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="pricetag-outline" size={20} color="#e67e22" />
                  <Text style={styles.infoLabel}>Giá đặt trước:</Text>
                  <Text style={[styles.infoValue, styles.priceText]}>
                    {formatPrice(item.price)}/kg
                  </Text>
                </View>

                {item.description && item.description.trim() !== "" && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.descriptionInCard}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <Icon name="reader-outline" size={19} color="#27ae60" />
                        <Text style={styles.descriptionTitle}>Mô tả sản phẩm</Text>
                      </View>
                      <Text style={styles.descriptionText}>
                        {item.description.trim()}
                      </Text>
                    </View>
                  </>
                )}

                {/* === THÊM PHẦN GHI CHÚ NGAY SAU MÔ TẢ === */}
                {item.notes && item.notes.trim() !== "" && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.notesSection}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <Icon name="chatbubble-ellipses-outline" size={20} color="#27ae60" />
                        <Text style={styles.notesTitle}>Ghi chú</Text>
                    </View>
                    <View style={styles.notesBox}>
                        <Text style={styles.notesText}>{item.notes.trim()}</Text>
                    </View>
                    </View>
                </>
                )}
              </View>

              {item.preOrderLimit ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>
                      Đã đặt: {item.preOrderCurrent || 0}kg
                    </Text>
                    <Text style={styles.progressTitle}>
                      Giới hạn: {item.preOrderLimit}kg
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.percent}%` },
                        isSoldOut && styles.progressFillSoldOut,
                      ]}
                    />
                  </View>
                  <Text style={styles.remaining}>
                    {isSoldOut ? "ĐÃ HẾT HÀNG" : `Còn lại ${item.remaining}kg`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noLimit}>Không giới hạn số lượng</Text>
              )}
            </View>
          </ScrollView>

          {/* NÚT ĐẶT TRƯỚC NGAY */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                isSoldOut && styles.checkoutButtonDisabled,
              ]}
              disabled={isSoldOut}
              onPress={() =>
                navigation.navigate("CheckoutPreOrder", {
                  preOrderData: item,
                })
              }
            >
              <Icon name="cart-outline" size={22} color="#fff" />
              <Text style={styles.checkoutButtonText}>
                {isSoldOut ? "HẾT HÀNG" : "ĐẶT TRƯỚC NGAY"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    paddingTop: 40,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cartButton: {
    position: "relative",
    width: 46,
    height: 46,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  mainImage: { width: "100%", height: 260 },
  content: { padding: 16, paddingBottom: 90 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cropName: { fontSize: 22, fontWeight: "bold", color: "#2d3436", flex: 1 },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  timeText: { color: "#e67e22", fontWeight: "600", fontSize: 13, marginLeft: 4 },
  infoCard: {
    backgroundColor: "#f8fff8",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e6c9",
    marginBottom: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  infoLabel: { fontSize: 15, color: "#444", marginLeft: 8, flex: 1 },
  infoValue: { fontSize: 15, color: "#2d3436", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#c8e6c9", marginVertical: 14 },
  descriptionInCard: { marginTop: 6 },
  descriptionTitle: { fontSize: 16, fontWeight: "bold", color: "#27ae60", marginLeft: 6 },
  descriptionText: { fontSize: 15, color: "#2d3436", lineHeight: 24, textAlign: "justify", marginTop: 4 },
  priceText: { color: "#e74c3c", fontWeight: "bold", fontSize: 17 },
  progressSection: { marginBottom: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressTitle: { fontSize: 14, color: "#555" },
  progressBar: { height: 10, backgroundColor: "#eee", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#27ae60" },
  progressFillSoldOut: { backgroundColor: "#e74c3c" },
  remaining: { textAlign: "right", marginTop: 8, fontSize: 15, fontWeight: "bold", color: "#e67e22" },
  noLimit: { textAlign: "center", fontSize: 15, color: "#27ae60", fontStyle: "italic", marginVertical: 16 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 10,
  },
  checkoutButton: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#95a5a6",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
    notesSection: {
    marginTop: 6,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginLeft: 8,
  },
  notesBox: {
    backgroundColor: "#fffde7",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff176",
    borderLeftWidth: 5,
    borderLeftColor: "#ffca28",
  },
  notesText: {
    fontSize: 15,
    color: "#5d4037",
    lineHeight: 23,
    fontStyle: "italic",
  },
});

export default BuyerPreOrderDetailScreen;