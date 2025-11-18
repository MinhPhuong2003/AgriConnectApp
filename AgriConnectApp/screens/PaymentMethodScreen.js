import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const PaymentMethodScreen = ({ navigation, route }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const { onSelectPayment } = route.params || {};

  const paymentOptions = [
    { id: "1", name: "Thanh toán khi nhận hàng" },
    { id: "2", name: "Thanh toán bằng ATM nội địa" },
    { id: "3", name: "Thanh toán bằng thẻ tín dụng/ghi nợ" },
  ];

  const handleSelectPayment = (option) => {
    setSelectedMethod(option);
  };

  const handleConfirm = () => {
    if (selectedMethod && onSelectPayment) {
      onSelectPayment(selectedMethod);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Phương thức thanh toán</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView style={styles.content}>
        {paymentOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={() => handleSelectPayment(option)}
          >
            <View style={styles.optionContent}>
              <View style={styles.radioCircle}>
                {selectedMethod?.id === option.id && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.optionName}>{option.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Đồng ý</Text>
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
  option: {
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

export default PaymentMethodScreen;