import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { launchImageLibrary } from "react-native-image-picker";
import Icon from "react-native-vector-icons/Ionicons";

const AddProductScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState("");
  const [season, setSeason] = useState("");
  const [region, setRegion] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const userId = auth().currentUser.uid;

  // 📸 Chọn ảnh sản phẩm
  const pickImage = () => {
  launchImageLibrary(
    { mediaType: 'photo', quality: 0.7 },
    (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.log("ImagePicker Error: ", response.errorMessage);
      } else {
        const uri = response.assets[0].uri;
        setImage(uri);
      }
    }
  );
};


  // 🚀 Thêm sản phẩm vào Firestore
  const handleAddProduct = async () => {
    if (!name || !price || !stock || !season || !region) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      let imageUrl = "";

      // 🔼 Upload ảnh lên Firebase Storage nếu có
      if (image) {
        const filename = `${userId}_${Date.now()}.jpg`;
        const ref = storage().ref(`productImages/${filename}`);
        await ref.putFile(image);
        imageUrl = await ref.getDownloadURL();
      }

      // 💾 Thêm dữ liệu vào Firestore
      await firestore().collection("products").add({
        name,
        description,
        price: parseFloat(price),
        unit,
        stock: parseInt(stock),
        imageUrl,
        season,
        region,
        sellerId: userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        available: true,
        avgRating: 0,
        reviewsCount: 0,
      });

      Alert.alert("✅ Thành công", "Đã thêm sản phẩm mới!");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("❌ Lỗi", "Không thể thêm sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌾 Thêm sản phẩm mới</Text>

      <TextInput
        placeholder="Tên sản phẩm"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Mô tả sản phẩm"
        value={description}
        onChangeText={setDescription}
        multiline
        style={[styles.input, { height: 80 }]}
      />
      <TextInput
        placeholder="Giá (VNĐ)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Đơn vị (kg, bó, thùng...)"
        value={unit}
        onChangeText={setUnit}
        style={styles.input}
      />
      <TextInput
        placeholder="Số lượng tồn"
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Mùa vụ (VD: Tháng 5–7)"
        value={season}
        onChangeText={setSeason}
        style={styles.input}
      />
      <TextInput
        placeholder="Khu vực (VD: Ninh Thuận)"
        value={region}
        onChangeText={setRegion}
        style={styles.input}
      />

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Icon name="image-outline" size={20} color="#fff" />
        <Text style={styles.imageButtonText}>
          {image ? "Đã chọn ảnh ✅" : "Chọn ảnh sản phẩm"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addButton, loading && { opacity: 0.6 }]}
        onPress={handleAddProduct}
        disabled={loading}
      >
        <Text style={styles.addButtonText}>
          {loading ? "Đang lưu..." : "Thêm sản phẩm"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddProductScreen;

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#4CAF50",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    marginVertical: 10,
  },
  imageButtonText: { color: "#fff", marginLeft: 6 },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
