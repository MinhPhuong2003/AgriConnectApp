import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  InteractionManager,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const ChatDetailScreen = ({ route, navigation }) => {
  const { chatId, partnerId } = route.params;
  const currentUserId = auth().currentUser?.uid;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [partner, setPartner] = useState({ name: "Đang tải...", photoURL: null });
  const inputRef = useRef(null);
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [messages]);
  const flatListRef = useRef(null);
  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);
  useEffect(() => {
    if (chatId && currentUserId) {
      firestore()
        .collection("chats")
        .doc(chatId)
        .update({ [`unreadCount.${currentUserId}`]: 0 })
        .catch(() => {});
    }
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!partnerId) return;
    firestore()
      .collection("users")
      .doc(partnerId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setPartner({
            name: data.name || "Nông dân",
            photoURL: data.photoURL || null,
          });
        }
      });
  }, [partnerId]);

  useEffect(() => {
    if (!chatId) return;

    const unsub = firestore()
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot((snap) => {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMessages(list);

        InteractionManager.runAfterInteractions(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        });
      });

    return () => unsub();
  }, [chatId]);

  // Gửi tin nhắn
  const sendMessage = async () => {
  const text = inputText.trim();
  if (!text || !currentUserId || !chatId) return;

  // 1. Tạo tin nhắn giả (optimistic) – hiện ngay lập tức
  const tempId = Date.now().toString();
  const optimisticMessage = {
    id: tempId,
    senderId: currentUserId,
    text,
    timestamp: new Date(),
    _isOptimistic: true,
  };

  // Thêm tin nhắn ngay + xóa text
  setMessages(prev => [...prev, optimisticMessage]);
  setInputText("");

  // Scroll xuống ngay
  setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

  // QUAN TRỌNG: Focus lại ô nhập để bàn phím KHÔNG TẮT + con trỏ vẫn chớp
  setTimeout(() => inputRef.current?.focus(), 10);

  // 2. Gửi thật lên Firestore (background)
  const chatRef = firestore().collection("chats").doc(chatId);

  try {
    await firestore().runTransaction(async (t) => {
      const chatDoc = await t.get(chatRef);
      const data = chatDoc.data();
      const partner = data.participants.find((id) => id !== currentUserId);

      t.update(chatRef, {
        lastMessage: text,
        lastSenderId: currentUserId,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        [`unreadCount.${partner}`]: (data.unreadCount?.[partner] || 0) + 1,
        [`unreadCount.${currentUserId}`]: 0,
      });

      t.set(chatRef.collection("messages").doc(), {
        senderId: currentUserId,
        text,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    console.log("Lỗi gửi tin:", err);
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
    alert("Gửi thất bại!");
  }
};

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUserId;

    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
        {/* Avatar chỉ hiện bên người kia */}
        {!isMe && partner.photoURL && (
          <Image source={{ uri: partner.photoURL }} style={styles.avatar} />
        )}
        {!isMe && !partner.photoURL && (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {partner.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Bubble tin nhắn */}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe && { color: "#fff" }]}>
            {item.text}
          </Text>

          {/* GIỜ: căn phải nếu là mình, căn trái nếu là người kia */}
          <Text
            style={[
              styles.timeText,
              isMe ? styles.timeMyMessage : styles.timeTheirMessage,
            ]}
          >
            {item.timestamp
              ? new Date(
                  item.timestamp.toDate?.() || item.timestamp
                ).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "..."}
          </Text>
        </View>
      </View>
    );
  };

    return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#27ae60" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {partner.photoURL ? (
            <Image source={{ uri: partner.photoURL }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {partner.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerName}>{partner.name}</Text>
        </View>

        <Icon name="ellipsis-vertical" size={24} color="#fff" />
      </View>

      {/* FIX CHÍNH TẠI ĐÂY */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* View này sẽ nhận padding động khi bàn phím hiện */}
        <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ 
              paddingTop: 10, 
              paddingBottom: keyboardHeight > 0 ? 10 : 10 // Khi có bàn phím thì ít padding, không thì nhiều hơn để input không che tin cuối
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            // Bỏ onContentSizeChange cũ đi, thay bằng cái dưới đây
            onLayout={() => {
              // Khi FlatList vừa được vẽ lần đầu → scroll xuống luôn
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
            }}
            // Khi có tin mới hoặc nội dung thay đổi → scroll mượt
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />

          {/* Thanh input cố định dưới cùng */}
          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
              blurOnSubmit={false}
              onFocus={() => {
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
              }}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Icon name="send" size={24} color="#27ae60" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 4,
    paddingTop: 40,
  },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 10, },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  headerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerName: { color: "#fff", fontSize: 17, fontWeight: "600" },

  messageRow: { flexDirection: "row", marginVertical: 6, paddingHorizontal: 10 },
  myRow: { justifyContent: "flex-end" },
  theirRow: { justifyContent: "flex-start" },

  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: { backgroundColor: "#27ae60", borderBottomRightRadius: 4 },
  theirBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    elevation: 2,
  },
  messageText: { fontSize: 15.5, lineHeight: 22 },
  timeText: { fontSize: 11, marginTop: 4, opacity: 0.8 },

  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    color: "#000",
    selectionColor: "#27ae60",
  },
  sendButton: { padding: 8 },
  timeMyMessage: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.8,
    color: "#ccffcc",
    alignSelf: "flex-end",
  },

  timeTheirMessage: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.8,
    color: "#888",
    alignSelf: "flex-start",
  },
});