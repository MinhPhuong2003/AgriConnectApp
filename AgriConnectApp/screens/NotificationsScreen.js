import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  SectionList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const NotificationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const generalNotifications = [
    {
      id: "1",
      title: "Đơn hàng #123 đã được giao",
      message: "Đơn hàng của bạn đã được giao thành công. Vui lòng đánh giá!",
      time: "2 phút trước",
      read: false,
      type: "order",
    },
    {
      id: "2",
      title: "Khuyến mãi mới!",
      message: "Giảm 20% cho tất cả rau củ hữu cơ từ hôm nay!",
      time: "1 giờ trước",
      read: false,
      type: "promotion",
    },
    {
      id: "3",
      title: "Sản phẩm bạn quan tâm Pinnacle",
      message: "Cà chua hữu cơ đã được nhập kho mới.",
      time: "3 giờ trước",
      read: true,
      type: "restock",
    },
    {
      id: "4",
      title: "Tin nhắn từ người bán",
      message: "Chào bạn, khoai lang tím đã sẵn sàng giao nhé!",
      time: "1 ngày trước",
      read: true,
      type: "message",
    },
  ];

  const orderUpdates = [
    {
      id: "o1",
      title: "Đơn hàng #468647JTP9K0 đã được giao.",
      message: "Bạn hãy giữ sản phẩm trước ngày 20-07-2024 để được nhận 300 xu và giúp người khác hiểu hơn về sản phẩm nhé!",
      time: "08:49 17-07-2024",
    },
    {
      id: "o2",
      title: "Đơn hàng #863647JTP9K0 đã được giao.",
      message: "Bạn hãy giữ sản phẩm trước ngày 10-07-2024 để được nhận 300 xu và giúp người khác hiểu hơn về sản phẩm nhé!",
      time: "08:49 17-07-2024",
    },
  ];

  const sections = [
    { title: null, data: generalNotifications },
    { title: "Cập nhật đơn hàng", data: orderUpdates, showViewAll: true },
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getIcon = (type) => {
    switch (type) {
      case "order": return "receipt-outline";
      case "promotion": return "pricetag-outline";
      case "restock": return "leaf-outline";
      case "message": return "chatbubble-outline";
      default: return "notifications-outline";
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "order": return "#e67e22";
      case "promotion": return "#ff5722";
      case "restock": return "#4caf50";
      case "message": return "#2196f3";
      default: return "#2ecc71";
    }
  };

  const renderGeneralItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard,
        index === 0 && styles.firstNotificationCard,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: getColor(item.type) + "20" }]}>
        <Icon name={getIcon(item.type)} size={24} color={getColor(item.type)} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity style={styles.orderItem}>
      <View style={styles.orderImagePlaceholder}>
        <Icon name="cube-outline" size={32} color="#aaa" />
      </View>
      <View style={styles.orderContent}>
        <Text style={styles.orderTitle}>{item.title}</Text>
        <Text style={styles.orderMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.orderTime}>{item.time}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#ddd" />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => {
    if (!section.title) return null;

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.showViewAll && (
          <Text style={styles.viewAllText}>Xem tất cả (5)</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header có nút back */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 26 }} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section, index }) => {
          if (section.title === null) {
            return renderGeneralItem({ item, index });
          } else {
            return renderOrderItem({ item });
          }
        }}
        renderSectionHeader={renderSectionHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2ecc71"]} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    backgroundColor: "#2ecc71",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
  },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#333" },
  viewAllText: { fontSize: 13, color: "#27ae60", fontWeight: "600" },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: "relative",
  },
  firstNotificationCard: {
    marginTop: 4,
  },
  unreadCard: {
    backgroundColor: "#f8fff8",
    borderLeftWidth: 4,
    borderLeftColor: "#2ecc71",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", color: "#333" },
  unreadText: { fontWeight: "bold", color: "#2ecc71" },
  message: { fontSize: 13, color: "#666", marginTop: 4, lineHeight: 18 },
  time: { fontSize: 12, color: "#999", marginTop: 6 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e74c3c",
    position: "absolute",
    top: 16,
    right: 16,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 1,
  },
  orderImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orderContent: { flex: 1 },
  orderTitle: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 4 },
  orderMessage: { fontSize: 13.5, color: "#666", lineHeight: 19, marginBottom: 6 },
  orderTime: { fontSize: 12, color: "#999" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});