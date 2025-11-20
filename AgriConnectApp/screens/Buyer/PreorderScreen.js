import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/Ionicons";

const PLACEHOLDER = "https://cdn-icons-png.flaticon.com/512/4202/4202843.png";

const PreorderScreen = ({ navigation }) => {
  const [preorders, setPreorders] = useState([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection("carts")
      .doc(user.uid)
      .onSnapshot((doc) => {
        if (doc.exists && doc.data()?.preorders) {
          const list = [...doc.data().preorders].sort(
            (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
          );
          setPreorders(list);
        } else {
          setPreorders([]);
        }
      });

    return () => unsubscribe();
  }, []);

  const removePreorder = (id) => {
    Alert.alert("Xóa đặt trước", "Bỏ đặt trước sản phẩm này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const user = auth().currentUser;
          if (!user) return;

          const cartRef = firestore().collection("carts").doc(user.uid);

          try {
            setPreorders((prev) => prev.filter((item) => item.id !== id));

            await firestore().runTransaction(async (transaction) => {
              const doc = await transaction.get(cartRef);
              if (!doc.exists) throw "Không tìm thấy giỏ hàng!";

              const currentPreorders = doc.data().preorders || [];
              const newPreorders = currentPreorders.filter((item) => item.id !== id);

              transaction.update(cartRef, { preorders: newPreorders });
            });
          } catch (error) {
            console.error("Lỗi xóa đặt trước:", error);
            Alert.alert("Lỗi", "Không thể xóa ngay bây giờ, vui lòng thử lại sau ít phút.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl || PLACEHOLDER }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.season}>Mùa vụ: {item.season}</Text>
        <Text style={styles.harvest}>Dự kiến: {item.estimatedHarvest}</Text>
        <Text style={styles.price}>
          {new Intl.NumberFormat("vi-VN").format(item.price)}đ
        </Text>
        <Text style={styles.quantity}>Số lượng: {item.quantity}</Text>
      </View>

      <TouchableOpacity style={styles.removeBtn} onPress={() => removePreorder(item.id)}>
        <Icon name="trash-outline" size={26} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đơn đặt trước mùa vụ</Text>
      </View>

      {preorders.length > 0 && (
        <View style={styles.countWrapper}>
          <Text style={styles.countText}>
            Bạn đang chờ <Text style={styles.highlight}>{preorders.length}</Text> sản phẩm vào mùa
          </Text>
        </View>
      )}

      {preorders.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="time-outline" size={90} color="#ccc" />
          <Text style={styles.emptyText}>Bạn chưa đặt trước sản phẩm nào</Text>
        </View>
      ) : (
        <FlatList
          data={preorders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { backgroundColor: "#27ae60", paddingTop: 40, paddingBottom: 12, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  countWrapper: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: "#e8f5e9", alignItems: "center" },
  countText: { fontSize: 15.5, color: "#2e7d32", fontWeight: "600" },
  highlight: { fontWeight: "bold", color: "#27ae60", fontSize: 17 },
  listContainer: { padding: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  image: { width: 90, height: 90, borderRadius: 14, backgroundColor: "#f0f0f0" },
  info: { flex: 1, marginLeft: 16, justifyContent: "center" },
  name: { fontSize: 17, fontWeight: "bold", color: "#2c3e50" },
  season: { fontSize: 14, color: "#27ae60", fontWeight: "bold", marginTop: 6 },
  harvest: { fontSize: 13.5, color: "#27ae60", marginTop: 4 },
  price: { fontSize: 18, fontWeight: "bold", color: "#27ae60", marginTop: 8 },
  quantity: { fontSize: 13, color: "#7f8c8d", marginTop: 4 },
  removeBtn: { justifyContent: "center", paddingLeft: 10 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyText: { marginTop: 20, fontSize: 17, color: "#95a5a6", textAlign: "center" },
});

export default PreorderScreen;