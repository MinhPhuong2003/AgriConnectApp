import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = auth().currentUser;
    setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.replace("AuthFlow");
    } catch (error) {
      console.error("❌ Lỗi khi đăng xuất:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => console.log("Cài đặt")}>
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              user?.photoURL ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.displayName || "Người dùng"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Info Section */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Icon name="call-outline" size={20} color="#2e7d32" />
          <Text style={styles.infoText}>+84 912 345 678</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="location-outline" size={20} color="#2e7d32" />
          <Text style={styles.infoText}>Ninh Thuận, Việt Nam</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  avatarContainer: { alignItems: "center", marginTop: 20, marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "bold" },
  email: { fontSize: 14, color: "#777" },
  infoBox: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: { marginLeft: 10, fontSize: 16, color: "#333" },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#d32f2f",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  logoutText: { color: "#fff", fontWeight: "bold", marginLeft: 8, fontSize: 16 },
});
