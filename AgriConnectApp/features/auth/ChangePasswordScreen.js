import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import auth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/Ionicons";

const ChangePasswordScreen = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ old: "", new: "", confirm: "" });

  const shakeAnim = useState(new Animated.Value(0))[0];

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    const newErrors = { old: "", new: "", confirm: "" };

    if (oldPassword && oldPassword.length < 6)
      newErrors.old = "Mật khẩu cũ ít nhất 6 ký tự";

    if (newPassword) {
      if (newPassword.length < 6)
        newErrors.new = "Mật khẩu mới phải ≥ 6 ký tự";
      else if (newPassword === oldPassword)
        newErrors.new = "Mật khẩu mới không được trùng mật khẩu cũ";
    }

    if (confirmPassword && newPassword !== confirmPassword)
      newErrors.confirm = "Mật khẩu xác nhận không khớp";

    setErrors(newErrors);
  }, [oldPassword, newPassword, confirmPassword]);

  const isValid =
    oldPassword.length >= 6 &&
    newPassword.length >= 6 &&
    newPassword !== oldPassword &&
    newPassword === confirmPassword;

  const handleChangePassword = async () => {
    if (!isValid) {
      shake();
      return;
    }

    setLoading(true);
    try {
      const user = auth().currentUser;
      const credential = auth.EmailAuthProvider.credential(user.email, oldPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);

      Alert.alert("Thành công!", "Đổi mật khẩu thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      let msg = "Đã có lỗi xảy ra.";
      if (error.code === "auth/wrong-password") {
        msg = "Mật khẩu cũ không đúng";
        setErrors((prev) => ({ ...prev, old: msg }));
      } else if (error.code === "auth/too-many-requests") {
        msg = "Quá nhiều yêu cầu, vui lòng thử lại sau.";
      }
      Alert.alert("Lỗi", msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* GIỮ NGUYÊN HEADER CÓ NÚT BACK + TIÊU ĐỀ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ĐỔI MẬT KHẨU</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ICON CHÌA KHÓA ĐẸP LUNG LINH */}
        <View style={styles.iconSection}>
          <View style={styles.keyWrapper}>
            <Icon name="key" size={60} color="#27ae60" />
          </View>
          <Text style={styles.welcome}>Cập nhật mật khẩu mới</Text>
          <Text style={styles.subWelcome}>
            Mật khẩu phải có ít nhất 6 ký tự
          </Text>
        </View>

        <View style={styles.form}>
          {/* Mật khẩu cũ */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={styles.inputWrapper}>
              <Icon name="lock-closed" size={22} color="#27ae60" />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu cũ"
                placeholderTextColor="#999"
                secureTextEntry={!showOld}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TouchableOpacity onPress={() => setShowOld(!showOld)}>
                <Icon name={showOld ? "eye-off" : "eye"} size={22} color="#27ae60" />
              </TouchableOpacity>
            </View>
            {errors.old && <Text style={styles.error}>{errors.old}</Text>}
          </Animated.View>

          {/* Mật khẩu mới */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={styles.inputWrapper}>
              <Icon name="lock-closed" size={22} color="#27ae60" />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu mới"
                placeholderTextColor="#999"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Icon name={showNew ? "eye-off" : "eye"} size={22} color="#27ae60" />
              </TouchableOpacity>
            </View>
            {errors.new && <Text style={styles.error}>{errors.new}</Text>}
          </Animated.View>

          {/* Xác nhận mật khẩu mới */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={styles.inputWrapper}>
              <Icon name="checkmark-circle" size={22} color="#27ae60" />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Icon name={showConfirm ? "eye-off" : "eye"} size={22} color="#27ae60" />
              </TouchableOpacity>
            </View>
            {errors.confirm && <Text style={styles.error}>{errors.confirm}</Text>}
          </Animated.View>

          {/* NÚT CẬP NHẬT */}
          <TouchableOpacity
            style={[styles.updateBtn, (!isValid || loading) && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.updateBtnText}>Cập nhật mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 5,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },

  // ICON CHÌA KHÓA ĐẸP
  iconSection: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
  },
  keyWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#f0fdf4",
    borderWidth: 4,
    borderColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  welcome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#27ae60",
  },
  subWelcome: {
    fontSize: 15,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  form: {
    paddingHorizontal: 24,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fff8",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#27ae60",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  input: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: "#333",
  },
  error: {
    color: "#e74c3c",
    fontSize: 13,
    marginLeft: 20,
    marginTop: -8,
    marginBottom: 8,
  },

  updateBtn: {
    backgroundColor: "#27ae60",
    marginHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  updateBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
});