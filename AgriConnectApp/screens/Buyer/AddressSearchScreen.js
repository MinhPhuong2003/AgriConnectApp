import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_SEARCHES_KEY = "recent_addresses";

const AddressSearchScreen = ({ navigation, route }) => {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (data) {
        setRecentSearches(JSON.parse(data).slice(0, 5));
      }
    } catch (error) {
      console.log("Lỗi tải tìm kiếm gần đây:", error);
    }
  };

  const saveRecentSearch = async (address) => {
    try {
      let updated = recentSearches.filter((item) => item !== address);
      updated.unshift(address);
      updated = updated.slice(0, 5);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      console.log("Lỗi lưu tìm kiếm gần đây:", error);
    }
  };

  const searchAddress = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=5&countrycodes=vn`;
      const res = await fetch(url, {
        headers: { "User-Agent": "ReactNativeApp/1.0" },
      });
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.log("Lỗi tìm kiếm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchAddress(searchText);
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  const handleSelect = async (item) => {
    const fullAddress = item.display_name;
    const coords = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };

    await saveRecentSearch(fullAddress);
    Keyboard.dismiss();
    console.log("AddressSearch - Navigating to MapPicker with:", { coords, fullAddress });
    navigation.navigate("MapPicker", {
      initialCoords: coords,
      initialAddress: fullAddress,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
      <Icon name="location-outline" size={20} color="#d32f2f" />
      <View style={styles.resultText}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.display_name.split(", ").slice(0, 2).join(", ")}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {item.display_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => {
        setSearchText(item);
        searchAddress(item);
      }}
    >
      <Icon name="time-outline" size={18} color="#999" />
      <Text style={styles.recentText} numberOfLines={1}>
        {item}
      </Text>
      <TouchableOpacity
        onPress={async () => {
          const updated = recentSearches.filter((i) => i !== item);
          setRecentSearches(updated);
          await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        }}
      >
        <Icon name="close" size={18} color="#ccc" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const goBackToMapPicker = () => {
    navigation.navigate("MapPicker");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBackToMapPicker} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập địa chỉ của bạn"
          value={searchText}
          onChangeText={setSearchText}
          autoFocus
          returnKeyType="search"
        />
      </View>
      <View style={styles.content}>
        {searchText.trim() === "" ? (
          <>
            <Text style={styles.sectionTitle}>TÌM KIẾM GẦN ĐÂY</Text>
            {recentSearches.length > 0 ? (
              <FlatList
                data={recentSearches}
                keyExtractor={(item) => item}
                renderItem={renderRecentItem}
                style={styles.recentList}
              />
            ) : (
              <Text style={styles.emptyText}>Chưa có tìm kiếm gần đây</Text>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#d32f2f" />
            ) : suggestions.length > 0 ? (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.place_id.toString()}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <Text style={styles.emptyText}>Không tìm thấy địa chỉ</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  backBtn: { padding: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginLeft: 8,
  },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  recentList: { marginTop: 4 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  recentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#333",
  },
  resultItem: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  resultText: { marginLeft: 12, flex: 1 },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  resultSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
    fontSize: 15,
  },
});

export default AddressSearchScreen;