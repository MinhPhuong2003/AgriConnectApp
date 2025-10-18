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
import { Formik } from "formik";
import * as Yup from "yup";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const RegisterScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("buyer"); // default

  const registerSchema = Yup.object().shape({
    name: Yup.string().required("Vui lòng nhập tên người dùng"),
    email: Yup.string()
      .email("Email không hợp lệ")
      .required("Vui lòng nhập email"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Số điện thoại phải có 10 chữ số")
      .required("Vui lòng nhập số điện thoại"),
    address: Yup.string().required("Vui lòng nhập địa chỉ"),
    password: Yup.string()
      .min(6, "Tối thiểu 6 ký tự")
      .required("Vui lòng nhập mật khẩu"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Mật khẩu không khớp")
      .required("Vui lòng xác nhận mật khẩu"),
  });

  const handleRegister = async (values) => {
    try {
      const { email, password, name, phone, address } = values;

      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );

      const uid = userCredential.user.uid;

      await firestore().collection("users").doc(uid).set({
        name,
        email,
        phone,
        role: selectedRole,
        address,
        verified: false,
        rating: 0,
        points: 0,
        location: { lat: null, lng: null },
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Đăng Ký Tài Khoản</Text>

      <Formik
        initialValues={{
          name: "",
          email: "",
          phone: "",
          address: "",
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
          <>
            {/* Tên người dùng */}
            <View style={styles.inputContainer}>
              <Icon name="person-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Tên người dùng"
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
                value={values.name}
              />
            </View>
            {touched.name && errors.name && (
              <Text style={styles.error}>{errors.name}</Text>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <Icon name="mail-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Email"
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

            {/* Số điện thoại */}
            <View style={styles.inputContainer}>
              <Icon name="call-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                keyboardType="phone-pad"
                onChangeText={handleChange("phone")}
                onBlur={handleBlur("phone")}
                value={values.phone}
              />
            </View>
            {touched.phone && errors.phone && (
              <Text style={styles.error}>{errors.phone}</Text>
            )}

            {/* Địa chỉ */}
            <View style={styles.inputContainer}>
              <Icon name="home-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Địa chỉ"
                onChangeText={handleChange("address")}
                onBlur={handleBlur("address")}
                value={values.address}
              />
            </View>
            {touched.address && errors.address && (
              <Text style={styles.error}>{errors.address}</Text>
            )}

            {/* Vai trò */}
            <View style={styles.roleContainer}>
              {["buyer", "farmer", "trader"].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    selectedRole === role && styles.roleSelected,
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text
                    style={[
                      styles.roleText,
                      selectedRole === role && styles.roleTextSelected,
                    ]}
                  >
                    {role === "buyer"
                      ? "Người mua"
                      : role === "farmer"
                      ? "Nông dân"
                      : "Thương lái"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mật khẩu */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                secureTextEntry={!showPassword}
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {touched.password && errors.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                secureTextEntry={!showConfirmPassword}
                onChangeText={handleChange("confirmPassword")}
                onBlur={handleBlur("confirmPassword")}
                value={values.confirmPassword}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                <Icon
                  name={
                    showConfirmPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {touched.confirmPassword && errors.confirmPassword && (
              <Text style={styles.error}>{errors.confirmPassword}</Text>
            )}

            {/* Nút đăng ký */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Đăng ký</Text>
            </TouchableOpacity>

            {/* Đăng nhập */}
            <View style={styles.signupContainer}>
              <Text>Bạn đã có tài khoản?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.signupText}> Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Formik>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#4A44F2", textAlign: "center" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  input: { flex: 1, height: 48, marginLeft: 8 },
  error: { fontSize: 12, color: "red", marginLeft: 5, marginBottom: 5 },
  button: {
    backgroundColor: "#4A44F2",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  signupContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  signupText: { color: "#4A44F2", fontWeight: "bold" },
  roleContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  roleButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
  },
  roleSelected: { backgroundColor: "#4A44F2", borderColor: "#4A44F2" },
  roleText: { color: "#333" },
  roleTextSelected: { color: "#fff", fontWeight: "bold" },
});
