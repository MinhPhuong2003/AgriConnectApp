import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const VerifyEmailScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [verifying, setVerifying] = useState(true);

  const completeRegistration = async (user) => {
    try {
      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          verified: true,
          verifiedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể hoàn tất đăng ký. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth().currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          setVerifying(false);
          await completeRegistration(user);
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    try {
      await auth().currentUser?.sendEmailVerification();
      Alert.alert("Đã gửi lại", "Link xác minh đã được gửi lại vào email của bạn");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể gửi lại email xác minh");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/732/732220.png" }}
            style={styles.mailIcon}
          />
          {verifying && (
            <View style={styles.checkCircle}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
          {!verifying && (
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✔</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>
          {verifying ? "Đang chờ bạn xác minh..." : "Xác minh thành công!"}
        </Text>

        <Text style={styles.subtitle}>
          Chúng tôi đã gửi liên kết xác minh đến
        </Text>

        <View style={styles.emailBox}>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {verifying && (
          <Text style={styles.desc}>
            Hãy mở email xác minh để hoàn tất
          </Text>
        )}

        {verifying && (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.resendBtn} onPress={handleResend}>
              <Text style={styles.resendText}>Gửi lại email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backBtnStyled}
              onPress={() => {
                auth().signOut();
                navigation.replace("Login");
              }}
            >
              <Text style={styles.backTextStyled}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        )}

        {!verifying && (
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => navigation.replace("Login")}
          >
            <Text style={styles.successBtnText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: { position: "relative", marginBottom: 40 },
  mailIcon: { width: 140, height: 140, tintColor: "#27ae60" },
  checkCircle: {
    position: "absolute",
    bottom: -8,
    right: -8,
    backgroundColor: "#27ae60",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#fff",
  },
  checkText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  title: { fontSize: 28, fontWeight: "800", color: "#2d3436", textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#636e72", textAlign: "center", marginBottom: 16 },
  emailBox: {
    backgroundColor: "#f0f8f0",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#27ae60",
    marginBottom: 20,
  },
  emailText: { fontSize: 18, fontWeight: "bold", color: "#27ae60" },
  desc: { fontSize: 15, color: "#636e72", textAlign: "center", lineHeight: 24, marginBottom: 40 },
  bold: { fontWeight: "bold", color: "#27ae60" },

  // ←←← THÊM TỪ ĐÂY TRỞ XUỐNG ←←←
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  resendBtn: {
    flex: 1,
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginRight: 10,
  },
  resendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backBtnStyled: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginLeft: 10,
  },
  backTextStyled: {
    color: "#27ae60",
    fontSize: 16,
    fontWeight: "bold",
  },
  successBtn: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 30,
  },
  successBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default VerifyEmailScreen;