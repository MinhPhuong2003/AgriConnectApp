import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const VerifyFarmerScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [processedFarmers, setProcessedFarmers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFarmers = async () => {
    try {
      const pendingSnapshot = await firestore()
        .collection("users")
        .where("role", "==", "farmer")
        .where("verificationStatus", "==", "pending")
        .orderBy("verificationSubmittedAt", "desc")
        .get();

      const processedSnapshot = await firestore()
        .collection("users")
        .where("role", "==", "farmer")
        .where("verificationStatus", "in", ["approved", "rejected"])
        .orderBy("verifiedAt", "desc")
        .orderBy("rejectedAt", "desc")
        .get();

      setPendingFarmers(pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProcessedFarmers(processedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách nông dân");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFarmers();
  };

  const updateStatus = async (id, status) => {
    try {
      await firestore().collection("users").doc(id).update({
        verificationStatus: status,
        verifiedAt: status === "approved" ? firestore.FieldValue.serverTimestamp() : null,
        rejectedAt: status === "rejected" ? firestore.FieldValue.serverTimestamp() : null,
        approvedBy: auth().currentUser?.uid,
      });
      Alert.alert("Thành công!", status === "approved" ? "Đã duyệt nông dân" : "Đã từ chối");
      fetchFarmers();
    } catch (e) {
      Alert.alert("Lỗi", "Cập nhật thất bại");
    }
  };

  const farmersToShow = activeTab === "pending" ? pendingFarmers : processedFarmers;

  // Hàm định dạng thời gian đẹp (ngày + giờ phút giây)
  const formatDateTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    return timestamp.toDate().toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>XÉT DUYỆT NÔNG DÂN</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>
            Chờ duyệt ({pendingFarmers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "processed" && styles.activeTab]}
          onPress={() => setActiveTab("processed")}
        >
          <Text style={[styles.tabText, activeTab === "processed" && styles.activeTabText]}>
            Đã xử lý ({processedFarmers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#27ae60"]} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {farmersToShow.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="leaf-outline" size={90} color="#27ae60" />
            <Text style={styles.emptyText}>
              {activeTab === "pending"
                ? "Không có hồ sơ chờ duyệt"
                : "Chưa có hồ sơ nào được xử lý"}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {farmersToShow.map((farmer) => (
              <TouchableOpacity
                key={farmer.id}
                style={styles.farmerCard}
                onPress={() => navigation.navigate("VerifyFarmerDetail", { farmer })}
              >
                {/* Avatar */}
                {farmer.photoBase64 ? (
                  <Image source={{ uri: farmer.photoBase64 }} style={styles.farmerAvatar} />
                ) : farmer.photoURL ? (
                  <Image source={{ uri: farmer.photoURL }} style={styles.farmerAvatar} />
                ) : (
                  <View style={[styles.farmerAvatar, { backgroundColor: "#d5f5e3" }]}>
                    <Text style={styles.avatarLetter}>
                      {farmer.name?.charAt(0).toUpperCase() || "N"}
                    </Text>
                  </View>
                )}

                <View style={styles.infoContainer}>
                  <Text style={styles.farmerName}>{farmer.name || "Chưa có tên"}</Text>
                  <Text style={styles.farmerPhone}>ĐT: {farmer.phone || "Chưa có SĐT"}</Text>
                  <Text style={styles.farmerAddress} numberOfLines={2}>
                    Địa chỉ: {farmer.address || "Chưa cập nhật"}
                  </Text>
                  <Text style={styles.submitTime}>
                    Gửi: {formatDateTime(farmer.verificationSubmittedAt)}
                  </Text>

                  {/* Trạng thái đã xử lý - HIỂN THỊ GIỜ PHÚT GIÂY */}
                  {activeTab === "processed" && (
                    <View style={styles.statusBadge}>
                      <Text style={[
                        styles.statusText,
                        farmer.verificationStatus === "approved" ? styles.approvedText : styles.rejectedText
                      ]}>
                        {farmer.verificationStatus === "approved" ? "Đã duyệt" : "Đã từ chối"}
                      </Text>
                      {(farmer.verifiedAt || farmer.rejectedAt) && (
                        <Text style={styles.processedTime}>
                          Lúc: {formatDateTime(farmer.verifiedAt || farmer.rejectedAt)}
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Nút duyệt / từ chối */}
                {activeTab === "pending" && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        updateStatus(farmer.id, "rejected");
                      }}
                    >
                      <Text style={styles.rejectText}>Từ chối</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        updateStatus(farmer.id, "approved");
                      }}
                    >
                      <Text style={styles.approveText}>Duyệt</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default VerifyFarmerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fff8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#27ae60",
    elevation: 8,
    paddingTop: 40,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  activeTab: { backgroundColor: "#27ae60" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#7f8c8d" },
  activeTabText: { color: "#fff", fontWeight: "bold" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 20, fontWeight: "600", color: "#27ae60", marginTop: 20 },
  listContainer: { padding: 16 },
  farmerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  farmerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 28, fontWeight: "bold", color: "#27ae60" },
  infoContainer: { flex: 1, marginLeft: 16 },
  farmerName: { fontSize: 18, fontWeight: "bold", color: "#2c3e50" },
  farmerPhone: { fontSize: 15, color: "#27ae60", marginTop: 4 },
  farmerAddress: { fontSize: 14, color: "#7f8c8d", marginTop: 4 },
  submitTime: { fontSize: 13, color: "#95a5a6", marginTop: 6 },
  statusBadge: { marginTop: 8 },
  statusText: { fontWeight: "bold", fontSize: 15 },
  approvedText: { color: "#27ae60" },
  rejectedText: { color: "#e74c3c" },
  processedTime: { fontSize: 13, color: "#27ae60", marginTop: 4, fontWeight: "bold" },
  actionButtons: { alignItems: "center" },
  approveBtn: { backgroundColor: "#d5f5e3", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  approveText: { color: "#27ae60", fontWeight: "bold" },
  rejectBtn: { backgroundColor: "#fadbd8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  rejectText: { color: "#e74c3c", fontWeight: "bold" },
});