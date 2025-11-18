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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const cartRef = firestore().collection("carts").doc(user.uid);

    const unsubscribe = cartRef.onSnapshot((doc) => {
      if (doc.exists && doc.data().preorders) {
        setPreorders(doc.data().preorders || []);
      } else {
        setPreorders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const removePreorder = (id) => {
    Alert.alert(
      "Xóa đặt trước",
      "Bạn có chắc muốn bỏ đặt trước sản phẩm này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const user = auth().currentUser;
            if (!user) return;

            const cartRef = firestore().collection("carts").doc(user.uid);
            await cartRef.update({
              preorders: firestore.FieldValue.arrayRemove(
                preorders.find((item) => item.id === id)
              ),
            });
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl || PLACEHOLDER }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.season}>Mùa: {item.season}</Text>
        {item.estimatedHarvest && (
          <Text style={styles.harvest}>
            Dự kiến thu hoạch: {item.estimatedHarvest}
          </Text>
        )}
        <Text style={styles.price}>
          {new Intl.NumberFormat("vi-VN").format(item.price)}đ
        </Text>
        <Text style={styles.quantity}>Số lượng: {item.quantity}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removePreorder(item.id)}
      >
        <Icon name="trash-outline" size={22} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sản phẩm đặt trước</Text>
        <Text style={styles.subtitle}>
          {preorders.length > 0
            ? `Bạn đang đặt trước ${preorders.length} sản phẩm`
            : "Chưa có sản phẩm nào"}
        </Text>
      </View>

      {loading ? (
        <Text>Đang tải...</Text>
      ) : preorders.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="time-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Bạn chưa đặt trước sản phẩm nào</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.shopBtnText}>Xem sản phẩm đang mùa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={preorders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#ff9800",
    padding: 20,
    paddingTop: 50,
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff9", marginTop: 6 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
    alignItems: "center",
  },
  image: { width: 80, height: 80, borderRadius: 12 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "bold", color: "#333" },
  season: { fontSize: 13, color: "#2e7d32", fontWeight: "600", marginTop: 4 },
  harvest: { fontSize: 13, color: "#e67e22", marginTop: 2 },
  price: { fontSize: 16, fontWeight: "bold", color: "#e67e22", marginTop: 6 },
  quantity: { fontSize: 13, color: "#777", marginTop: 4 },
  removeBtn: { padding: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { marginTop: 16, fontSize: 16, color: "#777" },
  shopBtn: {
    marginTop: 20,
    backgroundColor: "#2e7d32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  shopBtnText: { color: "#fff", fontWeight: "bold" },
});

export default PreorderScreen;