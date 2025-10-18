import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import auth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/Ionicons";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");

  const handleResetPassword = async () => {
  if (!email) {
    Alert.alert("Thông báo", "Vui lòng nhập email của bạn!");
    return;
  }

  try {
    await auth().sendPasswordResetEmail(email);
    Alert.alert(
      "Thành công",
      "Một email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư!",
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  } catch (error) {
    Alert.alert("Lỗi", error.message);
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu?</Text>
      <Text style={styles.subtitle}>
        Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
      </Text>

      {/* Nhập Email */}
      <View style={styles.inputContainer}>
        <Icon
          name="mail-outline"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Nhập email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Nút Gửi */}
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Gửi liên kết đặt lại</Text>
      </TouchableOpacity>

      {/* Quay lại đăng nhập */}
      <TouchableOpacity
        style={styles.backLogin}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4A44F2",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#4A44F2",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  backLogin: {
    marginTop: 15,
    alignItems: "center",
  },
  backText: {
    color: "#4A44F2",
    fontWeight: "bold",
  },
});
