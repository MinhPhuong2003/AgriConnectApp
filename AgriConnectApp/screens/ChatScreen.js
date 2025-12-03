import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const PLACEHOLDER = "https://i.pravatar.cc/150";

const ChatScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth().currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection("chats")
      .where("participants", "array-contains", currentUserId)
      .orderBy("updatedAt", "desc")
      .onSnapshot(async (snapshot) => {
        const newChats = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const partnerId = data.participants.find((id) => id !== currentUserId);
          if (!partnerId) continue;

          let partnerName = "Người dùng";
          let partnerAvatar = null;
          try {
            const userSnap = await firestore().collection("users").doc(partnerId).get();
            if (userSnap.exists) {
              const u = userSnap.data();
              partnerName = u.name || "Người dùng";
              partnerAvatar = u.photoBase64 || u.photoURL || null;
            }
          } catch (e) {}

          newChats.push({
            chatId: doc.id,
            partnerId,
            partnerName,
            partnerAvatar,
            lastMessage: data.lastMessage || "Bắt đầu trò chuyện",
            updatedAt: data.updatedAt?.toDate() || null,
            productImage: data.productImage || PLACEHOLDER,
            unreadCount: data.unreadCount?.[currentUserId] || 0,
          });
        }

        setChats(newChats);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [currentUserId]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diff = now - date;

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        navigation.navigate("ChatDetail", {
          chatId: item.chatId,
          partnerId: item.partnerId,
          productImage: item.productImage,
        })
      }
    >
      {item.partnerAvatar ? (
        <Image
          source={{
            uri: item.partnerAvatar || "https://i.pravatar.cc/150"
          }}
          style={styles.avatar}
          defaultSource={{ uri: "https://i.pravatar.cc/150" }}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.partnerName.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.middle}>
        <Text style={[styles.name, item.unreadCount > 0 && styles.unreadName]}>
          {item.partnerName}
        </Text>
        <Text style={[styles.message, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.time}>{item.updatedAt ? formatTime(item.updatedAt) : ""}</Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!currentUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Vui lòng đăng nhập để xem tin nhắn
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#27ae60" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TIN NHẮN</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#888" />
        <TextInput placeholder="Tìm kiếm cuộc trò chuyện..." style={styles.searchInput} placeholderTextColor="#888" />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#27ae60" />
        </View>
      ) : chats.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Icon name="chatbubbles-outline" size={80} color="#ccc" />
          <Text style={{ marginTop: 16, fontSize: 16, color: "#999" }}>
            Chưa có tin nhắn nào
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={(item) => item.chatId}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2e7d32", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f2f5", marginHorizontal: 16, marginVertical: 10, borderRadius: 10, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: "#000" },
  chatItem: { flexDirection: "row", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#2e7d32", justifyContent: "center", alignItems: "center", marginRight: 14 },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  middle: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "600", color: "#000" },
  unreadName: { fontWeight: "bold", color: "#000" },
  message: { fontSize: 14.5, color: "#666", marginTop: 4 },
  unreadMessage: { fontWeight: "600", color: "#000" },
  right: { alignItems: "flex-end", justifyContent: "center" },
  time: { fontSize: 12.5, color: "#999" },
  unreadBadge: { marginTop: 8, backgroundColor: "#e74c3c", minWidth: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 },
  unreadCount: { color: "#fff", fontSize: 11, fontWeight: "bold" },
});