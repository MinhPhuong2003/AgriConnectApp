import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const OrderSuccessScreen = ({ navigation, route }) => {
  const { items, orderId } = route.params || {};

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: "https://example.com/confetti-background.jpg" }}
        style={styles.background}
      >
        <View style={styles.content}>
          <View style={styles.checkIcon}>
            <Icon name="checkmark-circle" size={80} color="#2e7d32" />
          </View>
          <Text style={styles.title}>Thành công</Text>
          <Text style={styles.subtitle}>Đơn hàng của bạn đã được đặt thành công</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate("OrderDetail", { orderId, items })}
          >
            <Text style={styles.buttonText}>Chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("HomeBuyer")}
          >
            <Text style={styles.buttonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  background: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 150,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  checkIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  detailButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  homeButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OrderSuccessScreen;