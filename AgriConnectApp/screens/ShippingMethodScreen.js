import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const ShippingMethodScreen = ({ navigation, route }) => {
  const [selectedMethod, setSelectedMethod] = useState(route.params?.shippingMethod || null);
  const { items, totalPrice, onSelectShipping } = route.params || { items: [], totalPrice: 0 };

  const shippingOptions = [
    { id: "1", name: "Tiết kiệm", fee: 10000 },
    { id: "2", name: "Nhanh", fee: 15000 },
    { id: "3", name: "Hỏa tốc", fee: 30000 },
  ];

  const handleSelectShipping = (option) => {
    console.log("Chọn phương thức vận chuyển:", option, "Sản phẩm:", items, "Tổng tiền:", totalPrice);
    setSelectedMethod(option);
  };

  const handleConfirm = () => {
    if (selectedMethod && onSelectShipping) {
      onSelectShipping(selectedMethod);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Phương thức vận chuyển</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView style={styles.content}>
        {shippingOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={() => handleSelectShipping(option)}
          >
            <View style={styles.optionContent}>
              <View style={styles.radioCircle}>
                {selectedMethod?.id === option.id && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.optionName}>{option.name}</Text>
            </View>
            <Text style={styles.optionFee}>{option.fee.toLocaleString("vi-VN")}đ</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Đồng ý</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 40,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#000" },
  content: { padding: 16 },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#2e7d32",
  },
  optionName: { fontSize: 16, color: "#333" },
  optionFee: { fontSize: 16, color: "#e67e22" },
  confirmButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 20,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ShippingMethodScreen;