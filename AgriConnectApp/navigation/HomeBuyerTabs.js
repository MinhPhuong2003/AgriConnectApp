import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import ChatScreen from "../screens/ChatScreen";
import HomeBuyer from "../screens/Buyer/HomeBuyer";
import BuyerPreOrderScreen from "../screens/Buyer/BuyerPreOrderScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import BuyerProfileScreen from "../screens/Buyer/BuyerProfileScreen";

const Tab = createBottomTabNavigator();

const HomeBuyerTabs = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = firestore()
      .collection("notifications")
      .where("userId", "==", user.uid)
      .where("read", "==", false)
      .onSnapshot((snap) => {
        setUnreadCount(snap.size);
      });

    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "#777",
        tabBarIcon: ({ color, size }) => {
          let iconName = "";

          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Preorder") iconName = "calendar-outline";
          else if (route.name === "Chat") iconName = "chatbubble-ellipses-outline";
          else if (route.name === "Notification") iconName = "notifications-outline";
          else if (route.name === "Profile") iconName = "person-outline";

          if (route.name === "Notification" && unreadCount > 0) {
            return (
              <View>
                <Icon name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              </View>
            );
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeBuyer} options={{ title: "Trang chủ" }} />
      <Tab.Screen name="Preorder" component={BuyerPreOrderScreen} options={{ title: "Đặt trước" }} />
      {/* Chat với người mua */}
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Trò chuyện" }}
      />
      <Tab.Screen name="Notification" component={NotificationsScreen} options={{ title: "Thông báo" }} />
      <Tab.Screen name="Profile" component={BuyerProfileScreen} options={{ title: "Tôi" }} />
    </Tab.Navigator>
  );
};

export default HomeBuyerTabs;

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    includeFontPadding: false,
  },
});