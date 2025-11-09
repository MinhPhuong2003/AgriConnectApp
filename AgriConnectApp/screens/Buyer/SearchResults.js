import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";

// Tính khoảng cách bằng công thức Haversine (đơn vị: km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return isNaN(distance) ? 0 : distance;
};

const toRad = (value) => (value * Math.PI) / 180;

const SearchResults = ({ navigation, route }) => {
  const { searchQuery: initialSearchQuery, selectedCoords } = route.params || {};
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "");

  // Cập nhật lịch sử khi searchQuery thay đổi
  useEffect(() => {
    if (searchQuery && searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      setSearchHistory((prev) => [searchQuery, ...prev.slice(0, 4)]);
    }
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate("PickupLocation", {
        searchQuery: searchQuery,
        selectedCoords: selectedCoords,
      });
    } else {
      Alert.alert("Lỗi", "Vui lòng nhập từ khóa tìm kiếm.");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        setSearchQuery(item);
        navigation.navigate("PickupLocation", {
          searchQuery: item,
          selectedCoords: selectedCoords,
        });
      }}
    >
      <Icon name="time-outline" size={18} color="#555" style={styles.historyIcon} />
      <Text style={styles.historyText} numberOfLines={1}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={18} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Nhập địa chỉ..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>
        <Text style={styles.sectionTitle}>LỊCH SỬ TÌM KIẾM</Text>
        <FlatList
          data={searchHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>Không có lịch sử</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, backgroundColor: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    zIndex: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    minHeight: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    textAlign: "left",
    includeFontPadding: false,
    padding: 0,
  },
  sectionTitle: {
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontWeight: "600",
    color: "#d32f2f",
    fontSize: 13,
  },
  list: { padding: 10 },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    borderWidth: 0.3,
    borderColor: "#eee",
  },
  historyIcon: {
    marginRight: 10,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  emptyText: { textAlign: "center", color: "#777", fontSize: 14, padding: 20 },
});

export default SearchResults;