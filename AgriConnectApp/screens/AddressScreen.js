import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const AddressScreen = ({ navigation, route }) => {
  const { userData, onSelectAddress } = route.params || {};
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(userData?.address || null);
  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      console.log("No UID found, skipping fetch");
      return;
    }

    const unsubscribe = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (data.addresses && Array.isArray(data.addresses)) {
              setAddresses(data.addresses);
              if (!selectedAddress) {
                const defaultAddress = data.addresses.find((addr) => addr.isDefault) || data.addresses[0];
                if (defaultAddress) {
                  setSelectedAddress(defaultAddress.address);
                }
              }
            } else if (data.address) {
              const singleAddress = {
                address: data.address,
                name: data.name || "Khách hàng",
                phone: data.phone || "(+84) 912 345 678",
                location: data.location || null,
                isDefault: true,
              };
              setAddresses([singleAddress]);
              setSelectedAddress(data.address);
            } else {
              setAddresses([]);
              console.log("No addresses found in user data");
            }
          } else {
            console.log("No user document found");
            setAddresses([]);
          }
        },
        (error) => {
          console.error("Error fetching addresses:", error);
          Alert.alert("Lỗi", "Không thể tải danh sách địa chỉ.");
        }
      );

    return () => unsubscribe();
  }, [uid, selectedAddress]);

  const handleSelectAddress = async (address) => {
    setSelectedAddress(address);
    const selectedItem = addresses.find((item) => item.address === address);
    if (selectedItem) {
      if (uid) {
        const updatedAddresses = addresses.map((item) => ({
          ...item,
          isDefault: item.address === address,
        }));
        try {
          await firestore()
            .collection("users")
            .doc(uid)
            .set(
              {
                addresses: updatedAddresses,
                name: selectedItem.name,
                phone: selectedItem.phone,
                address: selectedItem.address,
              },
              { merge: true }
            );
          console.log("Updated primary address in Firestore");
        } catch (error) {
          console.error("Error updating Firestore:", error);
          Alert.alert("Lỗi", "Không thể cập nhật địa chỉ!");
        }
      }
    } else {
      console.warn("No matching address found");
    }
  };

  const handleDeleteAddress = (address) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa địa chỉ này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedAddresses = addresses.filter((item) => item.address !== address);
              if (updatedAddresses.length > 0) {
                const newDefault = updatedAddresses.find((addr) => addr.isDefault) || updatedAddresses[0];
                if (address === selectedAddress) {
                  setSelectedAddress(newDefault ? newDefault.address : null);
                }
                if (!updatedAddresses.some((addr) => addr.isDefault)) {
                  updatedAddresses[0].isDefault = true;
                }
              } else {
                setSelectedAddress(null);
              }

              await firestore()
                .collection("users")
                .doc(uid)
                .set(
                  {
                    addresses: updatedAddresses,
                    ...(updatedAddresses.length > 0
                      ? {
                          name: updatedAddresses[0].name,
                          phone: updatedAddresses[0].phone,
                          address: updatedAddresses[0].address,
                        }
                      : { address: null, name: null, phone: null }),
                  },
                  { merge: true }
                );
              setAddresses(updatedAddresses);
              console.log("Deleted address from Firestore");
            } catch (error) {
              console.error("Error deleting address:", error);
              Alert.alert("Lỗi", "Không thể xóa địa chỉ!");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddNewAddress = () => {
    navigation.navigate("AddAddress", {
      onSave: async (newName, newPhone, newAddress, newLocation) => {
        if (!newName || !newPhone || !newAddress) {
          Alert.alert("Lỗi", "Dữ liệu không hợp lệ!");
          return;
        }
        const newAddressObject = {
          name: newName,
          phone: newPhone,
          address: newAddress,
          location: newLocation || null,
          isDefault: true,
        };
        try {
          const updatedAddresses = addresses.map((item) => ({
            ...item,
            isDefault: false,
          }));
          updatedAddresses.push(newAddressObject);
          await firestore()
            .collection("users")
            .doc(uid)
            .set(
              {
                addresses: updatedAddresses,
                name: newName,
                phone: newPhone,
                address: newAddress,
              },
              { merge: true }
            );
          setAddresses(updatedAddresses);
          setSelectedAddress(newAddress);
        } catch (error) {
          console.error("Error saving new address:", error);
          Alert.alert("Lỗi", "Không thể lưu địa chỉ!");
        }
      },
    });
  };

  const handleEditAddress = (address, name, phone, location) => {
    navigation.navigate("EditProfile", {
      address,
      name,
      phone,
      location,
      onSave: async (updatedAddress, updatedName, updatedPhone, updatedLocation) => {
        if (!updatedAddress || !updatedName || !updatedPhone) {
          Alert.alert("Lỗi", "Dữ liệu cập nhật không hợp lệ!");
          return;
        }
        const updatedAddresses = addresses.map((item) =>
          item.address === address
            ? {
                ...item,
                address: updatedAddress,
                name: updatedName,
                phone: updatedPhone,
                location: updatedLocation || null,
                isDefault: item.isDefault,
              }
            : item
        );
        try {
          await firestore()
            .collection("users")
            .doc(uid)
            .set(
              {
                addresses: updatedAddresses,
                name: updatedName,
                phone: updatedPhone,
                address: updatedAddress,
              },
              { merge: true }
            );
          setAddresses(updatedAddresses);
          if (selectedAddress === address) {
            setSelectedAddress(updatedAddress);
          }
          navigation.goBack();
        } catch (error) {
          console.error("Error updating address:", error);
          Alert.alert("Lỗi", "Không thể cập nhật địa chỉ!");
        }
      },
    });
  };

  const handleBackPress = () => {
    if (selectedAddress && onSelectAddress && typeof onSelectAddress === "function") {
      const selectedItem = addresses.find((item) => item.address === selectedAddress);
      if (selectedItem) {
        onSelectAddress({
          name: selectedItem.name,
          phone: selectedItem.phone,
          address: selectedItem.address,
        });
      }
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Icon name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Địa chỉ nhận hàng</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView style={styles.content}>
        {addresses.length > 0 ? (
          addresses.map((item, index) => (
            <View key={index} style={styles.addressItem}>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectAddress(item.address)}
              >
                <View style={styles.radioCircle}>
                  {selectedAddress === item.address && <View style={styles.radioSelected} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addressInfo}
                onPress={() => handleSelectAddress(item.address)}
              >
                <Text style={styles.addressName}>{item.name || "Khách hàng"}</Text>
                <Text style={styles.addressPhone}>{item.phone || "(+84) 912 345 678"}</Text>
                <Text style={styles.addressDetail}>{item.address || "Chưa có địa chỉ"}</Text>
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditAddress(item.address, item.name, item.phone, item.location)}
                >
                  <Icon name="create-outline" size={20} color="#2e7d32" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAddress(item.address)}
                >
                  <Icon name="trash-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noAddressText}>Chưa có địa chỉ nào. Vui lòng thêm địa chỉ mới!</Text>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.addButton} onPress={handleAddNewAddress}>
        <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
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
  content: { padding: 16 },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    position: "relative",
  },
  selectButton: {
    marginRight: 12,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#2e7d32",
  },
  addressInfo: {
    flex: 1,
    paddingVertical: 8,
  },
  addressName: { fontSize: 15, fontWeight: "600" },
  addressPhone: { fontSize: 13, color: "#666", marginTop: 2 },
  addressDetail: { fontSize: 13, color: "#666", marginTop: 4 },
  noAddressText: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 20 },
  addButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    position: "absolute",
    top: 8,
    right: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default AddressScreen;