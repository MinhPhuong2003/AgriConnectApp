import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";

const HomeBuyer = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("Tất cả mùa");
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = firestore().collection("products");
        const snapshot = await productsRef.get();

        // Nếu Firestore trống -> seed dữ liệu mẫu (chỉ 1 lần)
        if (snapshot.empty) {
          const sampleProducts = [
            {
              name: "Xoài cát Hòa Lộc",
              imageUrl:
                "https://images.unsplash.com/photo-1627308595121-766c3c4936ec?auto=format&fit=crop&w=800&q=60",
              isAvailable: true,
              season: "Hạ",
              location: "Tiền Giang",
            },
            {
              name: "Thanh long ruột đỏ",
              imageUrl:
                "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=800&q=60",
              isAvailable: true,
              season: "Hạ",
              location: "Bình Thuận",
            },
            {
              name: "Khoai lang tím",
              imageUrl:
                "https://images.unsplash.com/photo-1604908177224-6172a427a2d2?auto=format&fit=crop&w=800&q=60",
              isAvailable: false,
              season: "Đông",
              location: "Ninh Thuận",
            },
          ];

          for (const p of sampleProducts) {
            await productsRef.add(p);
          }
          console.log("✅ Đã thêm dữ liệu mẫu thành công!");
        }

        // Tải dữ liệu
        const newSnapshot = await productsRef.get();
        const list = newSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(list);
      } catch (error) {
        console.error("❌ Lỗi khi tải sản phẩm:", error);
      }
    };

    fetchProducts();
  }, []);

  // Các lựa chọn mùa
  const seasons = ["Tất cả mùa", "Xuân", "Hạ", "Thu", "Đông"];

  // Lọc sản phẩm theo mùa + tìm kiếm
  const filteredProducts = products.filter((item) => {
    const matchesQuery = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason =
      selectedSeason === "Tất cả mùa" ? true : item.season === selectedSeason;
    return matchesQuery && matchesSeason;
  });

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productStatus}>
        {item.isAvailable ? "Available" : "Out of season"}
      </Text>
      <Text style={styles.productMeta}>
        {item.season ? `Mùa: ${item.season}` : ""}{" "}
        {item.location ? `• ${item.location}` : ""}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>AgriConnect</Text>
        <View style={styles.cartWrapper}>
          <Icon
            name="cart-outline"
            size={28}
            color="#fff"
            onPress={() => navigation.navigate("Cart")}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>
      </View>

      {/* Greeting */}
      <Text style={styles.greeting}>Hello, Buyer 👋</Text>

      {/* Search */}
      <View style={styles.searchBox}>
        <Icon name="search-outline" size={20} color="#999" />
        <TextInput
          placeholder="Search for products"
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Season Picker */}
      <View style={styles.seasonRow}>
        <Text style={styles.sectionTitle}>Products of the season</Text>
        <TouchableOpacity
          style={styles.seasonButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.seasonText}>{selectedSeason} ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Modal chọn mùa */}
      <Modal transparent visible={isModalVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalBox}>
            {seasons.map((season) => (
              <TouchableOpacity
                key={season}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSeason(season);
                  setModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalText,
                    selectedSeason === season && {
                      fontWeight: "bold",
                      color: "#2e7d32",
                    },
                  ]}
                >
                  {season}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Products */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Không có sản phẩm phù hợp.</Text>
          </View>
        }
      />

      {/* Nearby map */}
      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Nearby</Text>
      <View style={styles.mapBox}>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate("Map")}
        >
          <Text style={styles.mapButtonText}>View map</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <Icon name="home" size={26} color="#2e7d32" />
        <Icon
          name="chatbubble-outline"
          size={26}
          color="#777"
          onPress={() => navigation.navigate("Chat")}
        />
        <Icon
          name="location-outline"
          size={26}
          color="#777"
          onPress={() => navigation.navigate("Map")}
        />
        <Icon
          name="cart-outline"
          size={26}
          color="#777"
          onPress={() => navigation.navigate("Cart")}
        />
        <Icon
          name="person-outline"
          size={26}
          color="#777"
          onPress={() => navigation.navigate("Profile")}
        />
      </View>
    </View>
  );
};

export default HomeBuyer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  logo: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  cartWrapper: { position: "relative" },
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: "red",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  greeting: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchInput: { marginLeft: 8, fontSize: 16, flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
  seasonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seasonButton: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  seasonText: { color: "#2e7d32", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalItem: { paddingVertical: 10 },
  modalText: { fontSize: 16, textAlign: "center" },
  productCard: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    alignItems: "center",
    padding: 12,
    margin: 5,
  },
  productImage: { width: 80, height: 80, marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: "bold" },
  productStatus: { fontSize: 14, color: "gray" },
  productMeta: { fontSize: 12, color: "#666", marginTop: 6 },
  mapBox: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  mapButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mapButtonText: { color: "#fff", fontWeight: "bold" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  emptyBox: { padding: 20, alignItems: "center" },
  emptyText: { color: "#555" },
});
