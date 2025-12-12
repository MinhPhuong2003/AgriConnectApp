import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const totalUsers = users.length;
  const farmerCount = users.filter((u) => u.role === "farmer").length;
  const buyerCount = totalUsers - farmerCount;

  const fetchUsers = async () => {
    try {
      const snapshot = await firestore().collection("users").get();
      const list = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const uid = doc.id;
        if (data.role === "admin") continue;

        let displayName = "Chưa đặt tên";
        let photoURL = null;

        if (data.name?.trim()) displayName = data.name;
        else if (data.displayName?.trim()) displayName = data.displayName;

        if (data.photoBase64 && typeof data.photoBase64 === "string") {
          photoURL = data.photoBase64.startsWith("data:image")
            ? data.photoBase64
            : `data:image/jpeg;base64,${data.photoBase64}`;
        } else if (data.photoURL) photoURL = data.photoURL;

        if (displayName === "Chưa đặt tên" || !photoURL) {
          try {
            const locSnap = await firestore()
              .collection("users")
              .doc(uid)
              .collection("location")
              .limit(1)
              .get();
            if (!locSnap.empty) {
              const loc = locSnap.docs[0].data();
              if (displayName === "Chưa đặt tên" && loc.name) displayName = loc.name;
              if (!photoURL && loc.photoBase64)
                photoURL = loc.photoBase64.startsWith("data:image")
                  ? loc.photoBase64
                  : `data:image/jpeg;base64,${loc.photoBase64}`;
            }
          } catch (e) {}
        }

        list.push({
          id: uid,
          displayName,
          photoURL,
          email: data.email || "",
          role: data.role || "buyer",
          status: data.status || "active",
        });
      }
      setUsers(list);
      applyFilter(list, search, filterRole);
    } catch (error) {
      // Alert.alert("Lỗi", "Không thể tải danh sách người dùng");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const unsub = navigation.addListener("focus", fetchUsers);
    return () => unsub();
  }, [navigation]);

  const applyFilter = (userList, query, role) => {
    let result = userList;

    if (query.trim()) {
      result = result.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (role === "farmer") result = result.filter((u) => u.role === "farmer");
    else if (role === "buyer") result = result.filter((u) => u.role !== "farmer");

    setFilteredUsers(result);
  };

  useEffect(() => {
    applyFilter(users, search, filterRole);
  }, [search, filterRole, users]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.status === "blocked" && styles.blockedCard]}>
      <Image
        source={{
          uri: item.photoURL || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        }}
        style={styles.avatar}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.displayName}</Text>
        <Text style={styles.email}>{item.email}</Text>

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.roleBadge,
              item.role === "farmer" ? styles.farmerBadge : styles.buyerBadge,
            ]}
          >
            <Icon
              name={item.role === "farmer" ? "leaf" : "cart"}
              size={16}
              color="#fff"
            />
            <Text style={styles.roleText}>
              {item.role === "farmer" ? "Nông dân" : "Người mua"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>QUẢN LÝ NGƯỜI DÙNG</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Icon name="search" size={20} color="#888" />
        <TextInput
          placeholder="Tìm tên hoặc email..."
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, marginLeft: 12, fontSize: 16 }}
          placeholderTextColor="#888"
        />
      </View>

      {/* Thanh lọc nhỏ gọn */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, filterRole === "all" && styles.filterBtnActive]}
          onPress={() => setFilterRole("all")}
        >
          <Text style={[styles.filterLabel, filterRole === "all" && styles.filterLabelActive]}>
            Tất cả ({totalUsers})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filterRole === "farmer" && styles.filterBtnActive]}
          onPress={() => setFilterRole("farmer")}
        >
          <Text style={[styles.filterLabel, filterRole === "farmer" && styles.filterLabelActive]}>
            Nông dân ({farmerCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filterRole === "buyer" && styles.filterBtnActive]}
          onPress={() => setFilterRole("buyer")}
        >
          <Text style={[styles.filterLabel, filterRole === "buyer" && styles.filterLabelActive]}>
            Người mua ({buyerCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#27ae60"]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="people-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {search || filterRole !== "all" ? "Không tìm thấy" : "Không có người dùng"}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
};

export default UserManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: "#27ae60",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 50,
    elevation: 4,
  },
  // Thanh lọc nhỏ gọn hơn
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
  },
  filterBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,        // Giảm chiều cao
    paddingHorizontal: 8,
    borderRadius: 20,          // Bo tròn nhẹ hơn
    marginHorizontal: 4,
  },
  filterBtnActive: {
    backgroundColor: "#27ae60",
  },
  filterLabel: {
    fontSize: 13.5,            // Chữ nhỏ hơn
    fontWeight: "600",
    color: "#555",
  },
  filterLabelActive: {
    color: "#fff",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    elevation: 5,
  },
  blockedCard: { backgroundColor: "#fdf2f2" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#27ae60",
  },
  infoContainer: { flex: 1, marginLeft: 16 },
  name: { fontSize: 18, fontWeight: "bold", color: "#2c3e50" },
  email: { fontSize: 14, color: "#7f8c8d", marginTop: 2 },
  bottomRow: {
    marginTop: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  farmerBadge: { backgroundColor: "#27ae60" },
  buyerBadge: { backgroundColor: "#3498db" },
  roleText: { color: "#fff", marginLeft: 6, fontWeight: "600", fontSize: 14 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 17, color: "#999" },
});