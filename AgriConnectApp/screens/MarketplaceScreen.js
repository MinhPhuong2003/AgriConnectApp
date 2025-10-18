// screens/Marketplace.js
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

const MarketplaceScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("Tất cả mùa");
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = firestore().collection("products");
        const snapshot = await productsRef.get();
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(list);
      } catch (error) {
        console.error("❌ Lỗi khi tải sản phẩm:", error);
      }
    };

    fetchProducts();
  }, []);

  const seasons = ["Tất cả mùa", "Xuân", "Hạ", "Thu", "Đông"];

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
        source={{ uri: item.imageUrl || "https://cdn-icons-png.flaticon.com/512/415/415733.png" }}
        style={styles.productImage}
      />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productMeta}>
        {item.season ? `Mùa: ${item.season}` : ""}{" "}
        {item.region ? `• ${item.region}` : ""}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Icon name="search-outline" size={20} color="#999" />
        <TextInput
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Season Picker */}
      <View style={styles.seasonRow}>
        <Text style={styles.sectionTitle}>Sản phẩm theo mùa</Text>
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

      {/* Product list */}
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
    </View>
  );
};

export default MarketplaceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: { marginLeft: 8, fontSize: 16, flex: 1 },
  seasonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
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
  productMeta: { fontSize: 12, color: "#666", marginTop: 4 },
  emptyBox: { padding: 20, alignItems: "center" },
  emptyText: { color: "#555" },
});
