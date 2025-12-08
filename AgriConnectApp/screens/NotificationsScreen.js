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
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const NotificationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generalNotifications, setGeneralNotifications] = useState([]);
  const [orderUpdates, setOrderUpdates] = useState([]);

  const currentUser = auth().currentUser;

  if (!currentUser) {
    return (
      <View style={styles.loggedOutContainer}>
        <Icon name="log-in-outline" size={60} color="#ccc" />
        <Text style={styles.loggedOutText}>Vui lòng đăng nhập để xem thông báo</Text>
      </View>
    );
  }

  const getImageSource = (item) => {
    if (item?.imageBase64) {
      return { uri: item.imageBase64 };
    }
    if (item?.imageUrl) {
      return { uri: item.imageUrl };
    }
    return { uri: "https://via.placeholder.com/80/E8F5E8/27ae60?text=Delivered" };
  };

  useEffect(() => {
    setLoading(true);

    const unsubGeneral = firestore()
      .collection("notifications")
      .where("userId", "==", currentUser.uid)
      .where("type", "!=", "order_delivered")
      .orderBy("type")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snap) => {
          if (!snap || snap.empty) {
            setGeneralNotifications([]);
            return;
          }
          const list = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }));
          setGeneralNotifications(list);
        },
        (err) => console.log("Lỗi thông báo chung:", err)
      );

    const unsubOrders = firestore()
      .collection("notifications")
      .where("userId", "==", currentUser.uid)
      .where("type", "==", "order_delivered")
      .orderBy("createdAt", "desc")
      .onSnapshot(async (snap) => {
        if (!snap || snap.empty) {
          setOrderUpdates([]);
          setLoading(false);
          return;
        }

        const updates = [];

        for (const doc of snap.docs) {
          const noti = doc.data();

          let firstItemImage = null;
          try {
            const orderSnap = await firestore()
              .collection("orders")
              .doc(noti.orderId)
              .get();

            if (orderSnap.exists) {
              const items = orderSnap.data()?.items || [];
              if (items.length > 0) {
                const firstItem = items[0];
                firstItemImage = firstItem.imageBase64 || firstItem.imageUrl || null;
              }
            }
          } catch (e) {
            console.log("Lỗi lấy ảnh đơn hàng:", e);
          }

          updates.push({
            id: doc.id,
            orderId: noti.orderId,
            title: `Đơn hàng ${noti.orderId} đã được giao thành công. Cảm ơn bạn đã mua sắm!`,
            imageData: firstItemImage,
            time: noti.createdAt?.toDate(),
            read: noti.read || false,
          });
        }

        setOrderUpdates(updates);
        setLoading(false);
      }, (err) => {
        console.log("Lỗi order updates:", err);
        setOrderUpdates([]);
        setLoading(false);
      });

    return () => {
      unsubGeneral();
      unsubOrders();
    };
  }, [currentUser]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const formatTime = (date) => {
    if (!date) return "Vừa xong";
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const renderGeneralItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={async () => {
        if (!item.read) {
          try {
            await firestore().collection("notifications").doc(item.id).update({ read: true });
          } catch (e) {}
        }
      }}
    >
      <View style={[styles.iconCircle, { backgroundColor: "#27ae6020" }]}>
        <Icon name="notifications-outline" size={24} color="#27ae60" />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={async () => {
        try {
          await firestore().collection("notifications").doc(item.id).update({ read: true });
        } catch (e) {}
        navigation.navigate("OrderDetail", { orderId: item.orderId });
      }}
    >
      <Image
        source={getImageSource({ imageBase64: item.imageData, imageUrl: item.imageData })}
        style={styles.orderImage}
        resizeMode="cover"
      />
      <View style={styles.orderContent}>
        <Text style={styles.orderTitle}>{item.title}</Text>
        <Text style={styles.orderIdText}>Mã đơn: {item.orderId}</Text>
        <Text style={styles.orderTime}>{formatTime(item.time)}</Text>
      </View>
      <Icon name="chevron-forward" size={22} color="#aaa" />
    </TouchableOpacity>
  );

  const sections = [
    { title: null, data: generalNotifications },
    { title: "Cập nhật đơn hàng", data: orderUpdates },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 30 }} />
        <Text style={styles.headerTitle}>THÔNG BÁO</Text>
        <View style={{ width: 30 }} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) => {
          if (!section.title) return renderGeneralItem({ item });
          return renderOrderItem({ item });
        }}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#27ae60"]} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="notifications-off-outline" size={70} color="#ddd" />
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loggedOutContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" },
  loggedOutText: { marginTop: 16, fontSize: 16, color: "#999" },
  header: { backgroundColor: "#27ae60", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 40, paddingBottom: 5 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#f8f9fa" },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#333" },
  notificationCard: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 5, padding: 14, borderRadius: 12, elevation: 2 },
  unreadCard: { backgroundColor: "#f8fff8", borderLeftWidth: 4, borderLeftColor: "#27ae60" },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", color: "#333" },
  unreadText: { fontWeight: "bold", color: "#27ae60" },
  message: { fontSize: 13.5, color: "#666", marginTop: 4, lineHeight: 19 },
  time: { fontSize: 12, color: "#999", marginTop: 6 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e74c3c", position: "absolute", top: 16, right: 16 },
  orderItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 12, elevation: 2 },
  orderImage: { width: 64, height: 64, borderRadius: 10, marginRight: 14 },
  orderContent: { flex: 1 },
  orderTitle: { fontSize: 15, fontWeight: "600", color: "#27ae60", marginBottom: 4 },
  orderIdText: { fontSize: 13, color: "#555", fontWeight: "500" },
  orderTime: { fontSize: 12, color: "#999", marginTop: 4 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { fontSize: 16, color: "#aaa", marginTop: 16 },
});