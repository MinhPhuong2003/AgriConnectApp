import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const MapScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Map</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.body}>
        <Icon name="location-outline" size={60} color="#999" />
        <Text style={styles.text}>Map feature coming soon</Text>
        <Text style={styles.subText}>
          You’ll be able to view nearby farms and sellers here.
        </Text>
      </View>
    </View>
  );
};

export default MapScreen;

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
