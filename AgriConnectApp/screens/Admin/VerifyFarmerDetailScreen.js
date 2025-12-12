import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import ImageView from "react-native-image-viewing";

const { width } = Dimensions.get("window");

const VerifyFarmerDetailScreen = ({ route, navigation }) => {
  const { farmer } = route.params;
  const [visible, setVisible] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const updateStatus = async (status) => {
    Alert.alert(
      status === "approved" ? "Duyệt hồ sơ" : "Từ chối hồ sơ",
      `Bạn có chắc muốn ${status === "approved" ? "duyệt" : "từ chối"} hồ sơ này?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: status === "approved" ? "Duyệt" : "Từ chối",
          style: status === "rejected" ? "destructive" : "default",
          onPress: async () => {
            try {
              await firestore().collection("users").doc(farmer.id).update({
                verificationStatus: status,
                verifiedAt: status === "approved" ? firestore.FieldValue.serverTimestamp() : null,
                rejectedAt: status === "rejected" ? firestore.FieldValue.serverTimestamp() : null,
                approvedBy: auth().currentUser?.uid,
              });
              Alert.alert("Thành công!", `Đã ${status === "approved" ? "duyệt" : "từ chối"} hồ sơ`);
              navigation.goBack();
            } catch (error) {
              console.error(error);
              Alert.alert("Lỗi", "Cập nhật thất bại");
            }
          },
        },
      ]
    );
  };

  const imagesForViewer = [
    ...(farmer.idCardFront ? [{ uri: farmer.idCardFront }] : []),
    ...(farmer.idCardBack ? [{ uri: farmer.idCardBack }] : []),
    ...(farmer.certificationImage ? [{ uri: farmer.certificationImage }] : []),
    ...(farmer.farmImages?.map(img => ({ uri: img })) || []),
  ];

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHI TIẾT HỒ SƠ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.infoCard}>
          <Image
            source={{
              uri: farmer.photoBase64 || farmer.photoURL || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.bigAvatar}
          />
          <Text style={styles.name}>{farmer.name || "Chưa có tên"}</Text>
          <Text style={styles.phone}>ĐT: {farmer.phone || "Chưa có SĐT"}</Text>
          <Text style={styles.address} numberOfLines={3}>
            Địa chỉ: {farmer.address || "Chưa cập nhật"}
          </Text>
          <Text style={styles.submitTime}>
            Gửi lúc: {farmer.verificationSubmittedAt?.toDate?.().toLocaleString("vi-VN") || "N/A"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>CMND / CCCD</Text>
        <View style={styles.imageRow}>
          {farmer.idCardFront && (
            <TouchableOpacity onPress={() => openImageViewer(0)} style={styles.imageContainer}>
              <Image source={{ uri: farmer.idCardFront }} style={styles.proofImage} resizeMode="cover" />
              <Text style={styles.imageLabel}>Mặt trước</Text>
            </TouchableOpacity>
          )}
          {farmer.idCardBack && (
            <TouchableOpacity onPress={() => openImageViewer(farmer.idCardFront ? 1 : 0)} style={styles.imageContainer}>
              <Image source={{ uri: farmer.idCardBack }} style={styles.proofImage} resizeMode="cover" />
              <Text style={styles.imageLabel}>Mặt sau</Text>
            </TouchableOpacity>
          )}
        </View>

        {farmer.certificationImage && (
          <>
            <Text style={styles.sectionTitle}>Giấy chứng nhận hữu cơ / VietGAP</Text>
            <TouchableOpacity onPress={() => openImageViewer((farmer.idCardFront ? 1 : 0) + (farmer.idCardBack ? 1 : 0))} style={styles.fullImageContainer}>
              <Image source={{ uri: farmer.certificationImage }} style={styles.fullImage} resizeMode="contain" />
            </TouchableOpacity>
          </>
        )}

        {farmer.farmImages && farmer.farmImages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Ảnh vườn / trang trại ({farmer.farmImages.length}/4)</Text>
            <View style={styles.farmGrid}>
              {farmer.farmImages.map((img, index) => {
                const viewerIndex = (farmer.idCardFront ? 1 : 0) + (farmer.idCardBack ? 1 : 0) + (farmer.certificationImage ? 1 : 0) + index;
                return (
                  <TouchableOpacity key={index} onPress={() => openImageViewer(viewerIndex)}>
                    <Image source={{ uri: img }} style={styles.farmImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Chỉ hiển thị nút hành động khi hồ sơ đang chờ duyệt */}
        {farmer.verificationStatus === "pending" ? (
        <View style={styles.actionBigContainer}>
            <TouchableOpacity style={styles.rejectBigBtn} onPress={() => updateStatus("rejected")}>
            <Icon name="close-circle" size={32} color="#fff" />
            <Text style={styles.bigBtnText}>Từ chối hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBigBtn} onPress={() => updateStatus("approved")}>
            <Icon name="checkmark-circle" size={32} color="#fff" />
            <Text style={styles.bigBtnText}>Duyệt hồ sơ</Text>
            </TouchableOpacity>
        </View>
        ) : (
        <View style={styles.processedContainer}>
            <View style={[
            styles.statusBanner,
            farmer.verificationStatus === "approved" ? styles.approvedBanner : styles.rejectedBanner
            ]}>
            <Icon 
                name={farmer.verificationStatus === "approved" ? "checkmark-circle" : "close-circle"} 
                size={28} 
                color="#fff" 
            />
            <Text style={styles.statusBannerText}>
                {farmer.verificationStatus === "approved" ? "ĐÃ DUYỆT" : "ĐÃ TỪ CHỐI"}
            </Text>
            </View>
            {(farmer.verifiedAt || farmer.rejectedAt) && (
            <Text style={styles.processedTime}>
                Lúc: {(farmer.verifiedAt || farmer.rejectedAt)?.toDate?.().toLocaleString("vi-VN")}
            </Text>
            )}
        </View>
        )}
      </ScrollView>

      <ImageView
        images={imagesForViewer}
        imageIndex={currentImageIndex}
        visible={visible}
        onRequestClose={() => setVisible(false)}
      />
    </SafeAreaView>
  );
};

export default VerifyFarmerDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fff8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#27ae60",
    paddingTop: 40,
    elevation: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  scrollView: { padding: 16 },
  infoCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center", elevation: 6, marginBottom: 20 },
  bigAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: "#27ae60", marginBottom: 12 },
  name: { fontSize: 24, fontWeight: "bold", color: "#2c3e50" },
  phone: { fontSize: 18, color: "#27ae60", marginTop: 8 },
  address: { fontSize: 16, color: "#7f8c8d", marginTop: 8, textAlign: "center" },
  submitTime: { fontSize: 14, color: "#95a5a6", marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2c3e50", marginTop: 24, marginBottom: 12 },
  imageRow: { flexDirection: "row", justifyContent: "space-between" },
  imageContainer: { width: "48%" },
  proofImage: { width: "100%", height: 200, borderRadius: 16 },
  imageLabel: { textAlign: "center", marginTop: 8, color: "#27ae60", fontWeight: "600" },
  fullImageContainer: { alignItems: "center", marginVertical: 16 },
  fullImage: { width: width - 32, height: 300, borderRadius: 16 },
  farmGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  farmImage: { width: (width - 48) / 2, height: 160, borderRadius: 16, marginBottom: 12 },
  actionBigContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 30 },
  rejectBigBtn: { flex: 1, backgroundColor: "#e74c3c", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, borderRadius: 30, marginRight: 10 },
  approveBigBtn: { flex: 1, backgroundColor: "#27ae60", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, borderRadius: 30, marginLeft: 10 },
  bigBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 12 },
    processedContainer: { 
    alignItems: "center", 
    marginVertical: 30 
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
  },
  approvedBanner: {
    backgroundColor: "#27ae60",
  },
  rejectedBanner: {
    backgroundColor: "#e74c3c",
  },
  statusBannerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
  processedTime: {
    marginTop: 12,
    fontSize: 15,
    color: "#7f8c8d",
  },
});