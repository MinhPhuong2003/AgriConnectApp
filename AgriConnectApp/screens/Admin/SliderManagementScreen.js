import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";

const SliderManagementScreen = ({ navigation }) => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("sliders")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSliders(list);
        setLoading(false);
      }, (error) => {
        console.log(error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const deleteSlider = (id) => {
    Alert.alert("Xóa slider", "Bạn có chắc chắn muốn xóa slider này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await firestore().collection("sliders").doc(id).delete();
            Alert.alert("Đã xóa", "Slider đã được xóa thành công");
          } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa slider");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageBase64 }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.footer}>
        <Text style={styles.idText}>ID: {item.id.slice(-8)}</Text>
        <TouchableOpacity onPress={() => deleteSlider(item.id)}>
          <Icon name="trash-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QUẢN LÝ SLIDER</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 50 }} />
      ) : sliders.length === 0 ? (
        <Text style={styles.empty}>Chưa có slider nào</Text>
      ) : (
        <FlatList
          data={sliders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddSlider")}
      >
        <Icon name="add" size={34} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SliderManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#27ae60",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  image: { width: "100%", height: 180 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  idText: { fontSize: 14, color: "#7f8c8d" },
  empty: { textAlign: "center", marginTop: 50, fontSize: 17, color: "#95a5a6" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
});