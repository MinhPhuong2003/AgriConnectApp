import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/Ionicons";

const formatPrice = (price) => {
  return Number(price || 0).toLocaleString("vi-VN");
};

const ProductScreen = ({ navigation }) => {
  const [myProducts, setMyProducts] = useState([]);
  const userId = auth().currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
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
        },
        (error) => {
          console.error("Lỗi tải sản phẩm:", error);
          Alert.alert("Lỗi", "Không thể tải danh sách sản phẩm");
        }
      );

    return () => unsubscribe();
  }, [userId]);

  const handleDelete = (id, productName) => {
    Alert.alert(
      "Xóa sản phẩm",
      `Xóa "${productName}" khỏi danh sách?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore().collection("products").doc(id).delete();
              Alert.alert("Thành công", "Đã xóa sản phẩm!");
            } catch (error) {
              console.error(error);
              Alert.alert("Lỗi", "Không thể xóa sản phẩm");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <Image
          source={{
            uri:
              item.imageBase64 ||                    // Ưu tiên base64 (từ AddProduct mới)
              item.imageUrl ||                       // Cũ vẫn hỗ trợ
              "https://cdn-icons-png.flaticon.com/512/415/415733.png",
          }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.price}>
            {formatPrice(item.price)}đ/{item.unit}
          </Text>
          <Text style={styles.detail}>Mùa: {item.season || "Không rõ"}</Text>
          <Text style={styles.stock}>
            Còn: {item.stock || 0} {item.unit}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Nút Sửa & Xóa */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("EditProduct", { product: item })}
        >
          <Icon name="create-outline" size={24} color="#2e7d32" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Icon name="trash-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NÔNG SẢN CỦA TÔI</Text>
      </View>

      {/* Danh sách sản phẩm */}
      {myProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/4202/4202843.png",
            }}
            style={{ width: 120, height: 120, opacity: 0.7 }}
          />
          <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
          <Text style={{ color: "#888", marginTop: 8, textAlign: "center" }}>
            Nhấn nút dấu cộng để thêm sản phẩm đầu tiên nhé!
          </Text>
        </View>
      ) : (
        <FlatList
          data={myProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Nút thêm sản phẩm nổi */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddProduct")}
      >
        <Icon name="add" size={34} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ProductScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingTop: 40,
    elevation: 6,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginVertical: 7,
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
  },
  image: {
    width: 85,
    height: 85,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  price: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#27ae60",
    marginTop: 5,
  },
  detail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 3,
  },
  stock: {
    fontSize: 14,
    color: "#e67e22",
    fontWeight: "600",
    marginTop: 4,
  },
  actionButtons: {
    justifyContent: "center",
    gap: 18,
  },
  editButton: {
    backgroundColor: "#e8f5e9",
    padding: 10,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 19,
    color: "#95a5a6",
    marginTop: 20,
    fontWeight: "600",
  },
  addButton: {
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
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});