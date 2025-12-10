import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/Ionicons";

const ProductScreen = ({ navigation }) => {
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth().currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      Alert.alert("Lỗi", "Không tìm thấy người dùng");
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection("products")
      .where("sellerId", "==", userId)
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMyProducts(data);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          Alert.alert("Lỗi", "Không tải được sản phẩm");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [userId]);

  const handleDelete = (id, name) => {
    Alert.alert("Xóa sản phẩm", `Xóa "${name}" khỏi danh sách?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await firestore().collection("products").doc(id).delete();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const stock = item.stock || 0;
    const isOutOfStock = stock <= 0;

    return (
      <View style={styles.card}>
        <Image
          source={{
            uri:
              item.imageBase64 ||
              item.imageUrl ||
              "https://via.placeholder.com/300x200/eee/aaa?text=Không+ảnh",
          }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>
          {/* Dòng tiêu đề: Tên + Giá */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.name || "Sản phẩm"}</Text>
            <Text style={styles.priceHeader}>
              {new Intl.NumberFormat("vi-VN").format(item.price || 0)}đ
            </Text>
          </View>

          {/* 4 dòng thông tin: Icon + Nhãn (trái) - Giá trị (phải) */}
          {item.category && (
            <View style={styles.infoRow}>
              <Icon name="pricetags-outline" size={19} color="#27ae60" />
              <Text style={styles.infoLabel}>Danh mục</Text>
              <Text style={styles.infoValue}>{item.category}</Text>
            </View>
          )}

          {item.region && (
            <View style={styles.infoRow}>
              <Icon name="location-outline" size={19} color="#e67e22" />
              <Text style={styles.infoLabel}>Khu vực</Text>
              <Text style={styles.infoValue}>{item.region}</Text>
            </View>
          )}

          {item.season && (
            <View style={styles.infoRow}>
              <Icon name="calendar-outline" size={19} color="#3498db" />
              <Text style={styles.infoLabel}>Mùa vụ</Text>
              <Text style={styles.infoValue}>{item.season}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="cube-outline" size={19} color="#9b59b6" />
            <Text style={styles.infoLabel}>Tồn kho</Text>
            <Text style={[styles.infoValueBold, isOutOfStock && { color: "#e74c3c" }]}>
              {stock} {item.unit || "kg"}
            </Text>
          </View>

          {/* Badge + Nút sửa/xóa */}
          <View style={styles.bottomRow}>
            <View
              style={[
                styles.statusBadge,
                isOutOfStock ? styles.statusInactive : styles.statusActive,
              ]}
            >
              <Text style={[styles.statusText, isOutOfStock && { color: "#e74c3c" }]}>
                {isOutOfStock ? "Hết hàng" : "Còn hàng"}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditProduct", { product: item })}
              >
                <Icon name="create-outline" size={22} color="#2e7d32" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, item.name)}
              >
                <Icon name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={{ marginTop: 16, color: "#666" }}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NÔNG SẢN CỦA TÔI</Text>
        </View>

        {myProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/4202/4202843.png" }}
              style={{ width: 120, height: 120, opacity: 0.7 }}
            />
            <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
            <Text style={styles.emptySubText}>
              Nhấn nút dấu cộng để thêm sản phẩm đầu tiên nhé!
            </Text>
          </View>
        ) : (
          <FlatList
            data={myProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddProduct")}>
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
  image: { width: "100%", height: 200 },
  content: { padding: 16 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
  },
  priceHeader: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#e74c3c",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 7,
  },
  infoLabel: {
    fontSize: 15,
    color: "#555",
    fontWeight: "600",
    marginLeft: 8,
    width: 80, // cố định để căn lề trái đẹp
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right", // căn phải
    marginRight: 4,
  },
  infoValueBold: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    flex: 1,
    textAlign: "right",
    marginRight: 4,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  statusActive: { backgroundColor: "#e8f5e9" },
  statusInactive: { backgroundColor: "#ffebee" },
  statusText: { color: "#2e7d32", fontWeight: "bold", fontSize: 13 },
  actionButtons: { flexDirection: "row", gap: 14 },
  editButton: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 14,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 14,
    elevation: 3,
  },

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
    elevation: 12,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: { fontSize: 19, color: "#95a5a6", marginTop: 20, fontWeight: "600" },
  emptySubText: {
    fontSize: 15,
    color: "#888",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default ProductScreen;