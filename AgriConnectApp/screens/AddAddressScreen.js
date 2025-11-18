import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const AddAddressScreen = ({ navigation, route }) => {
  const { onSave } = route.params || {};
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (onSave) {
      onSave(name, phone, address, null);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm địa chỉ mới</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tên</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ"
            multiline
          />
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Lưu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#000" },
  content: { padding: 16, flex: 1 },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  saveButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddAddressScreen;