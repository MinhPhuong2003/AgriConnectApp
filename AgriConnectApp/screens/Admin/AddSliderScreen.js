import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "react-native-image-picker";
import firestore from "@react-native-firebase/firestore";

const AddSliderScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
      includeBase64: true,
      maxWidth: 1200,
      maxHeight: 800,
    });

    if (result.didCancel || result.errorCode) return;

    const asset = result.assets?.[0];
    if (!asset?.base64) return;

    const imageUri = `data:${asset.type};base64,${asset.base64}`;

    setSelectedImage({
      uri: imageUri,
      type: asset.type,
      fileSize: asset.fileSize || 0,
      base64: asset.base64,
    });
  };

  const removeImage = () => setSelectedImage(null);

  const saveSlider = async () => {
    if (!selectedImage) {
      Alert.alert("Thiếu ảnh", "Vui lòng chọn một hình ảnh cho slider");
      return;
    }

    if (selectedImage.fileSize > 2.5 * 1024 * 1024) {
      Alert.alert("Ảnh quá lớn", "Vui lòng chọn ảnh nhỏ hơn 2.5MB");
      return;
    }

    setUploading(true);
    try {
      await firestore().collection("sliders").add({
        imageBase64: selectedImage.uri,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert("Thành công", "Đã thêm slider mới!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Lỗi lưu slider:", error);
      Alert.alert("Lỗi", "Không thể lưu slider. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.titleWrapper}>
            <Text style={styles.headerTitle}>THÊM SLIDER MỚI</Text>
          </View>

          <View style={styles.rightSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.label}>
            Hình ảnh slider (khuyến nghị 1200x600 hoặc tỷ lệ 2:1)
          </Text>

          <TouchableOpacity
            style={styles.imagePicker}
            onPress={selectedImage ? undefined : pickImage}
            disabled={uploading}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.placeholder}>
                <Icon name="image-outline" size={60} color="#bdc3c7" />
                <Text style={styles.placeholderText}>Nhấn để chọn ảnh</Text>
              </View>
            )}
          </TouchableOpacity>

          {selectedImage && (
            <>
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
                  <Icon name="create-outline" size={20} color="#27ae60" />
                  <Text style={styles.actionText}>Chọn ảnh khác</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={removeImage}>
                  <Icon name="trash-outline" size={20} color="#e74c3c" />
                  <Text style={[styles.actionText, { color: "#e74c3c" }]}>
                    Xóa ảnh
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sizeText}>
                Kích thước: {(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedImage || uploading) && styles.saveButtonDisabled,
            ]}
            onPress={saveSlider}
            disabled={!selectedImage || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Text style={styles.saveButtonText}>
                {selectedImage ? "Lưu Slider Mới" : "Chưa chọn ảnh"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    backgroundColor: "#27ae60",
    paddingVertical: 16,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    flexDirection: "row",
    alignItems: "center",
  },

  backBtn: {
    width: 60,
    paddingLeft: 16,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  titleWrapper: {
    flex: 1,
    alignItems: "center",
  },

  rightSpacer: {
    width: 60,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#fff",
  },

  body: { padding: 20, paddingBottom: 40 },

  label: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 12,
    fontWeight: "600",
  },

  imagePicker: {
    height: 240,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: "hidden",
  },

  previewImage: { width: "100%", height: "100%" },

  placeholder: { alignItems: "center" },

  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#95a5a6",
  },

  imageActions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 20,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#ecf0f1",
    borderRadius: 12,
  },

  actionText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
  },

  sizeText: {
    textAlign: "center",
    color: "#7f8c8d",
    marginBottom: 30,
  },

  saveButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    elevation: 6,
  },

  saveButtonDisabled: {
    backgroundColor: "#95a5a6",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default AddSliderScreen;
