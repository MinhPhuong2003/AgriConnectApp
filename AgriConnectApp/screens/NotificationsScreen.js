import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Giả lập dữ liệu (sau này thay bằng Firestore)
  const mockNotifications = [
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
      title: "Sản phẩm bạn quan tâm đã có hàng",
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

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        setNotifications(mockNotifications);
        setLoading(false);
        return;
      }

      // === TƯƠNG LAI: LẤY TỪ FIRESTORE ===
      // const snapshot = await firestore()
      //   .collection("notifications")
      //   .where("userId", "==", user.uid)
      //   .orderBy("createdAt", "desc")
      //   .get();

      // const list = snapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data(),
      //   time: formatTime(doc.data().createdAt),
      // }));

      // setNotifications(list);

      // === HIỆN TẠI: DÙNG MOCK DATA ===
      setNotifications(mockNotifications);
    } catch (error) {
      console.log("Lỗi tải thông báo:", error);
      setNotifications(mockNotifications); // fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const getIcon = (type) => {
    switch (type) {
      case "order":
        return "receipt-outline";
      case "promotion":
        return "pricetag-outline";
      case "restock":
        return "leaf-outline";
      case "message":
        return "chatbubble-outline";
      default:
        return "notifications-outline";
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "order":
        return "#e67e22";
      case "promotion":
        return "#ff5722";
      case "restock":
        return "#4caf50";
      case "message":
        return "#2196f3";
      default:
        return "#2e7d32";
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => {
        // Xử lý khi nhấn thông báo
        if (!item.read) {
          // Đánh dấu đã đọc (tương lai: update Firestore)
        }
        // Điều hướng nếu cần
      }}
    >
      <View style={[styles.iconCircle, { backgroundColor: getColor(item.type) + "20" }]}>
        <Icon name={getIcon(item.type)} size={24} color={getColor(item.type)} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={{
              uri: "https://cdni.iconscout.com/illustration/premium/thumb/no-notification-4593290-3804156.png",
            }}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
          <Text style={styles.emptySubtitle}>Chúng tôi sẽ thông báo khi có tin mới!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />
          }
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#2ecc71",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    position: "relative",
  },
  unreadCard: {
    backgroundColor: "#f8fff8",
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  unreadText: {
    fontWeight: "bold",
    color: "#2e7d32",
  },
  message: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e74c3c",
    position: "absolute",
    top: 16,
    right: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyContainer: {  // ← Sửa đúng tên
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
});