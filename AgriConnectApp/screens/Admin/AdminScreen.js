import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const AdminScreen = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          auth().signOut();
          navigation.replace("AuthFlow");
        },
      },
    ]);
  };

  const menuItems = [
    {
      title: "Quản lý người dùng",
      icon: "people-outline",
      screen: "UserManagement",
      color: "#3498db",
    },
    {
      title: "Xét duyệt nông dân",
      icon: "checkmark-circle-outline",
      screen: "VerifyFarmer",
      color: "#f1c40f",
    },
    {
      title: "Quản lý Slider",
      icon: "images-outline",
      screen: "SliderManagement",
      color: "#e67e22",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
            style={styles.avatar}
          />
          <Text style={styles.greeting}>Xin chào, Quản trị viên!</Text>
          <Text style={styles.appName}>TRUNG TÂM QUẢN TRỊ</Text>
          <Text style={styles.subText}>NÔNG SẢN XANH</Text>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { borderLeftColor: item.color }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + "22" }]}>
                <Icon name={item.icon} size={32} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Icon name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fff8",
  },
  header: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#27ae60",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginTop: 8,
    letterSpacing: 1,
  },
  subText: {
    fontSize: 16,
    color: "#dfffe7",
    marginTop: 4,
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderLeftWidth: 6,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#2c3e50",
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    marginHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginVertical: 30,
    elevation: 10,
  },
  logoutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});