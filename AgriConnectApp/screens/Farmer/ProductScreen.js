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

const HomeFarmer = ({ navigation }) => {
  const [myProducts, setMyProducts] = useState([]);
  const userId = auth().currentUser.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("products")
      .where("sellerId", "==", userId)
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMyProducts(data);
      });
    return () => unsubscribe();
  }, []);

  const handleDelete = (id) => {
    Alert.alert("Xóa sản phẩm", "Bạn có chắc muốn xóa sản phẩm này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await firestore().collection("products").doc(id).delete();
            Alert.alert("✅ Đã xóa sản phẩm thành công!");
          } catch (error) {
            console.error(error);
            Alert.alert("❌ Lỗi khi xóa sản phẩm!");
          }
        },
      },
    ]);
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
              item.imageUrl ||
              "https://cdn-icons-png.flaticon.com/512/415/415733.png",
          }}
          style={styles.image}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.detail}>
            💰 {item.price} đ / {item.unit}
          </Text>
          <Text style={styles.detail}>🌾 Mùa: {item.season}</Text>
        </View>
      </TouchableOpacity>

      {/* Hai nút sửa / xóa */}
      <View style={styles.iconColumn}>
        <TouchableOpacity
          onPress={() => navigation.navigate("EditProduct", { product: item })}
        >
          <Icon name="create-outline" size={22} color="#4CAF50" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            firestore().collection("products").doc(item.id).delete()
          }
        >
          <Icon name="trash-outline" size={22} color="#E53935" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌿 Nông sản của tôi</Text>
        <Icon
          name="refresh"
          size={24}
          color="#fff"
          onPress={() => navigation.replace("HomeFarmer")}
        />
      </View>

      {/* Danh sách sản phẩm */}
      {myProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/4202/4202843.png",
            }}
            style={{ width: 100, height: 100, marginBottom: 10 }}
          />
          <Text style={styles.emptyText}>Chưa có sản phẩm nào 🥕</Text>
        </View>
      ) : (
        <FlatList
          data={myProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Nút thêm sản phẩm */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddProduct")}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeFarmer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    paddingTop: 40,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fdf8",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  image: { width: 70, height: 70, borderRadius: 10, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  detail: { fontSize: 13, color: "#555" },
  iconColumn: {
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
    height: 60,
  },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: "#777" },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#4CAF50",
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  actionButtons: {
    justifyContent: "space-between",
    alignItems: "center",
    height: 70,
    marginLeft: 10,
    gap: 10,
  },
  editButton: {
    backgroundColor: "#E8F5E9",
    padding: 6,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
    padding: 6,
    borderRadius: 8,
  },
});
