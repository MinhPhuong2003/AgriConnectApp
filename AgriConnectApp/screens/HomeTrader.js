import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/Ionicons";

const HomeTrader = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("orders")
      .where("status", "in", ["pending", "confirmed", "shipped"])
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrders(data);
      });
    return () => unsubscribe();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { color: "#FF9800", label: "⏳ Chờ xác nhận" };
      case "confirmed":
        return { color: "#4CAF50", label: "✅ Đã xác nhận" };
      case "shipped":
        return { color: "#2196F3", label: "🚚 Đang giao hàng" };
      default:
        return { color: "#999", label: "❔ Không xác định" };
    }
  };

  const renderItem = ({ item }) => {
    const statusInfo = getStatusStyle(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="cube-outline" size={22} color="#4CAF50" />
          <Text style={styles.cardTitle}>Đơn #{item.id.slice(0, 6)}</Text>
        </View>
        <Text style={styles.detail}>👨‍🌾 Người bán: {item.sellerId}</Text>
        <Text style={styles.detail}>💵 Tổng tiền: {item.totalAmount} đ</Text>
        <Text style={[styles.status, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Đơn hàng đang giao dịch</Text>
        <Icon name="refresh" size={24} color="#fff" />
      </View>

      {/* Danh sách */}
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="file-tray-outline" size={60} color="#bbb" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
};

export default HomeTrader;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#388E3C",
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  card: {
    backgroundColor: "#f8fdf8",
    padding: 14,
    margin: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  cardTitle: { marginLeft: 8, fontWeight: "bold", fontSize: 16 },
  detail: { color: "#555", fontSize: 13, marginBottom: 4 },
  status: { fontWeight: "bold", marginTop: 4 },
  emptyBox: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#777", marginTop: 8 },
});
