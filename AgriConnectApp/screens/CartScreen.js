import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const CartScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Cart</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.body}>
        <Icon name="cart-outline" size={60} color="#999" />
        <Text style={styles.text}>Your cart is empty</Text>
        <Text style={styles.subText}>
          Browse products and add them to your cart.
        </Text>
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  subText: { fontSize: 14, color: "#777", marginTop: 5, textAlign: "center" },
});
