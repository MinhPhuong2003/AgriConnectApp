import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const PreOrderScreen = ({ navigation }) => {
  const [preOrderProducts, setPreOrderProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection("preOrders")
      .where("sellerId", "==", user.uid)
      // .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const products = [];
          snapshot.forEach((doc) => {
            const data = doc.data();

            const startMonth = data.startMonth?.toDate();
            const endMonth = data.endMonth?.toDate();
            const preOrderStart = data.preOrderStartDate?.toDate();
            const preOrderEnd = data.preOrderEndDate?.toDate();
            const harvestDate = data.expectedHarvestDate?.toDate();

            products.push({
              id: doc.id,
              ...data,
              image: data.imageBase64 || "https://via.placeholder.com/300x200/eee/aaa?text=Không+ảnh",
              seasonRange: `Từ ${formatFullDate(startMonth)} đến ${formatFullDate(endMonth)}`,
              preOrderRange: `Từ ${formatFullDate(preOrderStart)} đến ${formatFullDate(preOrderEnd)}`,
              harvestDateFull: formatFullDate(harvestDate),
              preOrderEndDate: preOrderEnd,
            });
          });
          setPreOrderProducts(products);
          setLoading(false);
        },
        (err) => {
          console.error("Lỗi load:", err);
          Alert.alert("Lỗi", "Không thể tải danh sách");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const formatFullDate = (date) => {
    if (!date) return "Chưa xác định";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ/kg";

  const handleAddNew = () => navigation.navigate("AddPreOrder");

  const handleDelete = (preOrderId) => {
    Alert.alert(
      "Xóa sản phẩm đặt trước",
      "Bạn có chắc muốn xóa sản phẩm này không?\nHành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore().collection("preOrders").doc(preOrderId).delete();
            } catch (error) {
              console.error("Lỗi xóa:", error);
              Alert.alert("Lỗi", "Không thể xóa, vui lòng thử lại");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const booked = item.preOrderCurrent || 0;
    const total = item.preOrderLimit || 0;
    const percent = total > 0 ? (booked / total) * 100 : 0;

    const now = new Date();
    const isActive = now <= (item.preOrderEndDate || now);

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />

        <View style={styles.content}>
          <Text style={styles.title}>{item.cropName}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Tên sản phẩm:</Text>
            <Text style={styles.value}>{item.cropName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Khu vực:</Text>
            <Text style={styles.value}>{item.region}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Mùa vụ:</Text>
            <Text style={styles.value}>{item.seasonRange}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Nhận đặt:</Text>
            <Text style={styles.value}>{item.preOrderRange}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Thu hoạch dự kiến:</Text>
            <Text style={styles.valueBold}>{item.harvestDateFull}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Giá bán:</Text>
            <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
          </View>

          {item.preOrderLimit ? (
            <View style={styles.row}>
              <Text style={styles.label}>Giới hạn:</Text>
              <Text style={styles.value}>{item.preOrderLimit}kg</Text>
            </View>
          ) : null}

          <View style={styles.progressSection}>
            <Text style={styles.bookedText}>
              {booked}kg{total > 0 ? `/${total}kg` : ""} đã đặt
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, !isActive && styles.statusInactive]}>
              <Text style={[styles.statusText, !isActive && { color: "#e74c3c" }]}>
                {isActive ? "Đang nhận đặt" : "Đã kết thúc"}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditPreOrder", { preOrderId: item.id, preOrderData: item })}
              >
                <Icon name="create-outline" size={22} color="#2e7d32" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Icon name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
            {item.notes ? <Text style={styles.notes}>Ghi chú: {item.notes}</Text> : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SẢN PHẨM ĐẶT TRƯỚC</Text>
        </View>

        {preOrderProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/4202/4202843.png" }}
              style={{ width: 120, height: 120, opacity: 0.7 }}
            />
            <Text style={styles.emptyText}>Chưa có sản phẩm đặt trước</Text>
            <Text style={styles.emptySubText}>
              Nhấn nút dấu cộng để đăng sản phẩm sắp thu hoạch
            </Text>
          </View>
        ) : (
          <FlatList
            data={preOrderProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={handleAddNew}>
          <Icon name="add" size={34} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    paddingTop: 40,
    elevation: 6,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 5,
  },
  image: { width: "100%", height: 180 },
  content: { padding: 16 },
  title: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  label: {
    fontSize: 15,
    color: "#555",
    fontWeight: "600",
    width: 120,
  },
  value: {
    fontSize: 15,
    color: "#333",
    flex: 1,
    textAlign: "right",
    fontWeight: "500",
  },
  valueBold: {
    fontSize: 15,
    color: "#e67e22",
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e74c3c",
    flex: 1,
    textAlign: "right",
  },
  progressSection: { marginTop: 6 },
  bookedText: { fontSize: 14, color: "#444", marginBottom: 6 },
  progressBar: { height: 10, backgroundColor: "#eee", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#27ae60", borderRadius: 5 },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
  },
  statusInactive: { backgroundColor: "#ffebee" },
  statusText: { color: "#2e7d32", fontWeight: "bold", fontSize: 13 },
  notes: { marginTop: 12, fontSize: 14, color: "#555", fontStyle: "italic" },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 30,
    backgroundColor: "#27ae60",
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyText: { fontSize: 19, color: "#95a5a6", marginTop: 20, fontWeight: "600" },
  emptySubText: { fontSize: 15, color: "#888", marginTop: 10, textAlign: "center", lineHeight: 22 },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingRight: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    backgroundColor: "#e8f5e9",
    padding: 11,
    borderRadius: 12,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: "#ffebee",
    padding: 11,
    borderRadius: 12,
    elevation: 3,
  },
});

export default PreOrderScreen;