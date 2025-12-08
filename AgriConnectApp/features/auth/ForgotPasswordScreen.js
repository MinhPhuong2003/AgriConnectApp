import React from "react";
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
import auth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/Ionicons";
import { Formik } from "formik";
import * as Yup from "yup";

const forgotSchema = Yup.object().shape({
  email: Yup.string()
    .email("Email không hợp lệ")
    .required("Vui lòng nhập email"),
});

const ForgotPasswordScreen = ({ navigation }) => {
  const handleResetPassword = async (values, { setSubmitting }) => {
    try {
      await auth().sendPasswordResetEmail(values.email.trim());
      Alert.alert(
        "Thành công!",
        "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.\nVui lòng kiểm tra hộp thư (và cả mục Spam/Promotions).",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      let msg = "Gửi liên kết thất bại. Vui lòng thử lại.";
      switch (error.code) {
        case "auth/invalid-email":
          msg = "Email không hợp lệ.";
          break;
        case "auth/user-not-found":
          msg = "Không tìm thấy tài khoản với email này.";
          break;
        case "auth/too-many-requests":
          msg = "Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.";
          break;
        case "auth/network-request-failed":
          msg = "Lỗi mạng. Kiểm tra kết nối internet.";
          break;
      }
      Alert.alert("Lỗi", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER MỚI – ICON KHÓA + DẤU HỎI */}
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Icon name="lock-closed" size={50} color="#27ae60" />
            <View style={styles.questionMark}>
              <Text style={styles.questionText}>?</Text>
            </View>
          </View>

          <Text style={styles.welcome}>Quên mật khẩu?</Text>
          <Text style={styles.appName}>NÔNG SẢN XANH</Text>
          <Text style={styles.subWelcome}>
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
          </Text>
        </View>

        <Formik
          initialValues={{ email: "" }}
          validationSchema={forgotSchema}
          onSubmit={handleResetPassword}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isSubmitting,
          }) => (
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Icon name="mail" size={22} color="#27ae60" />
                <TextInput
                  style={styles.input}
                  placeholder="Email của bạn"
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

              <TouchableOpacity
                style={[styles.sendBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.sendBtnText}>
                  {isSubmitting ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        <View style={styles.backSection}>
          <Text style={styles.backText}>Nhớ mật khẩu rồi?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.backLink}> Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

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

  // Icon khóa + dấu hỏi đẹp lung linh
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#f0fdf4",
    borderWidth: 4,
    borderColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  questionMark: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#e74c3c",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  questionText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
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

  sendBtn: {
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
  sendBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  backSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  backText: {
    fontSize: 15,
    color: "#666",
  },
  backLink: {
    color: "#27ae60",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
});