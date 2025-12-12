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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/Ionicons";
import { Formik } from "formik";
import * as Yup from "yup";

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  password: Yup.string().min(6, "Mật khẩu tối thiểu 6 ký tự").required("Vui lòng nhập mật khẩu"),
});

const LoginScreen = ({ navigation }) => {
  const [secureText, setSecureText] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedCreds, setSavedCreds] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const remember = await AsyncStorage.getItem("rememberMe");
        const uid = await AsyncStorage.getItem("userUid");

        if (remember === "true" && uid) {
          if (auth().currentUser?.uid === uid) {
            await navigateAfterLogin(uid);
            return;
          }
        }

        if (remember === "true") {
          const email = await AsyncStorage.getItem("savedEmail");
          const password = await AsyncStorage.getItem("savedPassword");
          if (email && password) {
            setSavedCreds({ email, password });
            setRememberMe(true);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const saveCredentials = async (email, password) => {
    try {
      await AsyncStorage.multiSet([
        ["savedEmail", email.toLowerCase().trim()],
        ["savedPassword", password],
      ]);
    } catch (e) {}
  };

  const clearCredentials = async () => {
    try {
      await AsyncStorage.multiRemove(["savedEmail", "savedPassword"]);
    } catch (e) {}
  };

  const navigateAfterLogin = async (uid) => {
    try {
      const userDoc = await firestore().collection("users").doc(uid).get();
      if (!userDoc.exists) return;

      const userData = userDoc.data();

      if (auth().currentUser?.emailVerified && !userData.verified) {
        await firestore().collection("users").doc(uid).update({
          verified: true,
          verifiedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      if (!userData.verified) {
        Alert.alert("Xác minh email", "Vui lòng xác minh email trước khi tiếp tục.", [
          { text: "Hủy", onPress: () => auth().signOut() },
          {
            text: "Gửi lại email",
            onPress: async () => {
              await auth().currentUser?.sendEmailVerification();
              navigation.replace("VerifyEmail", { email: auth().currentUser?.email });
            },
          },
        ]);
        return;
      }

      if (userData.role === "farmer") {
      navigation.replace("HomeFarmer");
    } else if (userData.role === "buyer") {
      navigation.replace("HomeBuyer");
    } else if (userData.role === "admin") {
      navigation.replace("Admin");
    } else {
      Alert.alert("Lỗi", "Vai trò tài khoản không hợp lệ.");
      await auth().signOut();
      navigation.replace("Login");
    }
  } catch (err) {
    console.log("Lỗi navigateAfterLogin:", err);
    Alert.alert("Lỗi", "Có lỗi xảy ra, vui lòng đăng nhập lại.");
  }
};

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        values.email.trim(),
        values.password
      );
      const uid = userCredential.user.uid;

      if (rememberMe) {
        await saveCredentials(values.email.trim(), values.password);
        await AsyncStorage.multiSet([
          ["rememberMe", "true"],
          ["userUid", uid],
        ]);
      } else {
        await clearCredentials();
        await AsyncStorage.multiRemove(["rememberMe", "userUid"]);
      }

      await navigateAfterLogin(uid);
    } catch (error) {
      let msg = "Đăng nhập thất bại. Vui lòng thử lại.";
      switch (error.code) {
        case "auth/invalid-email": msg = "Email không hợp lệ."; break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential": msg = "Email hoặc mật khẩu không đúng."; break;
        case "auth/too-many-requests": msg = "Quá nhiều lần thử. Thử lại sau."; break;
        case "auth/network-request-failed": msg = "Lỗi mạng. Kiểm tra kết nối."; break;
      }
      Alert.alert("Lỗi", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#27ae60" }}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.avatar} />
          <Text style={styles.welcome}>Chào mừng trở lại!</Text>
          <Text style={styles.appName}>NÔNG SẢN XANH</Text>
          <Text style={styles.subWelcome}>Đăng nhập để tiếp tục mua sắm</Text>
        </View>

        <Formik
          initialValues={{
            email: savedCreds?.email || "",
            password: savedCreds?.password || "",
          }}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
          enableReinitialize={true}
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
              {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

              {/* Mật khẩu */}
              <View style={styles.inputWrapper}>
                <Icon name="lock-closed" size={22} color="#27ae60" />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor="#999"
                  secureTextEntry={secureText}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Icon name={secureText ? "eye-off" : "eye"} size={22} color="#27ae60" />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

              {/* Ghi nhớ + Quên mật khẩu */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Icon name="checkmark" size={18} color="#fff" />}
                  </View>
                  <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.loginBtnText}>
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        <View style={styles.signupSection}>
          <Text style={styles.signupText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.signupLink}> Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", paddingTop: 60, paddingBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: "#27ae60", marginBottom: 20 },
  welcome: { fontSize: 18, color: "#666" },
  appName: { fontSize: 32, fontWeight: "900", color: "#27ae60", marginTop: 8 },
  subWelcome: { fontSize: 16, color: "#888", marginTop: 8 },
  form: { paddingHorizontal: 24 },
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
  input: { flex: 1, marginLeft: 16, fontSize: 16, color: "#333" },
  error: { color: "#e74c3c", fontSize: 13, marginLeft: 20, marginTop: -8, marginBottom: 8 },
  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 12 },
  rememberContainer: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#27ae60",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: { backgroundColor: "#27ae60" },
  rememberText: { fontSize: 15, color: "#555" },
  forgotText: { color: "#27ae60", fontSize: 15, fontWeight: "600" },
  loginBtn: {
    backgroundColor: "#27ae60",
    marginHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loginBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  signupSection: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 40 },
  signupText: { fontSize: 15, color: "#666" },
  signupLink: { color: "#27ae60", fontSize: 16, fontWeight: "bold", marginLeft: 6 },
});