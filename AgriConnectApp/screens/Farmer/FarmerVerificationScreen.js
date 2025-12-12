import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import ImageView from "react-native-image-viewing";

const { width } = Dimensions.get("window");

const FarmerVerificationScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    const unsubscribe = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot((doc) => {
        if (doc.exists) {
          setUserData(doc.data());
        }
        setLoading(false);
      });
    return () => unsubscribe && unsubscribe();
  }, []);

  const status = userData?.verificationStatus || "none";
  const hasSubmitted = userData?.verificationSubmittedAt;

  const avatarUri =
    userData?.photoBase64 ||
    userData?.photoURL ||
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  const imagesForViewer = [
    ...(userData?.idCardFront ? [{ uri: userData.idCardFront }] : []),
    ...(userData?.idCardBack ? [{ uri: userData.idCardBack }] : []),
    ...(userData?.certificationImage ? [{ uri: userData.certificationImage }] : []),
    ...(userData?.farmImages?.map(img => ({ uri: img })) || []),
  ];

  const openImageViewer = (index) => {
    setImageViewerIndex(index);
    setImageViewerVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>XÁC THỰC NÔNG DÂN</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Khung thông tin */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRow}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <View style={styles.nameAndStatus}>
              <Text style={styles.farmerName}>
                {userData?.name || userData?.fullName || "Chưa có tên"}
              </Text>
              <View style={styles.statusRow}>
                {status === "verified" || status === "approved" ? (
                  <Icon name="shield-checkmark" size={22} color="#27ae60" />
                ) : status === "pending" ? (
                  <Icon name="time-outline" size={22} color="#f39c12" />
                ) : (
                  <Icon name="shield-outline" size={22} color="#95a5a6" />
                )}
                <Text style={styles.statusText}>
                  {status === "verified" || status === "approved"
                    ? "ĐÃ XÁC THỰC"
                    : status === "pending"
                    ? "Đang chờ duyệt"
                    : "Chưa xác thực"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.phoneText}>
              <Icon name="call-outline" size={18} color="#27ae60" />{" "}
              {userData?.phone || "Chưa có số điện thoại"}
            </Text>
            <Text style={styles.addressText}>
              <Icon name="location-outline" size={18} color="#27ae60" />{" "}
              {userData?.address || userData?.farmAddress || "Chưa cập nhật địa chỉ"}
            </Text>
          </View>

          {(status === "verified" || status === "approved") && (
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.badgeText}>Nông dân chính chủ</Text>
            </View>
          )}
        </View>

        {/* 2 nút */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("AddProfile")}
          >
            <View style={styles.btnContent}>
              <View style={styles.iconWrapper}>
                <Icon name="add" size={30} color="#fff" />
              </View>
              <View>
                <Text style={styles.btnLabel}>Bổ sung / Cập nhật</Text>
                <Text style={styles.btnTitle}>Hồ sơ xác thực</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.btnContent}>
              <View style={[
                styles.iconWrapper,
                { backgroundColor: hasSubmitted ? "#27ae60" : "#bdc3c7" }
              ]}>
                <Icon name="eye" size={28} color="#fff" />
              </View>
              <View>
                <Text style={styles.btnLabel}>
                  {hasSubmitted ? "Đã gửi hồ sơ" : "Chưa gửi hồ sơ"}
                </Text>
                <Text style={styles.btnTitle}>Xem chi tiết</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL CHI TIẾT – ĐẸP NHƯ ADMIN */}
      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>CHI TIẾT HỒ SƠ</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {!hasSubmitted ? (
              <View style={styles.emptyState}>
                <Icon name="document-outline" size={90} color="#95a5a6" />
                <Text style={styles.emptyTitle}>Chưa gửi hồ sơ</Text>
                <Text style={styles.emptyDesc}>Bạn chưa bổ sung hồ sơ xác thực nào.</Text>
              </View>
            ) : (
              <>
                {/* CMND/CCCD */}
                {(userData.idCardFront || userData.idCardBack) && (
                  <>
                    <Text style={styles.sectionTitle}>CMND / CCCD</Text>
                    <View style={styles.imageRow}>
                      {userData.idCardFront && (
                        <TouchableOpacity onPress={() => openImageViewer(0)} style={styles.imageContainer}>
                          <Image source={{ uri: userData.idCardFront }} style={styles.proofImage} resizeMode="cover" />
                          <Text style={styles.imageLabel}>Mặt trước</Text>
                        </TouchableOpacity>
                      )}
                      {userData.idCardBack && (
                        <TouchableOpacity onPress={() => openImageViewer(userData.idCardFront ? 1 : 0)} style={styles.imageContainer}>
                          <Image source={{ uri: userData.idCardBack }} style={styles.proofImage} resizeMode="cover" />
                          <Text style={styles.imageLabel}>Mặt sau</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}

                {/* Giấy chứng nhận */}
                {userData.certificationImage && (
                  <>
                    <Text style={styles.sectionTitle}>Giấy chứng nhận hữu cơ / VietGAP</Text>
                    <TouchableOpacity
                      onPress={() => openImageViewer((userData.idCardFront ? 1 : 0) + (userData.idCardBack ? 1 : 0))}
                      style={styles.fullImageContainer}
                    >
                      <Image source={{ uri: userData.certificationImage }} style={styles.fullImage} resizeMode="contain" />
                    </TouchableOpacity>
                  </>
                )}

                {/* Ảnh vườn */}
                {userData.farmImages?.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Ảnh vườn / trang trại ({userData.farmImages.length}/4)</Text>
                    <View style={styles.farmGrid}>
                      {userData.farmImages.map((img, index) => {
                        const idx = (userData.idCardFront ? 1 : 0) + (userData.idCardBack ? 1 : 0) + (userData.certificationImage ? 1 : 0) + index;
                        return (
                          <TouchableOpacity key={index} onPress={() => openImageViewer(idx)}>
                            <Image source={{ uri: img }} style={styles.farmImage} resizeMode="cover" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Thời gian */}
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    Gửi lúc: {userData.verificationSubmittedAt?.toDate()?.toLocaleString("vi-VN") || "N/A"}
                  </Text>
                  {(status === "verified" || status === "approved") && userData.verificationApprovedAt && (
                    <Text style={styles.timeTextApproved}>
                      Duyệt lúc: {userData.verificationApprovedAt.toDate().toLocaleString("vi-VN")}
                    </Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Full ảnh viewer */}
      <ImageView
        images={imagesForViewer}
        imageIndex={imageViewerIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fff8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#2e7d32",
    paddingTop: 40,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  content: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fff8" },

  // Khung chính
  heroCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginBottom: 24,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#27ae60", marginRight: 16 },
  nameAndStatus: { flex: 1 },
  farmerName: { fontSize: 22, fontWeight: "bold", color: "#2c3e50" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  statusText: { fontSize: 15, fontWeight: "600", color: "#27ae60", marginLeft: 6 },

  infoSection: { marginTop: 8 },
  phoneText: { fontSize: 16, color: "#2c3e50", marginBottom: 6 },
  addressText: { fontSize: 16, color: "#2c3e50", lineHeight: 22 },

  verifiedBadge: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#27ae60",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    marginTop: 16,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 15, fontWeight: "bold", marginLeft: 8 },

  actionButtons: { marginBottom: 30 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 8,
    backgroundColor: "#27ae60",
  },
  btnContent: { flexDirection: "row", alignItems: "center" },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  btnLabel: { color: "#fff", fontSize: 14, opacity: 0.9 },
  btnTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // MODAL – ĐẸP NHƯ ADMIN
  modalContainer: { flex: 1, backgroundColor: "#f8fff8" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#27ae60",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  modalScroll: { padding: 16 },

  emptyState: { alignItems: "center", marginTop: 80 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", color: "#34495e", marginTop: 20 },
  emptyDesc: { fontSize: 16, color: "#7f8c8d", textAlign: "center", marginTop: 10 },

  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2c3e50", marginTop: 24, marginBottom: 12 },
  imageRow: { flexDirection: "row", justifyContent: "space-between" },
  imageContainer: { width: "48%" },
  proofImage: { width: "100%", height: 200, borderRadius: 16 },
  imageLabel: { textAlign: "center", marginTop: 8, color: "#27ae60", fontWeight: "600" },
  fullImageContainer: { alignItems: "center", marginVertical: 16 },
  fullImage: { width: width - 32, height: 300, borderRadius: 16 },
  farmGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  farmImage: { width: (width - 48) / 2, height: 160, borderRadius: 16, marginBottom: 12 },

  timeInfo: { marginTop: 30, alignItems: "center" },
  timeText: { fontSize: 15, color: "#7f8c8d" },
  timeTextApproved: { fontSize: 16, color: "#27ae60", fontWeight: "bold", marginTop: 8 },
});

export default FarmerVerificationScreen;