import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { launchImageLibrary } from "react-native-image-picker";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const EditProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    address: "",
    photoURL: "",
  });
  const [loading, setLoading] = useState(false);
  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const fetchUser = async () => {
      try {
        const doc = await firestore().collection("users").doc(uid).get();
        if (doc.exists) {
          setUserData(doc.data());
        }
      } catch (error) {
        console.error("❌ Lỗi khi tải thông tin user:", error);
      }
    };
    fetchUser();
  }, [uid]);

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: "photo" }, (response) => {
      if (!response.didCancel && response.assets && response.assets[0].uri) {
        setUserData((prev) => ({ ...prev, photoURL: response.assets[0].uri }));
      }
    });
  };

  const handleSave = async () => {
    if (!userData.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên.");
      return;
    }

    setLoading(true);
    try {
      const safeData = {
        name: userData.name || "",
        phone: userData.phone || "",
        address: userData.address || "",
        photoURL: userData.photoURL || "",
      };
      await firestore().collection("users").doc(uid).set(safeData, { merge: true });
      const updatedDoc = await firestore().collection("users").doc(uid).get();
      if (updatedDoc.exists) {
        setUserData(updatedDoc.data());
      }
      Alert.alert("✅ Thành công", "Cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật hồ sơ:", error);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>CHỈNH SỬA HỒ SƠ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleChoosePhoto}>
              <Image
                source={{ uri: userData.photoURL || DEFAULT_AVATAR }}
                style={styles.avatar}
              />
              <View style={styles.editIcon}>
                <Icon name="camera-outline" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Họ và tên:</Text>
            <TextInput
              style={styles.input}
              value={userData.name}
              onChangeText={(text) => setUserData({ ...userData, name: text })}
              placeholder="Nhập họ và tên"
            />

            <Text style={styles.label}>Số điện thoại:</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={userData.phone}
              onChangeText={(text) => setUserData({ ...userData, phone: text })}
              placeholder="Nhập số điện thoại"
            />

            <Text style={styles.label}>Địa chỉ:</Text>
            <TextInput
              style={styles.input}
              value={userData.address}
              onChangeText={(text) =>
                setUserData({ ...userData, address: text })
              }
              placeholder="Nhập địa chỉ"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 40,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  avatarContainer: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2e7d32",
    padding: 6,
    borderRadius: 20,
  },
  form: { paddingHorizontal: 20 },
  label: { marginBottom: 6, color: "#555", fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fafafa",
  },
  saveBtn: {
    backgroundColor: "#2e7d32",
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 25,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
