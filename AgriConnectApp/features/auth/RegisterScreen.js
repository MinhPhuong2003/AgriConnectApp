import React, { useState } from "react";
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
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const registerSchema = Yup.object().shape({
  name: Yup.string().required("Vui lòng nhập họ tên"),
  email: Yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Số điện thoại phải 10 số")
    .required("Vui lòng nhập số điện thoại"),
  password: Yup.string()
    .min(6, "Mật khẩu ít nhất 6 ký tự")
    .required("Vui lòng nhập mật khẩu"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Mật khẩu không khớp")
    .required("Vui lòng xác nhận mật khẩu"),
});

const RegisterScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState("buyer");

  const handleRegister = async (values) => {
    try {
      const cred = await auth().createUserWithEmailAndPassword(
        values.email,
        values.password
      );
      await firestore().collection("users").doc(cred.user.uid).set({
        name: values.name,
        email: values.email,
        phone: values.phone || "",
        role: role,
        verified: false,
        rating: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      await cred.user.sendEmailVerification();
      navigation.replace("VerifyEmail", { email: values.email });
    } catch (err) {
      console.log("Register error:", err.code, err.message);
      let message = "Đã có lỗi xảy ra. Vui lòng thử lại!";
      switch (err.code) {
        case "auth/email-already-in-use":
        case "auth/email-already-exists":
          message = "Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.";
          break;
        case "auth/invalid-email":
          message = "Địa chỉ email không hợp lệ.";
          break;
        case "auth/weak-password":
          message = "Mật khẩu quá yếu. Vui lòng dùng ít nhất 6 ký tự.";
          break;
        case "auth/operation-not-allowed":
          message = "Đăng ký bằng email/mật khẩu hiện đang bị tắt. Liên hệ quản trị viên.";
          break;
        case "auth/too-many-requests":
          message = "Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau vài phút.";
          break;
        case "auth/network-request-failed":
          message = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối Internet.";
          break;
        default:
          message = "Đăng ký không thành công. Vui lòng thử lại.";
          break;
      }
      Alert.alert("Đăng ký thất bại", message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER SIÊU ĐẸP */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
            style={styles.avatar}
          />
          <Text style={styles.welcome}>Chào mừng bạn đến với</Text>
          <Text style={styles.appName}>NÔNG SẢN XANH</Text>
          <Text style={styles.subWelcome}>Tạo tài khoản để bắt đầu mua sắm</Text>
        </View>

        <Formik
          initialValues={{
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              {/* Tên */}
              <View style={styles.inputWrapper}>
                <Icon name="person" size={22} color="#27ae60" />
                <TextInput
                  style={styles.input}
                  placeholder="Họ và tên"
                  placeholderTextColor="#999"
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  value={values.name}
                />
              </View>
              {touched.name && errors.name && (
                <Text style={styles.error}>{errors.name}</Text>
              )}

              {/* Email */}
              <View style={styles.inputWrapper}>
                <Icon name="mail" size={22} color="#27ae60" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  value={values.email}
                />
              </View>
              {touched.email && errors.email && (
                <Text style={styles.error}>{errors.email}</Text>
              )}

              {/* Phone */}
              <View style={styles.inputWrapper}>
                <Icon name="call" size={22} color="#27ae60" />
                <TextInput
                  style={styles.input}
                  placeholder="Số điện thoại"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  onChangeText={handleChange("phone")}
                  onBlur={handleBlur("phone")}
                  value={values.phone}
                />
              </View>
              {touched.phone && errors.phone && (
                <Text style={styles.error}>{errors.phone}</Text>
              )}

              {/* Vai trò */}
              <Text style={styles.roleTitle}>Bạn là:</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleCard, role === "buyer" && styles.roleActive]}
                  onPress={() => setRole("buyer")}
                >
                  <Icon
                    name="cart"
                    size={32}
                    color={role === "buyer" ? "#fff" : "#27ae60"}
                  />
                  <Text
                    style={[
                      styles.roleCardText,
                      role === "buyer" && styles.roleTextActive,
                    ]}
                  >
                    Người mua
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleCard, role === "farmer" && styles.roleActive]}
                  onPress={() => setRole("farmer")}
                >
                  <Icon
                    name="leaf"
                    size={32}
                    color={role === "farmer" ? "#fff" : "#27ae60"}
                  />
                  <Text
                    style={[
                      styles.roleCardText,
                      role === "farmer" && styles.roleTextActive,
                    ]}
                  >
                    Nông dân
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mật khẩu */}
              <View style={styles.inputWrapper}>
                <Icon name="lock-closed" size={22} color="#27ae60" />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#27ae60"
                  />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && (
                <Text style={styles.error}>{errors.password}</Text>
              )}

              {/* Xác nhận mật khẩu */}
              <View style={styles.inputWrapper}>
                <Icon name="checkmark-circle" size={22} color="#27ae60" />
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirm}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Icon
                    name={showConfirm ? "eye-off" : "eye"}
                    size={22}
                    color="#27ae60"
                  />
                </TouchableOpacity>
              </View>
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.error}>{errors.confirmPassword}</Text>
              )}

              {/* NÚT ĐĂNG KÝ */}
              <TouchableOpacity style={styles.registerBtn} onPress={handleSubmit}>
                <Text style={styles.registerBtnText}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        {/* ĐĂNG NHẬP */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}> Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#27ae60",
    marginBottom: 20,
  },
  welcome: {
    fontSize: 18,
    color: "#666",
  },
  appName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#27ae60",
    marginTop: 8,
  },
  subWelcome: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
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

  roleTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginLeft: 20,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: "#f0f8f0",
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  roleActive: {
    backgroundColor: "#27ae60",
    elevation: 6,
  },
  roleCardText: {
    marginTop: 10,
    fontSize: 16,
    color: "#27ae60",
    fontWeight: "600",
  },
  roleTextActive: {
    color: "#fff",
  },

  registerBtn: {
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
  registerBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  loginSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  loginText: {
    fontSize: 15,
    color: "#666",
  },
  loginLink: {
    color: "#27ae60",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
})