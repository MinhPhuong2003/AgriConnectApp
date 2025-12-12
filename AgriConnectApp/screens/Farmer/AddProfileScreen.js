import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { launchImageLibrary } from "react-native-image-picker";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const AddProfileScreen = ({ navigation }) => {
  const uid = auth().currentUser?.uid;

  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [certImage, setCertImage] = useState(null);
  const [farmImages, setFarmImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const IMGBB_API_KEY = "2b30ba6c1775d3653b37a8baff4687a8";

  const uploadToImgBB = async (base64Data) => {
    if (!base64Data || !base64Data.includes("base64,")) return null;
    const base64 = base64Data.split("base64,")[1];

    const formData = new FormData();
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", base64);

    try {
      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      return json.success ? json.data.url : null;
    } catch (error) {
      console.log("Upload lỗi:", error);
      return null;
    }
  };

  const pickImage = async (setter) => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.6,
      includeBase64: true,
    });

    if (result.didCancel || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const imageData = `data:${asset.type || "image/jpeg"};base64,${asset.base64}`;
    setter(imageData);
  };

  const pickMultipleFarmImages = async () => {
    if (farmImages.length >= 4) {
      Alert.alert("Thông báo", "Tối đa chỉ được chọn 4 ảnh vườn/trang trại");
      return;
    }

    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.6,
      includeBase64: true,
      selectionLimit: 4 - farmImages.length,
    });

    if (result.didCancel || !result.assets) return;

    const newImages = result.assets.map(
      (asset) => `data:${asset.type || "image/jpeg"};base64,${asset.base64}`
    );

    setFarmImages((prev) => [...prev, ...newImages].slice(0, 4));
  };

  const removeFarmImage = (index) => {
    setFarmImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!idFront || !idBack) {
      Alert.alert("Thiếu thông tin", "Vui lòng tải lên cả 2 mặt CMND/CCCD");
      return;
    }

    Alert.alert("Xác nhận gửi", "Bạn chắc chắn muốn gửi hồ sơ xét duyệt?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Gửi ngay",
        onPress: async () => {
          setSubmitting(true);

          Alert.alert("Đang xử lý", "Đang upload ảnh, xin vui lòng đợi...", [
            { text: "Đang tải...", style: "cancel" },
          ]);

          try {
            const frontUrl = await uploadToImgBB(idFront);
            const backUrl = await uploadToImgBB(idBack);
            const certUrl = certImage ? await uploadToImgBB(certImage) : null;

            const farmUrls = [];
            for (const img of farmImages) {
              const url = await uploadToImgBB(img);
              if (url) farmUrls.push(url);
            }

            if (!frontUrl || !backUrl) {
              throw new Error("Upload ảnh CMND thất bại. Vui lòng thử lại!");
            }

            await firestore().collection("users").doc(uid).update({
              verificationStatus: "pending",
              verificationSubmittedAt: firestore.FieldValue.serverTimestamp(),
              idCardFront: frontUrl,
              idCardBack: backUrl,
              certificationImage: certUrl || null,
              farmImages: farmUrls,
              verificationNote: "Gửi thành công qua ImgBB",
            });

            Alert.alert("Thành công!", "Hồ sơ đã được gửi đi!", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch (error) {
            console.error("Lỗi gửi:", error);
            Alert.alert("Lỗi", error.message || "Gửi thất bại, vui lòng thử lại.");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BỔ SUNG HỒ SƠ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>1. CMND / CCCD (bắt buộc)</Text>
        <View style={styles.idCardRow}>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdFront)}>
            {idFront ? (
              <Image source={{ uri: idFront }} style={styles.uploadedImage} />
            ) : (
              <>
                <Icon name="id-card-outline" size={40} color="#27ae60" />
                <Text style={styles.uploadText}>Mặt trước</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdBack)}>
            {idBack ? (
              <Image source={{ uri: idBack }} style={styles.uploadedImage} />
            ) : (
              <>
                <Icon name="id-card-outline" size={40} color="#27ae60" />
                <Text style={styles.uploadText}>Mặt sau</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>2. Giấy chứng nhận hữu cơ / VietGAP (không bắt buộc)</Text>
        <TouchableOpacity style={styles.uploadBoxLarge} onPress={() => pickImage(setCertImage)}>
          {certImage ? (
            <Image source={{ uri: certImage }} style={styles.uploadedImageLarge} />
          ) : (
            <>
              <Icon name="document-text-outline" size={50} color="#27ae60" />
              <Text style={styles.uploadTextLarge}>Nhấn để tải lên giấy chứng nhận</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>3. Ảnh vườn / trang trại (tối đa 4 ảnh)</Text>
        <View style={styles.farmImagesRow}>
          {[...Array(4)].map((_, index) => (
            <TouchableOpacity
              key={`farm-slot-${index}`}
              style={styles.smallUploadBox}
              onPress={() => (farmImages[index] ? null : pickMultipleFarmImages())}
            >
              {farmImages[index] ? (
                <>
                  <Image source={{ uri: farmImages[index] }} style={styles.smallImage} />
                  <TouchableOpacity
                    key={`remove-btn-${index}`}
                    style={styles.removeBtn}
                    onPress={() => removeFarmImage(index)}
                  >
                    <Icon name="close-circle" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                </>
              ) : (
                <Icon name="camera-outline" size={30} color="#95a5a6" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="paper-plane-outline" size={24} color="#fff" />
              <Text style={styles.submitText}>Gửi hồ sơ xét duyệt</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fff8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 16,
    backgroundColor: "#2e7d32",
    paddingTop: 40,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  scrollView: { padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#2c3e50", marginTop: 6, marginBottom: 12 },
  idCardRow: { flexDirection: "row", justifyContent: "space-between" },
  uploadBox: {
    width: "48%",
    height: 160,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    borderWidth: 2,
    borderColor: "#d5f5e3",
    borderStyle: "dashed",
  },
  uploadedImage: { width: "100%", height: "100%", borderRadius: 14 },
  uploadBoxLarge: {
    height: 180,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    borderWidth: 2,
    borderColor: "#d5f5e3",
    borderStyle: "dashed",
  },
  uploadedImageLarge: { width: "100%", height: "100%", borderRadius: 14 },
  uploadText: { marginTop: 10, color: "#27ae60", fontWeight: "600" },
  uploadTextLarge: { marginTop: 12, color: "#27ae60", fontWeight: "600", textAlign: "center", paddingHorizontal: 20 },
  farmImagesRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  smallUploadBox: {
    width: "23%",
    height: 90,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
    position: "relative",
  },
  smallImage: { width: "100%", height: "100%", borderRadius: 10 },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 5,
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: "#27ae60",
    marginTop: 30,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 10 },
});